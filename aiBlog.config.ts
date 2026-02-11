import { AiBlogConfig } from '@/blog-module';

export const blogConfig: AiBlogConfig = {
    blog: {
        siteName: 'Best Vanilla Hytale Servers',
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        basePath: '/blog',
        defaultAuthor: 'AI Assistant',
        branding: {
            primaryColor: '#6366f1', // Custom accent color
        },
        categories: {
            news: 'Tech News',
            guide: 'How-To Guides',
            deep_dive: 'Analysis',
        },
        // AI uses these to choose topics when mode is 'AUTO'
        typologyDefinitions: [
            { id: 'news', title: 'Tech News', intent: 'Summarize latest AI breakthroughs.' },
            { id: 'guide', title: 'How-To', intent: 'Step-by-step technical guides.' },
            { id: 'deep_dive', title: 'Analysis', intent: 'Research-heavy long-form articles.' },
        ]
    },
    storage: {
        adapter: 'file', // or 'supabase'
        // If using supabase:
        // supabase: { urlEnvVar: 'SUPABASE_URL', keyEnvVar: 'SUPABASE_SERVICE_ROLE_KEY' }
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
        lengthTargets: { news: 400, guide: 800, deep_dive: 2000 },
        language: 'en',
        imagePolicy: 'generate',
        slugStyle: 'hyphenated',
    },
    sources: {
        typologyStrategies: {
            news: { rssFeeds: ['https://techcrunch.com/feed/'] },
        },
    },
    scheduling: {
        schedules: [],
    },
    friendsEnemies: {
        friends: [],
        enemies: [],
        behavior: {
            dedupAggressiveness: 0.5,
            backlinkFrequency: 0.3,
            topicAvoidanceDays: 30,
            maxBacklinksPerPost: 2,
        },
    },
};
