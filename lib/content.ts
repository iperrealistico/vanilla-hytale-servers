import fs from 'fs';
import path from 'path';

export interface ServerItem {
    type: string;
    id?: string;
    rank?: string;
    title: string;
    subtitle: string;
    score?: string;
    highlight?: boolean;
    isFeatured?: boolean;
    facts: string[];
    ip?: string;
    ipText?: string;
    discordUrl?: string;
    websiteUrl?: string;
    scoreBreakdown?: Array<{ label: string; value: string; max: string }>;
    details?: Array<{ title: string; meta: string; content: string }>;
    status?: string;
}

export interface FaqItem {
    question: string;
    answer: string;
}

export interface ManifestEntry {
    size: number;
    mtime: string;
}

export interface SiteContent {
    meta: {
        title: string;
        description: string;
        ogTitle: string;
        ogDescription: string;
        ogImage: string;
        twitterTitle: string;
        twitterDescription: string;
        twitterImage: string;
    };
    header: {
        brandSmall: string;
        brandSubtitle: string;
        nav: Array<{ label: string; url: string; isButton?: boolean; icon?: string }>;
    };
    hero: {
        title: string;
        description: string;
        lastUpdated: string;
        backgroundFloats: Array<{ src: string; style: Record<string, string> }>;
        cta: Array<{ label: string; url: string; icon?: string; class: string; tilt?: string }>;
    };
    servers: {
        title: string;
        items: ServerItem[];
    };
    methodology: {
        title: string;
        description: string;
        exclusionRules: string[];
        contact: { label: string; email: string };
        scoreCategories: string[];
        sectionHeaders: { exclusionRules: string; scoreCategories: string };
    };
    filmstrip: {
        images: Array<{ src: string; alt: string }>;
    };
    faq: {
        title: string;
        description: string;
        items: FaqItem[];
    };
    suggest: {
        title: string;
        description: string;
        requirementsTitle: string;
        requirements: string[];
        cta: { label: string; email: string };
    };
    footer: {
        aboutTitle: string;
        aboutText: string;
        disclaimer: string;
        links: Array<{ label: string; url: string; icon: string }>;
    };
}

export function getSiteContent(): SiteContent {
    const filePath = path.join(process.cwd(), 'content', 'site.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
}

export function getUploadsManifest() {
    const filePath = path.join(process.cwd(), 'content', 'uploads.manifest.json');
    if (!fs.existsSync(filePath)) return {};
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
}
