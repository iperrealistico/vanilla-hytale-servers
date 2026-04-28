import Image from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';

import type { ArticleEntry } from '@/lib/articles/content';
import { humanizeCategory } from '@/lib/articles/content';
import { EditorialFooter, EditorialHeader } from '@/components/articles/EditorialChrome';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { FloatingRailCta } from '@/components/articles/FloatingRailCta';

interface ArticleShellProps {
  article: ArticleEntry;
  body: ReactNode;
  related: ArticleEntry[];
}

export function ArticleShell({ article, body, related }: ArticleShellProps) {
  return (
    <>
      <div className="bg-floats" aria-hidden="true">
        <Image className="bg-float" src={article.images.wash.src} alt="" width={article.images.wash.width} height={article.images.wash.height} style={{ top: '16vh', left: '-10vw' }} />
        <Image className="bg-float article-orbit-float" src={article.images.orbit.src} alt="" width={article.images.orbit.width} height={article.images.orbit.height} style={{ top: '54vh', right: '-2vw', width: 'min(360px, 30vw)' }} />
      </div>

      <EditorialHeader />

      <main id="main-content">
        <section className="hero article-hero">
          <div className="container">
            <div className="hero-panel tilt idle article-hero-panel" data-tilt-strength="0.18">
              <Image className="hero-bg-img" src={article.images.cover.src} alt={article.images.cover.alt} width={article.images.cover.width} height={article.images.cover.height} priority />
              <div className="hero-inner article-hero-grid">
                <div className="hero-content article-hero-copy">
                  <nav className="article-breadcrumbs" aria-label="Breadcrumbs">
                    <Link href="/">Home</Link>
                    <span>/</span>
                    <Link href="/blog">Blog</Link>
                    <span>/</span>
                    <Link href={`/blog/category/${article.frontmatter.category}`}>{humanizeCategory(article.frontmatter.category)}</Link>
                  </nav>
                  <span className="editorial-eyebrow">{article.frontmatter.context}</span>
                  <h1>{article.frontmatter.title}</h1>
                  <p>{article.frontmatter.excerpt}</p>
                  <div className="hero-meta article-hero-meta">
                    <span>{humanizeCategory(article.frontmatter.category)}</span>
                    <span>{article.analysis.readMinutes} min read</span>
                    <span>{new Date(article.frontmatter.publishedAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>

                <div className="article-hero-aside panel">
                  <p className="article-hero-aside__label">Chapter path</p>
                  <div className="article-chapter-pills">
                    {article.analysis.sections.map((section, index) => (
                      <a key={section.id} href={`#${section.id}`} className="article-chapter-pill">
                        <span>{String(index + 1).padStart(2, '0')}</span>
                        <strong>{article.frontmatter.chapterShortTitles[index]}</strong>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="container article-layout">
            <aside className="article-rail">
              <FloatingRailCta
                eyebrow={article.frontmatter.articleCtas.sticky.eyebrow}
                title={article.frontmatter.articleCtas.sticky.title}
                body={article.frontmatter.articleCtas.sticky.body}
                primaryCta={article.frontmatter.articleCtas.sticky.primaryCta}
              />
            </aside>

            <article className="panel article-body-panel">
              <div className="article-body-head">
                <p className="article-body-head__keyword">Primary keyword: {article.frontmatter.primaryKeyword}</p>
                <div className="article-tag-row">
                  {article.frontmatter.tags.map((tag) => (
                    <span className="link-pill" key={tag}>{tag}</span>
                  ))}
                </div>
              </div>

              <div className="article-mdx">{body}</div>
            </article>
          </div>
        </section>

        <section className="article-related-section">
          <div className="container">
            <div className="article-section-heading">
              <span className="editorial-eyebrow">Keep exploring</span>
              <h2>Related Hytale server articles</h2>
              <p>Use the blog to compare another angle before you join a server or shortlist one for your group.</p>
            </div>
            <div className="article-card-grid">
              {related.map((relatedArticle) => (
                <ArticleCard key={relatedArticle.slug} article={relatedArticle} />
              ))}
            </div>
          </div>
        </section>
      </main>

      <EditorialFooter />
    </>
  );
}
