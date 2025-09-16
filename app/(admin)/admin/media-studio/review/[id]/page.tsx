// app/(admin)/admin/media-studio/review/[id]/page.tsx
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { unstable_noStore as noStore } from 'next/cache'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import ChangeRequestDialog from '@/components/admin/media-studio/ChangeRequestDialog'
import MediaPreview from '@/components/admin/media-studio/MediaPreview'
import { updateReviewStatus, createChangeRequest } from './actions'

type ReviewStatus = 'pending' | 'approved' | 'rejected'

type ReviewSession = {
  id: string
  title: string | null
  user_id: string
  review_status: ReviewStatus
  created_at: string
  preview_url: string | null
}

export default async function ReviewDetailPage({ params }: { params: { id: string } }) {
  noStore()
  await requireAdmin()

  const supabase = createServerComponentClient() as any

  // Session laden (nur sichere Spalten)
  const { data: s, error } = await supabase
    .from('creator_sessions')
    .select('id, title, user_id, review_status, created_at')
    .eq('id', params.id)
    .maybeSingle()

  if (error || !s) return notFound()

  // Medien-Preview tolerant bestimmen (verschiedene Spalten möglich)
  let preview_url: string | null = null
  try {
    const { data: m } = await supabase
      .from('session_media')
      .select('*')
      .eq('session_id', s.id)
      .order('position', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (m) {
      const mm = m as any
      preview_url = mm.url ?? mm.public_url ?? mm.file_url ?? mm.path ?? null
    }
  } catch {
    // ignorieren – dann bleibt preview_url null
  }

  const sessionData: ReviewSession = {
    id: String(s.id),
    title: s.title ?? null,
    user_id: String(s.user_id),
    review_status: (s.review_status ?? 'pending') as ReviewStatus,
    created_at: s.created_at ?? new Date().toISOString(),
    preview_url,
  }

  // Badge-Styling über Klassen (deine Badge-Variante ist eingeschränkt)
  const statusCfg: Record<ReviewStatus, { label: string; cls: string }> = {
    pending: {
      label: 'Pending',
      cls: 'border border-border text-foreground/70 bg-transparent',
    },
    approved: {
      label: 'Approved',
      cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300',
    },
    rejected: {
      label: 'Rejected',
      cls: 'bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-300',
    },
  }

  const dtf = new Intl.DateTimeFormat('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/media-studio/review"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Zur Liste
          </Link>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
            Review: {sessionData.title || 'Ohne Titel'}
          </h1>
          <Badge className={cn('capitalize', statusCfg[sessionData.review_status].cls)}>
            {statusCfg[sessionData.review_status].label}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <form action={updateReviewStatus}>
            <input type="hidden" name="id" value={sessionData.id} />
            <input type="hidden" name="review_status" value="pending" />
            <Button variant="outline" size="sm">Pending</Button>
          </form>

          <form action={updateReviewStatus}>
            <input type="hidden" name="id" value={sessionData.id} />
            <input type="hidden" name="review_status" value="approved" />
            <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700">
              Approve
            </Button>
          </form>

          <form action={updateReviewStatus}>
            <input type="hidden" name="id" value={sessionData.id} />
            <input type="hidden" name="review_status" value="rejected" />
            <Button variant="destructive" size="sm">Reject</Button>
          </form>

          <ChangeRequestDialog sessionId={sessionData.id} onSubmitAction={createChangeRequest} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Preview */}
        <section className="lg:col-span-8 overflow-hidden rounded-2xl border">
          <MediaPreview url={sessionData.preview_url} />
        </section>

        {/* Meta */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="rounded-2xl border p-4">
            <h2 className="mb-2 font-semibold">Details</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Session-ID</dt>
                <dd className="font-mono text-xs">{sessionData.id}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Creator</dt>
                <dd className="font-mono text-xs">{sessionData.user_id}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Erstellt</dt>
                <dd>{dtf.format(new Date(sessionData.created_at))}</dd>
              </div>
            </dl>

            <div className="my-4 h-px bg-border" />

            <h3 className="mb-1 text-sm font-semibold">Schnell-Aktionen</h3>
            <div className="flex flex-wrap gap-2">
              <a
                className="text-sm text-primary underline underline-offset-2"
                href={`/creator/media-studio/session/${sessionData.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Im Editor öffnen
              </a>
              <a
                className="text-sm text-primary underline underline-offset-2"
                href={`/story/${sessionData.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Öffentliche Vorschau
              </a>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
