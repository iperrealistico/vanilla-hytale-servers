import { clipSentence, countWords, readingMinutes, slugify, stripMarkdownNoise, unique } from '@/lib/articles/utils';

export const approvedEditorialBlocks = [
  'ArticleQuickAnswer',
  'ArticlePlanningNote',
  'ArticleChecklist',
  'ArticleCommonMistake',
  'ArticleExpertTip',
  'ArticleDeepDive',
  'ArticlePullQuote',
  'ArticlePrimarySegue',
] as const;

export const homepageServerListRoute = '/#servers' as const;
export const strategicInternalRoutes = ['/#servers', '/blog', '/#methodology'] as const;

export interface ArticleSubheading {
  id: string;
  title: string;
}

export interface ArticleSection {
  id: string;
  title: string;
  snippet: string;
  subheadings: ArticleSubheading[];
}

export interface ArticleAnalysis {
  wordCount: number;
  readMinutes: number;
  intro: string;
  sections: ArticleSection[];
  approvedBlockNames: string[];
  approvedBlockCountExcludingSegue: number;
  primarySegueCount: number;
  strategicLinks: string[];
  hasHomepageServerListLink: boolean;
}

export function analyzeArticleSource(source: string): ArticleAnalysis {
  const lines = source.split('\n');
  const introLines: string[] = [];
  const sections: Array<ArticleSection & { bodyLines: string[] }> = [];
  let currentSection: (ArticleSection & { bodyLines: string[] }) | null = null;

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection) {
        currentSection.snippet = buildSectionSnippet(currentSection.bodyLines);
      }

      currentSection = {
        id: slugify(line.replace(/^##\s+/, '').trim()),
        title: line.replace(/^##\s+/, '').trim(),
        snippet: '',
        subheadings: [],
        bodyLines: [],
      };
      sections.push(currentSection);
      continue;
    }

    if (line.startsWith('### ') && currentSection) {
      const title = line.replace(/^###\s+/, '').trim();
      currentSection.subheadings.push({ id: slugify(title), title });
    }

    if (currentSection) {
      currentSection.bodyLines.push(line);
    } else {
      introLines.push(line);
    }
  }

  if (currentSection) {
    currentSection.snippet = buildSectionSnippet(currentSection.bodyLines);
  }

  const approvedBlockNames = findApprovedBlocks(source);
  const primarySegueCount = approvedBlockNames.filter((name) => name === 'ArticlePrimarySegue').length;
  const approvedBlockCountExcludingSegue = approvedBlockNames.filter((name) => name !== 'ArticlePrimarySegue').length;
  const strategicLinks = findStrategicLinks(source);

  return {
    wordCount: countWords(source),
    readMinutes: readingMinutes(countWords(source)),
    intro: clipSentence(stripMarkdownNoise(introLines.join(' ')), 180),
    sections: sections.map((section) => ({
      id: section.id,
      title: section.title,
      snippet: section.snippet,
      subheadings: section.subheadings,
    })),
    approvedBlockNames,
    approvedBlockCountExcludingSegue,
    primarySegueCount,
    strategicLinks,
    hasHomepageServerListLink: strategicLinks.includes(homepageServerListRoute),
  };
}

function buildSectionSnippet(lines: string[]): string {
  const cleaned = stripMarkdownNoise(lines.join(' '));
  return clipSentence(cleaned, 150);
}

function findApprovedBlocks(source: string): string[] {
  const regex = /<(ArticleQuickAnswer|ArticlePlanningNote|ArticleChecklist|ArticleCommonMistake|ArticleExpertTip|ArticleDeepDive|ArticlePullQuote|ArticlePrimarySegue)\b/g;
  const matches = source.matchAll(regex);
  return Array.from(matches, (match) => match[1]);
}

function findStrategicLinks(source: string): string[] {
  const linkRegex = /\]\((\/[^)\s?]+)(?:\?[^)]*)?\)/g;
  const links = Array.from(source.matchAll(linkRegex), (match) => match[1]);
  return unique(links.filter((href) => strategicInternalRoutes.includes(href as (typeof strategicInternalRoutes)[number])));
}
