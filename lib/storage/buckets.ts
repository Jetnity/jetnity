export const BUCKETS = {
  ORIGINAL: 'media-original',
  PROXY: 'media-proxy',
  RENDERS: 'media-renders',
  THUMBS: 'media-thumbs',
  VERSIONS: 'media-versions',
} as const;

export type BucketId = typeof BUCKETS[keyof typeof BUCKETS];

/**
 * Erzwingt die User-Ordnerstruktur <userId>/<filename>.
 * Du kannst hier jederzeit Datumsunterordner ergänzen.
 */
export function userScopedPath(userId: string, filename: string) {
  const safe = filename
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '');
  return `${userId}/${Date.now()}_${safe}`;
}
