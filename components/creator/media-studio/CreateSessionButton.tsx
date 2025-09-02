'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles } from 'lucide-react'
import type { Database } from '@/types/supabase'
import { cn as _cn } from '@/lib/utils'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

type Session = Database['public']['Tables']['creator_sessions']['Row']

interface CreateSessionButtonProps {
  userId: string
  onCreated: (sessionId: string) => void
  className?: string
  autoFocus?: boolean
}

export default function CreateSessionButton({
  userId,
  onCreated,
  className,
  autoFocus = false,
}: CreateSessionButtonProps) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canCreate = useMemo(() => {
    const t = title.trim()
    return t.length >= 3 && t.length <= 120 && !loading
  }, [title, loading])

  const suggestTitle = useCallback(() => {
    const d = new Date()
    const nice =
      'Session ' +
      d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }) +
      ' • ' +
      d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    setTitle((prev) => (prev.trim().length ? prev : nice))
  }, [])

  const handleCreate = useCallback(async () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle || loading) return
    setLoading(true)
    setError(null)

    try {
      // 1) Session anlegen
      const { data, error } = await supabase
        .from('creator_sessions')
        .insert({
          title: trimmedTitle,
          user_id: userId,
          role: 'owner',
          status: 'active',
          shared_with: [],
        })
        .select('id')
        .single()

      if (error || !data?.id) {
        throw new Error(error?.message || 'Erstellung fehlgeschlagen')
      }

      // 2) Optional: Initiales Edit-Dokument anlegen (failsafe – wenn Tabelle fehlt, wird Fehler ignoriert)
      try {
        await supabase.from('edit_docs').insert({
          user_id: userId,
          session_id: data.id,
          title: trimmedTitle,
          kind: 'photo', // oder 'video' – nur als Startpunkt
          content: '',
        } as any)
      } catch {
        // ignorieren – nicht kritisch für den Flow
      }

      setTitle('')
      onCreated(data.id)
    } catch (e: any) {
      setError(e?.message || 'Unerwarteter Fehler bei der Erstellung.')
    } finally {
      setLoading(false)
    }
  }, [title, userId, onCreated, loading])

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'enter') {
      e.preventDefault()
      if (canCreate) void handleCreate()
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (canCreate) void handleCreate()
    }
  }

  return (
    <div className={cn('space-y-2 rounded-2xl border bg-card/60 p-3', className)}>
      <div className="flex items-center gap-2">
        <Input
          autoFocus={autoFocus}
          placeholder="Titel der neuen Session"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={loading}
          aria-invalid={!!error}
          aria-describedby={error ? 'create-session-error' : undefined}
          className="flex-1"
          maxLength={140}
        />
        <Button type="button" variant="outline" onClick={suggestTitle} disabled={loading} title="Titel vorschlagen">
          <Sparkles className="mr-2 h-4 w-4" /> Vorschlag
        </Button>
        <Button type="button" onClick={handleCreate} disabled={!canCreate} className="min-w-[12rem]">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <>+ Neue Session</>}
        </Button>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Tipp: ⌘/Ctrl + Enter erstellt sofort.</span>
        <span>{title.trim().length}/120</span>
      </div>

      {error && (
        <div
          id="create-session-error"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      )}
    </div>
  )
}
