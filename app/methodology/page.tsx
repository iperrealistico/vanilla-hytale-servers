import Link from 'next/link';

import { EditorialFooter, EditorialHeader, EditorialHero } from '@/components/articles/EditorialChrome';
import { buildSurfaceMetadata } from '@/lib/articles/metadata';
import { getSiteContent } from '@/lib/content';

export const metadata = buildSurfaceMetadata({
  pathname: '/methodology',
  title: 'Vanilla Hytale Methodology | How the Directory and Blog Judge Vanilla-First Claims',
  description: 'Understand the scoring rubric, exclusion rules, and editorial logic behind VanillaHytaleServers.com so you can read server listings and guide articles with the right context.',
});

export default function MethodologyPage() {
  const content = getSiteContent();

  return (
    <>
      <EditorialHeader />
      <main id="main-content">
        <EditorialHero
          eyebrow="Support route"
          title={content.methodology.title}
          description="This route turns the homepage scoring summary into a true reference page. Articles link here when the useful next step is understanding the lens behind the directory before trusting a score or a vanilla-first claim."
          badges={['Exclusion rules', 'Scoring categories', 'Editorial guardrails']}
          actions={[
            { href: '/servers', label: 'Browse servers' },
            { href: '/guides', label: 'Guide hub', variant: 'secondary' },
          ]}
          backgroundSrc="/img/hytale/hytale_vanilla_servers_list_8.jpeg"
        />

        <section className="article-related-section">
          <div className="container guide-grid guide-grid--two-up">
            <div className="panel">
              <h2>Exclusion rules that gate the directory</h2>
              <ul className="article-body-list">
                {content.methodology.exclusionRules.map((rule, index) => (
                  <li key={index} dangerouslySetInnerHTML={{ __html: rule }}></li>
                ))}
              </ul>
            </div>
            <div className="panel">
              <h2>Score categories that shape the ranking</h2>
              <ul className="article-body-list">
                {content.methodology.scoreCategories.map((rule, index) => (
                  <li key={index} dangerouslySetInnerHTML={{ __html: rule }}></li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="article-related-section">
          <div className="container guide-grid guide-grid--two-up">
            <div className="panel">
              <span className="editorial-eyebrow">How articles use this page</span>
              <p>
                Articles link here when a claim like no pay-to-win, vanilla-first, or calm SMP sounds attractive but needs a concrete rubric. The purpose is to move readers from marketing language to comparable criteria.
              </p>
            </div>
            <div className="panel">
              <span className="editorial-eyebrow">Next step</span>
              <p>
                After you read the rubric, go back to <Link href="/servers">the shortlist</Link> or use the <Link href="/guides">guide hub</Link> to unpack a specific decision in more depth.
              </p>
            </div>
          </div>
        </section>
      </main>
      <EditorialFooter />
    </>
  );
}
