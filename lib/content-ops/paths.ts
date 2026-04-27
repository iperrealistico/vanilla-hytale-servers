import path from 'path';

export interface ContentOpsPaths {
  workspaceRoot: string;
  contentOpsRoot: string;
  queuePath: string;
  rawTitleReportPath: string;
  discoveryRoot: string;
  candidateLedgerPath: string;
  sourceLedgerPath: string;
  sourceConsumptionPath: string;
  suppressionLogPath: string;
  snapshotsRoot: string;
}

export function getContentOpsPaths(workspaceRoot = process.cwd()): ContentOpsPaths {
  const contentOpsRoot = path.join(workspaceRoot, 'documents-local', 'workspace-local', 'content-ops');
  const discoveryRoot = path.join(contentOpsRoot, 'discovery');

  return {
    workspaceRoot,
    contentOpsRoot,
    queuePath: path.join(contentOpsRoot, 'article-title-queue.jsonl'),
    rawTitleReportPath: path.join(contentOpsRoot, 'article-titles-raw.md'),
    discoveryRoot,
    candidateLedgerPath: path.join(discoveryRoot, 'title-candidates.jsonl'),
    sourceLedgerPath: path.join(discoveryRoot, 'source-ledger.jsonl'),
    sourceConsumptionPath: path.join(discoveryRoot, 'source-consumption.jsonl'),
    suppressionLogPath: path.join(discoveryRoot, 'suppression-log.jsonl'),
    snapshotsRoot: path.join(discoveryRoot, 'snapshots'),
  };
}
