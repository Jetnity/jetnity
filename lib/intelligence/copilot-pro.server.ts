// lib/intelligence/copilot-pro.server.ts
import 'server-only'
import { unstable_noStore as noStore } from 'next/cache'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/supabase'
import type { CopilotSuggestion } from '@/types/copilot-types'
import { copilotCreators } from '@/lib/intelligence/copilot-creators'
import { generateCopilotUpload } from './copilot-upload-generator'

/* ───────────────────────── shared helpers ───────────────────────── */

const normalize = (s?: string | null) => (s ?? '').trim().replace(/\s+/g, ' ')

function h32(str: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)
  }
  return h >>> 0
}

function seededShuffle<T>(arr: readonly T[], seed = 'jetnity'): T[] {
  const out = arr.slice()
  let s = h32(seed)
  for (let i = out.length - 1; i > 0; i--) {
    s = (1664525 * s + 1013904223) >>> 0
    const j = s % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/* ───────────────────────── getCopilotSuggestions ───────────────────────── */

export type CopilotSuggestionOptions = {
  /** Anzahl Vorschläge (1–12). Default 5 */
  limit?: number
  /** 'only' = nur virtuelle, 'exclude' = echte ausschließen, 'any' = alle */
  virtual?: 'only' | 'exclude' | 'any'
  /** Seed für deterministische Reihenfolge */
  seed?: string
}

/** Minimal genutzte Spalten (entsprechen deiner Tabelle) */
type UploadRow = Pick<
  Tables<'creator_uploads'>,
  'id' | 'title' | 'creator_name' | 'is_virtual' | 'created_at' | 'region'
>

function toSuggestion(item: UploadRow): CopilotSuggestion {
  const title = normalize(item.title || item.region || 'Inspiration')
  const creator = normalize(item.creator_name || 'CoPilot Pro')
  return {
    type: 'region',
    title,
    subtitle: `Erstellt von ${creator}`,
    link: `/story/${encodeURIComponent(String(item.id))}`,
  }
}

/** Liefert Copilot-Vorschläge; fällt auf kuratierte Creator-Regionen zurück. */
export async function getCopilotSuggestions(
  opts: CopilotSuggestionOptions = {}
): Promise<CopilotSuggestion[]> {
  noStore()

  const limit = Math.max(1, Math.min(opts.limit ?? 5, 12))
  const supabase = createServerComponentClient()
  const columns = 'id,title,creator_name,is_virtual,created_at,region'

  let query = supabase
    .from('creator_uploads')
    .select(columns)
    .order('created_at', { ascending: false })
    .limit(limit * 3)

  if (opts.virtual === 'only') query = query.eq('is_virtual', true)
  if (opts.virtual === 'exclude') query = query.eq('is_virtual', false)

  let rows: UploadRow[] = []
  try {
    const { data, error } = await query
    if (error) throw error
    rows = (data ?? []) as UploadRow[]
  } catch {
    // stiller Fallback unten
  }

  const seen = new Set<string>()
  const unique = rows.filter((r) => {
    const key = normalize(r.title) || `id:${r.id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const mixed = seededShuffle(unique, opts.seed ?? 'copilot-suggestions')
  const result = mixed.slice(0, limit).map(toSuggestion)
  if (result.length) return result

  // Fallback: virtuelle Creator als Inspirations-Tipps
  return seededShuffle(copilotCreators, opts.seed)
    .slice(0, limit)
    .map((c) => ({
      type: 'region',
      title: `Entdecke ${c.region}`,
      subtitle: `Mit ${c.name} | ${c.mood}`,
      link: `/search?q=${encodeURIComponent(c.region)}`,
    }))
}

/* ───────────────────────── maybeGenerateCopilotUpload ───────────────────────── */

export type MaybeGenerateOptions = {
  /** Generiere nur, wenn letzter Upload älter als X Tage ist (Default 14) */
  sinceDays?: number
  /** Wie viele Uploads pro Region als „genug“ zählen (Default 1) */
  maxPerRegion?: number
  /** Nur virtuelle Uploads zählen (Default true) */
  virtualOnly?: boolean
  /** Testlauf ohne Generierung (Default false) */
  dryRun?: boolean
}

export type MaybeGenerateResult = {
  ok: boolean
  action: 'skipped' | 'generated' | 'error'
  region: string
  message: string
  existingId?: string
  uploadId?: string
  createdAt?: string
}

async function runMaybeGenerateCopilotUpload(
  region: string,
  opts: MaybeGenerateOptions
): Promise<MaybeGenerateResult> {
  noStore()

  const supabase = createServerComponentClient()
  const regionQuery = (region ?? '').trim()
  if (regionQuery.length < 2) {
    return { ok: false, action: 'error', region: regionQuery, message: 'Ungültige Region (zu kurz).' }
  }

  const sinceDays = Math.max(0, opts.sinceDays ?? 14)
  const maxPerRegion = Math.max(1, opts.maxPerRegion ?? 1)
  const virtualOnly = opts.virtualOnly !== false

  let q = supabase
    .from('creator_uploads')
    .select('id, created_at, is_virtual', { count: 'exact', head: false })
    .ilike('region', regionQuery)
    .order('created_at', { ascending: false })
    .limit(maxPerRegion)

  if (virtualOnly) q = q.eq('is_virtual', true)

  const { data, error, count } = await q
  if (error) {
    console.error('[copilot-pro] Regions-Check fehlgeschlagen:', error.message)
    return { ok: false, action: 'error', region: regionQuery, message: 'DB-Fehler beim Regions-Check.' }
  }

  const newest = data?.[0]
  const haveAny = (count ?? 0) > 0
  const cutoffISO = sinceDays > 0 ? new Date(Date.now() - sinceDays * 86400000).toISOString() : undefined

  if (haveAny && newest?.created_at && cutoffISO && newest.created_at > cutoffISO) {
    return {
      ok: true,
      action: 'skipped',
      region: regionQuery,
      message: `Bereits ${count} Upload(s) vorhanden (zu frisch für Auto-Generierung).`,
      existingId: String(newest.id),
    }
  }

  if (opts.dryRun) {
    return {
      ok: true,
      action: 'skipped',
      region: regionQuery,
      message: 'Dry-Run: Es würde jetzt ein Copilot-Upload generiert.',
      existingId: newest ? String(newest.id) : undefined,
    }
  }

  try {
    const created = await generateCopilotUpload(regionQuery)
    if (!created) {
      return { ok: false, action: 'error', region: regionQuery, message: 'Upload-Generierung fehlgeschlagen.' }
    }

    const uploadId = (created as any).id ? String((created as any).id) : undefined
    const createdAt = (created as any).created_at ?? new Date().toISOString()

    return {
      ok: true,
      action: 'generated',
      region: regionQuery,
      message: '✅ Copilot-Pro Upload generiert.',
      uploadId,
      createdAt,
    }
  } catch (err: any) {
    console.error('[copilot-pro] Generierung fehlgeschlagen:', err?.message ?? err)
    return { ok: false, action: 'error', region: regionQuery, message: 'Fehler während der Generierung.' }
  }
}

// Overload 1: Legacy – String
export function maybeGenerateCopilotUpload(region: string): Promise<string>
// Overload 2: Pro – Result-Objekt
export function maybeGenerateCopilotUpload(region: string, opts: MaybeGenerateOptions): Promise<MaybeGenerateResult>

export async function maybeGenerateCopilotUpload(
  region: string,
  opts?: MaybeGenerateOptions
): Promise<string | MaybeGenerateResult> {
  const options: MaybeGenerateOptions = {
    sinceDays: 14,
    maxPerRegion: 1,
    virtualOnly: true,
    dryRun: false,
    ...opts,
  }

  const res = await runMaybeGenerateCopilotUpload(region, options)

  if (typeof opts === 'undefined') {
    if (res.action === 'skipped') return '✅ Bereits existierender Upload gefunden.'
    if (res.action === 'generated') return '✅ Copilot-Pro Upload generiert.'
    return '❌ Upload fehlgeschlagen.'
  }
  return res
}
