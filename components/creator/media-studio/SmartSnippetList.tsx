// components/creator/media-studio/SmartSnippetList.tsx
'use client'

import * as React from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import { cn as _cn } from '@/lib/utils'
import SmartSnippetItem, { type SnippetType } from './SmartSnippetItem'
import SmartSnippetForm from './SmartSnippetForm'
import SnippetCommentBox from './SnippetCommentBox'
import {
  Plus, Search, RefreshCw, Pin, PinOff, Edit, Trash2,
  SendHorizontal, Loader2, Filter, Hash
} from 'lucide-react'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

type Snippet = Database['public']['Tables']['session_snippets']['Row']

type Props = {
  sessionId: string
  userId: string
  /** Optional initial data to render immediately */
  snippets?: Snippet[]
  className?: string
}

type SortKey = 'new' | 'old' | 'pinned'

const PAGE = 20

export default function SmartSnippetList({
  sessionId,
  userId,
  snippets: initial = [],
  className,
}: Props) {
  const [items, setItems] = React.useState<Snippet[]>(initial)
  const [loading, setLoading] = React.useState(false)
  const [hasMore, setHasMore] = React.useState(true)
  const [page, setPage] = React.useState(0)
  const [q, setQ] = React.useState('')
  const [type, setType] = React.useState<SnippetType | 'all'>('all')
  const [sort, setSort] = React.useState<SortKey>('pinned')
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editingText, setEditingText] = React.useState<string>('')
  const [busyRow, setBusyRow] = React.useState<string | null>(null)
  const [msg, setMsg] = React.useState<string | null>(null)

  // Initial + on filters
  React.useEffect(() => {
    void resetAndLoad()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, q, type, sort])

  // Realtime live-updates
  React.useEffect(() => {
    const ch = supabase
      .channel(`session_snippets:${sessionId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'session_snippets', filter: `session_id=eq.${sessionId}` },
        (p) => {
          setItems((prev) => {
            if (p.eventType === 'INSERT') {
              const next = [p.new as any as Snippet, ...prev]
              return dedupe(next)
            }
            if (p.eventType === 'UPDATE') {
              return prev.map((it) => (it.id === (p.new as any).id ? (p.new as any as Snippet) : it))
            }
            if (p.eventType === 'DELETE') {
              return prev.filter((it) => it.id !== (p.old as any).id)
            }
            return prev
          })
        })
      .subscribe()
    return () => { void supabase.removeChannel(ch) }
  }, [sessionId])

  async function resetAndLoad() {
    setItems([])
    setPage(0)
    setHasMore(true)
    await loadPage(0, true)
  }

  async function loadMore() {
    await loadPage(page + 1)
  }

  async function loadPage(nextPage: number, replace = false) {
    if (loading || !hasMore && !replace) return
    setLoading(true)
    const from = nextPage * PAGE
    const to = from + PAGE - 1

    // Build query with filters
    let query = supabase
      .from('session_snippets')
      .select('*')
      .eq('session_id', sessionId)

    if (type !== 'all') query = query.eq('type', type)
    if (q.trim()) query = query.ilike('content', `%${q.trim()}%`)

    // sort
    if (sort === 'new') query = query.order('created_at', { ascending: false })
    if (sort === 'old') query = query.order('created_at', { ascending: true })
    if (sort === 'pinned') {
      // best-effort: sort erst nach pinned desc (wenn Feld vorhanden), dann created_at desc
      query = query.order('pinned', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false })
    }

    const { data, error, count } = await query.range(from, to)
    if (error) {
      console.error('[snippets:load]', error)
      setMsg('Snippets konnten nicht geladen werden.')
    } else {
      const next = (data ?? []) as Snippet[]
      setItems((prev) => replace ? next : dedupe([...prev, ...next]))
      setPage(nextPage)
      setHasMore(next.length === PAGE)
    }
    setLoading(false)
  }

  function onCreate(content: string, t: SnippetType) {
    // optimistic insert
    const tempId = `temp-${Date.now()}`
    const optimistic: Snippet = {
      ...(null as any),
      id: tempId as any,
      session_id: sessionId as any,
      user_id: userId as any,
      content,
      type: t as any,
      created_at: new Date().toISOString() as any,
      pinned: false as any,
    }
    setItems((prev) => [optimistic, ...prev])

    supabase.from('session_snippets')
      .insert({ session_id: sessionId, user_id: userId, content, type: t } as any)
      .select('*')
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          console.error('[snippets:create]', error)
          setItems((prev) => prev.filter((s) => s.id !== tempId))
          setMsg('Snippet konnte nicht erstellt werden.')
          return
        }
        setItems((prev) => prev.map((s) => (s.id === tempId ? (data as any as Snippet) : s)))
      })
  }

  function startEdit(s: Snippet) {
    setEditingId(String(s.id))
    setEditingText(s.content ?? '')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingText('')
  }

  async function saveEdit(id: string) {
    setBusyRow(id)
    const prev = items
    try {
      setItems((list) => list.map((s) => (String(s.id) === id ? { ...s, content: editingText } : s)))
      const { error } = await supabase.from('session_snippets').update({ content: editingText }).eq('id', id).eq('user_id', userId)
      if (error) throw error
      setEditingId(null)
      setEditingText('')
    } catch (e) {
      console.error('[snippets:update]', e)
      setItems(prev)
      setMsg('Änderung konnte nicht gespeichert werden.')
    } finally {
      setBusyRow(null)
    }
  }

  async function remove(id: string) {
    if (!confirm('Snippet wirklich löschen?')) return
    setBusyRow(id)
    const prev = items
    try {
      setItems((list) => list.filter((s) => String(s.id) !== id))
      const { error } = await supabase.from('session_snippets').delete().eq('id', id).eq('user_id', userId)
      if (error) throw error
    } catch (e) {
      console.error('[snippets:delete]', e)
      setItems(prev)
      setMsg('Löschen fehlgeschlagen.')
    } finally {
      setBusyRow(null)
    }
  }

  async function togglePin(s: Snippet) {
    const id = String(s.id)
    setBusyRow(id)
    const prev = items
    const nextPinned = !((s as any).pinned ?? false)
    try {
      setItems((list) => list.map((x) => (String(x.id) === id ? ({ ...x, pinned: nextPinned } as any) : x)))
      // Wenn es die Spalte "pinned" nicht gibt, auf "meta" jsonb ausweichen
      const { error } = await supabase.from('session_snippets')
        .update({ pinned: nextPinned } as any)
        .eq('id', id)
        .eq('user_id', userId)
      if (error) throw error
    } catch (e) {
      console.warn('[snippets:pin] pinned-Feld evtl. nicht vorhanden, versuche meta.jsonb', e)
      try {
        const meta = { ...(s as any).meta, pinned: nextPinned }
        setItems((list) => list.map((x) => (String(x.id) === id ? ({ ...x, meta } as any) : x)))
        const { error: e2 } = await supabase.from('session_snippets')
          .update({ meta } as any)
          .eq('id', id)
          .eq('user_id', userId)
        if (e2) throw e2
      } catch (e3) {
        console.error('[snippets:pin:meta]', e3)
        setItems(prev)
        setMsg('Konnte Pin-Status nicht ändern.')
      }
    } finally {
      setBusyRow(null)
    }
  }

  async function insertIntoSession(text: string) {
    // Bevorzugt: RPC, fallback: Info-Meldung
    try {
      // Versuch 1: RPC (falls existiert)
      const { error } = await (supabase as any).rpc('append_snippet_to_session', {
        session_id: sessionId,
        text,
      })
      if (error) throw error
      toast('In Session eingefügt.')
    } catch (e) {
      console.warn('[snippets:append:rpc] nicht verfügbar, fallback', e)
      toast('Kein Append-RPC vorhanden. Bitte später konfigurieren.')
    }
  }

  const filtered = React.useMemo(() => {
    // Client-side Re-Order für 'pinned' (falls DB sort nicht greift)
    const arr = [...items]
    if (sort === 'pinned') {
      arr.sort((a, b) => Number((b as any).pinned ?? 0) - Number((a as any).pinned ?? 0))
    }
    return arr
  }, [items, sort])

  return (
    <section className={cn('space-y-4', className)}>
      {/* Create */}
      <div className="rounded-xl border bg-background/60 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-muted-foreground">✨ Snippets</h3>
          <button
            onClick={() => void resetAndLoad()}
            className="inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs hover:bg-accent"
            title="Neu laden"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} /> Aktualisieren
          </button>
        </div>
        <SmartSnippetForm
          onSubmit={onCreate}
          placeholders={['name', 'produkt', 'link']}
          maxLen={500}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <input
              className="w-full rounded-md border bg-background px-8 py-2 text-sm"
              placeholder="Suchen…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>

          <div className="inline-flex items-center gap-2 rounded-md border bg-background px-2 py-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              className="bg-transparent text-sm outline-none"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
            >
              <option value="all">Alle Typen</option>
              <option value="text">Text</option>
              <option value="idea">Idee</option>
              <option value="hashtag">Hashtag</option>
              <option value="cta">CTA</option>
              <option value="script">Skript</option>
            </select>
            <span className="mx-1 h-4 w-px bg-border" />
            <select
              className="bg-transparent text-sm outline-none"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="pinned">Pin · Neueste</option>
              <option value="new">Neueste zuerst</option>
              <option value="old">Älteste zuerst</option>
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 && !loading && (
          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            Keine Snippets gefunden.
          </div>
        )}

        {filtered.map((s) => {
          const id = String(s.id)
          const isEditing = editingId === id
          const createdAt = (s as any).created_at ?? new Date().toISOString()
          const pinned = Boolean((s as any).pinned ?? (s as any)?.meta?.pinned)

          return (
            <div key={id} className="rounded-xl border bg-card p-4">
              {/* row header actions */}
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{String((s as any).type ?? 'text')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void togglePin(s)}
                    className="rounded-md border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
                    disabled={busyRow === id}
                    title={pinned ? 'Pin entfernen' : 'Anpinnen'}
                  >
                    {pinned ? <Pin className="h-3.5 w-3.5" /> : <PinOff className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(s)}
                    className="rounded-md border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
                    disabled={busyRow === id}
                    title="Bearbeiten"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(id)}
                    className="rounded-md border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
                    disabled={busyRow === id}
                    title="Löschen"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* content / edit */}
              {isEditing ? (
                <div className="space-y-2">
                  <textarea
                    className="min-h-28 w-full rounded-md border bg-background p-2 text-sm"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void saveEdit(id)}
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary/90 disabled:opacity-50"
                      disabled={busyRow === id}
                    >
                      {busyRow === id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Speichern
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="rounded-md border px-3 py-1.5 text-xs hover:bg-accent"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : (
                <SmartSnippetItem
                  content={s.content ?? ''}
                  type={(s as any).type ?? 'text'}
                  createdAt={createdAt}
                  maxLines={6}
                  onShare={(txt) => {
                    if (typeof navigator.share === 'function') {
                      (navigator as any).share({ text: txt }).catch(() => {})
                    }
                  }}
                />
              )}

              {/* actions row */}
              {!isEditing && (
                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-50"
                    onClick={() => insertIntoSession(s.content ?? '')}
                    title="In Session-Content einfügen"
                  >
                    <SendHorizontal className="h-3.5 w-3.5" />
                    In Session einfügen
                  </button>
                  <time className="text-xs text-muted-foreground">
                    {new Date(createdAt).toLocaleString()}
                  </time>
                </div>
              )}

              {/* comments */}
              <div className="mt-3">
                <SnippetCommentBox
                  sessionId={sessionId}
                  snippetId={s.id as any}
                  userId={userId}
                  snippet={s}
                />
              </div>
            </div>
          )
        })}

        {/* Loading / Load more */}
        <div className="flex items-center justify-center">
          {loading ? (
            <span className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Lädt…
            </span>
          ) : hasMore ? (
            <button
              onClick={() => void loadMore()}
              className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-xs hover:bg-accent"
            >
              Mehr laden
            </button>
          ) : items.length > 0 ? (
            <span className="text-xs text-muted-foreground">Alles geladen.</span>
          ) : null}
        </div>
      </div>

      {msg && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {msg}
        </div>
      )}
    </section>
  )
}

/* -------------------- Helpers -------------------- */

function dedupe(list: Snippet[]) {
  const map = new Map<string, Snippet>()
  for (const s of list) map.set(String(s.id), s)
  return Array.from(map.values())
}

function toast(message: string) {
  // Minimaler Inline-Toast – ersetze gern durch shadcn/ui toast
  try {
    // eslint-disable-next-line no-alert
    console.info('[toast]', message)
  } catch {}
}
