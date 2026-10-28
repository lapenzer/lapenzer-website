import type { Metadata } from "next";
import Link from "next/link";
import { RPASimulator } from "@/components/RPASimulator";

export const metadata: Metadata = {
  title: "RPA simulator",
  description: "Interactive synthetic simulation of LAPENZER's multi-domain Route Prediction Algorithm architecture: candidate generation, selection, uncertainty, and adaptive feedback.",
};

export default function RPASimulatorPage() {
  return (
    <>
      <RPASimulator />
      <div style={{ width: "min(1500px, calc(100% - 32px))", margin: "-64px auto 80px" }}>
        <Link className="text-link" href="/technology/route-prediction">← Back to route prediction research</Link>
      </div>
    </>
  );
}
