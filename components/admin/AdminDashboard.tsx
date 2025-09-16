// components/admin/AdminDashboard.tsx
'use client'

import * as React from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Users,
  FolderKanban,
  Images,
  Film,
  AlertTriangle,
  Clock4,
  CheckCircle2,
  Link as LinkIcon,
  Globe2,
  Bot,
  Megaphone,
  CreditCard,
  ShieldCheck,
  Settings2,
  LayoutGrid,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

/* ───────────────────────── Types ───────────────────────── */

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

/* ───────────────────────── Component ───────────────────────── */

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

  // kleine Heuristik für CIC-Empfehlungen (Trend 7 vs. 7 Tage davor)
  const trend = React.useMemo(() => {
    if (!series.length) return { sessions: 0, media: 0 }
    const last7 = series.slice(-7)
    const prev7 = series.slice(-14, -7)
    const sum = (arr: SeriesPoint[], key: 'sessions' | 'media') =>
      arr.reduce((a, b) => a + (b?.[key] ?? 0), 0)
    const sNow = sum(last7, 'sessions')
    const sPrev = sum(prev7, 'sessions') || 1
    const mNow = sum(last7, 'media')
    const mPrev = sum(prev7, 'media') || 1
    return {
      sessions: Math.round(((sNow - sPrev) / sPrev) * 100),
      media: Math.round(((mNow - mPrev) / mPrev) * 100),
    }
  }, [series])

  // Module-Definition (Status abgeleitet aus Counts/Jobs; Suchfilter)
  const [q, setQ] = React.useState('')
  const modules = React.useMemo(() => {
    const status = {
      active: 'Aktiv',
      prep: 'Vorbereitet',
      off: 'Inaktiv',
    } as const

    return [
      {
        key: 'bookings',
        title: 'Buchung & Reiseangebote',
        icon: <CreditCard className="h-4 w-4" />,
        href: '/admin/payments',
        status: counts.sessions > 0 ? status.active : status.prep,
      },
      {
        key: 'content',
        title: 'Content & Creator',
        icon: <FolderKanban className="h-4 w-4" />,
        href: '/admin/content',
        status: counts.users > 0 ? status.active : status.prep,
      },
      {
        key: 'ads',
        title: 'Kampagnen & Ads',
        icon: <Megaphone className="h-4 w-4" />,
        href: '/admin/marketing',
        status: status.prep,
      },
      {
        key: 'media',
        title: 'Medien & Visuals',
        icon: <Images className="h-4 w-4" />,
        href: '/admin/media-studio',
        status: counts.media > 0 ? status.active : status.prep,
      },
      {
        key: 'security',
        title: 'Sicherheit & Compliance',
        icon: <ShieldCheck className="h-4 w-4" />,
        href: '/admin/security',
        status: status.prep,
      },
      {
        key: 'copilot',
        title: 'CoPilot Pro & KI',
        icon: <Bot className="h-4 w-4" />,
        href: '/admin/copilot',
        status: status.active,
      },
      {
        key: 'localization',
        title: 'Lokalisierung & Domains',
        icon: <Globe2 className="h-4 w-4" />,
        href: '/admin/localization',
        status: status.prep,
      },
      {
        key: 'settings',
        title: 'Einstellungen & Rechtliches',
        icon: <Settings2 className="h-4 w-4" />,
        href: '/admin/settings',
        status: status.prep,
      },
    ].filter((m) => m.title.toLowerCase().includes(q.toLowerCase()))
  }, [counts.media, counts.sessions, counts.users, q])

  // ToDo-Liste (lokal, als Platzhalter für Server-Tasks)
  const [todos, setTodos] = React.useState([
    { id: 't1', text: 'Prüfe verdächtige Logins', done: false },
    { id: 't2', text: 'Überarbeite Kampagnen-Budget (CH/DE)', done: false },
    { id: 't3', text: 'Creator-Verifizierung: 3 Anträge', done: false },
  ])

  return (
    <main className={cn('mx-auto w-full max-w-7xl px-4 md:px-8 py-6 md:py-8', className)}>
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Willkommen, {userEmail || 'Admin'} · Live-Status aktiv
          </p>
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

      {/* KPIs */}
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

      {/* Shortcuts */}
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ShortcutCard href="/admin/content" label="Inhalte" icon={<FolderKanban className="h-4 w-4" />} />
        <ShortcutCard href="/admin/users" label="Creator" icon={<Users className="h-4 w-4" />} />
        <ShortcutCard href="/admin/marketing" label="Kampagnen" icon={<Megaphone className="h-4 w-4" />} />
        <ShortcutCard href="/admin/payments" label="Zahlungen" icon={<CreditCard className="h-4 w-4" />} />
      </section>

      {/* Aktivität + Live-Traffic */}
      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4 lg:col-span-2">
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
        </div>

        {/* Live-Traffic Placeholder / Weltkarte */}
        <div className="rounded-2xl border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Live-Traffic</h2>
            <Globe2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <WorldMapSkeleton />
          <p className="mt-3 text-xs text-muted-foreground">
            Verbinde später <code>react-simple-maps</code> oder eine Realtime-Quelle (z. B. Edge-Logs, Analytics API),
            um Live-Pins & Heatmaps zu rendern.
          </p>
        </div>
      </section>

      {/* Module & Funktionen + CIC */}
      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Module & Funktionen */}
        <div className="rounded-2xl border bg-card p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">Module &amp; Funktionen</h3>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Module suchen…"
                className="pl-8 h-8 w-56"
              />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {modules.map((m) => (
              <ModuleCard key={m.key} title={m.title} href={m.href} status={m.status} icon={m.icon} />
            ))}
            {modules.length === 0 && (
              <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                Keine Treffer für „{q}“.
              </div>
            )}
          </div>
        </div>

        {/* CIC – Creative Intelligence Center */}
        <div className="rounded-2xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">CIC – Empfehlungen</h3>
          <ul className="space-y-3">
            <Suggestion
              title="Trend: Sessions"
              detail={`${trend.sessions >= 0 ? '+' : ''}${trend.sessions}% vs. Vorwoche`}
              onAccept={() => toast.success('Performance-Optimierung gestartet')}
              onReject={() => toast('Vorschlag verworfen')}
            />
            <Suggestion
              title="Trend: Medien"
              detail={`${trend.media >= 0 ? '+' : ''}${trend.media}% vs. Vorwoche`}
              onAccept={() => toast.success('Medien-Push geplant')}
              onReject={() => toast('Vorschlag verworfen')}
            />
            <Suggestion
              title="Spam-Check"
              detail="Prüfe neue Creator-Accounts & ungewöhnliche Upload-Spitzen"
              onAccept={() => toast.success('Spam-Review-Task angelegt')}
              onReject={() => toast('Vorschlag verworfen')}
            />
          </ul>
        </div>
      </section>

      {/* Neueste Sessions / Jobs */}
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
                      #{j.id.slice(0, 8)} · <StatusBadge status={j.status} />
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
          <div className="mt-3 flex justify-end">
            <Link
              href="/admin/media-studio/review"
              className="text-xs text-primary underline-offset-4 hover:underline"
            >
              Zum Medien-Studio
            </Link>
          </div>
        </div>
      </section>

      {/* CoPilot Pro & To-Dos */}
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* CoPilot Panel */}
        <div className="rounded-2xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">CoPilot Pro – Schnellsteuerung</h3>
          <CopilotBox />
        </div>

        {/* To-Dos */}
        <div className="rounded-2xl border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">To-Dos & Admin-Aktionen</h3>
          <ul className="space-y-2">
            {todos.map((t) => (
              <li key={t.id} className="flex items-center gap-3">
                <input
                  id={t.id}
                  type="checkbox"
                  checked={t.done}
                  onChange={(e) =>
                    setTodos((prev) =>
                      prev.map((x) => (x.id === t.id ? { ...x, done: e.target.checked } : x))
                    )
                  }
                  className="h-4 w-4 rounded border"
                />
                <label htmlFor={t.id} className={cn('text-sm', t.done && 'line-through text-muted-foreground')}>
                  {t.text}
                </label>
              </li>
            ))}
          </ul>
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
      <div className="mt-2 text-2xl font-semibold tabular-nums">{value.toLocaleString('de-CH')}</div>
      {subtitle ? <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div> : null}
    </div>
  )
}

