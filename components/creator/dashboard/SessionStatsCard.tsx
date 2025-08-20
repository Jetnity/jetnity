// Server Component (nur Darstellung)
import type { Tables } from '@/types/supabase'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import Link from 'next/link'

type Metric = Tables<'creator_session_metrics'>

function truncate(s: string | null, max = 50) {
  const str = s ?? 'Ohne Titel'
  return str.length > max ? str.slice(0, max - 1) + '…' : str
}

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`
}

export default function SessionStatsCard({ metric }: { metric: Metric }) {
  const impressions = metric.impressions ?? 0
  const views = metric.views ?? 0
  const likes = metric.likes ?? 0
  const comments = metric.comments ?? 0
  const impact = Math.max(0, Math.min(100, Number(metric.impact_score ?? 0)))

  const viewRate = impressions > 0 ? views / impressions : 0
  const engagementRate = impressions > 0 ? (likes + comments) / impressions : 0

  let variant: 'default' | 'success' | 'warning' | 'info' | 'error' = 'default'
  if (impact >= 90) variant = 'success'
  else if (impact >= 70) variant = 'info'
  else if (impact >= 50) variant = 'warning'
  else variant = 'error'

  const date = metric.created_at
    ? new Date(metric.created_at).toLocaleDateString()
    : ''

  return (
    <div className="rounded-xl border border-border bg-background/60 p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{truncate(metric.title)}</div>
          <div className="text-xs text-muted-foreground">{date}</div>
        </div>
        <Badge variant={variant} className="tabular-nums">
          {Math.round(impact)}
        </Badge>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <div className="w-full">
          <Progress value={impact} />
        </div>
        <div className="w-[46px] text-right text-sm tabular-nums text-muted-foreground">
          {impact.toFixed(0)}%
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg border border-border bg-card/50 px-3 py-2">
          <div className="text-[11px] text-muted-foreground">Impressions</div>
          <div className="font-semibold tabular-nums">{impressions.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border border-border bg-card/50 px-3 py-2">
          <div className="text-[11px] text-muted-foreground">Views</div>
          <div className="font-semibold tabular-nums">{views.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border border-border bg-card/50 px-3 py-2">
          <div className="text-[11px] text-muted-foreground">View-Rate</div>
          <div className="font-semibold tabular-nums">{pct(viewRate)}</div>
        </div>
        <div className="rounded-lg border border-border bg-card/50 px-3 py-2">
          <div className="text-[11px] text-muted-foreground">Engagement</div>
          <div className="font-semibold tabular-nums">
            {(likes + comments).toLocaleString()}
            <span className="ml-1 text-xs text-muted-foreground">
              ({pct(engagementRate)})
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <Link
          href={`/story/${metric.session_id}`}
          className={cn(
            'inline-flex items-center rounded-lg border border-input px-3 py-1.5 text-sm',
            'hover:bg-accent'
          )}
        >
          Öffnen
        </Link>
      </div>
    </div>
  )
}
