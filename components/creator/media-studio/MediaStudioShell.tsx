'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'

import SessionList from './SessionList'
import SessionEditor from './SessionEditor'
import SidebarAI from './SidebarAI'
import CreateSessionButton from './CreateSessionButton'

type Session = Database['public']['Tables']['creator_sessions']['Row']

interface MediaStudioShellProps {
  userId: string
}

export default function MediaStudioShell({ userId }: MediaStudioShellProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from('creator_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fehler beim Laden der Sessions:', error.message)
    }

    setSessions(data ?? [])
  }

  useEffect(() => {
    fetchSessions()
  }, [userId])

  const handleSessionCreated = (newSessionId: string) => {
    setSelectedSessionId(newSessionId)
    fetchSessions()
  }

  const selectedSession = sessions.find((s) => s.id === selectedSessionId) ?? null

  return (
    <div className="grid grid-cols-12 h-screen overflow-hidden bg-white">
      {/* Linke Spalte: Session-Liste */}
      <div className="col-span-3 border-r border-gray-200 overflow-y-auto">
        <SessionList
          sessions={sessions}
          selectedSessionId={selectedSessionId}
          onSelect={setSelectedSessionId}
        />
        <CreateSessionButton userId={userId} onCreated={handleSessionCreated} />
      </div>

      {/* Mittlere Spalte: SessionEditor */}
      <div className="col-span-6 overflow-y-auto bg-gray-50">
        {selectedSession ? (
          <SessionEditor session={selectedSession} />
        ) : (
          <div className="p-6 text-gray-400 italic text-center">
            Bitte wähle links eine Session aus oder erstelle eine neue.
          </div>
        )}
      </div>

      {/* Rechte Spalte: Sidebar mit KI-Tools */}
      <div className="col-span-3 border-l border-gray-200 overflow-y-auto bg-white">
        <SidebarAI sessionId={selectedSessionId} />
      </div>
    </div>
  )
}
