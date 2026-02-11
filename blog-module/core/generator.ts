import { AiBlogConfig } from '../config/schema';
import { AIProvider, StorageAdapter, Post } from './types';
import { CompetitorsManager } from '../features/competitors';
import { FirecrawlAdapter } from '../adapters/sources/firecrawl';
import * as fs from 'fs';
import * as path from 'path';

export class Generator {
  private config: AiBlogConfig;
  private ai: AIProvider;
  private storage: StorageAdapter;
  private competitors: CompetitorsManager;
  private researchAdapter?: FirecrawlAdapter;

  constructor(config: AiBlogConfig, ai: AIProvider, storage: StorageAdapter) {
    this.config = config;
    this.ai = ai;
    this.storage = storage;
    this.competitors = new CompetitorsManager(config, ai);

    const firecrawlKey = process.env.FIRECRAWL_API_KEY;
    if (firecrawlKey) {
      this.researchAdapter = new FirecrawlAdapter(firecrawlKey);
    }
  }

  getStorage(): StorageAdapter {
    return this.storage;
  }

  async generate(typology: string, options?: { seoLevel?: number | 'RANDOM', researchMode?: string, onProgress?: (status: string) => void }): Promise<Post> {
    const report = (msg: string) => {
      console.log(`[Generator] ${msg}`);
      if (options?.onProgress) options.onProgress(msg);
    };

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    report(`🚀 Intelligence Engine started (Mode: ${options?.researchMode || 'internal'})`);
    report(`📅 Temporal context set to: ${dateStr}`);
    report(`📁 Initialization: Environment checked (CWD: ${process.cwd()})`);

    // 1. Topic Selection
    report("🧠 Brain: Analyzing recent content gaps...");
    let topic = await this.selectTopic(typology);
    report(`🎯 Strategy: Selected topic: "${topic.title}"`);

    // 2. Semantic Overlap Check
    if (this.config.storage.adapter === 'supabase') {
      report("🔍 Validator: Checking for semantic uniqueness in database...");
      const isUnique = await this.checkSemanticUniqueness(topic.title);
      if (!isUnique) {
        report(`⚠️ Conflict: Semantic overlap detected. Recalibrating...`);
        return this.generate(typology, options);
      }
    }

    // 3. Research
    const researchMode = options?.researchMode || 'internal';
    report(`🌐 Researcher: Initiating ${researchMode} protocols for: "${topic.title}"`);
    const research = await this.doResearch(topic.title, researchMode);
    report("✅ Researcher: Field data collected and synthesized.");

    // 4. Draft Generation
    report("✍️ Author: Drafting article using synthesized data...");
    const draft = await this.generateDraft(topic.title, research, typology, options?.seoLevel);
    report(`✅ Author: Draft completed (${draft.content?.split(' ').length} words).`);

    // 5. Community Logic
    report("🔗 Network: Integrating community backlinks and relations...");
    const finalizedDraft = await this.applyCompetitorLogic(draft);

    // 6. Save
    report(`💾 Storage: Persistence starting (Local + Cloud Sync)...`);
    try {
      const savedPost = await this.storage.savePost({
        ...(finalizedDraft as Post),
        category: typology,
        status: 'published',
      });
      report(`✅ Storage: Successfully synced to GitHub repository.`);

      // Save Embedding
      if (this.config.storage.adapter === 'supabase' && this.storage.saveEmbedding && this.ai.generateEmbedding) {
        report("🧬 Vector: Generating and saved search embedding...");
        const embedding = await this.ai.generateEmbedding(savedPost.title + ' ' + savedPost.excerpt);
        await this.storage.saveEmbedding(savedPost.slug, embedding);
      }

      report("🏁 Process completed successfully.");
      return savedPost;
    } catch (e: any) {
      report(`❌ Storage Failure: ${e.message}`);
      report(`💡 Diagnostic: Check if directory exists or if filesystem is read-only.`);
      throw e;
    }
  }

  // ... (rest of class)

