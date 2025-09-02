// app/creator/sessions/SessionsClient.tsx  (Client Component)
'use client'

import * as React from 'react'
import type { Database } from '@/types/supabase'
import SessionList from '@/components/creator/media-studio/SessionList'
import { useSessionActions } from '@/lib/client/useSessionActions'

type Session = Database['public']['Tables']['creator_sessions']['Row']

export default function SessionsClient({ initial }: { initial: Session[] }) {
  const [sessions, setSessions] = React.useState<Session[]>(initial)
  const [selectedId, setSelectedId] = React.useState<string | null>(initial[0]?.id ?? null)
  const { rename, duplicate, remove, open } = useSessionActions()

  return (
    <SessionList
      sessions={sessions}
      selectedSessionId={selectedId}
      onSelect={setSelectedId}
      onOpen={(id) => open(id)}
      onRename={async (id, title) => {
        setSessions(prev => prev.map(s => s.id === id ? { ...s, title } : s)) // optimistisch
        try {
          const updated = await rename(id, title)
          setSessions(prev => prev.map(s => s.id === id ? updated : s))
        } catch {
          location.reload() // einfacher Rollback
        }
      }}
      onDuplicate={async (id) => {
        const created = await duplicate(id)
        setSessions(prev => [created, ...prev])
        setSelectedId(created.id)
      }}
      onDelete={async (id) => {
        const backup = sessions
        setSessions(prev => prev.filter(s => s.id !== id))
        try {
          await remove(id)
        } catch {
          setSessions(backup)
        }
      }}
    />
  )
}
