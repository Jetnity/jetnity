'use client'

import type { Tables } from '@/types/supabase'
import { Eye, BarChart2, MessageSquare } from 'lucide-react'
import ImpactScore from './ImpactScore'

type Props = {
  metrics: Tables<'creator_session_metrics'>
  maxScore?: number
  avgScore?: number
}

export default function SessionStatsCard({ metrics, maxScore = 100, avgScore }: Props) {
  const score = metrics.impact_score ?? 0

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 flex flex-col gap-3">
      <ImpactScore value={score} avgScore={avgScore} />
      <div className="flex justify-between gap-4 mt-2 text-sm">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-blue-500" />
          <span className="font-semibold">{metrics.views ?? 0}</span>
          <span className="text-neutral-500">Views</span>
        </div>
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-green-500" />
          <span className="font-semibold">{metrics.impressions ?? 0}</span>
          <span className="text-neutral-500">Impressions</span>
        </div>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-yellow-400" />
          <span className="font-semibold">{metrics.comments ?? 0}</span>
          <span className="text-neutral-500">Kommentare</span>
        </div>
      </div>
      <div className="mt-1 text-[11px] text-gray-400 italic">
        Score basiert auf Views, Impressions & Kommentaren.
      </div>
    </div>
  )
}
