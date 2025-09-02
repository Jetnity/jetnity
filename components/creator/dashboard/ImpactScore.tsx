'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Info, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type BadgeVariant = 'default' | 'success' | 'warning' | 'info' | 'error'
type Mode = 'linear' | 'gauge'
type Size = 'sm' | 'md' | 'lg'

export interface ImpactScoreProps {
  /** Score 0–100 */
  value: number
  /** Überschrift */
  label?: string
  /** optional: Plattform-Schnitt 0–100 */
  avgScore?: number
  /** optional: Zielwert 0–100 (OKR/Target) */
  target?: number
  /** History 0–100 (neueste am Ende) für Sparkline */
  history?: number[]
  /** Label für den Benchmark (z. B. "Reise-Creator-Schnitt") */
  benchmarkLabel?: string
  /** Darstellung: linearer Balken oder Gauge-Ring */
  mode?: Mode
  /** Größe */
  size?: Size
  /** Loading Skeleton */
  loading?: boolean
  className?: string
  /** Optional: Klick öffnet Detailseite */
  onClick?: () => void
}

/* ───────────────────────────────────────── Utils ───────────────────────────────────────── */

function clampScore(n?: number | null) {
  const v = Number.isFinite(n as number) ? Number(n) : 0
  return Math.max(0, Math.min(100, v))
}

function getBadge(val: number): { variant: BadgeVariant; text: string | null } {
  if (val >= 90) return { variant: 'success', text: 'Top 10%' }
  if (val >= 70) return { variant: 'info', text: 'Trending' }
  if (val >= 50) return { variant: 'warning', text: null }
  return { variant: 'error', text: 'Optimieren' }
}

function badgeClasses(variant: BadgeVariant) {
  switch (variant) {
    case 'success':
      return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
    case 'info':
      return 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300'
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300'
    case 'error':
      return 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300'
    default:
      return 'border-muted bg-muted text-foreground'
  }
}

function fmtDelta(delta?: number) {
  if (typeof delta !== 'number' || Number.isNaN(delta)) return { label: '–', sign: 0 }
  const d = Number(delta.toFixed(1))
  return { label: (d > 0 ? '+' : d < 0 ? '' : '±') + d.toFixed(1), sign: Math.sign(d) }
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

function sparklinePath(values: number[], w: number, h: number, pad = 2) {
  if (values.length === 0) return ''
  const xs = values.map((_, i) => lerp(pad, w - pad, i / Math.max(1, values.length - 1)))
  const ys = values.map(v => lerp(h - pad, pad, clampScore(v) / 100))
  return xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ')
}

/* ───────────────────────────────────────── Gauge (SVG) ───────────────────────────────────────── */

function Gauge({
  value,
  size = 96,
  track = '#e5e7eb',
  stroke = '#2563eb',
}: { value: number; size?: number; track?: string; stroke?: string }) {
  const val = clampScore(value)
  const r = size * 0.42
  const c = Math.PI * 2 * r
  const pct = val / 100
  const off = c * (1 - pct)
  const cx = size / 2
  const cy = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
      <circle cx={cx} cy={cy} r={r} stroke={track} strokeWidth={8} fill="none" opacity={0.5} />
      <circle
        cx={cx} cy={cy} r={r} stroke={stroke} strokeWidth={8} fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(.2,.8,.2,1)' }}
      />
    </svg>
  )
}

/* ───────────────────────────────────────── Skeleton ───────────────────────────────────────── */

export function ImpactScoreSkeleton({ mode = 'linear', className }: { mode?: Mode; className?: string }) {
  return (
    <section className={cn('flex flex-col gap-3', className)} aria-busy>
      <div className="h-4 w-40 animate-pulse rounded bg-muted" />
      {mode === 'linear' ? (
        <div className="flex items-center gap-3">
          <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-56 animate-pulse rounded bg-muted" />
        </div>
      ) : (
        <div className="h-24 w-24 animate-pulse rounded-full bg-muted" />
      )}
      <div className="h-3 w-60 animate-pulse rounded bg-muted" />
    </section>
  )
}

