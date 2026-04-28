import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeArticleSource } from '@/lib/articles/analyzer';
import type { ArticleEntry } from '@/lib/articles/content';
import { ArticleFrontmatterSchema } from '@/lib/articles/schema';
import { validateAllArticles, validateArticleEntry } from '@/lib/articles/validation';

test('live article set passes the article-system validator', () => {
  const { issues, summary } = validateAllArticles();

  assert.equal(issues.length, 0);
  assert.equal(summary.articleTemplateVersion, 'v3');
  assert.equal(summary.surface, 'blog');
  assert.ok(Number.isInteger(summary.articleCount));
  assert.ok(summary.articleCount >= 0);
});

test('validateArticleEntry requires a homepage server-list backlink', () => {
  const source = `
<ArticleQuickAnswer title="Short answer">
  <p>Quick orientation.</p>
</ArticleQuickAnswer>

## First section

This section explains why players compare route promises before joining. It links to the [blog index](/blog).

## Second section

This section covers methodology and points readers to the [scoring section](/#methodology).

<ArticlePrimarySegue />

## Third section

More detail.

<ArticlePlanningNote title="Practical note">
  <p>Plan before you join.</p>
</ArticlePlanningNote>

## Fourth section

Closing thoughts.
`;

  const entry: ArticleEntry = {
    filePath: '/tmp/example.mdx',
    slug: 'example',
    urlPath: '/blog/example',
    categoryPath: '/blog/category/guides',
    frontmatter: ArticleFrontmatterSchema.parse({
      slug: 'example',
      articleTemplate: 'v3',
      queueId: 'title-9999',
      workflowStatus: 'drafted',
      title: 'Example',
      excerpt: 'Example excerpt',
      category: 'guides',
      context: 'Example context',
      primaryKeyword: 'vanilla hytale servers',
      searchIntent: 'informational',
      coverImage: 'blog.example.cover',
      ornamentWashImage: 'blog.example.ornament.wash',
      ornamentOrbitImage: 'blog.example.ornament.orbit',
      publishedAt: '2026-04-28',
      seoTitle: 'Example',
      seoDescription: 'Example description',
      chapterShortTitles: ['One', 'Two', 'Three', 'Four'],
      articleCtas: {
        sticky: {
          eyebrow: 'Compare',
          title: 'Shortlist',
          body: 'Body copy',
          primaryCta: { label: 'Open shortlist', href: '/#servers', variant: 'primary' },
        },
        segue: {
          eyebrow: 'Learn more',
          title: 'Blog',
          body: 'Body copy',
          primaryCta: { label: 'Browse blog', href: '/blog', variant: 'secondary' },
        },
      },
      relatedSlugs: [],
      featured: false,
      tags: ['vanilla-first'],
    }),
    body: source,
    analysis: analyzeArticleSource(source),
    images: {
      cover: { id: 'cover', src: '/img/example-cover.jpg', alt: 'cover', width: 1200, height: 630, tone: 'cool' },
      wash: { id: 'wash', src: '/img/example-wash.jpg', alt: 'wash', width: 1200, height: 630, tone: 'cool' },
      orbit: { id: 'orbit', src: '/img/example-orbit.jpg', alt: 'orbit', width: 1200, height: 630, tone: 'cool' },
    },
  };

  const issues = validateArticleEntry(entry, new Set(['example']));
  assert.ok(
    issues.some((issue) => issue.message.includes('homepage server-list backlink')),
    'expected a homepage server-list backlink validation error',
  );
});
