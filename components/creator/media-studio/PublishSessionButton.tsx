'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { generateStoryInsights } from '@/lib/openai/generateStoryInsights'

interface Props {
  sessionId: string
}

export default function PublishSessionButton({ sessionId }: Props) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handlePublish = async () => {
    setLoading(true)
    setError('')
    setSuccess(false)

    // 1. Lade alle Snippets dieser Session
    const { data: snippets, error: snippetError } = await supabase
      .from('session_snippets')
      .select('content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (snippetError || !snippets || snippets.length === 0) {
      setError('Snippets konnten nicht geladen werden.')
      setLoading(false)
      return
    }

    const storyText = snippets.map((s) => s.content).join('\n')

    // 2. KI-Bewertung erzeugen
    const { rating, insights } = await generateStoryInsights(storyText)

    // 3. Session aktualisieren (Status, Sichtbarkeit, Analyse)
    const { error: updateError } = await supabase
      .from('creator_sessions')
      .update({
        status: 'approved',
        visibility: 'public',
        published_at: new Date().toISOString(),
        rating,
        insights,
      })
      .eq('id', sessionId)

    if (updateError) {
      setError('Veröffentlichung fehlgeschlagen.')
    } else {
      setSuccess(true)
    }

    setLoading(false)
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handlePublish}
        disabled={loading || success}
        size="sm"
        className="w-full"
      >
        {success
          ? '✅ Veröffentlicht & bewertet'
          : loading
          ? 'Veröffentliche & analysiere…'
          : '🌍 Veröffentlichen & CoPilot-Bewertung'}
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && (
        <p className="text-xs text-green-600 text-center">
          Jetzt im öffentlichen Feed mit Bewertung sichtbar.
        </p>
      )}
    </div>
  )
}
