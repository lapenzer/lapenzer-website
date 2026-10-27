import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
export const metadata: Metadata = { metadataBase: new URL("https://lapenzer.com"), title: { default: "LAPENZER | Movement, networks, and changing systems", template: "%s | LAPENZER" }, description: "Graph models, prediction software, and research tools for comparing possible outcomes as conditions change. Explore route prediction, network influence, and conflict-state simulation.", openGraph: { title: "LAPENZER", description: "Models for movement, networks, and changing systems.", url: "https://lapenzer.com", siteName: "LAPENZER", type: "website" }, twitter: { card: "summary_large_image", title: "LAPENZER", description: "Models for movement, networks, and changing systems." } };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a><Header /><main id="main">{children}</main><Footer /></body></html>; }
