import crypto from 'crypto';

export function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function stripHtml(value: string) {
  return normalizeWhitespace(value.replace(/<[^>]+>/g, ' '));
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function sha1(value: string) {
  return crypto.createHash('sha1').update(value).digest('hex');
}

export function shortHash(value: string, length = 12) {
  return sha1(value).slice(0, length);
}

export function tokenize(value: string) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

export function unique<T>(values: T[]) {
  return [...new Set(values)];
}

export function jaccardSimilarity(left: string[], right: string[]) {
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  const union = new Set([...leftSet, ...rightSet]);

  if (union.size === 0) {
    return 0;
  }

  let intersection = 0;
  for (const value of leftSet) {
    if (rightSet.has(value)) {
      intersection += 1;
    }
  }

  return intersection / union.size;
}

export function sentenceCase(value: string) {
  const trimmed = normalizeWhitespace(value);
  if (!trimmed) {
    return trimmed;
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function headlineCase(value: string) {
  const smallWords = new Set(['a', 'an', 'and', 'as', 'at', 'for', 'if', 'in', 'of', 'on', 'or', 'the', 'to', 'vs', 'with']);

  return normalizeWhitespace(value)
    .split(' ')
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && smallWords.has(lower)) {
        return lower;
      }

      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}
