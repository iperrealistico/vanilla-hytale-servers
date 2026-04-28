import type { DiscoveryFamily } from '@/lib/content-ops/discovery/families/types';
import { evaluateCandidateDuplication } from '@/lib/content-ops/discovery/dedupe';
import { buildModScenePrimaryKeyword } from '@/lib/content-ops/editorialSeo';
import {
  buildCurseforgeThemeMonthKey,
  parseCurseforgeHomePage,
  parseCurseforgeModDetailPage,
} from '@/lib/content-ops/discovery/parsers/curseforge';
import { parseHytaleArticlePage, parseHytaleNewsIndex } from '@/lib/content-ops/discovery/parsers/hytale';
import type {
  SourceLedgerRecord,
  SuppressionLogRecord,
  TitleCandidateRecord,
} from '@/lib/content-ops/discovery/schema';
import { headlineCase, shortHash, slugify } from '@/lib/content-ops/discovery/text';

function isFreshEnough(updatedAt: string | null, nowIso: string) {
  if (!updatedAt) {
    return false;
  }

  const now = new Date(nowIso).getTime();
  const updated = new Date(updatedAt).getTime();
  if (Number.isNaN(updated)) {
    return /day|week/i.test(updatedAt);
  }

  const ageDays = (now - updated) / (1000 * 60 * 60 * 24);
  return ageDays <= 40;
}

function buildThemeTitle(themeName: string, latestNewsTitle: string | null) {
  if (latestNewsTitle && /update|patch/i.test(latestNewsTitle)) {
    return headlineCase(`best ${themeName.toLowerCase()} hytale mods this month after ${latestNewsTitle.toLowerCase()}`);
  }

  return headlineCase(`best ${themeName.toLowerCase()} hytale mods this month for vanilla-first worlds`);
}

