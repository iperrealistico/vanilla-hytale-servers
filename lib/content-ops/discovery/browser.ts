import fs from 'fs';
import path from 'path';

import type { BrowserContext } from 'playwright';

import type { ContentOpsPaths } from '@/lib/content-ops/paths';

const CURSEFORGE_HOST_PATTERN = /(^|\.)curseforge\.com$/i;
const CHALLENGE_PATTERNS = [/just a moment/i, /enable javascript and cookies to continue/i, /__cf_chl/i, /challenge-platform/i];
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';

export interface BrowserHtmlFetchResult {
  finalUrl: string;
  body: string | null;
  statusCode: number | null;
  blockedReason: string | null;
  challengeHeader?: string | null;
}

export interface DiscoveryBrowserTransport {
  fetchHtml(url: string): Promise<BrowserHtmlFetchResult>;
  close(): Promise<void>;
}

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function isChallengePage(title: string, body: string) {
  return CHALLENGE_PATTERNS.some((pattern) => pattern.test(title) || pattern.test(body));
}

export function isCurseforgeUrl(url: string) {
  try {
    return CURSEFORGE_HOST_PATTERN.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

export function getCurseforgeBrowserProfileDir(paths: ContentOpsPaths) {
  return path.join(paths.browserProfilesRoot, 'curseforge');
}

export function createDiscoveryBrowserTransport(
  paths: ContentOpsPaths,
  options: { headless?: boolean } = {},
): DiscoveryBrowserTransport {
  const profileDir = getCurseforgeBrowserProfileDir(paths);
  let contextPromise: Promise<BrowserContext> | null = null;

  async function ensureContext() {
    if (!contextPromise) {
      contextPromise = (async () => {
        ensureDir(profileDir);
        const { chromium } = await import('playwright');
        const launchOptions = {
          headless: options.headless ?? true,
          locale: 'en-US',
          userAgent: DEFAULT_USER_AGENT,
          viewport: { width: 1440, height: 1024 },
          extraHTTPHeaders: {
            'accept-language': 'en-US,en;q=0.9',
          },
        } as const;

        try {
          return await chromium.launchPersistentContext(profileDir, {
            ...launchOptions,
            channel: 'chrome',
          });
        } catch {
          return chromium.launchPersistentContext(profileDir, launchOptions);
        }
      })();
    }

    return contextPromise;
  }

  return {
    async fetchHtml(url: string) {
      const context = await ensureContext();
      const page = await context.newPage();

      try {
        const response = await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 60000,
        });
        await page.waitForTimeout(3500);
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

        const [title, body] = await Promise.all([page.title(), page.content()]);
        const blockedReason = isChallengePage(title, body)
          ? `Playwright browser session still received a challenge page (${title || 'unknown title'}).`
          : null;

        return {
          finalUrl: page.url(),
          body,
          statusCode: response?.status() ?? null,
          blockedReason,
        };
      } finally {
        await page.close().catch(() => {});
      }
    },

    async close() {
      if (!contextPromise) {
        return;
      }

      const context = await contextPromise.catch(() => null);
      contextPromise = null;

      if (context) {
        await context.close().catch(() => {});
      }
    },
  };
}
