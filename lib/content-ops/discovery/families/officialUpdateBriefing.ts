import type { DiscoveryFamily } from '@/lib/content-ops/discovery/families/types';
import { evaluateCandidateDuplication } from '@/lib/content-ops/discovery/dedupe';
import { parseHytaleArticlePage, parseHytaleNewsIndex } from '@/lib/content-ops/discovery/parsers/hytale';
import { buildOfficialUpdatePrimaryKeyword } from '@/lib/content-ops/editorialSeo';
import type { DiscoveryFamilyContext } from '@/lib/content-ops/discovery/families/types';
import type {
  SourceLedgerRecord,
  SuppressionLogRecord,
  TitleCandidateRecord,
} from '@/lib/content-ops/discovery/schema';
import { headlineCase, shortHash, slugify } from '@/lib/content-ops/discovery/text';

function buildOfficialUpdateTitle(sourceTitle: string) {
  if (/patch notes|update/i.test(sourceTitle)) {
    return headlineCase(`what ${sourceTitle.toLowerCase()} means for vanilla-first hytale servers and mods`);
  }

  return headlineCase(`how ${sourceTitle.toLowerCase()} affects vanilla-first hytale servers and the wider ecosystem`);
}

function buildSourceFingerprint(url: string, revisionHash: string) {
  return `hytale-news:${url}#${revisionHash}`;
}

function buildNoveltyFingerprint(title: string, sourceTitle: string) {
  return `official-update-briefing:${slugify(title)}:${slugify(sourceTitle)}`;
}

function isRelevantOfficialUpdate(bodyText: string, title: string) {
  return /update|patch|server|mod|plugin|creative|world|builder|combat|social|tool/i.test(`${title} ${bodyText}`);
}

interface OfficialSequenceMarker {
  key: string;
  number: number;
}

interface OfficialCoverageSignal {
  label: string;
  title: string;
  canonicalUrl: string | null;
  sourceDate: string | null;
  sourceTime: number | null;
  sequence: OfficialSequenceMarker | null;
}

function parseTimelineTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

function extractOfficialSequenceMarker(title: string): OfficialSequenceMarker | null {
  const normalized = title.toLowerCase();
  const match = normalized.match(/\bupdate\s*\(?\s*(\d+)\)?\b/);
  if (!match) {
    return null;
  }

  const number = Number(match[1]);
  if (!Number.isFinite(number)) {
    return null;
  }

  if (/patch\s+notes/i.test(title)) {
    return { key: 'patch-notes-update', number };
  }

  return { key: 'update', number };
}

