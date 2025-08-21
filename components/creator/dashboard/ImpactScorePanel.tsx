// Server Component (keine Hooks, kein 'use client')
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@/lib/supabase/server'
import ImpactScore from '@/components/creator/dashboard/ImpactScore'
import ImpactScoreRealtimeBridge from '@/components/creator/dashboard/ImpactScoreRealtimeBridge'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/supabase'
import { fetchPlatformAvgImpactScore } from '@/lib/supabase/rpc/platformAvg'

type Metric = Tables<'creator_session_metrics'>

export default async function ImpactScorePanel({
  days = 90 as number | 'all',
}: {
  /** 30 | 90 | 180 | 'all' */
  days?: number | 'all'
}) {
  const supabase = createServerComponentClient()

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser()

  if (userErr || !user) {
    return (
      <div className="rounded-2xl border border-border bg-card/60 p-5 shadow-sm backdrop-blur">
        <div className="mb-2 text-lg font-semibold">Anmeldung erforderlich</div>
        <p className="text-sm text-muted-foreground">
          Bitte melde dich an, um deine Impact-Zahlen zu sehen.
        </p>
        <Link
          href="/auth/sign-in"
          className={cn(
            'mt-4 inline-flex items-center justify-center rounded-lg px-4 py-2',
            'border border-primary/30 bg-primary/10 text-primary font-medium hover:bg-primary/15 transition'
          )}
        >
          Jetzt anmelden
        </Link>
      </div>
    )
  }

  // Zeitfenster vorbereiten
  const now = Date.now()
  const sinceIso =
    typeof days === 'number'
      ? new Date(now - days * 24 * 60 * 60 * 1000).toISOString()
      : null
  const effectiveDaysForPlatform = typeof days === 'number' ? days : 3650 // "Gesamt"

  // Eigene Metriken laden (optional nach Zeitfenster gefiltert)
  let query = supabase
    .from('creator_session_metrics')
    .select('*')
    .eq('user_id', user.id)

  if (sinceIso) query = query.gte('created_at', sinceIso)

  const { data: rows, error } = await query
    .order('created_at', { ascending: false })
    .limit(300)

  const metrics = (rows ?? []) as Metric[]

  if (error || metrics.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card/60 p-5 shadow-sm backdrop-blur">
        <div className="mb-2 text-lg font-semibold">
          {error ? 'Fehler beim Laden' : 'Noch keine Performance-Daten'}
        </div>
        <p className="text-sm text-muted-foreground">
          {error
            ? 'Deine Impact-Daten konnten nicht geladen werden.'
            : 'Starte deine erste Session, um Impact-Scores zu sehen.'}
        </p>
        <Link
          href="/creator/media-studio"
          className={cn(
            'mt-4 inline-flex items-center justify-center rounded-lg px-4 py-2',
            'border border-primary/30 bg-primary/10 text-primary font-medium hover:bg-primary/15 transition'
          )}
        >
          {error ? 'Erneut versuchen' : 'Jetzt Session starten'}
        </Link>
        <ImpactScoreRealtimeBridge userId={user.id} />
      </div>
    )
  }

  // Aggregation + Score
  const totals = aggregate(metrics)
  const score = calcOverallScore(metrics)

  // Plattform-Ø abrufen (SECURITY DEFINER RPC)
  const avgScorePlatform = clamp(
    await fetchPlatformAvgImpactScore(supabase, effectiveDaysForPlatform)
  )

  return (
    <section className="rounded-2xl border border-border bg-card/60 p-5 shadow-sm backdrop-blur">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="text-lg font-semibold">Dein Impact</h3>
          <p className="text-sm text-muted-foreground">
            Überblick über deine Performance (aggregiert)
            {typeof days === 'number' ? ` · Zeitraum: letzte ${days} Tage` : ' · Zeitraum: Gesamt'}
            .
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

      {/* Score inkl. Plattform-Avg (Delta-Badge kommt aus ImpactScore.tsx) */}
      <ImpactScore value={score} avgScore={avgScorePlatform} label="Impact Score (gesamt)" />

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
        Score-Berechnung nach Impressions (Fallback: View- &amp; Engagement-Rate).
      </div>

      <ImpactScoreRealtimeBridge userId={user.id} />
    </section>
  )
}

/* ---------- Helpers ---------- */

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
  const totals = aggregate(rows)

  if (hasAnyScore) {
    const weightedSum = rows.reduce((sum, r) => {
      const s = Number(r.impact_score ?? 0)
      const w = Math.max(1, r.impressions ?? 0)
      return sum + s * w
    }, 0)
    const weight = rows.reduce((w, r) => w + Math.max(1, r.impressions ?? 0), 0)
    return clamp(weightedSum / Math.max(1, weight))
  }

  const score = (totals.viewRate * 0.6 + totals.engagementRate * 0.4) * 100
  return clamp(score)
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
