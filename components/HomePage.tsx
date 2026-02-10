import React from 'react';
import ServerCard from '@/components/ServerCard';
import ClientEffects from '@/components/ClientEffects';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import ThemeToggle from '@/components/ThemeToggle';
import { SiteContent } from '../lib/content';

export default function HomePage({ content, lang }: { content: SiteContent, lang: string }) {
    return (
        <>
            <div className="bg-floats" aria-hidden="true">
                <img className="bg-float" src="/img/hytale/hytale_vanilla_servers_list_11.jpeg" alt="" loading="lazy" decoding="async"
                    style={{ top: '38vh', left: '-6vw', transform: 'translate3d(0,0,0) rotate(-6deg) scale(1.05)' }} />
                <img className="bg-float" src="/img/hytale/hytale_vanilla_servers_list_12.jpeg" alt="" loading="lazy" decoding="async"
                    style={{ top: '132vh', right: '-10vw', width: 'min(820px, 66vw)', transform: 'translate3d(0,0,0) rotate(7deg) scale(1.04)' }} />
                <img className="bg-float" src="/img/hytale/hytale_vanilla_servers_list_13.jpeg" alt="" loading="lazy" decoding="async"
                    style={{ top: '242vh', left: '-8vw', width: 'min(720px, 60vw)', transform: 'translate3d(0,0,0) rotate(-4deg) scale(1.03)' }} />
                <img className="bg-float" src="/img/hytale/hytale_vanilla_servers_list_14.jpeg" alt="" loading="lazy" decoding="async"
                    style={{ top: '372vh', right: '-10vw', width: 'min(860px, 68vw)', transform: 'translate3d(0,0,0) rotate(6deg) scale(1.04)' }} />
                <img className="bg-float" src="/img/hytale/hytale_vanilla_servers_list_10.jpeg" alt="" loading="lazy" decoding="async"
                    style={{ top: '512vh', left: '-6vw', width: 'min(760px, 62vw)', transform: 'translate3d(0,0,0) rotate(-7deg) scale(1.05)' }} />
            </div>

            <header className="site-header" role="banner">
                <div className="container">
                    <div className="topbar">
                        <a className="brand pressable" href="/">
                            <div className="brand-badge idle" aria-hidden="true">
                                <img src="/img/favicon.png" alt="" width="32" height="32" />
                            </div>
                            <div className="brand-title">
                                <strong>{content.header.brandSmall}</strong>
                                <span>{content.header.brandSubtitle}</span>
                            </div>
                        </a>

                        <nav className="main-nav" aria-label="Main navigation">
                            <ThemeToggle />
                            <div className="nav-divider" aria-hidden="true" style={{ width: '1px', height: '20px', background: 'var(--stroke)', margin: '0 5px' }}></div>
                            <a className="nav-text pressable" href="#servers">Servers</a>
                            <a className="nav-text pressable" href="#faq">FAQ</a>
                            <a className="btn btn-primary tilt pressable" data-tilt-strength="0.70" href="#suggest">
                                <i className="fa-solid fa-paper-plane" aria-hidden="true"></i>
                                Submit
                            </a>
                        </nav>
                    </div>
                </div>
            </header>

            <main id="main-content">
                <section className="hero">
                    <div className="container">
                        <div className="hero-panel tilt idle" data-tilt-strength="0.60" data-reveal>
                            <img
                                className="hero-bg-img"
                                src="/img/hytale/hytale_vanilla_servers_list_1.jpeg"
                                alt="A beautiful Hytale screenshot showing a vanilla survival world"
                                width="1600"
                                height="900"
                            />
                            <div className="hero-inner">
                                <div className="hero-content">
                                    <h1 dangerouslySetInnerHTML={{ __html: content.hero.title }}></h1>
                                    <p dangerouslySetInnerHTML={{ __html: content.hero.description }}></p>

                                    <div className="hero-meta">
                                        <span><i className="fa-regular fa-calendar" aria-hidden="true"></i> Last updated: <strong>{content.hero.lastUpdated}</strong></span>
                                        <span><i className="fa-solid fa-scale-balanced" aria-hidden="true"></i> <a className="pressable" href="#methodology">How scoring works</a></span>
                                    </div>
                                </div>

                                <div className="hero-cta" aria-label="Primary actions">
                                    <a className="btn btn-primary tilt pressable" data-tilt-strength="0.70" href="#servers">
                                        <i className="fa-solid fa-arrow-down" aria-hidden="true"></i>
                                        Jump to servers
                                    </a>
                                    <a className="btn btn-secondary tilt pressable" data-tilt-strength="0.70" href="#faq">
                                        <i className="fa-solid fa-circle-question" aria-hidden="true"></i>
                                        Vanilla FAQ
                                    </a>
                                    <a className="btn btn-secondary tilt pressable" data-tilt-strength="0.70" href="#suggest">
                                        <i className="fa-solid fa-paper-plane" aria-hidden="true"></i>
                                        Submit
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="servers" aria-labelledby="servers-title">
                    <div className="container">
                        <h2 id="servers-title" className="sr-only">{content.servers.title}</h2>
                        <div className="cards">
                            {content.servers.items.map((item: any, i: number) => (
                                <ServerCard key={i} item={item} />
                            ))}
                        </div>
                    </div>
                </section>

                <section id="methodology" aria-labelledby="methodology-title">
                    <div className="container">
                        <div className="image-panel image-panel--top spacious tilt idle" data-tilt-strength="1.00" data-reveal style={{ marginTop: '16px', marginBottom: '22px' }}>
                            <img
                                src="/img/hytale/hytale_vanilla_servers_list_2.jpeg"
                                alt="Hytale screenshot used to explain scoring"
                                loading="lazy"
                                decoding="async"
                                width="1600"
                                height="900"
                            />
                            <div className="image-panel-content">
                                <h2 id="methodology-title" className="overlay-title">
                                    <span className="title-with-icon">
                                        <i className="fa-solid fa-scale-balanced" aria-hidden="true"></i>
                                        <span>{content.methodology.title}</span>
                                    </span>
                                </h2>
                                <p dangerouslySetInnerHTML={{ __html: content.methodology.description }}></p>

                                <div className="image-panel-actions">
                                    <button
                                        className="btn btn-primary pressable contact-btn"
                                        type="button"
                                        data-email="hello@vanillahytaleservers.com"
                                        aria-label="Copy hello@vanillahytaleservers.com"
                                    >
                                        <i className="fa-solid fa-envelope" aria-hidden="true"></i>
                                        <span className="btn-swap" aria-hidden="true">
                                            <span className="btn-label btn-label--base">Doubts?</span>
                                            <span className="btn-label btn-label--email">hello@vanillahytaleservers.com</span>
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid-2">
                            <div className="panel tilt idle" data-tilt-strength="1.00" data-reveal>
                                <h3>
                                    <span className="title-with-icon">
                                        <i className="fa-solid fa-ban" aria-hidden="true"></i>
                                        <span>Exclusion rules (must pass)</span>
                                    </span>
                                </h3>
                                <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--muted)' }}>
                                    {content.methodology.exclusionRules.map((rule: string, i: number) => (
                                        <li key={i} dangerouslySetInnerHTML={{ __html: rule }}></li>
                                    ))}
                                </ul>
                            </div>

                            <div className="panel tilt idle" data-tilt-strength="1.00" data-reveal>
                                <h3>
                                    <span className="title-with-icon">
                                        <i className="fa-solid fa-chart-column" aria-hidden="true"></i>
                                        <span>Editor score (0 to 100)</span>
                                    </span>
                                </h3>
                                <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--muted)' }}>
                                    {content.methodology.scoreCategories.map((cat: string, i: number) => (
                                        <li key={i} dangerouslySetInnerHTML={{ __html: cat }}></li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="filmstrip-section" aria-label="Hytale screenshots gallery">
                    <div className="filmstrip embla" data-embla>
                        <div className="embla__viewport" data-embla-viewport>
                            <div className="embla__container">
                                {['6', '7', '8', '9', '5'].map((num) => (
                                    <div key={num} className="embla__slide">
                                        <img className="embla__slide__img" src={`/img/hytale/hytale_vanilla_servers_list_${num}.jpeg`} alt="Hytale screenshot" loading="lazy" decoding="async" width="1600" height="900" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section id="faq" aria-labelledby="faq-title">
                    <div className="container">
                        <div className="image-panel image-panel--top spacious tilt idle" data-tilt-strength="1.00" data-reveal style={{ marginTop: '16px', marginBottom: '22px' }}>
                            <img
                                src="/img/hytale/hytale_vanilla_servers_list_3.jpeg"
                                alt="Hytale screenshot"
                                loading="lazy"
                                decoding="async"
                                width="1600"
                                height="900"
                            />
                            <div className="image-panel-content">
                                <h2 id="faq-title" className="overlay-title">
                                    <span className="title-with-icon">
                                        <i className="fa-solid fa-circle-question" aria-hidden="true"></i>
                                        <span>{content.faq.title}</span>
                                    </span>
                                </h2>
                                <p dangerouslySetInnerHTML={{ __html: content.faq.description }}></p>
                            </div>
                        </div>

                        <div className="panel tilt idle" data-tilt-strength="1.00" data-reveal>
                            {content.faq.items.map((item: any, i: number) => (
                                <details key={i} open={i === 0}>
                                    <summary>{item.question}</summary>
                                    <div className="details-content" dangerouslySetInnerHTML={{ __html: item.answer }}></div>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="suggest" aria-labelledby="suggest-title">
                    <div className="container">
                        <div className="image-panel image-panel--top spacious tilt idle" data-tilt-strength="1.00" data-reveal style={{ marginTop: '16px', marginBottom: '22px' }}>
                            <img
                                src="/img/hytale/hytale_vanilla_servers_list_4.jpeg"
                                alt="Hytale screenshot"
                                loading="lazy"
                                decoding="async"
                                width="1600"
                                height="900"
                            />
                            <div className="image-panel-content">
                                <h2 id="suggest-title" className="overlay-title">
                                    <span className="title-with-icon">
                                        <i className="fa-solid fa-paper-plane" aria-hidden="true"></i>
                                        <span>{content.suggest.title}</span>
                                    </span>
                                </h2>
                                <p dangerouslySetInnerHTML={{ __html: content.suggest.description }}></p>

                                <div className="image-panel-actions">
                                    <button
                                        className="btn btn-primary pressable contact-btn"
                                        id="contactBtn"
                                        type="button"
                                        data-email="hello@vanillahytaleservers.com"
                                    >
                                        <i className="fa-solid fa-envelope" aria-hidden="true"></i>
                                        <span className="btn-swap" aria-hidden="true">
                                            <span className="btn-label btn-label--base">Contact us</span>
                                            <span className="btn-label btn-label--email">hello@vanillahytaleservers.com</span>
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="panel tilt idle" data-tilt-strength="1.00" data-reveal>
                            <h3>
                                <span className="title-with-icon">
                                    <i className="fa-solid fa-list-check" aria-hidden="true"></i>
                                    <span>Requirements</span>
                                </span>
                            </h3>
                            <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--muted)' }}>
                                {content.suggest.requirements.map((req: string, i: number) => (
                                    <li key={i} dangerouslySetInnerHTML={{ __html: req }}></li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>
            </main>

            <footer role="contentinfo">
                <div className="container">
                    <div className="footer-grid" data-reveal>
                        <div>
                            <p className="footer-title">{content.footer.aboutTitle}</p>
                            <p className="footer-text" dangerouslySetInnerHTML={{ __html: content.footer.aboutText }}></p>
                            <p className="footer-text" style={{ marginTop: '10px' }} dangerouslySetInnerHTML={{ __html: content.footer.disclaimer }}></p>
                        </div>
                        <div className="footer-links" aria-label="Footer links">
                            <a className="link-pill tilt pressable" data-tilt-strength="0.55" href="#servers"><i className="fa-solid fa-arrow-up" aria-hidden="true"></i>Servers</a>
                            <a className="link-pill tilt pressable" data-tilt-strength="0.55" href="#methodology"><i className="fa-solid fa-scale-balanced" aria-hidden="true"></i>Scoring</a>
                            <a className="link-pill tilt pressable" data-tilt-strength="0.55" href="#suggest"><i className="fa-solid fa-paper-plane" aria-hidden="true"></i>Submit</a>
                        </div>
                    </div>
                </div>
            </footer>

            <div className="toast" id="toast" role="status" aria-live="polite"></div>

            <LanguageSwitcher currentLang={lang} />
            <ClientEffects />
        </>
    );
}
