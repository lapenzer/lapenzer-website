import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <div className="wordmark">LAPENZER</div>
          <p className="footer-note">Software, research, mathematical models, and technical systems.</p>
        </div>
        <div className="footer-links" aria-label="Footer navigation">
          <Link href="/projects">Projects</Link>
          <Link href="/research">Research</Link>
          <Link href="/capabilities">Capabilities</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <p className="copyright">© 2026 Lapenzer</p>
      </div>
    </footer>
  );
}
