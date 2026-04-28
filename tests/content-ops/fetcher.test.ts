import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { createSourceFetcher } from '@/lib/content-ops/discovery/fetcher';
import { getContentOpsPaths } from '@/lib/content-ops/paths';

function createTempPaths() {
  const workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'vhs-fetcher-'));
  return getContentOpsPaths(workspaceRoot);
}

test('createSourceFetcher uses the browser path first for CurseForge sources', async () => {
  const paths = createTempPaths();
  let textCalls = 0;
  let browserCalls = 0;

  const fetcher = createSourceFetcher(paths, {
    async fetchText() {
      textCalls += 1;
      return {
        statusCode: 200,
        body: '<html><body>http path</body></html>',
        finalUrl: 'https://www.curseforge.com/hytale',
        challengeHeader: null,
      };
    },
    async fetchBrowserHtml() {
      browserCalls += 1;
      return {
        statusCode: 200,
        body: '<html><head><title>Hytale Mods - CurseForge</title></head><body><h2>Monthly Theme</h2></body></html>',
        finalUrl: 'https://www.curseforge.com/hytale',
        blockedReason: null,
      };
    },
  });

  const result = await fetcher.fetchHtml({
    familyId: 'mod-scene-radar',
    sourceKey: 'curseforge-hytale-home',
    url: 'https://www.curseforge.com/hytale',
  });

  await fetcher.dispose?.();

  assert.equal(result.sourceMode, 'live');
  assert.equal(textCalls, 0);
  assert.equal(browserCalls, 1);
  assert.ok(result.snapshotPath);
  assert.ok(fs.existsSync(result.snapshotPath!));
  assert.match(result.body ?? '', /Monthly Theme/);
});

test('createSourceFetcher falls back to the latest snapshot when the CurseForge browser path is blocked', async () => {
  const paths = createTempPaths();
  const snapshotDir = path.join(paths.snapshotsRoot, 'mod-scene-radar', 'curseforge-hytale-home');
  const snapshotPath = path.join(snapshotDir, '2026-04-27T10-00-00-000Z.html');

  fs.mkdirSync(snapshotDir, { recursive: true });
  fs.writeFileSync(snapshotPath, '<html><body>cached curseforge snapshot</body></html>');

  const fetcher = createSourceFetcher(paths, {
    async fetchBrowserHtml() {
      return {
        statusCode: 403,
        body: '<html><head><title>Just a moment...</title></head><body>challenge-platform</body></html>',
        finalUrl: 'https://www.curseforge.com/hytale',
        blockedReason: 'Playwright browser session still received a challenge page (Just a moment...).',
      };
    },
  });

  const result = await fetcher.fetchHtml({
    familyId: 'mod-scene-radar',
    sourceKey: 'curseforge-hytale-home',
    url: 'https://www.curseforge.com/hytale',
  });

  await fetcher.dispose?.();

  assert.equal(result.sourceMode, 'snapshot');
  assert.equal(result.snapshotPath, snapshotPath);
  assert.match(result.blockedReason ?? '', /challenge page/i);
  assert.match(result.body ?? '', /cached curseforge snapshot/);
});
