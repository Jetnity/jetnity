'use client'

import { useState } from 'react'
import { useCopilotComment } from '@/lib/intelligence/useCopilotComment'
import { Loader2, Sparkles } from 'lucide-react'

export default function AiCommentButton({ snippet }: { snippet: string }) {
  const { run, cancel, loading, error, result } = useCopilotComment()
  const [open, setOpen] = useState(false)

  const handleClick = async () => {
    setOpen(true)
    await run(snippet, { style: 'auto', language: 'de', temperature: 0.7 })
  }

  return (
    <div className="space-y-2">
      <button
        onClick={loading ? cancel : handleClick}
        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 
          ${loading ? 'bg-gray-200 text-gray-700' : 'bg-primary text-white hover:bg-primary/90'}
          transition`}
        title={loading ? 'Abbrechen' : 'KI-Kommentar erzeugen'}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {loading ? 'Abbrechen' : 'KI-Kommentar'}
      </button>

      {open && (
        <div className="rounded-lg border border-gray-200 bg-white/60 p-3 text-sm backdrop-blur">
          {error && <p className="text-red-600">{error}</p>}
          {result ? (
            <div className="space-y-1">
              <p className="font-medium">Vorschlag ({result.intent}):</p>
              <p className="text-gray-800">{result.aiComment}</p>
            </div>
          ) : loading ? (
            <p className="text-gray-600">Denke nach …</p>
          ) : (
            <p className="text-gray-500">Noch kein Kommentar.</p>
          )}
        </div>
      )}
    </div>
  )
}
