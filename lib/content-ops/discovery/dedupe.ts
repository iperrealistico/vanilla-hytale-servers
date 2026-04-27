import { getAllArticles } from '@/lib/articles/content';
import type { ArticleEntry } from '@/lib/articles/content';
import type {
  DuplicateCheckSummary,
  QueueRecord,
  SourceConsumptionRecord,
  TitleCandidateRecord,
} from '@/lib/content-ops/discovery/schema';
import { jaccardSimilarity, normalizeWhitespace, shortHash, tokenize, unique } from '@/lib/content-ops/discovery/text';

export interface CandidateDuplicateProbe {
  candidateId: string;
  title: string;
  angleSummary: string;
  seoPrimaryKeyword: string;
  sourceFingerprint: string;
  noveltyFingerprint: string;
  familyId: string;
  relatedRouteTargets: string[];
  sourceRefs: Array<{ title: string; canonicalUrl: string }>;
}

export interface RecentPublishedArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
}

export function getRecentPublishedArticles(limit = 10): RecentPublishedArticle[] {
  return getAllArticles()
    .filter((article) => article.frontmatter.workflowStatus === 'published' && !article.frontmatter.noindex)
    .slice(0, limit)
    .map((article) => mapArticle(article));
}

function mapArticle(article: ArticleEntry): RecentPublishedArticle {
  return {
    slug: article.slug,
    title: article.frontmatter.title,
    excerpt: article.frontmatter.excerpt,
    category: article.frontmatter.category,
    tags: article.frontmatter.tags,
  };
}

function buildComparisonTokens(value: {
  title: string;
  angleSummary: string;
  seoPrimaryKeyword: string;
  tags?: string[];
  relatedRouteTargets?: string[];
}) {
  return unique(
    tokenize(
      [
        value.title,
        value.angleSummary,
        value.seoPrimaryKeyword,
        (value.tags ?? []).join(' '),
        (value.relatedRouteTargets ?? []).join(' '),
      ]
        .filter(Boolean)
        .join(' '),
    ),
  );
}

