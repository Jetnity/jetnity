'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

type MediaRow = Database['public']['Tables']['session_media']['Row']

export function useGallery({
  userId,
  sessionId,
  pageSize = 30,
}: { userId: string; sessionId?: string | null; pageSize?: number }) {
  const [items, setItems] = useState<MediaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const cursorRef = useRef<string | null>(null) // created_at Cursor (DESC)

  const baseQuery = useCallback(() => {
    let q = supabase
      .from('session_media')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(pageSize)
    if (sessionId) q = q.eq('session_id', sessionId)
    return q
  }, [userId, sessionId, pageSize])

  // Initial load
  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true); setHasMore(true); cursorRef.current = null
      const { data, error } = await baseQuery()
      if (!mounted) return
      if (error) { console.error('[gallery] load', error.message); setItems([]); setHasMore(false) }
      else {
        setItems(data ?? [])
        setHasMore((data?.length ?? 0) === pageSize)
        cursorRef.current = data?.[data.length - 1]?.created_at ?? null
      }
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [baseQuery])

  // Load more (cursor)
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    try {
      const cur = cursorRef.current
      let q = baseQuery()
      if (cur) q = q.lt('created_at', cur)
      const { data, error } = await q
      if (error) throw error
      setItems((prev) => [...prev, ...(data ?? [])])
      setHasMore((data?.length ?? 0) === pageSize)
      cursorRef.current = data?.[data.length - 1]?.created_at ?? cursorRef.current
    } catch (e: any) {
      console.error('[gallery] load more', e?.message || e)
    } finally {
      setLoadingMore(false)
    }
  }, [baseQuery, hasMore, loadingMore, pageSize])

  // Realtime
  useEffect(() => {
    const filterParts = [`user_id=eq.${userId}`]
    if (sessionId) filterParts.push(`session_id=eq.${sessionId}`)
    const filter = filterParts.join('&')

    const ch = supabase.channel(`session_media_live_${userId}_${sessionId ?? 'all'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_media', filter }, (p) => {
        setItems((prev) => {
          if (p.eventType === 'INSERT') {
            const row = p.new as MediaRow
            if (prev.some((x) => x.id === row.id)) return prev
            return [row, ...prev]
          }
          if (p.eventType === 'UPDATE') {
            const row = p.new as MediaRow
            return prev.map((x) => (x.id === row.id ? row : x))
          }
          if (p.eventType === 'DELETE') {
            const row = p.old as MediaRow
            return prev.filter((x) => x.id !== row.id)
          }
          return prev
        })
      })
      .subscribe()

    return () => { void supabase.removeChannel(ch) }
  }, [userId, sessionId])

  const state = useMemo(() => ({
    items, loading, hasMore, loadMore, refresh: async () => { cursorRef.current = null; await loadMore() }
  }), [items, loading, hasMore, loadMore])

  return state
}
