import fs from 'fs';

import { ensureTextFile, readJsonlFile, writeJsonlFile } from '@/lib/content-ops/jsonl';
import { getContentOpsPaths, type ContentOpsPaths } from '@/lib/content-ops/paths';
import { readQueueRecords, writeQueueRecords, mergeQueueRecord } from '@/lib/content-ops/queue';
import type { ArticleEntry } from '@/lib/articles/content';
import { getAllArticles } from '@/lib/articles/content';
import {
  QueueRecordSchema,
  SourceConsumptionRecordSchema,
  SourceLedgerRecordSchema,
  SuppressionLogRecordSchema,
  TitleCandidateRecordSchema,
  type QueueRecord,
  type SourceConsumptionRecord,
  type SourceLedgerRecord,
  type SuppressionLogRecord,
  type TitleCandidateRecord,
} from '@/lib/content-ops/discovery/schema';

export interface DiscoveryState {
  paths: ContentOpsPaths;
  queueRecords: QueueRecord[];
  candidates: TitleCandidateRecord[];
  sourceLedger: SourceLedgerRecord[];
  sourceConsumption: SourceConsumptionRecord[];
  suppressionLog: SuppressionLogRecord[];
}

export function ensureDiscoveryWorkspace(paths = getContentOpsPaths()) {
  fs.mkdirSync(paths.discoveryRoot, { recursive: true });
  fs.mkdirSync(paths.snapshotsRoot, { recursive: true });
  ensureTextFile(paths.candidateLedgerPath);
  ensureTextFile(paths.sourceLedgerPath);
  ensureTextFile(paths.sourceConsumptionPath);
  ensureTextFile(paths.suppressionLogPath);
  ensureTextFile(paths.queuePath);
  ensureTextFile(
    paths.rawTitleReportPath,
    '# Generated Title Queue Report\n\nThis file is now a generated human-readable report, not the canonical discovery source of truth.\n',
  );
}

export function readDiscoveryState(paths = getContentOpsPaths()): DiscoveryState {
  ensureDiscoveryWorkspace(paths);

  return {
    paths,
    queueRecords: readQueueRecords(paths),
    candidates: readJsonlFile(paths.candidateLedgerPath, (value) => TitleCandidateRecordSchema.parse(value)),
    sourceLedger: readJsonlFile(paths.sourceLedgerPath, (value) => SourceLedgerRecordSchema.parse(value)),
    sourceConsumption: readJsonlFile(paths.sourceConsumptionPath, (value) => SourceConsumptionRecordSchema.parse(value)),
    suppressionLog: readJsonlFile(paths.suppressionLogPath, (value) => SuppressionLogRecordSchema.parse(value)),
  };
}

export function writeDiscoveryState(state: DiscoveryState) {
  writeQueueRecords(state.paths, state.queueRecords);
  writeJsonlFile(
    state.paths.candidateLedgerPath,
    state.candidates.sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
  );
  writeJsonlFile(
    state.paths.sourceLedgerPath,
    state.sourceLedger.sort((left, right) => left.sourceKey.localeCompare(right.sourceKey)),
  );
  writeJsonlFile(
    state.paths.sourceConsumptionPath,
    state.sourceConsumption.sort((left, right) => left.consumedAt.localeCompare(right.consumedAt)),
  );
  writeJsonlFile(
    state.paths.suppressionLogPath,
    state.suppressionLog.sort((left, right) => left.createdAt.localeCompare(right.createdAt)),
  );
}

export function upsertCandidate(state: DiscoveryState, candidate: TitleCandidateRecord) {
  const next = state.candidates.filter((record) => record.candidateId !== candidate.candidateId);
  next.push(TitleCandidateRecordSchema.parse(candidate));
  state.candidates = next;
}

export function upsertSourceLedgerRecord(state: DiscoveryState, record: SourceLedgerRecord) {
  const next = state.sourceLedger.filter((entry) => entry.sourceKey !== record.sourceKey);
  next.push(SourceLedgerRecordSchema.parse(record));
  state.sourceLedger = next;
}

export function upsertSourceConsumptionRecord(state: DiscoveryState, record: SourceConsumptionRecord) {
  const next = state.sourceConsumption.filter((entry) => entry.consumptionId !== record.consumptionId);
  next.push(SourceConsumptionRecordSchema.parse(record));
  state.sourceConsumption = next;
}

export function appendSuppressionLog(state: DiscoveryState, record: SuppressionLogRecord) {
  state.suppressionLog = [...state.suppressionLog, SuppressionLogRecordSchema.parse(record)];
}