export function evaluateCandidateDuplication(options: {
  candidate: CandidateDuplicateProbe;
  recentPublished: RecentPublishedArticle[];
  existingCandidates: Array<Pick<TitleCandidateRecord, 'candidateId' | 'title' | 'angleSummary' | 'seoPrimaryKeyword' | 'sourceFingerprint' | 'noveltyFingerprint' | 'workflowStatus'>>;
  queueRecords: Array<Pick<QueueRecord, 'candidateId' | 'queueId' | 'title' | 'angleSummary' | 'seoPrimaryKeyword' | 'sourceFingerprint' | 'workflowStatus'>>;
  sourceConsumption: SourceConsumptionRecord[];
}): DuplicateCheckSummary {
  const { candidate, recentPublished, existingCandidates, queueRecords, sourceConsumption } = options;

  const exactSourceReuse =
    sourceConsumption.some((record) => record.sourceFingerprint === candidate.sourceFingerprint) ||
    existingCandidates.some(
      (record) =>
        record.candidateId !== candidate.candidateId &&
        record.sourceFingerprint === candidate.sourceFingerprint &&
        !['suppressed', 'stale', 'blocked'].includes(record.workflowStatus),
    ) ||
    queueRecords.some(
      (record) =>
        record.candidateId !== candidate.candidateId &&
        record.sourceFingerprint === candidate.sourceFingerprint &&
        !['blocked'].includes(record.workflowStatus),
    );

  if (exactSourceReuse) {
    return {
      decision: 'suppressed',
      overlapScore: 1,
      sourceReuse: true,
      matchedPublishedSlugs: [],
      matchedCandidateIds: existingCandidates
        .filter((record) => record.sourceFingerprint === candidate.sourceFingerprint)
        .map((record) => record.candidateId),
      reasoning: 'Exact source fingerprint already exists in consumption history, queue state, or discovery ledger.',
    };
  }

  const candidateTokens = buildComparisonTokens(candidate);
  const matchedPublishedSlugs: string[] = [];
  const matchedCandidateIds: string[] = [];
  let maxOverlap = 0;
  let strongestReason = 'Candidate is distinct from recent published articles and queued work.';

  for (const article of recentPublished) {
    if (normalizeWhitespace(article.title).toLowerCase() === normalizeWhitespace(candidate.title).toLowerCase()) {
      return {
        decision: 'suppressed',
        overlapScore: 1,
        sourceReuse: false,
        matchedPublishedSlugs: [article.slug],
        matchedCandidateIds: [],
        reasoning: `Recent article "${article.slug}" already uses the same title promise.`,
      };
    }

    const articleTokens = buildComparisonTokens({
      title: article.title,
      angleSummary: article.excerpt,
      seoPrimaryKeyword: article.tags.join(' '),
      tags: article.tags,
    });
    const overlap = jaccardSimilarity(candidateTokens, articleTokens);
    maxOverlap = Math.max(maxOverlap, overlap);

    if (overlap >= 0.68) {
      matchedPublishedSlugs.push(article.slug);
      strongestReason = `Recent article "${article.slug}" overlaps too closely in title promise, angle, and keyword space.`;
    }
  }

  for (const record of existingCandidates) {
    if (record.candidateId === candidate.candidateId) {
      continue;
    }

    const candidateRecordTokens = buildComparisonTokens({
      title: record.title,
      angleSummary: record.angleSummary,
      seoPrimaryKeyword: record.seoPrimaryKeyword,
    });
    const overlap = jaccardSimilarity(candidateTokens, candidateRecordTokens);
    maxOverlap = Math.max(maxOverlap, overlap);

    if (overlap >= 0.72 && !['suppressed', 'stale', 'blocked'].includes(record.workflowStatus)) {
      matchedCandidateIds.push(record.candidateId);
      strongestReason = `Existing discovery candidate "${record.candidateId}" already covers the same reader promise.`;
    }
  }

  for (const record of queueRecords) {
    const queueTokens = buildComparisonTokens({
      title: record.title,
      angleSummary: record.angleSummary ?? '',
      seoPrimaryKeyword: record.seoPrimaryKeyword ?? '',
    });
    const overlap = jaccardSimilarity(candidateTokens, queueTokens);
    maxOverlap = Math.max(maxOverlap, overlap);

    if (overlap >= 0.72 && !['blocked'].includes(record.workflowStatus)) {
      matchedCandidateIds.push(record.candidateId ?? record.queueId);
      strongestReason = `Existing queue record "${record.queueId}" already covers the same reader promise.`;
    }
  }

  const borderline = maxOverlap >= 0.55;
  const sameVanillaServerPromise =
    normalizeWhitespace(candidate.title).toLowerCase().includes('vanilla') &&
    normalizeWhitespace(candidate.title).toLowerCase().includes('server');

  if (matchedPublishedSlugs.length > 0 || matchedCandidateIds.length > 0) {
    return {
      decision: 'suppressed',
      overlapScore: Number(maxOverlap.toFixed(3)),
      sourceReuse: false,
      matchedPublishedSlugs: unique(matchedPublishedSlugs),
      matchedCandidateIds: unique(matchedCandidateIds),
      reasoning: strongestReason,
    };
  }

  if (borderline && sameVanillaServerPromise) {
    return {
      decision: 'borderline',
      overlapScore: Number(maxOverlap.toFixed(3)),
      sourceReuse: false,
      matchedPublishedSlugs: [],
      matchedCandidateIds: [],
      reasoning: 'Borderline overlap detected, but the angle may still be valid if the evidence bundle and audience promise are genuinely different.',
    };
  }

  return {
    decision: 'accepted',
    overlapScore: Number(maxOverlap.toFixed(3)),
    sourceReuse: false,
    matchedPublishedSlugs: [],
    matchedCandidateIds: [],
    reasoning: `Novelty fingerprint ${shortHash(candidate.noveltyFingerprint)} is sufficiently distinct from the recent article set.`,
  };
}
