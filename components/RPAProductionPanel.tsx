"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./RPAProductionPanel.module.css";

type Telemetry = {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
  samples: number;
};

type Evaluation = {
  liveSessions: number;
  correct: number;
  brierTotal: number;
};

type StoredState = {
  weights: number[];
  trainedExamples: number;
  evaluation: Evaluation;
};

const STORAGE_KEY = "lapenzer-rpa-production-mode-v1";
const FEATURE_NAMES = [
  "resistance",
  "transition history",
  "destination progress",
  "route simplicity",
  "context fit",
];
const INITIAL_WEIGHTS = [1.35, 1.0, 0.82, 0.55, 0.72];
const TRAINING_SET = [
  { x: [0.92, 0.85, 0.91, 0.82, 0.88], y: 1 },
  { x: [0.70, 0.91, 0.86, 0.73, 0.79], y: 1 },
  { x: [0.81, 0.74, 0.89, 0.88, 0.84], y: 1 },
  { x: [0.43, 0.30, 0.62, 0.45, 0.35], y: 0 },
  { x: [0.52, 0.47, 0.38, 0.57, 0.42], y: 0 },
  { x: [0.29, 0.62, 0.44, 0.35, 0.31], y: 0 },
  { x: [0.88, 0.69, 0.83, 0.78, 0.90], y: 1 },
  { x: [0.46, 0.41, 0.57, 0.38, 0.49], y: 0 },
];

function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-value));
}

function dot(a: number[], b: number[]) {
  return a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0);
}

function loadState(): StoredState {
  if (typeof window === "undefined") {
    return { weights: INITIAL_WEIGHTS, trainedExamples: 0, evaluation: { liveSessions: 0, correct: 0, brierTotal: 0 } };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("empty");
    const parsed = JSON.parse(raw) as StoredState;
    if (!Array.isArray(parsed.weights) || parsed.weights.length !== INITIAL_WEIGHTS.length) throw new Error("invalid");
    return parsed;
  } catch {
    return { weights: INITIAL_WEIGHTS, trainedExamples: 0, evaluation: { liveSessions: 0, correct: 0, brierTotal: 0 } };
  }
}

