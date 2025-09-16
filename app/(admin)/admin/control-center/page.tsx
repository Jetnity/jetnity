// app/(admin)/admin/control-center/page.tsx
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { unstable_noStore as noStore } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import ControlCenter from '@/components/admin/ControlCenter'

type KPICounts = {
  users: number
  sessions: number
  media: number
  jobsQueued: number
  jobsProcessing: number
  jobsFailed: number
}

type SeriesPoint = { date: string; sessions: number; media: number }

type LatestSession = {
  id: string
  title: string | null
  visibility: 'private' | 'public' | null
  rating: number | null
  created_at: string | null
}

type LatestJob = {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'canceled'
  progress: number | null
  video_url: string | null
  created_at: string | null
}

export default async function AdminControlCenter() {
  noStore()
  const supabase = createServerComponentClient()

  // Auth + Admin-Gate (Owner/Admin/Operator/Moderator ODER @jetnity.com)
  const { user } = await requireAdmin().catch(async () => {
    const { data: auth } = await supabase.auth.getUser()
    const u = auth?.user
    if (!u) redirect('/login')
    const emailOk = (u.email ?? '').toLowerCase().endsWith('@jetnity.com')
    if (!emailOk) redirect('/unauthorized')
    return { user: u }
  })

  const SINCE = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000)

  // Kleine Helfer
  const safeCount = async (q: any) => {
    try {
      const { count } = await q
      return count ?? 0
    } catch {
      return 0
    }
  }
  const safeList = async <T,>(q: any): Promise<T[]> => {
    try {
      const { data } = await q
      return (data ?? []) as T[]
    } catch {
      return []
    }
  }

  // Parallel laden
  const [
    usersCount,
    sessionsCount,
    mediaCount,
    jobsQueuedCount,
    jobsProcCount,
    jobsFailedCount,
    sessionsRecent,
    mediaRecent,
    latestSessions,
    latestJobs,
  ] = await Promise.all([
    safeCount(supabase.from('creator_profiles').select('user_id', { count: 'exact', head: true })),
    safeCount(supabase.from('creator_sessions').select('id', { count: 'exact', head: true })),
    safeCount(supabase.from('session_media').select('id', { count: 'exact', head: true })),
    safeCount(supabase.from('render_jobs').select('id', { count: 'exact', head: true }).eq('status', 'queued')),
    safeCount(supabase.from('render_jobs').select('id', { count: 'exact', head: true }).eq('status', 'processing')),
    safeCount(supabase.from('render_jobs').select('id', { count: 'exact', head: true }).eq('status', 'failed')),
    safeList<{ created_at: string }>(
      supabase.from('creator_sessions').select('created_at').gte('created_at', SINCE.toISOString()).order('created_at', { ascending: true })
    ),
    safeList<{ created_at: string }>(
      supabase.from('session_media').select('created_at').gte('created_at', SINCE.toISOString()).order('created_at', { ascending: true })
    ),
    safeList<LatestSession>(
      supabase.from('creator_sessions')
        .select('id, title, visibility, rating, created_at')
        .order('created_at', { ascending: false }).limit(8)
    ),
    safeList<LatestJob>(
      supabase.from('render_jobs')
        .select('id, status, progress, video_url, created_at')
        .order('created_at', { ascending: false }).limit(8)
    ),
  ])

  // 14 Tage Serie
  const days: string[] = []
  const d = new Date(SINCE)
  for (let i = 0; i < 14; i++) {
    days.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() + 1)
  }
  const ses = Object.fromEntries(days.map(k => [k, 0])) as Record<string, number>
  const med = Object.fromEntries(days.map(k => [k, 0])) as Record<string, number>
  sessionsRecent.forEach(r => { const k = r.created_at?.slice(0,10); if (k && k in ses) ses[k]++ })
  mediaRecent.forEach(r => { const k = r.created_at?.slice(0,10); if (k && k in med) med[k]++ })
  const series: SeriesPoint[] = days.map((k) => ({ date: k, sessions: ses[k], media: med[k] }))

  const counts: KPICounts = {
    users: usersCount,
    sessions: sessionsCount,
    media: mediaCount,
    jobsQueued: jobsQueuedCount,
    jobsProcessing: jobsProcCount,
    jobsFailed: jobsFailedCount,
  }

  return (
    <ControlCenter
      userEmail={user.email ?? ''}
      counts={counts}
      series={series}
      latestSessions={latestSessions}
      latestJobs={latestJobs}
    />
  )
}
