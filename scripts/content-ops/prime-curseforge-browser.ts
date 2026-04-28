import fs from 'fs';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

import { chromium } from 'playwright';

import { getCurseforgeBrowserProfileDir } from '@/lib/content-ops/discovery/browser';
import { getContentOpsPaths } from '@/lib/content-ops/paths';

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36';

async function launchPersistentBrowser(profileDir: string) {
  const launchOptions = {
    headless: false,
    locale: 'en-US',
    userAgent: USER_AGENT,
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
}

async function main() {
  const paths = getContentOpsPaths();
  const profileDir = getCurseforgeBrowserProfileDir(paths);
  fs.mkdirSync(profileDir, { recursive: true });

  const context = await launchPersistentBrowser(profileDir);
  const page = await context.newPage();

  try {
    await page.goto('https://www.curseforge.com/hytale', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });
    await page.waitForTimeout(5000);

    console.log(`Opened ${page.url()} using persistent profile: ${profileDir}`);
    console.log(`Current page title: ${await page.title()}`);
    console.log('If Cloudflare shows a challenge, complete it in the browser window.');
    console.log('Press Enter after the Hytale page is usable so the session can be saved for future automation runs.');

    const rl = readline.createInterface({ input, output });
    await rl.question('');
    rl.close();
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
