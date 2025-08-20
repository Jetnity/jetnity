// Server Component (RSC)
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'
import TimeframeTabs from '@/components/creator/dashboard/TimeframeTabs'
import MetricsChart from '@/components/creator/analytics/MetricsChart'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { fetchCreatorMetricsTimeseries } from '@/lib/supabase/rpc/creatorMetricsTimeseries'

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams?: { range?: string }
}) {
  const supabase = createServerComponentClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const range = (searchParams?.range ?? '90').toLowerCase()
  const days: number | 'all' =
    range === 'all'
      ? 'all'
      : [30, 90, 180].includes(Number(range))
      ? (Number(range) as 30 | 90 | 180)
      : 90
  const effectiveDays = days === 'all' ? 3650 : days

  // Daten holen (RPC aggregiert per Tag)
  const points = await fetchCreatorMetricsTimeseries(supabase, effectiveDays)

  // Totals + Raten
  const totals = points.reduce(
    (acc, p) => {
      acc.impressions += p.impressions
      acc.views += p.views
      acc.engagement += p.likes + p.comments // engagement wird unten berechnet, hier benötigen wir likes/comments; die liefert RPC nicht getrennt
      return acc
    },
    { impressions: 0, views: 0, engagement: 0 }
  )

  // Für Chart: Engagement aus (likes+comments); RPC liefert likes/comments getrennt -> mappen wir schnell um
  const chartData = points.map(p => ({
    date: p.d,
    impressions: p.impressions,
    views: p.views,
    engagement: p.likes + p.comments,
    likes: p.likes,
    comments: p.comments,
  }))

  const imp = Math.max(1, totals.impressions)
  const viewRate = totals.views / imp
  const engagementRate = totals.engagement / imp

  return (
    <main className="mx-auto w-full max-w-7xl px-4 md:px-8 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Performance über Zeit (aggregiert nach Tagen)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TimeframeTabs />
          <Link
            href="/creator/creator-dashboard"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 px-4 text-sm font-medium text-primary hover:bg-primary/15"
          >
            Zurück zum Dashboard
          </Link>
        </div>
      </header>

      {/* KPI-Leiste */}
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi title="Impressions" value={totals.impressions.toLocaleString()} />
        <Kpi title="Views" value={totals.views.toLocaleString()} />
        <Kpi title="View-Rate" value={`${(viewRate * 100).toFixed(1)}%`} />
        <Kpi title="Engagement-Rate" value={`${(engagementRate * 100).toFixed(1)}%`} />
      </section>

      {/* Chart */}
      {chartData.length > 0 ? (
        <section className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
          <MetricsChart data={chartData} />
          <p className="mt-3 text-xs text-muted-foreground">
            Zeitraum: {days === 'all' ? 'Gesamt' : `letzte ${days} Tage`} · Aggregation: täglich
          </p>
        </section>
      ) : (
        <section className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
          <div className="text-lg font-semibold mb-1">Noch keine Daten</div>
          <p className="text-sm text-muted-foreground">
            Starte eine Session im Media-Studio, um Analytics zu sehen.
          </p>
          <Link
            href="/creator/media-studio"
            className="mt-4 inline-flex items-center rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/15"
          >
            Media-Studio öffnen
          </Link>
        </section>
      )}
    </main>
  )
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-4">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  )
}
