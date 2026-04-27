import type { Metadata } from 'next';

import type { ArticleEntry } from '@/lib/articles/content';

export const siteName = 'VanillaHytaleServers.com';
export const defaultBaseUrl = 'https://www.vanillahytaleservers.com';

export function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || defaultBaseUrl).replace(/\/$/, '');
}

export function absoluteUrl(pathname: string): string {
  return `${getBaseUrl()}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

export function buildSurfaceMetadata(options: {
  pathname: string;
  title: string;
  description: string;
}): Metadata {
  const url = absoluteUrl(options.pathname);

  return {
    title: options.title,
    description: options.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: options.title,
      description: options.description,
      url,
      siteName,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: options.title,
      description: options.description,
    },
  };
}

export function buildArticleMetadata(article: ArticleEntry): Metadata {
  const url = absoluteUrl(article.urlPath);
  const imageUrl = absoluteUrl(article.images.cover.src);

  return {
    title: article.frontmatter.seoTitle,
    description: article.frontmatter.seoDescription,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'article',
      title: article.frontmatter.seoTitle,
      description: article.frontmatter.seoDescription,
      url,
      siteName,
      publishedTime: article.frontmatter.publishedAt,
      images: [
        {
          url: imageUrl,
          width: article.images.cover.width,
          height: article.images.cover.height,
          alt: article.images.cover.alt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.frontmatter.seoTitle,
      description: article.frontmatter.seoDescription,
      images: [imageUrl],
    },
  };
}
