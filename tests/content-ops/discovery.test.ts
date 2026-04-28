import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { evaluateCandidateDuplication } from '@/lib/content-ops/discovery/dedupe';
import { discoverTitles } from '@/lib/content-ops/discovery/engine';
import { modSceneRadarFamily } from '@/lib/content-ops/discovery/families/modSceneRadar';
import type { SourceFetcher } from '@/lib/content-ops/discovery/fetcher';
import { getContentOpsPaths } from '@/lib/content-ops/paths';
import { readDiscoveryState } from '@/lib/content-ops/discovery/state';

const fixture = (...segments: string[]) => path.join(process.cwd(), 'tests', 'fixtures', 'discovery', ...segments);

function createTempPaths() {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'vhs-discovery-'));
  return getContentOpsPaths(workspaceRoot);
}

function fixtureFetcher(map: Record<string, string>): SourceFetcher {
  return {
    async fetchHtml({ url }) {
      const body = map[url] ?? null;
      return {
        canonicalUrl: url,
        body,
        fetchedAt: '2026-04-27T10:00:00.000Z',
        sourceMode: body ? 'live' : 'blocked',
        snapshotPath: null,
        blockedReason: body ? null : 'fixture missing',
        statusCode: body ? 200 : 404,
      };
    },
    async downloadGuidelineImage() {
      return null;
    },
  };
}

test('exact source reuse suppresses a candidate immediately', () => {
  const summary = evaluateCandidateDuplication({
    candidate: {
      candidateId: 'candidate-a',
      title: 'What Update 5 Means for Vanilla-First Hytale Servers and Mods',
      angleSummary: 'Broaden the patch-notes story for vanilla-first readers.',
      seoPrimaryKeyword: 'update 5 vanilla hytale servers',
      sourceFingerprint: 'hytale-news:https://hytale.com/news/2026/4/example#abc',
      noveltyFingerprint: 'fingerprint-a',
      familyId: 'official-update-briefing',
      relatedRouteTargets: ['/servers', '/guides'],
      sourceRefs: [{ title: 'Update 5', canonicalUrl: 'https://hytale.com/news/2026/4/example' }],
    },
    recentPublished: [],
    existingCandidates: [],
    queueRecords: [],
    sourceConsumption: [
      {
        consumptionId: 'c1',
        candidateId: 'published-a',
        queueId: 'title-0001',
        familyId: 'official-update-briefing',
        articleSlug: 'published-slug',
        title: 'Published',
        sourceFingerprint: 'hytale-news:https://hytale.com/news/2026/4/example#abc',
        noveltyFingerprint: 'fingerprint-old',
        sourceRefs: [],
        sourceRevisionRefs: [],
        consumedAt: '2026-04-20T10:00:00.000Z',
        publishedAt: '2026-04-20',
      },
    ],
  });

  assert.equal(summary.decision, 'suppressed');
  assert.equal(summary.sourceReuse, true);
});

test('same URL with a new revision can refresh the same candidate without suppressing itself', () => {
  const firstPass = evaluateCandidateDuplication({
    candidate: {
      candidateId: 'candidate-b',
      title: 'What Update 5 Means for Vanilla-First Hytale Servers and Mods',
      angleSummary: 'Broaden the patch-notes story for vanilla-first readers.',
      seoPrimaryKeyword: 'update 5 vanilla hytale servers',
      sourceFingerprint: 'hytale-news:https://hytale.com/news/2026/4/example#newrev',
      noveltyFingerprint: 'fingerprint-b',
      familyId: 'official-update-briefing',
      relatedRouteTargets: ['/servers', '/guides'],
      sourceRefs: [{ title: 'Update 5', canonicalUrl: 'https://hytale.com/news/2026/4/example' }],
    },
    recentPublished: [],
    existingCandidates: [],
    queueRecords: [],
    sourceConsumption: [
      {
        consumptionId: 'old',
        candidateId: 'published-old',
        queueId: 'title-0001',
        familyId: 'official-update-briefing',
        articleSlug: 'published-old',
        title: 'Old revision',
        sourceFingerprint: 'hytale-news:https://hytale.com/news/2026/4/example#oldrev',
        noveltyFingerprint: 'old',
        sourceRefs: [],
        sourceRevisionRefs: [],
        consumedAt: '2026-04-20T10:00:00.000Z',
        publishedAt: '2026-04-20',
      },
    ],
  });

  assert.equal(firstPass.decision, 'accepted');

  const secondPass = evaluateCandidateDuplication({
    candidate: {
      candidateId: 'candidate-b',
      title: 'What Update 5 Means for Vanilla-First Hytale Servers and Mods',
      angleSummary: 'Broaden the patch-notes story for vanilla-first readers.',
      seoPrimaryKeyword: 'update 5 vanilla hytale servers',
      sourceFingerprint: 'hytale-news:https://hytale.com/news/2026/4/example#newrev',
      noveltyFingerprint: 'fingerprint-b',
      familyId: 'official-update-briefing',
      relatedRouteTargets: ['/servers', '/guides'],
      sourceRefs: [{ title: 'Update 5', canonicalUrl: 'https://hytale.com/news/2026/4/example' }],
    },
    recentPublished: [],
    existingCandidates: [
      {
        candidateId: 'candidate-b',
        title: 'What Update 5 Means for Vanilla-First Hytale Servers and Mods',
        angleSummary: 'Broaden the patch-notes story for vanilla-first readers.',
        seoPrimaryKeyword: 'update 5 vanilla hytale servers',
        sourceFingerprint: 'hytale-news:https://hytale.com/news/2026/4/example#newrev',
        noveltyFingerprint: 'fingerprint-b',
        workflowStatus: 'accepted',
      },
    ],
    queueRecords: [],
    sourceConsumption: [],
  });

  assert.equal(secondPass.decision, 'accepted');
});

