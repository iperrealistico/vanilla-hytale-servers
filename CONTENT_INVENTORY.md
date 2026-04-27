# Content Inventory & Parameterization Map

## 1. Global / Shared
| Component | Current source | Notes |
|-----------|----------------|-------|
| **Meta** | `content/site.json -> meta` | Editable through `/admin` |
| **Header** | `content/site.json -> header` | Editable through `/admin` |
| **Footer** | `content/site.json -> footer` | Editable through `/admin` |
| **Uploads manifest** | `content/uploads.manifest.json` | Managed through `/admin` upload flow |

## 2. Home Page (`/`)
| Section | Current source | Notes |
|---------|----------------|-------|
| **Hero** | `content/site.json -> hero` | Editable through `/admin` |
| **Server list** | `content/site.json -> servers` | Primary directory content |
| **Methodology** | `content/site.json -> methodology` | Also summarized at `/methodology` |
| **Filmstrip** | `content/site.json -> filmstrip` | Editable through `/admin` |
| **FAQ** | `content/site.json -> faq` | Editable through `/admin` |
| **Suggest** | `content/site.json -> suggest` | Editable through `/admin` |

## 3. Article Runtime (`/blog`)
| Surface | Current source | Notes |
|---------|----------------|-------|
| **Live articles** | `content/blog/**/*.mdx` | Canonical v3 article content |
| **Image slots** | `content/site/image-slots.json` | Maps deterministic slot IDs to asset keys |
| **Asset library** | `lib/images/imageLibrary.ts` | Tracked image metadata registry |
| **Image manifest** | `lib/images/imageManifest.ts` | Resolves render-ready cover/wash/orbit assets |
| **Loader + schema** | `lib/articles/**` | Parses frontmatter, analyzes structure, validates rules |
| **Presentation layer** | `components/articles/**` | Cards, shell, blocks, and archive compatibility UI |
| **Legacy archive** | `content/archive/legacy-ai-blog/posts/*.json` | Historical compatibility only, no longer part of the live queue |

## 4. Local Content-Ops Control Plane
- **Canonical local AI workspace guide**: `AI-START-HERE.local.md`
- **Operations board**: `documents-local/agent-operations/01-OPERATIONS-BOARD.md`
- **Immutable raw titles**: `documents-local/workspace-local/content-ops/article-titles-raw.md`
- **Mutable queue**: `documents-local/workspace-local/content-ops/article-title-queue.jsonl`
- **Staging**:
  - `documents-local/workspace-local/content-ops/staging/mdx-drafts/`
  - `documents-local/workspace-local/content-ops/staging/slot-assignments/`
  - `documents-local/workspace-local/content-ops/staging/image-work/`
  - `documents-local/workspace-local/content-ops/staging/generated-assets/`

These paths are intentionally local-only and Git-ignored so AI operating context, staged artifacts, and queue state do not become tracked repo noise.

## 5. Admin Panel (`/admin`)
- **Supported responsibilities**:
  - homepage/server directory content edits
  - media uploads
  - site JSON editing
  - publish-to-GitHub for tracked site JSON and media manifests
- **Not supported anymore**:
  - in-browser AI article generation
  - direct JSON-post editing
  - schedule toggling for a legacy blog cron system

## 6. Validation & Publication
- **Validation command**: `npm run validate:articles`
- **Test command**: `npm run test:articles`
- **Build gate**: `npm run build`

The canonical publication flow is now staged draft -> slot assignment + image sidecars -> tracked MDX promotion -> validation -> build verification.
