# Article System Report

## Overview

The site now uses one canonical article system built around a live MDX runtime plus a local-only AI content-ops control plane.

The public runtime lives in tracked code and content:
- `app/blog/[[...slug]]/page.tsx`
- `content/blog/**`
- `content/site/image-slots.json`
- `lib/articles/**`
- `lib/images/**`
- `components/articles/**`

The local/private generation and staging workflow lives outside tracked repo content:
- `AI-START-HERE.local.md`
- `documents-local/agent-operations/01-OPERATIONS-BOARD.md`
- `documents-local/workspace-local/content-ops/**`

## Previous State

The previous system combined:
- a generic `blog-module/` runtime and generator,
- `app/api/blog/[...route]/route.ts` for post, schedule, and run endpoints,
- an admin-side “AI Blog” generator and post editor,
- JSON posts in `data/blog/`,
- research artifacts in `data/research/`,
- a schedule file in `data/schedules.json`,
- a GitHub Actions workflow for deep research generation.

That system produced directly published JSON articles, but it did not provide:
- a modular source-discovery layer,
- a canonical candidate ledger separate from the publish queue,
- a first-class staging area,
- deterministic slot-based image semantics,
- a strict v3 article contract,
- structure-aware content validation before publication,
- or a clean separation between public runtime code and local AI operating context.

## What Replaced It

The new canonical system introduces:
- a validated v3 article schema with deterministic chapter metadata,
- approved editorial blocks for all live articles,
- deterministic cover/wash/orbit slot IDs,
- an asset library plus image manifest layer,
- a live `/blog` runtime with category and article detail views,
- strategic route support through `/servers`, `/guides`, and `/methodology`,
- a modular title-discovery registry with family-specific source rules,
- canonical discovery ledgers for candidates, sources, consumption, and suppressions,
- a generated human-readable title report plus a compatible mutable queue,
- scraped source-image capture for Hytale news and CurseForge mod discovery,
- blueprint-style staged image prompts that turn source images into AI-generated derivatives instead of publishing raw third-party artwork,
- staged draft, slot-assignment, image-work, and generated-asset folders,
- validator and test scripts that gate publication,
- and removal of the old Vercel cron plus `/api/blog/*` automation endpoints so no tracked deploy config still points at the retired generator.

## Runtime Routes

Live public routes now include:
- `/blog`
- `/blog/[slug]`
- `/blog/category/[category]`
- `/guides`
- `/servers`
- `/methodology`

If legacy JSON-era slugs are retained, the new runtime can still serve them as noindex archive compatibility pages. They remain outside the active editorial index and queue.

## Content Contract

Live articles now use a strict metadata contract with these core fields:
- `slug`
- `articleTemplate`
- `queueId`
- `workflowStatus`
- `title`
- `excerpt`
- `category`
- `context`
- `primaryKeyword`
- `searchIntent`
- `coverImage`
- `ornamentWashImage`
- `ornamentOrbitImage`
- `publishedAt`
- `seoTitle`
- `seoDescription`
- `chapterShortTitles`
- `articleCtas`
- `featured`
- `tags`

Every live v3 article must include:
- one hero cover,
- one ambient wash ornament,
- one ambient orbit ornament,
- one sticky CTA,
- exactly one `ArticlePrimarySegue`,
- two to four approved editorial blocks excluding the segue,
- four to six H2 sections,
- at least two strategic internal links,
- at least one natural in-body backlink to the homepage server list at `/#servers`,
- and primary-keyword usage that stays aligned with the `vanilla hytale servers` cluster without stuffing exact-match phrases into every section.

## Discovery Model

The upstream content-discovery layer is now canonical.

Family registry:
- `official-update-briefing`
- `mod-scene-radar`

Canonical local-only ledgers:
- `documents-local/workspace-local/content-ops/discovery/title-candidates.jsonl`
- `documents-local/workspace-local/content-ops/discovery/source-ledger.jsonl`
- `documents-local/workspace-local/content-ops/discovery/source-consumption.jsonl`
- `documents-local/workspace-local/content-ops/discovery/suppression-log.jsonl`

Snapshots and downloaded guideline assets:
- `documents-local/workspace-local/content-ops/discovery/snapshots/**`

The generated report at `documents-local/workspace-local/content-ops/article-titles-raw.md` still exists for human scanning, but it is no longer the canonical source of truth.

## Queue Model

The publish queue remains compatible for staging and promotion work:
- `documents-local/workspace-local/content-ops/article-title-queue.jsonl`

Each queue record can now carry:
- candidate identity
- queue identity and workflow status
- source references and source revisions
- source and novelty fingerprints
- angle summary and why-now rationale
- SEO keyword/intent metadata, including a `vanilla hytale servers`-aware primary keyword seed
- duplicate-check summaries
- suppression state
- draft and publish linkage

