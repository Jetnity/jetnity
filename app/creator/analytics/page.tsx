// app/creator/analytics/page.tsx
// Server Component (RSC)
import * as React from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerComponentClient } from '@/lib/supabase/server'
import TimeframeTabs from '@/components/creator/dashboard/TimeframeTabs'
import SegmentFilter from '@/components/creator/analytics/SegmentFilter'
import MetricsChart, { type MetricsChartPoint } from '@/components/creator/analytics/MetricsChart'
import { fetchCreatorMetricsTimeseries } from '@/lib/supabase/rpc/creatorMetricsTimeseries'
import { fetchCreatorPostingHeatmap } from '@/lib/supabase/rpc/creatorPostingHeatmap'
import { fetchCreatorImpactPercentile } from '@/lib/supabase/rpc/creatorImpactPercentile'
import PostingHeatmap from '@/components/creator/analytics/PostingHeatmap'
import TopContentTable, { type TopItem } from '@/components/creator/analytics/TopContentTable'
import AutoInsights from '@/components/creator/analytics/AutoInsights'
import AlertsPanel from '@/components/creator/analytics/AlertsPanel'
import { computeInsights, type TimeseriesPoint } from '@/lib/analytics/insights'
import type { Database } from '@/types/supabase'

type ContentTypeEnum = Database['public']['Enums']['creator_content_type']
const CT_VALUES = ['video', 'image', 'guide', 'blog', 'story', 'other'] as const
function isContentType(x: string): x is ContentTypeEnum {
  return (CT_VALUES as readonly string[]).includes(x)
}

// Rein visuelle Heatmap-Intensität (UI-Parameter)
type Intensity = 'auto' | 'weich' | 'mittel' | 'hart'
const INTENSITY_VALUES: Intensity[] = ['auto', 'weich', 'mittel', 'hart']

function Kpi({
  title, value, delta, denom, isPercent,
}: { title: string; value: string; delta?: number; denom?: number; isPercent?: boolean }) {
  let deltaPct: number | undefined
  if (typeof delta === 'number' && typeof denom === 'number') deltaPct = denom > 0 ? (delta / denom) * 100 : undefined
  else if (typeof delta === 'number' && isPercent) deltaPct = delta
  const sign = typeof deltaPct === 'number' ? (deltaPct > 0 ? '+' : deltaPct < 0 ? '' : '±') : undefined
  const color = typeof deltaPct !== 'number'
    ? 'text-muted-foreground'
    : deltaPct > 0 ? 'text-emerald-600 dark:text-emerald-400'
    : deltaPct < 0 ? 'text-rose-600 dark:text-rose-400'
    : 'text-muted-foreground'
  return (
    <div className="rounded-xl border border-border bg-background/60 p-4">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      {typeof deltaPct === 'number' && (
        <div className={`mt-1 text-xs tabular-nums ${color}`}>
          {sign}{Math.abs(deltaPct).toFixed(1)}%<span className="text-muted-foreground"> vs. vorherige Periode</span>
        </div>
      )}
    </div>
  )
}

/**
 * Adapter-Komponente: nutzt die bestehende PostingHeatmap,
 * ohne deren strikte Prop-Typen anzutasten.
 * - akzeptiert rows (deine Heatmap-Daten)
 * - optional intensity (wird durchgereicht, falls vorhanden)
 */
function HeatmapAdapter({
  rows,
  intensity,
  className,
}: {
  rows: any[]
  intensity?: Intensity
  className?: string
}) {
  const Comp = PostingHeatmap as unknown as React.ComponentType<any>
  return <Comp data={rows} intensity={intensity} className={className} />
}

