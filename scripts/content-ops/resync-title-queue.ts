import fs from 'fs';
import path from 'path';

const root = path.join(process.cwd(), 'documents-local', 'workspace-local', 'content-ops');
const rawTitlesPath = path.join(root, 'article-titles-raw.md');
const queuePath = path.join(root, 'article-title-queue.jsonl');

interface QueueRecord {
  queueId: string;
  queueIndex: number;
  rawTitleLineNumber: number;
  title: string;
  titleLocked: boolean;
  workflowStatus: string;
  articleSlug: string | null;
  draftPath: string | null;
  lastRunOutcome: string | null;
  updatedAt: string | null;
}

function readRawTitles() {
  const content = fs.readFileSync(rawTitlesPath, 'utf8');
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

function readQueue(): QueueRecord[] {
  if (!fs.existsSync(queuePath)) {
    return [];
  }

  return fs
    .readFileSync(queuePath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as QueueRecord);
}

function main() {
  const titles = readRawTitles();
  const existing = new Map(readQueue().map((record) => [record.title, record]));
  const now = new Date().toISOString();

  const nextRecords = titles.map((title, index) => {
    const previous = existing.get(title);
    return {
      queueId: previous?.queueId ?? `title-${String(index + 1).padStart(4, '0')}`,
      queueIndex: index + 1,
      rawTitleLineNumber: index + 1,
      title,
      titleLocked: true,
      workflowStatus: previous?.workflowStatus ?? 'queued',
      articleSlug: previous?.articleSlug ?? null,
      draftPath: previous?.draftPath ?? null,
      lastRunOutcome: previous?.lastRunOutcome ?? null,
      updatedAt: now,
    } satisfies QueueRecord;
  });

  fs.writeFileSync(queuePath, `${nextRecords.map((record) => JSON.stringify(record)).join('\n')}\n`);
  console.log(`Resynced ${nextRecords.length} queue records.`);
}

main();
