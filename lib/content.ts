import fs from 'fs';
import path from 'path';

export interface SiteContent {
    meta: any;
    header: any;
    hero: any;
    servers: any;
    methodology: any;
    faq: any;
    suggest: any;
    footer: any;
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
