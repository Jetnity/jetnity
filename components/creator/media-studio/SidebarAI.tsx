'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { RefreshCcw, PanelsTopLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import SmartSnippetList from './SmartSnippetList'
import PublishSessionButton from './PublishSessionButton'

// Fallback, falls utils.cn mal nicht exportiert ist
import { cn as _cn } from '@/lib/utils'
const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

type Snippet = Database['public']['Tables']['session_snippets']['Row']

interface SidebarAIProps {
  sessionId: string | null
}

export default function SidebarAI({ sessionId }: SidebarAIProps) {
  const [snippets, setSnippets] = useState<Snippet[]>([])
  const [userId, setUserId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Eingeloggten User laden (clientseitig)
  useEffect(() => {
    let ignore = false
    ;(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!ignore && user) setUserId(user.id)
    })()
    return () => {
      ignore = true
    }
  }, [])

  // Snippets vom API-Endpunkt laden
  const fetchSnippets = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/copilot/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const json = await res.json()
      const data = Array.isArray(json?.snippets) ? (json.snippets as Snippet[]) : []
      setSnippets(data)
    } catch (e) {
      console.error('Fehler beim Laden der Snippets:', e)
      setError('Konnte Vorschläge gerade nicht laden.')
      setSnippets([])
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    if (sessionId) fetchSnippets()
  }, [sessionId, fetchSnippets])

  if (!sessionId) {
    return (
      <div className="p-4 text-sm text-muted-foreground italic">
        Wähle eine Session, um KI-Vorschläge zu sehen.
      </div>
    )
  }

  return (
    <aside className="p-4 space-y-6">
      {/* Kopfzeile */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold">KI-Vorschläge</h2>

        <div className="flex items-center gap-2">
          {/* Refresh */}
          <button
            type="button"
            onClick={fetchSnippets}
            disabled={loading}
            aria-busy={loading}
            className={cn(
              'inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium',
              'border border-zinc-200 bg-white hover:bg-zinc-50',
              'focus-ring'
            )}
          >
            <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
            {loading ? 'Lade …' : 'Aktualisieren'}
          </button>

          {/* Direkter Einstieg ins Media-Studio (ohne asChild) */}
          <Link
            href="/creator/media-studio"
            prefetch
            aria-label="Media-Studio öffnen"
            className={cn(
              'inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-semibold',
              'bg-zinc-900 text-white hover:bg-zinc-800',
              'focus-ring'
            )}
          >
            <PanelsTopLeft className="h-4 w-4" />
            Media-Studio
          </Link>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Vorschläge */}
      <SmartSnippetList snippets={snippets} sessionId={sessionId} userId={userId} />

      {/* Veröffentlichung (Story Feed) */}
      <div className="pt-4 border-t">
        <PublishSessionButton sessionId={sessionId} />
      </div>
    </aside>
  )
}
