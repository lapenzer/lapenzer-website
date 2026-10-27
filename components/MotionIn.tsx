"use client";
import { motion } from "framer-motion";
import { useMedia } from "@/lib/use-media";
export function MotionIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const reduced = useMedia("(prefers-reduced-motion: reduce)");
  return <motion.div className={className} initial={false} whileInView={reduced ? undefined : { y: [18, 0] }} viewport={{ once: true, amount: .12 }} transition={{ duration: .75, delay, ease: [.22, 1, .36, 1] }}>{children}</motion.div>;
}
