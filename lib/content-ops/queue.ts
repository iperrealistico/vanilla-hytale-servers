import { readJsonlFile, writeJsonlFile } from '@/lib/content-ops/jsonl';
import { type ContentOpsPaths } from '@/lib/content-ops/paths';
import {
  QueueRecordSchema,
  type DuplicateCheckSummary,
  type QueueRecord,
  type QueueWorkflowStatus,
  type SourceRef,
  type SourceRevisionRef,
} from '@/lib/content-ops/discovery/schema';

function normalizeQueueRecord(value: unknown): QueueRecord {
  return QueueRecordSchema.parse(value);
}

export function readQueueRecords(paths: ContentOpsPaths): QueueRecord[] {
  const records = readJsonlFile(paths.queuePath, normalizeQueueRecord);
  return records.sort((left, right) => left.queueIndex - right.queueIndex);
}

export function writeQueueRecords(paths: ContentOpsPaths, records: QueueRecord[]) {
  const normalized = records.map((record, index) =>
    QueueRecordSchema.parse({
      ...record,
      queueIndex: index + 1,
      rawTitleLineNumber: record.rawTitleLineNumber ?? null,
    }),
  );
  writeJsonlFile(paths.queuePath, normalized);
}

export interface QueueRecordUpgradeInput {
  candidateId: string | null;
  familyId: string;
  title: string;
  workflowStatus: QueueWorkflowStatus;
  articleSlug?: string | null;
  draftPath?: string | null;
  lastRunOutcome?: string | null;
  sourceRefs?: SourceRef[];
  sourceRevisionRefs?: SourceRevisionRef[];
  sourceFingerprint?: string;
  noveltyFingerprint?: string;
  whyNow?: string | null;
  angleSummary?: string | null;
  seoPrimaryKeyword?: string | null;
  seoIntent?: string | null;
  relatedRouteTargets?: string[];
  duplicateCheckSummary?: DuplicateCheckSummary | null;
  suppressionReason?: string | null;
  publishedSlug?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export function mergeQueueRecord(existing: QueueRecord, patch: QueueRecordUpgradeInput): QueueRecord {
  return QueueRecordSchema.parse({
    ...existing,
    ...patch,
    draftPath: patch.draftPath ?? existing.draftPath,
    lastRunOutcome: patch.lastRunOutcome ?? existing.lastRunOutcome,
    articleSlug: patch.articleSlug ?? existing.articleSlug,
    publishedSlug: patch.publishedSlug ?? existing.publishedSlug,
    updatedAt: patch.updatedAt ?? existing.updatedAt,
  });
}
