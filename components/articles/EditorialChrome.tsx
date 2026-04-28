import Link from 'next/link';
import Image from 'next/image';

interface EditorialHeroAction {
  href: string;
  label: string;
  variant?: 'primary' | 'secondary';
}

interface EditorialHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  badges?: string[];
  actions?: EditorialHeroAction[];
  backgroundSrc?: string;
  backgroundAlt?: string;
}

export function EditorialHeader() {
  return (
    <header className="site-header" role="banner">
      <div className="container">
        <div className="topbar">
          <Link className="brand pressable" href="/">
            <div className="brand-badge idle" aria-hidden="true">
              <Image src="/img/favicon.png" alt="" width={32} height={32} />
            </div>
            <div className="brand-title">
              <strong>VanillaHytaleServers.com</strong>
              <span>Curated editor picks</span>
            </div>
          </Link>

          <nav className="main-nav" aria-label="Main navigation">
            <Link className="nav-text pressable" href="/servers">Servers</Link>
            <Link className="nav-text pressable" href="/guides">Guides</Link>
            <Link className="nav-text pressable" href="/blog">Blog</Link>
            <Link className="btn btn-primary tilt pressable" href="/#suggest">
              <i className="fa-solid fa-paper-plane" aria-hidden="true"></i>
              Submit
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

export function EditorialHero({
  eyebrow,
  title,
  description,
  badges = [],
  actions = [],
  backgroundSrc = '/img/hytale/hytale_vanilla_servers_list_1.jpeg',
  backgroundAlt = '',
}: EditorialHeroProps) {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-panel tilt idle editorial-hero-panel" data-tilt-strength="0.45">
          <Image className="hero-bg-img" src={backgroundSrc} alt={backgroundAlt} width={1600} height={900} />
          <div className="hero-inner editorial-hero-inner">
            <div className="hero-content editorial-hero-copy">
              <span className="editorial-eyebrow">{eyebrow}</span>
              <h1>{title}</h1>
              <p>{description}</p>
              {badges.length > 0 || actions.length > 0 ? (
                <div className="editorial-hero-footer">
                  {badges.length > 0 ? (
                    <div className="hero-meta editorial-hero-badges">
                      {badges.map((badge) => (
                        <span key={badge}>{badge}</span>
                      ))}
                    </div>
                  ) : null}

                  {actions.length > 0 ? (
                    <div className="hero-cta editorial-hero-actions" aria-label="Primary actions">
                      {actions.map((action) => (
                        <Link
                          key={action.href}
                          className={`btn ${action.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'} tilt pressable`}
                          data-tilt-strength="0.40"
                          href={action.href}
                        >
                          {action.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function EditorialFooter() {
  return (
    <footer role="contentinfo" className="mt-20">
      <div className="container">
        <div className="footer-grid">
          <div>
            <p className="footer-title">VanillaHytaleServers.com</p>
            <p className="footer-text opacity-70">
              We help players compare vanilla-first Hytale servers, understand the gameplay footprint behind the label, and find the calmest route into survival SMPs that feel fair.
            </p>
          </div>
          <div className="footer-links">
            <Link className="link-pill" href="/servers"><i className="fa-solid fa-server"></i> Servers</Link>
            <Link className="link-pill" href="/guides"><i className="fa-solid fa-map"></i> Guides</Link>
            <Link className="link-pill" href="/blog"><i className="fa-solid fa-book"></i> Blog</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
