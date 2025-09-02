'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import { cn as _cn } from '@/lib/utils'
import { Clock, RotateCcw, Eye, RefreshCw, FileDiff } from 'lucide-react'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

type RowSession = Database['public']['Tables']['creator_sessions']['Row']
type RowSessionVersion = Database['public']['Tables']['session_versions']['Row']
type Mode = 'auto' | 'session' | 'media'

export default function VersionTimeline({
  sessionId,
  userId,
  itemId = null,
  mode = 'auto',
  className,
  canCreate = true,
  canRestore = true,
}: {
  sessionId: string
  userId: string
  itemId?: string | null
  mode?: Mode
  className?: string
  canCreate?: boolean
  canRestore?: boolean
}) {
  const effectiveMode: Mode = useMemo(
    () => (mode === 'auto' ? (itemId ? 'media' : 'session') : mode),
    [mode, itemId]
  )

  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [diffIdx, setDiffIdx] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      if (effectiveMode === 'media') {
        if (!itemId) { setItems([]); setLoading(false); return }
        const { data, error } = await supabase
          .from('media_versions')
          .select('id,label,created_at,doc,edit_doc_id,session_id,item_id')
          .eq('session_id', sessionId)
          .eq('item_id', itemId as string)  // <- TS-sicher
          .order('created_at', { ascending: false })
          .limit(200)
        if (error) throw error
        setItems(data ?? [])
      } else {
        const { data, error } = await supabase
          .from('session_versions')
          .select('*')
          .eq('session_id', sessionId)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(200)
        if (error) throw error
        setItems(data ?? [])
      }
    } catch (e: any) {
      setError(e?.message || String(e)); setItems([])
    } finally {
      setLoading(false)
    }
  }, [effectiveMode, sessionId, userId, itemId])

  useEffect(() => { void load() }, [load])

  // Realtime: nur subscriben, wenn Filter vollständig ist
  useEffect(() => {
    const table = effectiveMode === 'media' ? 'media_versions' : 'session_versions'
    const filter =
      effectiveMode === 'media'
        ? (itemId ? `session_id=eq.${sessionId},item_id=eq.${itemId}` : '')
        : `session_id=eq.${sessionId}`

    if (effectiveMode === 'media' && !itemId) return

    const ch = supabase
      .channel(`${table}_${sessionId}_${itemId ?? 'none'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table, filter } as any, () => { void load() })
      .subscribe()

    return () => { void supabase.removeChannel(ch) }
  }, [effectiveMode, sessionId, itemId, load])

  /* ------ Rest deines JSX/Restore/Create bleibt unverändert ------ */

  const createFromCurrent = useCallback(async () => {
    if (!canCreate) return
    setBusy(true); setError(null)
    try {
      if (effectiveMode === 'media') {
        if (!itemId) throw new Error('itemId fehlt')
        const { data: ed } = await supabase
          .from('edit_docs')
          .select('id,doc')
          .eq('user_id', userId)
          .eq('session_id', sessionId)
          .eq('item_id', itemId as string)
          .maybeSingle()
        const payload: any = {
          user_id: userId,
          session_id: sessionId,
          item_id: itemId,
          label: `Snapshot ${new Date().toLocaleString()}`,
          edit_doc_id: ed?.id ?? null,
          doc: ed?.doc ?? {},
        }
        const { error } = await supabase.from('media_versions').insert(payload as any)
        if (error) throw error
      } else {
        const { data: s, error: e1 } = await supabase
          .from('creator_sessions')
          .select('id,title,content')
          .eq('id', sessionId)
          .eq('user_id', userId)
          .single<RowSession>()
        if (e1) throw e1
        const payload: Partial<RowSessionVersion> & any = {
          session_id: sessionId,
          user_id: userId,
          title: s?.title ?? '',
          content: s?.content ?? '',
          meta: {
            created_from: 'timeline',
            title_len: (s?.title ?? '').length,
            content_len: (s?.content ?? '').length,
          },
        }
        const { error: e2 } = await supabase.from('session_versions').insert(payload as any)
        if (e2) throw e2
      }
    } catch (e:any) {
      setError(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }, [effectiveMode, canCreate, sessionId, userId, itemId])

  const restore = useCallback(async (v: any) => {
    if (!canRestore) return
    setBusy(true); setError(null)
    try {
      if (effectiveMode === 'media') {
        if (!itemId) throw new Error('itemId fehlt')
        const { data: cur } = await supabase
          .from('edit_docs')
          .select('id,doc')
          .eq('user_id', userId)
          .eq('session_id', sessionId)
          .eq('item_id', itemId as string)
          .maybeSingle()
        if (cur) {
          await supabase.from('media_versions').insert({
            user_id: userId, session_id: sessionId, item_id: itemId,
            label: 'Auto-Backup vor Restore', edit_doc_id: cur.id, doc: cur.doc ?? {},
          } as any)
        }
        if (v?.edit_doc_id) {
          await supabase.from('edit_docs').update({ doc: v.doc ?? {} }).eq('id', v.edit_doc_id)
        } else {
          await supabase
            .from('edit_docs')
            .update({ doc: v.doc ?? {} })
            .eq('user_id', userId)
            .eq('session_id', sessionId)
            .eq('item_id', itemId as string)
        }
      } else {
        const { data: cur } = await supabase
          .from('creator_sessions')
          .select('title,content')
          .eq('id', sessionId)
          .eq('user_id', userId)
          .single<RowSession>()
        if (cur) {
          await supabase.from('session_versions').insert({
            session_id: sessionId, user_id: userId,
            title: cur.title ?? '', content: cur.content ?? '',
            meta: { created_from: 'auto-backup-before-restore' },
          } as any)
        }
        const { error: e2 } = await supabase
          .from('creator_sessions')
          .update({ title: v?.title ?? '', content: v?.content ?? '' })
          .eq('id', sessionId)
          .eq('user_id', userId)
        if (e2) throw e2
      }
    } catch (e:any) {
      setError(e?.message || String(e))
    } finally {
      setBusy(false)
    }
  }, [effectiveMode, canRestore, sessionId, userId, itemId])

  const openDiff = (idx: number) => setDiffIdx(idx)
  const closeDiff = () => setDiffIdx(null)

  const header = effectiveMode === 'media' ? 'Versionen (Media-Edits)' : 'Versionen & Snapshots'
  const emptyText = effectiveMode === 'media' ? 'Noch keine Edit-Versionen.' : 'Noch keine Snapshots.'

  return (
    <div className={cn('rounded-xl border bg-card/60 p-4', className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium text-muted-foreground">{header}</div>
        <div className="flex gap-2">
          {canCreate && (
            <button onClick={createFromCurrent} disabled={busy} className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm hover:bg-accent disabled:opacity-50">
              <Clock className="h-4 w-4" /> Snapshot
            </button>
          )}
          <button onClick={() => void load()} className="inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm hover:bg-accent">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Aktualisieren
          </button>
        </div>
      </div>

      {error && <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}

      {loading ? (
        <div className="text-sm text-muted-foreground">Lade Versionen …</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-muted-foreground">{emptyText}</div>
      ) : (
        <ul className="space-y-2">
          {items.map((v, idx) => {
            const primary = effectiveMode === 'media' ? (v.label as string) || 'Version' : (v as RowSessionVersion).title || '—'
            const sub = effectiveMode === 'media' ? '' : `${(v as any)?.meta?.title_len ?? 0} / ${(v as any)?.meta?.content_len ?? 0} Zeichen`
            return (
              <li key={v.id} className="flex items-center justify-between gap-3 rounded-lg border bg-background/60 px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{primary}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(v.created_at as any).toLocaleString()}{sub ? ` · ${sub}` : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button onClick={() => openDiff(idx)} className="inline-flex h-8 items-center gap-1 rounded-md border px-2 text-xs hover:bg-accent" title="Inhalt ansehen">
                    <Eye className="h-3.5 w-3.5" /> <span>Ansicht</span>
                  </button>
                  {canRestore && (
                    <button onClick={() => void restore(v)} className="inline-flex h-8 items-center gap-1 rounded-md border px-2 text-xs hover:bg-accent" title="Diese Version wiederherstellen">
                      <RotateCcw className="h-3.5 w-3.5" /> <span>Wiederherstellen</span>
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {diffIdx !== null && items[diffIdx] && (
        <DiffModal mode={effectiveMode} current={items[diffIdx]} onClose={closeDiff} />
      )}
    </div>
  )
}

function DiffModal({ mode, current, onClose }: { mode: Mode; current: any; onClose: () => void }) {
  const title = mode === 'media' ? current?.label ?? 'Version' : current?.title ?? '—'
  const body = mode === 'media' ? JSON.stringify(current?.doc ?? {}, null, 2) : (current?.content ?? '') as string
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-4xl rounded-2xl border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium"><FileDiff className="h-4 w-4" /> Snapshot ansehen</div>
          <button onClick={onClose} className="rounded-md border px-2 py-1 text-xs hover:bg-accent">Schließen</button>
        </div>
        <div className="mb-2 text-sm font-semibold">{title}</div>
        <pre className="max-h-[60vh] overflow-auto rounded-md border bg-background p-3 text-xs leading-5 whitespace-pre-wrap">
{body || '—'}
        </pre>
      </div>
    </div>
  )
}
