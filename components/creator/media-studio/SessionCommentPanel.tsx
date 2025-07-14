'use client'

import { useState } from 'react'
import type { Database } from '@/types/supabase'

type Comment = Database['public']['Tables']['session_comments']['Row']

type Props = {
  comments: Comment[]
  onAddComment: (text: string) => void
}

const SessionCommentPanel = ({ comments, onAddComment }: Props) => {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (trimmed.length > 0) {
      onAddComment(trimmed)
      setInput('')
    }
  }

  return (
    <div className="border rounded-xl p-4 space-y-4 bg-muted/40">
      <h2 className="text-lg font-semibold">💬 Kommentare</h2>

      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          className="w-full rounded-md border border-input bg-background p-2 text-sm"
          rows={3}
          placeholder="Kommentar hinzufügen…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 transition"
        >
          Abschicken
        </button>
      </form>

      <div className="space-y-2">
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Noch keine Kommentare vorhanden.
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-white p-3 rounded-md shadow-sm">
              <p className="text-sm text-foreground">{comment.text}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {/* user_id anzeigen oder später ersetzen durch z. B. Creator-Name */}
                Von Nutzer-ID {comment.user_id} am{' '}
                {comment.created_at
                  ? new Date(comment.created_at).toLocaleDateString('de-DE')
                  : 'Unbekannt'}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default SessionCommentPanel
