import fs from 'fs/promises';
import path from 'path';
import { Post, StorageAdapter } from '../../core/types';

export class FileStorageAdapter implements StorageAdapter {
  private dataDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
  }

  private async ensureDir() {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (e) {
      // On Vercel this might fail because it's read-only, 
      // but if the dir already exists it's fine.
    }
  }

  async getPostBySlug(slug: string): Promise<Post | null> {
    try {
      await this.ensureDir();
      const filePath = path.join(this.dataDir, `${slug}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async listPosts(options?: { category?: string; limit?: number; offset?: number }): Promise<Post[]> {
    try {
      await this.ensureDir();
      const files = await fs.readdir(this.dataDir);
      const posts: Post[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const content = await fs.readFile(path.join(this.dataDir, file), 'utf-8');
            posts.push(JSON.parse(content));
          } catch (e) {
            console.error(`[FileStorage] Failed to read ${file}:`, e);
          }
        }
      }

      let filtered = posts;
      if (options?.category) {
        filtered = posts.filter(p => p.category === options.category);
      }

      filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      return filtered.slice(options?.offset || 0, (options?.offset || 0) + (options?.limit || 100));
    } catch (e) {
      console.warn(`[FileStorage] Could not list posts from ${this.dataDir}:`, e);
      return [];
    }
  }

  async savePost(post: Post): Promise<Post> {
    await this.ensureDir();
    const filePath = path.join(this.dataDir, `${post.slug}.json`);
    const data = {
      ...post,
      createdAt: post.createdAt || new Date(),
      updatedAt: new Date(),
    };
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    return data;
  }

  async getMemory(): Promise<string[]> {
    const posts = await this.listPosts({ limit: 50 });
    return posts.map(p => p.title);
  }
}
