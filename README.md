# Lapenzer

LAPENZER technology website, built with Next.js App Router, React, TypeScript, Tailwind CSS, and Framer Motion.

Production hosting: Cloudflare Workers.

## Local development

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
node .next/standalone/server.js
```

When running the standalone server outside Docker, copy `public` to `.next/standalone/public` and `.next/static` to `.next/standalone/.next/static` first.

## UZUSKE

The tested local model package is available at `public/downloads/uzuske-1.0.zip`.

The original package is preserved. `lib/fixtures/network.json` supplies the 14-node, 29-edge example to the route diagram, calculator, rankings, and terminal. `lib/route.ts` ports the Python ranking algorithm; its relative shares are normalized within the retained Top-K.

## Technology and research

- `/technology/route-prediction`: local evaluation build, historical aircraft prototype, and broader two-tier research design.
- `/technology/network-influence`: aggregate influence framework with a synthetic reliability and disagreement example.
- `/technology/conflict-simulation`: conditional probability, a synthetic network scenario, and optional continuous strength feedback.
- `/research`: substantive evidence pages and source manuscripts under `public/research/papers`.

The influence and conflict demonstrations use declared illustrative parameters. Their papers present theoretical frameworks without empirical predictive accuracy. The historical aircraft result is presented separately from the current UZUSKE build.

## Verification

```bash
npm run lint
npm run check:models
npm run build
```

Model verification requires `python3`. It compares nine JavaScript route cases against the actual bundled Python implementation, checks the ZIP checksum and display fixture, and verifies probability normalization, abstention, deterministic scenario sampling, and nonnegative strength at the zero boundary. CI runs these checks.

## Static review build

```bash
npm run build:preview
```

This explicitly opts into static export under `out/`. The default production build continues to use `output: standalone` and the existing Cloudflare/Docker configuration.

## Interaction and access

Homepage model stories retain static explanations before hydration, provide direct stage controls, and collapse sticky behavior for narrow screens and reduced-motion preferences. The mobile menu supports Escape, focus cycling, and expanded-state announcements. Contact opens an email draft; sending happens in the visitor's email app.
