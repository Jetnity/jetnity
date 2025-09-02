// components/admin/AdminDashboard.tsx
'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Users, FolderKanban, Images, Film, AlertTriangle, Clock4, CheckCircle2, Link as LinkIcon
} from 'lucide-react'
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { toast } from 'sonner'
import Link from 'next/link'

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

export default function AdminDashboard({
  userEmail,
  counts,
  series,
  latestSessions,
  latestJobs,
  className,
}: {
  userEmail: string
  counts: KPICounts
  series: SeriesPoint[]
  latestSessions: LatestSession[]
  latestJobs: LatestJob[]
  className?: string
}) {
  const dtf = React.useMemo(
    () =>
      new Intl.DateTimeFormat('de-CH', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    []
  )

  const copyAdminLink = async () => {
    const href = '/admin'
    try {
      await navigator.clipboard.writeText(
        (typeof window !== 'undefined' ? window.location.origin : '') + href
      )
      toast.success('Admin-Link kopiert.')
    } catch {
      toast.error('Konnte Link nicht kopieren.')
    }
  }

  return (
    <main className={cn('mx-auto w-full max-w-7xl px-4 md:px-8 py-6 md:py-8', className)}>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Willkommen, {userEmail || 'Admin'}.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={copyAdminLink} className="gap-2">
            <LinkIcon className="h-4 w-4" />
            Link kopieren
          </Button>
          <Link href="/creator-dashboard" className="text-sm text-primary underline-offset-4 hover:underline">
            Zurück zum Creator-Dashboard
          </Link>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Nutzer" value={counts.users} icon={<Users className="h-5 w-5" />} />
        <KPICard title="Sessions" value={counts.sessions} icon={<FolderKanban className="h-5 w-5" />} />
        <KPICard title="Medien" value={counts.media} icon={<Images className="h-5 w-5" />} />
        <KPICard
          title="Render-Jobs"
          value={counts.jobsQueued + counts.jobsProcessing}
          subtitle={`${counts.jobsQueued} in Queue · ${counts.jobsProcessing} aktiv`}
          icon={<Film className="h-5 w-5" />}
        />
      </section>

      {/* Timeline */}
      <section className="mt-8 rounded-2xl border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Aktivität (14 Tage)</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopOpacity={0.6} />
                  <stop offset="95%" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopOpacity={0.6} />
                  <stop offset="95%" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeOpacity={0.2} vertical={false} />
              <XAxis dataKey="date" tickMargin={8} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="sessions" name="Sessions" strokeOpacity={0.9} fill="url(#g1)" />
              <Area type="monotone" dataKey="media" name="Medien" strokeOpacity={0.9} fill="url(#g2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Latest tables */}
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Sessions */}
        <div className="rounded-2xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Neueste Sessions</h3>
          {latestSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Einträge.</p>
          ) : (
            <ul className="divide-y">
              {latestSessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.title || 'Ohne Titel'}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.visibility === 'public' ? 'Öffentlich' : 'Privat'} ·{' '}
                      {s.created_at ? dtf.format(new Date(s.created_at)) : ''}
                    </p>
                  </div>
                  {typeof s.rating === 'number' ? (
                    <div className="ml-3 shrink-0 flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Score</span>
                      <span className="font-semibold">{s.rating}</span>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Jobs */}
        <div className="rounded-2xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Render-Jobs</h3>
          {latestJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Einträge.</p>
          ) : (
            <ul className="divide-y">
              {latestJobs.map((j) => (
                <li key={j.id} className="flex items-center justify-between py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      #{j.id.slice(0, 8)} ·{' '}
                      <StatusBadge status={j.status} />
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {j.created_at ? dtf.format(new Date(j.created_at)) : ''}
                    </p>
                  </div>
                  <div className="ml-3 shrink-0 text-xs text-muted-foreground">
                    {typeof j.progress === 'number' ? `${j.progress}%` : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  )
}

/* ────────────────── Small UI helpers ────────────────── */

function KPICard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string
  value: number
  subtitle?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <div className="mt-2 text-2xl font-semibold">{value.toLocaleString('de-CH')}</div>
      {subtitle ? <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div> : null}
    </div>
  )
}

function StatusBadge({ status }: { status: LatestJob['status'] }) {
  const map: Record<LatestJob['status'], { label: string; cls: string; icon: React.ReactNode }> = {
    queued: {
      label: 'Queued',
      cls:
        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      icon: <Clock4 className="h-3.5 w-3.5" />,
    },
    processing: {
      label: 'Processing',
      cls:
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      icon: <Images className="h-3.5 w-3.5" />,
    },
    completed: {
      label: 'Completed',
      cls:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    failed: {
      label: 'Failed',
      cls:
        'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
    },
    canceled: {
      label: 'Canceled',
      cls:
        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
    },
  }
  const s = map[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium',
        s.cls
      )}
    >
      {s.icon}
      {s.label}
    </span>
  )
}
