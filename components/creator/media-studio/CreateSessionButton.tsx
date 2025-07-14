'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Database } from '@/types/supabase'

type Session = Database['public']['Tables']['creator_sessions']['Row']

interface CreateSessionButtonProps {
  userId: string
  onCreated: (sessionId: string) => void
}

export default function CreateSessionButton({ userId, onCreated }: CreateSessionButtonProps) {
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    setLoading(true)

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

    setLoading(false)
    setTitle('')

    if (error || !data?.id) {
      console.error('Session-Erstellung fehlgeschlagen:', error?.message)
      return
    }

    onCreated(data.id)
  }

  return (
    <div className="p-4 border-t bg-white space-y-3">
      <Input
        placeholder="Titel der neuen Session"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={loading}
        className="w-full"
      />
      <Button
        onClick={handleCreate}
        disabled={loading || !title.trim()}
        className="w-full"
      >
        + Neue Session erstellen
      </Button>
    </div>
  )
}
