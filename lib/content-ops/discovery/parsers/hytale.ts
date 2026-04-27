import { JSDOM } from 'jsdom';

import { normalizeWhitespace, sha1, stripHtml } from '@/lib/content-ops/discovery/text';

export interface HytaleNewsIndexEntry {
  title: string;
  canonicalUrl: string;
  excerpt: string;
  imageUrl: string | null;
  publishedAt: string | null;
  author: string | null;
}

export interface HytaleArticlePage {
  title: string;
  canonicalUrl: string;
  author: string | null;
  publishedAt: string | null;
  heroImageUrl: string | null;
  excerpt: string;
  bodyHtml: string;
  bodyText: string;
  latestRevisionDate: string | null;
  revisionHash: string;
}

const monthPattern =
  /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/g;

function toAbsoluteUrl(href: string, baseUrl: string) {
  return new URL(href, baseUrl).toString();
}

function extractDate(text: string) {
  const match = normalizeWhitespace(text).match(monthPattern);
  return match?.[0] ?? null;
}

function parseAstroBlogBody(dom: JSDOM) {
  const island = dom.window.document.querySelector('astro-island[component-url*="BlogPostBody"]');
  const props = island?.getAttribute('props');
  if (!props) {
    return '';
  }

  try {
    const parsed = JSON.parse(props) as { html?: unknown };
    const raw = parsed.html;
    if (typeof raw === 'string') {
      return raw;
    }

    if (Array.isArray(raw) && raw[0] === 0 && typeof raw[1] === 'string') {
      return raw[1];
    }

    return '';
  } catch {
    return '';
  }
}

export function parseHytaleNewsIndex(html: string, baseUrl = 'https://hytale.com'): HytaleNewsIndexEntry[] {
  const dom = new JSDOM(html);
  const anchors = [...dom.window.document.querySelectorAll('article a[href*="/news/"]')];
  const seen = new Set<string>();
  const entries: HytaleNewsIndexEntry[] = [];

  for (const anchor of anchors) {
    const href = anchor.getAttribute('href');
    const title = anchor.querySelector('h4')?.textContent;
    if (!href || !title) {
      continue;
    }

    const canonicalUrl = toAbsoluteUrl(href, baseUrl);
    if (seen.has(canonicalUrl)) {
      continue;
    }
    seen.add(canonicalUrl);

    const summaryCandidates = [...anchor.querySelectorAll('span, p')]
      .map((node) => normalizeWhitespace(node.textContent ?? ''))
      .filter(Boolean);

    const excerpt = summaryCandidates.find((value) => value.length > 60 && !extractDate(value)) ?? '';
    const publishedAt = summaryCandidates.find((value) => Boolean(extractDate(value))) ?? null;
    const author =
      summaryCandidates.find((value) => /^posted by /i.test(value))?.replace(/^posted by /i, '').trim() ?? null;
    const imageUrl = anchor.querySelector('img')?.getAttribute('src') ?? null;

    entries.push({
      title: normalizeWhitespace(title),
      canonicalUrl,
      excerpt,
      imageUrl,
      publishedAt: publishedAt ? extractDate(publishedAt) : null,
      author,
    });
  }

  return entries;
}

export function parseHytaleArticlePage(html: string, canonicalUrl: string): HytaleArticlePage {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const title = normalizeWhitespace(document.querySelector('h1.post-heading, h1')?.textContent ?? '');
  const metaText = normalizeWhitespace(document.querySelector('h1.post-heading')?.parentElement?.textContent ?? '');
  const authorMatch = metaText.match(/Posted by\s+([^0-9]+?)(?=(January|February|March|April|May|June|July|August|September|October|November|December)|$)/i);
  const publishedAt = extractDate(metaText);
  const heroImageUrl = document.querySelector('h1.post-heading')?.parentElement?.querySelector('img[src]')?.getAttribute('src') ?? null;
  const bodyHtml = parseAstroBlogBody(dom) || document.querySelector('.post-body')?.innerHTML || '';
  const bodyText = stripHtml(bodyHtml);
  const excerpt = normalizeWhitespace(bodyText.split(/[.!?]/).slice(0, 2).join('. ')).slice(0, 280);
  const dateMatches = [...bodyText.matchAll(monthPattern)].map((match) => match[0]);
  const latestRevisionDate = dateMatches.length > 0 ? dateMatches[dateMatches.length - 1] : publishedAt;
  const revisionHash = sha1(normalizeWhitespace(bodyHtml));

  return {
    title,
    canonicalUrl,
    author: authorMatch?.[1]?.trim() ?? null,
    publishedAt,
    heroImageUrl,
    excerpt,
    bodyHtml,
    bodyText,
    latestRevisionDate,
    revisionHash,
  };
}
