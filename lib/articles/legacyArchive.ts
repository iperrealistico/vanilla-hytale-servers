import fs from 'fs';
import path from 'path';

import { z } from 'zod';

const legacyArchiveRecordSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  content: z.string(),
  slug: z.string(),
  backlinks: z.array(z.string()).default([]),
  category: z.string(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type LegacyArchiveEntry = z.infer<typeof legacyArchiveRecordSchema> & {
  urlPath: string;
};

const legacyArchiveRoot = path.join(process.cwd(), 'content', 'archive', 'legacy-ai-blog', 'posts');
let cache: LegacyArchiveEntry[] | null = null;

function loadLegacyArchive() {
  if (cache) {
    return cache;
  }

  if (!fs.existsSync(legacyArchiveRoot)) {
    cache = [];
    return cache;
  }

  cache = fs
    .readdirSync(legacyArchiveRoot)
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      const payload = JSON.parse(fs.readFileSync(path.join(legacyArchiveRoot, file), 'utf8'));
      const parsed = legacyArchiveRecordSchema.parse(payload);
      return {
        ...parsed,
        urlPath: `/blog/${parsed.slug}`,
      } satisfies LegacyArchiveEntry;
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  return cache;
}

export function getLegacyArchive() {
  return loadLegacyArchive();
}

export function getLegacyArchiveBySlug(slug: string) {
  return loadLegacyArchive().find((entry) => entry.slug === slug) ?? null;
}
