'use client'

import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'info' | 'error'

interface ImpactScoreProps {
  value: number         // 0–100
  label?: string        // Überschrift
  avgScore?: number     // optional: Plattform-Schnitt
  className?: string
}

export default function ImpactScore({
  value,
  label = 'Impact Score',
  avgScore,
  className,
}: ImpactScoreProps) {
  const val = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))

  let badgeVariant: BadgeVariant = 'default'
  if (val >= 90) badgeVariant = 'success'
  else if (val >= 70) badgeVariant = 'info'
  else if (val >= 50) badgeVariant = 'warning'
  else badgeVariant = 'error'

  let badgeText = ''
  if (val >= 90) badgeText = 'Top 10%'
  else if (val >= 70) badgeText = 'Trending'
  else if (val < 50) badgeText = 'Optimieren'

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{label}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent>
              <span>
                <b>Impact Score</b>: Misst Sichtbarkeit & Engagement deiner Session
                im Vergleich zum Plattform-Schnitt. Ab 90 exzellent, unter 50
                bitte optimieren.
              </span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant={badgeVariant} className="min-w-[64px] justify-center">
          {Math.round(val)}
          {badgeText && <span className="ml-2">{badgeText}</span>}
        </Badge>
        <Progress value={val} className="w-40 h-3" />
      </div>

      {typeof avgScore === 'number' && Number.isFinite(avgScore) && (
        <div className="text-xs text-neutral-500 mt-1">
          Plattform-Schnitt:{' '}
          <span className="font-semibold">{avgScore.toFixed(1)}</span>
        </div>
      )}
    </div>
  )
}
