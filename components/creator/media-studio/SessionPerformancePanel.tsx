// components/creator/media-studio/SessionPerformancePanel.tsx
'use client'

import * as React from 'react'
import { Eye, BarChart3, TrendingUp, TrendingDown, Clock, Percent } from 'lucide-react'
import { cn as _cn } from '@/lib/utils'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

type Point = { date: string | number | Date; impressions: number; views: number }

type Props = {
  /** Aktuelle Zahlen (obligatorisch) */
  impressions: number
  views: number

  /** Optional: Vorperiode für Deltas (z. B. letzte Woche/Monat) */
  prevImpressions?: number | null
  prevViews?: number | null

  /** Optional: Zeitreihe für Minichart (chronologisch) */
  timeseries?: Point[]

  /** Optional: Gesamt-Watchtime (Sekunden) oder Durchschnitt pro View */
  watchTimeSecTotal?: number
  avgWatchSec?: number

  /** Optional: Abschlussrate 0..1 (z. B. Video bis Ende gesehen) */
  completionRate?: number

  className?: string
}

/** Schönes Nummernformat */
function fmt(n: number | undefined | null) {
  if (!Number.isFinite(Number(n))) return '—'
  return new Intl.NumberFormat('de-DE').format(Number(n))
}
function pct(x: number) {
  if (!Number.isFinite(x)) return '—'
  return `${(x * 100).toFixed(1)}%`
}
function hhmmss(totalSec = 0) {
  if (!Number.isFinite(totalSec) || totalSec <= 0) return '—'
  const s = Math.round(totalSec)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}` : `${m}:${String(ss).padStart(2, '0')}`
}

function delta(cur?: number | null, prev?: number | null) {
  if (!Number.isFinite(cur!) || !Number.isFinite(prev!) || !prev) return null
  const d = (cur! - prev!) / prev!
  return Number.isFinite(d) ? d : null
}

/** Minichart als Inline-SVG (lines for impressions + views) */
function SparkMini({ data }: { data: Point[] }) {
  const w = 220
  const h = 56
  const p = 6

  const xs = data.map((_, i) => i)
  const maxX = Math.max(...xs, 1)
  const imp = data.map(d => Math.max(0, d.impressions || 0))
  const view = data.map(d => Math.max(0, d.views || 0))
  const maxY = Math.max(Math.max(...imp, 1), Math.max(...view, 1))

  const sx = (i: number) => p + (i / maxX) * (w - p * 2)
  const sy = (v: number) => h - p - (v / maxY) * (h - p * 2)

  const path = (arr: number[]) =>
    arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${sx(i)} ${sy(v)}`).join(' ')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <rect x="0" y="0" width={w} height={h} rx="8" className="fill-muted/50" />
      {/* Impressions (dunkler) */}
      <path d={path(imp)} className="stroke-foreground/70" strokeWidth={1.5} fill="none" />
      {/* Views (heller) */}
      <path d={path(view)} className="stroke-foreground/40" strokeWidth={1.5} fill="none" />
      {/* Punkte */}
      {imp.map((v, i) => (
        <circle key={`i-${i}`} cx={sx(i)} cy={sy(v)} r={1.6} className="fill-foreground/70" />
      ))}
      {view.map((v, i) => (
        <circle key={`v-${i}`} cx={sx(i)} cy={sy(v)} r={1.6} className="fill-foreground/40" />
      ))}
    </svg>
  )
}

export default function SessionPerformancePanel({
  impressions,
  views,
  prevImpressions = null,
  prevViews = null,
  timeseries = [],
  watchTimeSecTotal,
  avgWatchSec,
  completionRate,
  className,
}: Props) {
  const ctr = impressions > 0 ? views / impressions : 0
  const dImp = delta(impressions, prevImpressions)
  const dView = delta(views, prevViews)
  const dCtr = delta(ctr, prevImpressions && prevImpressions > 0 ? (prevViews ?? 0) / prevImpressions : null)

  const avgWatch = Number.isFinite(avgWatchSec!)
    ? avgWatchSec!
    : views > 0 && Number.isFinite(watchTimeSecTotal!)
      ? (watchTimeSecTotal! / views)
      : undefined

  const completed = Number.isFinite(completionRate!) ? completionRate! : undefined

  return (
    <div className={cn('rounded-xl border bg-background/60 p-4', className)}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">📊 Performance</h3>
        {timeseries.length > 1 && (
          <div className="text-[11px] text-muted-foreground">Impressions & Views (letzte n)</div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi
          icon={<Eye className="h-4 w-4" />}
          label="Impressions"
          value={fmt(impressions)}
          delta={dImp}
        />
        <Kpi
          icon={<BarChart3 className="h-4 w-4" />}
          label="Views"
          value={fmt(views)}
          delta={dView}
        />
        <Kpi
          icon={<Percent className="h-4 w-4" />}
          label="CTR"
          value={pct(ctr)}
          delta={dCtr}
        />
        <Kpi
          icon={<Clock className="h-4 w-4" />}
          label="Ø Watchtime"
          value={avgWatch !== undefined ? hhmmss(avgWatch) : '—'}
        />
      </div>

      {/* Chart + Completion */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="col-span-2 rounded-lg border bg-background p-3">
          {timeseries.length > 1 ? (
            <SparkMini data={timeseries} />
          ) : (
            <div className="grid h-[56px] place-items-center text-xs text-muted-foreground">
              Keine Zeitreihe vorhanden
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-background p-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium">Abschlussrate</span>
            <span className="text-muted-foreground">
              {completed !== undefined ? pct(completed) : '—'}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded bg-muted">
            <div
              className="h-full bg-foreground transition-all"
              style={{ width: `${Math.max(0, Math.min(100, (completed ?? 0) * 100))}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Anteil der Zuschauer*innen, die bis zum Ende geschaut haben.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ---------- kleine KPI-Karte mit Delta ---------- */
function Kpi({
  icon,
  label,
  value,
  delta, // kann number | null | undefined sein
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  delta?: number | null
}) {
  // ✅ auf sicheren Wert mappen (nur number bleibt übrig)
  const d = typeof delta === 'number' ? delta : null
  const pos = d !== null && d > 0
  const neg = d !== null && d < 0

  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="grid h-6 w-6 place-items-center rounded-md border bg-muted">{icon}</span>
        <span className="font-medium">{label}</span>

        {d !== null && (
          <span
            className={cn(
              'ml-auto inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px]',
              pos && 'bg-emerald-100 text-emerald-700',
              neg && 'bg-red-100 text-red-700',
              !pos && !neg && 'bg-muted text-muted-foreground'
            )}
            title="Veränderung zur Vorperiode"
          >
            {pos ? <TrendingUp className="h-3 w-3" /> : neg ? <TrendingDown className="h-3 w-3" /> : null}
            {pos || neg ? `${(d * 100).toFixed(1)}%` : '±0%'}
          </span>
        )}
      </div>

      <div className="mt-2 text-xl font-semibold leading-none">{value}</div>
    </div>
  )
}
