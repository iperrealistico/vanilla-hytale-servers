import type { SourceFetcher } from '@/lib/content-ops/discovery/fetcher';
import type { ContentOpsPaths } from '@/lib/content-ops/paths';
import type {
  QueueRecord,
  SourceConsumptionRecord,
  SourceLedgerRecord,
  SuppressionLogRecord,
  TitleCandidateRecord,
} from '@/lib/content-ops/discovery/schema';
import type { RecentPublishedArticle } from '@/lib/content-ops/discovery/dedupe';

export interface DiscoveryFamilyContext {
  familyId: string;
  nowIso: string;
  paths: ContentOpsPaths;
  fetcher: SourceFetcher;
  recentPublished: RecentPublishedArticle[];
  queueRecords: QueueRecord[];
  existingCandidates: TitleCandidateRecord[];
  sourceLedger: SourceLedgerRecord[];
  sourceConsumption: SourceConsumptionRecord[];
}

export interface DiscoveryFamilyResult {
  candidates: TitleCandidateRecord[];
  sourceLedger: SourceLedgerRecord[];
  suppressionLog: SuppressionLogRecord[];
}

export interface DiscoveryFamily {
  id: string;
  label: string;
  discover(context: DiscoveryFamilyContext): Promise<DiscoveryFamilyResult>;
}
