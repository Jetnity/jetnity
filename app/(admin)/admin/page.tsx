// app/admin/page.tsx
export const dynamic = 'force-dynamic'

import { unstable_noStore as noStore } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'
import AdminDashboard from '@/components/admin/AdminDashboard'

type KPICounts = {
  users: number
  sessions: number
  media: number
  jobsQueued: number
  jobsProcessing: number
  jobsFailed: number
}

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

type SeriesPoint = { date: string; sessions: number; media: number }

export default async function AdminPage() {
  noStore()
  const supabase = createServerComponentClient()

  // Auth
  const { data: auth } = await supabase.auth.getUser()
  const user = auth?.user
  if (!user) redirect('/login')

  // Role check
  const [{ data: profile }] = await Promise.all([
    supabase
      .from('creator_profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const emailOk = (user.email ?? '').toLowerCase().endsWith('@jetnity.com')
  const roleOk = ['admin', 'owner', 'operator', 'moderator'].includes(
    (profile?.role as string) || ''
  )

  if (!emailOk && !roleOk) {
    redirect('/unauthorized')
  }

  // Parallel Daten laden
  const SINCE = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000) // letzte 14 Tage inkl. heute

  const [
    sessionsCountRes,
    mediaCountRes,
    usersCountRes,
    jobsQueuedRes,
    jobsProcRes,
    jobsFailedRes,
    sessionsRecentRes,
    mediaRecentRes,
    latestSessionsRes,
    latestJobsRes,
  ] = await Promise.all([
    supabase.from('creator_sessions').select('id', { count: 'exact', head: true }),
    supabase.from('session_media').select('id', { count: 'exact', head: true }),
    supabase.from('creator_profiles').select('user_id', { count: 'exact', head: true }),
    supabase
      .from('render_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'queued'),
    supabase
      .from('render_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'processing'),
    supabase
      .from('render_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'failed'),
    supabase
      .from('creator_sessions')
      .select('created_at')
      .gte('created_at', SINCE.toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('session_media')
      .select('created_at')
      .gte('created_at', SINCE.toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('creator_sessions')
      .select('id, title, visibility, rating, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('render_jobs')
      .select('id, status, progress, video_url, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const counts: KPICounts = {
    users: usersCountRes.count ?? 0,
    sessions: sessionsCountRes.count ?? 0,
    media: mediaCountRes.count ?? 0,
    jobsQueued: jobsQueuedRes.count ?? 0,
    jobsProcessing: jobsProcRes.count ?? 0,
    jobsFailed: jobsFailedRes.count ?? 0,
  }

  // 14-Tage Serie bauen
  const days: string[] = []
  const d = new Date(SINCE)
  for (let i = 0; i < 14; i++) {
    const key = d.toISOString().slice(0, 10)
    days.push(key)
    d.setDate(d.getDate() + 1)
  }
  const ses = Object.create(null) as Record<string, number>
  const med = Object.create(null) as Record<string, number>
  days.forEach((k) => ((ses[k] = 0), (med[k] = 0)))
  ;(sessionsRecentRes.data || []).forEach((r) => {
    const k = (r.created_at as string).slice(0, 10)
    if (ses[k] != null) ses[k]++
  })
  ;(mediaRecentRes.data || []).forEach((r) => {
    const k = (r.created_at as string).slice(0, 10)
    if (med[k] != null) med[k]++
  })
  const series: SeriesPoint[] = days.map((k) => ({ date: k, sessions: ses[k], media: med[k] }))

  const latestSessions = (latestSessionsRes.data || []) as LatestSession[]
  const latestJobs = (latestJobsRes.data || []) as LatestJob[]

  return (
    <AdminDashboard
      userEmail={user.email ?? ''}
      counts={counts}
      series={series}
      latestSessions={latestSessions}
      latestJobs={latestJobs}
    />
  )
}
