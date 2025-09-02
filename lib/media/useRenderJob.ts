'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Database } from '@/types/supabase'

type RenderJob = Database['public']['Tables']['render_jobs']['Row']
// DB nutzt i.d.R. 'type' (nicht 'job_type')
type JobType = 'photo' | 'video' | 'thumbnail'

type State = { job: RenderJob | null; loading: boolean; error: string | null }

const SHOULD_SIMULATE =
  typeof process !== 'undefined' &&
  process.env.NEXT_PUBLIC_RENDER_SIMULATE === '1'

export function useRenderJob() {
  const [state, setState] = useState<State>({ job: null, loading: false, error: null })
  const timer = useRef<NodeJS.Timeout | null>(null)

  const stopPolling = useCallback(() => {
    if (timer.current) { clearInterval(timer.current); timer.current = null }
  }, [])

  const poll = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/media/render?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'poll failed')
      const job = json.job as RenderJob
      setState(s => ({ ...s, job }))
      const done = ['succeeded', 'failed', 'canceled'].includes((job as any).status)
      if (done) stopPolling()
    } catch (e: any) {
      setState(s => ({ ...s, error: e?.message || 'poll error' }))
      stopPolling()
    }
  }, [stopPolling])

  const startForSession = useCallback(async (sessionId: string, jobType: JobType = 'photo') => {
    setState({ job: null, loading: true, error: null })
    stopPolling()
    try {
      const res = await fetch('/api/media/render', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId, jobType }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'start failed')
      const job = json.job as RenderJob
      setState({ job, loading: false, error: null })

      if (SHOULD_SIMULATE) {
        fetch(`/api/media/render/simulate?id=${encodeURIComponent((job as any).id)}`, { method: 'POST' }).catch(() => {})
      }
      poll((job as any).id)
      timer.current = setInterval(() => poll((job as any).id), 2000)
      return job
    } catch (e: any) {
      setState({ job: null, loading: false, error: e?.message || 'start error' })
      throw e
    }
  }, [poll, stopPolling])

  const startForEditDoc = useCallback(async (editDocId: string, jobType: JobType = 'photo') => {
    setState({ job: null, loading: true, error: null })
    stopPolling()
    try {
      const res = await fetch('/api/media/render', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ editDocId, jobType }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'start failed')
      const job = json.job as RenderJob
      setState({ job, loading: false, error: null })

      if (SHOULD_SIMULATE) {
        fetch(`/api/media/render/simulate?id=${encodeURIComponent((job as any).id)}`, { method: 'POST' }).catch(() => {})
      }
      poll((job as any).id)
      timer.current = setInterval(() => poll((job as any).id), 2000)
      return job
    } catch (e: any) {
      setState({ job: null, loading: false, error: e?.message || 'start error' })
      throw e
    }
  }, [poll, stopPolling])

  const cancel = useCallback(() => { stopPolling() }, [stopPolling])

  useEffect(() => () => { stopPolling() }, [stopPolling])

  return { job: state.job, loading: state.loading, error: state.error, startForSession, startForEditDoc, cancel }
}