export function RPAProductionPanel() {
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<"off" | "requesting" | "live" | "error">("off");
  const [trackingError, setTrackingError] = useState("");
  const [weights, setWeights] = useState(INITIAL_WEIGHTS);
  const [trainedExamples, setTrainedExamples] = useState(0);
  const [evaluation, setEvaluation] = useState<Evaluation>({ liveSessions: 0, correct: 0, brierTotal: 0 });
  const [currentFeatures, setCurrentFeatures] = useState([0.82, 0.78, 0.88, 0.76, 0.80]);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    const stored = loadState();
    setWeights(stored.weights);
    setTrainedExamples(stored.trainedExamples);
    setEvaluation(stored.evaluation);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ weights, trainedExamples, evaluation }));
  }, [weights, trainedExamples, evaluation]);

  useEffect(() => () => {
    if (watchId.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
    }
  }, []);

  const selectorProbability = useMemo(() => sigmoid(dot(weights, currentFeatures) - 2.05), [weights, currentFeatures]);
  const measuredAccuracy = evaluation.liveSessions > 0 ? evaluation.correct / evaluation.liveSessions : null;
  const brier = evaluation.liveSessions > 0 ? evaluation.brierTotal / evaluation.liveSessions : null;

  const startTracking = () => {
    if (!navigator.geolocation) {
      setTrackingStatus("error");
      setTrackingError("This browser does not expose the Geolocation API.");
      return;
    }
    setTrackingStatus("requesting");
    setTrackingError("");
    let samples = telemetry?.samples ?? 0;
    watchId.current = navigator.geolocation.watchPosition(
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
        setTrackingStatus("live");
      },
      (error) => {
        setTrackingStatus("error");
        setTrackingError(error.message || "Location permission was denied or unavailable.");
      },
      { enableHighAccuracy: true, maximumAge: 1500, timeout: 12000 },
    );
  };

  const stopTracking = () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
    setTrackingStatus("off");
  };

  const trainSelector = () => {
    const next = [...weights];
    const learningRate = 0.13;
    for (let epoch = 0; epoch < 120; epoch += 1) {
      for (const example of TRAINING_SET) {
        const prediction = sigmoid(dot(next, example.x) - 2.05);
        const error = example.y - prediction;
        example.x.forEach((value, index) => {
          next[index] += learningRate * error * value;
        });
      }
    }
    setWeights(next);
    setTrainedExamples((value) => value + TRAINING_SET.length * 120);
  };

  const adaptFromOutcome = (correct: boolean) => {
    const target = correct ? 1 : 0;
    const prediction = selectorProbability;
    const error = target - prediction;
    const rate = 0.08;
    setWeights((current) => current.map((weight, index) => weight + rate * error * currentFeatures[index]));
    setTrainedExamples((value) => value + 1);
    if (trackingStatus === "live" && telemetry) {
      setEvaluation((current) => ({
        liveSessions: current.liveSessions + 1,
        correct: current.correct + (correct ? 1 : 0),
        brierTotal: current.brierTotal + Math.pow(prediction - target, 2),
      }));
    }
  };

  const resetProductionData = () => {
    setWeights(INITIAL_WEIGHTS);
    setTrainedExamples(0);
    setEvaluation({ liveSessions: 0, correct: 0, brierTotal: 0 });
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <section className={styles.shell} aria-labelledby="production-mode-heading">
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>Production-mode extensions</p>
          <h2 id="production-mode-heading">Live tracking, trained selection, measured accuracy.</h2>
          <p>
            The synthetic network above remains the controlled RPA demonstration. This section adds browser telemetry,
            a trainable selector, and evaluation bookkeeping for confirmed live sessions.
          </p>
        </div>
        <div className={styles.badge}>Local-first · permission based</div>
      </div>

      <div className={styles.grid}>
        <article className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <span className={styles.step}>01</span>
              <h3>Live tracking</h3>
            </div>
            <span className={`${styles.status} ${styles[trackingStatus]}`}>{trackingStatus}</span>
          </div>
          <p>Uses the browser Geolocation API after explicit permission. Coordinates remain in this browser session; this page does not upload them to LAPENZER.</p>
          <div className={styles.actions}>
            {trackingStatus !== "live" ? <button type="button" onClick={startTracking}>Start live tracking</button> : <button type="button" onClick={stopTracking}>Stop tracking</button>}
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
          ) : <div className={styles.placeholder}>{trackingError || "No live telemetry received yet."}</div>}
        </article>

        <article className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <span className={styles.step}>02</span>
              <h3>Trained selector</h3>
            </div>
            <span className={styles.status}>{trainedExamples.toLocaleString()} updates</span>
          </div>
          <p>The selector starts from declared weights, can be trained on bundled labelled scenarios, and continues adapting when a user confirms whether the selected route was correct.</p>
          <div className={styles.probability}>
            <span>Current selector probability</span>
            <strong>{(selectorProbability * 100).toFixed(1)}%</strong>
          </div>
          <div className={styles.featureList}>
            {FEATURE_NAMES.map((name, index) => (
              <label key={name}>
                <span>{name}</span>
                <input type="range" min="0" max="1" step="0.01" value={currentFeatures[index]} onChange={(event) => setCurrentFeatures((current) => current.map((value, i) => i === index ? Number(event.target.value) : value))} />
                <strong>{currentFeatures[index].toFixed(2)}</strong>
              </label>
            ))}
          </div>
          <div className={styles.actions}>
            <button type="button" onClick={trainSelector}>Train bundled model</button>
            <button type="button" className={styles.secondary} onClick={() => adaptFromOutcome(true)}>Confirm correct</button>
            <button type="button" className={styles.secondary} onClick={() => adaptFromOutcome(false)}>Confirm incorrect</button>
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHead}>
            <div>
              <span className={styles.step}>03</span>
              <h3>Real-world accuracy</h3>
            </div>
            <span className={styles.status}>{evaluation.liveSessions} live evaluations</span>
          </div>
          <p>Accuracy is calculated only from user-confirmed outcomes recorded while live tracking is active. No percentage is shown until real live-session evidence exists.</p>
          <div className={styles.metrics}>
            <div>
              <span>Measured Top-1 accuracy</span>
              <strong>{measuredAccuracy === null ? "Not established" : `${(measuredAccuracy * 100).toFixed(1)}%`}</strong>
            </div>
            <div>
              <span>Mean Brier score</span>
              <strong>{brier === null ? "Not established" : brier.toFixed(3)}</strong>
            </div>
            <div>
              <span>Evidence sample</span>
              <strong>n = {evaluation.liveSessions}</strong>
            </div>
          </div>
          <p className={styles.claim}>
            <strong>Accuracy claim:</strong> {measuredAccuracy === null
              ? "No real-world accuracy claim is currently supported. Complete confirmed live evaluations to establish one."
              : `Across ${evaluation.liveSessions} confirmed live evaluation${evaluation.liveSessions === 1 ? "" : "s"} stored in this browser, measured Top-1 accuracy is ${(measuredAccuracy * 100).toFixed(1)}%. This is a session-level result, not a general deployment guarantee.`}
          </p>
          <button type="button" className={styles.reset} onClick={resetProductionData}>Reset trained weights and evaluation data</button>
        </article>
      </div>
    </section>
  );
}
