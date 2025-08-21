'use client'

import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Info, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import * as React from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'info' | 'error'

export interface ImpactScoreProps {
  /** 0–100 */
  value: number
  /** Überschrift */
  label?: string
  /** optional: Plattform-Schnitt 0–100 */
  avgScore?: number
  className?: string
}

/** interne Utils */
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

export default function ImpactScore({
  value,
  label = 'Impact Score',
  avgScore,
  className,
}: ImpactScoreProps) {
  const val = clampScore(value)
  const avg = typeof avgScore === 'number' ? clampScore(avgScore) : undefined

  const { variant, text: badgeText } = getBadge(val)

  const delta = typeof avg === 'number' ? Number((val - avg).toFixed(1)) : undefined
  const isUp = typeof delta === 'number' && delta > 0
  const isDown = typeof delta === 'number' && delta < 0
  const isFlat = typeof delta === 'number' && delta === 0

  return (
    <section
      className={cn(
        'flex flex-col gap-3',
        className
      )}
      aria-label={`${label}: ${val} von 100`}
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
              <p className="max-w-[260px] text-[13px] leading-snug">
                <b>Impact Score</b> misst Sichtbarkeit &amp; Engagement deiner Inhalte relativ
                zum Plattform-Schnitt. <br />
                <span className="opacity-80">Ab 90 exzellent, unter 50 bitte optimieren.</span>
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Badge + Progresszeile */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge
          variant={variant}
          className="min-w-[64px] justify-center px-2 py-1 text-sm tabular-nums"
          aria-label={`Bewertung: ${val} Punkte${badgeText ? ` – ${badgeText}` : ''}`}
        >
          {Math.round(val)}
          {badgeText && <span className="ml-2">{badgeText}</span>}
        </Badge>

        <div className="flex items-center gap-3">
          {/* Progress (linear) */}
          <div className="w-44 sm:w-56">
            <Progress value={val} />
          </div>
          {/* numerischer Wert daneben */}
          <span className="text-sm tabular-nums text-muted-foreground">{val.toFixed(0)}%</span>
        </div>
      </div>

      {/* Plattform-Schnitt + Delta */}
      {typeof avg === 'number' && (
        <div className="mt-0.5 flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">
            Plattform-Schnitt:{' '}
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
                ? `+${delta} Punkte über Schnitt`
                : isDown
                ? `${delta} Punkte unter Schnitt`
                : 'auf Schnitt'
            }
          >
            {isUp && <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />}
            {isDown && <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />}
            {isFlat && <Minus className="h-3.5 w-3.5" aria-hidden />}
            <span className="tabular-nums">
              {isFlat ? '±0.0' : (delta! > 0 ? `+${delta!.toFixed(1)}` : delta!.toFixed(1))}
            </span>
          </span>
        </div>
      )}

      {/* SR-only für Screenreader mit Kurzbeschreibung */}
      <span className="sr-only">
        {label} beträgt {val} von 100{typeof avg === 'number' ? `, Plattform-Schnitt ${avg}.` : '.'}
      </span>
    </section>
  )
}
