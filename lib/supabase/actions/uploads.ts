// lib/supabase/actions/uploads.ts
'use server'

import { createServerComponentClient } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/admin'
import type { Database } from '@/types/supabase'
import type { StorageError } from '@supabase/storage-js' // ← richtiger Typ für Storage-Fehler

type UploadRow = Database['public']['Tables']['creator_uploads']['Row']

const BUCKET = 'creator-media'

/**
 * Löscht einen Upload:
 * 1) Eigentumsprüfung
 * 2) Storage-Objekt(e) best-effort entfernen
 * 3) DB-Row löschen (RLS schützt zusätzlich)
 *
 * Idempotent: fehlende Storage-Objekte führen nicht zum Abbruch.
 */
export async function deleteUpload(id: string): Promise<{ ok: true }> {
  const supabase = createServerComponentClient()
  const admin = createSupabaseAdmin()

  // 0) Auth
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()
  if (userErr || !user) {
    const err: any = new Error('Not authenticated')
    err.status = 401
    throw err
  }

  // 1) Upload holen + Eigentum prüfen
  const { data: row, error: selErr } = await supabase
    .from('creator_uploads')
    .select('id,user_id,image_url,file_url')
    .eq('id', id)
    .maybeSingle<Pick<UploadRow, 'id' | 'user_id' | 'image_url' | 'file_url'>>()

  if (selErr) throw selErr
  if (!row) {
    const err: any = new Error('Upload not found')
    err.status = 404
    throw err
  }
  if (row.user_id !== user.id) {
    const err: any = new Error('Forbidden')
    err.status = 403
    throw err
  }

  // 2) Storage-Keys aus Public-URLs extrahieren (dedupe)
  const keys = new Set<string>()
  const k1 = storageKeyFromPublicUrl(row.image_url)
  const k2 = storageKeyFromPublicUrl(row.file_url)
  if (k1) keys.add(k1)
  if (k2) keys.add(k2)

  // 2a) Best-effort Remove (ein Call, mehrere Keys). Nicht-existierende Pfade ignorieren.
  if (keys.size > 0) {
    const { error: rmErr } = await admin.storage.from(BUCKET).remove([...keys])
    if (rmErr) {
      // Wir brechen NICHT ab. Nur protokollieren – DB-Row soll trotzdem gelöscht werden.
      // Bei harten Permission-Problemen (401/403) kannst du hier z. B. Monitoring triggern.
      console.warn('[deleteUpload] storage remove warning:', toStorageLog(rmErr))
    }
  }

  // 3) DB-Row löschen (RLS verlangt user_id-Match)
  const { error: delErr } = await supabase
    .from('creator_uploads')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (delErr) throw delErr
  return { ok: true }
}

/* ───────────────── helpers ───────────────── */

function storageKeyFromPublicUrl(url?: string | null): string | null {
  if (!url) return null
  try {
    // …/storage/v1/object/public/<bucket>/<path>
    const m = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/)
    if (!m) return null
    const bucket = m[1]
    const path = m[2]
    if (bucket !== BUCKET) return null
    // Querystring/Transforms entfernen
    return decodeURIComponent(path.split('?')[0])
  } catch {
    return null
  }
}

/** Schlanker Log-Eintrag für StorageError – ohne TS-Konflikte. */
function toStorageLog(e: StorageError) {
  return { message: e?.message, statusCode: (e as any)?.statusCode }
}
