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
        <BlogLayout config={blogConfig}>
            <PostDetail post={post} />
        </BlogLayout>
    );
}
