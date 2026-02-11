import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { AiBlogConfig } from '../config/schema';
import { AIProvider, StorageAdapter } from '../core/types';
import { Generator } from '../core/generator';
import { Scheduler } from '../core/scheduler';
import { Director } from '../core/director';
import { OpenAIProvider } from '../adapters/ai/openai';
import { AnthropicProvider } from '../adapters/ai/anthropic';
import { GeminiProvider } from '../adapters/ai/gemini';
import { FileStorageAdapter } from '../adapters/storage/file';
import { SupabaseStorageAdapter } from '../adapters/storage/supabase';

export const createHandlers = (config: AiBlogConfig) => {
  const getStorage = (): StorageAdapter => {
    if (config.storage.adapter === 'supabase') {
      return new SupabaseStorageAdapter(config);
    }
    return new FileStorageAdapter(config.storage.connectionStringEnvVar || path.join(process.cwd(), 'data/blog'));
  };

  const getAI = (): AIProvider => {
    switch (config.ai.provider) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'google':
        return new GeminiProvider(config);
      default:
        throw new Error(`Unsupported AI provider: ${(config.ai as any).provider}`);
    }
  };

  const storage = getStorage();
  const getGenerator = () => new Generator(config, getAI(), storage);
  const getDirector = () => new Director(config, getAI(), storage);
  const getScheduler = () => new Scheduler(config, getGenerator(), getDirector());

  return {
    posts: async (req: NextRequest) => {
      const method = req.method;

      if (method === 'GET') {
        const posts = await storage.listPosts();
        return NextResponse.json(posts);
      }

      if (method === 'POST') {
        const post = await req.json();
        const saved = await storage.savePost(post);
        return NextResponse.json(saved);
      }

      if (method === 'DELETE') {
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get('slug');
        if (!slug) return NextResponse.json({ success: false, message: 'Slug required' }, { status: 400 });
        await storage.deletePost(slug);
        return NextResponse.json({ success: true });
      }

      return new Response('Method Not Allowed', { status: 405 });
    },
    schedules: async (req: NextRequest) => {
      const method = req.method;
      const schedulesPath = path.join(process.cwd(), 'data/schedules.json');

      if (method === 'GET') {
        try {
          const data = await fs.readFile(schedulesPath, 'utf-8');
          return NextResponse.json(JSON.parse(data));
        } catch (e) {
          return NextResponse.json([]);
        }
      }

      if (method === 'POST') {
        const schedules = await req.json();
        await fs.mkdir(path.dirname(schedulesPath), { recursive: true });
        await fs.writeFile(schedulesPath, JSON.stringify(schedules, null, 2));

        // Also sync to GitHub for persistence
        const { commitFiles } = require('@/lib/github');
        await commitFiles([{ path: 'data/schedules.json', content: JSON.stringify(schedules, null, 2) }]);

        return NextResponse.json({ success: true });
      }

      return new Response('Method Not Allowed', { status: 405 });
    },
    cron: async (req: any) => {
      const scheduler = getScheduler();
      const completedOneShots = await scheduler.runCron();

      if (completedOneShots.length > 0) {
        console.log(`[Cron] Cleaning up ${completedOneShots.length} one-shot schedules.`);
        const schedulesPath = path.join(process.cwd(), 'data/schedules.json');
        try {
          const data = await fs.readFile(schedulesPath, 'utf-8');
          const schedules = JSON.parse(data);
          const updated = schedules.filter((s: any) => !completedOneShots.includes(s.id));
          await fs.writeFile(schedulesPath, JSON.stringify(updated, null, 2));

          // Sync cleanup to GitHub
          const { commitFiles } = require('@/lib/github');
          await commitFiles([{ path: 'data/schedules.json', content: JSON.stringify(updated, null, 2) }]);
        } catch (e) {
          console.error('[Cron] Cleanup failed:', e);
        }
      }

      return NextResponse.json({ success: true, message: 'Cron run completed', cleanedUp: completedOneShots.length });
    },
    run: async (req: any) => {
      const { searchParams } = new URL(req.url);
      const typology = searchParams.get('typology') || 'news';
      const researchMode = searchParams.get('researchMode') || 'internal';
      const researchFile = searchParams.get('researchFile') || undefined;

      // SSE Setup
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const send = (data: any) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          };

          try {
            const generator = getGenerator();

            // SPECIAL CASE: Trigger GitHub Research
            if (researchMode === 'deep' && !researchFile) {
              const result = await generator.initiateDeepResearch(typology, (status) => send({ type: 'progress', status }));
              if (result.success) {
                send({ type: 'research_triggered', topic: result.topic });
              } else {
                send({ type: 'error', message: 'Failed to trigger GitHub Action' });
              }
            } else {
              // NORMAL CASE: Generate Article
              const post = await generator.generate(typology, {
                researchMode,
                researchFile,
                onProgress: (status) => send({ type: 'progress', status })
              });
              send({ type: 'complete', post });
            }
          } catch (error: any) {
            send({ type: 'error', message: error.message });
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    },
    sitemap: async (req: any) => {
      const posts = await storage.listPosts();
      const baseUrl = config.blog.baseUrl;
      const basePath = config.blog.basePath || '/blog';
      const urls = [
        `${baseUrl}${basePath}`,
        ...posts.map(post => `${baseUrl}${basePath}/${post.slug}`)
      ];
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(url => `<url><loc>${url}</loc></url>`).join('\n  ')}
</urlset>`;
      return new Response(sitemap, { headers: { 'Content-Type': 'application/xml' } });
    },
    rss: async (req: any) => {
      const posts = await storage.listPosts();
      const baseUrl = config.blog.baseUrl;
      const basePath = config.blog.basePath || '/blog';
      const items = posts.slice(0, 20).map(post => `
    <item>
      <title>${post.title}</title>
      <link>${baseUrl}${basePath}/${post.slug}</link>
      <description>${post.excerpt}</description>
    </item>`).join('');
      const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${config.blog.siteName}</title>
    <link>${baseUrl}${basePath}</link>
    ${items}
  </channel>
</rss>`;
      return new Response(rss, { headers: { 'Content-Type': 'application/xml' } });
    }
  };
};
