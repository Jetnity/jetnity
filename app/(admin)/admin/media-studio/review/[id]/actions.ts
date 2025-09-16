// app/(admin)/admin/media-studio/review/[id]/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createServerComponentClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

type ReviewStatus = 'pending' | 'approved' | 'rejected'
type Severity = 'low' | 'medium' | 'high' | 'blocker'

const isValidStatus = (s: string): s is ReviewStatus =>
  s === 'pending' || s === 'approved' || s === 'rejected'

const isValidSeverity = (s: string): s is Severity =>
  s === 'low' || s === 'medium' || s === 'high' || s === 'blocker'

/** lockerer Client, um Generics-Reibung zu vermeiden */
function sb() {
  return createServerComponentClient() as any
}

/** YYYY-MM-DD → YYYY-MM-DD (oder null bei invalide) */
function normalizeDateOnly(v: string | null | undefined) {
  if (!v) return null
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  // keine TZ-Umrechnung – reiner Datumstyp
  return `${m[1]}-${m[2]}-${m[3]}`
}

/* ───────────────────────── updateReviewStatus ───────────────────────── */

// Overloads
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

  // Update
  const { error } = await supabase
    .from('creator_sessions')
    .update({ review_status })
    .eq('id', id)

  if (error) throw new Error(error.message || 'Update fehlgeschlagen')

  // Audit (best-effort)
  try {
    await supabase.from('admin_audit_events').insert({
      actor_id: user.id,
      action: 'review_status_update',
      target_type: 'creator_session',
      target_id: id,
      meta: { review_status },
    })
  } catch {
    /* Tabelle evtl. nicht vorhanden – ignorieren */
  }

  // Revalidate Liste + Detail
  revalidatePath('/admin/media-studio/review')
  revalidatePath(`/admin/media-studio/review/${id}`)
}

/* ───────────────────────── createChangeRequest ───────────────────────── */

// Overloads
export async function createChangeRequest(formData: FormData): Promise<void>
export async function createChangeRequest(args: {
  session_id: string
  severity: Severity
  reason?: string
  details?: string
  due_date?: string // YYYY-MM-DD
}): Promise<void>
export async function createChangeRequest(a: FormData | {
  session_id: string
  severity: Severity
  reason?: string
  details?: string
  due_date?: string
}): Promise<void> {
  const { user } = await requireAdmin()
  const supabase = sb()

  let session_id = ''
  let severity = '' as Severity
  let reason = ''
  let details = ''
  let due_date: string | null = null

  if (a instanceof FormData) {
    session_id = String(a.get('session_id') ?? '')
    severity = String(a.get('severity') ?? '') as Severity
    reason = String(a.get('reason') ?? '')
    details = String(a.get('details') ?? '')
    due_date = normalizeDateOnly(String(a.get('due_date') ?? ''))
  } else {
    session_id = a.session_id
    severity = a.severity
    reason = a.reason ?? ''
    details = a.details ?? ''
    due_date = normalizeDateOnly(a.due_date)
  }

  if (!session_id || !isValidSeverity(severity)) {
    throw new Error('Ungültige Parameter')
  }

  const insert = {
    session_id,
    admin_id: user.id,
    severity,
    reason: reason || null,
    details: details || null,
    due_date, // als YYYY-MM-DD String
    status: 'open',
  }

  const { error } = await supabase.from('session_review_requests').insert(insert)
  if (error) throw new Error(error.message || 'Change Request fehlgeschlagen')

  // Audit (best-effort)
  try {
    await supabase.from('admin_audit_events').insert({
      actor_id: user.id,
      action: 'change_request_create',
      target_type: 'creator_session',
      target_id: session_id,
      meta: { severity, has_reason: !!reason, has_details: !!details, due_date },
    })
  } catch {
    /* optional */
  }

  // Revalidate Liste + Detail
  revalidatePath('/admin/media-studio/review')
  revalidatePath(`/admin/media-studio/review/${session_id}`)
}
