'use client'

import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'
import SnippetCommentBox from './SnippetCommentBox'

type Snippet = Database['public']['Tables']['session_snippets']['Row']

interface Props {
  snippets: Snippet[]
  sessionId: string
  userId: string
}

export default function SmartSnippetList({ snippets, sessionId, userId }: Props) {
  const handleInsert = async (content: string) => {
    const { error } = await supabase
      .from('session_snippets')
      .insert({ session_id: sessionId, content, user_id: userId })

    if (error) {
      console.error('Einfügen fehlgeschlagen:', error.message)
    }
  }

  return (
    <div className="space-y-6">
      {snippets.length === 0 && (
        <div className="text-sm text-gray-400 italic">Keine Vorschläge verfügbar.</div>
      )}

      {snippets.map((snippet) => (
        <div
          key={snippet.id}
          className="border rounded-md p-4 bg-white shadow-sm space-y-4"
        >
          <p className="text-sm text-gray-800">{snippet.content ?? 'Kein Inhalt'}</p>

          <Button
            variant="default"
            size="sm"
            onClick={() => handleInsert(snippet.content ?? '')}
          >
            In Session einfügen
          </Button>

          <SnippetCommentBox
            sessionId={sessionId}
            snippetId={snippet.id}
            userId={userId}
            snippet={snippet}
          />
        </div>
      ))}
    </div>
  )
}
