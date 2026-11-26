"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
const links = [["Solutions", "/solutions"], ["Technology", "/technology"], ["Research", "/research"], ["Laboratory", "/laboratory"], ["Company", "/company"], ["Photography", "/photography"]];
export function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname(), menu = useRef<HTMLElement>(null), toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const before = document.body.style.overflow; document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); toggle.current?.focus(); }
      if (e.key === "Tab") {
        const elements = [toggle.current!, ...Array.from(menu.current!.querySelectorAll<HTMLElement>("a"))], index = elements.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && index <= 0) { e.preventDefault(); elements[elements.length - 1]?.focus(); }
        if (!e.shiftKey && index === elements.length - 1) { e.preventDefault(); elements[0].focus(); }
      }
    };
    window.addEventListener("keydown", key); return () => { document.body.style.overflow = before; window.removeEventListener("keydown", key); };
  }, [open]);
  return <header className="site-nav light"><div className="shell nav-inner"><Link href="/" className="wordmark" aria-label="LAPENZER home" onClick={() => setOpen(false)}><Image src="/lapenzer-logo.svg" alt="" width={32} height={28} unoptimized /><span>LAPENZER</span></Link><nav className="nav-links" aria-label="Primary">{links.map(([name, href]) => <Link key={href} href={href} aria-current={path.startsWith(href) ? "page" : undefined}>{name}</Link>)}</nav><Link className="nav-cta" href="/contact">Discuss a project <span aria-hidden="true">↗</span></Link><button className="menu-toggle" type="button" ref={toggle} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? "Close −" : "Menu ＋"}</button></div><nav ref={menu} id="mobile-navigation" className="mobile-navigation" aria-label="Mobile primary" hidden={!open}>{links.map(([name, href], i) => <Link key={href} href={href} onClick={() => setOpen(false)}><small>0{i + 1}</small>{name}<span aria-hidden="true">↗</span></Link>)}<Link href="/developers/docs" onClick={() => setOpen(false)}>Developer documentation ↗</Link></nav></header>;
}
