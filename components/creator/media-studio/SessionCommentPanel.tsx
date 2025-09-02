'use client'

import * as React from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import { cn as _cn } from '@/lib/utils'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

type RowComment = Database['public']['Tables']['session_comments']['Row']

type UserMini = {
  id: string
  name?: string | null
  avatar_url?: string | null
}

type Props = {
  sessionId: string
  /** optional: wir hängen die Diskussion an ein Media-Item;
   *  wird NICHT in einer Spalte `item_id` gespeichert, sondern in meta.item_id */
  itemId?: string | null
  me: UserMini
  className?: string
}

const EMOJIS = ['👍', '❤️', '😂', '🔥', '🤔'] as const
type Emoji = typeof EMOJIS[number]

/* ───────────── Utilities ───────────── */
function timeAgo(d: string | null): string {
  if (!d) return ''
  const ts = new Date(d).getTime()
  const diff = Math.max(0, Date.now() - ts)
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'gerade eben'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}d`
  return new Date(d).toLocaleDateString('de-DE')
}

function autoLink(text: string) {
  const urlRe = /(https?:\/\/[^\s)]+)|www\.[^\s)]+/gi
  return text.split(urlRe).map((part, i) => {
    if (!part) return null
    if (urlRe.test(part)) {
      const href = part.startsWith('http') ? part : `https://${part}`
      return (
        <a key={i} className="underline underline-offset-2" target="_blank" rel="noreferrer" href={href}>
          {part}
        </a>
      )
    }
    return <React.Fragment key={i}>{part}</React.Fragment>
  })
}

