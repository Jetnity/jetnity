// components/creator/dashboard/ImpactScorePanel.tsx
// Server Component (keine Hooks, kein 'use client')
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@/lib/supabase/server'
import ImpactScore from '@/components/creator/dashboard/ImpactScore'
import ImpactScoreRealtimeBridge from '@/components/creator/dashboard/ImpactScoreRealtimeBridge'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/supabase'

type Metric = Tables<'creator_session_metrics'>

function clamp(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, n))
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

  // Fallback aus Raten
  const score = (totals.viewRate * 0.6 + totals.engagementRate * 0.4) * 100
  return clamp(score)
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

export default async function ImpactScorePanel() {
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

  const { data, error } = await supabase
    .from('creator_session_metrics')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(300)

  const metrics = (data ?? []) as Metric[]

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

  const totals = aggregate(metrics)
  const score = calcOverallScore(metrics)

  return (
    <section className="rounded-2xl border border-border bg-card/60 p-5 shadow-sm backdrop-blur">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="text-lg font-semibold">Dein Impact</h3>
          <p className="text-sm text-muted-foreground">
            Überblick über deine Performance (aggregiert).
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

      {/* Score */}
      <ImpactScore value={score} label="Impact Score (gesamt)" />

      {/* KPI Micro-Grid */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <div className="text-xs text-muted-foreground">Sessions</div>
          <div className="text-2xl font-semibold tabular-nums">{totals.sessions}</div>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <div className="text-xs text-muted-foreground">Impressions</div>
          <div className="text-2xl font-semibold tabular-nums">
            {totals.impressions.toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <div className="text-xs text-muted-foreground">Views</div>
          <div className="text-2xl font-semibold tabular-nums">
            {totals.views.toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-background/60 p-4">
          <div className="text-xs text-muted-foreground">Engagement</div>
          <div className="text-2xl font-semibold tabular-nums">
            {(totals.likes + totals.comments).toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Likes {totals.likes.toLocaleString()} · Kommentare {totals.comments.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Raten */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-sm">
        <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
          <div className="text-[11px] text-muted-foreground">View-Rate</div>
          <div className="text-base font-semibold tabular-nums">
            {(totals.viewRate * 100).toFixed(1)}%
          </div>
        </div>
        <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
          <div className="text-[11px] text-muted-foreground">Engagement-Rate</div>
          <div className="text-base font-semibold tabular-nums">
            {(totals.engagementRate * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        Basis: {metrics.length} Session{metrics.length === 1 ? '' : 's'} · gewichtete
        Score-Berechnung nach Impressions (Fallback: View- &amp; Engagement-Rate).
      </div>

      <ImpactScoreRealtimeBridge userId={user.id} />
    </section>
  )
}
