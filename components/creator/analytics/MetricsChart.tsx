'use client'

import * as React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '@/lib/utils'

export type MetricsChartPoint = {
  date: string
  impressions: number
  views: number
  engagement: number
  likes?: number
  comments?: number
}

export default function MetricsChart({ data }: { data: MetricsChartPoint[] }) {
  const [showImpressions, setShowImpressions] = React.useState(true)
  const [showViews, setShowViews] = React.useState(true)
  const [showEngagement, setShowEngagement] = React.useState(true)

  const formatter = (value: any) =>
    typeof value === 'number' ? value.toLocaleString() : value

  const downloadCsv = React.useCallback(() => {
    const header = ['date', 'impressions', 'views', 'likes', 'comments', 'engagement']
    const rows = data.map((d) => [
      d.date,
      d.impressions ?? 0,
      d.views ?? 0,
      d.likes ?? '',
      d.comments ?? '',
      d.engagement ?? 0,
    ])
    const csv =
      header.join(',') +
      '\n' +
      rows.map((r) => r.map((c) => String(c).replace(/,/g, '·')).join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'analytics_timeseries.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [data])

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Toggle
          active={showImpressions}
          onClick={() => setShowImpressions((v) => !v)}
          label="Impressions"
        />
        <Toggle active={showViews} onClick={() => setShowViews((v) => !v)} label="Views" />
        <Toggle
          active={showEngagement}
          onClick={() => setShowEngagement((v) => !v)}
          label="Engagement"
        />

        <div className="ml-auto" />
        <button
          onClick={downloadCsv}
          className="inline-flex items-center rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-accent"
        >
          CSV exportieren
        </button>
      </div>

      {/* Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={formatter} />
            <Legend />
            {showImpressions && (
              <Line type="monotone" dataKey="impressions" dot={false} strokeWidth={2} />
            )}
            {showViews && (
              <Line type="monotone" dataKey="views" dot={false} strokeWidth={2} />
            )}
            {showEngagement && (
              <Line type="monotone" dataKey="engagement" dot={false} strokeWidth={2} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function Toggle({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-lg px-3 py-1.5 text-sm transition',
        active
          ? 'border border-primary/30 bg-primary text-primary-foreground shadow'
          : 'border border-input hover:bg-accent'
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  )
}
