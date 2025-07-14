'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { CreatorSessionMetrics } from '@/types/views' // ⬅️ KORREKT: Eigener Typ für die View

interface Props {
  sessionId: string
}

export default function SessionImpact({ sessionId }: Props) {
  const [metrics, setMetrics] = useState<CreatorSessionMetrics | null>(null)

  useEffect(() => {
    const loadMetrics = async () => {
      const { data, error } = await supabase
        .from('creator_session_metrics')
        .select('*')
        .eq('session_id', sessionId)

      if (!error && data && data.length > 0) {
        setMetrics(data[0] as CreatorSessionMetrics)
      }
    }

    loadMetrics()
  }, [sessionId])

  if (!metrics) return null

  return (
    <div className="mt-8 text-center text-sm text-gray-500">
      <p>👁️ Aufrufe: <strong>{metrics.views}</strong></p>
      <p>📣 Impressions: <strong>{metrics.impressions}</strong></p>
    </div>
  )
}