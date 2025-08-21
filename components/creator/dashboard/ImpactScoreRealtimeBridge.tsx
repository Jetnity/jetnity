'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function ImpactScoreRealtimeBridge({
  userId,
  debounceMs = 600,
}: {
  userId: string
  debounceMs?: number
}) {
  const router = useRouter()
  const t = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`impact-score:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'creator_session_metrics',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          if (t.current) clearTimeout(t.current)
          t.current = setTimeout(() => {
            router.refresh()
          }, debounceMs)
        }
      )
      .subscribe()

    return () => {
      if (t.current) clearTimeout(t.current)
      supabase.removeChannel(channel)
    }
  }, [userId, debounceMs, router])

  return null
}
