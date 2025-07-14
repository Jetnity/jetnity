'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import SmartSnippetList from './SmartSnippetList'
import PublishSessionButton from './PublishSessionButton'
import { Button } from '@/components/ui/button'
import type { Database } from '@/types/supabase'

type Snippet = Database['public']['Tables']['session_snippets']['Row']

interface SidebarAIProps {
  sessionId: string | null
}

export default function SidebarAI({ sessionId }: SidebarAIProps) {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [userId, setUserId] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Lade eingeloggten User
  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUserId(user.id)
      }
    }

    loadUser()
  }, [])

  // Lade Snippets über API
  const fetchSnippets = async () => {
    if (!sessionId) return

    setLoading(true)
    try {
      const response = await fetch('/api/copilot/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      const result = await response.json()
      const data = result?.snippets

      setSnippets(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Fehler beim Laden der Snippets:', err)
      setSnippets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (sessionId) fetchSnippets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  if (!sessionId) {
    return (
      <div className="p-4 text-sm text-gray-500 italic">
        Wähle eine Session, um KI-Vorschläge zu sehen.
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">KI-Vorschläge</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchSnippets}
          disabled={loading}
        >
          {loading ? 'Lade...' : 'Aktualisieren'}
        </Button>
      </div>

      <SmartSnippetList
        snippets={snippets}
        sessionId={sessionId}
        userId={userId}
      />

      {/* Veröffentlichung (Story Feed) */}
      <div className="pt-4 border-t">
        <PublishSessionButton sessionId={sessionId} />
      </div>
    </div>
  )
}
