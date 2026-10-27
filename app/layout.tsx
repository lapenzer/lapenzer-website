import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
export const metadata: Metadata = { metadataBase: new URL("https://lapenzer.com"), title: { default: "LAPENZER | Route prediction and network simulation", template: "%s | LAPENZER" }, description: "Python route prediction software and mathematical research on network influence and geographic state-transition simulation.", openGraph: { title: "LAPENZER", description: "Route prediction software and mathematical models of network influence and geographic state transitions.", url: "https://lapenzer.com", siteName: "LAPENZER", type: "website" }, twitter: { card: "summary_large_image", title: "LAPENZER", description: "Route prediction software and mathematical models of network influence and geographic state transitions." } };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a><Header /><main id="main">{children}</main><Footer /></body></html>; }
