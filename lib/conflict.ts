export const states = ["Stable", "Pressured", "Contested", "Control changed"];
export const stateColors = ["#95b5a7", "#d7c58f", "#c99b85", "#a9a3ca"];
export const regionPositions = [[115, 120], [330, 70], [570, 145], [150, 330], [390, 325], [610, 355]];
export const regionEdges = [[0, 1], [0, 3], [1, 2], [1, 4], [2, 4], [2, 5], [3, 4], [4, 5]];
export const baseMatrix = [[.82, .13, .04, .01], [.14, .61, .2, .05], [.06, .2, .57, .17], [.08, .16, .16, .6]];
export function conditionalProbability(a: number, givenA: number, withoutA: number) { return a * givenA + (1 - a) * withoutA; }
export function evolveStrength(a: number, b: number, alpha: number, beta: number, duration = 1) {
  let A = Math.max(0, a), B = Math.max(0, b);
  for (let t = 0; t < duration && A > 0 && B > 0;) {
    const dt = Math.min(.05, duration - t, beta * B > 0 ? A / (beta * B) : Infinity, alpha * A > 0 ? B / (alpha * A) : Infinity);
    if (dt <= 1e-12) break;
    const nextA = Math.max(0, A - dt * beta * B), nextB = Math.max(0, B - dt * alpha * A);
    A = nextA < 1e-10 ? 0 : nextA; B = nextB < 1e-10 ? 0 : nextB; t += dt;
  }
  return [A, B];
}
function seeded(seed: number) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function scenario(pressure = .35, hybrid = false, runs = 512, horizon = 12) {
  const random = seeded(1049);
  const counts = Array.from({ length: horizon + 1 }, () => Array.from({ length: 6 }, () => [0, 0, 0, 0]));
  const strengths = Array.from({ length: horizon + 1 }, () => [0, 0]);
  for (let run = 0; run < runs; run++) {
    let current = [0, 1, 0, 0, 2, 1]; let A = 100, B = 90;
    for (let time = 0; time <= horizon; time++) {
      current.forEach((state, region) => counts[time][region][state]++);
      strengths[time][0] += A / runs; strengths[time][1] += B / runs;
      if (time === horizon) break;
      if (hybrid) [A, B] = evolveStrength(A, B, .018 * (.7 + random() * .6) * (1 + current[1] * .2), .022 * (.7 + random() * .6) * (1 + current[1] * .2));
      current = current.map((state, region) => {
        const neighbors = regionEdges.filter(e => e.includes(region)).map(e => e[0] === region ? e[1] : e[0]);
        const exposure = neighbors.reduce((n, j) => n + current[j] / 3, 0) / neighbors.length;
        const force = hybrid ? (B - A) / Math.max(1, A + B) : 0;
        const scores = baseMatrix[state].map((p, k) => Math.log(p) + (pressure + .45 * exposure + force - .35) * k);
        const max = Math.max(...scores), weights = scores.map(s => Math.exp(s - max)); const total = weights.reduce((a, b) => a + b, 0);
        let draw = random() * total;
        for (let k = 0; k < weights.length; k++) { draw -= weights[k]; if (draw <= 0) return k; }
        return 3;
      });
    }
  }
  return { distributions: counts.map(t => t.map(c => c.map(n => n / runs))), strengths, runs };
}
