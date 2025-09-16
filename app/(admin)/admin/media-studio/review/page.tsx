// app/(admin)/admin/media-studio/review/page.tsx
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { unstable_noStore as noStore } from 'next/cache'
import { createServerComponentClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import AdminReviewTable from '@/components/admin/AdminReviewTable'
import { updateReviewStatus } from './actions'

type ReviewStatus = 'pending' | 'approved' | 'rejected'
type ReviewSession = {
  id: string
  title: string | null
  user_id: string
  review_status: ReviewStatus
  created_at: string
}

type SearchParams = {
  status?: ReviewStatus | 'all'
  q?: string
  limit?: string
}

export default async function AdminReviewPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  noStore()

  // Admin-Gate (Owner/Admin/Operator/Moderator oder @jetnity.com)
  await requireAdmin()

  const supabase = createServerComponentClient() as any

  // Filter lesen (optional)
  const statusParam = (searchParams?.status ?? 'pending') as ReviewStatus | 'all'
  const q = (searchParams?.q ?? '').trim()
  const limit = Math.min(Math.max(1, Number(searchParams?.limit ?? 100)), 500)

  // Sessions laden
  let query = supabase
    .from('creator_sessions')
    .select('id, title, user_id, review_status, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (statusParam !== 'all') {
    query = query.eq('review_status', statusParam)
  }
  if (q) {
    // einfacher Textfilter auf Titel
    query = query.ilike('title', `%${q}%`)
  }

  const { data, error } = await query
  if (error) {
    console.error('[admin/media-studio/review] load error:', error)
  }

  const sessions: ReviewSession[] = (data ?? []).map((s: any) => ({
    id: String(s.id),
    title: s.title ?? null,
    user_id: String(s.user_id),
    review_status: (s.review_status ?? 'pending') as ReviewStatus,
    created_at: s.created_at ?? new Date().toISOString(),
  }))

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Admin Review – Creator Sessions</h1>
        <p className="text-sm text-muted-foreground">{sessions.length} Einträge</p>
      </div>

      {/* Dein Table-Component erwartet weiterhin sessions + onUpdate */}
      <AdminReviewTable sessions={sessions} onUpdate={updateReviewStatus} />
    </main>
  )
}
