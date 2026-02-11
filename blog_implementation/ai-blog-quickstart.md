# AI Blog Module Quickstart

Get your AI-powered blog running in 5 minutes.

## 1. Copy the Module
Copy the `packages/ai-blog-module/src` folder into your Next.js project as `/blog-module`.

## 2. Install Dependencies
```bash
npm install zod rss-parser @supabase/supabase-js @anthropic-ai/sdk @google/generative-ai
```

## 3. Environment Variables
Add these to your `.env.local`:
```bash
OPENAI_API_KEY=sk-...
FIRECRAWL_API_KEY=fc-...
# Optional: Supabase
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 4. Basic Configuration
Create `aiBlog.config.ts` in your root:

```typescript
import { AiBlogConfig } from '@/blog-module';

export const blogConfig: AiBlogConfig = {
    blog: {
        siteName: 'AI Lab',
        baseUrl: 'http://localhost:3000',
        basePath: '/blog',
        categories: { tech: 'Technology' },
        typologyDefinitions: [{ id: 'tech', title: 'Tech', intent: 'AI news.' }]
    },
    storage: { adapter: 'file' },
    ai: { provider: 'openai', apiKeyEnvVar: 'OPENAI_API_KEY', models: { writing: 'gpt-4o' } },
    content: { lengthTargets: { tech: 500 }, language: 'en' },
    sources: { typologyStrategies: { tech: { rssFeeds: [] } } },
    scheduling: { schedules: [] },
};
```

## 5. UI Route
Create `app/blog/[[...slug]]/page.tsx`:
```typescript
import { BlogLayout, PostList, PostDetail } from '@/blog-module/ui/components';
import { FileStorageAdapter } from '@/blog-module/adapters/storage/file';
import { blogConfig } from '@/aiBlog.config';

const storage = new FileStorageAdapter('./data/blog');

export default async function Page({ params }) {
    const { slug } = await params;
    if (!slug) return <BlogLayout config={blogConfig}><PostList posts={await storage.listPosts()} basePath="/blog" /></BlogLayout>;
    const post = await storage.getPostBySlug(slug[0]);
    return <BlogLayout config={blogConfig} isPost><PostDetail post={post} /></BlogLayout>;
}
```

## 6. API Route
Create `app/api/blog/[...route]/route.ts`:
```typescript
import { createHandlers } from '@/blog-module';
import { blogConfig } from '@/aiBlog.config';
const handlers = createHandlers(blogConfig);
export const GET = (req, { params }) => handlers[params.route[0]](req);
export const POST = (req, { params }) => handlers[params.route[0]](req);
```

## 7. Run It
Visit `/api/blog/run?typology=tech&research=web-lite` to generate your first post!
Wait 30-60 seconds, then check `/blog`.
