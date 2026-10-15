import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://lapenzer.com"),
  title: {
    default: "Lapenzer — Software, Research, Mathematical Models, Technical Systems",
    template: "%s — Lapenzer",
  },
  description:
    "Lapenzer develops software and research projects for prediction, forecasting, simulation, networks, data, and complex systems.",
  applicationName: "Lapenzer",
  keywords: [
    "Lapenzer",
    "mathematical modelling",
    "forecasting",
    "simulation",
    "network analysis",
    "software research",
    "data analysis",
  ],
  authors: [{ name: "Lapenzer" }],
  creator: "Lapenzer",
  publisher: "Lapenzer",
  openGraph: {
    title: "Lapenzer",
    description: "Software, research, mathematical models, and technical systems.",
    url: "https://lapenzer.com",
    siteName: "Lapenzer",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Lapenzer",
    description: "Software, research, mathematical models, and technical systems.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
