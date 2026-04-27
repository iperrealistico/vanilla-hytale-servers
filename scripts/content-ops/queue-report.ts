import { readDiscoveryState } from '@/lib/content-ops/discovery/state';
import { getContentOpsPaths } from '@/lib/content-ops/paths';

const state = readDiscoveryState(getContentOpsPaths());

const queueCounts = state.queueRecords.reduce<Record<string, number>>((acc, record) => {
  acc[record.workflowStatus] = (acc[record.workflowStatus] ?? 0) + 1;
  return acc;
}, {});

const familyCounts = state.queueRecords.reduce<Record<string, number>>((acc, record) => {
  acc[record.familyId] = (acc[record.familyId] ?? 0) + 1;
  return acc;
}, {});

console.log(
  JSON.stringify(
    {
      ok: true,
      queueCounts,
      familyCounts,
      candidates: state.candidates.length,
      suppressed: state.suppressionLog.length,
      topQueue: state.queueRecords.slice(0, 10).map((record) => ({
        queueId: record.queueId,
        status: record.workflowStatus,
        familyId: record.familyId,
        title: record.title,
      })),
    },
    null,
    2,
  ),
);
