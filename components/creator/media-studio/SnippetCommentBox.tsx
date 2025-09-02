// components/creator/media-studio/SnippetCommentBox.tsx
'use client'

import * as React from 'react'
import { supabase } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import type { Tables } from '@/types/supabase'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type CommentRow = Tables<'session_comments'>
type CommentUI = CommentRow & {
  isEditing?: boolean
  editedContent?: string
  _optimistic?: boolean
}

interface SnippetCommentBoxProps {
  sessionId: string
  snippetId: string
  userId: string
  snippet: { content: string }
  className?: string
}

export default function SnippetCommentBox({
  sessionId,
  snippetId,
  userId,
  snippet,
  className,
}: SnippetCommentBoxProps) {
  const [input, setInput] = React.useState('')
  const [comments, setComments] = React.useState<CommentUI[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sending, setSending] = React.useState(false)
  const [generating, setGenerating] = React.useState(false)

  const dtf = React.useMemo(
    () =>
      new Intl.DateTimeFormat('de-CH', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    []
  )

  const loadComments = React.useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('session_comments')
      .select('*')
      .eq('session_id', sessionId)
      .eq('parent_id', snippetId) // ⬅️ statt snippet_id
      .order('created_at', { ascending: true })

    if (error) {
      toast.error('Kommentare konnten nicht geladen werden.')
    } else {
      setComments(
        (data ?? []).map((c) => ({
          ...c,
          isEditing: false,
          editedContent: '',
        }))
      )
    }
    setLoading(false)
  }, [sessionId, snippetId])

  React.useEffect(() => {
    loadComments()
  }, [loadComments])

  // Realtime: auf session_id filtern, im Callback zusätzlich parent_id checken
  React.useEffect(() => {
    const channel = supabase
      .channel(`session_comments:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_comments',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as CommentRow
          const oldRow = (payload.old as CommentRow) || row
          // Nur Kommentare zum aktuellen Snippet
          const parentId = (payload.eventType === 'DELETE' ? oldRow.parent_id : row.parent_id)
          if (parentId !== snippetId) return

          setComments((prev) => {
            switch (payload.eventType) {
              case 'INSERT':
                if (prev.some((p) => p.id === row.id)) return prev
                return [...prev, { ...row }]
              case 'UPDATE':
                return prev.map((c) => (c.id === row.id ? { ...c, ...row } : c))
              case 'DELETE':
                return prev.filter((c) => c.id !== oldRow.id)
              default:
                return prev
            }
          })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [sessionId, snippetId])

  // Neuer Kommentar (optimistic)
  const handleSubmit = async () => {
    const text = input.trim()
    if (!text) return
    setSending(true)

    const tempId = `temp-${crypto.randomUUID()}`
    const optimistic: CommentUI = {
      id: tempId as any,
      session_id: sessionId,
      parent_id: snippetId, // ⬅️ statt snippet_id
      user_id: userId,
      text, // ⬅️ statt content
      meta: null as any, // falls meta nullable ist; Supabase-Default greift sonst
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _optimistic: true,
    }
    setComments((prev) => [...prev, optimistic])
    setInput('')

    const { error } = await supabase.from('session_comments').insert({
      session_id: sessionId,
      parent_id: snippetId,
      user_id: userId,
      text,
    })

    if (error) {
      setComments((prev) => prev.filter((c) => c.id !== tempId))
      setInput(text)
      toast.error('Kommentar konnte nicht gesendet werden.')
    }
    setSending(false)
  }

  const startEdit = (id: string, current: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, isEditing: true, editedContent: current } : c
      )
    )
  }

  const cancelEdit = (id: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isEditing: false, editedContent: '' } : c))
    )
  }

  const saveEdit = async (id: string, newText: string) => {
    const trimmed = (newText ?? '').trim()
    if (!trimmed) {
      toast.message('Leerer Kommentar kann nicht gespeichert werden.')
      return
    }

    const prevSnapshot = comments
    setComments((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, text: trimmed, isEditing: false, editedContent: '' } : c
      )
    )

    const { error } = await supabase
      .from('session_comments')
      .update({ text: trimmed }) // ⬅️ statt content
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      setComments(prevSnapshot)
      toast.error('Änderung konnte nicht gespeichert werden.')
    }
  }

  const deleteComment = async (id: string) => {
    const prevSnapshot = comments
    setComments((p) => p.filter((c) => c.id !== id))

    const { error } = await supabase
      .from('session_comments')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      setComments(prevSnapshot)
      toast.error('Kommentar konnte nicht gelöscht werden.')
    }
  }

  const generateAIComment = async () => {
    try {
      setGenerating(true)
      const res = await fetch('/api/generate-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snippetContent: snippet.content }),
      })
      if (!res.ok) throw new Error('Fehler beim KI-Request')
      const result = await res.json()
      const text: string | undefined = result?.aiComment?.trim()
      if (!text) {
        toast.message('Kein KI-Vorschlag erhalten.')
        return
      }

      const { error } = await supabase.from('session_comments').insert({
        session_id: sessionId,
        parent_id: snippetId,
        user_id: userId,
        text: `[KI] ${text}`,
      })
      if (error) throw error
      toast.success('KI-Kommentar hinzugefügt.')
    } catch {
      toast.error('KI-Kommentar konnte nicht generiert werden.')
    } finally {
      setGenerating(false)
    }
  }

  const onKeyDownInput: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!sending && input.trim()) void handleSubmit()
    }
  }

  return (
    <div className={cn('mt-4 space-y-4', className)}>
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">Kommentare</h4>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Lädt …
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Noch keine Kommentare.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => {
              const isOwner = c.user_id === userId
              return (
                <li
                  key={c.id}
                  className={cn('rounded-xl border p-3 text-sm', c._optimistic ? 'opacity-70' : 'bg-muted/30')}
                >
                  {c.isEditing ? (
                    <div className="space-y-2">
                      <Textarea
                        value={c.editedContent}
                        // Euer Textarea liefert vermutlich (value: string)
                        onChange={(val: any) =>
                          setComments((prev) =>
                            prev.map((x) =>
                              x.id === c.id
                                ? {
                                    ...x,
                                    editedContent:
                                      typeof val === 'string'
                                        ? val
                                        : (val?.target as HTMLTextAreaElement | undefined)?.value ?? '',
                                  }
                                : x
                            )
                          )
                        }
                        rows={3}
                        aria-label="Kommentar bearbeiten"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(c.id, c.editedContent || '')}>
                          Speichern
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => cancelEdit(c.id)}>
                          Abbrechen
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-foreground whitespace-pre-wrap break-words">{c.text}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{c.created_at ? dtf.format(new Date(c.created_at)) : 'Zeitpunkt unbekannt'}</span>
                        {isOwner && <span className="rounded bg-muted px-1.5 py-0.5">Du</span>}
                      </div>
                      {isOwner && (
                        <div className="mt-1 flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => startEdit(c.id, c.text || '')}
                            aria-label="Kommentar bearbeiten"
                          >
                            ✏️ Bearbeiten
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteComment(c.id)}
                            aria-label="Kommentar löschen"
                          >
                            🗑️ Löschen
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <Input
          value={input}
          onChange={(e) => setInput((e as any)?.target?.value ?? '')}
          onKeyDown={onKeyDownInput}
          placeholder="Kommentar hinzufügen…"
          disabled={sending}
          aria-label="Neuen Kommentar eingeben"
          className="w-full"
        />
        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={sending || !input.trim()} size="sm">
            {sending ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" />
                Senden …
              </>
            ) : (
              'Senden'
            )}
          </Button>
          <Button onClick={generateAIComment} disabled={generating} size="sm" variant="outline">
            {generating ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" />
                KI …
              </>
            ) : (
              '💡 KI-Kommentar'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
