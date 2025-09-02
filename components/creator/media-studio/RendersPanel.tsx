'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { RefreshCw, ExternalLink } from 'lucide-react'
import { cn as _cn } from '@/lib/utils'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

type RenderJob = Database['public']['Tables']['render_jobs']['Row']

export default function RendersPanel({
  userId,
  sessionId = null,
  className,
}: {
  userId: string
  sessionId?: string | null
  className?: string
}) {
  const [jobs, setJobs] = useState<RenderJob[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      // Einfacher & robuster: direkt nach user + (optional) session filtern
      let q = supabase
        .from('render_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (sessionId) q = q.eq('session_id', sessionId)

      const { data, error } = await q
      if (error) throw error
      setJobs(data ?? [])
    } catch (e: any) {
      console.error('[RendersPanel] fetch', e?.message || e)
      setError('Jobs konnten nicht geladen werden.')
      setJobs([])
    } finally {
      setBusy(false)
    }
  }, [userId, sessionId])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  useEffect(() => {
    // Live-Updates für die Jobs dieses Users (optional zusätzlich nach session_id filtern)
    const ch = supabase
      .channel('render_jobs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'render_jobs',
          filter: `user_id=eq.${userId}${sessionId ? `,session_id=eq.${sessionId}` : ''}`,
        } as any,
        (p) => {
          setJobs((prev) => {
            if (p.eventType === 'INSERT') return [p.new as RenderJob, ...prev]
            if (p.eventType === 'UPDATE') return prev.map((j) => (j.id === (p.new as RenderJob).id ? (p.new as RenderJob) : j))
            if (p.eventType === 'DELETE') return prev.filter((j) => j.id !== (p.old as RenderJob).id)
            return prev
          })
        }
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(ch)
    }
  }, [userId, sessionId])

  async function openOutput(job: RenderJob) {
    const url = (job as any).output_url as string | null
    if (!url) return

    // Fall 1: Volle URL
    if (/^https?:\/\//i.test(url)) {
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
    // Fall 2: "bucket/path"
    const [bucket, ...rest] = url.split('/')
    const path = rest.join('/')
    if (!bucket || !path) return
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 30)
    if (!error && data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  const list = useMemo(() => jobs.slice(0, 25), [jobs])

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {sessionId ? 'Renders dieser Session' : 'Letzte Renders (alle)'}
        </div>
        <Button size="sm" variant="outline" onClick={fetchJobs} disabled={busy}>
          <RefreshCw className={cn('mr-2 h-4 w-4', busy && 'animate-spin')} />
          Aktualisieren
        </Button>
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Render-Jobs.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((j) => {
            // Neues Schema (robust mit Fallbacks)
            const rawStatus = (j as any).status as string | undefined
            const progress = (j as any).progress as number | null
            const jobType = ((j as any).job_type ?? (j as any).type) as string | undefined
            const logs = (j as any).logs as string | null

            // UI-Status normalisieren
            const uiStatus = normalizeStatus(rawStatus)

            return (
              <li key={(j as any).id} className="rounded-lg border bg-card/60 p-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <StatusBadge status={uiStatus} />
                      <span className="truncate text-muted-foreground">{jobType ?? 'export'}</span>
                      <span className="text-muted-foreground">·</span>
                      <time className="truncate text-muted-foreground">
                        {new Date((j as any).created_at).toLocaleString()}
                      </time>
                    </div>

                    <div className="mt-2 h-1.5 w-40 overflow-hidden rounded bg-muted">
                      <div
                        className={cn(
                          'h-full transition-all',
                          uiStatus === 'failed' ? 'bg-red-500' : 'bg-foreground'
                        )}
                        style={{ width: `${Math.max(0, Math.min(100, progress ?? (uiStatus === 'succeeded' ? 100 : 0)))}%` }}
                      />
                    </div>

                    {uiStatus === 'failed' && logs && (
                      <p className="mt-1 line-clamp-2 text-xs text-destructive">{logs}</p>
                    )}
                  </div>

                  <div className="shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!((j as any).output_url) || uiStatus !== 'succeeded'}
                      onClick={() => openOutput(j)}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Öffnen
                    </Button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function normalizeStatus(status?: string): 'queued' | 'processing' | 'succeeded' | 'failed' | 'canceled' {
  switch ((status ?? '').toLowerCase()) {
    case 'queued':
      return 'queued'
    case 'running':
    case 'processing':
      return 'processing'
    case 'completed':
    case 'succeeded':
      return 'succeeded'
    case 'failed':
      return 'failed'
    case 'canceled':
      return 'canceled'
    default:
      return 'queued'
  }
}

function StatusBadge({
  status,
}: {
  status: 'queued' | 'processing' | 'succeeded' | 'failed' | 'canceled'
}) {
  const map: Record<string, string> = {
    queued: 'bg-gray-100 text-gray-700',
    processing: 'bg-blue-100 text-blue-700',
    succeeded: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-700',
    canceled: 'bg-amber-100 text-amber-700',
  }
  return (
    <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', map[status] || map.queued)}>
      {String(status).toUpperCase()}
    </span>
  )
}