function collectOfficialCoverageSignals(context: DiscoveryFamilyContext): OfficialCoverageSignal[] {
  const signals: OfficialCoverageSignal[] = [];
  const seen = new Set<string>();

  const addSignal = (signal: OfficialCoverageSignal) => {
    const dedupeKey = `${signal.canonicalUrl ?? 'no-url'}::${signal.title}::${signal.sourceDate ?? 'no-date'}::${signal.label}`;
    if (seen.has(dedupeKey)) {
      return;
    }

    seen.add(dedupeKey);
    signals.push(signal);
  };

  for (const record of context.queueRecords) {
    if (record.familyId !== context.familyId || record.workflowStatus === 'blocked') {
      continue;
    }

    const officialSources = record.sourceRefs.filter((source) => source.sourceKind === 'hytale-news-post');
    if (officialSources.length === 0) {
      addSignal({
        label: record.publishedSlug ?? record.queueId,
        title: record.title,
        canonicalUrl: null,
        sourceDate: null,
        sourceTime: null,
        sequence: extractOfficialSequenceMarker(record.title),
      });
      continue;
    }

    for (const source of officialSources) {
      const sourceDate = source.publishedAt ?? source.updatedAt ?? null;
      addSignal({
        label: record.publishedSlug ?? record.queueId,
        title: source.title,
        canonicalUrl: source.canonicalUrl,
        sourceDate,
        sourceTime: parseTimelineTime(sourceDate),
        sequence: extractOfficialSequenceMarker(source.title),
      });
    }
  }

  for (const record of context.sourceConsumption) {
    if (record.familyId !== context.familyId) {
      continue;
    }

    const officialSources = record.sourceRefs.filter((source) => source.sourceKind === 'hytale-news-post');
    if (officialSources.length === 0) {
      addSignal({
        label: record.articleSlug ?? record.queueId ?? record.consumptionId,
        title: record.title,
        canonicalUrl: null,
        sourceDate: record.publishedAt,
        sourceTime: parseTimelineTime(record.publishedAt),
        sequence: extractOfficialSequenceMarker(record.title),
      });
      continue;
    }

    for (const source of officialSources) {
      const sourceDate = source.publishedAt ?? source.updatedAt ?? null;
      addSignal({
        label: record.articleSlug ?? record.queueId ?? record.consumptionId,
        title: source.title,
        canonicalUrl: source.canonicalUrl,
        sourceDate,
        sourceTime: parseTimelineTime(sourceDate),
        sequence: extractOfficialSequenceMarker(source.title),
      });
    }
  }

  for (const article of context.recentPublished) {
    if (article.category !== 'official-updates') {
      continue;
    }

    addSignal({
      label: article.slug,
      title: article.title,
      canonicalUrl: null,
      sourceDate: null,
      sourceTime: null,
      sequence: extractOfficialSequenceMarker(article.title),
    });
  }

  return signals;
}

function findOlderCoveredOfficialReason(
  article: ReturnType<typeof parseHytaleArticlePage>,
  indexEntry: ReturnType<typeof parseHytaleNewsIndex>[number],
  context: DiscoveryFamilyContext,
) {
  const signals = collectOfficialCoverageSignals(context).filter((signal) => signal.canonicalUrl !== article.canonicalUrl);
  const candidateSequence = extractOfficialSequenceMarker(article.title);
  const candidateDate = article.publishedAt ?? indexEntry.publishedAt ?? article.latestRevisionDate;
  const candidateTime = parseTimelineTime(candidateDate);

  if (candidateSequence) {
    const newerSeriesSignal = signals
      .filter(
        (signal) =>
          signal.sequence &&
          signal.sequence.key === candidateSequence.key &&
          signal.sequence.number > candidateSequence.number,
      )
      .sort((left, right) => (right.sequence?.number ?? 0) - (left.sequence?.number ?? 0))[0];

    if (newerSeriesSignal) {
      return {
        reason: `A newer official ${newerSeriesSignal.title} is already covered, so older update-line entry ${article.title} should stay suppressed.`,
        comparedAgainst: [newerSeriesSignal.label],
      };
    }
  }

  if (candidateTime !== null) {
    const newerDatedSignal = signals
      .filter((signal) => signal.sourceTime !== null && signal.sourceTime > candidateTime)
      .sort((left, right) => (right.sourceTime ?? 0) - (left.sourceTime ?? 0))[0];

    if (newerDatedSignal) {
      const newerDateLabel = newerDatedSignal.sourceDate ? ` (${newerDatedSignal.sourceDate})` : '';
      return {
        reason: `A more recent official Hytale news post${newerDateLabel} is already covered, so older entry ${article.title} should not re-enter discovery.`,
        comparedAgainst: [newerDatedSignal.label],
      };
    }
  }

  return null;
}

