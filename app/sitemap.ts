import type { MetadataRoute } from 'next';

import { getBaseUrl } from '@/lib/articles/metadata';
import { getArticleCategories, getLiveArticles } from '@/lib/articles/content';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const articles = getLiveArticles();
  const categories = getArticleCategories();

  return [
    '',
    '/blog',
    ...categories.map((category) => `/blog/category/${category}`),
    ...articles.map((article) => article.urlPath),
  ].map((pathname) => ({
    url: `${baseUrl}${pathname}`,
    lastModified: new Date(),
  }));
}
