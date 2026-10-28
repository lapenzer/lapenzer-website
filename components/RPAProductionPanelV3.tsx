"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./RPAProductionPanel.module.css";
import { SYNTHETIC_GRAPH, generateSyntheticTrajectories, makeDomainAdapter, trainRpaModel } from "@/lib/rpaV3";

type Telemetry = {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
  samples: number;
};

type LiveAudit = {
  sessions: number;
  linkedOutcomes: number;
  correct: number;
};

export function RPAProductionPanelV3() {
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [status, setStatus] = useState<"off" | "requesting" | "live" | "error">("off");
  const [error, setError] = useState("");
  const [audit, setAudit] = useState<LiveAudit>({ sessions: 0, linkedOutcomes: 0, correct: 0 });
  const watch = useRef<number | null>(null);
  const candidate = useMemo(
    () => trainRpaModel(SYNTHETIC_GRAPH, generateSyntheticTrajectories(360, 7), ["G", "H", "I"], makeDomainAdapter("road")),
    [],
  );

  useEffect(
    () => () => {
      if (watch.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(watch.current);
    },
    [],
  );

  const start = () => {
    if (!navigator.geolocation) {
      setStatus("error");
      setError("Geolocation is unavailable in this browser.");
      return;
    }
    setStatus("requesting");
    setError("");
    let samples = telemetry?.samples ?? 0;
    watch.current = navigator.geolocation.watchPosition(
      (position) => {
        samples += 1;
        setTelemetry({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
          timestamp: position.timestamp,
          samples,
        });
        setStatus("live");
      },
      (geoError) => {
        setStatus("error");
        setError(geoError.message || "Location permission was denied or unavailable.");
      },
      { enableHighAccuracy: true, maximumAge: 1500, timeout: 12000 },
    );
  };

  const stop = () => {
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
    watch.current = null;
    setStatus("off");
    if (telemetry) setAudit((current) => ({ ...current, sessions: current.sessions + 1 }));
  };

  const realAccuracy = audit.linkedOutcomes > 0 ? audit.correct / audit.linkedOutcomes : null;
  const statusClass =
    status === "live"
      ? styles.live
      : status === "error"
        ? styles.error
        : status === "requesting"
          ? styles.requesting
          : styles.off;

  return (
    <section className={styles.shell} aria-labelledby="rpa-production-heading">
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>Production-mode layer</p>
          <h2 id="rpa-production-heading">Live source, trained candidate, real-world claim gate.</h2>
          <p>
            The simulator exposes all three, but keeps their evidence status separate. A synthetic benchmark cannot become a real-world accuracy claim by changing a label.
          </p>
        </div>
        <div className={styles.badge}>Human-controlled · evidence labelled</div>
      </div>

      <div className={styles.grid}>
        <article className={styles.card}>
          <div className={styles.cardHead}>
            <div><span className={styles.step}>01</span><h3>Live tracking</h3></div>
            <span className={`${styles.status} ${statusClass}`}>{status}</span>
          </div>
          <p>Permission-based browser geolocation. The page displays the current device telemetry locally. It does not silently substitute synthetic coordinates for live observations.</p>
          <div className={styles.actions}>
            {status !== "live" ? <button type="button" onClick={start}>Start live tracking</button> : <button type="button" onClick={stop}>Stop live tracking</button>}
          </div>
          {telemetry ? (
            <dl className={styles.telemetry}>
              <div><dt>Latitude</dt><dd>{telemetry.latitude.toFixed(6)}</dd></div>
              <div><dt>Longitude</dt><dd>{telemetry.longitude.toFixed(6)}</dd></div>
              <div><dt>Accuracy radius</dt><dd>±{Math.round(telemetry.accuracy)} m</dd></div>
              <div><dt>Samples</dt><dd>{telemetry.samples}</dd></div>
              <div><dt>Speed</dt><dd>{telemetry.speed == null ? "Unavailable" : `${telemetry.speed.toFixed(1)} m/s`}</dd></div>
              <div><dt>Heading</dt><dd>{telemetry.heading == null ? "Unavailable" : `${Math.round(telemetry.heading)}°`}</dd></div>
            </dl>
          ) : <div className={styles.placeholder}>{error || "No live telemetry received yet."}</div>}
        </article>

        <article className={styles.card}>
          <div className={styles.cardHead}>
            <div><span className={styles.step}>02</span><h3>Trained production candidate</h3></div>
            <span className={styles.status}>{candidate.mode}</span>
          </div>
          <p>The model candidate is trained with blocked forward chaining, validation-selected regularization, temperature calibration and a held-out test set. Its current evidence source is synthetic, so promotion to a real deployment remains gated.</p>
          <div className={styles.metrics}>
            <div><span>Training trajectories</span><strong>{candidate.trainingTrajectories}</strong></div>
            <div><span>Selected λ</span><strong>{candidate.ranker?.lambda ?? "—"}</strong></div>
            <div><span>Temperature</span><strong>{candidate.ranker?.temperature.toFixed(2) ?? "—"}</strong></div>
            <div><span>Synthetic held-out Top-1</span><strong>{candidate.test ? `${(candidate.test.top1 * 100).toFixed(1)}%` : "—"}</strong></div>
          </div>
          <p className={styles.claim}><strong>Promotion status:</strong> trained model candidate, not yet real-world validated. Live or imported validation must be temporally separated and must beat the incumbent under declared metrics before replacement.</p>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHead}>
            <div><span className={styles.step}>03</span><h3>Real-world accuracy claim</h3></div>
            <span className={styles.status}>{audit.linkedOutcomes} linked outcomes</span>
          </div>
          <p>A claim is shown only from outcomes linked to real predictions on a matching real graph or map. Browser GPS samples alone do not establish route-prediction accuracy.</p>
          <div className={styles.metrics}>
            <div><span>Measured real-world Top-1</span><strong>{realAccuracy == null ? "Not established" : `${(realAccuracy * 100).toFixed(1)}%`}</strong></div>
            <div><span>Live capture sessions</span><strong>{audit.sessions}</strong></div>
            <div><span>Scored linked outcomes</span><strong>{audit.linkedOutcomes}</strong></div>
            <div><span>Evidence requirement</span><strong>Held-out trajectories</strong></div>
          </div>
          <p className={styles.claim}>
            <strong>Accuracy claim:</strong> {realAccuracy == null
              ? "No real-world accuracy claim is currently supported. Connect a real graph or map, map-match live or imported trajectories, and score held-out outcomes before publishing a number."
              : `Measured Top-1 accuracy is ${(realAccuracy * 100).toFixed(1)}% across ${audit.linkedOutcomes} linked held-out outcomes in this session. This sample-specific result is not a general deployment guarantee.`}
          </p>
        </article>
      </div>
    </section>
  );
}
