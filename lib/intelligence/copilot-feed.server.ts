// lib/intelligence/copilot-feed.server.ts
import 'server-only'
import { unstable_noStore as noStore } from 'next/cache'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/supabase'

export type GetTrendingUploadsOptions = {
  /** Anzahl Ergebnisse (1–50). Default: 6 */
  limit?: number
  /** Keyset-Pagination: lade ältere Einträge als dieses ISO-Datum (created_at). */
  cursorBefore?: string
  /** Nur virtuelle / nur echte / alle (Default: alle) */
  virtual?: 'only' | 'exclude' | 'any'
  /** Nur Uploads seit X Tagen (optional). */
  sinceDays?: number
}

export type TrendingUpload = Tables<'creator_uploads'> & {
  /** Berechneter Score: 0..1 (je frischer, desto höher) */
  trendingScore: number
}

/** Zeitdegression: ~halbiert alle 12h */
function hotScore(createdAtISO: string, now = Date.now()): number {
  const created = Date.parse(createdAtISO || '')
  if (Number.isNaN(created)) return 0
  const ageHours = (now - created) / 36e5
  const halfLifeH = 12
  // 1 / (1 + age/halfLife) ⇒ 1 frisch, ~0.5 bei 12h, ~0.25 bei 24h …
  return 1 / (1 + ageHours / halfLifeH)
}

/**
 * Liefert “Trending” Uploads (öffentlich zugreifbar dank RLS), sortiert nach Recency-Hotness.
 * Verlangt **keine** speziellen Spalten außer `created_at` und `is_virtual` (optional).
 */
export async function getTrendingUploads(
  opts: GetTrendingUploadsOptions = {}
): Promise<TrendingUpload[]> {
  noStore() // immer frische Daten (RSC)

  const limit = Math.max(1, Math.min(opts.limit ?? 6, 50))
  const supabase = createServerComponentClient()

  let query = supabase
    .from('creator_uploads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (opts.cursorBefore) {
    query = query.lt('created_at', opts.cursorBefore)
  }

  if (opts.sinceDays && opts.sinceDays > 0) {
    const since = new Date(Date.now() - opts.sinceDays * 86400000).toISOString()
    query = query.gte('created_at', since)
  }

  // is_virtual ist in Jetnity vorhanden (✅), daher sicher zu filtern:
  if (opts.virtual === 'only') query = query.eq('is_virtual', true)
  if (opts.virtual === 'exclude') query = query.eq('is_virtual', false)

  const { data, error } = await query

  if (error || !data) {
    if (error) {
      console.error('[getTrendingUploads] Supabase error:', error.message)
    }
    return []
  }

  const now = Date.now()
  const rows = data as Tables<'creator_uploads'>[]

  const withScore: TrendingUpload[] = rows.map((r) => ({
    ...r,
    trendingScore: hotScore(String(r.created_at), now),
  }))

  // Sekundäres Sortieren stabilisiert das Ranking, falls Timestamps sehr dicht sind.
  withScore.sort((a, b) => b.trendingScore - a.trendingScore || (String(b.created_at) > String(a.created_at) ? 1 : -1))

  return withScore
}

/**
 * Bequemer Wrapper: erste Seite ohne Filter.
 * Beispiel: const uploads = await getHomeTrendingUploads()
 */
export async function getHomeTrendingUploads(): Promise<TrendingUpload[]> {
  return getTrendingUploads({ limit: 6, virtual: 'any' })
}
