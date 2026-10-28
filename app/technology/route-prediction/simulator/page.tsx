import type { Metadata } from "next";
import Link from "next/link";
import { RPASimulatorV3 } from "@/components/RPASimulatorV3";
import { RPAProductionPanelV3 } from "@/components/RPAProductionPanelV3";

export const metadata: Metadata = {
  title: "RPA v3 simulator",
  description: "Specification-aligned Route Prediction Algorithm v3 simulation with backed-off transition statistics, Bayesian destination inference, calibrated listwise ranking, beam forecasting, live telemetry and evidence-gated validation.",
};

export default function RPASimulatorPage() {
  return (
    <>
      <RPASimulatorV3 />
      <RPAProductionPanelV3 />
      <div style={{ width: "min(1500px, calc(100% - 32px))", margin: "32px auto 80px" }}>
        <Link className="text-link" href="/technology/route-prediction">← Back to route prediction research</Link>
      </div>
    </>
  );
}
