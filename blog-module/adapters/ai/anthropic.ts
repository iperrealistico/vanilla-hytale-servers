import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, GenerateOptions } from '../../core/types';
import { AiBlogConfig } from '../../config/schema';

export class AnthropicProvider implements AIProvider {
    private client: Anthropic;
    private config: AiBlogConfig;

    constructor(config: AiBlogConfig) {
        this.config = config;
        const apiKey = process.env[config.ai.apiKeyEnvVar];
        if (!apiKey) {
            throw new Error(`Anthropic API key not found in environment variable: ${config.ai.apiKeyEnvVar}`);
        }
        this.client = new Anthropic({ apiKey });
    }

    async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
        const response = await this.client.messages.create({
            model: options?.model || this.config.ai.models.writing || 'claude-3-5-sonnet-20240620',
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
            temperature: this.config.ai.temperature,
            top_p: this.config.ai.topP,
        });

        const content = response.content[0];
        if (content.type === 'text') {
            return content.text;
        }
        return '';
    }

    async generateObject<T>(prompt: string, schema: any, options?: GenerateOptions): Promise<T> {
        // Anthropic doesn't have a native "json_object" mode like OpenAI (yet, in a simple way for SDK),
        // so we'll use a system prompt to enforce JSON.
        const response = await this.client.messages.create({
            model: options?.model || this.config.ai.models.writing || 'claude-3-5-sonnet-20240620',
            max_tokens: 4096,
            system: 'You are a helpful assistant that always responds with valid JSON. Do not include any other text in your response.',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0, // Lower temperature for structural tasks
        });

        const content = response.content[0];
        if (content.type === 'text') {
            try {
                return JSON.parse(content.text) as T;
            } catch (error) {
                console.error('Failed to parse Anthropic JSON response:', content.text);
                throw new Error('Invalid JSON response from Anthropic');
            }
        }
        throw new Error('Unexpected response format from Anthropic');
    }
}
