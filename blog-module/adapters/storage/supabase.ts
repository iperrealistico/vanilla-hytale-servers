import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageAdapter, Post } from '../../core/types';
import { AiBlogConfig } from '../../config/schema';

export class SupabaseStorageAdapter implements StorageAdapter {
    private client: SupabaseClient;
    private config: AiBlogConfig;

    constructor(config: AiBlogConfig) {
        this.config = config;
        if (!config.storage.supabase) {
            throw new Error("Supabase config (url/key) missing in AiBlogConfig");
        }
        const url = process.env[config.storage.supabase.urlEnvVar];
        const key = process.env[config.storage.supabase.keyEnvVar];

        if (!url || !key) {
            throw new Error(`Supabase credentials missing in env vars: ${config.storage.supabase.urlEnvVar} / ${config.storage.supabase.keyEnvVar}`);
        }

        this.client = createClient(url, key);
    }

    async getPostBySlug(slug: string): Promise<Post | null> {
        const { data, error } = await this.client
            .from('posts')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error || !data) return null;
        return this.mapToPost(data);
    }

    async listPosts(options?: { category?: string; limit?: number; offset?: number }): Promise<Post[]> {
        let query = this.client
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (options?.category) {
            query = query.eq('category', options.category);
        }

        if (options?.limit) {
            query = query.limit(options.limit);
        }

        if (options?.offset) {
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        }

        const { data, error } = await query;
        if (error) {
            console.error("Supabase listPosts error:", error);
            return [];
        }

        return (data || []).map(this.mapToPost);
    }

    async savePost(post: Post): Promise<Post> {
        const dbPost = this.mapFromPost(post);

        // Save metadata
        const { data, error } = await this.client
            .from('posts')
            .upsert(dbPost, { onConflict: 'slug' })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to save post to Supabase: ${error.message}`);
        }

        // Embeddings are handled separately by the Director/Generator logic
        // or we could trigger it here if we passed the embedding vector

        return this.mapToPost(data);
    }

    async getMemory(): Promise<string[]> {
        // Return titles for basic dedup
        const posts = await this.listPosts({ limit: 50 });
        return posts.map(p => p.title);
    }

    // --- Semantic Search Specifics ---

    async saveEmbedding(slug: string, embedding: number[]) {
        const { error } = await this.client
            .from('article_embeddings')
            .upsert({
                slug,
                embedding
            }, { onConflict: 'slug' });

        if (error) {
            console.error("Failed to save embedding:", error);
            // We don't throw here to avoid failing the whole generation just for memory
        }
    }

    async findSimilarPosts(embedding: number[], threshold = 0.8, limit = 3): Promise<string[]> {
        // Assumes a stored procedure 'match_articles' exists in Supabase
        const { data, error } = await this.client.rpc('match_articles', {
            query_embedding: embedding,
            match_threshold: threshold,
            match_count: limit,
        });

        if (error) {
            console.error("Semantic search failed:", error);
            return [];
        }

        return (data || []).map((row: any) => row.slug);
    }

    // --- Mappers ---

    private mapToPost(data: any): Post {
        return {
            slug: data.slug,
            title: data.title,
            excerpt: data.excerpt,
            content: data.content,
            category: data.category,
            tags: data.tags || [],
            author: data.author,
            coverImage: data.cover_image,
            status: data.status,
            createdAt: new Date(data.created_at),
            publishedAt: data.published_at ? new Date(data.published_at) : undefined,
            updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
        };
    }

    private mapFromPost(post: Post): any {
        return {
            slug: post.slug,
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            category: post.category,
            tags: post.tags,
            author: post.author,
            cover_image: post.coverImage,
            status: post.status,
            created_at: post.createdAt?.toISOString(),
            published_at: post.publishedAt?.toISOString(),
            updated_at: new Date().toISOString(),
        };
    }
}
