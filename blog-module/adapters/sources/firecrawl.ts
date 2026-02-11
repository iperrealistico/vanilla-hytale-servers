
export class FirecrawlAdapter {
    private apiKey: string;
    private apiUrl = 'https://api.firecrawl.dev/v1';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async searchAndScrape(query: string, limit = 3): Promise<string> {
        console.log(`[Firecrawl] Searching for: ${query}`);

        // 1. Search
        const searchResponse = await fetch(`${this.apiUrl}/search`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                limit: limit,
                pageOptions: {
                    fetchPageContent: true // Get content directly if possible
                }
            })
        });

        if (!searchResponse.ok) {
            const error = await searchResponse.text();
            throw new Error(`Firecrawl Search failed: ${error}`);
        }

        const { data } = await searchResponse.json();

        // Format results into a context string
        let context = `Web Search Results for "${query}":\n\n`;

        data.forEach((item: any, index: number) => {
            context += `--- Source ${index + 1}: ${item.title} ---\n`;
            context += `URL: ${item.url}\n`;
            // Use markdown or description as snippet
            const content = item.markdown || item.description || "No content available";
            context += `Content: ${content.slice(0, 1500)}...\n\n`; // Truncate to save tokens
        });

        return context;
    }
}
