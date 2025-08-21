'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

type Cell = {
  dow: number
  hour: number
  sessions: number
  impressions: number
  views: number
  likes: number
  comments: number
}

type MetricKey = 'sessions' | 'impressions' | 'views' | 'engagement'

const DOW_LABELS_UTC = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
// Montag zuerst anzeigen
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0]

export default function PostingHeatmap({
  data,
  className,
}: {
  data: Cell[]
  className?: string
}) {
  const [metric, setMetric] = React.useState<MetricKey>('engagement')

  // Map für schnelles Lookup
  const map = React.useMemo(() => {
    const m = new Map<string, Cell>()
    for (const c of data) m.set(`${c.dow}-${c.hour}`, c)
    return m
  }, [data])

  const values: number[] = []
  for (const dow of DOW_ORDER) {
    for (let hour = 0; hour < 24; hour++) {
      const cell = map.get(`${dow}-${hour}`)
      const v =
        metric === 'sessions'
          ? cell?.sessions ?? 0
          : metric === 'impressions'
          ? cell?.impressions ?? 0
          : metric === 'views'
          ? cell?.views ?? 0
          : (cell?.likes ?? 0) + (cell?.comments ?? 0)
      values.push(v)
    }
  }
  const max = Math.max(1, ...values)

  const color = (v: number) => {
    // 0..1 -> HSL Grün
    const t = Math.min(1, v / max)
    const alpha = 0.15 + 0.85 * t
    // neutrale Basisfarbe (Tailwind primary-ähnlich)
    return `rgba(34,197,94,${alpha})` // green-500 mit Alpha
  }

  return (
    <section className={cn('rounded-2xl border border-border bg-card/60 p-4', className)}>
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Beste Zeiten (UTC)</h3>
          <p className="text-xs text-muted-foreground">
            Heatmap deiner Sessions / Performance nach Wochentag & Stunde.
          </p>
        </div>
        <div className="inline-flex items-center gap-2">
          <Selector value={metric} onChange={setMetric} />
        </div>
      </header>

      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          {/* Header Stunden */}
          <div className="grid grid-cols-[auto_repeat(24,minmax(20px,1fr))] gap-px">
            <div />
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="px-1 py-1 text-center text-[10px] text-muted-foreground">
                {h}
              </div>
            ))}
          </div>

          {/* Heatmap Zeilen */}
          <div className="grid grid-cols-[auto_repeat(24,minmax(20px,1fr))] gap-px">
            {DOW_ORDER.map((dow) => (
              <React.Fragment key={dow}>
                <div className="sticky left-0 z-10 bg-card/60 px-1 py-1 text-right text-[11px] text-muted-foreground">
                  {DOW_LABELS_UTC[dow]}
                </div>
                {Array.from({ length: 24 }).map((_, hour) => {
                  const cell = map.get(`${dow}-${hour}`)
                  const v =
                    metric === 'sessions'
                      ? cell?.sessions ?? 0
                      : metric === 'impressions'
                      ? cell?.impressions ?? 0
                      : metric === 'views'
                      ? cell?.views ?? 0
                      : (cell?.likes ?? 0) + (cell?.comments ?? 0)
                  return (
                    <div
                      key={hour}
                      className="h-6 w-full rounded-sm border border-transparent"
                      title={`${DOW_LABELS_UTC[dow]} ${hour}:00 — ${metricLabel(metric)}: ${v.toLocaleString()}`}
                      style={{ backgroundColor: v > 0 ? color(v) : 'rgba(0,0,0,0.04)' }}
                    />
                  )
                })}
              </React.Fragment>
            ))}
          </div>

          {/* Legende */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Niedrig</span>
            <div className="h-3 w-24 rounded" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.06), rgba(34,197,94,0.6))' }} />
            <span className="text-xs text-muted-foreground">Hoch</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function metricLabel(m: MetricKey) {
  return m === 'sessions' ? 'Sessions' : m === 'impressions' ? 'Impressions' : m === 'views' ? 'Views' : 'Engagement'
}

function Selector({
  value,
  onChange,
}: {
  value: MetricKey
  onChange: (v: MetricKey) => void
}) {
  const opts: { v: MetricKey; l: string }[] = [
    { v: 'engagement', l: 'Engagement' },
    { v: 'views', l: 'Views' },
    { v: 'impressions', l: 'Impressions' },
    { v: 'sessions', l: 'Sessions' },
  ]
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-background/60 p-1">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={() => onChange(o.v)}
          type="button"
          className={cn(
            'rounded-lg px-3 py-1 text-xs',
            value === o.v
              ? 'border border-primary/30 bg-primary text-primary-foreground shadow'
              : 'text-muted-foreground hover:text-foreground'
          )}
          aria-pressed={value === o.v}
        >
          {o.l}
        </button>
      ))}
    </div>
  )
}