  private async selectTopic(typology: string) {
    const memory = await this.storage.getMemory();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const prompt = `
      You are a content strategist for a blog called "${this.config.blog.siteName}".
      TODAY'S DATE: ${dateStr}
      The typology is "${typology}".
      Existing topics: ${memory.join(', ')}
      
      Suggest a new, unique, and highly engaging article topic for today.
      Return a JSON object with:
      - title: The proposed headline
      - focus: A brief summary of what the article should cover
    `;

    return this.ai.generateObject<{ title: string; focus: string }>(prompt, {
      type: 'object',
      properties: {
        title: { type: 'string' },
        focus: { type: 'string' }
      }
    });
  }

  private async checkSemanticUniqueness(title: string): Promise<boolean> {
    if (!this.storage.findSimilarPosts || !this.ai.generateEmbedding) return true;

    const embedding = await this.ai.generateEmbedding(title);
    const similar = await this.storage.findSimilarPosts(embedding, 0.85);

    return similar.length === 0;
  }

  private async doResearch(topic: string, researchMode: string = 'internal') {
    if (researchMode === 'web-lite' && this.researchAdapter) {
      try {
        console.log(`[Generator] Performing Web-Lite research for: ${topic}`);
        return await this.researchAdapter.searchAndScrape(topic, 3);
      } catch (error) {
        console.error(`[Generator] Web-Lite research failed, falling back to internal:`, error);
      }
    }

    if (researchMode === 'deep') {
      try {
        const researchDir = path.join(process.cwd(), 'data', 'research');
        if (fs.existsSync(researchDir)) {
          const files = fs.readdirSync(researchDir)
            .filter(f => f.endsWith('.md'))
            .map(f => ({ name: f, time: fs.statSync(path.join(researchDir, f)).mtime.getTime() }))
            .sort((a, b) => b.time - a.time);

          if (files.length > 0) {
            const latestFile = path.join(researchDir, files[0].name);
            console.log(`[Generator] Using Deep Research report: ${files[0].name}`);
            return fs.readFileSync(latestFile, 'utf-8');
          }
        }
      } catch (e) {
        console.error(`[Generator] Failed to read Deep Research: ${e}`);
      }
      return `[Deep Research Note] No research file found. Falling back to internal context for: ${topic}`;
    }

    return `Internal Knowledge Check for: ${topic}. Focus on technical details and unique insights.`;
  }

  private async generateDraft(title: string, research: string, typology: string, seoLevel: number | 'RANDOM' = 5): Promise<Partial<Post>> {
    const seoIntensity = seoLevel === 'RANDOM' ? Math.floor(Math.random() * 10) : seoLevel;

    // Find typology definition for intent
    const intent = this.config.blog.typologyDefinitions?.find(t => t.id === typology)?.intent || "General blog post";

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const prompt = `
      You are a professional blog author.
      TODAY'S DATE: ${dateStr}
      Goal: Write a post with title "${title}".
      Typology Intent: ${intent}
      Research Context: ${research}
      
      SEO Strategy (Intensity ${seoIntensity}/10):
      ${seoIntensity < 3 ? "- Focus purely on user value and readability. Ignore keywords." :
        seoIntensity > 7 ? "- Aggressively optimize. Use the main keyword in H1, first paragraph, and H2s. Keep density high." :
          "- Balance readability with keyword usage. Include keyword in title and opening."}

      The post should be in Markdown format.
      Include a title, an excerpt, and the main content.
      Target word count: ${this.config.content.lengthTargets?.[typology] || 800} words.
      
      Return a JSON object with:
      - title: The final headline
      - excerpt: A catchy 1-2 sentence summary
      - content: The full markdown content
      - slug: A URL-friendly slug (style: ${this.config.content.slugStyle})
    `;

    return this.ai.generateObject<Partial<Post>>(prompt, {
      type: 'object',
      properties: {
        title: { type: 'string' },
        excerpt: { type: 'string' },
        content: { type: 'string' },
        slug: { type: 'string' }
      }
    });
  }

  private async applyCompetitorLogic(draft: Partial<Post>): Promise<Partial<Post>> {
    if (!draft.content) return draft;

    const { content, backlinks } = await this.competitors.insertBacklinks(draft.content);
    return {
      ...draft,
      content,
      backlinks,
    };
  }
}
