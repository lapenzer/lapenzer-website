import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
export const metadata:Metadata={metadataBase:new URL('https://lapenzer.com'),title:{default:'Lapenzer — Models, software, and systems',template:'%s — Lapenzer'},description:'Lapenzer builds models, software, and infrastructure for prediction, analysis, simulation, and complex data.',openGraph:{title:'Lapenzer',description:'Models and software for prediction, analysis, and complex data.',url:'https://lapenzer.com',siteName:'Lapenzer',type:'website'},twitter:{card:'summary_large_image',title:'Lapenzer',description:'Models and software for prediction, analysis, and complex data.'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a><Header/><main id="main">{children}</main><Footer/></body></html>}
