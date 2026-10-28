import type { MetadataRoute } from "next";
export const dynamic = "force-static";
import { research } from "@/lib/research";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "/rpa",
    "/technology",
    "/technology/route-prediction",
    "/technology/route-prediction/simulator",
    "/technology/network-influence",
    "/technology/conflict-simulation",
    "/models",
    "/models/uzuske",
    "/models/local",
    "/research",
    ...research.map((p) => `/research/${p.slug}`),
    "/company",
    "/contact",
    "/contact/sales",
    "/developers",
    "/developers/docs",
    "/developers/local",
    "/developers/api",
    "/developers/examples",
    "/capabilities",
    "/capabilities/predictive-systems",
    "/capabilities/applied-ai",
    "/capabilities/data-systems",
    "/capabilities/simulation",
    "/capabilities/model-infrastructure",
  ].map((path) => ({
    url: `https://lapenzer.com${path}`,
    lastModified: "2026-10-28",
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : path === "/rpa" ? 0.9 : 0.7,
  }));
}
