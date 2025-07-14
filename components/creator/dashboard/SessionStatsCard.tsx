'use client'

import type { Tables } from '@/types/supabase'
import { Eye, BarChart2 } from 'lucide-react'

type Props = {
  metrics: Tables<'creator_session_metrics'>
}

export default function SessionStatsCard({ metrics }: Props) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-2 text-sm font-semibold text-neutral-500">
        📘 Session Performance
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-base">
          <Eye className="h-4 w-4 text-blue-500" />
          <span>{metrics.views ?? 0} Views</span>
        </div>
        <div className="flex items-center gap-2 text-base">
          <BarChart2 className="h-4 w-4 text-green-500" />
          <span>{metrics.impressions ?? 0} Impressions</span>
        </div>
      </div>
    </div>
  )
}
