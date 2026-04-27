import Image from 'next/image';
import Link from 'next/link';

import type { ArticleEntry } from '@/lib/articles/content';
import { humanizeCategory } from '@/lib/articles/content';

interface ArticleCardProps {
  article: ArticleEntry;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className="card pressable tilt article-card" data-tilt-strength="0.30">
      <div className="article-card-media">
        <Image
          src={article.images.cover.src}
          alt={article.images.cover.alt}
          width={article.images.cover.width}
          height={article.images.cover.height}
        />
      </div>

      <div className="card-body article-card-body">
        <div className="article-card-meta">
          <span className="badge featured">{humanizeCategory(article.frontmatter.category)}</span>
          <span>{new Date(article.frontmatter.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span>{article.analysis.readMinutes} min read</span>
        </div>

        <h3 className="article-card-title">
          <Link href={article.urlPath}>{article.frontmatter.title}</Link>
        </h3>

        <p className="article-card-excerpt">{article.frontmatter.excerpt}</p>

        <div className="article-card-footer">
          <span>Read guide</span>
          <i className="fa-solid fa-arrow-right" aria-hidden="true"></i>
        </div>
      </div>
    </article>
  );
}
