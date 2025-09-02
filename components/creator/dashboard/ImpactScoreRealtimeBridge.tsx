'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type Row = {
  user_id: string
  impressions: number | null
  views: number | null
  likes: number | null
  comments: number | null
  impact_score: number | null
  created_at: string | null
}

export default function ImpactScoreRealtimeBridge({
  userId,
  debounceMs = 600,
}: {
  userId: string
  debounceMs?: number
}) {
  const router = useRouter()

  // ---- Refs (keine Re-Renders verursachen)
  const debounce = Math.max(200, debounceMs)
  const timerRef = useRef<number | null>(null)
  const visibleRef = useRef<boolean>(true)
  const dirtyRef = useRef<boolean>(false)
  const mountedRef = useRef<boolean>(false)
  const debug = process.env.NEXT_PUBLIC_DEBUG_REALTIME === '1'

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const doRefresh = useCallback(() => {
    if (!mountedRef.current) return
    // Sichtbar? Wenn nein, nur markieren – wird beim Sichtbarwerden geflusht.
    if (!visibleRef.current) {
      dirtyRef.current = true
      if (debug) console.debug('[ImpactBridge] hidden → mark dirty')
      return
    }
    clearTimer()
    timerRef.current = window.setTimeout(() => {
      if (debug) console.debug('[ImpactBridge] router.refresh()')
      router.refresh()
      dirtyRef.current = false
    }, debounce)
  }, [router, debounce, debug])

  const handleChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Row>) => {
      // Nur Events des eigenen Users berücksichtigen (safety)
      const uid = (payload.new as any)?.user_id ?? (payload.old as any)?.user_id
      if (uid !== userId) return

      // Optional: Nur echte Relevanz refreshen (Score/Counts/Impressions/Views)
      const n = payload.new as Partial<Row> | undefined
      const o = payload.old as Partial<Row> | undefined
      const relevantChanged =
        !o ||
        !n ||
        n.impact_score !== o.impact_score ||
        n.impressions !== o.impressions ||
        n.views !== o.views ||
        n.likes !== o.likes ||
        n.comments !== o.comments

      if (relevantChanged) {
        if (debug) console.debug('[ImpactBridge] relevant change → schedule refresh', { event: payload.eventType })
        doRefresh()
      }
    },
    [doRefresh, userId, debug]
  )

  useEffect(() => {
    mountedRef.current = true
    visibleRef.current = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true

    if (!userId) return

    // Sichtbarkeits-/Online-Events
    const onVis = () => {
      visibleRef.current = document.visibilityState === 'visible'
      if (debug) console.debug('[ImpactBridge] visibility:', visibleRef.current ? 'visible' : 'hidden')
      if (visibleRef.current && dirtyRef.current) {
        if (debug) console.debug('[ImpactBridge] flush dirty on visible')
        doRefresh()
      }
    }
    const onOnline = () => {
      if (debug) console.debug('[ImpactBridge] online → refresh')
      doRefresh()
    }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('online', onOnline)

    // Realtime Channel (zwei gezielte Listener statt '*')
    const channel = supabase
      .channel(`impact-score:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'creator_session_metrics', filter: `user_id=eq.${userId}` },
        handleChange
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'creator_session_metrics', filter: `user_id=eq.${userId}` },
        handleChange
      )
      .subscribe((status) => {
        if (debug) console.debug('[ImpactBridge] status:', status)
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // Minimaler Backoff – Supabase versucht i. d. R. selbst zu reconnecten;
          // wir triggern nur ein UI-Refresh, wenn wieder sichtbar/online.
          doRefresh()
        }
      })

    return () => {
      mountedRef.current = false
      clearTimer()
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('online', onOnline)
      // Channel sauber entfernen
      supabase.removeChannel(channel)
    }
  }, [userId, handleChange, doRefresh, debug])

  return null
}
