export class Random {
  state: number;
  constructor(seed: string | number) {
    let h = 2166136261;
    for (const c of String(seed)) {
      h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    }
    this.state = typeof seed === "number" ? seed >>> 0 : h >>> 0;
  }
  next() {
    let t = (this.state += 0x6d2b79f5);
    this.state >>>= 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  int(n: number) {
    return Math.floor(this.next() * n);
  }
  normal() {
    return (
      Math.sqrt(-2 * Math.log(Math.max(1e-12, this.next()))) *
      Math.cos(2 * Math.PI * this.next())
    );
  }
  pick<T>(a: T[]) {
    return a[this.int(a.length)];
  }
  shuffle<T>(a: T[]) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
export const clamp = (v: number, lo = 0, hi = 1) =>
  Math.max(lo, Math.min(hi, v));
export const mean = (a: number[]) =>
  a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0;
export const variance = (a: number[], sample = false) => {
  if (a.length <= (sample ? 1 : 0)) return 0;
  const average = mean(a);
  return (
    a.reduce((sum, value) => sum + (value - average) ** 2, 0) /
    (a.length - (sample ? 1 : 0))
  );
};
export const quantile = (sorted: number[], p: number) => {
  if (!sorted.length) return 0;
  const i = (sorted.length - 1) * p,
    j = Math.floor(i);
  return (
    sorted[j] +
    (sorted[Math.min(j + 1, sorted.length - 1)] - sorted[j]) * (i - j)
  );
};
