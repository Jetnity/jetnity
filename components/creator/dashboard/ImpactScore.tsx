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

interface ImpactScoreProps {
  value: number // 0–100
  label?: string
  avgScore?: number
  className?: string
}

export default function ImpactScore({ value, label = 'Impact Score', avgScore, className }: ImpactScoreProps) {
  const normalized = Math.max(0, Math.min(value, 100))

  // Badge-Variante bestimmen (passend zu deinem Badge-Code)
  let badgeVariant: 'default' | 'success' | 'warning' | 'info' | 'error' = 'default'
  if (normalized >= 90) badgeVariant = 'success'
  else if (normalized >= 70) badgeVariant = 'info'
  else if (normalized >= 50) badgeVariant = 'warning'
  else badgeVariant = 'error'

  let badgeText = ''
  if (normalized >= 90) badgeText = 'Top 10%'
  else if (normalized >= 70) badgeText = 'Trending'
  else if (normalized < 50) badgeText = 'Optimieren'

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
                <b>Impact Score</b>: Bewertet Sichtbarkeit & Engagement deiner Session im Vergleich zum Plattform-Schnitt.
                Werte über 90 sind exzellent, unter 50 solltest du optimieren.
              </span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={badgeVariant} className="min-w-[60px] text-center">
          {Math.round(normalized)}
          {badgeText && <span className="ml-2">{badgeText}</span>}
        </Badge>
        <Progress value={normalized} className="w-40 h-3" />
      </div>
      {typeof avgScore === 'number' && (
        <div className="text-xs text-neutral-500 mt-1">
          Plattform-Schnitt: <span className="font-semibold">{avgScore.toFixed(1)}</span>
        </div>
      )}
    </div>
  )
}
