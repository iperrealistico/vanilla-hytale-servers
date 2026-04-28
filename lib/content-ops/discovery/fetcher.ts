import fs from 'fs';
import path from 'path';

import { createDiscoveryBrowserTransport, isCurseforgeUrl } from '@/lib/content-ops/discovery/browser';
import { shortHash, slugify } from '@/lib/content-ops/discovery/text';
import { ensureParentDir } from '@/lib/content-ops/jsonl';
import type { ContentOpsPaths } from '@/lib/content-ops/paths';

export interface FetchedSource {
  canonicalUrl: string;
  body: string | null;
  fetchedAt: string;
  sourceMode: 'live' | 'snapshot' | 'blocked';
  snapshotPath: string | null;
  blockedReason: string | null;
  statusCode: number | null;
}

export interface SourceFetcher {
  fetchHtml(options: { familyId: string; sourceKey: string; url: string }): Promise<FetchedSource>;
  downloadGuidelineImage(options: { familyId: string; sourceKey: string; imageUrl: string }): Promise<string | null>;
  dispose?(): Promise<void>;
}

interface FetchTransportResult {
  statusCode: number | null;
  body: string | null;
  finalUrl: string;
  blockedReason?: string | null;
  challengeHeader?: string | null;
}

export interface SourceFetcherRuntime {
  fetchText?: (url: string) => Promise<FetchTransportResult>;
  fetchBrowserHtml?: (url: string) => Promise<FetchTransportResult>;
}

function nowIso() {
  return new Date().toISOString();
}

function isBlockedResponse(text: string, statusCode: number | null, challengeHeader: string | null = null) {
  const blockedPatterns = [/just a moment/i, /enable javascript and cookies to continue/i, /__cf_chl/i];
  return challengeHeader === 'challenge' || statusCode === 403 || blockedPatterns.some((pattern) => pattern.test(text));
}

function buildSnapshotPath(paths: ContentOpsPaths, familyId: string, sourceKey: string, extension: string) {
  const stamp = nowIso().replace(/[:.]/g, '-');
  return path.join(paths.snapshotsRoot, familyId, slugify(sourceKey), `${stamp}.${extension}`);
}

function latestSnapshot(paths: ContentOpsPaths, familyId: string, sourceKey: string, extension: string) {
  const dir = path.join(paths.snapshotsRoot, familyId, slugify(sourceKey));
  if (!fs.existsSync(dir)) {
    return null;
  }

  const candidates = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(`.${extension}`))
    .sort();

  if (candidates.length === 0) {
    return null;
  }

  return path.join(dir, candidates[candidates.length - 1]);
}

function latestBinarySnapshot(paths: ContentOpsPaths, familyId: string, sourceKey: string) {
  const dir = path.join(paths.snapshotsRoot, familyId, slugify(sourceKey));
  if (!fs.existsSync(dir)) {
    return null;
  }

  const candidates = fs
    .readdirSync(dir)
    .filter((file) => !file.endsWith('.html'))
    .sort();

  if (candidates.length === 0) {
    return null;
  }

  return path.join(dir, candidates[candidates.length - 1]);
}

async function fetchText(url: string): Promise<FetchTransportResult> {
  const response = await fetch(url, {
    headers: {
      'accept-language': 'en-US,en;q=0.9',
      'user-agent': 'Mozilla/5.0 (compatible; VanillaHytaleServersBot/1.0; +https://www.vanillahytaleservers.com)',
    },
  });

  return {
    statusCode: response.status,
    body: await response.text(),
    finalUrl: response.url,
    challengeHeader: response.headers.get('cf-mitigated'),
  };
}

