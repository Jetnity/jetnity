// components/creator/media-studio/SessionList.tsx
'use client'

import * as React from 'react'
import Link from 'next/link'
import { Database } from '@/types/supabase'
import { cn as _cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  Search,
  Star,
  StarOff,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  ExternalLink,
  Users,
  Clock3,
} from 'lucide-react'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

type Session = Database['public']['Tables']['creator_sessions']['Row']

type Props = {
  sessions: Session[]
  selectedSessionId: string | null
  onSelect: (id: string) => void

  /** optionale Actions */
  onOpen?: (id: string) => void
  onRename?: (id: string, title: string) => Promise<void> | void
  onDuplicate?: (id: string) => Promise<void> | void
  onDelete?: (id: string) => Promise<void> | void

  /** UI-Flags */
  loading?: boolean
  showToolbar?: boolean   // <— NEU: verhindert Doppel-Header (default false)
  className?: string
}

type SortKey = 'newest' | 'updated' | 'az' | 'starred'

export default function SessionList({
  sessions,
  selectedSessionId,
  onSelect,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
  loading = false,
  showToolbar = false,
  className,
}: Props) {
  /* ───────── State: Suche/Sortierung/Stars ───────── */
  const [query, setQuery] = React.useState('')
  const [sort, setSort] = React.useState<SortKey>('updated')
  const [stars, setStars] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('sessionList.stars')
      if (raw) setStars(new Set(JSON.parse(raw)))
    } catch {}
  }, [])
  const persistStars = (next: Set<string>) => {
    setStars(new Set(next))
    try {
      localStorage.setItem('sessionList.stars', JSON.stringify(Array.from(next)))
    } catch {}
  }
  const toggleStar = (id: string) => {
    const n = new Set(stars)
    n.has(id) ? n.delete(id) : n.add(id)
    persistStars(n)
  }

  /* ───────── Tastatur-Navigation ───────── */
  const ids = React.useMemo(() => sessions.map((s) => s.id), [sessions])
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (!ids.length) return
      const idx = selectedSessionId ? Math.max(0, ids.indexOf(selectedSessionId)) : -1

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        onSelect(ids[(idx + 1 + ids.length) % ids.length])
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        onSelect(ids[(idx - 1 + ids.length) % ids.length])
      }
      if (e.key === 'Enter' && selectedSessionId && onOpen) {
        e.preventDefault()
        onOpen(selectedSessionId)
      }
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [ids, selectedSessionId, onSelect, onOpen])

  /* ───────── Filtern & Sortieren ─────────
     Wenn showToolbar=false, lassen wir die Reihenfolge wie geliefert (kein Filter/Sort)
  ───────── */
  const computed = React.useMemo(() => {
    if (!showToolbar) return sessions
    const q = query.trim().toLowerCase()
    let list = q
      ? sessions.filter((s) =>
          [s.title, (s as any).description, (s as any).tags?.join(' ')].some((f) =>
            String(f ?? '').toLowerCase().includes(q)
          )
        )
      : sessions.slice()

    list.sort((a, b) => {
      if (sort === 'az') return (a.title ?? '').localeCompare(b.title ?? '')
      if (sort === 'newest') return dateNum(b.created_at) - dateNum(a.created_at)
      if (sort === 'updated') {
        return (
          dateNum((b as any).updated_at || b.created_at) -
          dateNum((a as any).updated_at || a.created_at)
        )
      }
      // 'starred': Stars zuerst, dann updated
      const aStar = stars.has(a.id) ? 1 : 0
      const bStar = stars.has(b.id) ? 1 : 0
      if (aStar !== bStar) return bStar - aStar
      return (
        dateNum((b as any).updated_at || b.created_at) -
        dateNum((a as any).updated_at || a.created_at)
      )
    })
    return list
  }, [sessions, query, sort, stars, showToolbar])

  /* ───────── UI ───────── */
  return (
    <div className={cn('space-y-3', className)}>
      {/* Toolbar (optional) */}
      {showToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Suchen…"
              className="h-9 w-full pl-8"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              className="rounded-md border bg-background px-2 py-2 text-sm"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              title="Sortierung"
            >
              <option value="updated">Zuletzt bearbeitet</option>
              <option value="newest">Neueste zuerst</option>
              <option value="az">A–Z</option>
              <option value="starred">Favoriten zuerst</option>
            </select>
            <span className="text-xs text-muted-foreground">
              {computed.length} / {sessions.length}
            </span>
          </div>
        </div>
      )}

      {/* Grid */}
      <div
        className="grid grid-cols-1 gap-4 p-1 sm:grid-cols-2 lg:grid-cols-3"
        role="listbox"
        aria-label="Sessions"
      >
        {(loading ? Array.from({ length: 6 }) : computed).map((s, i) =>
          loading ? (
            <CardSkeleton key={i} />
          ) : (
            <SessionCard
              key={(s as Session).id}
              session={s as Session}
              selected={(s as Session).id === selectedSessionId}
              starred={stars.has((s as Session).id)}
              onStar={() => toggleStar((s as Session).id)}
              onSelect={() => onSelect((s as Session).id)}
              onOpen={onOpen}
              onRename={onRename}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
            />
          )
        )}
      </div>

      {!loading && computed.length === 0 && <EmptyState />}
    </div>
  )
}

