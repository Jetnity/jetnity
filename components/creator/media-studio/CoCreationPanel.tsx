'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Database } from '@/types/supabase'
import { formatDate } from '@/lib/utils/formatDate'

interface CoCreationPanelProps {
  sessionId: string
  userId: string
}

type CoCreationEntry = Database['public']['Tables']['session_cocreations']['Row']

export default function CoCreationPanel({ sessionId, userId }: CoCreationPanelProps) {
  const [entries, setEntries] = useState<CoCreationEntry[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  const loadEntries = async () => {
    const { data, error } = await supabase
      .from('session_cocreations')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setEntries(data)
    } else {
      console.error('Fehler beim Laden der CoCreations:', error?.message)
    }
  }

  useEffect(() => {
    loadEntries()
  }, [sessionId])

  const submitEntry = async () => {
    const trimmed = input.trim()
    if (!trimmed) return

    setLoading(true)
    try {
      const { error } = await supabase.from('session_cocreations').insert({
        session_id: sessionId,
        user_id: userId,
        content: trimmed,
      })

      if (!error) {
        setInput('')
        loadEntries()
      } else {
        console.error('Fehler beim Speichern:', error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const generateAIEntry = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/copilot/generate-cocreation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })

      const result = await res.json()
      const content = result?.text?.trim()

      if (content) {
        const { error } = await supabase.from('session_cocreations').insert({
          session_id: sessionId,
          user_id: userId,
          content: `[KI] ${content}`,
        })

        if (!error) loadEntries()
      }
    } catch (err) {
      console.error('Fehler bei KI-Eintrag:', err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-4 p-4 border rounded bg-white">
      <h3 className="text-lg font-semibold text-gray-800">🤝 CoCreation Panel</h3>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {entries.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Noch keine gemeinsamen Beiträge.</p>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="p-3 rounded bg-gray-50 border text-sm shadow-sm">
              <p className="text-gray-800">{e.content}</p>
              <span className="text-xs text-gray-400">{formatDate(e.created_at)}</span>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Gemeinsamen Beitrag schreiben..."
          disabled={loading}
        />
        <Button
          onClick={submitEntry}
          disabled={loading || !input.trim()}
          size="sm"
        >
          Hinzufügen
        </Button>
        <Button
          onClick={generateAIEntry}
          disabled={generating}
          size="sm"
          variant="outline"
        >
          💡 KI-Idee generieren
        </Button>
      </div>
    </div>
  )
}
