// app/creator/analytics/page.tsx
// Server Component (RSC)
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createServerComponentClient } from '@/lib/supabase/server'
import TimeframeTabs from '@/components/creator/dashboard/TimeframeTabs'
import SegmentFilter from '@/components/creator/analytics/SegmentFilter'
import MetricsChart, { type MetricsChartPoint } from '@/components/creator/analytics/MetricsChart'
import { fetchCreatorMetricsTimeseries } from '@/lib/supabase/rpc/creatorMetricsTimeseries'

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams?: { range?: string; type?: string }
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

  const rawType = (searchParams?.type ?? 'all').toLowerCase()
  const allowed = new Set(['all', 'video', 'image', 'guide', 'blog', 'story', 'other'])
  const type = allowed.has(rawType) ? rawType : 'all'
  const contentType = type === 'all' ? null : type

  // Für Δ: aktuelle + vorherige Periode (2 * days). Für "all" groß.
  const effectiveDays = days === 'all' ? 3650 : days
  const all = await fetchCreatorMetricsTimeseries(
    supabase,
    days === 'all' ? effectiveDays : effectiveDays * 2,
    contentType
  )

  // ISO-Grenze yyyy-mm-dd (lexikografisch vergleichbar)
  const boundaryIso = isoDay(new Date(Date.now() - effectiveDays * 24 * 60 * 60 * 1000))
  const current = days === 'all' ? all : all.filter((p) => p.d >= boundaryIso)
  const previous = days === 'all' ? [] : all.filter((p) => p.d < boundaryIso)

  // Totals
  const curT = totals(current)
  const prevT = totals(previous)

  // Chart-Daten
  const chartData: MetricsChartPoint[] = current.map((p) => ({
    date: p.d,
    impressions: p.impressions,
    views: p.views,
    engagement: p.likes + p.comments,
    likes: p.likes,
    comments: p.comments,
  }))

  const imp = Math.max(1, curT.impressions)
  const viewRate = curT.views / imp
  const engagementRate = curT.engagement / imp

  // CSV-Export-Link für Rohdaten (Sessions) mit aktuellen Filtern
  const csvHref = `/api/creator/analytics/export?range=${encodeURIComponent(
    range
  )}&type=${encodeURIComponent(type)}`

  return (
    <main className="mx-auto w-full max-w-7xl px-4 md:px-8 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Performance über Zeit {type !== 'all' ? `· Segment: ${type}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SegmentFilter />
          <TimeframeTabs />
          {/* Rohdaten CSV (Sessions) */}
          <a
            href={csvHref}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-input px-4 text-sm hover:bg-accent"
          >
            Rohdaten CSV
          </a>
          <Link
            href="/creator/creator-dashboard"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 px-4 text-sm font-medium text-primary hover:bg-primary/15"
          >
            Zurück zum Dashboard
          </Link>
        </div>
      </header>

      {/* KPIs + Δ vs. Vorperiode (nur bei 30/90/180) */}
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi
          title="Impressions"
          value={curT.impressions.toLocaleString()}
          delta={days === 'all' ? undefined : curT.impressions - prevT.impressions}
          denom={prevT.impressions}
        />
        <Kpi
          title="Views"
          value={curT.views.toLocaleString()}
          delta={days === 'all' ? undefined : curT.views - prevT.views}
          denom={prevT.views}
        />
        <Kpi
          title="View-Rate"
          value={`${(viewRate * 100).toFixed(1)}%`}
          delta={
            days === 'all'
              ? undefined
              : rateDelta(curT.views, prevT.views, curT.impressions, prevT.impressions)
          }
          isPercent
        />
        <Kpi
          title="Engagement-Rate"
          value={`${(engagementRate * 100).toFixed(1)}%`}
          delta={
            days === 'all'
              ? undefined
              : rateDelta(curT.engagement, prevT.engagement, curT.impressions, prevT.impressions)
          }
          isPercent
        />
      </section>

      {/* Chart mit Range-Param für Drilldown */}
      {chartData.length > 0 ? (
        <section className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
          <MetricsChart data={chartData} rangeParam={range} />
          <p className="mt-3 text-xs text-muted-foreground">
            Zeitraum: {days === 'all' ? 'Gesamt' : `letzte ${days} Tage`}
            {days !== 'all' && ' · Vergleich zur vorherigen Periode'}
            {type !== 'all' && ` · Segment: ${type}`}
          </p>
        </section>
      ) : (
        <section className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
          <div className="text-lg font-semibold mb-1">Noch keine Daten</div>
          <p className="text-sm text-muted-foreground">
            Für das gewählte Segment/Zeitraum liegen noch keine Daten vor.
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

/* ---------- Helpers ---------- */

function isoDay(d: Date) {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

type Pt = { impressions: number; views: number; likes: number; comments: number }
type Agg = { impressions: number; views: number; likes: number; comments: number; engagement: number }

function totals(points: Pt[]): Agg {
  return points.reduce<Agg>(
    (acc, p) => {
      acc.impressions += p.impressions
      acc.views += p.views
      acc.likes += p.likes
      acc.comments += p.comments
      acc.engagement += p.likes + p.comments
      return acc
    },
    { impressions: 0, views: 0, likes: 0, comments: 0, engagement: 0 }
  )
}

// Prozentänderung von Raten: (a/b) vs (c/d) → Δ%
function rateDelta(numCur: number, numPrev: number, denCur: number, denPrev: number) {
  const rPrev = denPrev > 0 ? numPrev / denPrev : 0
  const rCur = denCur > 0 ? numCur / denCur : 0
  if (rPrev === 0) return undefined
  return ((rCur - rPrev) / rPrev) * 100
}

function Kpi({
  title,
  value,
  delta,
  denom,
  isPercent,
}: {
  title: string
  value: string
  delta?: number
  denom?: number
  isPercent?: boolean
}) {
  let deltaPct: number | undefined
  if (typeof delta === 'number' && typeof denom === 'number') {
    deltaPct = denom > 0 ? (delta / denom) * 100 : undefined
  } else if (typeof delta === 'number' && isPercent) {
    deltaPct = delta
  }

  const sign =
    typeof deltaPct === 'number' ? (deltaPct > 0 ? '+' : deltaPct < 0 ? '' : '±') : undefined
  const color =
    typeof deltaPct !== 'number'
      ? 'text-muted-foreground'
      : deltaPct > 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : deltaPct < 0
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-muted-foreground'

  return (
    <div className="rounded-xl border border-border bg-background/60 p-4">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      {typeof deltaPct === 'number' && (
        <div className={`mt-1 text-xs tabular-nums ${color}`}>
          {sign}
          {Math.abs(deltaPct).toFixed(1)}%
          <span className="text-muted-foreground"> vs. vorherige Periode</span>
        </div>
      )}
    </div>
  )
}