export const modSceneRadarFamily: DiscoveryFamily = {
  id: 'mod-scene-radar',
  label: 'Monthly Mod Radar',
  async discover(context) {
    const sourceLedger: SourceLedgerRecord[] = [];
    const suppressionLog: SuppressionLogRecord[] = [];
    const candidates: TitleCandidateRecord[] = [];

    const homeSource = await context.fetcher.fetchHtml({
      familyId: context.familyId,
      sourceKey: 'curseforge-hytale-home',
      url: 'https://www.curseforge.com/hytale',
    });

    if (!homeSource.body) {
      suppressionLog.push({
        suppressionId: `${context.familyId}:blocked:${context.nowIso}`,
        familyId: context.familyId,
        candidateId: null,
        title: 'CurseForge Hytale homepage unavailable',
        sourceFingerprint: null,
        noveltyFingerprint: null,
        reasonCategory: 'blocked-source',
        reason: homeSource.blockedReason ?? 'CurseForge homepage could not be fetched.',
        comparedAgainst: [],
        createdAt: context.nowIso,
      });
      return { candidates, sourceLedger, suppressionLog };
    }

    const parsedHome = parseCurseforgeHomePage(homeSource.body);
    const themeName = parsedHome.monthlyThemeName;
    const themeCards = parsedHome.monthlyThemeCards.slice(0, 4);
    const fallbackCards = parsedHome.featuredCards.length > 0 ? parsedHome.featuredCards.slice(0, 4) : parsedHome.latestCards.slice(0, 4);
    const selectedCards = themeCards.length > 0 ? themeCards : fallbackCards;

    if (selectedCards.length === 0) {
      suppressionLog.push({
        suppressionId: `${context.familyId}:empty:${context.nowIso}`,
        familyId: context.familyId,
        candidateId: null,
        title: 'No notable CurseForge Hytale mods found',
        sourceFingerprint: null,
        noveltyFingerprint: null,
        reasonCategory: 'no-fresh-signal',
        reason: 'No monthly theme, featured cluster, or fresh latest-mod cluster was available for article discovery.',
        comparedAgainst: [],
        createdAt: context.nowIso,
      });
      return { candidates, sourceLedger, suppressionLog };
    }

    const modDetails = [];
    for (const card of selectedCards) {
      const detailSource = await context.fetcher.fetchHtml({
        familyId: context.familyId,
        sourceKey: card.canonicalUrl,
        url: card.canonicalUrl,
      });

      if (!detailSource.body) {
        continue;
      }

      const detail = parseCurseforgeModDetailPage(detailSource.body, card.canonicalUrl);
      const guidelineImagePath = detail.heroImageUrl
        ? await context.fetcher.downloadGuidelineImage({
            familyId: context.familyId,
            sourceKey: card.canonicalUrl,
            imageUrl: detail.heroImageUrl,
          })
        : null;

      sourceLedger.push({
        sourceKey: card.canonicalUrl,
        familyId: context.familyId,
        canonicalUrl: card.canonicalUrl,
        title: detail.title || card.title,
        author: detail.author ?? card.author,
        latestRevisionKey: detail.updatedAt ?? card.updatedAt ?? context.nowIso,
        latestContentHash: shortHash(detail.description || detail.summary || card.summary),
        latestPublishedAt: detail.createdAt,
        latestUpdatedAt: detail.updatedAt ?? card.updatedAt,
        snapshotPath: detailSource.snapshotPath,
        guidelineImagePath,
        firstSeenAt: context.nowIso,
        lastSeenAt: context.nowIso,
        status: detailSource.sourceMode === 'live' ? 'active' : 'snapshot-only',
        notes: null,
      });

      modDetails.push({
        ...card,
        detail,
        guidelineImagePath,
        snapshotPath: detailSource.snapshotPath,
      });
    }

    const freshMods = modDetails.filter((entry) => themeName || isFreshEnough(entry.detail.updatedAt ?? entry.updatedAt, context.nowIso));

    if (freshMods.length === 0) {
      suppressionLog.push({
        suppressionId: `${context.familyId}:stale:${context.nowIso}`,
        familyId: context.familyId,
        candidateId: null,
        title: themeName ? `${themeName} theme cluster` : 'CurseForge fallback cluster',
        sourceFingerprint: null,
        noveltyFingerprint: null,
        reasonCategory: 'stale-source',
        reason: 'Available mods were stale and not prominently featured enough to justify a new article today.',
        comparedAgainst: modDetails.map((entry) => entry.detail.projectId ?? entry.canonicalUrl),
        createdAt: context.nowIso,
      });
      return { candidates, sourceLedger, suppressionLog };
    }

    const newsIndexSource = await context.fetcher.fetchHtml({
      familyId: context.familyId,
      sourceKey: 'hytale-news-index',
      url: 'https://hytale.com/news',
    });
    let latestRelevantNewsTitle: string | null = null;
    let latestRelevantNewsRef: TitleCandidateRecord['sourceRefs'][number] | null = null;

    if (newsIndexSource.body) {
      const latestEntry = parseHytaleNewsIndex(newsIndexSource.body).at(0);
      if (latestEntry) {
        const latestArticleSource = await context.fetcher.fetchHtml({
          familyId: context.familyId,
          sourceKey: latestEntry.canonicalUrl,
          url: latestEntry.canonicalUrl,
        });
        if (latestArticleSource.body) {
          const article = parseHytaleArticlePage(latestArticleSource.body, latestEntry.canonicalUrl);
          if (/mod|creative|builder|tool|update|patch/i.test(article.title + ' ' + article.bodyText)) {
            const guidelineImagePath = article.heroImageUrl
              ? await context.fetcher.downloadGuidelineImage({
                  familyId: context.familyId,
                  sourceKey: article.canonicalUrl,
                  imageUrl: article.heroImageUrl,
                })
              : null;
            latestRelevantNewsTitle = article.title;
            latestRelevantNewsRef = {
              sourceKey: article.canonicalUrl,
              sourceKind: 'hytale-news-post',
              canonicalUrl: article.canonicalUrl,
              title: article.title,
              author: article.author,
              excerpt: article.excerpt,
              imageUrl: article.heroImageUrl,
              snapshotPath: latestArticleSource.snapshotPath,
              guidelineImagePath,
              publishedAt: article.publishedAt,
              updatedAt: article.latestRevisionDate,
            };
          }
        }
      }
    }

    const themeLabel = themeName ?? 'featured hytale mods';
    const monthKey = buildCurseforgeThemeMonthKey(themeLabel, context.nowIso);
    const modClusterKey = freshMods
      .map((entry) => entry.detail.projectId ?? slugify(entry.title))
      .sort()
      .join(',');
    const sourceFingerprint = `curseforge-theme:${monthKey}:${modClusterKey}`;
    const title = buildThemeTitle(themeLabel, latestRelevantNewsTitle);
    const noveltyFingerprint = `mod-scene-radar:${slugify(title)}:${slugify(themeLabel)}`;
    const seoPrimaryKeyword = buildModScenePrimaryKeyword(themeLabel);

    const duplicateCheckSummary = evaluateCandidateDuplication({
      candidate: {
        candidateId: `${context.familyId}:${shortHash(sourceFingerprint)}`,
        title,
        angleSummary: `Use ${themeLabel} as the main hook, then connect the freshest relevant Hytale update to vanilla-first building, SMPs, and server-side culture.`,
        seoPrimaryKeyword,
        sourceFingerprint,
        noveltyFingerprint,
        familyId: context.familyId,
        relatedRouteTargets: ['/#servers', '/blog'],
        sourceRefs: freshMods.map((entry) => ({ title: entry.detail.title, canonicalUrl: entry.canonicalUrl })),
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
      return { candidates, sourceLedger, suppressionLog };
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
          sourceKey: 'curseforge-hytale-home',
          sourceKind: themeName ? 'curseforge-monthly-theme' : 'curseforge-featured-cluster',
          canonicalUrl: 'https://www.curseforge.com/hytale',
          title: themeName ? `Monthly Theme - ${themeName}` : 'CurseForge Hytale featured cluster',
          author: null,
          excerpt: `Detected ${freshMods.length} fresh mods from the ${themeLabel} cluster.`,
          imageUrl: null,
          snapshotPath: homeSource.snapshotPath,
          guidelineImagePath: null,
          publishedAt: null,
          updatedAt: context.nowIso.slice(0, 10),
        },
        ...freshMods.map((entry) => ({
          sourceKey: entry.canonicalUrl,
          sourceKind: 'curseforge-mod',
          canonicalUrl: entry.canonicalUrl,
          title: entry.detail.title,
          author: entry.detail.author,
          excerpt: entry.detail.summary,
          imageUrl: entry.detail.heroImageUrl,
          snapshotPath: entry.snapshotPath,
          guidelineImagePath: entry.guidelineImagePath,
          publishedAt: entry.detail.createdAt,
          updatedAt: entry.detail.updatedAt,
        })),
        ...(latestRelevantNewsRef ? [latestRelevantNewsRef] : []),
      ],
      sourceRevisionRefs: [
        {
          sourceKey: 'curseforge-hytale-home',
          revisionKey: monthKey,
          contentHash: shortHash(modClusterKey),
          revisionLabel: themeName ?? 'featured-cluster',
          observedAt: context.nowIso,
          publishedAt: null,
          updatedAt: context.nowIso.slice(0, 10),
        },
      ],
      sourceFingerprint,
      noveltyFingerprint,
      whyNow: themeName
        ? `CurseForge is currently featuring "${themeName}" and the cluster still contains fresh or prominently featured mods worth translating for vanilla-first readers.`
        : 'CurseForge is not showing a monthly theme, but the freshest featured/latest Hytale mod cluster contains timely signals worth covering.',
      angleSummary: latestRelevantNewsTitle
        ? `Use ${themeLabel} as the mod hook, then explain how ${latestRelevantNewsTitle} may intersect with builders, vanilla-first server communities, and mod-curious players.`
        : `Use ${themeLabel} as the main hook, then translate the standout mods into practical guidance for vanilla-first readers, builders, and server communities.`,
      seoPrimaryKeyword,
      seoIntent: 'informational',
      relatedRouteTargets: ['/#servers', '/blog'],
      duplicateCheckSummary,
      suppressionReason: null,
      publishedSlug: null,
      createdAt: context.nowIso,
      updatedAt: context.nowIso,
    });

    return { candidates, sourceLedger, suppressionLog };
  },
};
