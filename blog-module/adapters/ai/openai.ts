import { AIProvider, GenerateOptions } from '../../core/types';
import { AiBlogConfig } from '../../config/schema';

export class OpenAIProvider implements AIProvider {
  private config: AiBlogConfig;

  constructor(config: AiBlogConfig) {
    this.config = config;
  }

  private getApiKey(): string {
    const key = process.env[this.config.ai.apiKeyEnvVar];
    if (!key) {
      throw new Error(`OpenAI API key not found in env: ${this.config.ai.apiKeyEnvVar}`);
    }
    return key;
  }

  async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
    const apiKey = this.getApiKey();
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options?.model || this.config.ai.models.writing || 'gpt-4o',
        messages: [
          ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        temperature: options?.temperature ?? this.config.ai.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async generateObject<T>(prompt: string, schema: any, options?: GenerateOptions): Promise<T> {
    const text = await this.generateText(
      `${prompt}\n\nPlease respond with a JSON object matching this schema: ${JSON.stringify(schema)}. Return ONLY the JSON.`,
      { ...options, systemPrompt: "You are a helpful assistant that only responds in valid JSON." }
    );

    try {
      return JSON.parse(text.replace(/```json\n?|\n?```/g, '')) as T;
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", text);
      throw new Error("AI failed to return valid JSON");
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const apiKey = this.getApiKey();
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI Embedding error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }
}
