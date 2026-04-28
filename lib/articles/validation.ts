import { ArticleEntry, getAllArticles } from '@/lib/articles/content';
import { homepageServerListRoute, strategicInternalRoutes } from '@/lib/articles/analyzer';
import { validateImageLibraryIntegrity } from '@/lib/images/imageManifest';

export interface ArticleValidationIssue {
  slug: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface ArticleValidationSummary {
  pageCount: number;
  articleCount: number;
  imageCount: number;
  surface: 'blog';
  articleTemplateVersion: 'v3';
}

export function validateArticleEntry(entry: ArticleEntry, allSlugs: Set<string>): ArticleValidationIssue[] {
  const issues: ArticleValidationIssue[] = [];
  const { frontmatter, analysis, images, slug } = entry;

  if (frontmatter.slug !== slug) {
    issues.push({ slug, severity: 'error', message: `Frontmatter slug "${frontmatter.slug}" does not match file slug "${slug}".` });
  }

  if (analysis.wordCount < 900 || analysis.wordCount > 1800) {
    issues.push({ slug, severity: 'error', message: `Word count ${analysis.wordCount} is outside the 900-1800 envelope.` });
  }

  if (analysis.sections.length < 4 || analysis.sections.length > 6) {
    issues.push({ slug, severity: 'error', message: `Found ${analysis.sections.length} H2 sections. Expected 4 to 6.` });
  }

  if (frontmatter.chapterShortTitles.length !== analysis.sections.length) {
    issues.push({ slug, severity: 'error', message: `chapterShortTitles has ${frontmatter.chapterShortTitles.length} entries but article has ${analysis.sections.length} H2 sections.` });
  }

  if (analysis.primarySegueCount !== 1) {
    issues.push({ slug, severity: 'error', message: `Found ${analysis.primarySegueCount} ArticlePrimarySegue blocks. Expected exactly 1.` });
  }

  if (analysis.approvedBlockCountExcludingSegue < 2 || analysis.approvedBlockCountExcludingSegue > 4) {
    issues.push({ slug, severity: 'error', message: `Found ${analysis.approvedBlockCountExcludingSegue} approved editorial blocks excluding segue. Expected 2 to 4.` });
  }

  if (analysis.strategicLinks.length < 2) {
    issues.push({ slug, severity: 'error', message: `Article links to ${analysis.strategicLinks.length} strategic routes. Expected at least 2 of ${strategicInternalRoutes.join(', ')}.` });
  }

  if (!analysis.hasHomepageServerListLink) {
    issues.push({
      slug,
      severity: 'error',
      message: `Article must include at least one natural homepage server-list backlink to ${homepageServerListRoute}.`,
    });
  }

  for (const relatedSlug of frontmatter.relatedSlugs) {
    if (!allSlugs.has(relatedSlug)) {
      issues.push({ slug, severity: 'error', message: `Related slug "${relatedSlug}" does not resolve.` });
    }
  }

  for (const [key, image] of Object.entries(images)) {
    if (!image.src) {
      issues.push({ slug, severity: 'error', message: `Image manifest missing ${key} image source.` });
    }
  }

  return issues;
}

export function validateAllArticles() {
  const articles = getAllArticles();
  const allSlugs = new Set(articles.map((article) => article.slug));
  const issues = articles.flatMap((article) => validateArticleEntry(article, allSlugs));

  for (const imageError of validateImageLibraryIntegrity()) {
    issues.push({ slug: 'global', severity: 'error', message: imageError });
  }

  const summary: ArticleValidationSummary = {
    pageCount: 4 + articles.length,
    articleCount: articles.length,
    imageCount: articles.length * 3,
    surface: 'blog',
    articleTemplateVersion: 'v3',
  };

  return { articles, issues, summary };
}