test('recent published overlap suppresses near-duplicate angles', () => {
  const summary = evaluateCandidateDuplication({
    candidate: {
      candidateId: 'candidate-c',
      title: 'How to Choose a Vanilla Hytale Server if You Care About Fair Monetization',
      angleSummary: 'A close remake of the fair monetization article.',
      seoPrimaryKeyword: 'vanilla hytale server fair monetization',
      sourceFingerprint: 'different-source',
      noveltyFingerprint: 'fp-c',
      familyId: 'official-update-briefing',
      relatedRouteTargets: ['/servers'],
      sourceRefs: [{ title: 'Different source', canonicalUrl: 'https://example.com' }],
    },
    recentPublished: [
      {
        slug: 'how-to-choose-a-vanilla-hytale-server-if-you-care-about-fair-monetization',
        title: 'How to Choose a Vanilla Hytale Server if You Care About Fair Monetization',
        excerpt: 'Learn how to evaluate monetization, convenience perks, and rule language.',
        category: 'server-selection',
        tags: ['vanilla-first', 'monetization', 'server selection'],
      },
    ],
    existingCandidates: [],
    queueRecords: [],
    sourceConsumption: [],
  });

  assert.equal(summary.decision, 'suppressed');
  assert.deepEqual(summary.matchedPublishedSlugs, ['how-to-choose-a-vanilla-hytale-server-if-you-care-about-fair-monetization']);
});

test('same queued title promise suppresses clone candidates even when the source fingerprint changes', () => {
  const summary = evaluateCandidateDuplication({
    candidate: {
      candidateId: 'candidate-d',
      title: 'Best Furniture & Decoration Hytale Mods This Month After Pre-release Patch Notes (update 5)',
      angleSummary: 'Translate the featured mod cluster for vanilla-first players.',
      seoPrimaryKeyword: 'best furniture decoration hytale mods',
      sourceFingerprint: 'curseforge-theme:2026-04:furniture-decoration:new-cluster',
      noveltyFingerprint:
        'mod-scene-radar:best-furniture-and-decoration-hytale-mods-this-month-after-pre-release-patch-notes-update-5:furniture-and-decoration',
      familyId: 'mod-scene-radar',
      relatedRouteTargets: ['/servers', '/guides'],
      sourceRefs: [{ title: 'Furniture & Decoration', canonicalUrl: 'https://www.curseforge.com/hytale' }],
    },
    recentPublished: [],
    existingCandidates: [],
    queueRecords: [
      {
        candidateId: 'candidate-old',
        queueId: 'title-0003',
        title: 'Best Furniture & Decoration Hytale Mods This Month After Pre-release Patch Notes (update 5)',
        angleSummary: 'Translate the featured mod cluster for vanilla-first players.',
        seoPrimaryKeyword: 'best furniture decoration hytale mods',
        sourceFingerprint: 'curseforge-theme:2026-04:furniture-decoration:old-cluster',
        workflowStatus: 'queued',
      },
    ],
    sourceConsumption: [],
  });

  assert.equal(summary.decision, 'suppressed');
  assert.deepEqual(summary.matchedCandidateIds, ['candidate-old']);
});

test('mod-scene-radar suppresses stale fallback clusters with no fresh signal', async () => {
  const html = `<!doctype html><html><body><section><h2>Latest Mods</h2><article><a href="/hytale/mods/ancient-furniture-pack">Ancient Furniture Pack</a><p>By OldAuthor</p><p>Furniture pack for roleplay worlds.</p><p>January 10, 2025</p><p>Furniture</p></article></section></body></html>`;
  const detail = `<!doctype html><html><body><h1>Ancient Furniture Pack</h1><div class="author"><a>OldAuthor</a></div><section><h3>Details</h3><p>Created January 10, 2025</p><p>Updated January 10, 2025</p><p>Project ID 1001</p></section><section><h2>Description</h2><p>Furniture pack for roleplay worlds.</p></section></body></html>`;

  const result = await modSceneRadarFamily.discover({
    familyId: 'mod-scene-radar',
    nowIso: '2026-04-27T10:00:00.000Z',
    paths: createTempPaths(),
    fetcher: fixtureFetcher({
      'https://www.curseforge.com/hytale': html,
      'https://www.curseforge.com/hytale/mods/queryhy-http-server-query': detail,
      'https://www.curseforge.com/hytale/mods/ancient-furniture-pack': detail,
    }),
    recentPublished: [],
    queueRecords: [],
    existingCandidates: [],
    sourceLedger: [],
    sourceConsumption: [],
  });

  assert.equal(result.candidates.length, 0);
  assert.equal(result.suppressionLog[0]?.reasonCategory, 'stale-source');
});

