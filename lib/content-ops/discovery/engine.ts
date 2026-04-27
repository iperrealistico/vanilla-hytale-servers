import { getRecentPublishedArticles } from '@/lib/content-ops/discovery/dedupe';
import { createSourceFetcher, type SourceFetcher } from '@/lib/content-ops/discovery/fetcher';
import { getDiscoveryFamilies } from '@/lib/content-ops/discovery/registry';
import {
  appendSuppressionLog,
  materializeQueueFromCandidates,
  readDiscoveryState,
  regenerateTitleReport,
  syncPublishedArticlesIntoState,
  upsertCandidate,
  upsertSourceLedgerRecord,
  writeDiscoveryState,
} from '@/lib/content-ops/discovery/state';
import { getContentOpsPaths, type ContentOpsPaths } from '@/lib/content-ops/paths';

export interface DiscoverTitlesOptions {
  familyId?: string;
  paths?: ContentOpsPaths;
  nowIso?: string;
  fetcher?: SourceFetcher;
}

export async function discoverTitles(options: DiscoverTitlesOptions = {}) {
  const paths = options.paths ?? getContentOpsPaths();
  const nowIso = options.nowIso ?? new Date().toISOString();
  const state = readDiscoveryState(paths);

  syncPublishedArticlesIntoState(state, nowIso);

  const recentPublished = getRecentPublishedArticles(10);
  const fetcher = options.fetcher ?? createSourceFetcher(paths);
  const families = getDiscoveryFamilies(options.familyId);

  for (const family of families) {
    const result = await family.discover({
      familyId: family.id,
      nowIso,
      paths,
      fetcher,
      recentPublished,
      queueRecords: state.queueRecords,
      existingCandidates: state.candidates,
      sourceLedger: state.sourceLedger,
      sourceConsumption: state.sourceConsumption,
    });

    for (const candidate of result.candidates) {
      upsertCandidate(state, candidate);
    }

    for (const record of result.sourceLedger) {
      upsertSourceLedgerRecord(state, record);
    }

    for (const record of result.suppressionLog) {
      appendSuppressionLog(state, record);
    }
  }

  materializeQueueFromCandidates(state);
  regenerateTitleReport(state);
  writeDiscoveryState(state);

  const queueCounts = state.queueRecords.reduce<Record<string, number>>((acc, record) => {
    acc[record.workflowStatus] = (acc[record.workflowStatus] ?? 0) + 1;
    return acc;
  }, {});

  return {
    familiesRun: families.map((family) => family.id),
    queueCounts,
    candidateCount: state.candidates.length,
    suppressionCount: state.suppressionLog.length,
  };
}
