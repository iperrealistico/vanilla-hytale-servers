import { AiBlogConfig } from '@/blog-module';

export const blogConfig: AiBlogConfig = {
    blog: {
        siteName: 'Best Vanilla Hytale Servers',
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        basePath: '/blog',
        defaultAuthor: 'Hytale Observer',
        branding: {
            primaryColor: '#6366f1', // Indigo
        },
        categories: {
            news: 'Hytale News',
            patch_notes: 'Update Logs',
            spotlight: 'Deep Dives & Lore',
            guide: 'Guides & Tutorials',
        },
        // The "Brain": Instructions for the Director Mode
        typologyDefinitions: [
            {
                id: 'news',
                title: 'Hytale News',
                intent: 'Cover general Hytale news, development updates from the team, and community announcements. Focus on the "big picture" and excitement. Use a journalistic, hype-building tone.'
            },
            {
                id: 'patch_notes',
                title: 'Update Logs',
                intent: 'Monitor and summarize official game patch notes, hotfixes, and technical changes. Focus on explaining *what* changed and how it impacts gameplay. Use a technical but accessible tone.'
            },
            {
                id: 'spotlight',
                title: 'Deep Explore',
                intent: 'Pick a specific game element (a biome, a mob, a weapon, a faction) and write a comprehensive deep-dive. Explain its lore, mechanics, and role in the world. Use an immersive, storytelling tone.'
            },
            {
                id: 'guide',
                title: 'Game Guide',
                intent: 'Create a step-by-step tutorial or "how-to" guide for a specific task (e.g., "How to craft X", "Best starting strategies"). Focus on utility, clarity, and helpfulness for new players.'
            }
        ]
    },
    storage: {
        adapter: 'file', // Simple local storage for now
    },
    ai: {
        provider: 'openai',
        apiKeyEnvVar: 'OPENAI_API_KEY',
        models: {
            writing: 'gpt-4o',
        },
        temperature: 0.7,
        topP: 0.9,
    },
    content: {
        lengthTargets: { news: 600, patch_notes: 500, spotlight: 1500, guide: 1000 },
        language: 'en',
        imagePolicy: 'generate', // Try to generate conceptual images
        slugStyle: 'hyphenated',
    },
    sources: {
        typologyStrategies: {
            // General News Strategy
            news: {
                allowedDomains: [
                    'hytale.com',
                    'hytalewiki.org',
                    'hytalehub.com',
                    'hytale.game',
                    'twitter.com',
                    'x.com'
                ],
                queryTemplates: [
                    "latest official Hytale news and announcements",
                    "Hytale development blog updates",
                    "Simon Hypixel Hytale twitter updates",
                    "Hytale community buzz and rumors this week"
                ]
            },
            // Patch Notes Strategy
            patch_notes: {
                allowedDomains: ['hytale.com'],
                queryTemplates: [
                    "Hytale official patch notes released recently",
                    "Hytale technical blog post graphics update",
                    "Hytale beta test hotfixes"
                ]
            },
            // Spotlight Strategy (Broad search allowed)
            spotlight: {
                queryTemplates: [
                    "Hytale lore deep dive {topic}",
                    "Hytale {topic} mechanics explained",
                    "History of {topic} in Hytale world"
                ]
            },
            // Guide Strategy
            guide: {
                allowedDomains: ['hytalewiki.org', 'hytaleguide.net', 'youtube.com'],
                queryTemplates: [
                    "How to {topic} in Hytale tutorial",
                    "Hytale guide for {topic}",
                    "Best strategies for {topic} in Hytale"
                ]
            }
        },
    },
    scheduling: {
        schedules: [
            // Weekly Schedule: 4 Posts/Week
            {
                name: 'Monday News',
                typology: 'news',
                cron: '0 10 * * 1', // Every Monday at 10:00
                researchMode: 'web-lite',
                timezone: 'UTC',
                publishImmediately: true,
                seoLevel: 5,
            },
            {
                name: 'Wednesday Spotlight',
                typology: 'spotlight',
                cron: '0 10 * * 3', // Every Wednesday at 10:00
                researchMode: 'deep', // Uses the deep research worker
                timezone: 'UTC',
                publishImmediately: true,
                seoLevel: 8,
            },
            {
                name: 'Friday Guide',
                typology: 'guide',
                cron: '0 10 * * 5', // Every Friday at 10:00
                researchMode: 'web-lite',
                timezone: 'UTC',
                publishImmediately: true,
                seoLevel: 5,
            },
            {
                name: 'Sunday Updates',
                typology: 'patch_notes',
                cron: '0 10 * * 0', // Every Sunday at 10:00
                researchMode: 'internal', // Usually summarizes known info or quick check
                timezone: 'UTC',
                publishImmediately: true,
                seoLevel: 3,
            }
        ],
    },
    friendsEnemies: {
        friends: [],
        enemies: [],
        behavior: {
            dedupAggressiveness: 0.6,
            backlinkFrequency: 0.3,
            topicAvoidanceDays: 14,
            maxBacklinksPerPost: 2,
        },
    },
};
