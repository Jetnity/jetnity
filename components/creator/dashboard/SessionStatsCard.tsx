// components/creator/dashboard/SessionStatsCard.tsx
// Server Component (nur Darstellung)
import type { Tables } from '@/types/supabase'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import ContentTypePicker from './ContentTypePicker'
import { Gauge, Eye, Heart, MessageCircle } from 'lucide-react'

type Metric = Tables<'creator_session_metrics'>

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}
function clamp100(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, n))
}
function truncate(s: string | null | undefined, max = 64) {
  const str = (s ?? 'Ohne Titel').trim()
  return str.length > max ? str.slice(0, max - 1) + '…' : str
}
function fmtPct01(n: number) {
  return `${(clamp01(n) * 100).toFixed(1)}%`
}
function fmtInt(n: number) {
  try {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n)
  } catch {
    return String(n)
  }
}
function fmtDateISO(iso?: string | null) {
  if (!iso) return ''
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric', month: 'long', day: 'numeric',
    }).format(new Date(iso))
  } catch {
    return ''
  }
}

type BadgeVariant = 'default' | 'success' | 'warning' | 'info' | 'error'
function impactBadge(val: number): { variant: BadgeVariant; text?: string } {
  if (val >= 90) return { variant: 'success', text: 'Top 10%' }
  if (val >= 70) return { variant: 'info', text: 'Trending' }
  if (val >= 50) return { variant: 'warning' }
  return { variant: 'error', text: 'Optimieren' }
}

export default function SessionStatsCard({ metric }: { metric: Metric }) {
  const impressions = Math.max(0, metric.impressions ?? 0)
  const views = Math.max(0, metric.views ?? 0)
  const likes = Math.max(0, metric.likes ?? 0)
  const comments = Math.max(0, metric.comments ?? 0)
  const impact = clamp100(Number(metric.impact_score ?? 0))

  const viewRate = impressions > 0 ? clamp01(views / impressions) : 0
  const engagementAbs = likes + comments
  const engagementRate = impressions > 0 ? clamp01(engagementAbs / impressions) : 0

  const date = fmtDateISO(metric.created_at)
  // defensiv, solange Supabase-Types evtl. keine Spalte kennen
  const currentType = ((metric as any)?.content_type as string | undefined) ?? 'other'

  const badge = impactBadge(impact)

  return (
    <section
      className="rounded-2xl border border-border bg-background/60 p-4 shadow-sm"
      aria-label={`Session-Statistiken für ${truncate(metric.title, 40)}`}
    >
      {/* Kopf */}
      <header className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-sm font-semibold">{truncate(metric.title)}</h4>
          <p className="text-xs text-muted-foreground">{date}</p>
        </div>
        <Badge
          variant={badge.variant}
          className="inline-flex items-center gap-2 tabular-nums"
          aria-label={`Impact ${Math.round(impact)} von 100${badge.text ? ` – ${badge.text}` : ''}`}
          title="Impact Score (0–100)"
        >
          {Math.round(impact)}
          {badge.text && <span className="hidden sm:inline">{badge.text}</span>}
        </Badge>
      </header>

      {/* Content Type / Segmentierung */}
      <div className="mb-3">
        <ContentTypePicker sessionId={metric.session_id} initialType={currentType} />
      </div>

      {/* Impact Progress */}
      <div className="mt-1 flex items-center gap-3">
        <div className="w-full">
          <Progress value={impact} />
        </div>
        <div className="w-[46px] text-right text-sm tabular-nums text-muted-foreground">
          {impact.toFixed(0)}%
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <KpiCard
          icon={<Gauge className="h-4 w-4" aria-hidden />}
          title="Impressions"
          value={fmtInt(impressions)}
        />
        <KpiCard
          icon={<Eye className="h-4 w-4" aria-hidden />}
          title="Views"
          value={fmtInt(views)}
          sub={impressions > 0 ? `${fmtPct01(viewRate)} View-Rate` : undefined}
        />
        <KpiCard
          icon={<Heart className="h-4 w-4" aria-hidden />}
          title="Likes"
          value={fmtInt(likes)}
        />
        <KpiCard
          icon={<MessageCircle className="h-4 w-4" aria-hidden />}
          title="Kommentare"
          value={fmtInt(comments)}
          sub={`${fmtPct01(engagementRate)} Engagement-Rate`}
        />
      </div>

      {/* Mikro-Progress für Raten */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:max-w-sm">
        <RatePill label="View-Rate" value={viewRate} />
        <RatePill label="Engagement-Rate" value={engagementRate} />
      </div>

      {/* Footer-Link */}
      <div className="mt-3 flex justify-end">
        <Link
          href={`/story/${metric.session_id}`}
          className={cn(
            'inline-flex items-center rounded-lg border border-input px-3 py-1.5 text-sm',
            'hover:bg-accent hover:text-accent-foreground transition'
          )}
          aria-label={`Story ${truncate(metric.title, 40)} öffnen`}
        >
          Öffnen
        </Link>
      </div>
    </section>
  )
}

/* ---------- Mini-Bausteine ---------- */

function KpiCard({
  icon,
  title,
  value,
  sub,
}: {
  icon?: React.ReactNode
  title: string
  value: string
  sub?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card/50 px-3 py-2">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {icon}
        <span>{title}</span>
      </div>
      <div className="text-base font-semibold tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  )
}

function RatePill({ label, value }: { label: string; value: number }) {
  const pctLabel = fmtPct01(value)
  const pct100 = clamp01(value) * 100
  return (
    <div
      className="rounded-lg border border-border bg-background/60 px-3 py-2"
      aria-label={`${label}: ${pctLabel}`}
      title={label}
    >
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${pct100}%` }}
          />
        </div>
        <span className="w-[54px] text-right text-sm tabular-nums text-muted-foreground">
          {pctLabel}
        </span>
      </div>
    </div>
  )
}
