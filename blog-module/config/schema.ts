import { z } from 'zod';

export const AIProviderSchema = z.enum(['openai', 'anthropic', 'google', 'custom']);

export const AIConfigSchema = z.object({
  provider: AIProviderSchema,
  apiKeyEnvVar: z.string(),
  models: z.object({
    research: z.string().optional(),
    writing: z.string().optional(),
    summarization: z.string().optional(),
  }),
  temperature: z.number().min(0).max(2).default(0.7),
  topP: z.number().min(0).max(1).default(1),
});

export const StorageAdapterSchema = z.enum(['prisma', 'kv', 'file', 'supabase', 'custom']);

export const StorageConfigSchema = z.object({
  adapter: StorageAdapterSchema,
  connectionStringEnvVar: z.string().optional(),
  supabase: z.object({
    urlEnvVar: z.string(),
    keyEnvVar: z.string(),
  }).optional(),
});

export const TypologySchema = z.enum(['news', 'guide', 'tutorial', 'deep_dive', 'comparison', 'opinion', 'patch_notes', 'spotlight', 'AUTO']);

// New: Typology Definition with Intent
export const TypologyDefinitionSchema = z.object({
  id: TypologySchema,
  title: z.string(),
  intent: z.string().describe("Strategic description for the AI Director to understand when to use this typology"),
});

export const SeoLevelSchema = z.union([
  z.number().min(0).max(10), // 0-10 scale
  z.literal('RANDOM')
]);

export const ResearchModeSchema = z.enum(['internal', 'web-lite', 'deep']);

export const ImagePolicySchema = z.object({
  enabled: z.boolean().default(false),
  style: z.enum(['realistic', 'illustration', 'pixel-art', 'cinematic']).optional(),
  promptSuffix: z.string().optional(),
});

export const ScheduleSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  typology: TypologySchema,
  cron: z.string(), // e.g., "0 9 * * *"
  timezone: z.string().default('UTC'),
  publishImmediately: z.boolean().default(true),
  enabled: z.boolean().default(true),
  oneShot: z.boolean().default(false),

  // Per-schedule overrides
  seoLevel: SeoLevelSchema.default(5),
  researchMode: ResearchModeSchema.default('internal'),
  imagePolicy: ImagePolicySchema.optional(),
  author: z.string().optional(),
  customContext: z.string().optional().describe("Specific instructions for this schedule (e.g., 'Focus only on Minecraft Bedrock')"),
});

export const FriendEnemiesSchema = z.object({
  friends: z.array(z.object({
    name: z.string(),
    baseUrl: z.string().url(),
    rssUrl: z.string().url(),
    friendshipLevel: z.number().min(1).max(10).default(5),
  })).default([]),
  enemies: z.array(z.object({
    name: z.string(),
    baseUrl: z.string().url(),
    rssUrl: z.string().url(),
  })).default([]),
  behavior: z.object({
    dedupAggressiveness: z.number().min(0).max(1).default(0.5),
    backlinkFrequency: z.number().min(0).max(1).default(0.3),
    topicAvoidanceDays: z.number().default(30),
    maxBacklinksPerPost: z.number().default(2),
  }).default({
    dedupAggressiveness: 0.5,
    backlinkFrequency: 0.3,
    topicAvoidanceDays: 30,
    maxBacklinksPerPost: 2,
  }),
});

export const BlogConfigSchema = z.object({
  basePath: z.string().default('/blog'),
  siteName: z.string(),
  baseUrl: z.string().url(),
  defaultAuthor: z.string().optional(),
  branding: z.object({
    primaryColor: z.string().optional(),
    logoUrl: z.string().optional(),
  }).optional(),
  categories: z.record(z.string(), z.string()).optional(), // mapping of typology to display name
  typologyDefinitions: z.array(TypologyDefinitionSchema).optional(), // For the Director AI
});

export const ContentConfigSchema = z.object({
  lengthTargets: z.record(z.string(), z.number()).optional(), // typology -> word count
  imagePolicy: z.enum(['generate', 'none']).default('none'), // Global fallback
  slugStyle: z.enum(['hyphenated', 'underscore']).default('hyphenated'),
  language: z.string().default('en'),
});

export const SourcesConfigSchema = z.object({
  typologyStrategies: z.record(z.string(), z.object({
    rssFeeds: z.array(z.string().url()).optional(),
    allowedDomains: z.array(z.string()).optional(),
    queryTemplates: z.array(z.string()).optional(),
  })).optional(),
});

export const AiBlogConfigSchema = z.object({
  blog: BlogConfigSchema,
  storage: StorageConfigSchema,
  ai: AIConfigSchema,
  content: ContentConfigSchema,
  sources: SourcesConfigSchema,
  scheduling: z.object({
    schedules: z.array(ScheduleSchema),
  }),
  friendsEnemies: FriendEnemiesSchema,
});

export type AiBlogConfig = z.infer<typeof AiBlogConfigSchema>;
