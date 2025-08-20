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

export type MetricsChartPoint = {
  date: string
  impressions: number
  views: number
  engagement: number
}

export default function MetricsChart({ data }: { data: MetricsChartPoint[] }) {
  // Tooltip-Formatter
  const formatter = (value: any) =>
    typeof value === 'number' ? value.toLocaleString() : value

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={formatter} />
          <Legend />
          <Line type="monotone" dataKey="impressions" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="views" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="engagement" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
