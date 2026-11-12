import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
export const metadata: Metadata = { metadataBase: new URL("https://lapenzer.com"), title: { default: "LAPENZER | Social Network Laboratory & Network Simulation", template: "%s | LAPENZER" }, description: "Interactive social network simulation, reproducible agent experiments, route prediction software and network research.", openGraph: { title: "LAPENZER", description: "Explore the LAPENZER Social Network Laboratory, route prediction software and mathematical network research.", url: "https://lapenzer.com", siteName: "LAPENZER", type: "website" }, twitter: { card: "summary_large_image", title: "LAPENZER", description: "Mathematical software, network models, simulation research and AI interoperability systems." } };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a><Header /><main id="main">{children}</main><Footer /></body></html>; }
