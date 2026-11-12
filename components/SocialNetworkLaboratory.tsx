import Link from "next/link";
import styles from "./SocialNetworkLaboratory.module.css";

export function SocialNetworkLaboratory() {
  return (
    <section id="social-network-lab" className={styles.laboratory} aria-labelledby="social-lab-heading">
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}><span /> LAPENZER / INTERACTIVE RESEARCH</p>
          <h1 id="social-lab-heading">Individual behaviour.<br /><span>Collective consequences.</span></h1>
          <p className={styles.description}>Build a population, shape its network, and observe how relationships and opinions evolve. Run repeatable experiments and inspect the evidence.</p>
        </div>
        <div className={styles.actions}>
          <Link className={styles.launch} href="/social-lab/index.html">Open full-screen laboratory <span aria-hidden="true">↗</span></Link>
          <p>No account required. Simulation data stays on your device.</p>
        </div>
      </div>
      <div className={styles.frame}>
        <iframe src="/social-lab/index.html" title="LAPENZER Social Network Laboratory" loading="eager" allowFullScreen referrerPolicy="same-origin" />
      </div>
      <div className={styles.notes}>
        <span><i /> WORKING SIMULATION / 1.0</span>
        <p>Fictional agents. Configurable assumptions. Reproducible statistical runs.</p>
        <Link href="/social-lab/lapenzer-social-lab-source.zip" download>Source & methodology ↓</Link>
      </div>
    </section>
  );
}