Discovery candidates materialize into the queue only when they survive anti-repetition and freshness checks.
Existing legacy queue records without discovery metadata remain supported.

## Staging Model

The staging surface lives under:
- `documents-local/workspace-local/content-ops/staging/mdx-drafts/`
- `documents-local/workspace-local/content-ops/staging/slot-assignments/`
- `documents-local/workspace-local/content-ops/staging/image-work/`
- `documents-local/workspace-local/content-ops/staging/generated-assets/`

A staged package is not live content. It becomes publishable only after queue integrity, schema, links, slots, assets, and local validation all pass.

## Image System

The image system is deterministic.

Raw third-party source images are reference-only inputs.
The staged workflow now expects AI-generated blueprint derivatives built from those references, using the Hytale-blue range `#4560a9 -> #70afdb`.
Those derivatives should be created through the built-in `imagegen` skill and the same built-in `image_gen` tool available in chat, not through hand-assembled SVG/vector placeholder work.

Layer 1:
- article metadata references slot keys such as `blog.some-slug.cover`

Layer 2:
- `content/site/image-slots.json` maps slot keys to asset IDs

Layer 3:
- `lib/images/imageLibrary.ts` defines the physical asset metadata

Layer 4:
- `lib/images/imageManifest.ts` assembles render-ready cover/wash/orbit objects for the runtime

Validation fails when:
- a slot key is missing,
- a slot references an unknown asset,
- an asset file is missing,
- or a required v3 image slot is absent.

Operational image rules now also require:
- scraping Hytale hero images when available for official-update articles,
- scraping CurseForge mod-page images when available for mod-scene articles,
- never publishing the raw scraped source image directly,
- using the built-in `imagegen` tool for the final image generation step,
- and recording the blueprint prompt plus reference paths in each staged image sidecar.

## Validation And Testing

The new system adds these checks:
- `npm run validate:articles`
- `npm run test:articles`
- `npm run build`

Validation covers:
- frontmatter parsing,
- slot resolution,
- related-slug resolution,
- approved block counts,
- exact segue count,
- strategic internal links,
- homepage server-list backlink presence at `/#servers`,
- chapter alignment,
- and public asset existence.

Discovery-specific checks are now covered by fixture-based tests for:
- Hytale index parsing
- Hytale article revision parsing
- CurseForge theme/fallback parsing
- duplicate suppression
- stale-source rejection
- no-op daily runs
- queue materialization idempotency

## Publication Flow

The canonical flow is now:
1. Sync already-published queue records back into the local discovery state.
2. Discover fresh official-update or mod-scene candidates.
3. Suppress exact-source and near-duplicate angles.
4. Materialize accepted candidates into `article-title-queue.jsonl`.
5. Select a queued title.
6. Create or open a staged draft package.
7. Create staged slot assignments and blueprint image sidecars from scraped source references.
8. Register or promote assets into the tracked slot map and image library.
9. Promote the draft into `content/blog/**`.
10. Run validation, tests, and build.
11. Commit the tracked article package on `main` and push it to `origin/main`.
12. Verify the public `/blog`, category, and article routes on the live site.
13. Only then treat the article as live.

If a gate fails, the queue record should not move to `published`.
If discovery finds nothing fresh or sufficiently novel, it is valid for the daily run to add zero titles.

## Source Handling Notes

The current discovery families are intentionally asymmetric:
- Hytale official news can be fetched and snapshotted directly, with revision detection based on page content hashing and visible in-body update dates.
- CurseForge discovery now uses a Playwright-backed real-browser transport with a persistent local Chrome profile, then falls back to snapshots only if the browser session is still challenged or unavailable.
- Guideline image downloads for both families follow the same local snapshot pattern so a previously captured reference image can still support later blueprint-generation runs.

This blocked-source fallback is deliberate. It is better for a daily run to produce no candidate than to spam repetitive or partially trusted titles. A manual recovery command is available for the local profile if needed: `npm run prime:curseforge`.

## Legacy Archive Policy

If historical JSON outputs from the retired system are retained, they live in:
- `content/archive/legacy-ai-blog/posts/`

Those files are not part of the active pipeline.
When present, they are served as archive compatibility pages with `noindex` metadata so the repo can preserve continuity without keeping the old generator or schedule system alive.

## Replication Guidance

To recreate this system in another repo:
1. Keep the live runtime tracked and file-driven.
2. Keep AI operating notes, queue state, staging artifacts, and prompt docs local-only.
3. Use a canonical discovery ledger and only materialize accepted candidates into the publish queue.
4. Use deterministic slot IDs and a tracked asset registry.
5. Encode strict anti-repetition checks before queue insertion and strict article validation before promotion.
6. Preserve old published content only through migration or explicit archive handling, not by leaving multiple active pipelines alive.
