"use client";

import React from 'react';

export default function ServerCard({ item }: { item: any }) {
    if (item.type === 'slot') {
        return (
            <article className="card slot tilt idle" data-tilt-strength="1.00" id={`slot${item.rank}`} data-reveal>
                <span className="rank-badge" aria-hidden="true"><i className="fa-solid fa-medal"></i>#{item.rank}</span>

                <div className="card-head">
                    <div className="card-title-row">
                        <div>
                            <h3>{item.title}</h3>
                            <p className="subtitle" dangerouslySetInnerHTML={{ __html: item.subtitle }}></p>
                        </div>
                        <div className="badges">
                            <span className="badge score"><i className="fa-solid fa-clipboard-check" aria-hidden="true"></i>Status: <strong>{item.status}</strong></span>
                        </div>
                    </div>

                    <div className="facts" aria-label="Quick facts">
                        {item.facts.map((fact: string, i: number) => (
                            <span key={i} className="fact" dangerouslySetInnerHTML={{ __html: fact }}></span>
                        ))}
                    </div>

                    <div className="cta-row">
                        <div className="ip-box" aria-label="Submit your server">
                            <i className="fa-solid fa-flag-checkered" aria-hidden="true"></i>
                            <code>{item.ipText}</code>
                            <a className="btn-slot pressable" href="#suggest" data-tilt-strength="0.40">
                                <i className="fa-solid fa-paper-plane" aria-hidden="true"></i>Submit
                            </a>
                        </div>
                    </div>
                </div>

                <div className="card-body">
                    <details data-reveal>
                        <summary>
                            Submission checklist
                            <span className="meta"><i className="fa-solid fa-list-check" aria-hidden="true"></i>What we need</span>
                        </summary>
                        <div className="details-content">
                            <ul>
                                <li>Server name and IP (plus region and primary language).</li>
                                <li>Rules link: grief, PvP, resets, moderation expectations.</li>
                                <li>Monetization policy link: confirm no pay-to-win advantages.</li>
                                <li>Short vanilla-first statement: what is changed, if anything.</li>
                            </ul>
                        </div>
                    </details>
                </div>
            </article>
        );
    }

    const cardClasses = `card ${item.isFeatured ? 'featured' : ''} ${item.highlight ? 'highlighted' : ''} tilt idle`.trim();

    return (
        <article className={cardClasses} data-tilt-strength="1.05" id={item.id} data-reveal>
            <span className="rank-badge" aria-hidden="true"><i className="fa-solid fa-crown"></i>#{item.rank}</span>

            <div className="card-head">
                <div className="card-title-row">
                    <div>
                        <h3>{item.title}</h3>
                        <p className="subtitle" dangerouslySetInnerHTML={{ __html: item.subtitle }}></p>
                    </div>
                    <div className="badges">
                        {item.isFeatured && <span className="badge featured"><i className="fa-solid fa-star" aria-hidden="true"></i>Featured</span>}
                        <span className="badge score"><i className="fa-solid fa-chart-simple" aria-hidden="true"></i>Editor Score: <strong>{item.score}</strong>/100</span>
                    </div>
                </div>

                <div className="facts" aria-label="Quick facts">
                    {item.facts.map((fact: string, i: number) => (
                        <span key={i} className="fact" dangerouslySetInnerHTML={{ __html: fact }}></span>
                    ))}
                </div>

                <div className="cta-row">
                    <div className="ip-box" aria-label="Server IP">
                        <i className="fa-solid fa-network-wired" aria-hidden="true"></i>
                        <code>{item.ip}</code>
                        <button className="btn-copy pressable" type="button" data-copy={item.ip} data-tilt-strength="0.40">
                            <i className="fa-regular fa-copy" aria-hidden="true"></i>Copy IP
                        </button>
                    </div>

                    <div className="links" aria-label="Server links">
                        <a className="link-pill tilt pressable" data-tilt-strength="0.55" href={item.discordUrl} target="_blank" rel="noopener noreferrer">
                            <i className="fa-brands fa-discord" aria-hidden="true"></i>Discord
                        </a>
                        <a className="link-pill tilt pressable" data-tilt-strength="0.55" href={item.websiteUrl} target="_blank" rel="noopener noreferrer">
                            <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>Website
                        </a>
                    </div>
                </div>
            </div>

            <div className="card-body">
                <details className="glance" data-bars data-reveal>
                    <summary>
                        In a glance
                        <span className="meta"><i className="fa-solid fa-bars-progress" aria-hidden="true"></i>Score breakdown</span>
                    </summary>
                    <div className="details-content">
                        <p>These bars summarize how the editor score is built for this server.</p>

                        <div className="score-bars" aria-label="Score breakdown">
                            {item.scoreBreakdown.map((bar: any, i: number) => (
                                <div key={i} className="bar" data-value={bar.value} data-max={bar.max}>
                                    <div className="bar-label">{bar.label} <span>{bar.value}/{bar.max}</span></div>
                                    <div className="bar-track"><div className="bar-fill"></div></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </details>

                {item.details.map((detail: any, i: number) => (
                    <details key={i} data-reveal>
                        <summary>
                            {detail.title}
                            <span className="meta"><i className="fa-solid fa-scroll" aria-hidden="true"></i>{detail.meta}</span>
                        </summary>
                        <div className="details-content" dangerouslySetInnerHTML={{ __html: detail.content }}></div>
                    </details>
                ))}
            </div>
        </article>
    );
}
