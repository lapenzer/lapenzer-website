import type { Metadata } from "next";
import { RPADashboard } from "@/components/RPADashboard";

export const metadata: Metadata = {
  title: "RPA Simulation Laboratory",
  description: "Run the LAPENZER mathematical route-prediction engine on a synthetic graph. Inspect trained model predictions, uncertainty and observed outcomes."
};

export default function RpaDashboardPage() { return <RPADashboard />; }
