'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'

import SessionShareForm from './SessionShareForm'
import SessionCommentPanel from './SessionCommentPanel'
import SmartSnippetList from './SmartSnippetList'
import SmartSnippetForm from './SmartSnippetForm'

// Typen definieren
export type Session = Database['public']['Tables']['creator_sessions']['Row']
type Comment = Database['public']['Tables']['session_comments']['Row']
type Snippet = Database['public']['Tables']['session_snippets']['Row']

type Props = {
  session: Session
}

const SessionEditor = ({ session }: Props) => {
  const [comments, setComments] = useState<Comment[]>([])
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [loading, setLoading] = useState(true)

  // 📌 Session-ID extrahieren
  const sessionId = session?.id

  // 💬 Kommentare & Snippets laden
  useEffect(() => {
    if (!sessionId) return

    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('session_comments')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Kommentare konnten nicht geladen werden:', error.message)
      } else {
        setComments(data ?? [])
      }
    }

    const fetchSnippets = async () => {
      const { data, error } = await supabase
        .from('session_snippets')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Snippets konnten nicht geladen werden:', error.message)
      } else {
        setSnippets(data ?? [])
      }
    }

    setLoading(true)
    fetchComments()
    fetchSnippets()
    setLoading(false)
  }, [sessionId])

  // ➕ Kommentar hinzufügen
  const handleAddComment = async (text: string) => {
    const { data, error } = await supabase
      .from('session_comments')
      .insert({ session_id: sessionId, content: text })
      .select('*')

    if (error) {
      console.error('Kommentar konnte nicht gespeichert werden:', error.message)
    } else if (data?.[0]) {
      setComments((prev) => [...prev, data[0]])
    }
  }

  // ➕ Snippet hinzufügen
  const handleAddSnippet = async (content: string, type: string) => {
    const { data, error } = await supabase
      .from('session_snippets')
      .insert({ session_id: sessionId, content, type })
      .select('*')

    if (error) {
      console.error('Snippet konnte nicht gespeichert werden:', error.message)
    } else if (data?.[0]) {
      setSnippets((prev) => [...prev, data[0]])
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">🧠 KI-CoCreation</h2>

      <SessionShareForm sessionId={sessionId} />

      {loading ? (
        <p className="text-muted-foreground">Lade Session-Daten…</p>
      ) : (
        <div className="space-y-8">
          <SessionCommentPanel
            comments={comments}
            onAddComment={handleAddComment}
          />

          <div className="space-y-3">
            <h3 className="text-base font-semibold">📄 Snippets</h3>
            <SmartSnippetForm onSubmit={handleAddSnippet} />
            <SmartSnippetList
              snippets={snippets}
              sessionId={sessionId}
              userId={snippets[0]?.user_id ?? ''}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default SessionEditor