// components/creator/media-studio/SessionCard.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import {
  MoreHorizontal, Eye, Lock, Link as LinkIcon, ImageIcon, FileText,
  Activity, BarChart3, Pencil, Trash2, Share2, ExternalLink, Sparkles
} from 'lucide-react'

/* --------------------------------- Types --------------------------------- */

type Visibility = 'public' | 'unlisted' | 'private'

type CoreSession = {
  id: string
  title: string
  status?: string | null
  role?: string | null
  visibility?: Visibility | null
  cover_url?: string | null
  rating?: number | null
  created_at?: string | null
  updated_at?: string | null
}

type Props = {
  session: CoreSession
  /** Basis der Detailseite, Default: '/creator/media-studio/session' */
  hrefBase?: string
  /** Metriken aus DB nachladen (Snippets/Media/Views/Impressions) */
  hydrate?: boolean
  /** Optional eigene Handler – wenn gesetzt, werden sie genutzt */
  onDelete?: (id: string) => void | Promise<void>
  onRename?: (id: string, title: string) => void | Promise<void>
  className?: string
}

/* --------------------------------- Card ---------------------------------- */

export default function SessionCard({
  session,
  hrefBase = '/creator/media-studio/session',
  hydrate = true,
  onDelete,
  onRename,
  className,
}: Props) {
  const href = `${hrefBase}/${session.id}`

  // ---- Live-Metriken (optional) ----
  const [snippetsCount, setSnippetsCount] = useState<number | null>(null)
  const [mediaCount, setMediaCount] = useState<number | null>(null)
  const [views, setViews] = useState<number | null>(null)
  const [impressions, setImpressions] = useState<number | null>(null)

  useEffect(() => {
    if (!hydrate) return
    let alive = true
    ;(async () => {
      try {
        // Counts (HEAD-Select)
        const sn = await supabase
          .from('session_snippets')
          .select('id', { count: 'exact', head: true })
          .eq('session_id', session.id)
        const md = await supabase
          .from('session_media')
          .select('id', { count: 'exact', head: true })
          .eq('session_id', session.id)
        if (alive) {
          setSnippetsCount(sn.count ?? 0)
          setMediaCount(md.count ?? 0)
        }
      } catch {}
      try {
        const { data } = await supabase
          .from('creator_session_metrics')
          .select('impressions,views')
          .eq('session_id', session.id)
          .single()
        if (alive && data) {
          setImpressions((data as any).impressions ?? 0)
          setViews((data as any).views ?? 0)
        }
      } catch {}
    })()
    return () => { alive = false }
  }, [hydrate, session.id])

  const visIcon = useMemo(() => {
    const v = (session.visibility ?? 'private') as Visibility
    if (v === 'public') return <Eye className="h-3.5 w-3.5" />
    if (v === 'unlisted') return <LinkIcon className="h-3.5 w-3.5" />
    return <Lock className="h-3.5 w-3.5" />
  }, [session.visibility])

  const visLabel = useMemo(() => (session.visibility ?? 'private'), [session.visibility])

  const statusText = (session.status ?? 'draft').toString()
  const roleText = session.role || 'Owner'
  const score = typeof session.rating === 'number' ? clamp(session.rating, 0, 100) : null

  const copyLink = useCallback(async () => {
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/story/${session.id}`
      : `/story/${session.id}`
    try { await navigator.clipboard.writeText(url) } catch {}
  }, [session.id])

  const doRename = useCallback(async () => {
    const next = prompt('Neuer Titel:', session.title)
    if (next === null) return
    const title = next.trim().slice(0, 120)
    if (!title || title === session.title) return
    if (onRename) {
      await onRename(session.id, title)
    } else {
      await supabase.from('creator_sessions').update({ title }).eq('id', session.id)
    }
  }, [onRename, session.id, session.title])

  const doDelete = useCallback(async () => {
    if (!confirm('Session wirklich löschen? Dies kann nicht rückgängig gemacht werden.')) return
    if (onDelete) {
      await onDelete(session.id)
    } else {
      await supabase.from('creator_sessions').delete().eq('id', session.id)
    }
  }, [onDelete, session.id])

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-card p-0 shadow-sm transition-all',
        'hover:shadow-md focus-within:ring-2 focus-within:ring-primary/30',
        className
      )}
      role="article"
      aria-labelledby={`session-${session.id}-title`}
    >
      {/* Media / Cover */}
      <Link href={href} className="block">
        <div className="relative h-36 w-full overflow-hidden bg-muted">
          {session.cover_url ? (
            <Image
              src={session.cover_url}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <CoverFallback title={session.title} />
          )}

          {/* Sichtbarkeit + Status */}
          <div className="absolute left-2 top-2 flex items-center gap-1">
            <Badge className="bg-black/60 text-white backdrop-blur">
              {visIcon}
              <span className="ml-1 capitalize">{visLabel}</span>
            </Badge>
            <Badge variant="secondary" className="bg-white/80 backdrop-blur capitalize">
              {statusText}
            </Badge>
          </div>

          {/* Score-Ring */}
          {typeof score === 'number' && (
            <div className="absolute right-2 top-2">
              <ScoreRing value={score} />
            </div>
          )}
        </div>
      </Link>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <Link href={href} className="block">
              <h3
                id={`session-${session.id}-title`}
                className="truncate text-base font-semibold"
                title={session.title}
              >
                {session.title}
              </h3>
            </Link>
            <p className="mt-0.5 text-xs text-muted-foreground">Rolle: {roleText}</p>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href={href} className="contents">
                <DropdownMenuItem>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Öffnen
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={copyLink}>
                <Share2 className="mr-2 h-4 w-4" />
                Link kopieren
              </DropdownMenuItem>
              <DropdownMenuItem onClick={doRename}>
                <Pencil className="mr-2 h-4 w-4" />
                Umbenennen
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={doDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Meta */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <MetaChip icon={<ImageIcon className="h-3.5 w-3.5" />} label="Media" value={fmtNum(mediaCount)} />
          <MetaChip icon={<FileText className="h-3.5 w-3.5" />} label="Snippets" value={fmtNum(snippetsCount)} />
          <MetaChip icon={<Activity className="h-3.5 w-3.5" />} label="Views" value={fmtNum(views)} />
          <MetaChip icon={<BarChart3 className="h-3.5 w-3.5" />} label="Impr." value={fmtNum(impressions)} />
          {session.updated_at && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="ml-auto select-none">Aktualisiert {timeAgo(session.updated_at)}</span>
              </TooltipTrigger>
              <TooltipContent>{new Date(session.updated_at).toLocaleString()}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------ Visual helpers & bits ------------------------- */

function MetaChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border bg-card/60 px-1.5 py-0.5">
      {icon}
      <span className="tabular-nums">{value}</span>
      <span className="opacity-70">{label}</span>
    </span>
  )
}

function CoverFallback({ title }: { title: string }) {
  const initials = (title || 'S')
    .split(/\s+/)
    .slice(0, 2)
    .map((t) => t[0]?.toUpperCase())
    .join('')
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-50 via-rose-50 to-amber-50">
      <div className="rounded-xl border bg-white/70 px-2 py-1 text-xs font-medium backdrop-blur">
        <Sparkles className="mr-1 inline h-3.5 w-3.5" />
        {initials}
      </div>
    </div>
  )
}

function ScoreRing({ value }: { value: number }) {
  const clamped = clamp(value, 0, 100)
  const hue = 120 * (clamped / 100) // 0=rot, 120=grün
  const bg = `conic-gradient(hsl(${hue} 80% 45%) ${clamped * 3.6}deg, #e5e7eb 0deg)`
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="grid h-10 w-10 place-items-center rounded-full"
          style={{ background: bg }}
          aria-label={`Score ${clamped}/100`}
          role="img"
        >
          <div className="grid h-8 w-8 place-items-center rounded-full bg-white text-[10px] font-semibold">
            {clamped}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>CoPilot-Score</TooltipContent>
    </Tooltip>
  )
}

/* --------------------------------- Utils -------------------------------- */

function timeAgo(iso: string) {
  const d = new Date(iso).getTime()
  const diff = Math.max(0, Date.now() - d)
  const sec = Math.floor(diff / 1000)
  const min = Math.floor(sec / 60)
  const hrs = Math.floor(min / 60)
  const days = Math.floor(hrs / 24)
  if (days > 0) return `vor ${days} Tag${days > 1 ? 'en' : ''}`
  if (hrs > 0) return `vor ${hrs} Std.`
  if (min > 0) return `vor ${min} Min.`
  return 'gerade eben'
}

function fmtNum(n: number | null) {
  if (n === null || typeof n === 'undefined') return '–'
  if (n < 1000) return String(n)
  if (n < 10000) return (n / 1000).toFixed(1) + 'k'
  if (n < 1_000_000) return Math.round(n / 1000) + 'k'
  return (n / 1_000_000).toFixed(1) + 'M'
}
function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

/* -------------------------------- Skeleton ------------------------------- */

export function SessionCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="h-36 w-full animate-pulse bg-muted" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        <div className="mt-3 flex gap-2">
          <div className="h-5 w-20 animate-pulse rounded bg-muted" />
          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          <div className="ml-auto h-3 w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}
