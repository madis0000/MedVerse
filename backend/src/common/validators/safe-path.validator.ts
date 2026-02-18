import * as path from 'path';

const UNSAFE_PATH_PATTERN = /(\.\.|[<>:"|?*])/;

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.');
}

export function isPathSafe(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  if (UNSAFE_PATH_PATTERN.test(input)) return false;
  if (input.includes('\0')) return false;
  const normalized = path.normalize(input);
  if (normalized.includes('..')) return false;
  return true;
}
