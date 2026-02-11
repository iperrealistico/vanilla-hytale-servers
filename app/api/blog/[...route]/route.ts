import { NextRequest } from 'next/server';
import { createHandlers } from '@/blog-module';
import { blogConfig } from '@/aiBlog.config';

const handlers = createHandlers(blogConfig);

export async function GET(req: NextRequest, { params }: { params: Promise<{ route: string[] }> }) {
    const { route } = await params;
    const action = route[0];

    if (action === 'cron') return handlers.cron(req);
    if (action === 'run') return handlers.run(req);
    if (action === 'sitemap') return handlers.sitemap(req);
    if (action === 'rss') return handlers.rss(req);
    if (action === 'posts') return handlers.posts(req);
    if (action === 'schedules') return handlers.schedules(req);

    return new Response('Not Found', { status: 404 });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ route: string[] }> }) {
    const { route } = await params;
    const action = route[0];

    if (action === 'run') return handlers.run(req);
    if (action === 'posts') return handlers.posts(req);
    if (action === 'schedules') return handlers.schedules(req);

    return new Response('Method Not Allowed', { status: 405 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ route: string[] }> }) {
    const { route } = await params;
    const action = route[0];

    if (action === 'posts') return handlers.posts(req);

    return new Response('Method Not Allowed', { status: 405 });
}
