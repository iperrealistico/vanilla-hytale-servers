import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

import { parseHytaleArticlePage, parseHytaleNewsIndex } from '@/lib/content-ops/discovery/parsers/hytale';
import {
  buildCurseforgeThemeMonthKey,
  parseCurseforgeHomePage,
  parseCurseforgeModDetailPage,
} from '@/lib/content-ops/discovery/parsers/curseforge';

const fixture = (...segments: string[]) => path.join(process.cwd(), 'tests', 'fixtures', 'discovery', ...segments);

test('parseHytaleNewsIndex extracts the latest official news cards', () => {
  const html = fs.readFileSync(fixture('hytale-news-index.html'), 'utf8');
  const entries = parseHytaleNewsIndex(html);

  assert.equal(entries.length, 2);
  assert.equal(entries[0]?.title, 'PRE-RELEASE PATCH NOTES (UPDATE 5)');
  assert.equal(entries[0]?.canonicalUrl, 'https://hytale.com/news/2026/4/hytale-pre-release-patch-notes-update-5');
  assert.equal(entries[0]?.publishedAt, 'April 2, 2026');
});

test('parseHytaleArticlePage extracts title, hero image, body text, and latest revision date', () => {
  const html = fs.readFileSync(fixture('hytale-article-update5.html'), 'utf8');
  const article = parseHytaleArticlePage(html, 'https://hytale.com/news/2026/4/hytale-pre-release-patch-notes-update-5');

  assert.equal(article.title, 'PRE-RELEASE PATCH NOTES (UPDATE 5)');
  assert.equal(article.author, 'Hytale Team');
  assert.equal(article.heroImageUrl, 'https://cdn.hytale.com/e8d5c18c-c477-48f8-a409-26fcca2683d0.png');
  assert.equal(article.latestRevisionDate, 'April 16, 2026');
  assert.ok(article.bodyText.includes('Combined the Extrude and Flood Tools'));
  assert.ok(article.revisionHash.length > 10);
});

test('parseCurseforgeHomePage extracts monthly theme cards and deduplicates repeated cards', () => {
  const html = fs.readFileSync(fixture('curseforge-home-monthly-theme.html'), 'utf8');
  const parsed = parseCurseforgeHomePage(html);

  assert.equal(parsed.monthlyThemeName, 'Furniture & Decoration');
  assert.equal(parsed.monthlyThemeCards.length, 2);
  assert.equal(parsed.monthlyThemeCards[0]?.title, 'More Vanilla Furnitures');
});

test('parseCurseforgeHomePage falls back cleanly when no monthly theme is present', () => {
  const html = fs.readFileSync(fixture('curseforge-home-no-theme.html'), 'utf8');
  const parsed = parseCurseforgeHomePage(html);

  assert.equal(parsed.monthlyThemeName, null);
  assert.equal(parsed.featuredCards.length, 1);
  assert.equal(parsed.latestCards.length, 1);
  assert.equal(parsed.featuredCards[0]?.title, 'QueryHy - HTTP Server Query');
});

test('parseCurseforgeHomePage ignores install links and only keeps project pages', () => {
  const html = `<!doctype html><html><body>
    <section>
      <h2>Monthly Theme - Furniture & Decoration</h2>
      <article><a href="/hytale/mods/decoration-lights">Decoration Lights +</a></article>
      <article><a href="/hytale/mods/decoration-lights/install/7841844">Install Decoration Lights +</a></article>
    </section>
  </body></html>`;

  const parsed = parseCurseforgeHomePage(html);

  assert.equal(parsed.monthlyThemeCards.length, 1);
  assert.equal(parsed.monthlyThemeCards[0]?.canonicalUrl, 'https://www.curseforge.com/hytale/mods/decoration-lights');
});

test('parseCurseforgeModDetailPage extracts project metadata and description', () => {
  const html = fs.readFileSync(fixture('curseforge-mod-detail.html'), 'utf8');
  const detail = parseCurseforgeModDetailPage(html, 'https://www.curseforge.com/hytale/mods/more-vanilla-furnitures');

  assert.equal(detail.title, 'More Vanilla Furnitures');
  assert.equal(detail.author, 'Gueridon');
  assert.equal(detail.projectId, '1456697');
  assert.deepEqual(detail.categories, ['Furniture', 'Blocks']);
  assert.equal(detail.heroImageUrl, 'https://static.curseforge.com/hytale/mods/more-vanilla-furnitures/cover.png');
  assert.match(detail.mainFile ?? '', /MoreVanillaFurnitures1\.1\.1\.zip/);
  assert.match(detail.description, /All blocks and items are vanilla/);
});

test('parseCurseforgeModDetailPage prefers structured metadata on the live app shell', () => {
  const html = `<!doctype html><html><head>
    <meta property="og:title" content="Decoration Lights +">
    <meta property="og:description" content="Crystal-powered decorative lights for Hytale builders.">
    <meta property="og:image" content="https://media.forgecdn.net/example.png">
  </head><body>
    <script type="application/ld+json">
      {"@context":"https://schema.org","@graph":[
        {"@type":"WebPage","url":"https://www.curseforge.com/hytale/mods/decoration-lights","name":"Decoration Lights +","identifier":"1464425","description":"Crystal-powered decorative lights for Hytale builders.","mainEntity":{"@type":"CreativeWork","name":"Decoration Lights +","identifier":"1464425","description":"Crystal-powered decorative lights for Hytale builders.","dateModified":"2026-03-29T17:08:13.000Z","url":"https://www.curseforge.com/hytale/mods/decoration-lights","author":{"@type":"Person","name":"VengenceOG"},"image":"https://media.forgecdn.net/example.png"}}
      ]}
    </script>
    <section>
      <h3>Details</h3>
      <dl>
        <dt>Created</dt><dd>March 18, 2026</dd>
        <dt>Updated</dt><dd>March 29, 2026</dd>
        <dt>Project ID</dt><dd>1464425</dd>
      </dl>
    </section>
    <section id="project-categories">
      <a href="/hytale/search?categories=furniture">Furniture</a>
      <a href="/hytale/search?categories=blocks">Blocks</a>
    </section>
    <section>
      <h3>Description</h3>
      <p>Place decorative lights crafted at the Furniture Bench.</p>
    </section>
  </body></html>`;

  const detail = parseCurseforgeModDetailPage(html, 'https://www.curseforge.com/hytale/mods/decoration-lights');

  assert.equal(detail.title, 'Decoration Lights +');
  assert.equal(detail.author, 'VengenceOG');
  assert.equal(detail.projectId, '1464425');
  assert.equal(detail.updatedAt, '2026-03-29T17:08:13.000Z');
  assert.deepEqual(detail.categories, ['Furniture', 'Blocks']);
  assert.equal(detail.heroImageUrl, 'https://media.forgecdn.net/example.png');
  assert.match(detail.description, /decorative lights crafted at the Furniture Bench/i);
});

test('buildCurseforgeThemeMonthKey keeps month partitioning stable', () => {
  assert.equal(buildCurseforgeThemeMonthKey('Furniture & Decoration', '2026-04-27T10:00:00.000Z'), '2026-04:furniture-decoration');
});
