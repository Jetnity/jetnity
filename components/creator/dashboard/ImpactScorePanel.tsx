// components/creator/dashboard/ImpactScorePanel.tsx
// Server Component (keine Hooks, kein 'use client')

import Link from 'next/link'
import { createServerComponentClient } from '@/lib/supabase/server'
import ImpactScore from '@/components/creator/dashboard/ImpactScore'
import ImpactScoreRealtimeBridge from '@/components/creator/dashboard/ImpactScoreRealtimeBridge'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/supabase'
import { fetchPlatformAvgImpactScore } from '@/lib/supabase/rpc/platformAvg'

type Metric = Tables<'creator_session_metrics'>

export const dynamic = 'force-dynamic' // user-spezifisch; keine Caches

const MAX_ROWS = 1000
const HISTORY_DAYS = 30

export default async function ImpactScorePanel({
  days = 90 as number | 'all',
}: {
  /** 30 | 90 | 180 | 'all' */
  days?: number | 'all'
}) {
  const supabase = createServerComponentClient()

  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) {
    return (
      <CardShell title="Anmeldung erforderlich" ctaHref="/auth/sign-in" cta="Jetzt anmelden">
        <p className="text-sm text-muted-foreground">
          Bitte melde dich an, um deine Impact-Zahlen zu sehen.
        </p>
      </CardShell>
    )
  }

  // Zeitraum
  const now = new Date()
  const since =
    typeof days === 'number'
      ? new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      : undefined
  const sinceIso = since?.toISOString()
  const effectiveDaysForPlatform = typeof days === 'number' ? days : 3650

  // Daten parallel laden
  const [metricsRes, platformAvg] = await Promise.all([
    (async () => {
      let q = supabase
        .from('creator_session_metrics')
        .select('*')
        .eq('user_id', user.id)

      if (sinceIso) q = q.gte('created_at', sinceIso)

      const { data, error } = await q
        .order('created_at', { ascending: false })
        .limit(MAX_ROWS)

      return { rows: (data ?? []) as Metric[], error }
    })(),
    (async () => clamp(await fetchPlatformAvgImpactScore(supabase, effectiveDaysForPlatform)))(),
  ])

  const metrics = metricsRes.rows

  if (metricsRes.error || metrics.length === 0) {
    return (
      <CardShell
        title={metricsRes.error ? 'Fehler beim Laden' : 'Noch keine Performance-Daten'}
        ctaHref={metricsRes.error ? '/creator/dashboard?retry=1' : '/creator/media-studio'}
        cta={metricsRes.error ? 'Erneut versuchen' : 'Jetzt Session starten'}
      >
        <p className="text-sm text-muted-foreground">
          {metricsRes.error
            ? 'Deine Impact-Daten konnten nicht geladen werden.'
            : 'Starte deine erste Session, um Impact-Scores zu sehen.'}
        </p>
        <ImpactScoreRealtimeBridge userId={user.id} />
      </CardShell>
    )
  }

  // Aggregation + Score + Tages-History
  const totals = aggregate(metrics)
  const score = calcOverallScore(metrics)
  const history = buildHistorySeries(metrics, HISTORY_DAYS)

  return (
    <section className="rounded-2xl border border-border bg-card/60 p-5 shadow-sm backdrop-blur">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="text-lg font-semibold">Dein Impact</h3>
          <p className="text-sm text-muted-foreground">
            Überblick über deine Performance (aggregiert)
            {typeof days === 'number' ? ` · Zeitraum: letzte ${days} Tage` : ' · Zeitraum: Gesamt'}.
          </p>
        </div>
        <Link
          href="/creator/media-studio"
          className={cn(
            'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm',
            'border border-primary/30 bg-primary/10 text-primary font-medium hover:bg-primary/15 transition'
          )}
        >
          Media-Studio öffnen
        </Link>
      </header>

      <ImpactScore
        value={score}
        avgScore={platformAvg}
        label="Impact Score (gesamt)"
        benchmarkLabel={`Plattform-Schnitt${typeof days === 'number' ? ` (${days}T)` : ''}`}
        history={history}
        mode="linear"
        size="md"
      />

      {/* KPI Micro-Grid */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard title="Sessions" value={totals.sessions.toString()} />
        <KpiCard title="Impressions" value={totals.impressions.toLocaleString()} />
        <KpiCard title="Views" value={totals.views.toLocaleString()} />
        <KpiCard
          title="Engagement"
          value={(totals.likes + totals.comments).toLocaleString()}
          sub={`Likes ${totals.likes.toLocaleString()} · Kommentare ${totals.comments.toLocaleString()}`}
        />
      </div>

      {/* Raten */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-sm">
        <KpiPill title="View-Rate" value={`${(totals.viewRate * 100).toFixed(1)}%`} />
        <KpiPill title="Engagement-Rate" value={`${(totals.engagementRate * 100).toFixed(1)}%`} />
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        Basis: {metrics.length} Session{metrics.length === 1 ? '' : 's'} · gewichtete
        Score-Berechnung nach Impressions (Fallback: View- &amp; Engagement-Rate). Sparkline zeigt {HISTORY_DAYS}
        -Tage-Trend (täglich gewichtet).
      </div>

      <ImpactScoreRealtimeBridge userId={user.id} />
    </section>
  )
}

/* ───────────── Helpers ───────────── */

function clamp(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, n))
}

