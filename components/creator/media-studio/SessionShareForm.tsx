// components/creator/media-studio/SessionShareForm.tsx
'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import { X, Link as LinkIcon } from 'lucide-react'
import { cn as _cn } from '@/lib/utils'

const cn = typeof _cn === 'function' ? _cn : (...a: any[]) => a.filter(Boolean).join(' ')

type Session = Database['public']['Tables']['creator_sessions']['Row']

type Props = {
  sessionId: Session['id']
  /** optional für sofortige Anzeige; hält sich dank Realtime aktuell */
  initialSharedWith?: Session['shared_with'] | null
  className?: string
}

export default function SessionShareForm({ sessionId, initialSharedWith, className }: Props) {
  const [email, setEmail] = React.useState('')
  const [shared, setShared] = React.useState<string[]>(
    Array.isArray(initialSharedWith) ? initialSharedWith : []
  )
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [msg, setMsg] = React.useState<string | null>(null)

  // Realtime: shared_with-Updates live spiegeln
  React.useEffect(() => {
    const ch = supabase
      .channel(`creator_sessions:${sessionId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'creator_sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          const next = (payload.new as any)?.shared_with
          if (Array.isArray(next)) setShared(next)
        }
      )
      .subscribe()
    return () => { void supabase.removeChannel(ch) }
  }, [sessionId])

  async function addEmail(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    const trimmed = email.trim().toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus('error'); setMsg('Bitte eine gültige E-Mail eingeben.')
      return
    }
    if (shared.includes(trimmed)) {
      setStatus('error'); setMsg('E-Mail ist bereits freigegeben.')
      return
    }

    setStatus('loading')
    const { error } = await supabase.rpc('append_email_to_array', {
      id: sessionId,
      email_to_add: trimmed,
    })

    if (error) {
      console.error('[share:add]', error)
      setStatus('error'); setMsg(error.message || 'Fehler beim Teilen.')
    } else {
      setStatus('success'); setMsg('Freigabe hinzugefügt.')
      setEmail('')
    }
    setTimeout(() => setStatus('idle'), 1500)
  }

  async function removeEmail(addr: string) {
    setMsg(null); setStatus('loading')
    const { error } = await supabase.rpc('remove_email_from_array', {
      id: sessionId,
      email_to_remove: addr,
    })
    if (error) {
      console.error('[share:remove]', error)
      setStatus('error'); setMsg('Konnte Freigabe nicht entfernen.')
    } else {
      setStatus('success'); setMsg('Freigabe entfernt.')
    }
    setTimeout(() => setStatus('idle'), 1000)
  }

  function copyInvite() {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const link = `${origin}/creator/media-studio/session/${sessionId}`
      navigator.clipboard?.writeText(link)
      setMsg('Link kopiert.')
      setStatus('success')
      setTimeout(() => setStatus('idle'), 1000)
    } catch {
      setMsg('Konnte Link nicht kopieren.')
      setStatus('error')
    }
  }

  return (
    <div className={cn('rounded-xl border bg-background/60 p-4', className)}>
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground">🔗 Session teilen</h3>

      <form onSubmit={addEmail} className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="sm:max-w-xs"
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Sende…' : 'Hinzufügen'}
          </Button>
          <Button type="button" variant="outline" onClick={copyInvite}>
            <LinkIcon className="mr-2 h-4 w-4" /> Link kopieren
          </Button>
        </div>
      </form>

      {msg && (
        <p
          className={cn(
            'mt-2 text-sm',
            status === 'error' ? 'text-red-600' :
            status === 'success' ? 'text-emerald-600' :
            'text-muted-foreground'
          )}
        >
          {msg}
        </p>
      )}

      <div className="mt-4">
        <div className="text-xs font-medium text-muted-foreground mb-1">Freigegeben für</div>
        {shared.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Freigaben.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {shared.map((addr) => (
              <li
                key={addr}
                className="inline-flex items-center gap-2 rounded-full border bg-muted px-2 py-1 text-xs"
                title={addr}
              >
                <span className="font-medium">{addr}</span>
                <button
                  type="button"
                  className="rounded-full p-0.5 hover:bg-background"
                  aria-label={`${addr} entfernen`}
                  onClick={() => void removeEmail(addr)}
                  disabled={status === 'loading'}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
