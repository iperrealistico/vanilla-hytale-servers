# Vanilla Hytale Servers

A Next.js site for comparing vanilla-first Hytale servers, explaining the scoring methodology behind the directory, and publishing practical editorial guides that help players choose calmer, fairer survival communities.

## Main Surfaces

- `/servers`: curated directory and comparison surface
- `/guides`: guide hub that groups the live editorial categories
- `/blog`: validated v3 article runtime for Hytale server-selection content
- `/methodology`: explanation of the rating and review lens behind the directory
- `/admin`: site-content admin for tracked homepage content and media manifests

## Article System

The repo now uses one canonical article system:
- live articles in `content/blog/**`
- deterministic image slots in `content/site/image-slots.json`
- runtime loaders, analyzers, and validators in `lib/articles/**`
- article presentation components in `components/articles/**`
- public documentation in `docs/article-system-report.md`

Local-only AI content operations live in `AI-START-HERE.local.md` and `documents-local/**`.
Those files are intentionally Git-ignored so queue state, staging artifacts, prompt docs, and operator notes stay machine-local.

## Validation Commands

```bash
npm install
npm run validate:articles
npm run test:articles
npm run build
```

## Documentation

- [Article system report](docs/article-system-report.md)
- [Docs index](docs/README.md)

## Development

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).