export function allocateNextQueueId(queueRecords: QueueRecord[]) {
  const max = queueRecords.reduce((highest, record) => {
    const numeric = Number(record.queueId.replace(/^title-/, ''));
    return Number.isFinite(numeric) ? Math.max(highest, numeric) : highest;
  }, 0);
  return `title-${String(max + 1).padStart(4, '0')}`;
}

function rankWorkflowStatus(status: QueueRecord['workflowStatus']) {
  switch (status) {
    case 'published':
    case 'published-needs-enrichment':
      return 5;
    case 'ready-to-publish':
      return 4;
    case 'ready-for-review':
      return 3;
    case 'drafted':
      return 2;
    case 'queued':
      return 1;
    case 'blocked':
      return 0;
    default:
      return 0;
  }
}

function desiredQueueStatus(candidateStatus: TitleCandidateRecord['workflowStatus']): QueueRecord['workflowStatus'] {
  switch (candidateStatus) {
    case 'drafted':
      return 'drafted';
    case 'ready-for-review':
      return 'ready-for-review';
    case 'ready-to-publish':
      return 'ready-to-publish';
    case 'published':
      return 'published';
    case 'published-needs-enrichment':
      return 'published-needs-enrichment';
    case 'blocked':
    case 'suppressed':
    case 'stale':
      return 'blocked';
    default:
      return 'queued';
  }
}

function queueSortWeight(record: QueueRecord) {
  return record.familyId === 'legacy-manual' ? 0 : 1;
}

export function materializeQueueFromCandidates(state: DiscoveryState) {
  const queueByCandidateId = new Map(state.queueRecords.filter((record) => record.candidateId).map((record) => [record.candidateId as string, record]));
  const nextQueue: QueueRecord[] = [...state.queueRecords.filter((record) => record.candidateId === null)];

  for (const candidate of state.candidates) {
    const existing = queueByCandidateId.get(candidate.candidateId);
    const targetStatus = desiredQueueStatus(candidate.workflowStatus);

    if (!existing) {
      if (candidate.workflowStatus === 'suppressed' || candidate.workflowStatus === 'stale') {
        continue;
      }

      nextQueue.push(
        QueueRecordSchema.parse({
          candidateId: candidate.candidateId,
          queueId: candidate.queueId ?? allocateNextQueueId(nextQueue),
          queueIndex: nextQueue.length + 1,
          rawTitleLineNumber: null,
          familyId: candidate.familyId,
          title: candidate.title,
          titleLocked: true,
          workflowStatus: targetStatus,
          articleSlug: candidate.articleSlug,
          sourceRefs: candidate.sourceRefs,
          sourceRevisionRefs: candidate.sourceRevisionRefs,
          sourceFingerprint: candidate.sourceFingerprint,
          noveltyFingerprint: candidate.noveltyFingerprint,
          whyNow: candidate.whyNow,
          angleSummary: candidate.angleSummary,
          seoPrimaryKeyword: candidate.seoPrimaryKeyword,
          seoIntent: candidate.seoIntent,
          relatedRouteTargets: candidate.relatedRouteTargets,
          duplicateCheckSummary: candidate.duplicateCheckSummary,
          suppressionReason: candidate.suppressionReason,
          publishedSlug: candidate.publishedSlug,
          createdAt: candidate.createdAt,
          updatedAt: candidate.updatedAt,
        }),
      );
      continue;
    }

    const merged = mergeQueueRecord(existing, {
      candidateId: candidate.candidateId,
      familyId: candidate.familyId,
      title: candidate.title,
      workflowStatus:
        rankWorkflowStatus(existing.workflowStatus) > rankWorkflowStatus(targetStatus) ? existing.workflowStatus : targetStatus,
      articleSlug: candidate.articleSlug ?? existing.articleSlug,
      sourceRefs: candidate.sourceRefs,
      sourceRevisionRefs: candidate.sourceRevisionRefs,
      sourceFingerprint: candidate.sourceFingerprint,
      noveltyFingerprint: candidate.noveltyFingerprint,
      whyNow: candidate.whyNow,
      angleSummary: candidate.angleSummary,
      seoPrimaryKeyword: candidate.seoPrimaryKeyword,
      seoIntent: candidate.seoIntent,
      relatedRouteTargets: candidate.relatedRouteTargets,
      duplicateCheckSummary: candidate.duplicateCheckSummary,
      suppressionReason: candidate.suppressionReason,
      publishedSlug: candidate.publishedSlug,
      createdAt: existing.createdAt ?? candidate.createdAt,
      updatedAt: candidate.updatedAt,
    });

    nextQueue.push(merged);
  }

  state.queueRecords = nextQueue.sort((left, right) => {
    const weightDelta = queueSortWeight(left) - queueSortWeight(right);
    if (weightDelta !== 0) {
      return weightDelta;
    }

    if (left.queueIndex !== right.queueIndex) {
      return left.queueIndex - right.queueIndex;
    }

    return (left.createdAt ?? '').localeCompare(right.createdAt ?? '');
  });

  for (const record of state.queueRecords) {
    if (!record.candidateId) {
      continue;
    }

    const candidate = state.candidates.find((entry) => entry.candidateId === record.candidateId);
    if (!candidate) {
      continue;
    }

    candidate.queueId = record.queueId;
    candidate.articleSlug = record.articleSlug;
    candidate.publishedSlug = record.publishedSlug;
    if (record.workflowStatus === 'drafted') candidate.workflowStatus = 'drafted';
    if (record.workflowStatus === 'ready-for-review') candidate.workflowStatus = 'ready-for-review';
    if (record.workflowStatus === 'ready-to-publish') candidate.workflowStatus = 'ready-to-publish';
    if (record.workflowStatus === 'published') candidate.workflowStatus = 'published';
    if (record.workflowStatus === 'published-needs-enrichment') candidate.workflowStatus = 'published-needs-enrichment';
    if (record.workflowStatus === 'blocked' && candidate.workflowStatus === 'queued') candidate.workflowStatus = 'blocked';
    candidate.updatedAt = record.updatedAt ?? candidate.updatedAt;
  }
}

