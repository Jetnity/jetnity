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
import { useRouter } from 'next/navigation'

export type MetricsChartPoint = {
  date: string
  impressions: number
  views: number
  engagement: number
  likes?: number
  comments?: number
}

export default function MetricsChart({
  data,
  rangeParam = '90', // '30' | '90' | '180' | 'all'
}: {
  data: MetricsChartPoint[]
  rangeParam?: string
}) {
  const [showImpressions, setShowImpressions] = React.useState(true)
  const [showViews, setShowViews] = React.useState(true)
  const [showEngagement, setShowEngagement] = React.useState(true)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const router = useRouter()

  const formatter = (value: any) =>
    typeof value === 'number' ? value.toLocaleString() : value

  const downloadCsv = React.useCallback(() => {
    const header = ['date', 'impressions', 'views', 'likes', 'comments', 'engagement']
    const rows = data.map(d => [
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
      rows.map(r => r.map(c => String(c).replace(/,/g, '·')).join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'analytics_timeseries.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [data])

  const downloadSvg = React.useCallback(() => {
    const svg = containerRef.current?.querySelector('svg.recharts-surface') as SVGSVGElement | null
    if (!svg) return
    const clone = svg.cloneNode(true) as SVGSVGElement
    const bbox = svg.getBoundingClientRect()
    clone.setAttribute('width', String(Math.round(bbox.width)))
    clone.setAttribute('height', String(Math.round(bbox.height)))
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    const xml = new XMLSerializer().serializeToString(clone)
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'analytics_chart.svg'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const downloadPng = React.useCallback(async () => {
    const svg = containerRef.current?.querySelector('svg.recharts-surface') as SVGSVGElement | null
    if (!svg) return
    const bbox = svg.getBoundingClientRect()
    const width = Math.round(bbox.width)
    const height = Math.round(bbox.height)
    const clone = svg.cloneNode(true) as SVGSVGElement
    clone.setAttribute('width', String(width))
    clone.setAttribute('height', String(height))
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    const xml = new XMLSerializer().serializeToString(clone)
    const svg64 =
      typeof window !== 'undefined' ? window.btoa(unescape(encodeURIComponent(xml))) : ''
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(blob => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'analytics_chart.png'
        a.click()
        URL.revokeObjectURL(url)
      }, 'image/png')
    }
    img.src = 'data:image/svg+xml;base64,' + svg64
  }, [])

  // Drilldown: Klick auf Chartpunkt -> /creator/analytics/day/YYYY-MM-DD?range=...
  const handleChartClick = (state: any) => {
    const label: string | undefined =
      state?.activeLabel ?? state?.activePayload?.[0]?.payload?.date
    if (!label) return
    const url = `/creator/analytics/day/${label}?range=${encodeURIComponent(rangeParam)}`
    router.push(url)
  }

  return (
    <div className="w-full" ref={containerRef}>
      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Toggle active={showImpressions} onClick={() => setShowImpressions(v => !v)} label="Impressions" />
        <Toggle active={showViews} onClick={() => setShowViews(v => !v)} label="Views" />
        <Toggle active={showEngagement} onClick={() => setShowEngagement(v => !v)} label="Engagement" />

        <div className="ml-auto" />
        <button
          onClick={downloadCsv}
          className="inline-flex items-center rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-accent"
        >
          CSV
        </button>
        <button
          onClick={downloadSvg}
          className="inline-flex items-center rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-accent"
        >
          SVG
        </button>
        <button
          onClick={downloadPng}
          className="inline-flex items-center rounded-lg border border-input px-3 py-1.5 text-sm hover:bg-accent"
        >
          PNG
        </button>
      </div>

      {/* Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} onClick={handleChartClick}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={formatter} />
            <Legend />
            {showImpressions && <Line type="monotone" dataKey="impressions" dot={false} strokeWidth={2} />}
            {showViews && <Line type="monotone" dataKey="views" dot={false} strokeWidth={2} />}
            {showEngagement && <Line type="monotone" dataKey="engagement" dot={false} strokeWidth={2} />}
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