/* ───────────── Data Hook ───────────── */
function useComments(sessionId: string, itemId?: string | null) {
  const [list, setList] = React.useState<RowComment[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true); setError(null)
    try {
      let q = supabase
        .from('session_comments')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      // JSON-Filter: nur Kommentare, deren meta.item_id === itemId
      if (itemId) q = q.contains('meta' as any, { item_id: itemId } as any)

      const { data, error } = await q
      if (error) throw error
      setList(data ?? [])
    } catch (e: any) {
      setError(e?.message || String(e))
      setList([])
    } finally {
      setLoading(false)
    }
  }, [sessionId, itemId])

  React.useEffect(() => { void load() }, [load])

  // Realtime: bei Änderungen an der Session neu laden
  React.useEffect(() => {
    const ch = supabase
      .channel(`comments:${sessionId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'session_comments', filter: `session_id=eq.${sessionId}` } as any,
        () => { void load() }
      )
      .subscribe()
    return () => { void supabase.removeChannel(ch) }
  }, [sessionId, load])

  return { list, setList, loading, error, reload: load }
}

/* ───────────── Component ───────────── */
export default function SessionCommentPanel({ sessionId, itemId = null, me, className }: Props) {
  const { list, setList, loading, error } = useComments(sessionId, itemId)
  const [filterMine, setFilterMine] = React.useState(false)
  const [sort, setSort] = React.useState<'new' | 'top' | 'old'>('new')

  /** Composer */
  const [draft, setDraft] = React.useState('')
  const [replyTo, setReplyTo] = React.useState<RowComment | null>(null)
  const [sending, setSending] = React.useState(false)
  const taRef = React.useRef<HTMLTextAreaElement | null>(null)
  React.useEffect(() => {
    const el = taRef.current; if (!el) return
    el.style.height = '0px'
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`
  }, [draft])

  async function addComment(text: string, parent_id?: string) {
    // Optimistic Row (typen vorsichtig, da einige Felder nullable sind)
    const optimistic: RowComment = {
      id: crypto.randomUUID() as any,
      session_id: sessionId as any,
      user_id: me.id as any,
      text: text as any,
      created_at: new Date().toISOString() as any,
      // evtl. vorhandene zusätzliche Spalten defensiv:
      // @ts-ignore
      parent_id: parent_id ?? null,
      // @ts-ignore
      meta: { item_id: itemId ?? null },
      // @ts-ignore
      frame_ms: null,
      // @ts-ignore
      updated_at: new Date().toISOString(),
      // weitere unbekannte Felder bleiben ungesetzt
    }
    setList((prev) => [...prev, optimistic])

    const { error } = await supabase.from('session_comments').insert({
      session_id: sessionId,
      user_id: me.id,
      text,
      // parent_id/meta sind evtl. neue Spalten – wenn nicht vorhanden, werden sie von Supabase ignoriert,
      // typseitig casten wir defensiv auf any:
      ...(parent_id ? { parent_id } : null),
      meta: { item_id: itemId ?? null } as any,
    } as any)

    if (error) {
      // Optimistic Revert
      setList((prev) => prev.filter((c) => c.id !== optimistic.id))
      throw error
    }
  }

  async function toggleReaction(c: RowComment, emoji: Emoji) {
    const meta = ((c as any).meta ?? {}) as Record<string, unknown>
    const set = new Set<string>(Array.isArray(meta[emoji]) ? (meta[emoji] as string[]) : [])
    if (set.has(me.id)) set.delete(me.id); else set.add(me.id)
    const next = { ...meta, [emoji]: Array.from(set) }

    // optimistic
    setList((prev) => prev.map((x) => (x.id === c.id ? ({ ...x, meta: next } as any) : x)))
    const { error } = await supabase
      .from('session_comments')
      .update({ meta: next as any })
      .eq('id', c.id)
    if (error) {
      setList((prev) => prev.map((x) => (x.id === c.id ? ({ ...x, meta } as any) : x)))
    }
  }

  async function delComment(c: RowComment) {
    const backup = list
    setList((prev) => prev.filter((x) => x.id !== c.id && (x as any).parent_id !== c.id))
    const { error } = await supabase.from('session_comments').delete().eq('id', c.id)
    if (error) setList(backup)
  }

  async function submit() {
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    try {
      await addComment(text, replyTo?.id ?? undefined)
      setDraft(''); setReplyTo(null)
    } finally {
      setSending(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void submit()
    }
  }

  // sort + threads
  const items = React.useMemo(() => {
    const mine = filterMine ? list.filter((c) => (c.user_id ?? '') === me.id) : list
    const score = (x: RowComment) => {
      const m = (x as any).meta ?? {}
      return EMOJIS.reduce((s, e) => s + (Array.isArray(m[e]) ? m[e].length : 0), 0)
    }
    const sorted = [...mine].sort((a, b) => {
      if (sort === 'old') return (a.created_at ?? '') > (b.created_at ?? '') ? 1 : -1
      if (sort === 'top') return score(b) - score(a)
      return (a.created_at ?? '') < (b.created_at ?? '') ? 1 : -1
    })

    const byParent = new Map<string | null, RowComment[]>()
    sorted.forEach((c) => {
      const p = ((c as any).parent_id as string | null) ?? null
      if (!byParent.has(p)) byParent.set(p, [])
      byParent.get(p)!.push(c)
    })
    return {
      top: byParent.get(null) ?? [],
      childrenOf: (parent: RowComment) => byParent.get(parent.id) ?? []
    }
  }, [list, filterMine, sort, me.id])

  return (
    <div className={cn('rounded-xl border bg-muted/40 p-4 space-y-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">💬 Kommentare</h2>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded border px-1.5 py-0.5">{list.length}</span>
          <select
            className="rounded border bg-background px-1.5 py-0.5"
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            title="Sortierung"
          >
            <option value="new">Neu</option>
            <option value="old">Alt</option>
            <option value="top">Top</option>
          </select>
          <label className="inline-flex items-center gap-1">
            <input type="checkbox" className="accent-foreground" checked={filterMine} onChange={(e)=>setFilterMine(e.target.checked)} />
            nur meine
          </label>
        </div>
      </div>

      {/* Composer */}
      <div className="rounded-lg border bg-background p-2">
        {replyTo && (
          <div className="mb-2 flex items-center justify-between rounded-md border bg-muted/40 px-2 py-1 text-xs">
            <span>Antwort auf: <strong>{(replyTo.text ?? '').slice(0, 64)}</strong></span>
            <button className="rounded border px-2 py-0.5 hover:bg-accent" onClick={()=>setReplyTo(null)}>x</button>
          </div>
        )}
        <textarea
          ref={taRef}
          className="w-full resize-none rounded-md border border-input bg-background p-2 text-sm outline-none"
          rows={1}
          placeholder="@Name erwähnen …  Enter = senden, Shift+Enter = Zeilenumbruch"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className="mt-2 flex items-center justify-end">
          <button
            disabled={!draft.trim() || sending}
            onClick={() => void submit()}
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
          >
            Senden
          </button>
        </div>
      </div>

      {/* Liste */}
      {error && <div className="text-xs text-destructive">{error}</div>}
      {loading ? (
        <div className="text-sm text-muted-foreground">Lade Kommentare …</div>
      ) : items.top.length === 0 ? (
        <p className="text-muted-foreground text-sm">Noch keine Kommentare vorhanden.</p>
      ) : (
        <ul className="space-y-3">
          {items.top.map((c) => (
            <li key={c.id} className="rounded-lg border bg-card/60 p-3">
              <CommentItem
                me={me}
                comment={c}
                onReply={() => setReplyTo(c)}
                onDelete={() => void delComment(c)}
                onReact={(e) => void toggleReaction(c, e)}
              />
              <ul className="mt-2 space-y-2 border-l pl-3">
                {items.childrenOf(c).map((r) => (
                  <li key={r.id}>
                    <CommentItem
                      me={me}
                      comment={r}
                      onReply={() => setReplyTo(r)}
                      onDelete={() => void delComment(r)}
                      onReact={(e) => void toggleReaction(r, e)}
                    />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ───────────── Einzel-Kommentar ───────────── */
function CommentItem({
  comment,
  me,
  onReply,
  onDelete,
  onReact,
}: {
  comment: RowComment
  me: UserMini
  onReply: () => void
  onDelete: () => void
  onReact: (e: Emoji) => void
}) {
  const userId = (comment.user_id ?? '') as string
  const isOwner = userId === me.id
  const meta = (comment as any).meta ?? {}

  return (
    <div className="flex gap-2">
      <div className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 grid place-items-center text-[10px]">
        {(isOwner ? (me.name ?? 'Du') : (userId || 'N'))[0]?.toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {isOwner ? (me.name ?? 'Du') : `Nutzer ${userId ? userId.slice(0,6) : '—'}`}
          </span>
          <span>·</span>
          <span title={comment.created_at ? new Date(comment.created_at).toLocaleString() : ''}>
            {timeAgo(comment.created_at ?? null)}
          </span>
        </div>

        <div className="mt-1 whitespace-pre-wrap text-sm leading-5">
          {autoLink((comment.text ?? '') as string)}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <button className="rounded border px-2 py-0.5 hover:bg-accent" onClick={onReply}>
            Antworten
          </button>
          {isOwner && (
            <button className="rounded border px-2 py-0.5 hover:bg-accent" onClick={onDelete}>
              Löschen
            </button>
          )}
          <span className="mx-1 h-3 w-px bg-border" />
          {EMOJIS.map((e) => {
            const arr: string[] = Array.isArray(meta[e]) ? meta[e] : []
            const active = arr.includes(me.id)
            const count = arr.length
            return (
              <button
                key={e}
                title={e}
                onClick={() => onReact(e)}
                className={cn('rounded border px-2 py-0.5 hover:bg-accent', active && 'bg-primary/10 border-primary')}
              >
                {e} {count > 0 && <span className="ml-1 inline-block min-w-[1ch] text-xs">{count}</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
