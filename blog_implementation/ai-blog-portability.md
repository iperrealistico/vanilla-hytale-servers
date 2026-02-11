# AI Blog Module Portability Guide

This guide explains how to port the AI-powered blog module from this repository into any other Next.js website. The module is designed to be "plug-and-play," providing a complete end-to-end system for content research, generation, storage, and display.

## 1. Architectural Overview

The AI Blog Module is built with a decoupled architecture that separates core logic from specific providers and storage implementations.

- **Core Logic**: Orchestrates the generation flow, from topic discovery to deep research and final publication.
- **Adapters**:
    - **AI Providers**: Supports OpenAI (via Direct API), Anthropic, and Gemini.
    - **Storage**: Supports Local File Storage and Supabase (PostgreSQL + pgvector).
    - **Sources**: Integrated with Firecrawl for web crawling and RSS for news discovery.
- **UI Components**: Provides a set of headless-ready React components styled with Tailwind CSS for consistent branding.
- **Next.js Integration**: Minimal route wiring required to get API handlers and UI pages running.

### Topic Selection Logic
When a schedule's `typology` is set to `AUTO`, the **Director** logic takes over. It analyzes the `typologyDefinitions` in your config and compares them against the last 10 published articles. It aims to maintain a balanced distribution, picking a underrepresented typology to ensure variety in your blog's content.

## 2. Prerequisites

- **Next.js 14+**: Must use the **App Router**.
- **Tailwind CSS**: Required for the provided UI components.
- **TypeScript**: The module is strictly typed.
- **Node.js 18+**.

### Required Environment Variables

Depending on your configuration, you will need:

```bash
# Core AI (Select one or more)
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
GOOGLE_GENERATIVE_AI_API_KEY=your_key

# Research & Sources
FIRECRAWL_API_KEY=your_key # Required for 'deep' and 'web-lite' research modes

# Storage (If using Supabase)
SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key # Needs bypass RLS to save posts
```

## 3. Installation Steps

### A. Module Setup

Copy the `packages/ai-blog-module` folder into your new project, or link it as a workspace. 

If copying manually:
1. Copy `packages/ai-blog-module/src` to `[your-app]/blog-module`.
2. Install dependencies:
   ```bash
   npm install zod rss-parser @supabase/supabase-js @anthropic-ai/sdk @google/generative-ai
   ```

### B. Configuration

Create a file named `aiBlog.config.ts` in your root or `lib/` folder. This file is the "brain" of your blog.

```typescript
import { AiBlogConfig } from '@/blog-module'; // Adjust path if needed

export const blogConfig: AiBlogConfig = {
    blog: {
        siteName: 'My AI Tech Blog',
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
    },
    content: {
        lengthTargets: { news: 400, guide: 800, deep_dive: 2000 },
        language: 'en',
    },
    sources: {
        typologyStrategies: {
            news: { rssFeeds: ['https://techcrunch.com/feed/'] },
        },
    },
    scheduling: {
        schedules: [
            {
                name: 'Daily News',
                typology: 'news',
                cron: '0 9 * * *',
                researchMode: 'web-lite',
            },
            {
                name: 'Random Deep Dive',
                typology: 'AUTO', // AI chooses topic based on typologyDefinitions
                cron: '0 10 * * 1',
                researchMode: 'deep',
            },
        ],
    },
};
```

### C. Route Integration

#### 1. API Handlers (`/app/api/blog/[...route]/route.ts`)

This catch-all route handles cron triggers, manual runs, and RSS/Sitemap generation.

```typescript
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

    return new Response('Not Found', { status: 404 });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ route: string[] }> }) {
    const { route } = await params;
    if (route[0] === 'run') return handlers.run(req);
    return new Response('Method Not Allowed', { status: 405 });
}
```

#### 2. UI Pages (`/app/blog/[[...slug]]/page.tsx`)

This catch-all route handles the list view, category filtering, and post details.

