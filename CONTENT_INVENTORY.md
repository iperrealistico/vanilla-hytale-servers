# Content Inventory & Parameterization Map

## 1. Global / Shared
| Component | Existing JSON? | Hardcoded Content | Target JSON Path |
|-----------|----------------|-------------------|------------------|
| **Meta** | Partial | Title, Description, OG, Twitter | `meta.*` (Extend with missing if any) |
| **Header** | Partial | "Servers", "FAQ", "Blog", "Submit" | `header.nav.*` (Array of label/url) |
| **Footer** | Partial | "Servers", "Scoring", "Submit" | `footer.links.*` (Array of label/url) |
| **Toast** | No | (Empty in code, but maybe needs text?) | `toast.messages.*` |

## 2. Home Page (`/`)
| Section | Existing JSON? | Hardcoded Content | Target JSON Path |
|---------|----------------|-------------------|------------------|
| **Background** | No | `bg-floats` images (5 images) | `hero.backgroundFloats.*` (Array of src/style) |
| **Hero** | Yes | Title, Decsription, Last Updated | `hero.*` |
| **Hero CTA** | No | "Jump to servers", "Vanilla FAQ", "Submit" | `hero.cta.*` (Array of label/url/icon) |
| **Server List** | Yes | List of servers | `servers.items` |
| **Methodology** | Partial | Title, Description, Rules, Categories | `methodology.*` |
| **Methodology** | No | "Doubts?", "hello@..." | `methodology.contact.*` |
| **Methodology** | No | "Exclusion rules", "Editor score" headers | `methodology.sectionHeaders.*` |
| **Filmstrip** | No | `['6', '7', '8', '9', '5']` images | `filmstrip.images.*` (Array of src/alt) |
| **FAQ** | Yes | Title, Description, Items | `faq.*` |
| **Suggest** | Yes | Title, Description, Requirements | `suggest.*` |
| **Suggest** | No | "Contact us", "Requirements" header | `suggest.cta.*`, `suggest.requirementsTitle` |

## 3. Blog Pages
(Need to check `blog-module` or `app/blog` structure, but assuming standard post content)

## 4. Admin Panel (`/admin`)
- **Current State**: Only edits `meta.title`, `hero.title`, and `servers` list (partial fields).
- **Target State**: Must edit ALL of the above target JSON paths.
- **Components Needed**:
    - Array editor (for nav, footer, floats, filmstrip, CTA buttons).
    - Object editor (for nested sections).
    - Image picker (integrating with `uploads.manifest.json`).

## 5. Parameterization Strategy
1.  **Phase 1: JSON Expansion**
    -   Update `site.json` with all missing fields populated with current hardcoded values.
2.  **Phase 2: Component Refactor**
    -   Refactor `HomePage.tsx` to read from new JSON paths.
    -   Refactor `layout.tsx` / `Header` / `Footer` to read from new JSON paths.
3.  **Phase 3: Admin Expansion**
    -   Create `ArrayField` component.
    -   Create `ObjectField` component.
    -   Update `AdminDashboard` to render editors for the full JSON tree.
