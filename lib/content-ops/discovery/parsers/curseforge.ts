import { JSDOM } from 'jsdom';

import { normalizeWhitespace, slugify } from '@/lib/content-ops/discovery/text';

export interface CurseforgeCard {
  title: string;
  canonicalUrl: string;
  summary: string;
  author: string | null;
  updatedAt: string | null;
  categories: string[];
  projectId: string | null;
}

export interface CurseforgeHomeParseResult {
  monthlyThemeName: string | null;
  monthlyThemeCards: CurseforgeCard[];
  featuredCards: CurseforgeCard[];
  latestCards: CurseforgeCard[];
}

export interface CurseforgeModDetail {
  title: string;
  canonicalUrl: string;
  summary: string;
  author: string | null;
  projectId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  categories: string[];
  mainFile: string | null;
  description: string;
  heroImageUrl: string | null;
}

const monthPattern =
  /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}\b/g;

function toAbsoluteUrl(href: string, baseUrl: string) {
  return new URL(href, baseUrl).toString();
}

function textAfterLabel(fullText: string, label: string) {
  const pattern = new RegExp(`${label}\\s+([^\\n]+)`, 'i');
  return fullText.match(pattern)?.[1]?.trim() ?? null;
}

function extractImageUrl(document: Document, baseUrl: string) {
  const fromMeta =
    document
      .querySelector('meta[property="og:image"], meta[name="og:image"], meta[name="twitter:image"]')
      ?.getAttribute('content')
      ?.trim() ?? null;

  if (fromMeta) {
    return toAbsoluteUrl(fromMeta, baseUrl);
  }

  const imageNode = document.querySelector('img[srcset], img[src]');
  const srcset = imageNode?.getAttribute('srcset')?.trim() ?? null;
  if (srcset) {
    const first = srcset
      .split(',')
      .map((segment) => segment.trim().split(/\s+/)[0])
      .find(Boolean);
    if (first) {
      return toAbsoluteUrl(first, baseUrl);
    }
  }

  const src = imageNode?.getAttribute('src')?.trim() ?? null;
  return src ? toAbsoluteUrl(src, baseUrl) : null;
}

function extractCard(anchor: HTMLAnchorElement, baseUrl: string): CurseforgeCard | null {
  const href = anchor.getAttribute('href');
  const title = normalizeWhitespace(anchor.textContent ?? '');
  if (!href || !title) {
    return null;
  }

  const container = anchor.closest('article, li, div, section') ?? anchor.parentElement;
  const text = normalizeWhitespace(container?.textContent ?? anchor.textContent ?? '');
  const summary = text.replace(title, '').slice(0, 320).trim();
  const dateMatch = text.match(monthPattern)?.[0] ?? null;
  const byMatch = text.match(/\bBy\s+([A-Za-z0-9_.' -]+)/i);
  const projectIdMatch = text.match(/\bProject ID\s+(\d+)/i);
  const categories = [...text.matchAll(/\b(Furniture|Blocks|Gameplay|Utility|World Gen|Food\\Farming|Miscellaneous|Mobs\\Characters|Minigames)\b/gi)].map(
    (match) => match[0],
  );

  return {
    title,
    canonicalUrl: toAbsoluteUrl(href, baseUrl),
    summary,
    author: byMatch?.[1]?.trim() ?? null,
    updatedAt: dateMatch,
    categories,
    projectId: projectIdMatch?.[1] ?? null,
  };
}

function dedupeCards(cards: CurseforgeCard[]) {
  const seen = new Set<string>();
  return cards.filter((card) => {
    const key = card.projectId ?? card.canonicalUrl;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function parseCurseforgeHomePage(html: string, baseUrl = 'https://www.curseforge.com'): CurseforgeHomeParseResult {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const headings = [...document.querySelectorAll('h1, h2, h3, h4')];

  function cardsWithinSection(matcher: (heading: Element) => boolean) {
    const heading = headings.find(matcher);
    if (!heading) {
      return [];
    }

    const section = heading.closest('section') ?? heading.parentElement;
    if (!section) {
      return [];
    }

    return dedupeCards(
      [...section.querySelectorAll('a[href*="/hytale/mods/"]')]
        .map((anchor) => extractCard(anchor as HTMLAnchorElement, baseUrl))
        .filter((card): card is CurseforgeCard => Boolean(card)),
    );
  }

  const monthlyThemeHeading = headings.find((heading) => /monthly theme/i.test(heading.textContent ?? ''));
  const monthlyThemeName = monthlyThemeHeading?.textContent?.split('-')[1]?.trim() ?? null;

  const monthlyThemeCards = cardsWithinSection((heading) => /monthly theme/i.test(heading.textContent ?? ''));
  const featuredCards = cardsWithinSection((heading) => /featured|top 10|collection/i.test(heading.textContent ?? ''));
  const latestCards = cardsWithinSection((heading) => /latest mods/i.test(heading.textContent ?? ''));

  return {
    monthlyThemeName,
    monthlyThemeCards,
    featuredCards,
    latestCards,
  };
}

export function parseCurseforgeModDetailPage(html: string, canonicalUrl: string): CurseforgeModDetail {
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const fullText = normalizeWhitespace(document.body.textContent ?? '');
  const title = normalizeWhitespace(document.querySelector('h1')?.textContent ?? '');
  const summary =
    normalizeWhitespace(document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '') ||
    normalizeWhitespace(textAfterLabel(fullText, title) ?? '');
  const categories = [...document.querySelectorAll('a[href*="/category/"], .categories a, [data-category]')]
    .map((node) => normalizeWhitespace(node.textContent ?? ''))
    .filter(Boolean);
  const descriptionHeading = [...document.querySelectorAll('h2, h3, h4')].find((heading) =>
    /^description$/i.test(normalizeWhitespace(heading.textContent ?? '')),
  );
  const description = normalizeWhitespace(descriptionHeading?.parentElement?.textContent ?? fullText).slice(0, 2400);

  return {
    title,
    canonicalUrl,
    summary,
    author:
      normalizeWhitespace(document.querySelector('.author a, a[href*="/members/"]')?.textContent ?? '') ||
      fullText.match(/\bBy\s+([A-Za-z0-9_.' -]+)/i)?.[1]?.trim() ||
      null,
    projectId: fullText.match(/\bProject ID\s+(\d+)/i)?.[1] ?? null,
    createdAt: fullText.match(/\bCreated\s+([^U]+?)\bUpdated\b/i)?.[1]?.trim() ?? textAfterLabel(fullText, 'Created'),
    updatedAt: fullText.match(monthPattern)?.pop() ?? textAfterLabel(fullText, 'Updated'),
    categories: categories.length > 0 ? categories : [...new Set((fullText.match(/\b(Furniture|Blocks|Gameplay|Utility|World Gen|Food\\Farming|Miscellaneous|Mobs\\Characters|Minigames)\b/gi) ?? []).map((value) => value.trim()))],
    mainFile: document.querySelector('a[href*="/files/"]')?.textContent?.trim() ?? textAfterLabel(fullText, 'Main File'),
    description,
    heroImageUrl: extractImageUrl(document, canonicalUrl),
  };
}

export function buildCurseforgeThemeMonthKey(themeName: string, observedAt: string) {
  return `${observedAt.slice(0, 7)}:${slugify(themeName.replace(/&/g, ' '))}`;
}
