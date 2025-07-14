'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

type Session = Database['public']['Tables']['creator_sessions']['Row']

interface SessionShareFormProps {
  sessionId: Session['id']
  sharedWith?: Session['shared_with']
}

export default function SessionShareForm({ sessionId }: SessionShareFormProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()

    if (!trimmed || !trimmed.includes('@')) {
      setStatus('error')
      return
    }

    setStatus('loading')

    const { error } = await supabase.rpc('append_email_to_array', {
      id: sessionId,
      email_to_add: trimmed,
    })

    if (error) {
      console.error('Fehler beim Teilen:', error.message)
      setStatus('error')
    } else {
      setStatus('success')
      setEmail('')
    }

    setTimeout(() => setStatus('idle'), 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
      <label className="text-sm font-medium text-gray-700">Session teilen mit E-Mail:</label>

      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Sende…' : 'Teilen'}
        </Button>
      </div>

      {status === 'success' && (
        <p className="text-green-600 text-sm">✅ Erfolgreich geteilt.</p>
      )}
      {status === 'error' && (
        <p className="text-red-600 text-sm">❌ Fehler beim Teilen.</p>
      )}
    </form>
  )
}