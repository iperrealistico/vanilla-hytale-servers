import { AiBlogConfig } from '../config/schema';
import { AIProvider, StorageAdapter, Post } from './types';
import { CompetitorsManager } from '../features/competitors';
import { FirecrawlAdapter } from '../adapters/sources/firecrawl';

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

  async generate(typology: string, options?: { seoLevel?: number | 'RANDOM', researchMode?: string }): Promise<Post> {
    console.log(`Starting generation for typology: ${typology}`);

    // 1. Topic Selection
    let topic = await this.selectTopic(typology);

    // 2. Semantic Overlap Check (if Supabase is enabled)
    if (this.config.storage.adapter === 'supabase') {
      const isUnique = await this.checkSemanticUniqueness(topic.title);
      if (!isUnique) {
        console.log(`Semantic overlap detected for: ${topic.title}. Retrying...`);
        return this.generate(typology, options); // Recursive retry
      }
    }
    // Check overlap with friends/enemies
    let attempts = 0;
    while (attempts < 3 && await this.competitors.checkOverlap(topic.title, typology)) {
      console.log(`Topic overlap detected for: ${topic.title}. Retrying...`);
      topic = await this.selectTopic(typology);
      attempts++;
    }

    console.log(`Final topic: ${topic.title}`);

    // 2. Research
    const researchMode = options?.researchMode || 'internal';
    const research = await this.doResearch(topic.title, researchMode);

    // 3. Draft Generation
    const draft = await this.generateDraft(topic.title, research, typology, options?.seoLevel);

    // 4. Friends/Enemies Logic (Backlinks)
    const finalizedDraft = await this.applyCompetitorLogic(draft);

    // 5. Save & Embed
    const savedPost = await this.storage.savePost({
      ...(finalizedDraft as Post),
      category: typology,
      status: 'published',
    });

    // Save Embedding if supported
    if (this.config.storage.adapter === 'supabase' && this.storage.saveEmbedding && this.ai.generateEmbedding) {
      const embedding = await this.ai.generateEmbedding(savedPost.title + ' ' + savedPost.excerpt);
      await this.storage.saveEmbedding(savedPost.slug, embedding);
    }

    return savedPost;
  }

  // ... (rest of class)

  private async selectTopic(typology: string) {
    const memory = await this.storage.getMemory();
    const prompt = `
      You are a content strategist for a blog called "${this.config.blog.siteName}".
      The typology is "${typology}".
      Existing topics: ${memory.join(', ')}
      
      Suggest a new, unique, and highly engaging article topic.
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
      return `[Deep Research Note] This article was generated using the dedicated Deep Research worker. Context for: ${topic}`;
    }

    return `Internal Knowledge Check for: ${topic}. Focus on technical details and unique insights.`;
  }

  private async generateDraft(title: string, research: string, typology: string, seoLevel: number | 'RANDOM' = 5): Promise<Partial<Post>> {
    const seoIntensity = seoLevel === 'RANDOM' ? Math.floor(Math.random() * 10) : seoLevel;

    // Find typology definition for intent
    const intent = this.config.blog.typologyDefinitions?.find(t => t.id === typology)?.intent || "General blog post";

    const prompt = `
      You are a professional blog author.
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
