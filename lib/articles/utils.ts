import { ReactNode } from 'react';

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function stripMarkdownNoise(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[#>*_~\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function countWords(value: string): number {
  const cleaned = stripMarkdownNoise(value);
  return cleaned.length === 0 ? 0 : cleaned.split(/\s+/).length;
}

export function readingMinutes(wordCount: number): number {
  return Math.max(4, Math.round(wordCount / 220));
}

export function clipSentence(value: string, maxLength = 140): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  const clipped = normalized.slice(0, maxLength).replace(/\s+\S*$/, '');
  return `${clipped}...`;
}

export function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function flattenReactText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(flattenReactText).join(' ');
  }

  if (node && typeof node === 'object' && 'props' in node) {
    const props = (node as { props?: { children?: ReactNode } }).props;
    return flattenReactText(props?.children ?? '');
  }

  return '';
}
