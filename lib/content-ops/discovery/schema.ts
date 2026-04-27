import { z } from 'zod';

export const DiscoveryCandidateStatusSchema = z.enum([
  'accepted',
  'queued',
  'drafted',
  'ready-for-review',
  'ready-to-publish',
  'published',
  'published-needs-enrichment',
  'blocked',
  'suppressed',
  'stale',
]);

export const QueueWorkflowStatusSchema = z.enum([
  'queued',
  'drafted',
  'ready-for-review',
  'ready-to-publish',
  'published',
  'published-needs-enrichment',
  'blocked',
]);

export const SourceRefSchema = z.object({
  sourceKey: z.string().min(1),
  sourceKind: z.string().min(1),
  canonicalUrl: z.string().url(),
  title: z.string().min(1),
  author: z.string().nullable().optional().default(null),
  excerpt: z.string().nullable().optional().default(null),
  imageUrl: z.string().url().nullable().optional().default(null),
  snapshotPath: z.string().nullable().optional().default(null),
  guidelineImagePath: z.string().nullable().optional().default(null),
  publishedAt: z.string().nullable().optional().default(null),
  updatedAt: z.string().nullable().optional().default(null),
});

export const SourceRevisionRefSchema = z.object({
  sourceKey: z.string().min(1),
  revisionKey: z.string().min(1),
  contentHash: z.string().min(1),
  revisionLabel: z.string().nullable().optional().default(null),
  observedAt: z.string().min(1),
  publishedAt: z.string().nullable().optional().default(null),
  updatedAt: z.string().nullable().optional().default(null),
});

export const DuplicateCheckSummarySchema = z.object({
  decision: z.enum(['accepted', 'suppressed', 'borderline']),
  overlapScore: z.number().min(0).max(1),
  sourceReuse: z.boolean(),
  matchedPublishedSlugs: z.array(z.string()).default([]),
  matchedCandidateIds: z.array(z.string()).default([]),
  reasoning: z.string().min(1),
});

