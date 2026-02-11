import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
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
    cron: async (req: any) => {
      const scheduler = getScheduler();
      await scheduler.runCron();
      return NextResponse.json({ success: true, message: 'Cron run completed' });
    },
    run: async (req: any) => {
      const { searchParams } = new URL(req.url);
      const typology = searchParams.get('typology') || 'news';
      const researchMode = searchParams.get('researchMode') || undefined;

      // SSE Setup
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const send = (data: any) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
          };

          try {
            const generator = getGenerator();
            const post = await generator.generate(typology, {
              researchMode,
              onProgress: (status) => send({ type: 'progress', status })
            });
            send({ type: 'complete', post });
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
      // Inline simple sitemap generation
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
