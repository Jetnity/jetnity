'use client'

import * as React from 'react'
import { supabase } from '@/lib/supabase/client'
import { incrementSessionView } from '@/lib/supabase/actions'
import type { Database } from '@/types/supabase'
import { Eye, MessageCircle, Star, Zap, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Metric = Database['public']['Tables']['creator_session_metrics']['Row']

interface Props { sessionId: string }

const VIEW_TTL_MIN = 30

function getDeviceId() {
  if (typeof window === 'undefined') return null
  const KEY = 'jetnity:device-id'
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem(KEY, id)
  }
  return id
}

function shouldCountView(sessionId: string) {
  if (typeof window === 'undefined') return false
  try {
    const key = `viewed:${sessionId}`
    const raw = sessionStorage.getItem(key)
    const now = Date.now()
    if (!raw) {
      sessionStorage.setItem(key, String(now))
      return true
    }
    const last = Number(raw)
    const diffMin = (now - last) / (1000 * 60)
    if (diffMin >= VIEW_TTL_MIN) {
      sessionStorage.setItem(key, String(now))
      return true
    }
    return false
  } catch {
    return true
  }
}

function computeImpact(m: Metric | null, rating: number | null | undefined) {
  if (m?.impact_score != null) return Math.round(Number(m.impact_score))
  const views = Number(m?.views || 0)
  const comments = Number(m?.comments || 0)
  const likes = Number(m?.likes || 0)
  const r = Number(rating || 0)
  return Math.round(views * 0.35 + comments * 1.5 + likes * 1.0 + r * 1.2)
}

export default function SessionViewTracker({ sessionId }: Props) {
  const [metrics, setMetrics] = React.useState<Metric | null>(null)
  const [rating, setRating] = React.useState<number | null>(null)
  const [errored, setErrored] = React.useState(false)
  const [liked, setLiked] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    setLiked(localStorage.getItem(`like:${sessionId}`) === '1')
  }, [sessionId])

  // View zählen (sichtbar + TTL)
  React.useEffect(() => {
    let timer: any
    const onVisible = async () => {
      if (document.visibilityState !== 'visible') return
      clearTimeout(timer)
      timer = setTimeout(async () => {
        try {
          if (shouldCountView(sessionId)) {
            await incrementSessionView(sessionId)            // Server Action
          }
        } catch {
          try {                                             // RPC-Fallback
            await supabase.rpc('increment_view', { session_id: sessionId })
          } catch { /* noop */ }
        }
      }, 2000)
    }
    onVisible()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [sessionId])

  // Initial laden (Metrics + Rating)
  React.useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const [metricRes, sessionRes] = await Promise.all([
          supabase.from('creator_session_metrics').select('*').eq('session_id', sessionId).maybeSingle(),
          supabase.from('creator_sessions').select('rating').eq('id', sessionId).maybeSingle(),
        ])
        if (!alive) return
        setMetrics((metricRes.data as Metric) ?? null)
        setRating(sessionRes.data?.rating ?? null)
      } catch {
        if (alive) setErrored(true)
      }
    }
    load()
    return () => { alive = false }
  }, [sessionId])

  // Realtime (optional in Supabase aktivieren)
  React.useEffect(() => {
    const channel = supabase
      .channel(`csm:${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'creator_session_metrics', filter: `session_id=eq.${sessionId}` },
        (payload: any) => {
          const next = (payload.new || payload.record) as Metric | undefined
          if (next) setMetrics(next)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [sessionId])

  // Likes (simple RPC mit session_id – keine device_id, damit TS-Typen passen)
  const onLike = async () => {
    if (liked) return
    try {
      await supabase.rpc('increment_like', { session_id: sessionId })
      setLiked(true)
      setMetrics((m) => (m ? { ...m, likes: Number(m.likes || 0) + 1 } : m))
      localStorage.setItem(`like:${sessionId}`, '1')
    } catch {
      // Optimistic fallback
      setLiked(true)
      setMetrics((m) => (m ? { ...m, likes: Number(m.likes || 0) + 1 } : m))
      localStorage.setItem(`like:${sessionId}`, '1')
    }
  }

  if (!metrics && !errored) return null

  const impact = computeImpact(metrics, rating)
  const views = Number(metrics?.views ?? 0)
  const comments = Number(metrics?.comments ?? 0)
  const likes = Number(metrics?.likes ?? 0)
  const displayRating = rating ?? 'n/a'

  return (
    <div className="mt-8 border-t pt-4 text-sm text-foreground/70 space-y-3">
      <h3 className="font-semibold text-base">📊 Jetnity Impact</h3>

      <div className="flex flex-wrap gap-4 items-center">
        <span className="inline-flex items-center gap-1">
          <Eye className="h-4 w-4" /> Views: <strong>{views}</strong>
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="h-4 w-4" /> Kommentare: <strong>{comments}</strong>
        </span>
        <span className="inline-flex items-center gap-1">
          <Star className="h-4 w-4" /> Score: <strong>{displayRating}</strong>{typeof displayRating === 'number' && <span>/100</span>}
        </span>
        <span className="inline-flex items-center gap-1">
          <Zap className="h-4 w-4" /> Impact: <strong className="text-foreground">{impact}</strong>
        </span>

        <Button
          type="button"
          size="sm"
          variant={liked ? 'soft' : 'primary'}
          onClick={onLike}
          leftIcon={<Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} /> as any}
          disabled={liked}
        >
          {liked ? `Geliked (${likes})` : `Like (${likes})`}
        </Button>
      </div>

      {errored && <p className="text-xs text-destructive">Hinweis: Metriken konnten nicht geladen werden.</p>}
    </div>
  )
}
