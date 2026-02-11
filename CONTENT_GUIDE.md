# Content Management Guide

The website content is now fully parameterized and driven by a single JSON source of truth.

## 1. Content Source
- **File**: `content/site.json`
- **Structure**:
  - `meta`: SEO (Title, Description, OG tags)
  - `header`: Navigation links
  - `hero`: Title, description, background images, CTAs
  - `servers`: List of servers (array of objects)
  - `methodology`: Scoring rules, categories, contact info
  - `filmstrip`: Gallery images
  - `faq`: Questions and answers
  - `suggest`: Suggestion form texts
  - `footer`: Links and copyright info

## 2. Admin Panel
- **URL**: `/admin`
- **Login**: Accessed via password set in `ADMIN_PASSWORD`.
- **Editing**:
  - **Content Tab**: Automatically generates editors for all fields in `site.json`.
  - **Arrays**: You can Add (+) or Remove (x) items for Navigation, Servers, FAQs, etc.
  - **Publish**: "Publish to GitHub" commits changes to the repo, triggering a Vercel rebuild.
- **Uploads**: Manage images in `public/` via the "Uploads" tab.

## 3. Environment Variables
Required for the admin panel and publishing flow:
- `ADMIN_PASSWORD`: Password for `/admin`.
- `JWT_SECRET`: Secret key for session signing.
- `GITHUB_TOKEN`: GitHub Personal Access Token with `repo` scope (for committing changes).
- `GITHUB_OWNER`: GitHub username/org (e.g. `leonardofiori`).
- `GITHUB_REPO`: Repository name (e.g. `vanilla-hytale-servers`).

## 4. Local Verification
1.  **Run Dev Server**: `npm run dev`
2.  **Visit Site**: `http://localhost:3000`
3.  **Visit Admin**: `http://localhost:3000/admin`
4.  **Test Editing**: Change a title or add a server in Admin.
5.  **Verify**: Refresh the home page to see the change locally (Publish writes to local file system in dev mode).

## 5. Limitations
-   **Image Uploads**: Currently upload to `public/` and require a rebuild to be available if using static optimization, though Vercel Blob or an external storage is recommended for production if frequent media updates are needed without rebuilds. The current setup commits images to the repo.
-   **Structure**: You cannot change the *structure* (e.g. rename keys used by the code) from the Admin panel, only values. Adding new keys requires code changes to render them.
