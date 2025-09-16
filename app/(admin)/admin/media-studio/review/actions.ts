// app/(admin)/admin/media-studio/review/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createServerComponentClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

type ReviewStatus = 'pending' | 'approved' | 'rejected'

const isValidStatus = (s: string): s is ReviewStatus =>
  s === 'pending' || s === 'approved' || s === 'rejected'

function sb() {
  return createServerComponentClient() as any
}

/* ───────────────────────── Single Update ───────────────────────── */

// Overloads: FormData und direkte Argumente
export async function updateReviewStatus(formData: FormData): Promise<void>
export async function updateReviewStatus(id: string, review_status: ReviewStatus): Promise<void>
export async function updateReviewStatus(a: FormData | string, b?: ReviewStatus): Promise<void> {
  const { user } = await requireAdmin()
  const supabase = sb()

  let id: string
  let review_status: ReviewStatus

  if (typeof a === 'string') {
    id = a
    review_status = b as ReviewStatus
  } else {
    id = String(a.get('id') ?? '')
    review_status = String(a.get('review_status') ?? '') as ReviewStatus
  }

  if (!id || !isValidStatus(review_status)) {
    throw new Error('Ungültige Parameter')
  }

  const { error } = await supabase
    .from('creator_sessions')
    .update({ review_status })
    .eq('id', id)

  if (error) throw new Error(error.message || 'Update fehlgeschlagen')

  // optionales Audit (best-effort)
  try {
    await supabase.from('admin_audit_events').insert({
      actor_id: user.id,
      action: 'review_status_update',
      target_type: 'creator_session',
      target_id: id,
      meta: { review_status },
    })
  } catch { /* Tabelle evtl. nicht vorhanden */ }

  revalidatePath('/admin/media-studio/review')
  revalidatePath(`/admin/media-studio/review/${id}`)
}

/* ───────────────────────── Bulk Update ───────────────────────── */

type BulkArgs = { ids: string[]; review_status: ReviewStatus }

/**
 * Bulk-Update des Review-Status.
 * - Unterstützt FormData:
 *    - entweder `ids` als JSON/CSV
 *    - oder mehrere Felder `id=...` (wiederholt)
 */
export async function bulkUpdateReviewStatus(formData: FormData): Promise<number>
export async function bulkUpdateReviewStatus(args: BulkArgs): Promise<number>
export async function bulkUpdateReviewStatus(a: FormData | BulkArgs): Promise<number> {
  const { user } = await requireAdmin()
  const supabase = sb()

  let ids: string[] = []
  let review_status: ReviewStatus

  if (a instanceof FormData) {
    const rawIds = a.getAll('id').map(String)
    const listField = String(a.get('ids') ?? '')
    if (rawIds.length) {
      ids = rawIds.filter(Boolean)
    } else if (listField) {
      try {
        const parsed = JSON.parse(listField)
        if (Array.isArray(parsed)) ids = parsed.map(String).filter(Boolean)
      } catch {
        ids = listField.split(',').map(s => s.trim()).filter(Boolean)
      }
    }
    review_status = String(a.get('review_status') ?? '') as ReviewStatus
  } else {
    ids = (a.ids ?? []).map(String).filter(Boolean)
    review_status = a.review_status
  }

  if (!ids.length || !isValidStatus(review_status)) {
    throw new Error('Ungültige Parameter')
  }

  const { error, count } = await supabase
    .from('creator_sessions')
    .update({ review_status })
    .in('id', ids)
    .select('id', { count: 'exact', head: true })

  if (error) throw new Error(error.message || 'Bulk-Update fehlgeschlagen')

  // optionales Audit (best-effort)
  try {
    await supabase.from('admin_audit_events').insert(
      ids.map((id: string) => ({
        actor_id: user.id,
        action: 'review_status_bulk_update',
        target_type: 'creator_session',
        target_id: id,
        meta: { review_status },
      }))
    )
  } catch { /* optional */ }

  revalidatePath('/admin/media-studio/review')
  ids.forEach((id) => revalidatePath(`/admin/media-studio/review/${id}`))

  return count ?? ids.length
}
