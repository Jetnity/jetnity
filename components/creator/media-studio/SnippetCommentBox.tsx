'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Database } from '@/types/supabase'

type Comment = Database['public']['Tables']['session_comments']['Row'] & {
  isEditing?: boolean
  editedContent?: string
}

interface SnippetCommentBoxProps {
  sessionId: string
  snippetId: string
  userId: string
  snippet: { content: string }
}

export default function SnippetCommentBox({
  sessionId,
  snippetId,
  userId,
  snippet,
}: SnippetCommentBoxProps) {
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const loadComments = async () => {
    const { data, error } = await supabase
      .from('session_comments')
      .select('*')
      .eq('session_id', sessionId)
      .eq('snippet_id', snippetId)
      .order('created_at', { ascending: true })

    if (!error && Array.isArray(data)) {
      setComments(
        data.map((c) => ({
          ...c,
          isEditing: false,
          editedContent: '',
        }))
      )
    }
  }

  useEffect(() => {
    loadComments()
  }, [sessionId, snippetId])

  const handleSubmit = async () => {
    if (!comment.trim()) return
    setLoading(true)

    const { error } = await supabase.from('session_comments').insert({
      session_id: sessionId,
      snippet_id: snippetId,
      user_id: userId,
      content: comment.trim(),
    })

    setLoading(false)
    setComment('')
    if (!error) loadComments()
  }

  const startEdit = (id: string, text: string) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, isEditing: true, editedContent: text } : c
      )
    )
  }

  const cancelEdit = (id: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isEditing: false } : c))
    )
  }

  const saveEdit = async (id: string, newText: string) => {
    const { error } = await supabase
      .from('session_comments')
      .update({ text: newText })
      .eq('id', id)
      .eq('user_id', userId)

    if (!error) loadComments()
  }

  const deleteComment = async (id: string) => {
    const { error } = await supabase
      .from('session_comments')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (!error) loadComments()
  }

  const generateAIComment = async () => {
    setGenerating(true)
    const res = await fetch('/api/generate-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ snippetContent: snippet.content }),
    })

    const result = await res.json()
    const text = result?.aiComment?.trim()

    if (text) {
      await supabase.from('session_comments').insert({
        session_id: sessionId,
        snippet_id: snippetId,
        user_id: userId,
        content: `[KI] ${text}`,
      })
      loadComments()
    }

    setGenerating(false)
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Kommentare</h4>
        {comments.length === 0 && (
          <p className="text-sm text-gray-400 italic">Noch keine Kommentare.</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="border rounded p-3 bg-gray-50 space-y-2 text-sm">
            {c.isEditing ? (
              <>
                <Input
                  value={c.editedContent}
                  onChange={(e) =>
                    setComments((prev) =>
                      prev.map((x) =>
                        x.id === c.id ? { ...x, editedContent: e.target.value } : x
                      )
                    )
                  }
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => saveEdit(c.id, c.editedContent || '')}>
                    Speichern
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => cancelEdit(c.id)}>
                    Abbrechen
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="text-gray-800">{c.text}</div>
                <div className="text-gray-400 text-xs">
                  {c.created_at
                    ? new Date(c.created_at).toLocaleString('de-DE')
                    : 'Zeitpunkt unbekannt'}
                </div>
                {c.user_id === userId && (
                  <div className="flex gap-2 mt-1">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(c.id, c.text || '')}>
                      ✏️ Bearbeiten
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteComment(c.id)}>
                      🗑️ Löschen
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2">
        <Input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Kommentar hinzufügen..."
          disabled={loading}
          className="w-full"
        />
        <Button onClick={handleSubmit} disabled={loading || !comment.trim()} size="sm">
          Senden
        </Button>
        <Button onClick={generateAIComment} disabled={generating} size="sm" variant="outline">
          💡 KI-Kommentar generieren
        </Button>
      </div>
    </div>
  )
}