/* ───────────────────────────────────────── Component ───────────────────────────────────────── */

export default function ImpactScore({
  value,
  label = 'Impact Score',
  avgScore,
  target,
  history = [],
  benchmarkLabel = 'Plattform-Schnitt',
  mode = 'linear',
  size = 'md',
  loading = false,
  className,
  onClick,
}: ImpactScoreProps) {
  if (loading) return <ImpactScoreSkeleton mode={mode} className={className} />

  const val = clampScore(value)
  const avg = typeof avgScore === 'number' ? clampScore(avgScore) : undefined
  const tgt = typeof target === 'number' ? clampScore(target) : undefined

  const { variant, text: badgeText } = getBadge(val)
  const delta = typeof avg === 'number' ? Number((val - avg).toFixed(1)) : undefined
  const { label: deltaLabel, sign } = fmtDelta(delta)

  const isUp = sign > 0
  const isDown = sign < 0
  const isFlat = sign === 0 && typeof delta === 'number'

  const sizes: Record<Size, { sparkW: number; sparkH: number; gauge: number; barW: string }> = {
    sm: { sparkW: 110, sparkH: 30, gauge: 80, barW: '9rem' },
    md: { sparkW: 150, sparkH: 36, gauge: 96, barW: '14rem' },
    lg: { sparkW: 200, sparkH: 44, gauge: 120, barW: '18rem' },
  }

  const sparkPath = React.useMemo(
    () => (history.length ? sparklinePath(history, sizes[size].sparkW, sizes[size].sparkH) : ''),
    [history, size]
  )

  const markerPct = (n?: number) => (typeof n === 'number' ? `${clampScore(n)}%` : undefined)

  const gradientBar =
    'bg-gradient-to-r from-rose-500 via-amber-500 via-50% to-emerald-500 dark:from-rose-600 dark:via-amber-500 dark:to-emerald-500'

  return (
    <section
      className={cn('flex select-none flex-col gap-3', onClick && 'cursor-pointer hover:opacity-[.98]', className)}
      aria-label={`${label}: ${val} von 100`}
      onClick={onClick}
    >
      {/* Kopfzeile */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{label}</span>
        <TooltipProvider delayDuration={120}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 cursor-pointer text-muted-foreground" aria-hidden />
            </TooltipTrigger>
            <TooltipContent side="top" align="start">
              <div className="max-w-[280px] text-[13px] leading-snug">
                <b>Impact Score</b> misst Sichtbarkeit &amp; Engagement deiner Inhalte (0–100).
                <br />
                <span className="opacity-80">Ab 90 exzellent, unter 50 bitte optimieren.</span>
                {typeof avg === 'number' && (
                  <>
                    <br />
                    <span className="opacity-80">
                      Vergleich mit <b>{benchmarkLabel}</b>: {deltaLabel}.
                    </span>
                  </>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Kopf-Badge + Zahl/Trend */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge
          className={cn(
            'min-w-[64px] justify-center px-2 py-1 text-sm tabular-nums',
            'border',
            badgeClasses(variant)
          )}
          aria-label={`Bewertung: ${Math.round(val)} Punkte${badgeText ? ` – ${badgeText}` : ''}`}
        >
          {Math.round(val)}
          {badgeText && <span className="ml-2">{badgeText}</span>}
        </Badge>

        {/* Anzeige rechts vom Badge */}
        {mode === 'linear' ? (
          <div className="flex items-center gap-3">
            <div className={cn('relative', `w-[${sizes[size].barW}]`)}>
              {/* Progress */}
              <Progress value={val} className={cn('h-2 overflow-visible')}>
                {/* Tailwind Progress von shadcn rendert einen inneren div – wir überlagern Marker absolut */}
              </Progress>

              {/* Farbverlauf-Overlay passend zur Füllung */}
              <div
                className={cn('pointer-events-none absolute inset-0 rounded-full opacity-70', gradientBar)}
                style={{ clipPath: `inset(0 ${100 - val}% 0 0 round 999px)` }}
                aria-hidden
              />

              {/* Marker: avg */}
              {typeof avg === 'number' && (
                <div
                  className="absolute inset-y-[-2px] w-0.5 rounded bg-blue-500"
                  style={{ left: markerPct(avg) }}
                  aria-hidden
                />
              )}

              {/* Marker: target */}
              {typeof tgt === 'number' && (
                <div
                  className="absolute inset-y-[-2px] w-0.5 rounded bg-emerald-600"
                  style={{ left: markerPct(tgt) }}
                  aria-hidden
                />
              )}
            </div>
            <span className="text-sm tabular-nums text-muted-foreground">{val.toFixed(0)}%</span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Gauge value={val} size={sizes[size].gauge} />
              <div className="absolute inset-0 grid place-items-center">
                <span className="text-base font-semibold tabular-nums">{val.toFixed(0)}</span>
              </div>
            </div>
            {!!history.length && (
              <SparklineMini values={history} w={sizes[size].sparkW} h={sizes[size].sparkH} />
            )}
          </div>
        )}
      </div>

      {/* Benchmark + Delta + Sparkline */}
      {typeof avg === 'number' && (
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">
            {benchmarkLabel}:{' '}
            <span className="font-semibold text-foreground">{avg.toFixed(1)}%</span>
          </span>

          {/* Delta-Pill */}
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5',
              'border-border bg-background/60',
              isUp && 'text-emerald-600 dark:text-emerald-400',
              isDown && 'text-rose-600 dark:text-rose-400',
              isFlat && 'text-muted-foreground'
            )}
            aria-label={
              isUp
                ? `${deltaLabel} Punkte über ${benchmarkLabel}`
                : isDown
                ? `${deltaLabel} Punkte unter ${benchmarkLabel}`
                : 'auf Benchmark'
            }
          >
            {isUp && <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />}
            {isDown && <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />}
            {isFlat && <Minus className="h-3.5 w-3.5" aria-hidden />}
            <span className="tabular-nums">{isFlat ? '±0.0' : deltaLabel}</span>
          </span>

          {/* Ziel-Label, falls vorhanden */}
          {typeof tgt === 'number' && (
            <span className="text-muted-foreground">
              Ziel: <span className="font-semibold text-foreground">{tgt.toFixed(0)}%</span>
            </span>
          )}

          {/* Sparkline */}
          {!!history.length && (
            <span className="ml-auto">
              <SparklineMini values={history} w={sizes[size].sparkW} h={sizes[size].sparkH} />
            </span>
          )}
        </div>
      )}

      {/* SR-only Zusammenfassung */}
      <span className="sr-only">
        {label} beträgt {val} von 100
        {typeof avg === 'number' ? `, ${benchmarkLabel} ${avg}.` : '.'}
        {typeof tgt === 'number' ? ` Zielwert ${tgt}.` : ''}
      </span>
    </section>
  )
}

/* ───────────────────────────────────────── Sparkline (SVG) ───────────────────────────────────────── */

function SparklineMini({ values, w, h }: { values: number[]; w: number; h: number }) {
  const path = React.useMemo(() => sparklinePath(values, w, h), [values, w, h])
  const last = values.at(-1)
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="rounded-md border bg-background/60"
      aria-label="Trend"
    >
      <path d={path} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-muted-foreground" />
      {typeof last === 'number' && values.length > 0 && (
        <circle
          cx={w - 2}
          cy={lerp(h - 2, 2, clampScore(last) / 100)}
          r={2.5}
          className="fill-primary"
        />
      )}
    </svg>
  )
}
