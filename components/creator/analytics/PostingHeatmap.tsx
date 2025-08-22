'use client'

import React, { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type MetricIntensity = 'sessions' | 'impressions' | 'views'
type ScalingIntensity = 'auto' | 'weich' | 'mittel' | 'hart'

type FetchRow = {
  dow: number
  hour: number
  sessions: number
  impressions: number
  views: number
  likes: number
  comments: number
}

type DataRow = { dow: number; hour: number; count: number }

type FetchProps = {
  rangeParam: string
  typeParam?: string
  className?: string
  intensity?: MetricIntensity
}

type DataProps = {
  data: DataRow[]
  className?: string
  intensity?: ScalingIntensity
}

type Props = FetchProps | DataProps

const DOW = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'] as const

export default function PostingHeatmap(props: Props) {
  if ('data' in props) return <PostingHeatmapData {...props} />
  return <PostingHeatmapFetch {...props} />
}

/* ---------------------------- Fetch-Modus ---------------------------- */

function PostingHeatmapFetch({
  rangeParam,
  typeParam = 'all',
  className,
  intensity = 'sessions',
}: FetchProps) {
  const [rows, setRows] = useState<FetchRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams({ range: rangeParam })
    if (typeParam) params.set('type', typeParam)
    setLoading(true)
    fetch(`/api/creator/analytics/heatmap?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setRows(Array.isArray(d) ? d : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [rangeParam, typeParam])

  const grid = useMemo(() => {
    const m: Record<number, Record<number, FetchRow>> = {}
    for (let d = 0; d < 7; d++) {
      m[d] = {}
      for (let h = 0; h < 24; h++) {
        m[d][h] = { dow: d, hour: h, sessions: 0, impressions: 0, views: 0, likes: 0, comments: 0 }
      }
    }
    for (const r of rows) m[r.dow][r.hour] = r
    return m
  }, [rows])

  const max = useMemo(() => {
    let m = 0
    for (let d = 0; d < 7; d++) {
      for (let h = 0; h < 24; h++) {
        const v = grid[d][h][intensity]
        if (v > m) m = v
      }
    }
    return m || 1
  }, [grid, intensity])

  return (
    <div className={cn('rounded-2xl border bg-card/60 p-4', className)}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Posting-Heatmap (UTC)</h3>
        <div className="text-xs text-muted-foreground">
          Intensität: {intensity} · Bereich: {rangeParam.toUpperCase()}
          {typeParam && typeParam !== 'all' ? ` · Segment: ${typeParam}` : ''}
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Lade…</div>
      ) : (
        <div className="grid grid-cols-[auto_repeat(24,minmax(10px,1fr))] gap-1">
          <div />
          {Array.from({ length: 24 }).map((_, h) => (
            <div key={h} className="text-center text-[10px] text-muted-foreground">
              {String(h).padStart(2, '0')}
            </div>
          ))}

          {Array.from({ length: 7 }).map((_, d) => (
            <FragmentRow key={d} label={DOW[d]}>
              {Array.from({ length: 24 }).map((__, h) => {
                const cell = grid[d][h]
                const v = cell[intensity]
                const ratio = v / max
                return (
                  <div
                    key={h}
                    title={`${DOW[d]} ${String(h).padStart(2, '0')}:00 • ${intensity}: ${v.toLocaleString()}\nImpr: ${cell.impressions.toLocaleString()} • Views: ${cell.views.toLocaleString()}`}
                    className="h-5 rounded-sm bg-primary/10 hover:ring-1 hover:ring-primary/40"
                    style={{ opacity: 0.2 + ratio * 0.8 }}
                  />
                )
              })}
            </FragmentRow>
          ))}
        </div>
      )}

      <div className="mt-2 text-[11px] text-muted-foreground">
        Zeiten in UTC. Intensität bezieht sich auf die gewählte Kennzahl.
      </div>
    </div>
  )
}

/* ---------------------------- Data-Modus ---------------------------- */

function PostingHeatmapData({
  data,
  className,
  intensity = 'auto',
}: DataProps) {
  const grid = useMemo(() => {
    const m: Record<number, Record<number, number>> = {}
    for (let d = 0; d < 7; d++) {
      m[d] = {}
      for (let h = 0; h < 24; h++) m[d][h] = 0
    }
    for (const r of data) {
      // KEIN optional chaining links! – Keys sicher belegen
      const d = clamp(r.dow, 0, 6)
      const h = clamp(r.hour, 0, 23)
      m[d][h] = typeof r.count === 'number' && isFinite(r.count) ? r.count : 0
    }
    return m
  }, [data])

  const flat = useMemo(() => {
    const out: number[] = []
    for (let d = 0; d < 7; d++) for (let h = 0; h < 24; h++) out.push(grid[d][h])
    return out
  }, [grid])

  const max = Math.max(1, ...flat)
  const scaledMax = applyScaling(max, intensity)

  return (
    <div className={cn('rounded-2xl border bg-card/60 p-4', className)}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Posting-Heatmap (UTC)</h3>
        <div className="text-xs text-muted-foreground">Intensität: {intensity}</div>
      </div>

      <div className="grid grid-cols-[auto_repeat(24,minmax(10px,1fr))] gap-1">
        <div />
        {Array.from({ length: 24 }).map((_, h) => (
          <div key={h} className="text-center text-[10px] text-muted-foreground">
            {String(h).padStart(2, '0')}
          </div>
        ))}

        {Array.from({ length: 7 }).map((_, d) => (
          <FragmentRow key={d} label={DOW[d]}>
            {Array.from({ length: 24 }).map((__, h) => {
              const v = grid[d][h]
              return (
                <div
                  key={h}
                  title={`${DOW[d]} ${String(h).padStart(2, '0')}:00 • ${v.toLocaleString()}`}
                  className="h-5 rounded-[4px] border"
                  style={{
                    backgroundColor: heatColor(v, scaledMax),
                    borderColor: 'color-mix(in oklab, currentColor 12%, transparent)',
                  }}
                />
              )
            })}
          </FragmentRow>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">niedrig</span>
          <div className="h-3 w-40 overflow-hidden rounded-full border">
            <div className="grid h-full" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} style={{ backgroundColor: heatColor(i, 9) }} />
              ))}
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground">hoch</span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          Max: {max} · Intensitäts-Skalierung: {scaledMax}
        </span>
      </div>

      <div className="mt-1 text-[11px] text-muted-foreground">
        Zeiten in UTC. Intensität steuert nur die visuelle Skalierung.
      </div>
    </div>
  )
}

/* --------------------------------- Helpers --------------------------------- */

function FragmentRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <div className="pr-2 text-right text-[10px] leading-5 text-muted-foreground">{label}</div>
      {children}
    </>
  )
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.trunc(n)))
}

function applyScaling(max: number, mode: ScalingIntensity) {
  const factor = mode === 'weich' ? 1.4 : mode === 'mittel' ? 1.0 : mode === 'hart' ? 0.7 : 1.0
  return Math.max(1, Math.round(max * factor))
}

function heatColor(value: number, max: number) {
  const ratio = Math.max(0, Math.min(1, value / max))
  const l = 0.98 - ratio * 0.50
  const c = 0.03 + ratio * 0.10
  const h = 250
  return `oklch(${(l * 100).toFixed(1)}% ${c.toFixed(3)} ${h})`
}