export function createSourceFetcher(paths: ContentOpsPaths, runtime: SourceFetcherRuntime = {}): SourceFetcher {
  const browserTransport = createDiscoveryBrowserTransport(paths);
  const fetchTextImpl = runtime.fetchText ?? fetchText;
  const fetchBrowserHtmlImpl = runtime.fetchBrowserHtml ?? ((url: string) => browserTransport.fetchHtml(url));

  return {
    async fetchHtml({ familyId, sourceKey, url }) {
      const fetchedAt = nowIso();
      const primaryFetch = isCurseforgeUrl(url) ? fetchBrowserHtmlImpl : fetchTextImpl;

      try {
        const liveResult = await primaryFetch(url);
        const liveBody = liveResult.body ?? '';
        const liveResultBlocked = !liveResult.body || isBlockedResponse(liveBody, liveResult.statusCode, liveResult.challengeHeader ?? null);

        if (!liveResultBlocked && liveResult.body) {
          const snapshotPath = buildSnapshotPath(paths, familyId, sourceKey, 'html');
          ensureParentDir(snapshotPath);
          fs.writeFileSync(snapshotPath, liveResult.body);
          return {
            canonicalUrl: liveResult.finalUrl,
            body: liveResult.body,
            fetchedAt,
            sourceMode: 'live',
            snapshotPath,
            blockedReason: null,
            statusCode: liveResult.statusCode,
          };
        }

        const fallbackPath = latestSnapshot(paths, familyId, sourceKey, 'html');
        if (fallbackPath) {
          return {
            canonicalUrl: url,
            body: fs.readFileSync(fallbackPath, 'utf8'),
            fetchedAt,
            sourceMode: 'snapshot',
            snapshotPath: fallbackPath,
            blockedReason:
              liveResult.blockedReason ??
              `Live fetch was blocked with status ${liveResult.statusCode ?? 'unknown'}.`,
            statusCode: liveResult.statusCode,
          };
        }

        return {
          canonicalUrl: url,
          body: null,
          fetchedAt,
          sourceMode: 'blocked',
          snapshotPath: null,
          blockedReason:
            liveResult.blockedReason ??
            `Live fetch was blocked with status ${liveResult.statusCode ?? 'unknown'}.`,
          statusCode: liveResult.statusCode,
        };
      } catch (error) {
        const fallbackPath = latestSnapshot(paths, familyId, sourceKey, 'html');
        if (fallbackPath) {
          return {
            canonicalUrl: url,
            body: fs.readFileSync(fallbackPath, 'utf8'),
            fetchedAt,
            sourceMode: 'snapshot',
            snapshotPath: fallbackPath,
            blockedReason: error instanceof Error ? error.message : 'Unknown fetch error.',
            statusCode: null,
          };
        }

        return {
          canonicalUrl: url,
          body: null,
          fetchedAt,
          sourceMode: 'blocked',
          snapshotPath: null,
          blockedReason: error instanceof Error ? error.message : 'Unknown fetch error.',
          statusCode: null,
        };
      }
    },

    async downloadGuidelineImage({ familyId, sourceKey, imageUrl }) {
      const snapshotKey = `${sourceKey}-${shortHash(imageUrl)}`;
      const fallbackPath = latestBinarySnapshot(paths, familyId, snapshotKey);

      try {
        const response = await fetch(imageUrl, {
          headers: {
            'user-agent': 'Mozilla/5.0 (compatible; VanillaHytaleServersBot/1.0; +https://www.vanillahytaleservers.com)',
          },
        });

        if (!response.ok) {
          return fallbackPath;
        }

        const contentType = response.headers.get('content-type') ?? '';
        const extension =
          contentType.includes('png')
            ? 'png'
            : contentType.includes('jpeg') || contentType.includes('jpg')
              ? 'jpg'
              : contentType.includes('webp')
                ? 'webp'
                : 'bin';
        const snapshotPath = buildSnapshotPath(paths, familyId, snapshotKey, extension);
        ensureParentDir(snapshotPath);
        fs.writeFileSync(snapshotPath, Buffer.from(await response.arrayBuffer()));
        return snapshotPath;
      } catch {
        return fallbackPath;
      }
    },

    async dispose() {
      await browserTransport.close();
    },
  };
}