/* ───────── Einzelkarte ───────── */
function SessionCard({
  session,
  selected,
  starred,
  onStar,
  onSelect,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
}: {
  session: Session
  selected: boolean
  starred: boolean
  onStar: () => void
  onSelect: () => void
  onOpen?: (id: string) => void
  onRename?: (id: string, title: string) => void | Promise<void>
  onDuplicate?: (id: string) => void | Promise<void>
  onDelete?: (id: string) => void | Promise<void>
}) {
  const [renaming, setRenaming] = React.useState(false)
  const [title, setTitle] = React.useState(session.title ?? '')
  React.useEffect(() => setTitle(session.title ?? ''), [session.title])

  const cover =
    (session as any).cover_url ||
    (session as any).thumbnail_url ||
    (session as any).preview_url ||
    (session as any).meta?.cover ||
    null

  async function commitRename() {
    if (!onRename) return setRenaming(false)
    const t = title.trim()
    if (!t || t === (session.title ?? '')) {
      setRenaming(false)
      return
    }
    await onRename(session.id, t)
    setRenaming(false)
  }

  return (
    <div
      role="option"
      aria-selected={selected}
      className={cn(
        // Pro-Look: Surface + Shadow Scale
        'group relative overflow-hidden rounded-xl border bg-card shadow-e1 transition',
        'hover:shadow-e2 focus-within:ring-2 focus-within:ring-primary',
        selected && 'ring-2 ring-primary border-transparent'
      )}
      onClick={onSelect}
      tabIndex={0}
    >
      {/* Cover */}
      <div className="relative aspect-video w-full bg-muted">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={String(cover)}
            alt={session.title ?? 'Cover'}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-muted to-muted/60 text-3xl font-semibold text-muted-foreground">
            {initials(session.title ?? session.id)}
          </div>
        )}

        {/* Star */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onStar()
          }}
          className={cn(
            'absolute right-2 top-2 rounded-full border bg-background/80 p-1 backdrop-blur transition',
            starred ? 'text-amber-500' : 'text-muted-foreground'
          )}
          title={starred ? 'Favorit entfernen' : 'Als Favorit markieren'}
        >
          {starred ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
        </button>
      </div>

      {/* Body */}
      <div className="p-3">
        {/* Titel + Aktionen */}
        <div className="flex items-start justify-between gap-2">
          {renaming ? (
            <input
              className="w-full rounded-md border bg-background px-2 py-1 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => void commitRename()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void commitRename()
                if (e.key === 'Escape') setRenaming(false)
              }}
              autoFocus
            />
          ) : (
            <h3 className="line-clamp-2 text-base font-semibold">{session.title ?? 'Ohne Titel'}</h3>
          )}

          {/* Hover Actions */}
          <div className="opacity-0 transition group-hover:opacity-100">
            <div className="flex items-center gap-1">
              {onRename && (
                <button
                  className="rounded-md border p-1 text-xs hover:bg-accent"
                  title="Umbenennen"
                  onClick={(e) => {
                    e.stopPropagation()
                    setRenaming(true)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {onDuplicate && (
                <button
                  className="rounded-md border p-1 text-xs hover:bg-accent"
                  title="Duplizieren"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDuplicate(session.id)
                  }}
                >
                  <Copy className="h-4 w-4" />
                </button>
              )}
              {onDelete && (
                <button
                  className="rounded-md border p-1 text-xs hover:bg-accent text-red-600"
                  title="Löschen"
                  onClick={async (e) => {
                    e.stopPropagation()
                    if (confirm('Session wirklich löschen?')) await onDelete(session.id)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                className="rounded-md border p-1 text-xs hover:bg-accent"
                title="Mehr"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5" />
            {formatUpdated((session as any).updated_at ?? session.created_at)}
          </span>

          {Array.isArray((session as any).shared_with) && (session as any).shared_with.length > 0 && (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {(session as any).shared_with.length} geteilt
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          <Link
            href={`/creator/media-studio/${session.id}`}
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            aria-label={`Session ${session.title ?? session.id} öffnen`}
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-4 w-4" /> Öffnen
          </Link>

          {onOpen && (
            <button
              className="rounded-md border px-2 py-1 text-sm hover:bg-accent"
              onClick={(e) => {
                e.stopPropagation()
                onOpen(session.id)
              }}
            >
              Öffnen (App)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ───────── Skeleton/Empty ───────── */

function CardSkeleton() {
  return (
    <div className="surface-1 animate-pulse overflow-hidden rounded-xl">
      <div className="aspect-video w-full bg-muted" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-2/3 rounded bg-muted" />
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="mt-3 h-8 w-24 rounded bg-muted" />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="grid place-items-center rounded-2xl border bg-muted/30 py-12 text-center shadow-e1">
      <div className="space-y-2">
        <div className="text-lg font-semibold">Keine Sessions gefunden</div>
        <div className="text-sm text-muted-foreground">
          Passe die Suche/Sortierung an oder lege eine neue Session an.
        </div>
        <Link
          href="/creator/new"
          className="mt-2 inline-flex rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
        >
          Neue Session
        </Link>
      </div>
    </div>
  )
}

/* ───────── Utils ───────── */

function dateNum(d: string | null): number {
  return d ? new Date(d).getTime() : 0
}

function formatUpdated(d: string | null): string {
  if (!d) return '—'
  const ts = new Date(d).getTime()
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'gerade eben'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}d`
  return new Date(d).toLocaleDateString('de-DE')
}

function initials(s: string) {
  const parts = s.trim().split(/\s+/)
  const a = (parts[0]?.[0] ?? '').toUpperCase()
  const b = (parts[1]?.[0] ?? '').toUpperCase()
  return (a + b) || 'S'
}
