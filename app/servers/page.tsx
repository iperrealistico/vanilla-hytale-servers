import Link from 'next/link';

import { EditorialFooter, EditorialHeader, EditorialHero } from '@/components/articles/EditorialChrome';
import ServerCard from '@/components/ServerCard';
import { buildSurfaceMetadata } from '@/lib/articles/metadata';
import { getSiteContent } from '@/lib/content';

export const metadata = buildSurfaceMetadata({
  pathname: '/servers',
  title: 'Vanilla Hytale Server Directory | Editor-Ranked Vanilla-First Picks',
  description: 'Browse the live Vanilla Hytale server directory, understand the gameplay footprint behind each listing, and use the same editor lens that powers the blog and methodology pages.',
});

export default async function ServersPage() {
  const content = getSiteContent();
  const activeServers = content.servers.items.filter((item) => !item.disabled);

  return (
    <>
      <EditorialHeader />
      <main id="main-content">
        <EditorialHero
          eyebrow="Directory route"
          title="The live vanilla-first Hytale server directory"
          description="Use this route when you want the shortlist first. Each listing keeps the same fairness, transparency, and gameplay-footprint lens that the blog articles explain in more depth."
          badges={['Editor-ranked', 'Vanilla-first lens', 'Fast comparison']}
          actions={[
            { href: '/guides', label: 'Read the guides' },
            { href: '/methodology', label: 'Scoring details', variant: 'secondary' },
          ]}
          backgroundSrc="/img/hytale/hytale_vanilla_servers_list_2.jpeg"
        />

        <section className="article-related-section">
          <div className="container">
            <div className="article-section-heading">
              <span className="editorial-eyebrow">Shortlist</span>
              <h2>Current featured servers</h2>
              <p>These cards stay close to the homepage but live on a standalone route so articles can link here directly when the next step is “show me the shortlist.”</p>
            </div>
            <div className="cards">
              {activeServers.map((item, index) => (
                <ServerCard key={item.id ?? `${item.type}-${index}`} item={item} />
              ))}
            </div>
          </div>
        </section>

        <section className="article-related-section">
          <div className="container guide-grid guide-grid--two-up">
            <div className="panel">
              <span className="editorial-eyebrow">Before you join</span>
              <h2>Use the guides when a listing sounds right but still feels vague</h2>
              <p>
                The <Link href="/guides">guide hub</Link> is where we unpack vague labels like vanilla, semi-vanilla, fair, or no pay-to-win. If a card looks promising, jump into the relevant article before you commit your time.
              </p>
            </div>
            <div className="panel">
              <span className="editorial-eyebrow">Need the rubric?</span>
              <h2>See how scoring actually works</h2>
              <p>
                The <Link href="/methodology">methodology page</Link> explains the exact editorial lens behind the directory so you know what the score rewards and what gets a listing rejected.
              </p>
            </div>
          </div>
        </section>
      </main>
      <EditorialFooter />
    </>
  );
}
