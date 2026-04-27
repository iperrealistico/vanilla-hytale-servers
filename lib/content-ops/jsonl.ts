import fs from 'fs';
import path from 'path';

export function ensureParentDir(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export function ensureTextFile(filePath: string, defaultContents = '') {
  ensureParentDir(filePath);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, defaultContents);
  }
}

export function readJsonlFile<T>(filePath: string, parser: (value: unknown) => T): T[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) {
    return [];
  }

  return raw
    .split('\n')
    .filter(Boolean)
    .map((line) => parser(JSON.parse(line) as unknown));
}

export function writeJsonlFile<T>(filePath: string, rows: T[]) {
  ensureParentDir(filePath);
  const next = rows.map((row) => JSON.stringify(row)).join('\n');
  fs.writeFileSync(filePath, next.length > 0 ? `${next}\n` : '');
}