export function regenerateTitleReport(state: DiscoveryState) {
  const lines = [
    '# Generated Title Queue Report',
    '',
    'This file is now a generated human-readable report. The canonical upstream discovery state lives in `discovery/title-candidates.jsonl` and related ledgers.',
    '',
    '## Queue',
    '',
  ];

  for (const record of state.queueRecords) {
    lines.push(`- [${record.workflowStatus}] ${record.title}`);
    lines.push(`  - queueId: ${record.queueId}`);
    lines.push(`  - family: ${record.familyId}`);
    if (record.whyNow) {
      lines.push(`  - why now: ${record.whyNow}`);
    }
  }

  fs.writeFileSync(state.paths.rawTitleReportPath, `${lines.join('\n')}\n`);
}

export function syncPublishedArticlesIntoState(state: DiscoveryState, nowIso: string) {
  const articles = getAllArticles(state.paths.workspaceRoot).filter((article) => article.frontmatter.workflowStatus === 'published');
  const queueById = new Map(state.queueRecords.map((record) => [record.queueId, record]));
  const candidateById = new Map(state.candidates.map((candidate) => [candidate.candidateId, candidate]));

  for (const article of articles) {
    const queueRecord = queueById.get(article.frontmatter.queueId);
    if (!queueRecord) {
      continue;
    }

    queueRecord.workflowStatus = article.frontmatter.workflowStatus;
    queueRecord.articleSlug = article.slug;
    queueRecord.publishedSlug = article.slug;
    queueRecord.updatedAt = nowIso;

    if (queueRecord.candidateId) {
      const candidate = candidateById.get(queueRecord.candidateId);
      if (candidate) {
        candidate.workflowStatus = article.frontmatter.workflowStatus;
        candidate.articleSlug = article.slug;
        candidate.publishedSlug = article.slug;
        candidate.updatedAt = nowIso;

        const consumptionId = `${queueRecord.queueId}:${candidate.sourceFingerprint || article.slug}`;
        if (
          candidate.sourceFingerprint &&
          !state.sourceConsumption.some((entry) => entry.consumptionId === consumptionId)
        ) {
          upsertSourceConsumptionRecord(state, {
            consumptionId,
            candidateId: candidate.candidateId,
            queueId: queueRecord.queueId,
            familyId: candidate.familyId,
            articleSlug: article.slug,
            title: article.frontmatter.title,
            sourceFingerprint: candidate.sourceFingerprint,
            noveltyFingerprint: candidate.noveltyFingerprint,
            sourceRefs: candidate.sourceRefs,
            sourceRevisionRefs: candidate.sourceRevisionRefs,
            consumedAt: nowIso,
            publishedAt: article.frontmatter.publishedAt,
          });
        }
      }
    }
  }
}

export function getRecentPublishedArticleTitles(limit = 10) {
  return getAllArticles()
    .filter((article) => article.frontmatter.workflowStatus === 'published')
    .slice(0, limit)
    .map((article) => article.frontmatter.title);
}

export type { ArticleEntry };