```typescript
import React from 'react';
import { notFound } from 'next/navigation';
import { BlogLayout, PostList, PostDetail } from '@/blog-module/ui/components';
import { FileStorageAdapter } from '@/blog-module/adapters/storage/file';
import { blogConfig } from '@/aiBlog.config';

// Change to SupabaseStorageAdapter(blogConfig) if using Supabase
const storage = new FileStorageAdapter('./data/blog');

export default async function BlogPage({ params }: { params: Promise<{ slug?: string[] }> }) {
    const { slug } = await params;

    // List View
    if (!slug || slug.length === 0) {
        const posts = await storage.listPosts();
        return (
            <BlogLayout config={blogConfig}>
                <PostList posts={posts} basePath="/blog" />
            </BlogLayout>
        );
    }

    // Category Filter
    if (slug[0] === 'category' && slug[1]) {
        const posts = await storage.listPosts({ category: slug[1] });
        return (
            <BlogLayout config={blogConfig}>
                <h2 className="text-2xl font-bold mb-8">Category: {slug[1]}</h2>
                <PostList posts={posts} basePath="/blog" />
            </BlogLayout>
        );
    }

    // Post Detail
    const post = await storage.getPostBySlug(slug[0]);
    if (!post) return notFound();

    return (
        <BlogLayout config={blogConfig} isPost={true}>
            <PostDetail post={post} />
        </BlogLayout>
    );
}
```

### D. Storage Setup

#### Option 1: Local File Storage
Ensure your deployment environment allows writing to the filesystem (e.g., VPS). 
Create the directory: `mkdir -p ./data/blog`.

#### Option 2: Supabase (Recommended for Production)
Run the following SQL in your Supabase SQL Editor:

```sql
-- 1. Enable vector extension
create extension if not exists vector;

-- 2. Create Posts table
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content text,
  category text,
  tags text[],
  author text,
  cover_image text,
  status text default 'published',
  created_at timestamptz default now(),
  published_at timestamptz,
  updated_at timestamptz default now()
);

-- 3. Create Embeddings table for Semantic Search / Dedup
create table if not exists article_embeddings (
  id bigserial primary key,
  slug text not null unique references posts(slug) on delete cascade,
  embedding vector(1536), -- Dimension for OpenAI text-embedding-3-small
  created_at timestamptz default now()
);

-- 4. RPC for matching articles (Semantic Search)
create or replace function match_articles (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  slug text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    article_embeddings.slug,
    1 - (article_embeddings.embedding <=> query_embedding) as similarity
  from article_embeddings
  where 1 - (article_embeddings.embedding <=> query_embedding) > match_threshold
  order by article_embeddings.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

## 4. Automation & Scheduling

### Vercel Cron
Add a `vercel.json` to your project root:

```json
{
  "crons": [
    {
      "path": "/api/blog/cron",
      "schedule": "0 * * * *" 
    }
  ]
}
```

### Manual Trigger
You can trigger the blog generation manually by visiting:
`GET /api/blog/run?typology=news&research=web-lite`
(Note: You should add an API secret check in the handler for security).

### E. Deep Research (Optional)
The system includes a standalone "Deep Research Worker" for more intensive data gathering. This is designed to run in CI/CD (like GitHub Actions) or as a separate process.

1. **Script Path**: `blog-module/scripts/deep-research-worker.ts`
2. **Add to `package.json`**:
   ```json
   "scripts": {
     "blog:research": "ts-node blog-module/scripts/deep-research-worker.ts"
   }
   ```
3. **Usage**:
   ```bash
   TOPIC="The impact of AI on web development" npm run blog:research
   ```
   This will save a detailed research report in `./data/research/`, which the Generator can then use for high-seo-level posts.

## 5. Customization & Theming

### Branding
Modify the `branding` object in `aiBlog.config.ts`. The `BlogLayout` uses CSS variables to apply your `primaryColor`.

### Overriding Components
The UI components are located in `blog-module/ui/components.tsx`. They use Tailwind classes. You can either:
1. Edit the file directly to match your site's aesthetic.
2. Replace the calls in `app/blog/[[...slug]]/page.tsx` with your own custom React components.

## 6. Troubleshooting

### "API Route not found"
Ensure your file path is exactly `/app/api/blog/[...route]/route.ts`. The `...` spread is critical.

### "Zod validation error"
This usually happens when the `aiBlog.config.ts` does not match the expected schema. Check if `AiBlogConfig` is correctly imported and all required fields (like `ai.provider`) are present.

### AI choosing weird topics
Check your `typologyDefinitions`. The `intent` string is a direct instruction to the AI model. Be specific about what kind of content you want.

### Supabase "Relation posts does not exist"
Verify that you ran the SQL script in the correct database and that your `SUPABASE_SERVICE_ROLE_KEY` is correct.
