'use client'

import { useState } from 'react'

type SnippetType = 'text' | 'idea' | 'hashtag' | 'cta' | 'script'

type Props = {
  onSubmit: (content: string, type: SnippetType) => void
  isLoading?: boolean
}

const SNIPPET_TYPES: { value: SnippetType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'idea', label: 'Idee' },
  { value: 'hashtag', label: 'Hashtag' },
  { value: 'cta', label: 'Call to Action' },
  { value: 'script', label: 'Video-Skript' },
]

const SmartSnippetForm = ({ onSubmit, isLoading = false }: Props) => {
  const [type, setType] = useState<SnippetType>('text')
  const [content, setContent] = useState('')
  const [loadingSuggestion, setLoadingSuggestion] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = content.trim()
    if (trimmed.length > 0) {
      onSubmit(trimmed, type)
      setContent('')
    }
  }

  const handleGenerateSuggestion = async () => {
    setLoadingSuggestion(true)
    try {
      const res = await fetch('/api/copilot/snippet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })

      const json = await res.json()
      const suggestion = json?.suggestion?.toString().trim()

      if (suggestion) {
        setContent(suggestion)
      }
    } catch (err) {
      console.error('Fehler bei KI-Vorschlag:', err)
    }
    setLoadingSuggestion(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border rounded-xl p-4 bg-muted/40">
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
        <label className="text-sm font-medium">Typ:</label>
        <select
          className="rounded-md border px-3 py-1 text-sm bg-background"
          value={type}
          onChange={(e) => setType(e.target.value as SnippetType)}
        >
          {SNIPPET_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <textarea
        className="w-full rounded-md border border-input bg-background p-2 text-sm"
        rows={4}
        placeholder="Neues Snippet eingeben oder Vorschlag generieren…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
        <button
          type="button"
          onClick={handleGenerateSuggestion}
          disabled={loadingSuggestion}
          className="text-sm text-muted-foreground hover:underline"
        >
          {loadingSuggestion ? 'KI generiert…' : '💡 Vorschlag erhalten'}
        </button>

        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-primary text-white text-sm hover:bg-primary/90 transition disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Speichern…' : 'Snippet hinzufügen'}
        </button>
      </div>
    </form>
  )
}

export default SmartSnippetForm

