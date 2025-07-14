'use client'

import { Database } from '@/types/supabase'
import Link from 'next/link'
import clsx from 'clsx' // falls du clsx nicht nutzt, ersetze durch manuelle Logik

type Session = Database['public']['Tables']['creator_sessions']['Row']

type Props = {
  sessions: Session[]
  selectedSessionId: string | null
  onSelect: (id: string) => void
}

const SessionList = ({ sessions, selectedSessionId, onSelect }: Props) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {sessions.map((session) => {
        const isSelected = session.id === selectedSessionId

        return (
          <div
            key={session.id}
            className={clsx(
              'rounded-xl border p-4 bg-background shadow-sm hover:shadow-md transition cursor-pointer',
              {
                'ring-2 ring-primary border-transparent': isSelected,
              }
            )}
            onClick={() => onSelect(session.id)}
          >
            <h3 className="text-base font-semibold">
              {session.title ?? 'Ohne Titel'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Erstellt am{' '}
              {session.created_at
                ? new Date(session.created_at).toLocaleDateString('de-DE')
                : 'Unbekannt'}
            </p>

            {Array.isArray(session.shared_with) && session.shared_with.length > 0 && (
              <p className="text-sm text-foreground mt-2">
                👥 Freigegeben für:{' '}
                <span className="font-medium">
                  {session.shared_with.join(', ')}
                </span>
              </p>
            )}

            <div className="mt-4">
              <Link
                href={`/creator/media-studio/${session.id}`}
                className="text-sm text-primary hover:underline"
                aria-label={`Session ${session.title ?? session.id} öffnen`}
                onClick={(e) => e.stopPropagation()} // Link-Klick verhindert onSelect
              >
                ➤ Öffnen
              </Link>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default SessionList
