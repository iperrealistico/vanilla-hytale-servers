const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

async function extract() {
    const html = fs.readFileSync(path.join(__dirname, '..', 'legacy', 'index.html'), 'utf8');
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const site = {
        meta: {
            title: doc.title,
            description: doc.querySelector('meta[name="description"]')?.content || '',
            ogTitle: doc.querySelector('meta[property="og:title"]')?.content || '',
            ogDescription: doc.querySelector('meta[property="og:description"]')?.content || '',
            ogImage: doc.querySelector('meta[property="og:image"]')?.content || '',
            twitterTitle: doc.querySelector('meta[name="twitter:title"]')?.content || '',
            twitterDescription: doc.querySelector('meta[name="twitter:description"]')?.content || '',
            twitterImage: doc.querySelector('meta[name="twitter:image"]')?.content || '',
        },
        header: {
            brandSmall: doc.querySelector('.brand-title strong')?.textContent || '',
            brandSubtitle: doc.querySelector('.brand-title span')?.textContent || '',
        },
        hero: {
            title: doc.querySelector('h1')?.innerHTML || '',
            description: doc.querySelector('.hero p')?.innerHTML || '',
            lastUpdated: doc.querySelector('.hero-meta strong')?.textContent || '',
        },
        servers: {
            title: doc.querySelector('#servers-title')?.textContent || 'Vanilla Hytale servers list',
            items: []
        },
        methodology: {
            title: doc.querySelector('#methodology-title span span')?.textContent || '',
            description: doc.querySelector('#methodology .image-panel-content p')?.innerHTML || '',
            exclusionRules: Array.from(doc.querySelectorAll('#methodology .panel:nth-child(1) ul li')).map(li => li.innerHTML),
            scoreCategories: Array.from(doc.querySelectorAll('#methodology .panel:nth-child(2) ul li')).map(li => li.innerHTML),
        },
        faq: {
            title: doc.querySelector('#faq-title span span')?.textContent || '',
            description: doc.querySelector('#faq .image-panel-content p')?.innerHTML || '',
            items: Array.from(doc.querySelectorAll('#faq .panel details')).map(details => ({
                question: details.querySelector('summary')?.childNodes[0]?.textContent?.trim() || '',
                answer: details.querySelector('.details-content')?.innerHTML || ''
            }))
        },
        suggest: {
            title: doc.querySelector('#suggest-title span span')?.textContent || '',
            description: doc.querySelector('#suggest .image-panel-content p')?.innerHTML || '',
            requirements: Array.from(doc.querySelectorAll('#suggest .panel ul li')).map(li => li.innerHTML),
        },
        footer: {
            aboutTitle: doc.querySelector('.footer-title')?.textContent || '',
            aboutText: doc.querySelector('.footer-text:nth-child(2)')?.innerHTML || '',
            disclaimer: doc.querySelector('.footer-text:nth-child(3)')?.innerHTML || '',
        }
    };

    // Extract servers
    const serverCards = doc.querySelectorAll('#servers .card');
    serverCards.forEach(card => {
        if (card.classList.contains('slot')) {
            site.servers.items.push({
                type: 'slot',
                rank: card.querySelector('.rank-badge')?.textContent?.replace('#', '') || '',
                title: card.querySelector('h3')?.textContent || '',
                subtitle: card.querySelector('.subtitle')?.innerHTML || '',
                status: card.querySelector('.badge.score strong')?.textContent || '',
                facts: Array.from(card.querySelectorAll('.fact')).map(f => f.innerHTML),
                ipText: card.querySelector('.ip-box code')?.textContent || ''
            });
        } else {
            site.servers.items.push({
                type: 'server',
                id: card.id,
                rank: card.querySelector('.rank-badge')?.textContent?.replace('#', '') || '',
                title: card.querySelector('h3')?.textContent || '',
                subtitle: card.querySelector('.subtitle')?.innerHTML || '',
                score: card.querySelector('.badge.score strong')?.textContent || '',
                isFeatured: card.classList.contains('featured'),
                facts: Array.from(card.querySelectorAll('.fact')).map(f => f.innerHTML),
                ip: card.querySelector('.ip-box code')?.textContent || '',
                discordUrl: card.querySelector('a[href*="discord"]')?.href || '',
                websiteUrl: card.querySelector('.links a:not([href*="discord"])')?.href || '',
                scoreBreakdown: Array.from(card.querySelectorAll('.score-bars .bar')).map(bar => ({
                    label: bar.querySelector('.bar-label')?.childNodes[0]?.textContent?.trim() || '',
                    value: bar.getAttribute('data-value'),
                    max: bar.getAttribute('data-max')
                })),
                details: Array.from(card.querySelectorAll('.card-body > details:not(.glance)')).map(d => ({
                    title: d.querySelector('summary')?.childNodes[0]?.textContent?.trim() || '',
                    meta: d.querySelector('.meta')?.textContent || '',
                    content: d.querySelector('.details-content')?.innerHTML || ''
                }))
            });
        }
    });

    const contentDir = path.join(__dirname, '..', 'content');
    if (!fs.existsSync(contentDir)) {
        fs.mkdirSync(contentDir);
    }

    // Wrap in language object
    const finalSite = {
        it: site,
        en: JSON.parse(JSON.stringify(site)) // Deep copy for English
    };

    fs.writeFileSync(path.join(contentDir, 'site.json'), JSON.stringify(finalSite, null, 2));
    console.log('Extraction complete: content/site.json created.');
}

extract().catch(err => {
    console.error(err);
    process.exit(1);
});
