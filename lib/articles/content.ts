import fs from 'fs';
import path from 'path';

import matter from 'gray-matter';

import { analyzeArticleSource, type ArticleAnalysis } from '@/lib/articles/analyzer';
import { ArticleFrontmatterSchema, type ArticleFrontmatter } from '@/lib/articles/schema';
import { slugify } from '@/lib/articles/utils';
import { resolveArticleImageManifest, type ArticleImageManifest } from '@/lib/images/imageManifest';

function resolveArticleRoot(workspaceRoot = process.cwd()) {
  return path.join(workspaceRoot, 'content', 'blog');
}

export interface ArticleEntry {
  filePath: string;
  slug: string;
  urlPath: string;
  categoryPath: string;
  frontmatter: ArticleFrontmatter;
  body: string;
  analysis: ArticleAnalysis;
  images: ArticleImageManifest;
}

export function getArticleRoot(workspaceRoot = process.cwd()) {
  return resolveArticleRoot(workspaceRoot);
}

export function getAllArticles(workspaceRoot = process.cwd()): ArticleEntry[] {
  return walkMdxFiles(resolveArticleRoot(workspaceRoot))
    .map(loadArticleFile)
    .sort((left, right) => {
      return new Date(right.frontmatter.publishedAt).getTime() - new Date(left.frontmatter.publishedAt).getTime();
    });
}

export function getLiveArticles(): ArticleEntry[] {
  return getAllArticles().filter((article) => article.frontmatter.workflowStatus === 'published' && !article.frontmatter.noindex);
}

export function getArticleBySlug(slug: string): ArticleEntry | null {
  return getAllArticles().find((article) => article.slug === slug) ?? null;
}

export function getArticleCategories(): string[] {
  return [...new Set(getLiveArticles().map((article) => article.frontmatter.category))].sort();
}

export function getArticlesByCategory(category: string): ArticleEntry[] {
  return getLiveArticles().filter((article) => article.frontmatter.category === category);
}

export function getFeaturedArticles(limit = 3): ArticleEntry[] {
  const live = getLiveArticles();
  const featured = live.filter((article) => article.frontmatter.featured);
  return (featured.length > 0 ? featured : live).slice(0, limit);
}

export function getRelatedArticles(entry: ArticleEntry, limit = 3): ArticleEntry[] {
  const live = getLiveArticles().filter((candidate) => candidate.slug !== entry.slug);
  const explicit = entry.frontmatter.relatedSlugs
    .map((slug) => live.find((candidate) => candidate.slug === slug))
    .filter((candidate): candidate is ArticleEntry => Boolean(candidate));

  if (explicit.length >= limit) {
    return explicit.slice(0, limit);
  }

  const fallback = live.filter((candidate) => {
    if (explicit.some((item) => item.slug === candidate.slug)) {
      return false;
    }

    return candidate.frontmatter.category === entry.frontmatter.category || candidate.frontmatter.tags.some((tag) => entry.frontmatter.tags.includes(tag));
  });

  return [...explicit, ...fallback].slice(0, limit);
}

export function humanizeCategory(category: string): string {
  return category
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function walkMdxFiles(root: string): string[] {
  if (!fs.existsSync(root)) {
    return [];
  }

  const results: string[] = [];
  const entries = fs.readdirSync(root, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkMdxFiles(absolutePath));
      continue;
    }

    if (entry.isFile() && absolutePath.endsWith('.mdx')) {
      results.push(absolutePath);
    }
  }

  return results;
}

function loadArticleFile(filePath: string): ArticleEntry {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(raw);
  const frontmatter = ArticleFrontmatterSchema.parse(parsed.data);
  const analysis = analyzeArticleSource(parsed.content);
  const images = resolveArticleImageManifest(frontmatter);
  return {
    filePath,
    slug: frontmatter.slug,
    urlPath: `/blog/${frontmatter.slug}`,
    categoryPath: `/blog/category/${slugify(frontmatter.category)}`,
    frontmatter,
    body: parsed.content.trim(),
    analysis,
    images,
  };
}
