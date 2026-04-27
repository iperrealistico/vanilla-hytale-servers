import fs from 'fs';
import path from 'path';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

const root = path.join(process.cwd(), 'documents-local', 'workspace-local', 'content-ops');
const queuePath = path.join(root, 'article-title-queue.jsonl');
const draftDir = path.join(root, 'staging', 'mdx-drafts');
const slotDir = path.join(root, 'staging', 'slot-assignments');
const imageWorkDir = path.join(root, 'staging', 'image-work');

interface QueueRecord {
  queueId: string;
  queueIndex: number;
  rawTitleLineNumber: number;
  title: string;
  titleLocked: boolean;
  workflowStatus: string;
  articleSlug: string | null;
  draftPath: string | null;
  lastRunOutcome: string | null;
  updatedAt: string | null;
}

function readQueue(): QueueRecord[] {
  return fs
    .readFileSync(queuePath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as QueueRecord);
}

function writeQueue(records: QueueRecord[]) {
  fs.writeFileSync(queuePath, `${records.map((record) => JSON.stringify(record)).join('\n')}\n`);
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function main() {
  const requestedQueueId = process.argv[2];
  const queue = readQueue();
  const target = requestedQueueId ? queue.find((record) => record.queueId === requestedQueueId) : queue.find((record) => record.workflowStatus === 'queued');

  if (!target) {
    throw new Error('No queued record found to scaffold.');
  }

  const slug = target.articleSlug ?? slugify(target.title);
  const draftPath = path.join(draftDir, `${slug}.mdx`);
  const slotPath = path.join(slotDir, `${slug}.json`);
  const queueIndex = String(target.queueIndex).padStart(4, '0');

  ensureDir(draftDir);
  ensureDir(slotDir);
  ensureDir(imageWorkDir);

  if (!fs.existsSync(draftPath)) {
    fs.writeFileSync(
      draftPath,
      `---\nslug: ${slug}\narticleTemplate: v3\nqueueId: ${target.queueId}\nworkflowStatus: drafted\ntitle: "${target.title.replace(/"/g, '\\"')}"\nexcerpt: TODO\ncategory: TODO\ncontext: TODO\nprimaryKeyword: TODO\nsearchIntent: informational\ncoverImage: blog.${slug}.cover\nornamentWashImage: blog.${slug}.ornament.wash\nornamentOrbitImage: blog.${slug}.ornament.orbit\npublishedAt: ${new Date().toISOString().slice(0, 10)}\nseoTitle: "${target.title.replace(/"/g, '\\"')}"\nseoDescription: TODO\nchapterShortTitles:\n  - TODO\n  - TODO\n  - TODO\n  - TODO\narticleCtas:\n  sticky:\n    eyebrow: TODO\n    title: TODO\n    body: TODO\n    primaryCta:\n      label: TODO\n      href: /servers\n      variant: primary\n  segue:\n    eyebrow: TODO\n    title: TODO\n    body: TODO\n    primaryCta:\n      label: TODO\n      href: /guides\n      variant: secondary\nrelatedSlugs: []\nfeatured: false\ntags:\n  - TODO\n---\n\n<ArticleQuickAnswer title=\"Short answer\">\n  <p>TODO</p>\n</ArticleQuickAnswer>\n\n## TODO\n\nTODO\n\n<ArticlePrimarySegue />\n\n## TODO\n\nTODO\n`,
    );
  }

  if (!fs.existsSync(slotPath)) {
    fs.writeFileSync(
      slotPath,
      JSON.stringify(
        {
          [`blog.${slug}.cover`]: { asset: `staged-${slug}-cover` },
          [`blog.${slug}.ornament.wash`]: { asset: `staged-${slug}-ornament-wash` },
          [`blog.${slug}.ornament.orbit`]: { asset: `staged-${slug}-ornament-orbit` },
        },
        null,
        2,
      ),
    );
  }

  for (const [suffix, slotLabel] of [
    ['cover', 'cover'],
    ['wash', 'ornament-wash'],
    ['orbit', 'ornament-orbit'],
  ] as const) {
    const sidecarPath = path.join(imageWorkDir, `${slug}-${suffix}.md`);
    if (!fs.existsSync(sidecarPath)) {
      fs.writeFileSync(
        sidecarPath,
        `# Image Work Sidecar\n\n- Article title: ${target.title}\n- Slot ID: ${slotLabel}\n- Slot key: \`blog.${slug}.${suffix === 'cover' ? 'cover' : `ornament.${suffix}`}\`\n- Why generation was needed: staged draft ${queueIndex} needs its article-specific image package before live promotion\n- Style reference used: N/A\n- Generation method used: pending\n- Output file path: pending\n- Output pixel dimensions: pending\n- Aspect-ratio confirmation: pending\n- Optimization status: pending\n- Selected future asset-library key: \`staged-${slug}-${suffix === 'cover' ? 'cover' : `ornament-${suffix}`}\`\n`,
      );
    }
  }

  const nextQueue = queue.map((record) => {
    if (record.queueId !== target.queueId) return record;
    return {
      ...record,
      workflowStatus: 'drafted',
      articleSlug: slug,
      draftPath,
      lastRunOutcome: 'Scaffolded staged draft package.',
      updatedAt: new Date().toISOString(),
    };
  });

  writeQueue(nextQueue);
  console.log(`Scaffolded staged draft for ${target.queueId} -> ${draftPath}`);
}

main();
