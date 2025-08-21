// app/creator/analytics/day/[date]/page.tsx
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Tables, Database } from '@/types/supabase'
import SessionStatsCard from '@/components/creator/dashboard/SessionStatsCard'
import ImpactScoreRealtimeBridge from '@/components/creator/dashboard/ImpactScoreRealtimeBridge'
import BulkContentTypeTagger from '@/components/creator/analytics/BulkContentTypeTagger'

type Metric = Tables<'creator_session_metrics'>
type ContentTypeEnum = Database['public']['Enums']['creator_content_type']

function isIsoDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s)
}

const ALLOWED_CT = ['video', 'image', 'guide', 'blog', 'story', 'other'] as const
function isContentType(x: string): x is ContentTypeEnum {
  return (ALLOWED_CT as readonly string[]).includes(x)
}

export default async function AnalyticsDayPage({
  params,
  searchParams,
}: {
  params: { date: string }
  searchParams?: { range?: string; type?: string }
}) {
  const supabase = createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { date } = params
  if (!isIsoDate(date)) redirect('/creator/analytics')

  // Zeitfenster für Abfrage des Tages
  const start = new Date(`${date}T00:00:00.000Z`).toISOString()
  const end = new Date(`${date}T23:59:59.999Z`).toISOString()

  // Zurück-Link-Parameter (Range + Segment)
  const backRange = (searchParams?.range ?? '90').toLowerCase()
  const backTypeRaw = (searchParams?.type ?? 'all').toLowerCase()
  const backHref = `/creator/analytics?range=${encodeURIComponent(
    backRange
  )}&type=${encodeURIComponent(backTypeRaw)}`

  // Query aufbauen (optional nach content_type filtern)
  let q = supabase
    .from('creator_session_metrics')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false })

  // Nur filtern, wenn der Typ ein gültiger Enum ist
  if (isContentType(backTypeRaw)) {
    q = q.eq('content_type', backTypeRaw as ContentTypeEnum)
  }

  const { data: rows, error } = await q

  if (error) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 md:px-8 py-10">
        <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
          <div className="text-lg font-semibold mb-1">Fehler beim Laden</div>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <div className="mt-4">
            <Link
              href={backHref}
              className="inline-flex items-center rounded-lg border border-input px-3 py-2 text-sm hover:bg-accent"
            >
              Zurück zur Analytics
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const metrics = (rows ?? []) as Metric[]
  const niceDate = new Date(`${date}T00:00:00Z`).toLocaleDateString()
  const segmentSuffix = isContentType(backTypeRaw) ? ` · Segment: ${backTypeRaw}` : ''

  return (
    <main className="mx-auto w-full max-w-3xl px-4 md:px-8 py-10">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sessions am {niceDate}</h1>
          <p className="text-sm text-muted-foreground">Detailansicht nach Tag{segmentSuffix}</p>
        </div>
        <Link
          href={backHref}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-input px-4 text-sm hover:bg-accent"
        >
          Zurück
        </Link>
      </header>

      {/* 🔥 Bulk-Tagging Toolbar + Liste */}
      {metrics.length > 0 && (
        <div className="mb-6">
          <BulkContentTypeTagger
            backHref={backHref}
            items={metrics.map(m => ({
              session_id: m.session_id,
              title: m.title,
              created_at: m.created_at ?? undefined,
              // Falls die generierten Types die Spalte noch nicht kennen:
              content_type: ((m as any)?.content_type as string | undefined) ?? 'other',
            }))}
          />
        </div>
      )}

      {/* Kartenansicht */}
      {metrics.length > 0 ? (
        <section className="space-y-3">
          {metrics.map((m) => (
            <SessionStatsCard key={m.session_id} metric={m} />
          ))}
        </section>
      ) : (
        <section className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
          <div className="text-lg font-semibold mb-1">Keine Sessions an diesem Tag</div>
          <p className="text-sm text-muted-foreground">
            Für {niceDate}{' '}
            {isContentType(backTypeRaw) ? `im Segment „${backTypeRaw}“ ` : ''}
            wurden keine Inhalte gefunden.
          </p>
          <div className="mt-4">
            <Link
              href={backHref}
              className="inline-flex items-center rounded-lg border border-input px-3 py-2 text-sm hover:bg-accent"
            >
              Zurück zur Analytics
            </Link>
          </div>
        </section>
      )}

      {/* Realtime, damit neue Sessions am selben Tag sofort auftauchen */}
      <ImpactScoreRealtimeBridge userId={user.id} />
    </main>
  )
}
