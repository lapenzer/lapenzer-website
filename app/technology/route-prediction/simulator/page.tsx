import type { Metadata } from "next";
import { RPALabV4 } from "@/components/RPALabV4";

export const metadata: Metadata = { title: "RPA Simulator", description: "LAPENZER full route-prediction laboratory and simulator." };
export default function RoutePredictionSimulatorPage() { return <RPALabV4 />; }