function ShortcutCard({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border bg-card p-4 transition hover:bg-accent/40"
    >
      <div className="flex items-center justify-between">
        <p className="font-medium">{label}</p>
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Öffnen</p>
    </Link>
  )
}

function ModuleCard({
  title,
  href,
  status,
  icon,
}: {
  title: string
  href: string
  status: 'Aktiv' | 'Vorbereitet' | 'Inaktiv'
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-2">
        <div className="text-muted-foreground">{icon}</div>
        <p className="font-medium">{title}</p>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
            status === 'Aktiv' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
            status === 'Vorbereitet' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
            status === 'Inaktiv' && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          )}
        >
          {status}
        </span>
        <Link href={href} className="text-xs text-primary underline-offset-4 hover:underline">
          Jetzt anpassen
        </Link>
      </div>
    </div>
  )
}

function Suggestion({
  title,
  detail,
  onAccept,
  onReject,
}: {
  title: string
  detail: string
  onAccept: () => void
  onReject: () => void
}) {
  return (
    <li className="rounded-xl border p-3">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground">{detail}</p>
      <div className="mt-2 flex gap-2">
        <Button size="sm" className="h-7 px-3" onClick={onAccept}>
          Annehmen
        </Button>
        <Button size="sm" variant="secondary" className="h-7 px-3" onClick={onReject}>
          Verwerfen
        </Button>
      </div>
    </li>
  )
}

