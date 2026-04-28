import { ReactNode } from 'react';
import Link from 'next/link';

import { EditorialFooter, EditorialHeader } from '@/components/articles/EditorialChrome';
import type { LegacyArchiveEntry } from '@/lib/articles/legacyArchive';

interface LegacyArchiveArticleProps {
  legacy: LegacyArchiveEntry;
  body: ReactNode;
}

export function LegacyArchiveArticle({ legacy, body }: LegacyArchiveArticleProps) {
  return (
    <>
      <EditorialHeader />

      <main id="main-content">
        <section className="hero article-hero">
          <div className="container">
            <div className="hero-panel article-hero-panel panel">
              <div className="hero-inner article-hero-grid">
                <div className="hero-content article-hero-copy">
                  <nav className="article-breadcrumbs" aria-label="Breadcrumbs">
                    <Link href="/">Home</Link>
                    <span>/</span>
                    <Link href="/blog">Blog</Link>
                    <span>/</span>
                    <span>Legacy archive</span>
                  </nav>
                  <span className="editorial-eyebrow">Legacy archive</span>
                  <h1>{legacy.title}</h1>
                  <p>{legacy.excerpt}</p>
                  <div className="hero-meta article-hero-meta">
                    <span>Retired AI pipeline</span>
                    <span>{new Date(legacy.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    <span>Noindex compatibility page</span>
                  </div>
                </div>

                <div className="article-hero-aside panel">
                  <p className="article-hero-aside__label">What this page means</p>
                  <p style={{ marginTop: 0 }}>
                    This article came from the pre-v3 blog generator. It is preserved for historical continuity, but the active editorial system now lives in the validated MDX runtime and local content-ops control plane.
                  </p>
                  <div className="blog-index-actions" style={{ marginTop: '1rem' }}>
                    <Link className="btn btn-primary pressable" href="/blog">Open live blog</Link>
                    <Link className="btn btn-secondary pressable" href="/#servers">Homepage shortlist</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="container article-layout">
            <aside className="article-rail">
              <div className="panel article-sticky-cta">
                <span className="editorial-eyebrow">Current routes</span>
                <h2>Use the live selection system instead</h2>
                <p>The best next step is usually the homepage shortlist, the live blog, or the homepage scoring section that explains how servers are evaluated now.</p>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <Link className="btn btn-primary pressable" href="/#servers">Homepage shortlist</Link>
                  <Link className="btn btn-secondary pressable" href="/#methodology">See scoring</Link>
                </div>
              </div>
            </aside>

            <article className="panel article-body-panel">
              <div className="article-body-head">
                <p className="article-body-head__keyword">Archive status: preserved for continuity, removed from the active queue and editorial index.</p>
                <div className="article-tag-row">
                  <span className="link-pill">Legacy archive</span>
                  <span className="link-pill">Historical post</span>
                  <span className="link-pill">Noindex</span>
                </div>
              </div>

              <div className="article-note article-note--planning" style={{ marginBottom: '1.5rem' }}>
                <div className="article-note__header">
                  <i className="fa-solid fa-box-archive" aria-hidden="true"></i>
                  <strong>Archive note</strong>
                </div>
                <div className="article-note__content">
                  <p>
                    This body is preserved as a historical artifact from the retired JSON-era AI blog system. It is not part of the validated v3 publishing workflow and does not represent the current editorial standard.
                  </p>
                </div>
              </div>

              <div className="article-mdx">{body}</div>
            </article>
          </div>
        </section>
      </main>

      <EditorialFooter />
    </>
  );
}
