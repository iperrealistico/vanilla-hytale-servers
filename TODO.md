# Migration TODO

## Phase 1: Baseline & Preparation
- [x] Scan repo structure and inventory assets/pages
- [x] Create baseline screenshots for visual regression tests
- [x] Initialize Next.js project scaffold

## Phase 2: Content Modeling
- [x] Create `content/site.json` based on `index.html` content
- [x] Create `content/uploads.manifest.json` for asset bookkeeping
- [x] Set up basic i18n structure (it/en)

## Phase 3: Public Site Migration
- [x] Migrate global CSS and layout
- [x] Implement Home page (SSG) with i18n routing
- [x] Wire `content/site.json` to components
- [x] Add language switcher & corner badge
- [x] Ensure SEO correctness (canonical, hreflang)

## Phase 4: Admin Panel
- [x] Choose non-obvious admin path
- [x] Implement password-only login (HttpOnly cookie, HMAC JWT)
- [x] Create admin UI for editing `site.json`
- [x] Implement GitHub publish workflow (commit via REST API)
- [x] Implement upload management with manifest bookkeeping

## Phase 5: Verification
- [x] Run build gate (SSG verification)
- [x] Run smoke tests (Visual & i18n checks)
- [x] Perform visual regression comparison (Baseline vs Current)
- [x] Verify admin functionality end-to-end (Auth, JSON, GitHub API)
