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
- an immutable human-curated title source,
- a mutable queue with title integrity checks,
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
- immutable raw titles and a mutable queue,
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

Legacy JSON-era slugs are still served by the new runtime as noindex archive compatibility pages. They are preserved for continuity but removed from the active editorial index and queue.

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
- and at least two strategic internal links.

## Queue Model

The queue is intentionally two-layered.

Immutable title source:
- `documents-local/workspace-local/content-ops/article-titles-raw.md`

Mutable queue state:
- `documents-local/workspace-local/content-ops/article-title-queue.jsonl`

Queue records preserve:
- title order,
- exact title wording,
- queue ID,
- workflow status,
- slug assignment,
- draft path,
- and last-run outcome.

If the raw title source changes, the queue must be resynced instead of silently rewritten.

## Staging Model

The staging surface lives under:
- `documents-local/workspace-local/content-ops/staging/mdx-drafts/`
- `documents-local/workspace-local/content-ops/staging/slot-assignments/`
- `documents-local/workspace-local/content-ops/staging/image-work/`
- `documents-local/workspace-local/content-ops/staging/generated-assets/`

A staged package is not live content. It becomes publishable only after queue integrity, schema, links, slots, assets, and local validation all pass.

## Image System

The image system is deterministic.

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
- chapter alignment,
- and public asset existence.

## Publication Flow

The canonical flow is now:
1. Select a queued title.
2. Verify the queue title still matches the raw title source.
3. Create a staged draft package.
4. Create staged slot assignments and image sidecars.
5. Register or promote assets into the tracked slot map and image library.
6. Promote the draft into `content/blog/**`.
7. Run validation, tests, and build.
8. Only then treat the article as live.

If a gate fails, the queue record should not move to `published`.

## Legacy Archive Policy

Historical JSON outputs from the retired system now live in:
- `content/archive/legacy-ai-blog/posts/`

These files are preserved because they previously existed as published slugs, but they are not part of the active pipeline.
They are served as archive compatibility pages with `noindex` metadata so the repo preserves continuity without keeping the old generator or schedule system alive.

## Replication Guidance

To recreate this system in another repo:
1. Keep the live runtime tracked and file-driven.
2. Keep AI operating notes, queue state, staging artifacts, and prompt docs local-only.
3. Use one immutable raw title source and one mutable queue.
4. Use deterministic slot IDs and a tracked asset registry.
5. Encode strict article validation before promotion.
6. Preserve old published content only through migration or explicit archive handling, not by leaving multiple active pipelines alive.
