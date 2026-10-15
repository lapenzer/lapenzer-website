# Lapenzer

Production website for Lapenzer.

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
