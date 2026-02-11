/**
 * This script is designed to run in a Node.js environment (like GitHub Actions).
 * It orchestrates the entire "Deep Research" creation process.
 */

import { OpenAIProvider } from '../adapters/ai/openai';
import { FirecrawlAdapter } from '../adapters/sources/firecrawl';
import { AiBlogConfig } from '../config/schema';
import * as fs from 'fs';
import * as path from 'path';

// --- Types needed for standalone execution ---

interface ResearchResult {
    topic: string;
    learnings: string[];
    visitedUrls: string[];
}

// --- The Deep Researcher Logic ---

class DeepResearcher {
    private ai: OpenAIProvider;
    private search: FirecrawlAdapter;
    private maxDepth = 2;
    private breadth = 3;

    constructor(apiKeyAI: string, apiKeySearch: string) {
        // Create a minimal mock config for OpenAIProvider
        const mockConfig = {
            ai: {
                apiKeyEnvVar: 'OPENAI_API_KEY_INTERNAL', // distinct key to avoid conflict lookup
                models: { writing: 'gpt-4o' }
            }
        } as unknown as AiBlogConfig;

        // Set the env var expected by the provider
        process.env['OPENAI_API_KEY_INTERNAL'] = apiKeyAI;

        this.ai = new OpenAIProvider(mockConfig);
        this.search = new FirecrawlAdapter(apiKeySearch);
    }

    async conductResearch(topic: string): Promise<ResearchResult> {
        console.log(`Starting Deep Research on: "${topic}"`);

        // Step 1: Generate initial questions
        const questions = await this.generateQuestions(topic);
        console.log(`Initial Questions:`, questions);

        const learnings: string[] = [];
        const visitedUrls: string[] = [];

        // Step 2: Breadth-First Research Loop
        for (const question of questions.slice(0, this.breadth)) {
            console.log(`[Researching] ${question}`);

            try {
                // Search & Scrape
                const rawResult = await this.search.searchAndScrape(question, 2);

                // Analyze & Extract Learnings
                const extracted = await this.extractLearnings(question, rawResult);
                learnings.push(...extracted);
                console.log(`  -> Extracted ${extracted.length} learnings`);
            } catch (e) {
                console.error(`  -> Failed: ${e}`);
            }
        }

        return { topic, learnings, visitedUrls };
    }

    private async generateQuestions(topic: string): Promise<string[]> {
        const prompt = `
      I need to write a comprehensive, deep-dive article about: "${topic}".
      Generate 3 specific, search-engine-optimized questions that would help me gather detailed technical information.
      Return a JSON array of strings.
    `;
        return this.ai.generateObject<string[]>(prompt, { type: 'json' } as any);
    }

    private async extractLearnings(question: string, context: string): Promise<string[]> {
        const prompt = `
      Goal: Answer the question "${question}".
      Context:
      ${context}

      Extract 3-5 key facts, statistics, or unique insights from the context.
      Return a JSON array of strings.
    `;
        return this.ai.generateObject<string[]>(prompt, { type: 'json' } as any);
    }
}

// --- Main Execution Block ---

async function run() {
    const aiKey = process.env.OPENAI_API_KEY;
    const firecrawlKey = process.env.FIRECRAWL_API_KEY;

    if (!aiKey || !firecrawlKey) {
        console.error("Missing API Keys (OPENAI_API_KEY or FIRECRAWL_API_KEY)");
        process.exit(1);
    }

    // 1. Load Config (Simplified for script)
    const topic = process.env.TOPIC || "The Future of AI Agents in 2025";

    const researcher = new DeepResearcher(aiKey, firecrawlKey);
    const result = await researcher.conductResearch(topic);

    // 2. Write Report (to be consumed by the Generator later, or written directly)
    const report = `
# Research Report: ${topic}

## Key Learnings
${result.learnings.map(l => `- ${l}`).join('\n')}

## Sources
(Firecrawl handled source tracking internally)
  `;

    // 3. Save to disk
    const filename = `research-${Date.now()}.md`;
    const outputPath = path.join(process.cwd(), 'data', 'research', filename);

    // Ensure dir exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, report);

    console.log(`Research complete. Saved to ${outputPath}`);
}

// Run if called directly
if (require.main === module) {
    run().catch(console.error);
}
