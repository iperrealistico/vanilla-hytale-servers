import { z } from 'zod';

export const WorkflowStatusSchema = z.enum([
  'drafted',
  'ready-for-review',
  'ready-to-publish',
  'published',
  'published-needs-enrichment',
]);

export const SearchIntentSchema = z.enum([
  'informational',
  'commercial',
  'transactional',
  'navigational',
]);

export const ArticleCtaButtonSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  variant: z.enum(['primary', 'secondary']).default('primary'),
});

export const ArticleCtaCardSchema = z.object({
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  primaryCta: ArticleCtaButtonSchema,
});

export const ArticleCtasSchema = z.object({
  sticky: ArticleCtaCardSchema,
  segue: ArticleCtaCardSchema,
});

export const ArticleFrontmatterSchema = z.object({
  slug: z.string().min(1),
  articleTemplate: z.literal('v3'),
  queueId: z.string().min(1),
  workflowStatus: WorkflowStatusSchema,
  title: z.string().min(1),
  excerpt: z.string().min(1),
  category: z.string().min(1),
  context: z.string().min(1),
  primaryKeyword: z.string().min(1),
  searchIntent: SearchIntentSchema,
  coverImage: z.string().min(1),
  ornamentWashImage: z.string().min(1),
  ornamentOrbitImage: z.string().min(1),
  publishedAt: z.union([z.string().min(1), z.date()]).transform((value) => {
    return value instanceof Date ? value.toISOString().slice(0, 10) : value;
  }),
  updatedAt: z.union([z.string(), z.date()]).optional().transform((value) => {
    if (!value) {
      return value;
    }

    return value instanceof Date ? value.toISOString().slice(0, 10) : value;
  }),
  seoTitle: z.string().min(1),
  seoDescription: z.string().min(1),
  chapterShortTitles: z.array(z.string().min(1)).min(4).max(6),
  articleCtas: ArticleCtasSchema,
  relatedSlugs: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  tags: z.array(z.string().min(1)).min(1),
  noindex: z.boolean().optional(),
  contentType: z.string().optional(),
  topic: z.string().optional(),
  region: z.string().optional(),
  audienceLevel: z.string().optional(),
  productArea: z.string().optional(),
  useCase: z.string().optional(),
});

export const ImageAssetSchema = z.object({
  id: z.string().min(1),
  src: z.string().min(1),
  alt: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  tone: z.string().min(1),
});

export const ImageSlotAssignmentSchema = z.object({
  asset: z.string().min(1),
});

export const ImageSlotMapSchema = z.record(z.string().min(1), ImageSlotAssignmentSchema);

export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>;
export type SearchIntent = z.infer<typeof SearchIntentSchema>;
export type ArticleCtaButton = z.infer<typeof ArticleCtaButtonSchema>;
export type ArticleCtaCard = z.infer<typeof ArticleCtaCardSchema>;
export type ArticleCtas = z.infer<typeof ArticleCtasSchema>;
export type ArticleFrontmatter = z.infer<typeof ArticleFrontmatterSchema>;
export type ImageAsset = z.infer<typeof ImageAssetSchema>;
export type ImageSlotMap = z.infer<typeof ImageSlotMapSchema>;
