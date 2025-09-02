'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Database } from '@/types/supabase'

type RenderJob = Database['public']['Tables']['render_jobs']['Row']
type JobType = RenderJob['job_type']

type State = {
  job: RenderJob | null
  loading: boolean
  error: string | null
}

export function useRenderJob() {
  const [state, setState] = useState<State>({ job: null, loading: false, error: null })
  const timer = useRef<NodeJS.Timeout | null>(null)

  const poll = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/media/render?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'poll failed')
      const job = json.job as RenderJob
      setState((s) => ({ ...s, job }))
      if (['succeeded', 'failed', 'canceled'].includes(job.status)) {
        if (timer.current) clearInterval(timer.current)
        timer.current = null
      }
    } catch (e: any) {
      setState((s) => ({ ...s, error: e?.message || 'poll error' }))
      if (timer.current) clearInterval(timer.current)
      timer.current = null
    }
  }, [])

  const start = useCallback(
    async (params: {
      sessionId?: string
      editDocId?: string
      jobType?: JobType
      sourcePath?: string
      options?: Record<string, any>
    }) => {
      setState({ job: null, loading: true, error: null })
      try {
        const res = await fetch('/api/media/render', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(params),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'start failed')
        const job = json.job as RenderJob
        setState({ job, loading: false, error: null })
        timer.current = setInterval(() => poll(job.id), 1500)
        return job
      } catch (e: any) {
        setState({ job: null, loading: false, error: e?.message || 'start error' })
        throw e
      }
    },
    [poll]
  )

  const cancel = useCallback(() => {
    if (timer.current) clearInterval(timer.current)
    timer.current = null
  }, [])

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [])

  return {
    job: state.job,
    loading: state.loading,
    error: state.error,
    start,
    cancel,
  }
}
