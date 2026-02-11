import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, GenerateOptions } from '../../core/types';
import { AiBlogConfig } from '../../config/schema';

export class GeminiProvider implements AIProvider {
    private genAI: GoogleGenerativeAI;
    private config: AiBlogConfig;

    constructor(config: AiBlogConfig) {
        this.config = config;
        const apiKey = process.env[config.ai.apiKeyEnvVar];
        if (!apiKey) {
            throw new Error(`Google AI API key not found in environment variable: ${config.ai.apiKeyEnvVar}`);
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generateText(prompt: string, options?: GenerateOptions): Promise<string> {
        const modelName = options?.model || this.config.ai.models.writing || 'gemini-1.5-pro';
        const model = this.genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                temperature: this.config.ai.temperature,
                topP: this.config.ai.topP,
            }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }

    async generateObject<T>(prompt: string, schema: any, options?: GenerateOptions): Promise<T> {
        const modelName = options?.model || this.config.ai.models.writing || 'gemini-1.5-pro';
        const model = this.genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        try {
            return JSON.parse(text) as T;
        } catch (error) {
            console.error('Failed to parse Gemini JSON response:', text);
            throw new Error('Invalid JSON response from Gemini');
        }
    }
}
