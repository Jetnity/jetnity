// app/(creator)/creator-story/[id]/page.tsx
export const dynamic = 'force-dynamic'

import { unstable_noStore as noStore } from 'next/cache'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import NextDynamic from 'next/dynamic'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/supabase'
import SessionImpact from '@/components/story/SessionImpact'

// Client-only Tracker (kein SSR)
const SessionViewTracker = NextDynamic(
  () => import('@/components/story/SessionViewTracker'),
  { ssr: false }
)

type SessionRow = Pick<
  Tables<'creator_sessions'>,
  'id' | 'title' | 'user_id' | 'visibility' | 'rating' | 'insights' | 'created_at'
>
type SnippetRow = Pick<Tables<'session_snippets'>, 'id' | 'content' | 'created_at'>
type MediaRow = Pick<Tables<'session_media'>, 'id' | 'image_url' | 'description' | 'created_at'>

export default async function Page({ params }: { params: { id: string } }) {
  noStore()
  const supabase = createServerComponentClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Session laden (nur notwendige Felder)
  const { data: session, error: sessionErr } = await supabase
    .from('creator_sessions')
    .select('id, title, user_id, visibility, rating, insights, created_at')
    .eq('id', params.id)
    .maybeSingle<SessionRow>()

  if (sessionErr || !session) return notFound()

  const isOwner = session.user_id === user.id
  const isAdmin =
    user.role === 'admin' || (user.email ?? '').toLowerCase().endsWith('@jetnity.com')
  const isPublic = (session.visibility as 'private' | 'public') === 'public'

  if (!isOwner && !isAdmin && !isPublic) redirect('/unauthorized')

  const [{ data: snippets }, { data: media }] = await Promise.all([
    supabase
      .from('session_snippets')
      .select('id, content, created_at')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true }) as any as Promise<{ data: SnippetRow[] | null }>,
    supabase
      .from('session_media')
      .select('id, image_url, description, created_at')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true }) as any as Promise<{ data: MediaRow[] | null }>,
  ])

  const fmt = new Intl.DateTimeFormat('de-CH', { dateStyle: 'medium', timeStyle: 'short' })
  const safeDesc = (d: unknown) => (typeof d === 'string' ? d : '')

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {session.title || 'Story'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {fmt.format(new Date(session.created_at || Date.now()))}
          </p>
        </div>
        <Link
          href="/creator-dashboard"
          className="text-xs text-primary underline-offset-4 hover:underline"
        >
          Zurück zum Dashboard
        </Link>
      </div>

      {/* Rating */}
      {typeof session.rating === 'number' && (
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium">🎯 CoPilot Score</span>
            <span className="text-muted-foreground">{session.rating}/100</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-green-500"
              style={{ width: `${Math.max(0, Math.min(100, session.rating))}%` }}
            />
          </div>
        </div>
      )}

      {/* Insights */}
      {session.insights && (
        <div className="rounded-xl border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold">💡 Insights</h2>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {session.insights}
          </p>
        </div>
      )}

      {/* Media */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Media</h2>
          <span className="text-xs text-muted-foreground">{media?.length ?? 0} Dateien</span>
        </div>

        {media && media.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4">
            {media.map((m) => (
              <li key={m.id} className="overflow-hidden rounded-xl border bg-background">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.image_url}
                  alt={safeDesc(m.description) || 'Medienbild'}
                  loading="lazy"
                  decoding="async"
                  className="h-auto w-full object-cover"
                />
                {(safeDesc(m.description) || m.created_at) && (
                  <div className="flex items-center justify-between px-3 py-2">
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {safeDesc(m.description)}
                    </p>
                    <span className="ml-3 shrink-0 text-[10px] text-muted-foreground">
                      {m.created_at ? fmt.format(new Date(m.created_at)) : ''}
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Keine Medien vorhanden.</p>
        )}
      </section>

      {/* Snippets */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Snippets</h2>
        {snippets && snippets.length > 0 ? (
          <div className="space-y-3">
            {snippets.map((s) => (
              <article key={s.id} className="rounded-xl border bg-card p-3">
                <p className="whitespace-pre-wrap text-sm">{s.content}</p>
                {s.created_at && (
                  <div className="mt-2 text-right text-[10px] text-muted-foreground">
                    {fmt.format(new Date(s.created_at))}
                  </div>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Keine Snippets vorhanden.</p>
        )}
      </section>

      {/* Footer / Meta */}
      <div className="pt-6 text-center text-xs text-muted-foreground">
        Jetnity Story-ID: <code className="select-all">{params.id}</code>
      </div>

      {/* Analytics & Impact */}
      <SessionImpact sessionId={session.id} />
      <SessionViewTracker sessionId={session.id} />
    </main>
  )
}
