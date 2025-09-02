// lib/intelligence/copilot-pro.server.ts
import 'server-only'
import { unstable_noStore as noStore } from 'next/cache'
import { createServerComponentClient } from '@/lib/supabase/server'
import { generateCopilotUpload } from './copilot-upload-generator'

/** Steuerungsoptionen für die Auto-Generierung */
export type MaybeGenerateOptions = {
  /** Nur generieren, wenn der letzte Upload älter als X Tage ist (Default 14) */
  sinceDays?: number
  /** Wie viele Uploads pro Region maximal als "genug" gelten (Default 1) */
  maxPerRegion?: number
  /** Nur virtuelle Uploads zählen (Default true) */
  virtualOnly?: boolean
  /** Testlauf ohne Generierung (Default false) */
  dryRun?: boolean
}

/** Ergebnisobjekt mit klarer Aktion + Metadaten */
export type MaybeGenerateResult = {
  ok: boolean
  action: 'skipped' | 'generated' | 'error'
  region: string
  message: string
  existingId?: string
  uploadId?: string
  createdAt?: string
}

/**
 * Prüft, ob bereits (aktuelle) Uploads zu dieser Region existieren.
 * Falls nicht (oder zu alt), generiert Copilot Pro automatisch einen Upload.
 */
export async function maybeGenerateCopilotUpload(
  region: string,
  opts: MaybeGenerateOptions = {}
): Promise<MaybeGenerateResult> {
  noStore() // immer frische Prüfung in RSC

  const supabase = createServerComponentClient()
  const regionQuery = (region ?? '').trim()
  if (regionQuery.length < 2) {
    return {
      ok: false,
      action: 'error',
      region: regionQuery,
      message: 'Ungültige Region (zu kurz).',
    }
  }

  const sinceDays = Math.max(0, opts.sinceDays ?? 14)
  const maxPerRegion = Math.max(1, opts.maxPerRegion ?? 1)
  const virtualOnly = opts.virtualOnly !== false // default: true

  // Neueste Uploads der Region holen (kleiner Überhang für solide Entscheidung)
  let q = supabase
    .from('creator_uploads')
    .select('id, created_at, is_virtual', { count: 'exact', head: false })
    .ilike('region', regionQuery) // case-insensitives "eq"
    .order('created_at', { ascending: false })
    .limit(maxPerRegion)

  if (virtualOnly) q = q.eq('is_virtual', true)

  const { data, error, count } = await q

  if (error) {
    console.error('[copilot-pro] Regions-Check fehlgeschlagen:', error.message)
    return {
      ok: false,
      action: 'error',
      region: regionQuery,
      message: 'DB-Fehler beim Regions-Check.',
    }
  }

  const newest = data?.[0]
  const haveAny = (count ?? 0) > 0
  const cutoffISO =
    sinceDays > 0 ? new Date(Date.now() - sinceDays * 86400000).toISOString() : undefined

  // Wenn genug Uploads existieren und der neueste frisch genug ist → überspringen
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
      return {
        ok: false,
        action: 'error',
        region: regionQuery,
        message: 'Upload-Generierung fehlgeschlagen.',
      }
    }

    const uploadId = (created as any).id ? String((created as any).id) : undefined
    const createdAt =
      (created as any).created_at ?? new Date().toISOString()

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
    return {
      ok: false,
      action: 'error',
      region: regionQuery,
      message: 'Fehler während der Generierung.',
    }
  }
}
