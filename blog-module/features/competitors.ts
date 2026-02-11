import Parser from 'rss-parser';
import { AiBlogConfig } from '../config/schema';
import { Post, AIProvider } from '../core/types';

export class CompetitorsManager {
  private config: AiBlogConfig;
  private ai: AIProvider;
  private parser: Parser;

  constructor(config: AiBlogConfig, ai: AIProvider) {
    this.config = config;
    this.ai = ai;
    this.parser = new Parser();
  }

  async checkOverlap(title: string, typology: string): Promise<boolean> {
    const competitors = [...this.config.friendsEnemies.friends, ...this.config.friendsEnemies.enemies];
    const competitorTopics: string[] = [];

    for (const comp of competitors) {
      try {
        const feed = await this.parser.parseURL(comp.rssUrl);
        feed.items.forEach((item: any) => {
          if (item.title) competitorTopics.push(item.title);
        });
      } catch (error) {
        console.error(`Failed to fetch RSS for ${comp.name}:`, error);
      }
    }

    if (competitorTopics.length === 0) return false;

    const prompt = `
      Current topic: "${title}"
      Competitor topics: ${competitorTopics.slice(0, 50).join(', ')}
      
      Is the current topic too similar to any of the competitor topics? 
      Respond with "TOO_SIMILAR" or "UNIQUE".
    `;

    const result = await this.ai.generateText(prompt);
    return result.includes('TOO_SIMILAR');
  }

  async insertBacklinks(content: string): Promise<{ content: string; backlinks: string[] }> {
    const friends = this.config.friendsEnemies.friends;
    if (friends.length === 0) return { content, backlinks: [] };

    const selectedFriends = friends.filter(f => Math.random() < (f.friendshipLevel / 10) * this.config.friendsEnemies.behavior.backlinkFrequency);

    if (selectedFriends.length === 0) return { content, backlinks: [] };

    const backlinks: string[] = [];
    let updatedContent = content;

    for (const friend of selectedFriends.slice(0, this.config.friendsEnemies.behavior.maxBacklinksPerPost)) {
      const prompt = `
        Content: ${content.slice(0, 1000)}...
        Friend: ${friend.name} (${friend.baseUrl})
        
        Suggest a natural sentence to insert into the content that links to this friend.
        The sentence should be relevant and not spammy.
        Return ONLY the sentence with the markdown link.
      `;

      const linkSentence = await this.ai.generateText(prompt);
      updatedContent += `\n\n${linkSentence}`;
      backlinks.push(friend.baseUrl);
    }

    return { content: updatedContent, backlinks };
  }
}
