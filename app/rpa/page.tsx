import type { Metadata } from "next";
import { RPALabV4 } from "@/components/RPALabV4";

export const metadata: Metadata = {
  title: "RPA Route Prediction Laboratory",
  description: "Full LAPENZER Route Prediction Algorithm laboratory: unknown-destination inference, random and provider-derived graphs, map matching, candidate generation, calibrated learned ranking, neural selection, IRL, uncertainty, simulation, analytics and controlled feedback.",
};

export default function RpaPage() {
  return <RPALabV4 />;
}
