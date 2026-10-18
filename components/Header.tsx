"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function Header() {
  const [scrolled,setScrolled] = useState(false);
  const path = usePathname();
  const light = path !== "/";
  useEffect(()=>{ const on=()=>setScrolled(window.scrollY>30); on(); window.addEventListener("scroll",on,{passive:true}); return()=>window.removeEventListener("scroll",on);},[]);
  return <header className={`site-nav ${scrolled?"scrolled":""} ${light?"light":""}`}>
    <div className="shell nav-inner">
      <Link href="/" className="wordmark" aria-label="Lapenzer home" style={{display:"inline-flex",alignItems:"center",gap:10,width:"fit-content"}}>
        <img src="/lapenzer-logo.svg" alt="" aria-hidden="true" width="36" height="32" style={{display:"block",width:36,height:32,objectFit:"contain",borderRadius:2}}/>
        <span>LAPENZER</span>
      </Link>
      <nav className="nav-links" aria-label="Primary">
        <Link href="/capabilities">Capabilities</Link><Link href="/models">Models</Link><Link href="/research">Research</Link><Link href="/company">Company</Link><Link href="/developers/docs">Developers</Link>
      </nav>
      <div className="nav-right"><Link className="nav-cta" href="/contact/sales">Talk to Sales</Link></div>
    </div>
  </header>
}