function aggregate(rows: Metric[]) {
  const base = rows.reduce(
    (acc, r) => {
      acc.sessions += 1
      acc.impressions += r.impressions ?? 0
      acc.views += r.views ?? 0
      acc.likes += r.likes ?? 0
      acc.comments += r.comments ?? 0
      return acc
    },
    { sessions: 0, impressions: 0, views: 0, likes: 0, comments: 0 }
  )
  const imp = Math.max(1, base.impressions)
  const viewRate = base.views / imp // 0..1
  const engagementRate = (base.likes + base.comments) / imp // 0..1
  return { ...base, viewRate, engagementRate }
}

function calcOverallScore(rows: Metric[]): number {
  if (!rows.length) return 0
  const hasAnyScore = rows.some(r => Number(r.impact_score ?? 0) > 0)

  if (hasAnyScore) {
    const weightedSum = rows.reduce((sum, r) => {
      const s = Number(r.impact_score ?? 0)
      const w = Math.max(1, r.impressions ?? 0)
      return sum + s * w
    }, 0)
    const weight = rows.reduce((w, r) => w + Math.max(1, r.impressions ?? 0), 0)
    return clamp(weightedSum / Math.max(1, weight))
  }

  const t = aggregate(rows)
  return clamp((t.viewRate * 0.6 + t.engagementRate * 0.4) * 100)
}

/** Liefert tägliche Scores (neueste am Ende) für die Sparkline */
function buildHistorySeries(rows: Metric[], days: number): number[] {
  if (!rows.length) return []
  const byDay = new Map<string, { sum: number; w: number; views: number; likesComments: number; imp: number }>()

  for (const r of rows) {
    const d = isoDay(r.created_at)
    const imp = Math.max(1, r.impressions ?? 0)
    const s = Number(r.impact_score ?? 0)
    const entry = byDay.get(d) ?? { sum: 0, w: 0, views: 0, likesComments: 0, imp: 0 }

    if (s > 0) {
      entry.sum += s * imp
      entry.w += imp
    } else {
      entry.views += r.views ?? 0
      entry.likesComments += (r.likes ?? 0) + (r.comments ?? 0)
      entry.imp += imp
    }
    byDay.set(d, entry)
  }

  const out: number[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const dayIso = isoDay(new Date(today.getTime() - i * 86400000).toISOString())
    const e = byDay.get(dayIso)
    if (!e) { out.push(0); continue }
    if (e.w > 0) {
      out.push(clamp(e.sum / Math.max(1, e.w)))
    } else {
      const viewRate = e.views / Math.max(1, e.imp)
      const engagementRate = e.likesComments / Math.max(1, e.imp)
      out.push(clamp((viewRate * 0.6 + engagementRate * 0.4) * 100))
    }
  }
  return out
}

function isoDay(iso?: string | null) {
  const d = iso ? new Date(iso) : new Date()
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const dd = `${d.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${dd}`
}

/* ───────────── Präsentation ───────────── */

function CardShell({
  title,
  children,
  ctaHref,
  cta,
}: {
  title: string
  children: React.ReactNode
  ctaHref: string
  cta: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 shadow-sm backdrop-blur">
      <div className="mb-2 text-lg font-semibold">{title}</div>
      {children}
      <Link
        href={ctaHref}
        className={cn(
          'mt-4 inline-flex items-center justify-center rounded-lg px-4 py-2',
          'border border-primary/30 bg-primary/10 text-primary font-medium hover:bg-primary/15 transition'
        )}
      >
        {cta}
      </Link>
    </div>
  )
}

function KpiCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-4">
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  )
}

function KpiPill({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{title}</div>
      <div className="text-base font-semibold tabular-nums">{value}</div>
    </div>
  )
}
