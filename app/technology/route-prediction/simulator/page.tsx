import type { Metadata } from "next";
import { RPASimulatorV3 } from "@/components/RPASimulatorV3";
import { RPAProductionPanelV3 } from "@/components/RPAProductionPanelV3";

export const metadata: Metadata = {
  title: "Route prediction simulator",
  description: "Interactive LAPENZER RPA v3 route-prediction simulator and production evidence layer.",
};

export default function RoutePredictionSimulatorPage() {
  return (
    <>
      <RPASimulatorV3 />
      <RPAProductionPanelV3 />
    </>
  );
}
