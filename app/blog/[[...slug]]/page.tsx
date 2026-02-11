import React from 'react';
import { notFound } from 'next/navigation';
import { BlogLayout, PostList, PostDetail } from '@/blog-module/ui/components';
import { FileStorageAdapter } from '@/blog-module/adapters/storage/file';
import { blogConfig } from '@/aiBlog.config';

import path from 'path';

// Use process.cwd() to resolve path correctly on Vercel
const storage = new FileStorageAdapter(path.join(process.cwd(), 'data/blog'));

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
                <div className="mb-10 text-center">
                    <h2 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'var(--h-font)' }}>
                        Category: <span className="text-[var(--accent)]">{slug[1]}</span>
                    </h2>
                </div>
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