function CopilotBox() {
  const [prompt, setPrompt] = React.useState('')
  const [busy, setBusy] = React.useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    setBusy(true)
    try {
      // Optional: existiert evtl. nicht – wir fangen 404 ab.
      const res = await fetch('/api/admin/copilot/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      if (!res.ok) throw new Error(String(res.status))
      toast.success('CoPilot: Vorschläge erstellt')
      setPrompt('')
    } catch {
      toast('Kein Backend verbunden – Dummy-Ausführung OK')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
        placeholder="z. B. »Erstelle eine Kampagnenidee für Herbst-Angebote Schweiz«"
        className="w-full rounded-lg border bg-background p-3 text-sm"
      />
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={busy} className="h-9 px-4">
          {busy ? 'Wird gesendet…' : 'Absenden'}
        </Button>
        <Link href="/admin/copilot" className="text-xs text-primary underline-offset-4 hover:underline">
          Erweiterte Ansicht
        </Link>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Hinweis: Backend-Endpunkt <code>/api/admin/copilot/suggest</code> kann später angebunden werden.
      </p>
    </form>
  )
}

function WorldMapSkeleton() {
  return (
    <div className="h-64 w-full rounded-lg border bg-muted/40 grid place-items-center">
      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <LayoutGrid className="h-4 w-4" />
        Weltkarte (Placeholder)
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: LatestJob['status'] }) {
  const map: Record<LatestJob['status'], { label: string; cls: string; icon: React.ReactNode }> = {
    queued: {
      label: 'Queued',
      cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      icon: <Clock4 className="h-3.5 w-3.5" />,
    },
    processing: {
      label: 'Processing',
      cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      icon: <Images className="h-3.5 w-3.5" />,
    },
    completed: {
      label: 'Completed',
      cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    failed: {
      label: 'Failed',
      cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
    },
    canceled: {
      label: 'Canceled',
      cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
    },
  }
  const s = map[status]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', s.cls)}>
      {s.icon}
      {s.label}
    </span>
  )
}
