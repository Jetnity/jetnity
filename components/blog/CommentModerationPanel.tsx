// components/blog/CommentModerationPanel.tsx
'use client'

import * as React from 'react'
import { supabase } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/supabase'
import {
  Check,
  Clock,
  EyeOff,
  Filter,
  Loader2,
  RefreshCcw,
  Search,
  Trash2,
  Copy,
} from 'lucide-react'

/* ──────────────────────────────────────────────────────────────────────────
   Types & constants
────────────────────────────────────────────────────────────────────────── */
type Status = 'visible' | 'pending' | 'rejected' | 'invisible'

type BlogComment = Tables<'blog_comments'> & {
  user?: {
    id: string
    name?: string | null
    avatar_url?: string | null
    email?: string | null
  }
}

const STATUS_LABEL: Record<Status, string> = {
  visible: 'Sichtbar',
  pending: 'Ausstehend',
  rejected: 'Abgelehnt',
  invisible: 'Versteckt',
}

// NOTE: Badge-Varianten an dein UI angepasst (kein 'destructive', sondern 'error')
const STATUS_BADGE: Record<Status, 'default' | 'secondary' | 'error' | 'outline'> = {
  visible: 'default',
  pending: 'secondary',
  rejected: 'error',
  invisible: 'outline',
}

const PAGE_SIZE = 20

