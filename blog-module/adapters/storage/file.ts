import fs from 'fs/promises';
import path from 'path';
import { Post, StorageAdapter } from '../../core/types';
import { commitFiles } from '@/lib/github';

export class FileStorageAdapter implements StorageAdapter {
  private dataDir: string;
  private tmpDir: string | null = null;
  private isRepoRelative: boolean = false;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
    // On Vercel, we use /tmp as a writeable scratchpad
    if (process.env.VERCEL) {
      this.tmpDir = path.join('/tmp', 'blog-data');
      console.log(`[FileStorage] Hybrid mode enabled. Repo: ${this.dataDir}, Scratch: ${this.tmpDir}`);
    }

    // Check if the dataDir is within the current repo to determine if we should commit
    if (this.dataDir.includes(process.cwd())) {
      this.isRepoRelative = true;
    }
  }

  private async ensureDir(dir: string) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (e) {
      // Silently fail if read-only, we'll catch it on write
    }
  }

  async getPostBySlug(slug: string): Promise<Post | null> {
    const filename = `${slug}.json`;

    // 1. Try scratchpad first (latest)
    if (this.tmpDir) {
      try {
        const content = await fs.readFile(path.join(this.tmpDir, filename), 'utf-8');
        return JSON.parse(content);
      } catch { }
    }

    // 2. Try repo data
    try {
      const content = await fs.readFile(path.join(this.dataDir, filename), 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async listPosts(options?: { category?: string; limit?: number; offset?: number }): Promise<Post[]> {
    const allPosts: Map<string, Post> = new Map();

    const loadFromDir = async (dir: string) => {
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            try {
              const content = await fs.readFile(path.join(dir, file), 'utf-8');
              const post = JSON.parse(content);
              allPosts.set(post.slug, post);
            } catch (e) { }
          }
        }
      } catch (e) { }
    };

    // Load from both (Scratchpad overrides Repo if slugs match)
    await loadFromDir(this.dataDir);
    if (this.tmpDir) await loadFromDir(this.tmpDir);

    let filtered = Array.from(allPosts.values());
    if (options?.category) {
      filtered = filtered.filter(p => p.category === options.category);
    }

    filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return filtered.slice(options?.offset || 0, (options?.offset || 0) + (options?.limit || 100));
  }

  async savePost(post: Post): Promise<Post> {
    const data = {
      ...post,
      createdAt: post.createdAt || new Date(),
      updatedAt: new Date(),
    };

    // 1. Local/Tmp Persistence
    const writeDirs = [this.dataDir];
    if (this.tmpDir) writeDirs.push(this.tmpDir);

    let localSaved = false;
    for (const dir of writeDirs) {
      const filePath = path.join(dir, `${post.slug}.json`);
      try {
        await this.ensureDir(dir);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        console.log(`[FileStorage] Successfully saved to local: ${filePath}`);
        localSaved = true;
      } catch (e: any) {
        console.warn(`[FileStorage] Failed write to ${dir}: ${e.message}`);
      }
    }

    // 2. Cloud Persistence (GitHub GitOps)
    if (process.env.GITHUB_TOKEN || process.env.VERCEL) {
      console.log(`[FileStorage] Committing to GitHub for slug: ${post.slug}`);
      const relativePath = `data/blog/${post.slug}.json`;

      // We do this asynchronously but wait for it to ensure we can report success
      const gitResult = await commitFiles([
        { path: relativePath, content: JSON.stringify(data, null, 2) }
      ]);

      if (gitResult.success) {
        console.log(`[FileStorage] GitHub commit successful: ${gitResult.sha}`);
      } else {
        console.error(`[FileStorage] GitHub commit failed: ${gitResult.message}`);
        // If local save also failed, we must throw
        if (!localSaved) {
          throw new Error(`Persistence failed. Local Error AND GitHub Error: ${gitResult.message}`);
        }
      }
    }

    if (!localSaved && !process.env.GITHUB_TOKEN) {
      throw new Error("Persistence failed: No writeable locations found and no GitHub token available.");
    }

    return data;
  }

  async getMemory(): Promise<string[]> {
    const posts = await this.listPosts({ limit: 50 });
    return posts.map(p => p.title);
  }
}
