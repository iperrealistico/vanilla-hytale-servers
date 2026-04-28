import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildArticleEditorialBrief,
  buildModScenePrimaryKeyword,
  buildOfficialUpdatePrimaryKeyword,
  homepageServerListRoute,
} from '@/lib/content-ops/editorialSeo';

test('official-update primary keywords keep the vanilla hytale servers phrase', () => {
  const keyword = buildOfficialUpdatePrimaryKeyword('PRE-RELEASE PATCH NOTES (UPDATE 5)');
  assert.equal(keyword, 'what pre-release patch notes (update 5) means for vanilla hytale servers');
});

test('mod-scene primary keywords keep the vanilla hytale servers phrase', () => {
  const keyword = buildModScenePrimaryKeyword('Furniture & Decoration');
  assert.equal(keyword, 'best furniture & decoration hytale mods for vanilla hytale servers');
});

test('article editorial brief requires the homepage server-list route and supporting keywords', () => {
  const brief = buildArticleEditorialBrief({
    familyId: 'mod-scene-radar',
    title: 'Best Furniture & Decoration Hytale Mods This Month',
    seoPrimaryKeyword: 'best furniture & decoration hytale mods for vanilla hytale servers',
    relatedRouteTargets: ['/blog', '/servers'],
  });

  assert.equal(brief.primaryKeyword, 'best furniture & decoration hytale mods for vanilla hytale servers');
  assert.ok(brief.supportingKeywords.includes('vanilla hytale servers'));
  assert.ok(brief.supportingKeywords.includes('hytale server list'));
  assert.deepEqual(brief.requiredBodyRoutes, [homepageServerListRoute, '/blog']);
  assert.ok(brief.naturalHomepageAnchorIdeas.includes('vanilla Hytale server list'));
});
