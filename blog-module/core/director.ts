import { AiBlogConfig } from '../config/schema';
import { AIProvider, StorageAdapter } from './types';
import { CompetitorsManager } from '../features/competitors';

export class Director {
    private config: AiBlogConfig;
    private ai: AIProvider;
    private storage: StorageAdapter;
    private competitors: CompetitorsManager;

    constructor(config: AiBlogConfig, ai: AIProvider, storage: StorageAdapter) {
        this.config = config;
        this.ai = ai;
        this.storage = storage;
        this.competitors = new CompetitorsManager(config, ai);
    }

    async decideNextTypology(availableTypologies: string[], recentTitles: string[]): Promise<string> {
        // 1. Get market context from RSS (simulated via competitors manager or raw feed check)
        // For V1, we'll ask the AI to pick based on recent history distribution.

        // 2. Construct the Strategy Prompt
        const definitions = this.config.blog.typologyDefinitions || [];
        const defsText = definitions.map(d => `- ${d.id}: ${d.intent}`).join('\n');

        const prompt = `
      You are the Editor-in-Chief of "${this.config.blog.siteName}".
      Your goal is to maintain a balanced and engaging content calendar.
      
      Available Content Typologies:
      ${defsText || availableTypologies.join(', ')}

      Recently Published Articles:
      ${recentTitles.slice(0, 10).join('\n')}

      Task:
      Analyze the recent history. 
      - If we have too many news items, pick a guide or deep dive.
      - If we haven't covered news in a while, pick news.
      - If a typology is underrepresented, prioritize it.

      Return ONLY the ID of the typology you select (e.g., "news", "guide").
      Do not include any explanation.
    `;

        try {
            const decision = await this.ai.generateText(prompt);
            const cleanDecision = decision.trim().replace(/['"]/g, '');

            // Validate
            if (availableTypologies.includes(cleanDecision)) {
                console.log(`[Director] Selected strategy: ${cleanDecision}`);
                return cleanDecision;
            }

            console.warn(`[Director] AI returned invalid typology: ${cleanDecision}. Fallback to random.`);
        } catch (e) {
            console.error(`[Director] Failed to decide: ${e}`);
        }

        // Fallback
        return availableTypologies[Math.floor(Math.random() * availableTypologies.length)];
    }
}