export default async function AnalyticsPage({
  searchParams,
}: { searchParams?: { range?: string; type?: string; intensity?: string } }) {
  const supabase = createServerComponentClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // --- Zeitraum (bestehende Logik beibehalten) ---
  const range = (searchParams?.range ?? '90').toLowerCase()
  const days: number | 'all' =
    range === 'all' ? 'all'
      : [30, 90, 180].includes(Number(range)) ? (Number(range) as 30|90|180)
      : 90

  // --- Segment (bestehende Logik beibehalten) ---
  const rawType = (searchParams?.type ?? 'all').toLowerCase()
  const allowed = new Set(['all','video','image','guide','blog','story','other'])
  const type = allowed.has(rawType) ? rawType : 'all'
  const contentType: string | null = type === 'all' ? null : type

  // --- Heatmap-Intensität (UI) ---
  const rawIntensity = (searchParams?.intensity ?? 'auto').toLowerCase()
  const intensity: Intensity = INTENSITY_VALUES.includes(rawIntensity as Intensity)
    ? (rawIntensity as Intensity)
    : 'auto'

  // --- Datenbeschaffung über Wrapper (unverändert) ---
  const effectiveDays = days === 'all' ? 3650 : days
  const all = await fetchCreatorMetricsTimeseries(
    supabase, days === 'all' ? effectiveDays : effectiveDays * 2, contentType
  )

  const boundaryIso = isoDay(new Date(Date.now() - effectiveDays * 24 * 60 * 60 * 1000))
  const current = days === 'all' ? all : all.filter((p) => p.d >= boundaryIso)
  const previous = days === 'all' ? [] : all.filter((p) => p.d < boundaryIso)

  const curT = totals(current)
  const prevT = totals(previous)

  const chartData: MetricsChartPoint[] = current.map((p) => ({
    date: p.d, impressions: p.impressions, views: p.views,
    engagement: p.likes + p.comments, likes: p.likes, comments: p.comments,
  }))

  const imp = Math.max(1, curT.impressions)
  const viewRate = curT.views / imp
  const engagementRate = curT.engagement / imp

  // Heatmap (UTC-Daten aus RPC)
  const heatmap = await fetchCreatorPostingHeatmap(supabase, effectiveDays, contentType)

  // Percentile (Benchmark)
  const percentile = await fetchCreatorImpactPercentile(supabase, days === 'all' ? 3650 : days)
  const topBadge = percentile.pct != null ? percentileToBadge(percentile.pct) : { label: '—', tone: 'muted' as const }

  // Top Content
  let q = supabase
    .from('creator_session_metrics')
    .select('session_id,title,created_at,impact_score,impressions,views,likes,comments,content_type')
    .eq('user_id', user.id)
    .order('impact_score', { ascending: false }).limit(100)

  if (days !== 'all') q = q.gte('created_at', new Date(Date.now() - Number(days)*24*60*60*1000).toISOString())
  if (contentType && isContentType(contentType)) q = q.eq('content_type', contentType as ContentTypeEnum)
  const { data: topRows } = await q
  const topItems: TopItem[] = (Array.isArray(topRows) ? topRows : []) as any

  // Auto-Insights
  const insights = computeInsights(current as unknown as TimeseriesPoint[], heatmap, topItems, days)

  const csvHrefSessions = `/api/creator/analytics/export?range=${encodeURIComponent(range)}&type=${encodeURIComponent(type)}`
  const csvHrefTimeseries = `/api/creator/analytics/timeseries?range=${encodeURIComponent(range)}&type=${encodeURIComponent(type)}`

  return (
    <main className="mx-auto w-full max-w-7xl px-4 md:px-8 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Performance über Zeit {type !== 'all' ? `· Segment: ${type}` : ''} · Heatmap in <strong>UTC</strong>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium ${
              topBadge.tone === 'gold'
                ? 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300'
                : topBadge.tone === 'green'
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                : 'bg-muted text-muted-foreground'
            }`}
            title={
              percentile.pct != null && percentile.avg_impact != null
                ? `Ø Impact: ${percentile.avg_impact.toFixed(1)} · Rang: ${(percentile.pct*100).toFixed(0)}%`
                : 'Keine Benchmark verfügbar'
            }
          >
            {topBadge.label}
          </span>
          <SegmentFilter />
          <TimeframeTabs />
          <a href={csvHrefTimeseries} className="inline-flex h-10 items-center justify-center rounded-lg border border-input px-4 text-sm hover:bg-accent">
            Timeseries CSV
          </a>
          <a href={csvHrefSessions} className="inline-flex h-10 items-center justify-center rounded-lg border border-input px-4 text-sm hover:bg-accent">
            Rohdaten CSV
          </a>
          <Link href="/creator/creator-dashboard" className="inline-flex h-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 px-4 text-sm font-medium text-primary hover:bg-primary/15">
            Zurück zum Dashboard
          </Link>
        </div>
      </header>

      {/* Zusatz-Control: Heatmap-Intensität (GET, behält range/type) */}
      <section className="mb-4">
        <form method="GET" className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="range" value={range} />
          <input type="hidden" name="type" value={type} />
          <label className="text-xs text-muted-foreground" htmlFor="intensity">Heatmap-Intensität</label>
          <select
            id="intensity"
            name="intensity"
            defaultValue={intensity}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="auto">Auto</option>
            <option value="weich">Weich</option>
            <option value="mittel">Mittel</option>
            <option value="hart">Hart</option>
          </select>
          <button type="submit" className="h-10 rounded-md border border-input px-3 text-sm hover:bg-accent">
            Anwenden
          </button>
        </form>
      </section>

      {/* KPIs */}
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi title="Impressions" value={curT.impressions.toLocaleString()} delta={days==='all'?undefined:curT.impressions-prevT.impressions} denom={prevT.impressions}/>
        <Kpi title="Views" value={curT.views.toLocaleString()} delta={days==='all'?undefined:curT.views-prevT.views} denom={prevT.views}/>
        <Kpi title="View-Rate" value={`${(viewRate*100).toFixed(1)}%`} delta={days==='all'?undefined:rateDelta(curT.views,prevT.views,curT.impressions,prevT.impressions)} isPercent/>
        <Kpi title="Engagement-Rate" value={`${(engagementRate*100).toFixed(1)}%`} delta={days==='all'?undefined:rateDelta(curT.engagement,prevT.engagement,curT.impressions,prevT.impressions)} isPercent/>
      </section>

      {/* Alerts & Auto-Insights */}
      <AlertsPanel className="mb-6" />
      <AutoInsights insights={insights} className="mb-6" />

      {/* Chart */}
      {chartData.length > 0 && (
        <section className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur mb-6">
          <MetricsChart data={chartData} rangeParam={range}/>
          <p className="mt-3 text-xs text-muted-foreground">
            Zeitraum: {days==='all'?'Gesamt':`letzte ${days} Tage`}
            {days!=='all' && ' · Vergleich zur vorherigen Periode'}
            {type!=='all' && ` · Segment: ${type}`}
          </p>
        </section>
      )}

      {/* Heatmap & Top Content */}
      {heatmap.length > 0 && (
        // Hinweis: Stunden sind UTC; Intensität ist rein visuell.
        <HeatmapAdapter rows={heatmap as any[]} intensity={intensity} className="mb-6" />
      )}
      {topItems.length > 0 && <TopContentTable items={topItems} />}
    </main>
  )
}

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
function rateDelta(numCur: number, numPrev: number, denCur: number, denPrev: number) {
  const rPrev = denPrev > 0 ? numPrev / denPrev : 0
  const rCur = denCur > 0 ? numCur / denCur : 0
  if (rPrev === 0) return undefined
  return ((rCur - rPrev) / rPrev) * 100
}
function percentileToBadge(pct: number) {
  const perc = Math.round(pct * 100)
  if (perc >= 90) return { label: 'Top 10% Creator', tone: 'gold' as const }
  if (perc >= 70) return { label: 'Top 30% Creator', tone: 'green' as const }
  return { label: `Rang: ${perc}%`, tone: 'muted' as const }
}
