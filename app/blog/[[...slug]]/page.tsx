import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';

import { ArticleCard } from '@/components/articles/ArticleCard';
import { getArticleMdxComponents } from '@/components/articles/ArticleBlocks';
import { EditorialFooter, EditorialHeader, EditorialHero } from '@/components/articles/EditorialChrome';
import { ArticleShell } from '@/components/articles/ArticleShell';
import { LegacyArchiveArticle } from '@/components/articles/LegacyArchiveArticle';
import { buildArticleMetadata, buildSurfaceMetadata } from '@/lib/articles/metadata';
import {
  getArticleBySlug,
  getArticleCategories,
  getArticlesByCategory,
  getLiveArticles,
  getRelatedArticles,
  humanizeCategory,
} from '@/lib/articles/content';
import { getLegacyArchive, getLegacyArchiveBySlug } from '@/lib/articles/legacyArchive';

export async function generateStaticParams() {
  const articles = getLiveArticles();
  const categories = getArticleCategories();
  const legacyArchive = getLegacyArchive();

  return [
    ...articles.map((article) => ({ slug: [article.slug] })),
    ...legacyArchive.map((entry) => ({ slug: [entry.slug] })),
    ...categories.map((category) => ({ slug: ['category', category] })),
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await params;

  if (slug.length === 0) {
    return buildSurfaceMetadata({
      pathname: '/blog',
      title: 'Vanilla Hytale Blog | Server Selection, Fairness, and SMP Guides',
      description: 'Practical Hytale articles about vanilla-first servers, fairness checks, semi-vanilla tradeoffs, onboarding, and calm survival SMP decisions.',
    });
  }

  if (slug[0] === 'category' && slug[1]) {
    const categoryTitle = humanizeCategory(slug[1]);
    return buildSurfaceMetadata({
      pathname: `/blog/category/${slug[1]}`,
      title: `${categoryTitle} | Vanilla Hytale Blog`,
      description: `Browse ${categoryTitle.toLowerCase()} articles from VanillaHytaleServers.com.`,
    });
  }

  const article = getArticleBySlug(slug[0]);
  if (article) {
    return buildArticleMetadata(article);
  }

  const legacy = getLegacyArchiveBySlug(slug[0]);
  if (legacy) {
    return {
      ...buildSurfaceMetadata({
        pathname: `/blog/${legacy.slug}`,
        title: `${legacy.title} | Legacy Archive`,
        description: legacy.excerpt,
      }),
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  return buildSurfaceMetadata({
    pathname: '/blog',
    title: 'Vanilla Hytale Blog | Server Selection, Fairness, and SMP Guides',
    description: 'Practical Hytale articles about vanilla-first servers, fairness checks, semi-vanilla tradeoffs, onboarding, and calm survival SMP decisions.',
  });
}

export default async function BlogPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await params;

  if (slug.length === 0) {
    const articles = getLiveArticles();

    return (
      <>
        <EditorialHeader />
        <main id="main-content">
          <EditorialHero
            eyebrow="Editorial surface"
            title="Vanilla-first Hytale guides that help you choose better servers"
            description="This blog exists to make the server directory more useful. Each article turns a fuzzy label like vanilla, fair, semi-vanilla, or no pay-to-win into practical questions you can actually use before you join."
            badges={['Server selection', 'Fairness checks', 'SMP onboarding']}
            actions={[
              { href: '/servers', label: 'Browse servers' },
              { href: '/guides', label: 'Explore guide hub', variant: 'secondary' },
            ]}
          />

          <section className="article-related-section">
            <div className="container">
              <div className="article-section-heading">
                <span className="editorial-eyebrow">Latest articles</span>
                <h2>Fresh Hytale server decision guides</h2>
                <p>These articles are built to answer real selection questions, not to flood the site with generic trend posts.</p>
              </div>
              <div className="article-card-grid">
                {articles.map((article) => (
                  <ArticleCard key={article.slug} article={article} />
                ))}
              </div>
            </div>
          </section>
        </main>
        <EditorialFooter />
      </>
    );
  }

  if (slug[0] === 'category' && slug[1]) {
    const category = slug[1];
    const articles = getArticlesByCategory(category);

    if (articles.length === 0) {
      notFound();
    }

    return (
      <>
        <EditorialHeader />
        <main id="main-content">
          <EditorialHero
            eyebrow="Category view"
            title={`${humanizeCategory(category)} articles`}
            description="A focused slice of the Vanilla Hytale editorial system for readers who already know which decision angle they want to explore first."
            badges={[`${articles.length} articles`, 'Topic-aware', 'Linked to live routes']}
            actions={[
              { href: '/blog', label: 'Back to blog' },
              { href: '/guides', label: 'Guide hub', variant: 'secondary' },
            ]}
            backgroundSrc="/img/hytale/hytale_vanilla_servers_list_6.jpeg"
          />

          <section className="article-related-section">
            <div className="container">
              <div className="article-card-grid">
                {articles.map((article) => (
                  <ArticleCard key={article.slug} article={article} />
                ))}
              </div>
            </div>
          </section>
        </main>
        <EditorialFooter />
      </>
    );
  }

  const article = getArticleBySlug(slug[0]);
  if (article) {
    const related = getRelatedArticles(article, 3);

    return (
      <ArticleShell
        article={article}
        related={related}
        body={<MDXRemote source={article.body} components={getArticleMdxComponents(article.frontmatter.articleCtas.segue)} />}
      />
    );
  }

  const legacy = getLegacyArchiveBySlug(slug[0]);
  if (legacy) {
    return <LegacyArchiveArticle legacy={legacy} body={<MDXRemote source={legacy.content} />} />;
  }

  notFound();
}
