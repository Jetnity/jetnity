'use client'

import { useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'

type Intent = 'question' | 'suggestion' | 'insight'
type CommentResult = { aiComment: string; intent: Intent }

type Options = {
  language?: 'de' | 'en'
  style?: 'auto' | 'question' | 'suggestion' | 'insight'
  temperature?: number
  timeoutMs?: number
  /** Sonner-Toast bei Fehlern zeigen (default: true) */
  toastOnError?: boolean
}

export function useCopilotComment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CommentResult | null>(null)
  const ctrlRef = useRef<AbortController | null>(null)

  const cancel = useCallback(() => {
    ctrlRef.current?.abort()
    ctrlRef.current = null
  }, [])

  const run = useCallback(
    async (snippetContent: string, opts: Options = {}) => {
      setLoading(true)
      setError(null)
      setResult(null)

      // evtl. laufende Anfrage abbrechen
      ctrlRef.current?.abort()
      const controller = new AbortController()
      ctrlRef.current = controller

      const {
        language = 'de',
        style = 'auto',
        temperature = 0.7,
        timeoutMs = 20_000,
        toastOnError = true,
      } = opts

      const t = setTimeout(() => controller.abort(), timeoutMs)

      try {
        const res = await fetch('/api/copilot/comment', {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ snippetContent, language, style, temperature }),
        })

        const data = await res.json().catch(() => ({} as any))

        if (!res.ok || !data?.success) {
          const msg =
            data?.error ||
            (res.status === 429
              ? 'Zu viele Anfragen – bitte kurz warten.'
              : `HTTP ${res.status}`)
          throw new Error(msg)
        }

        const out: CommentResult = { aiComment: data.aiComment, intent: data.intent }
        setResult(out)
        return out
      } catch (e: any) {
        const msg = e?.name === 'AbortError' ? 'Abgebrochen' : (e?.message || 'Unbekannter Fehler')
        setError(msg)
        if (toastOnError) toast.error(msg)
        return null
      } finally {
        clearTimeout(t)
        setLoading(false)
        ctrlRef.current = null
      }
    },
    []
  )

  return { run, cancel, loading, error, result }
}
