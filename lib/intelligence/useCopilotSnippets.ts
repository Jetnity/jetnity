'use client'

import { useCallback, useRef, useState } from 'react'

type Snippet = { id: string; content: string }
type Options = {
  language?: 'de' | 'en'
  maxSuggestions?: number
  topic?: string
  temperature?: number
  timeoutMs?: number
}

export function useCopilotSnippets() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const ctrlRef = useRef<AbortController | null>(null)

  const cancel = useCallback(() => {
    ctrlRef.current?.abort()
    ctrlRef.current = null
  }, [])

  const run = useCallback(async (sessionId: string, opts: Options = {}) => {
    setLoading(true)
    setError(null)
    ctrlRef.current?.abort()
    const controller = new AbortController()
    ctrlRef.current = controller

    const {
      language = 'de',
      maxSuggestions = 3,
      topic,
      temperature = 0.8,
      timeoutMs = 20000,
    } = opts

    const t = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const res = await fetch('/api/copilot/snippets', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, language, maxSuggestions, topic, temperature }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || `HTTP ${res.status}`)
      }
      const data = (await res.json()) as { success: boolean; snippets: Snippet[] }
      setSnippets(data.snippets || [])
      return data.snippets || []
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        setError('Abgebrochen')
      } else {
        setError(e?.message || 'Unbekannter Fehler')
      }
      return []
    } finally {
      clearTimeout(t)
      setLoading(false)
      ctrlRef.current = null
    }
  }, [])

  return { run, cancel, loading, error, snippets }
}
