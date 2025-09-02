'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import { formatDate } from '@/lib/utils/formatDate'
import { cn as _cn } from '@/lib/utils'
import {
  Send,
  Sparkles,
  Trash2,
  Edit3,
  Check,
  X,
  Copy,
  Loader2,
} from 'lucide-react'

// UI
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

type CoCreationEntry = Database['public']['Tables']['session_cocreations']['Row']
type PendingEntry = CoCreationEntry & { _pending?: boolean }

interface CoCreationPanelProps {
  sessionId: string
  userId: string
  className?: string
}

const DRAFT_KEY = (sessionId: string, userId: string) => `cocreate:draft:${sessionId}:${userId}`

export default function CoCreationPanel({ sessionId, userId, className }: CoCreationPanelProps) {
  const [entries, setEntries] = useState<PendingEntry[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [aiBusy, setAiBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState<string>('')

  const listRef = useRef<HTMLDivElement>(null)

  /* ───────── Load initial entries ───────── */
  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('session_cocreations')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true })
          .limit(500)

        if (error) throw error
        if (mounted) setEntries((data ?? []) as PendingEntry[])
      } catch (e: any) {
        console.error('[CoCreation] load error:', e?.message || e)
        if (mounted) setError('Beiträge konnten nicht geladen werden.')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [sessionId])

  /* ───────── Draft autosave ───────── */
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem(DRAFT_KEY(sessionId, userId))
    if (saved) setInput(saved)
  }, [sessionId, userId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(DRAFT_KEY(sessionId, userId), input)
  }, [input, sessionId, userId])

  /* ───────── Realtime ───────── */
  useEffect(() => {
    const channel = supabase
      .channel(`session_cocreations_${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_cocreations', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          setEntries((prev) => {
            if (payload.eventType === 'INSERT') {
              const row = payload.new as CoCreationEntry
              const idx = prev.findIndex(
                p => p._pending && p.user_id === row.user_id && nearlySame(p.content, row.content)
              )
              if (idx >= 0) {
                const next = [...prev]
                next[idx] = row
                return next
              }
              // Auto-scroll on new entry
              requestAnimationFrame(() =>
                listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
              )
              return [...prev, row]
            }
            if (payload.eventType === 'UPDATE') {
              const row = payload.new as CoCreationEntry
              return prev.map((p) => (p.id === row.id ? row : p))
            }
            if (payload.eventType === 'DELETE') {
              const row = payload.old as CoCreationEntry
              return prev.filter((p) => p.id !== row.id)
            }
            return prev
          })
        }
      )
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [sessionId])

  const canSubmit = useMemo(() => !!input.trim() && !submitting, [input, submitting])

  /* ───────── Actions ───────── */
  async function submitEntry() {
    const trimmed = input.trim()
    if (!trimmed) return
    setSubmitting(true)
    setError(null)

    const pending: PendingEntry = {
      id: `temp:${Date.now()}`,
      session_id: sessionId,
      user_id: userId,
      content: trimmed,
      created_at: new Date().toISOString(),
      _pending: true,
    } as any

    setEntries((prev) => [...prev, pending])
    setInput('')

    try {
      const { error } = await supabase.from('session_cocreations').insert({
        session_id: sessionId,
        user_id: userId,
        content: trimmed,
      })
      if (error) throw error
      requestAnimationFrame(() =>
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
      )
    } catch (e: any) {
      setEntries((prev) => prev.filter((p) => p.id !== pending.id))
      setInput(trimmed)
      setError('Konnte Beitrag nicht speichern.')
      console.error('[CoCreation] submit error:', e?.message || e)
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(entry: CoCreationEntry) {
    if (entry.user_id !== userId) return
    setEditingId(entry.id)
    setEditingText(entry.content)
  }

  async function saveEdit(id: string) {
    const text = editingText.trim()
    if (!text) return
    try {
      const { error } = await supabase
        .from('session_cocreations')
        .update({ content: text })
        .eq('id', id)
        .eq('user_id', userId)
      if (error) throw error
      setEditingId(null)
      setEditingText('')
    } catch (e: any) {
      console.error('[CoCreation] update error:', e?.message || e)
      setError('Änderung konnte nicht gespeichert werden.')
    }
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingText('')
  }

  async function removeEntry(id: string) {
    try {
      const { error } = await supabase
        .from('session_cocreations')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
      if (error) throw error
    } catch (e: any) {
      console.error('[CoCreation] delete error:', e?.message || e)
      setError('Beitrag konnte nicht gelöscht werden.')
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {}
  }

  async function generateAI() {
    setAiBusy(true)
    setError(null)
    try {
      const context = entries.slice(-10).map((e) => `- ${e.content}`).join('\n')
      const res = await fetch('/api/copilot/generate-cocreation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, context }),
      })
      const result = await res.json()
      const content = (result?.text || '').trim()
      if (content) {
        setInput((prev) => (prev ? `${prev}\n\n${content}` : content))
      }
    } catch (e: any) {
      console.error('[CoCreation] AI error:', e?.message || e)
      setError('KI-Vorschlag fehlgeschlagen.')
    } finally {
      setAiBusy(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'enter') {
      e.preventDefault()
      if (canSubmit) void submitEntry()
    }
  }

  /* ───────── Render helpers ───────── */
  function renderContent(text: string) {
    return <>{linkify(text).map((p, i) => (typeof p === 'string' ? <span key={i}>{p}</span> : p))}</>
  }

  return (
    <div className={cn('rounded-2xl border bg-card/60 p-4', className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">🤝 Co-Creation</h3>
        <div className="text-xs text-muted-foreground" aria-live="polite">
          {loading ? 'Lade…' : `${entries.length} Beitrag${entries.length === 1 ? '' : 'e'}`}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}

      <div ref={listRef} className="mb-4 max-h-72 space-y-2 overflow-y-auto pr-1">
        {loading ? (
          <div className="space-y-2" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-md bg-muted/60" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">Noch keine gemeinsamen Beiträge.</p>
        ) : (
          entries.map((e) => {
            const mine = e.user_id === userId
            const pending = (e as any)._pending
            const isEditing = editingId === e.id

            return (
              <div
                key={e.id}
                className={cn(
                  'group rounded-lg border bg-background/60 p-3 text-sm',
                  mine ? 'border-primary/30' : 'border-border',
                  pending && 'opacity-70'
                )}
              >
                {!isEditing ? (
                  <>
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <div className="min-w-0 break-words leading-relaxed">
                        {renderContent(e.content)}
                      </div>
                      <div className="ml-2 flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => copyText(e.content)}
                          title="Kopieren"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {mine && !pending && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => startEdit(e)}
                              title="Bearbeiten"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => removeEntry(e.id)}
                              title="Löschen"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{formatDate(e.created_at)}</span>
                      {pending && (
                        <span className="inline-flex items-center gap-1">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          wird gespeichert …
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Textarea
                      value={editingText}
                      onChange={setEditingText}
                      rows={3}
                      className="text-sm"
                      autoFocus
                      maxLength={2000}
                      showCount
                    />
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => saveEdit(e.id)}>
                        <Check className="mr-2 h-4 w-4" />
                        Speichern
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        <X className="mr-2 h-4 w-4" />
                        Abbrechen
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Composer */}
      <div className="rounded-xl border bg-card/50 p-3">
        <Textarea
          value={input}
          onChange={setInput}
          onKeyDown={onKeyDown}
          placeholder="Gemeinsamen Beitrag schreiben… (⌘/Ctrl+Enter zum Senden, Shift+Enter: Zeilenumbruch)"
          rows={3}
          className="mb-2"
          disabled={submitting}
          maxLength={2000}
          showCount
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={submitEntry} disabled={!canSubmit}>
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Senden
          </Button>
          <Button onClick={generateAI} disabled={aiBusy} variant="outline">
            {aiBusy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            KI-Vorschlag
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">
            Entwürfe werden lokal gespeichert.
          </span>
        </div>
      </div>
    </div>
  )
}

/* ───────── helpers ───────── */

function linkify(text: string): React.ReactNode[] {
  const urlRe = /((https?:\/\/|www\.)[^\s]+)/gi
  const parts: React.ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(urlRe)) {
    const start = m.index ?? 0
    const raw = m[0]
    if (start > last) parts.push(text.slice(last, start))
    const href = raw.startsWith('http') ? raw : `https://${raw}`
    parts.push(
      <a
        key={`${start}-${raw}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2"
      >
        {raw}
      </a>
    )
    last = start + raw.length
  }
  if (last < text.length) parts.push(text.slice(last))
  // Zeilenumbrüche beibehalten
  return parts.flatMap((p) =>
    typeof p === 'string'
      ? (p
          .split('\n')
          .flatMap((line, i, arr) => (i < arr.length - 1 ? [line, <br key={`br-${i}`} />] : [line])) as React.ReactNode[])
      : [p]
  )
}

function nearlySame(a: string, b: string) {
  const na = a.trim().replace(/\s+/g, ' ')
  const nb = b.trim().replace(/\s+/g, ' ')
  if (na === nb) return true
  return Math.abs(na.length - nb.length) < 4 && (na.startsWith(nb) || nb.startsWith(na))
}