export const TitleCandidateRecordSchema = z.object({
  candidateId: z.string().min(1),
  queueId: z.string().nullable().optional().default(null),
  familyId: z.string().min(1),
  title: z.string().min(1),
  titleLocked: z.boolean().default(true),
  workflowStatus: DiscoveryCandidateStatusSchema,
  articleSlug: z.string().nullable().optional().default(null),
  sourceRefs: z.array(SourceRefSchema).default([]),
  sourceRevisionRefs: z.array(SourceRevisionRefSchema).default([]),
  sourceFingerprint: z.string().min(1),
  noveltyFingerprint: z.string().min(1),
  whyNow: z.string().min(1),
  angleSummary: z.string().min(1),
  seoPrimaryKeyword: z.string().min(1),
  seoIntent: z.enum(['informational', 'commercial', 'transactional', 'navigational']),
  relatedRouteTargets: z.array(z.string().min(1)).default([]),
  duplicateCheckSummary: DuplicateCheckSummarySchema,
  suppressionReason: z.string().nullable().optional().default(null),
  publishedSlug: z.string().nullable().optional().default(null),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const SourceLedgerRecordSchema = z.object({
  sourceKey: z.string().min(1),
  familyId: z.string().min(1),
  canonicalUrl: z.string().url(),
  title: z.string().min(1),
  author: z.string().nullable().optional().default(null),
  latestRevisionKey: z.string().nullable().optional().default(null),
  latestContentHash: z.string().nullable().optional().default(null),
  latestPublishedAt: z.string().nullable().optional().default(null),
  latestUpdatedAt: z.string().nullable().optional().default(null),
  snapshotPath: z.string().nullable().optional().default(null),
  guidelineImagePath: z.string().nullable().optional().default(null),
  firstSeenAt: z.string().min(1),
  lastSeenAt: z.string().min(1),
  status: z.enum(['active', 'blocked', 'snapshot-only', 'stale']).default('active'),
  notes: z.string().nullable().optional().default(null),
});

export const SourceConsumptionRecordSchema = z.object({
  consumptionId: z.string().min(1),
  candidateId: z.string().nullable().optional().default(null),
  queueId: z.string().nullable().optional().default(null),
  familyId: z.string().min(1),
  articleSlug: z.string().nullable().optional().default(null),
  title: z.string().min(1),
  sourceFingerprint: z.string().min(1),
  noveltyFingerprint: z.string().min(1),
  sourceRefs: z.array(SourceRefSchema).default([]),
  sourceRevisionRefs: z.array(SourceRevisionRefSchema).default([]),
  consumedAt: z.string().min(1),
  publishedAt: z.string().nullable().optional().default(null),
});

export const SuppressionLogRecordSchema = z.object({
  suppressionId: z.string().min(1),
  familyId: z.string().min(1),
  candidateId: z.string().nullable().optional().default(null),
  title: z.string().min(1),
  sourceFingerprint: z.string().nullable().optional().default(null),
  noveltyFingerprint: z.string().nullable().optional().default(null),
  reasonCategory: z.enum([
    'duplicate-source',
    'duplicate-angle',
    'low-relevance',
    'stale-source',
    'blocked-source',
    'no-fresh-signal',
  ]),
  reason: z.string().min(1),
  comparedAgainst: z.array(z.string()).default([]),
  createdAt: z.string().min(1),
});

export const QueueRecordSchema = z.object({
  candidateId: z.string().nullable().optional().default(null),
  queueId: z.string().min(1),
  queueIndex: z.number().int().positive().default(1),
  rawTitleLineNumber: z.number().int().positive().nullable().optional().default(null),
  familyId: z.string().default('legacy-manual'),
  title: z.string().min(1),
  titleLocked: z.boolean().default(true),
  workflowStatus: QueueWorkflowStatusSchema,
  articleSlug: z.string().nullable().optional().default(null),
  draftPath: z.string().nullable().optional().default(null),
  lastRunOutcome: z.string().nullable().optional().default(null),
  sourceRefs: z.array(SourceRefSchema).default([]),
  sourceRevisionRefs: z.array(SourceRevisionRefSchema).default([]),
  sourceFingerprint: z.string().default(''),
  noveltyFingerprint: z.string().default(''),
  whyNow: z.string().nullable().optional().default(null),
  angleSummary: z.string().nullable().optional().default(null),
  seoPrimaryKeyword: z.string().nullable().optional().default(null),
  seoIntent: z.string().nullable().optional().default(null),
  relatedRouteTargets: z.array(z.string()).default([]),
  duplicateCheckSummary: DuplicateCheckSummarySchema.nullable().optional().default(null),
  suppressionReason: z.string().nullable().optional().default(null),
  publishedSlug: z.string().nullable().optional().default(null),
  createdAt: z.string().nullable().optional().default(null),
  updatedAt: z.string().nullable().optional().default(null),
});

export type DiscoveryCandidateStatus = z.infer<typeof DiscoveryCandidateStatusSchema>;
export type QueueWorkflowStatus = z.infer<typeof QueueWorkflowStatusSchema>;
export type SourceRef = z.infer<typeof SourceRefSchema>;
export type SourceRevisionRef = z.infer<typeof SourceRevisionRefSchema>;
export type DuplicateCheckSummary = z.infer<typeof DuplicateCheckSummarySchema>;
export type TitleCandidateRecord = z.infer<typeof TitleCandidateRecordSchema>;
export type SourceLedgerRecord = z.infer<typeof SourceLedgerRecordSchema>;
export type SourceConsumptionRecord = z.infer<typeof SourceConsumptionRecordSchema>;
export type SuppressionLogRecord = z.infer<typeof SuppressionLogRecordSchema>;
export type QueueRecord = z.infer<typeof QueueRecordSchema>;
