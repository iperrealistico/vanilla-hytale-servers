import fs from 'fs';
import path from 'path';

import { buildArticleEditorialBrief, homepageServerListRoute } from '@/lib/content-ops/editorialSeo';
import { syncImageWorkSidecarsForRecord } from '@/lib/content-ops/image-work';
import { readQueueRecords, writeQueueRecords } from '@/lib/content-ops/queue';
import { getContentOpsPaths } from '@/lib/content-ops/paths';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

const paths = getContentOpsPaths();
const root = paths.contentOpsRoot;
const draftDir = path.join(root, 'staging', 'mdx-drafts');
const slotDir = path.join(root, 'staging', 'slot-assignments');

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function yamlQuote(value: string) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function main() {
  const requestedQueueId = process.argv[2];
  const queue = readQueueRecords(paths);
  const target = requestedQueueId ? queue.find((record) => record.queueId === requestedQueueId) : queue.find((record) => record.workflowStatus === 'queued');

  if (!target) {
    throw new Error('No queued record found to scaffold.');
  }

  const slug = target.articleSlug ?? slugify(target.title);
  const draftPath = path.join(draftDir, `${slug}.mdx`);
  const slotPath = path.join(slotDir, `${slug}.json`);

  ensureDir(draftDir);
  ensureDir(slotDir);

  if (!fs.existsSync(draftPath)) {
    const editorialBrief = buildArticleEditorialBrief(target);
    const primaryKeyword = editorialBrief.primaryKeyword ?? 'TODO';
    const supportingKeywords = editorialBrief.supportingKeywords.length > 0 ? editorialBrief.supportingKeywords.join('; ') : 'TODO';
    const naturalAnchorIdeas =
      editorialBrief.naturalHomepageAnchorIdeas.length > 0 ? editorialBrief.naturalHomepageAnchorIdeas.join('; ') : 'TODO';
    const secondaryRoutes = editorialBrief.requiredBodyRoutes.filter((route) => route !== homepageServerListRoute);
    const secondaryRouteList = secondaryRoutes.length > 0 ? secondaryRoutes.join('; ') : 'none';
    const contextValue = target.angleSummary ?? target.whyNow ?? 'TODO';
    const seoTitle = target.title;

    fs.writeFileSync(
      draftPath,
      `---\nslug: ${slug}\narticleTemplate: v3\nqueueId: ${target.queueId}\nworkflowStatus: drafted\ntitle: ${yamlQuote(target.title)}\nexcerpt: TODO\ncategory: TODO\ncontext: ${yamlQuote(contextValue)}\n# SEO brief:\n# - Primary keyword: ${primaryKeyword}\n# - Supporting keywords: ${supportingKeywords}\n# - Required homepage backlink: ${homepageServerListRoute}\n# - Natural anchor ideas: ${naturalAnchorIdeas}\n# - Secondary strategic routes: ${secondaryRouteList}\nprimaryKeyword: ${yamlQuote(primaryKeyword)}\nsearchIntent: ${target.seoIntent ?? 'informational'}\ncoverImage: blog.${slug}.cover\nornamentWashImage: blog.${slug}.ornament.wash\nornamentOrbitImage: blog.${slug}.ornament.orbit\npublishedAt: ${new Date().toISOString().slice(0, 10)}\nseoTitle: ${yamlQuote(seoTitle)}\nseoDescription: TODO\nchapterShortTitles:\n  - TODO\n  - TODO\n  - TODO\n  - TODO\narticleCtas:\n  sticky:\n    eyebrow: TODO\n    title: TODO\n    body: TODO\n    primaryCta:\n      label: TODO\n      href: /#servers\n      variant: primary\n  segue:\n    eyebrow: TODO\n    title: TODO\n    body: TODO\n    primaryCta:\n      label: TODO\n      href: /blog\n      variant: secondary\nrelatedSlugs: []\nfeatured: false\ntags:\n  - TODO\n---\n\n<!--\nDraft brief:\n- Work the primary keyword into the intro, a mid-article comparison section, and the final decision section without stuffing.\n- Use 3 to 5 supporting keyword variants where they fit naturally.\n- Add at least one in-body link to /#servers in the first half of the article and another when comparing or filtering options.\n-->\n\n<ArticleQuickAnswer title=\"Short answer\">\n  <p>TODO</p>\n</ArticleQuickAnswer>\n\n## TODO\n\nTODO\n\n<ArticlePrimarySegue />\n\n## TODO\n\nTODO\n`,
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

  const nextQueue: typeof queue = queue.map((record) => {
    if (record.queueId !== target.queueId) return record;
    return {
      ...record,
      workflowStatus: 'drafted' as const,
      articleSlug: slug,
      draftPath,
      lastRunOutcome: 'Scaffolded staged draft package.',
      updatedAt: new Date().toISOString(),
    };
  });

  writeQueueRecords(paths, nextQueue);
  syncImageWorkSidecarsForRecord({
    paths,
    record: nextQueue.find((record) => record.queueId === target.queueId) ?? target,
    slug,
  });
  console.log(`Scaffolded staged draft for ${target.queueId} -> ${draftPath}`);
}

main();
