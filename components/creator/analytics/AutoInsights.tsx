// components/creator/analytics/AutoInsights.tsx
import { Lightbulb, TrendingUp, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Insight } from '@/lib/analytics/insights'

export default function AutoInsights({
  insights,
  className,
}: {
  insights: Insight[]
  className?: string
}) {
  if (!insights.length) return null
  return (
    <section className={cn('rounded-2xl border border-border bg-card/60 p-4', className)}>
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Auto-Insights</h3>
          <p className="text-xs text-muted-foreground">Erkannte Chancen & Auffälligkeiten im gewählten Zeitraum.</p>
        </div>
      </header>

      <ul className="grid gap-3 md:grid-cols-2">
        {insights.map((it, i) => (
          <li
            key={i}
            className={cn(
              'rounded-xl border p-4',
              it.kind === 'positive'
                ? 'border-emerald-300/40 bg-emerald-500/5'
                : it.kind === 'warning'
                ? 'border-rose-300/40 bg-rose-500/5'
                : 'border-border bg-background/60'
            )}
          >
            <div className="flex items-start gap-3">
              <Icon kind={it.kind} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{it.title}</h4>
                  {it.tag && (
                    <span className="rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {it.tag}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{it.body}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Icon({ kind }: { kind: 'positive' | 'warning' | 'info' }) {
  const cls = 'h-5 w-5 shrink-0 mt-0.5'
  if (kind === 'positive') return <TrendingUp className={cls} />
  if (kind === 'warning') return <AlertTriangle className={cls} />
  return <Info className={cls} />
}
