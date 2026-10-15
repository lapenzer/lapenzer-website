import Link from "next/link";
export function Footer(){return <footer className="footer"><div className="shell"><div className="footer-brand">LAPENZER</div><div className="footer-grid">
<div><p style={{maxWidth:360,color:"#8a929b",lineHeight:1.6}}>Models, software, and infrastructure for prediction, analysis, and complex data.</p></div>
<div className="footer-col"><h4>Company</h4><Link href="/company">About</Link><Link href="/research">Research</Link><Link href="/contact/sales">Contact</Link></div>
<div className="footer-col"><h4>Product</h4><Link href="/models">Models</Link><Link href="/capabilities">Capabilities</Link><Link href="/developers/docs">Developers</Link><Link href="/models/local">Local</Link></div>
<div className="footer-col"><h4>Resources</h4><Link href="/developers/docs">Documentation</Link><Link href="/research">Research</Link><a href="https://github.com/lapenzer" target="_blank" rel="noreferrer">GitHub</a></div>
<div className="footer-col"><h4>Legal</h4><span style={{display:"block",padding:"5px 0",color:"#707780",fontSize:13}}>Privacy</span><span style={{display:"block",padding:"5px 0",color:"#707780",fontSize:13}}>Terms</span></div>
</div><div className="footer-bottom"><span>© Lapenzer</span><span>Canada</span></div></div></footer>}