test('mod-scene-radar carries scraped mod and news guideline images into accepted candidates', async () => {
  const homeHtml = fs.readFileSync(fixture('curseforge-home-monthly-theme.html'), 'utf8');
  const detailHtml = fs.readFileSync(fixture('curseforge-mod-detail.html'), 'utf8');
  const newsIndexHtml = fs.readFileSync(fixture('hytale-news-index.html'), 'utf8');
  const newsArticleHtml = fs.readFileSync(fixture('hytale-article-update5.html'), 'utf8');

  const fetcher: SourceFetcher = {
    async fetchHtml({ url }) {
      const map: Record<string, string> = {
        'https://www.curseforge.com/hytale': homeHtml,
        'https://www.curseforge.com/hytale/mods/more-vanilla-furnitures': detailHtml,
        'https://www.curseforge.com/hytale/mods/queryhy-http-server-query': detailHtml,
        'https://hytale.com/news': newsIndexHtml,
        'https://hytale.com/news/2026/4/hytale-pre-release-patch-notes-update-5': newsArticleHtml,
      };

      const body = map[url] ?? null;
      return {
        canonicalUrl: url,
        body,
        fetchedAt: '2026-04-27T10:00:00.000Z',
        sourceMode: body ? 'live' : 'blocked',
        snapshotPath: body ? `/tmp/${path.basename(url)}.html` : null,
        blockedReason: body ? null : 'fixture missing',
        statusCode: body ? 200 : 404,
      };
    },
    async downloadGuidelineImage({ imageUrl }) {
      return `/tmp/${path.basename(imageUrl)}`;
    },
  };

  const result = await modSceneRadarFamily.discover({
    familyId: 'mod-scene-radar',
    nowIso: '2026-04-27T10:00:00.000Z',
    paths: createTempPaths(),
    fetcher,
    recentPublished: [],
    queueRecords: [],
    existingCandidates: [],
    sourceLedger: [],
    sourceConsumption: [],
  });

  assert.equal(result.candidates.length, 1);
  const candidate = result.candidates[0];
  assert.ok(candidate);
  const modRef = candidate.sourceRefs.find((source) => source.sourceKind === 'curseforge-mod');
  const newsRef = candidate.sourceRefs.find((source) => source.sourceKind === 'hytale-news-post');

  assert.equal(modRef?.guidelineImagePath, '/tmp/cover.png');
  assert.equal(newsRef?.guidelineImagePath, '/tmp/e8d5c18c-c477-48f8-a409-26fcca2683d0.png');
});

test('discoverTitles is idempotent when the source bundle has not changed', async () => {
  const paths = createTempPaths();
  const indexHtml = fs.readFileSync(fixture('hytale-news-index.html'), 'utf8');
  const articleHtml = fs.readFileSync(fixture('hytale-article-update5.html'), 'utf8');

  fs.mkdirSync(path.dirname(paths.queuePath), { recursive: true });
  fs.writeFileSync(
    paths.queuePath,
    `${JSON.stringify({
      candidateId: null,
      queueId: 'title-0100',
      queueIndex: 1,
      rawTitleLineNumber: null,
      familyId: 'legacy-manual',
      title: 'Legacy placeholder',
      titleLocked: true,
      workflowStatus: 'blocked',
      articleSlug: null,
      draftPath: null,
      lastRunOutcome: null,
      sourceRefs: [],
      sourceRevisionRefs: [],
      sourceFingerprint: '',
      noveltyFingerprint: '',
      whyNow: null,
      angleSummary: null,
      seoPrimaryKeyword: null,
      seoIntent: null,
      relatedRouteTargets: [],
      duplicateCheckSummary: null,
      suppressionReason: null,
      publishedSlug: null,
      createdAt: null,
      updatedAt: null,
    })}\n`,
  );

  const fetcher = fixtureFetcher({
    'https://hytale.com/news': indexHtml,
    'https://hytale.com/news/2026/4/hytale-pre-release-patch-notes-update-5': articleHtml,
  });

  const first = await discoverTitles({
    familyId: 'official-update-briefing',
    paths,
    nowIso: '2026-04-27T10:00:00.000Z',
    fetcher,
  });

  const second = await discoverTitles({
    familyId: 'official-update-briefing',
    paths,
    nowIso: '2026-04-27T10:05:00.000Z',
    fetcher,
  });

  const state = readDiscoveryState(paths);
  assert.equal(state.queueRecords.filter((record) => record.workflowStatus === 'queued').length, 1);
  assert.equal(state.queueRecords.length, 2);
  assert.equal(state.candidates.length, 1);
  assert.deepEqual(first.familiesRun, ['official-update-briefing']);
  assert.deepEqual(second.familiesRun, ['official-update-briefing']);
});