/* ──────────────────────────────────────────────────────────────────────────
   Component
────────────────────────────────────────────────────────────────────────── */
export default function CommentModerationPanel() {
  const [items, setItems] = React.useState<BlogComment[]>([])
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(true)
  const [loading, setLoading] = React.useState(true)
  const [actionId, setActionId] = React.useState<string | null>(null)
  const [bulkLoading, setBulkLoading] = React.useState(false)

  const [statusFilter, setStatusFilter] = React.useState<'all' | Status>('all')
  const [sort, setSort] = React.useState<'newest' | 'oldest'>('newest')
  const [query, setQuery] = React.useState('')
  const [debouncedQuery, setDebouncedQuery] = React.useState('')

  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const [counts, setCounts] = React.useState<{
    all: number; visible: number; pending: number; rejected: number; invisible: number
  }>({ all: 0, visible: 0, pending: 0, rejected: 0, invisible: 0 })

  // Debounce Suche
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  // Realtime-Channel
  React.useEffect(() => {
    const channel = supabase
      .channel('blog_comments_moderation')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_comments' }, (payload) => {
        setItems((prev) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as any
            const safe: BlogComment = { ...(row ?? {}), user: undefined }
            if (prev.some((c) => c.id === safe.id)) return prev
            return [safe, ...prev]
          }
          if (payload.eventType === 'UPDATE') {
            const row = payload.new as any
            return prev.map((c) => (c.id === row.id ? { ...c, ...row } : c))
          }
          if (payload.eventType === 'DELETE') {
            const row = payload.old as any
            return prev.filter((c) => c.id !== row.id)
          }
          return prev
        })
        void fetchCounts()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Basis-Fetch bei Filter/Sort/Suche
  React.useEffect(() => {
    setLoading(true)
    setItems([])
    setPage(1)
    setHasMore(true)
    void fetchPage(1, true).finally(() => setLoading(false))
    void fetchCounts()
  }, [statusFilter, debouncedQuery, sort])

  /* ────────────────────────────────────────────────────────────────────────
     Data helpers
  ──────────────────────────────────────────────────────────────────────── */
  async function fetchCounts() {
    const keys: Array<'all' | Status> = ['all', 'visible', 'pending', 'rejected', 'invisible']
    const res = await Promise.all(
      keys.map((k) => {
        let q = supabase.from('blog_comments').select('id', { count: 'exact', head: true })
        if (k !== 'all') q = q.eq('status', k)
        if (debouncedQuery) q = q.ilike('content', `%${debouncedQuery.replace(/\s+/g, '%')}%`)
        return q.then(({ count }) => count ?? 0)
      })
    )
    setCounts({ all: res[0]!, visible: res[1]!, pending: res[2]!, rejected: res[3]!, invisible: res[4]! })
  }

  async function fetchPage(nextPage: number, replace = false) {
    const from = (nextPage - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    let q = supabase
      .from('blog_comments')
      .select(`
        *,
        user:user_id (id, name, avatar_url, email)
      `)
      .order('created_at', { ascending: sort === 'oldest' })
      .range(from, to)

    if (statusFilter !== 'all') q = q.eq('status', statusFilter)
    if (debouncedQuery) q = q.ilike('content', `%${debouncedQuery.replace(/\s+/g, '%')}%`)

    const { data, error } = await q
    if (error) { toast.error('Fehler beim Laden der Kommentare'); return }

    const safe = (data || []).map((c: any) => ({
      ...c,
      user: typeof c.user === 'object' && c.user !== null && !('code' in c.user) ? c.user : undefined,
    })) as BlogComment[]

    setItems((prev) => (replace ? safe : [...prev, ...safe]))
    setPage(nextPage)
    setHasMore((data?.length ?? 0) === PAGE_SIZE)
  }

  async function updateStatus(id: string, status: Status) {
    setActionId(id)
    const prev = items
    setItems((cur) => cur.map((c) => (c.id === id ? { ...c, status } : c)))
    const { error } = await supabase.from('blog_comments').update({ status }).eq('id', id)
    setActionId(null)
    if (error) { setItems(prev); toast.error('Status konnte nicht geändert werden') }
    else { toast.success('Status aktualisiert'); void fetchCounts() }
  }

  async function bulkUpdate(status: Status) {
    if (selected.size === 0) return
    if (status === 'rejected') {
      const ok = window.confirm(`Möchtest du ${selected.size} Kommentar(e) wirklich ablehnen?`)
      if (!ok) return
    }
    setBulkLoading(true)
    const ids = Array.from(selected)
    const prev = items
    setItems((cur) => cur.map((c) => (selected.has(c.id) ? { ...c, status } : c)))
    const { error } = await supabase.from('blog_comments').update({ status }).in('id', ids)
    setBulkLoading(false)
    if (error) { setItems(prev); toast.error('Bulk-Update fehlgeschlagen') }
    else { setSelected(new Set()); toast.success(`Status auf „${STATUS_LABEL[status]}“ gesetzt`); void fetchCounts() }
  }

  function toggleSelect(id: string) {
    setSelected((s) => {
      const d = new Set(s)
      d.has(id) ? d.delete(id) : d.add(id)
      return d
    })
  }
  function selectPage() { setSelected(new Set(items.map((c) => c.id))) }
  function clearSelection() { setSelected(new Set()) }

  // Shortcuts für Bulk
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!selected.size) return
      if (e.key.toLowerCase() === 'a') { e.preventDefault(); void bulkUpdate('visible') }
      if (e.key.toLowerCase() === 'p') { e.preventDefault(); void bulkUpdate('pending') }
      if (e.key.toLowerCase() === 'r') { e.preventDefault(); void bulkUpdate('rejected') }
      if (e.key.toLowerCase() === 'h') { e.preventDefault(); void bulkUpdate('invisible') }
      if (e.key === 'Escape') { e.preventDefault(); clearSelection() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  /* ────────────────────────────────────────────────────────────────────────
     UI
  ──────────────────────────────────────────────────────────────────────── */
  return (
    <Card className="p-5 md:p-6 space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'visible', 'pending', 'rejected', 'invisible'] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              onClick={() => setStatusFilter(s)}
              size="sm"
              className="gap-2"
            >
              {s === 'all' ? (
                <>
                  <Filter className="h-4 w-4" />
                  Alle
                  <Badge variant="secondary" className="ml-1">{counts.all}</Badge>
                </>
              ) : (
                <>
                  {s === 'visible' && <Check className="h-4 w-4" />}
                  {s === 'pending' && <Clock className="h-4 w-4" />}
                  {s === 'rejected' && <Trash2 className="h-4 w-4" />}
                  {s === 'invisible' && <EyeOff className="h-4 w-4" />}
                  {STATUS_LABEL[s]}
                  <Badge variant="secondary" className="ml-1">{counts[s]}</Badge>
                </>
              )}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Inhalt durchsuchen…"
              className="pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="newest">Neueste zuerst</option>
            <option value="oldest">Älteste zuerst</option>
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => { setLoading(true); setItems([]); setPage(1); void fetchPage(1, true).finally(() => setLoading(false)); void fetchCounts() }}
            title="Neu laden"
          >
            <RefreshCcw className="h-4 w-4" />
            Neu laden
          </Button>
        </div>
      </div>

      {/* Bulk-Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Auswahl: {selected.size}</span>
        <Button size="sm" variant="outline" onClick={selectPage}>Seite auswählen</Button>
        <Button size="sm" variant="outline" onClick={clearSelection}>Auswahl leeren (Esc)</Button>
        <div className="mx-2 h-5 w-px bg-border" />
        <Button
          size="sm"
          onClick={() => void bulkUpdate('visible')}
          disabled={bulkLoading || selected.size === 0}
          className="gap-2"
        >
          <Check className="h-4 w-4" />
          Freischalten (A)
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void bulkUpdate('pending')}
          disabled={bulkLoading || selected.size === 0}
          className="gap-2"
        >
          <Clock className="h-4 w-4" />
          Ausstehend (P)
        </Button>
        <Button
          size="sm"
          variant="danger"  // <- angepasst
          onClick={() => void bulkUpdate('rejected')}
          disabled={bulkLoading || selected.size === 0}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Ablehnen (R)
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void bulkUpdate('invisible')}
          disabled={bulkLoading || selected.size === 0}
          className="gap-2"
        >
          <EyeOff className="h-4 w-4" />
          Verstecken (H)
        </Button>
        {bulkLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
      </div>

      {/* Liste */}
      <div className="divide-y">
        {loading && (
          <div className="py-8 text-center text-muted-foreground">
            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
            Lädt Kommentare…
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            Keine Kommentare gefunden.
          </div>
        )}

        {items.map((c) => {
          const selectedRow = selected.has(c.id)
          return (
            <div
              key={c.id}
              className={cn('flex gap-4 py-4 items-start', selectedRow && 'bg-muted/40 rounded-lg px-2')}
            >
              <input
                type="checkbox"
                aria-label="Kommentar auswählen"
                className="mt-1 h-4 w-4 cursor-pointer"
                checked={selectedRow}
                onChange={() => toggleSelect(c.id)}
              />

              <div className="flex-1 min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  {c.user?.avatar_url && (
                    <img
                      src={c.user.avatar_url}
                      alt={c.user.name || c.user.email || 'User'}
                      className="h-7 w-7 rounded-full object-cover border"
                    />
                  )}
                  <span className="font-semibold">{c.user?.name || c.user?.email || 'User'}</span>
                  <Badge variant={STATUS_BADGE[c.status as Status]}>
                    {STATUS_LABEL[c.status as Status]}
                  </Badge>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {c.created_at && new Date(c.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="text-sm text-foreground/90 break-words">
                  {c.content}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => void updateStatus(c.id, 'visible')}
                    disabled={actionId === c.id || c.status === 'visible'}
                  >
                    Freischalten
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void updateStatus(c.id, 'pending')}
                    disabled={actionId === c.id || c.status === 'pending'}
                  >
                    Ausstehend
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"  // <- angepasst
                    onClick={() => void updateStatus(c.id, 'rejected')}
                    disabled={actionId === c.id || c.status === 'rejected'}
                  >
                    Ablehnen
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void updateStatus(c.id, 'invisible')}
                    disabled={actionId === c.id || c.status === 'invisible'}
                  >
                    Verstecken
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-2 gap-1"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(c.content || '')
                        toast.success('Kommentar kopiert')
                      } catch {
                        window.prompt('Zum Kopieren:', c.content || '')
                      }
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    Text kopieren
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Load more */}
      {!loading && hasMore && (
        <div className="pt-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fetchPage(page + 1)}
          >
            Mehr laden
          </Button>
        </div>
      )}
    </Card>
  )
}
