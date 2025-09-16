// components/admin/ControlCenter.tsx
// (identisch wie zuvor – nur unten zwei Widgets ergänzen)
'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import CopilotPanel from '@/components/admin/CopilotPanel'
import SecurityWidget from '@/components/admin/widgets/SecurityWidget'
import PaymentsWidget from '@/components/admin/widgets/PaymentsWidget'
import {
  Users, FolderKanban, Images, Film, AlertTriangle, Rocket, Wrench,
} from 'lucide-react'
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

type KPICounts = { users:number; sessions:number; media:number; jobsQueued:number; jobsProcessing:number; jobsFailed:number }
type SeriesPoint = { date:string; sessions:number; media:number }
type LatestSession = { id:string; title:string|null; visibility:'private'|'public'|null; rating:number|null; created_at:string|null }
type LatestJob = { id:string; status:'queued'|'processing'|'completed'|'failed'|'canceled'; progress:number|null; video_url:string|null; created_at:string|null }

export default function ControlCenter({
  userEmail, counts, series, latestSessions, latestJobs, className,
}: {
  userEmail: string; counts: KPICounts; series: SeriesPoint[]; latestSessions: LatestSession[]; latestJobs: LatestJob[]; className?: string
}) {
  const dtf = React.useMemo(() => new Intl.DateTimeFormat('de-CH', { dateStyle:'medium', timeStyle:'short' }), [])

  return (
    <main className={cn('mx-auto w-full max-w-7xl px-4 md:px-8 py-6 md:py-8', className)}>
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Jetnity – Control Center</h1>
          <p className="text-sm text-muted-foreground">Willkommen, {userEmail || 'Admin'} • Alles auf einen Blick</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/users" className="text-sm text-primary underline-offset-4 hover:underline">Nutzer</Link>
          <Link href="/admin/media-studio/review" className="text-sm text-primary underline-offset-4 hover:underline">Reviews</Link>
          <Link href="/admin/settings" className="text-sm text-primary underline-offset-4 hover:underline">Einstellungen</Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Linke Spalte */}
        <section className="space-y-6">
          {/* KPIs */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KPICard title="Nutzer" value={counts.users} icon={<Users className="h-5 w-5" />} />
            <KPICard title="Sessions" value={counts.sessions} icon={<FolderKanban className="h-5 w-5" />} />
            <KPICard title="Medien" value={counts.media} icon={<Images className="h-5 w-5" />} />
            <KPICard
              title="Render-Jobs"
              value={counts.jobsQueued + counts.jobsProcessing}
              subtitle={`${counts.jobsQueued} in Queue · ${counts.jobsProcessing} aktiv`}
              icon={<Film className="h-5 w-5" />}
            />
          </div>

          {/* Aktivität + Quick Actions */}
          <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
            {/* Chart */}
            <div className="rounded-2xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Aktivität (14 Tage)</h2>
                <Link href="/admin/analytics" className="text-xs text-primary underline-offset-4 hover:underline">Details</Link>
              </div>
              <div className="mt-2 h-64 w-full">
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
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border bg-card p-4">
              <h3 className="mb-3 text-sm font-semibold">Quick-Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <QuickAction href="/admin/users" label="Neuen Nutzer anlegen" />
                <QuickAction href="/admin/media-studio/review" label="Review prüfen" />
                <QuickAction href="/admin/marketing" label="Kampagne starten" />
                <QuickAction href="/admin/security" label="Sicherheitscenter" />
              </div>
            </div>
          </div>

          {/* Module */}
          <div className="rounded-2xl border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Module & Funktionen</h3>
              <div className="w-64">
                <Input placeholder="Module suchen…" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <ModuleCard title="Users & Creator" href="/admin/users" status="aktiv" />
              <ModuleCard title="Media-Studio Review" href="/admin/media-studio/review" status="aktiv" />
              <ModuleCard title="Kampagnen & Ads" href="/admin/marketing" status="vorbereitet" />
              <ModuleCard title="Zahlungen" href="/admin/payments" status="vorbereitet" />
              <ModuleCard title="Security & Protokolle" href="/admin/security" status="aktiv" />
              <ModuleCard title="Lokalisierung & Domains" href="/admin/localization" status="inaktiv" />
            </div>
          </div>

          {/* NEU: Security + Payments zusammen */}
          <div className="grid gap-6 lg:grid-cols-2">
            <SecurityWidget />
            <PaymentsWidget />
          </div>

          {/* Feeds */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Feed title="Neueste Sessions" items={latestSessions.map(s => ({
              id: s.id, primary: s.title || 'Ohne Titel',
              secondary: `${s.visibility === 'public' ? 'Öffentlich' : 'Privat'} · ${s.created_at ? dtf.format(new Date(s.created_at)) : ''}`,
              meta: typeof s.rating === 'number' ? `Score ${s.rating}` : undefined,
            }))} />
            <Feed title="Render-Jobs" items={latestJobs.map(j => ({
              id: j.id, primary: `#${j.id.slice(0,8)}`, secondary: j.created_at ? dtf.format(new Date(j.created_at)) : '',
              meta: typeof j.progress === 'number' ? `${j.progress}%` : j.status,
            }))} />
          </div>
        </section>

        {/* Rechte Spalte */}
        <aside className="lg:sticky lg:top-16 h-max">
          <CopilotPanel className="rounded-2xl border bg-card" />
        </aside>
      </div>
    </main>
  )
}

/* Helpers (unverändert/leicht gekürzt) */
function KPICard({ title, value, subtitle, icon }:{ title:string; value:number; subtitle?:string; icon?:React.ReactNode }){return(
  <div className="rounded-2xl border bg-card p-4"><div className="flex items-center justify-between">
    <p className="text-sm text-muted-foreground">{title}</p><div className="text-muted-foreground">{icon}</div></div>
    <div className="mt-2 text-2xl font-semibold">{value.toLocaleString('de-CH')}</div>
    {subtitle ? <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div> : null}
  </div>)}
function ModuleCard({ title, href, status }:{ title:string; href:string; status:'aktiv'|'vorbereitet'|'inaktiv' }){const map={aktiv:'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300', vorbereitet:'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300', inaktiv:'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'} as const;return(
  <Link href={href} className="block rounded-xl border p-4 hover:bg-muted/50 transition">
    <div className="flex items-center justify-between"><h4 className="font-medium">{title}</h4>
      <Badge className={cn('text-[10px]', map[status])}>{status}</Badge></div>
    <p className="mt-1 text-xs text-muted-foreground">Jetzt anpassen →</p></Link>)}
function QuickAction({ href, label }:{ href:string; label:string }){return(
  <Link href={href} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted">{label}</Link>)}
function Feed({ title, items }:{title:string; items:{id:string;primary:string;secondary?:string;meta?:string}[]}){return(
  <div className="rounded-2xl border bg-card p-4"><h3 className="mb-3 text-sm font-semibold">{title}</h3>
  {items.length? <ul className="divide-y">{items.map(i=>(
    <li key={i.id} className="flex items-center justify-between py-2">
      <div className="min-w-0"><p className="truncate text-sm font-medium">{i.primary}</p>
      {i.secondary && <p className="truncate text-xs text-muted-foreground">{i.secondary}</p>}</div>
      {i.meta && <div className="ml-3 shrink-0 text-xs text-muted-foreground">{i.meta}</div>}
    </li>))}</ul>:<p className="text-sm text-muted-foreground">Keine Einträge.</p>}</div>)}
