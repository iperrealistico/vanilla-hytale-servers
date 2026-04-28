import test from 'node:test';
import assert from 'node:assert/strict';

import { buildBlueprintImagePrompt, renderImageWorkSidecar } from '@/lib/content-ops/image-work';
import { getContentOpsPaths } from '@/lib/content-ops/paths';
import { QueueRecordSchema } from '@/lib/content-ops/discovery/schema';

test('buildBlueprintImagePrompt enforces the Hytale blueprint palette and redraw rule', () => {
  const record = QueueRecordSchema.parse({
    candidateId: 'official-update-briefing:test',
    queueId: 'title-0999',
    queueIndex: 999,
    rawTitleLineNumber: null,
    familyId: 'official-update-briefing',
    title: 'What Update 5 Means for Vanilla-first Hytale Servers and Mods',
    titleLocked: true,
    workflowStatus: 'queued',
    articleSlug: null,
    draftPath: null,
    lastRunOutcome: null,
    sourceRefs: [
      {
        sourceKey: 'https://hytale.com/news/example',
        sourceKind: 'hytale-news-post',
        canonicalUrl: 'https://hytale.com/news/example',
        title: 'PRE-RELEASE PATCH NOTES (UPDATE 5)',
        author: 'Hytale Team',
        excerpt: 'Patch-note summary',
        imageUrl: 'https://cdn.example.com/update5.png',
        snapshotPath: '/tmp/source.html',
        guidelineImagePath: '/tmp/update5.png',
        publishedAt: 'April 2, 2026',
        updatedAt: 'April 16, 2026',
      },
    ],
    sourceRevisionRefs: [],
    sourceFingerprint: 'hytale-news:https://hytale.com/news/example#abc',
    noveltyFingerprint: 'official-update-briefing:test',
    whyNow: 'Fresh official update.',
    angleSummary: 'Broaden the patch notes into server stability and mod ecosystem implications.',
    seoPrimaryKeyword: 'update 5 vanilla hytale servers',
    seoIntent: 'informational',
    relatedRouteTargets: ['/#servers', '/blog', '/#methodology'],
    duplicateCheckSummary: {
      decision: 'accepted',
      overlapScore: 0.2,
      sourceReuse: false,
      matchedPublishedSlugs: [],
      matchedCandidateIds: [],
      reasoning: 'Distinct enough.',
    },
    suppressionReason: null,
    publishedSlug: null,
    createdAt: '2026-04-27T12:00:00.000Z',
    updatedAt: '2026-04-27T12:00:00.000Z',
  });

  const prompt = buildBlueprintImagePrompt(record, 'cover');

  assert.match(prompt, /#4560a9/);
  assert.match(prompt, /#70afdb/);
  assert.match(prompt, /blueprint/i);
  assert.match(prompt, /Redraw every visible element from scratch/i);
  assert.match(prompt, /raster bitmap illustration/i);
  assert.match(prompt, /not an SVG/i);
  assert.match(prompt, /Do not keep original logos, UI text, watermarks, screenshots/i);
});

test('renderImageWorkSidecar includes scraped reference paths and the blueprint prompt', () => {
  const record = QueueRecordSchema.parse({
    candidateId: 'mod-scene-radar:test',
    queueId: 'title-0101',
    queueIndex: 101,
    rawTitleLineNumber: null,
    familyId: 'mod-scene-radar',
    title: 'Best Furniture & Decoration Hytale Mods This Month for Vanilla-first Worlds',
    titleLocked: true,
    workflowStatus: 'drafted',
    articleSlug: 'best-furniture-decoration-hytale-mods-this-month-for-vanilla-first-worlds',
    draftPath: '/tmp/draft.mdx',
    lastRunOutcome: null,
    sourceRefs: [
      {
        sourceKey: 'https://www.curseforge.com/hytale/mods/more-vanilla-furnitures',
        sourceKind: 'curseforge-mod',
        canonicalUrl: 'https://www.curseforge.com/hytale/mods/more-vanilla-furnitures',
        title: 'More Vanilla Furnitures',
        author: 'Gueridon',
        excerpt: 'Adds more craftable vanilla furnitures',
        imageUrl: 'https://static.curseforge.com/hytale/mods/more-vanilla-furnitures/cover.png',
        snapshotPath: '/tmp/mod.html',
        guidelineImagePath: '/tmp/mod-cover.png',
        publishedAt: 'February 18, 2026',
        updatedAt: 'April 25, 2026',
      },
    ],
    sourceRevisionRefs: [],
    sourceFingerprint: 'curseforge-theme:2026-04:furniture-decoration:1456697',
    noveltyFingerprint: 'mod-scene-radar:test',
    whyNow: 'Fresh theme cluster.',
    angleSummary: 'Connect the current mod theme to vanilla-first worldbuilding and the latest Hytale update.',
    seoPrimaryKeyword: 'best furniture decoration hytale mods',
    seoIntent: 'informational',
    relatedRouteTargets: ['/#servers', '/blog'],
    duplicateCheckSummary: {
      decision: 'accepted',
      overlapScore: 0.18,
      sourceReuse: false,
      matchedPublishedSlugs: [],
      matchedCandidateIds: [],
      reasoning: 'Distinct enough.',
    },
    suppressionReason: null,
    publishedSlug: null,
    createdAt: '2026-04-27T12:00:00.000Z',
    updatedAt: '2026-04-27T12:00:00.000Z',
  });

  const sidecar = renderImageWorkSidecar({
    paths: getContentOpsPaths('/tmp/workspace'),
    record,
    slug: 'best-furniture-decoration-hytale-mods-this-month-for-vanilla-first-worlds',
    slot: 'cover',
  });

  assert.match(sidecar, /\/tmp\/mod-cover\.png/);
  assert.match(sidecar, /never publish scraped source images directly/i);
  assert.match(sidecar, /built-in `imagegen` skill/i);
  assert.match(sidecar, /do not satisfy this asset with hand-assembled SVG/i);
  assert.match(sidecar, /final deliverable must be a raster file/i);
  assert.match(sidecar, /## Blueprint Prompt/);
});
