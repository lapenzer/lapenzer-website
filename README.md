# Lapenzer

Corporate website for **Lapenzer** — software, research, mathematical models, and technical systems.

## Stack

- Next.js 16
- React 19
- TypeScript
- Structured CSS (no UI framework or proprietary hosting dependency)

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production

```bash
npm run build
npm start
```

## Docker

```bash
docker build -t lapenzer .
docker run --rm -p 3000:3000 lapenzer
```

The application listens on `0.0.0.0:3000`, so it can sit behind a Cloudflare Tunnel or another reverse proxy.

Example Cloudflare Tunnel ingress target:

```yaml
ingress:
  - hostname: lapenzer.com
    service: http://localhost:3000
  - service: http_status:404
```

## Site structure

- `/` — company overview, mission, capabilities, featured project, development method
- `/projects` — project archive
- `/projects/quantified-systems` — Quantified Systems project detail
- `/research` — publication-style research archive
- `/capabilities` — software, modelling, analysis, simulation, forecasting
- `/about` — company description and technical principles
- `/contact` — inquiry form that opens the visitor's email client; no server-side delivery is claimed or implemented

## Content model

Project and research maturity is labelled explicitly (theory, prototype, tested prototype, working software, production system). The site avoids inventing customers, contracts, partnerships, metrics, or deployment claims.

## Deployment notes

This project does not require Vercel. It can run directly with Node, Docker, or behind a Cloudflare Tunnel. DNS and the tunnel should be configured separately from this repository.
