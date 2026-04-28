import type { QueueRecord } from '@/lib/content-ops/discovery/schema';
import { normalizeWhitespace, unique } from '@/lib/content-ops/discovery/text';

export const homepageServerListRoute = '/#servers';

const evergreenSupportingKeywords = [
  'vanilla hytale servers',
  'vanilla-first hytale servers',
  'hytale server list',
  'best hytale servers',
  'hytale servers',
] as const;

const familySupportingKeywords: Record<string, string[]> = {
  'official-update-briefing': ['hytale server guide', 'hytale server methodology'],
  'mod-scene-radar': ['mods for vanilla hytale servers', 'semi-vanilla hytale servers', 'hytale building servers'],
};

function normalizeKeyword(value: string) {
  return normalizeWhitespace(value).toLowerCase();
}

function dedupeKeywords(values: string[]) {
  const normalized = new Set<string>();
  const deduped: string[] = [];

  for (const value of values) {
    const cleaned = normalizeWhitespace(value);
    if (!cleaned) {
      continue;
    }

    const key = cleaned.toLowerCase();
    if (normalized.has(key)) {
      continue;
    }

    normalized.add(key);
    deduped.push(cleaned);
  }

  return deduped;
}

function normalizeRoute(value: string) {
  if (value === '/servers') {
    return homepageServerListRoute;
  }

  return value;
}

export function buildOfficialUpdatePrimaryKeyword(sourceTitle: string) {
  return `what ${normalizeWhitespace(sourceTitle).toLowerCase()} means for vanilla hytale servers`;
}

export function buildModScenePrimaryKeyword(themeLabel: string) {
  return `best ${normalizeWhitespace(themeLabel).toLowerCase()} hytale mods for vanilla hytale servers`;
}

export function buildSupportingKeywords(primaryKeyword: string | null | undefined, familyId: string) {
  const normalizedPrimary = primaryKeyword ? normalizeKeyword(primaryKeyword) : null;

  return dedupeKeywords([...evergreenSupportingKeywords, ...(familySupportingKeywords[familyId] ?? [])]).filter(
    (keyword) => normalizeKeyword(keyword) !== normalizedPrimary,
  );
}

export function buildRequiredBodyRoutes(routes: string[] = []) {
  return unique([homepageServerListRoute, ...routes.map(normalizeRoute)]);
}

export function buildNaturalHomepageAnchorIdeas(primaryKeyword: string | null | undefined) {
  const ideas = [
    'vanilla Hytale server list',
    'homepage server shortlist',
    'server list on the homepage',
    'compare servers on the homepage',
  ];

  if (primaryKeyword && normalizeKeyword(primaryKeyword).includes('vanilla hytale servers')) {
    ideas.unshift('vanilla Hytale servers');
  }

  return dedupeKeywords(ideas);
}

export interface ArticleEditorialBrief {
  primaryKeyword: string | null;
  supportingKeywords: string[];
  requiredBodyRoutes: string[];
  naturalHomepageAnchorIdeas: string[];
}

export function buildArticleEditorialBrief(
  record: Pick<QueueRecord, 'familyId' | 'title' | 'seoPrimaryKeyword' | 'relatedRouteTargets'>,
): ArticleEditorialBrief {
  const primaryKeyword = record.seoPrimaryKeyword ? normalizeWhitespace(record.seoPrimaryKeyword) : null;

  return {
    primaryKeyword,
    supportingKeywords: buildSupportingKeywords(primaryKeyword, record.familyId),
    requiredBodyRoutes: buildRequiredBodyRoutes(record.relatedRouteTargets),
    naturalHomepageAnchorIdeas: buildNaturalHomepageAnchorIdeas(primaryKeyword ?? record.title),
  };
}
