import type { Metadata } from "next";
import Link from "next/link";
import { RPASimulatorV3 } from "@/components/RPASimulatorV3";
import { RPAProductionPanelV3 } from "@/components/RPAProductionPanelV3";

export const metadata: Metadata = {
  title: "RPA Route Prediction Laboratory",
  description:
    "Interactive LAPENZER Route Prediction Algorithm laboratory with unknown-destination inference, calibrated next-node ranking, beam forecasting, uncertainty and live telemetry controls.",
};

export default function RpaPage() {
  return (
    <>
      <RPASimulatorV3 />
      <RPAProductionPanelV3 />
      <section
        aria-labelledby="rpa-framework-heading"
        style={{
          width: "min(1180px, calc(100% - 32px))",
          margin: "0 auto 96px",
          padding: "32px",
          border: "1px solid rgba(255,255,255,.12)",
          borderRadius: "24px",
          background: "rgba(255,255,255,.025)",
        }}
      >
        <p style={{ margin: "0 0 8px", opacity: 0.66, letterSpacing: ".12em", textTransform: "uppercase", fontSize: 12 }}>
          Complete algorithm contract
        </p>
        <h2 id="rpa-framework-heading" style={{ marginTop: 0 }}>
          Observation → inference → candidates → ranking → uncertainty → feedback
        </h2>
        <p>
          The active trajectory is evaluated without access to its hidden destination or future states. The current implementation combines backed-off Markov transition statistics, sequential Bayesian destination inference, generalized resistance and context features, the documented 18-feature decision vector, conditional-logit candidate selection, temperature calibration, conformal prediction sets, path-size-corrected beam search, semi-Markov ETA simulation, forward-time evaluation and controlled post-run adaptation.
        </p>
        <p>
          Domain adapters expose road, open-terrain, marine and aircraft assumptions. Live browser geolocation is deliberately separated from synthetic benchmark claims. A real-map graph still requires a configured geographic graph provider before map-matched live trajectories can be scored as real-world route-prediction evidence.
        </p>
        <p style={{ marginBottom: 0 }}>
          <Link className="text-link" href="/technology/route-prediction">
            Read the route-prediction research and evidence →
          </Link>
        </p>
      </section>
    </>
  );
}
