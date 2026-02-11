export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AIProvider {
  generateText(prompt: string, options?: GenerateOptions): Promise<string>;
  generateText(prompt: string, options?: GenerateOptions): Promise<string>;
  generateObject<T>(prompt: string, schema: any, options?: GenerateOptions): Promise<T>;
  generateEmbedding?(text: string): Promise<number[]>;
}

export interface Post {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags?: string[];
  author?: string;
  coverImage?: string;
  status: 'draft' | 'published' | 'scheduled';
  createdAt?: Date;
  publishedAt?: Date;
  updatedAt?: Date;
  sourceRefs?: string[];
  backlinks?: string[];
}

export interface StorageAdapter {
  getPostBySlug(slug: string): Promise<Post | null>;
  listPosts(options?: { category?: string; limit?: number; offset?: number }): Promise<Post[]>;
  savePost(post: Post): Promise<Post>;
  getMemory(): Promise<string[]>; // list of recent topics/titles for dedup

  // Semantic Search (Optional)
  saveEmbedding?(slug: string, embedding: number[]): Promise<void>;
  findSimilarPosts?(embedding: number[], threshold?: number, limit?: number): Promise<string[]>;
}
