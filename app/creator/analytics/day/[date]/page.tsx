// app/creator/analytics/day/[date]/page.tsx
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/supabase'
import SessionStatsCard from '@/components/creator/dashboard/SessionStatsCard'
import ImpactScoreRealtimeBridge from '@/components/creator/dashboard/ImpactScoreRealtimeBridge'

type Metric = Tables<'creator_session_metrics'>

function isIsoDate(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s)
}

export default async function AnalyticsDayPage({
  params,
  searchParams,
}: {
  params: { date: string }
  searchParams?: { range?: string }
}) {
  const supabase = createServerComponentClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { date } = params
  if (!isIsoDate(date)) redirect('/creator/analytics')

  const start = new Date(`${date}T00:00:00.000Z`).toISOString()
  const end = new Date(`${date}T23:59:59.999Z`).toISOString()

  const { data: rows, error } = await supabase
    .from('creator_session_metrics')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false })

  const backRange = (searchParams?.range ?? '90').toLowerCase()
  const backHref = `/creator/analytics?range=${encodeURIComponent(backRange)}`

  if (error) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 md:px-8 py-10">
        <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
          <div className="text-lg font-semibold mb-1">Fehler beim Laden</div>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <div className="mt-4">
            <Link href={backHref} className="inline-flex items-center rounded-lg border border-input px-3 py-2 text-sm hover:bg-accent">
              Zurück zur Analytics
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const metrics = (rows ?? []) as Metric[]
  const niceDate = new Date(`${date}T00:00:00Z`).toLocaleDateString()

  return (
    <main className="mx-auto w-full max-w-3xl px-4 md:px-8 py-10">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sessions am {niceDate}</h1>
          <p className="text-sm text-muted-foreground">Detailansicht nach Tag</p>
        </div>
        <Link
          href={backHref}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-input px-4 text-sm hover:bg-accent"
        >
          Zurück
        </Link>
      </header>

      {metrics.length > 0 ? (
        <section className="space-y-3">
          {metrics.map(m => (
            <SessionStatsCard key={m.session_id} metric={m} />
          ))}
        </section>
      ) : (
        <section className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
          <div className="text-lg font-semibold mb-1">Keine Sessions an diesem Tag</div>
          <p className="text-sm text-muted-foreground">
            Für {niceDate} wurden keine Inhalte gefunden.
          </p>
          <div className="mt-4">
            <Link href={backHref} className="inline-flex items-center rounded-lg border border-input px-3 py-2 text-sm hover:bg-accent">
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
