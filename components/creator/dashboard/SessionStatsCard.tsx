'use client'

import type { Tables } from '@/types/supabase'
import { Eye, BarChart2, Star } from 'lucide-react'

type Props = {
  metrics: Tables<'creator_session_metrics'>
  maxScore?: number
  avgScore?: number
}

export default function SessionStatsCard({ metrics, maxScore = 100, avgScore }: Props) {
  // Score & Prozent berechnen (Fallback, falls maxScore 0)
  const score = metrics.impact_score ?? 0
  const percent = maxScore > 0 ? Math.min((score / maxScore) * 100, 100) : 0

  // Farbverlauf dynamisch
  let barColor =
    percent >= 90
      ? 'bg-gradient-to-r from-green-400 via-cyan-400 to-purple-500'
      : percent >= 65
      ? 'bg-gradient-to-r from-yellow-300 via-lime-300 to-green-400'
      : percent >= 30
      ? 'bg-gradient-to-r from-orange-400 to-yellow-300'
      : 'bg-gradient-to-r from-gray-300 to-red-300'

  // Badge-Logik
  let badge = null
  if (percent >= 90) {
    badge = (
      <span className="ml-2 px-2 py-0.5 bg-purple-600 text-white rounded text-xs font-bold flex items-center gap-1">
        <Star className="w-3 h-3 inline-block" /> Top 10%
      </span>
    )
  } else if (percent >= 70) {
    badge = (
      <span className="ml-2 px-2 py-0.5 bg-cyan-600 text-white rounded text-xs font-bold">Trending</span>
    )
  }

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-2 flex items-center text-sm font-semibold text-neutral-500">
        📊 Impact Score
        {badge}
      </div>
      {/* Impact Score Progress */}
      <div className="relative w-full h-4 mb-2 bg-gray-200 rounded-xl overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full rounded-xl ${barColor} transition-all`}
          style={{ width: `${percent}%` }}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-neutral-600 font-bold drop-shadow">
          {score.toFixed(1)}
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>{percent.toFixed(1)}%</span>
        {typeof avgScore === 'number' && (
          <span>
            Plattform-Schnitt: <span className="font-semibold">{avgScore.toFixed(1)}</span>
          </span>
        )}
      </div>
      {/* Detail-Metriken */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2 text-base">
          <Eye className="h-4 w-4 text-blue-500" />
          <span>{metrics.views ?? 0} Views</span>
        </div>
        <div className="flex items-center gap-2 text-base">
          <BarChart2 className="h-4 w-4 text-green-500" />
          <span>{metrics.impressions ?? 0} Impressions</span>
        </div>
        <div className="flex items-center gap-2 text-base">
          <Star className="h-4 w-4 text-yellow-400" />
          <span>{metrics.comments ?? 0} Comments</span>
        </div>
      </div>
      {/* Info */}
      <div className="mt-2 text-[11px] text-gray-400 italic">
        Score basiert auf Views, Impressions & Comments. Je höher, desto besser!
      </div>
    </div>
  )
}
