// app/creator/media-studio/session/[id]/page.tsx
import { createServerComponentClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Database } from '@/types/supabase'
import EditorShell, { type EditorMediaItem } from '@/components/creator/media-studio/EditorShell'
import SessionPerformancePanel from '@/components/creator/media-studio/SessionPerformancePanel' // ⚡ NEU

type Session = Database['public']['Tables']['creator_sessions']['Row']

export default async function MediaStudioSessionPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient<Database>()
  const sessionId = params.id

  const { data: session, error: sessionErr } = await supabase
    .from('creator_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle<Session>()

  if (sessionErr) console.error(sessionErr)
  if (!session) notFound()

  // ⚡ Optional: Performance-Daten laden (funktioniert auch, wenn Tabellen fehlen)
  let metric:
    | {
        impressions?: number | null
        views?: number | null
        prev_impressions?: number | null
        prev_views?: number | null
        watch_time_sec_total?: number | null
        completion_rate?: number | null
      }
    | null = null

  let timeseries: Array<{ date: string; impressions: number; views: number }> = []

  try {
    // Wenn die Tabellen nicht in deinen DB-Typen stehen, via `as any` casten:
    const { data: m } = await (supabase as any)
      .from('session_metrics')
      .select(
        'impressions,views,prev_impressions,prev_views,watch_time_sec_total,completion_rate'
      )
      .eq('session_id', sessionId)
      .maybeSingle()

    metric = m ?? null

    const { data: d } = await (supabase as any)
      .from('session_metrics_daily')
      .select('date,impressions,views')
      .eq('session_id', sessionId)
      .order('date', { ascending: true })
      .limit(60)

    timeseries =
      (d ?? []).map((r: any) => ({
        date: String(r.date),
        impressions: Number(r.impressions ?? 0),
        views: Number(r.views ?? 0),
      })) ?? []
  } catch (e) {
    // Tabellen evtl. (noch) nicht vorhanden – Panel wird einfach nicht gerendert
    console.warn('[performance]', e)
  }

  const { data: rawMedia, error: mediaErr } = await supabase
    .from('session_media')
    .select('*')
    .eq('session_id', sessionId)

  if (mediaErr) console.warn(mediaErr)

  const media: EditorMediaItem[] =
    (rawMedia as any[] | null)
      ?.map((row: any) => {
        const kind: 'image' | 'video' =
          row.media_type ?? row.type ?? (row.mime_type?.startsWith?.('video') ? 'video' : 'image')
        const src: string =
          row.public_url ?? row.url ?? row.storage_url ?? row.path ?? row.file_url ?? ''
        const thumb: string | undefined = row.thumb_url ?? row.thumbnail_url ?? undefined

        return {
          id: String(row.id),
          kind,
          src,
          thumb,
          width: row.width ?? undefined,
          height: row.height ?? undefined,
          durationMs: row.duration_ms ?? row.duration ?? undefined,
          name: row.title ?? row.filename ?? row.name ?? undefined,
          createdAt: row.created_at ?? undefined,
        } as EditorMediaItem
      })
      ?.filter(Boolean) ?? []

  return (
    <div className="min-h-[100dvh]">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Media Studio – {session.title ?? 'Unbenannte Session'}
            </h1>
            <p className="text-sm text-muted-foreground">Session-ID: {session.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/creator/creator-dashboard"
              className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-accent"
            >
              Zurück zum Dashboard
            </Link>
          </div>
        </div>

        {/* ⚡ Performance-Panel nur anzeigen, wenn Daten vorhanden */}
        {metric && (
          <SessionPerformancePanel
            className="mb-4"
            impressions={Number(metric.impressions ?? 0)}
            views={Number(metric.views ?? 0)}
            prevImpressions={metric.prev_impressions ?? null}
            prevViews={metric.prev_views ?? null}
            timeseries={timeseries}
            watchTimeSecTotal={metric.watch_time_sec_total ?? undefined}
            completionRate={metric.completion_rate ?? undefined}
          />
        )}

        <EditorShell
          sessionId={session.id}
          sessionTitle={session.title ?? 'Unbenannt'}
          media={media}
        />
      </div>
    </div>
  )
}
