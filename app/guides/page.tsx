import Link from 'next/link';

import { EditorialFooter, EditorialHeader, EditorialHero } from '@/components/articles/EditorialChrome';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { buildSurfaceMetadata } from '@/lib/articles/metadata';
import { getArticleCategories, getArticlesByCategory, humanizeCategory } from '@/lib/articles/content';

export const metadata = buildSurfaceMetadata({
  pathname: '/guides',
  title: 'Vanilla Hytale Guides | Server Selection, Fairness, and SMP Onboarding',
  description: 'Explore the Hytale guide hub for vanilla-first server selection, fairness checks, semi-vanilla comparisons, and the onboarding questions that matter before you join an SMP.',
});

export default function GuidesPage() {
  const categories = getArticleCategories().map((category) => ({
    category,
    articles: getArticlesByCategory(category),
  }));

  return (
    <>
      <EditorialHeader />
      <main id="main-content">
        <EditorialHero
          eyebrow="Pillar route"
          title="The guide hub for players who want a better vanilla-first shortlist"
          description="This route is the editorial bridge between the server directory and the public blog. Use it when you want to understand a decision pattern, then jump back into the directory with a clearer filter in mind."
          badges={['Pillar route', 'Article hub', 'Built for internal links']}
          actions={[
            { href: '/servers', label: 'Browse servers' },
            { href: '/blog', label: 'See all articles', variant: 'secondary' },
          ]}
          backgroundSrc="/img/hytale/hytale_vanilla_servers_list_7.jpeg"
        />

        <section className="article-related-section">
          <div className="container guide-grid guide-grid--two-up">
            <div className="panel">
              <span className="editorial-eyebrow">How to use this hub</span>
              <h2>Start with the decision you are struggling with</h2>
              <p>
                Some readers need a fairness filter first. Others need help telling vanilla from semi-vanilla, or spotting weak rule pages before they join. Pick the angle below, then return to <Link href="/servers">the directory</Link> with better criteria.
              </p>
            </div>
            <div className="panel">
              <span className="editorial-eyebrow">Why it exists</span>
              <h2>The homepage cards are short on purpose</h2>
              <p>
                The directory is designed for scanning. The guides are where the nuance lives: how to interpret monetization, how to read community signals, and why a server can sound vanilla while still changing the survival loop too much.
              </p>
            </div>
          </div>
        </section>

        {categories.map(({ category, articles }) => (
          <section className="article-related-section" key={category}>
            <div className="container">
              <div className="article-section-heading">
                <span className="editorial-eyebrow">Category hub</span>
                <h2>{humanizeCategory(category)}</h2>
                <p>{articles[0]?.analysis.intro ?? 'Topic-aware guides for this part of the Hytale server selection process.'}</p>
              </div>
              <div className="article-card-grid">
                {articles.map((article) => (
                  <ArticleCard key={article.slug} article={article} />
                ))}
              </div>
            </div>
          </section>
        ))}
      </main>
      <EditorialFooter />
    </>
  );
}