export const officialUpdateBriefingFamily: DiscoveryFamily = {
  id: 'official-update-briefing',
  label: 'Official Update Briefings',
  async discover(context) {
    const sourceLedger: SourceLedgerRecord[] = [];
    const suppressionLog: SuppressionLogRecord[] = [];
    const candidates: TitleCandidateRecord[] = [];

    const indexSource = await context.fetcher.fetchHtml({
      familyId: context.familyId,
      sourceKey: 'hytale-news-index',
      url: 'https://hytale.com/news',
    });

    if (!indexSource.body) {
      suppressionLog.push({
        suppressionId: `${context.familyId}:blocked:${context.nowIso}`,
        familyId: context.familyId,
        candidateId: null,
        title: 'Hytale news index unavailable',
        sourceFingerprint: null,
        noveltyFingerprint: null,
        reasonCategory: 'blocked-source',
        reason: indexSource.blockedReason ?? 'Hytale news index could not be fetched.',
        comparedAgainst: [],
        createdAt: context.nowIso,
      });
      return { candidates, sourceLedger, suppressionLog };
    }

    const entries = parseHytaleNewsIndex(indexSource.body).slice(0, 6);

    for (const entry of entries) {
      const articleSource = await context.fetcher.fetchHtml({
        familyId: context.familyId,
        sourceKey: entry.canonicalUrl,
        url: entry.canonicalUrl,
      });

      if (!articleSource.body) {
        suppressionLog.push({
          suppressionId: `${context.familyId}:blocked:${shortHash(entry.canonicalUrl)}`,
          familyId: context.familyId,
          candidateId: null,
          title: entry.title,
          sourceFingerprint: null,
          noveltyFingerprint: null,
          reasonCategory: 'blocked-source',
          reason: articleSource.blockedReason ?? `Unable to fetch ${entry.canonicalUrl}.`,
          comparedAgainst: [],
          createdAt: context.nowIso,
        });
        continue;
      }

      const article = parseHytaleArticlePage(articleSource.body, entry.canonicalUrl);
      const freshness = article.latestRevisionDate ?? article.publishedAt;
      const sourceFingerprint = buildSourceFingerprint(article.canonicalUrl, article.revisionHash);

      const guidelineImagePath = article.heroImageUrl
        ? await context.fetcher.downloadGuidelineImage({
            familyId: context.familyId,
            sourceKey: article.canonicalUrl,
            imageUrl: article.heroImageUrl,
          })
        : null;

      sourceLedger.push({
        sourceKey: article.canonicalUrl,
        familyId: context.familyId,
        canonicalUrl: article.canonicalUrl,
        title: article.title,
        author: article.author,
        latestRevisionKey: article.revisionHash,
        latestContentHash: article.revisionHash,
        latestPublishedAt: article.publishedAt,
        latestUpdatedAt: article.latestRevisionDate,
        snapshotPath: articleSource.snapshotPath,
        guidelineImagePath,
        firstSeenAt: context.nowIso,
        lastSeenAt: context.nowIso,
        status: articleSource.sourceMode === 'live' ? 'active' : 'snapshot-only',
        notes: freshness ? `Latest visible revision: ${freshness}` : null,
      });

      if (!isRelevantOfficialUpdate(article.bodyText, article.title)) {
        suppressionLog.push({
          suppressionId: `${context.familyId}:irrelevant:${shortHash(article.canonicalUrl)}`,
          familyId: context.familyId,
          candidateId: null,
          title: article.title,
          sourceFingerprint,
          noveltyFingerprint: buildNoveltyFingerprint(article.title, article.title),
          reasonCategory: 'low-relevance',
          reason: 'Official post does not appear relevant to vanilla-first server selection, operators, or mod users.',
          comparedAgainst: [],
          createdAt: context.nowIso,
        });
        continue;
      }

      const olderCoveredReason = findOlderCoveredOfficialReason(article, entry, context);
      if (olderCoveredReason) {
        suppressionLog.push({
          suppressionId: `${context.familyId}:older-covered:${shortHash(article.canonicalUrl)}`,
          familyId: context.familyId,
          candidateId: null,
          title: article.title,
          sourceFingerprint,
          noveltyFingerprint: buildNoveltyFingerprint(article.title, article.title),
          reasonCategory: 'stale-source',
          reason: olderCoveredReason.reason,
          comparedAgainst: olderCoveredReason.comparedAgainst,
          createdAt: context.nowIso,
        });
        continue;
      }

      const title = buildOfficialUpdateTitle(article.title);
      const noveltyFingerprint = buildNoveltyFingerprint(title, article.title);
      const seoPrimaryKeyword = buildOfficialUpdatePrimaryKeyword(article.title);
      const duplicateCheckSummary = evaluateCandidateDuplication({
        candidate: {
          candidateId: `${context.familyId}:${shortHash(sourceFingerprint)}`,
          title,
          angleSummary: `Translate ${article.title} into a broader vanilla-first Hytale server, SMP, and mod ecosystem brief.`,
          seoPrimaryKeyword,
          sourceFingerprint,
          noveltyFingerprint,
          familyId: context.familyId,
          relatedRouteTargets: ['/#servers', '/blog', '/#methodology'],
          sourceRefs: [{ title: article.title, canonicalUrl: article.canonicalUrl }],
        },
        recentPublished: context.recentPublished,
        existingCandidates: context.existingCandidates,
        queueRecords: context.queueRecords,
        sourceConsumption: context.sourceConsumption,
      });

      if (duplicateCheckSummary.decision === 'suppressed') {
        suppressionLog.push({
          suppressionId: `${context.familyId}:duplicate:${shortHash(sourceFingerprint)}`,
          familyId: context.familyId,
          candidateId: null,
          title,
          sourceFingerprint,
          noveltyFingerprint,
          reasonCategory: duplicateCheckSummary.sourceReuse ? 'duplicate-source' : 'duplicate-angle',
          reason: duplicateCheckSummary.reasoning,
          comparedAgainst: [...duplicateCheckSummary.matchedPublishedSlugs, ...duplicateCheckSummary.matchedCandidateIds],
          createdAt: context.nowIso,
        });
        continue;
      }

      candidates.push({
        candidateId: `${context.familyId}:${shortHash(sourceFingerprint)}`,
        queueId: null,
        familyId: context.familyId,
        title,
        titleLocked: true,
        workflowStatus: 'accepted',
        articleSlug: null,
        sourceRefs: [
          {
            sourceKey: article.canonicalUrl,
            sourceKind: 'hytale-news-post',
            canonicalUrl: article.canonicalUrl,
            title: article.title,
            author: article.author,
            excerpt: article.excerpt,
            imageUrl: article.heroImageUrl,
            snapshotPath: articleSource.snapshotPath,
            guidelineImagePath,
            publishedAt: article.publishedAt,
            updatedAt: article.latestRevisionDate,
          },
        ],
        sourceRevisionRefs: [
          {
            sourceKey: article.canonicalUrl,
            revisionKey: article.revisionHash,
            contentHash: article.revisionHash,
            revisionLabel: article.latestRevisionDate,
            observedAt: context.nowIso,
            publishedAt: article.publishedAt,
            updatedAt: article.latestRevisionDate,
          },
        ],
        sourceFingerprint,
        noveltyFingerprint,
        whyNow: freshness
          ? `Latest official Hytale blog revision visible on ${freshness}; this is the newest unconsumed official update with server and mod ecosystem implications.`
          : 'Latest official Hytale blog update with clear relevance to vanilla-first players and server operators.',
        angleSummary: `Reframe ${article.title} for vanilla-first Hytale readers by widening the story from patch notes into server stability, community expectations, and mod ecosystem implications.`,
        seoPrimaryKeyword,
        seoIntent: 'informational',
        relatedRouteTargets: ['/#servers', '/blog', '/#methodology'],
        duplicateCheckSummary,
        suppressionReason: null,
        publishedSlug: null,
        createdAt: context.nowIso,
        updatedAt: context.nowIso,
      });

      break;
    }

    return { candidates, sourceLedger, suppressionLog };
  },
};
