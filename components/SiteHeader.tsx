import Link from "next/link";

const navigation = [
  ["Projects", "/projects"],
  ["Research", "/research"],
  ["Capabilities", "/capabilities"],
  ["About", "/about"],
  ["Contact", "/contact"],
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell nav-shell">
        <Link href="/" className="wordmark" aria-label="Lapenzer home">
          LAPENZER
        </Link>
        <nav aria-label="Primary navigation" className="nav-links">
          {navigation.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
