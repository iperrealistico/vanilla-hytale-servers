import { syncImageWorkSidecarsForRecord } from '@/lib/content-ops/image-work';
import { getContentOpsPaths } from '@/lib/content-ops/paths';
import { readQueueRecords } from '@/lib/content-ops/queue';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function main() {
  const paths = getContentOpsPaths();
  const requestedQueueId = process.argv[2];
  const queue = readQueueRecords(paths);
  const records = requestedQueueId
    ? queue.filter((record) => record.queueId === requestedQueueId)
    : queue.filter((record) => record.workflowStatus === 'drafted');

  if (records.length === 0) {
    throw new Error(requestedQueueId ? `No queue record found for ${requestedQueueId}.` : 'No drafted queue records found.');
  }

  for (const record of records) {
    syncImageWorkSidecarsForRecord({
      paths,
      record,
      slug: record.articleSlug ?? slugify(record.title),
    });
  }

  console.log(`Synced blueprint image sidecars for ${records.length} record(s).`);
}

main();
