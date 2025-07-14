'use client'

import { useTransition } from 'react'
import { updateSessionStatus } from '@/lib/supabase/actions'

interface Session {
  id: string
  title: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

interface Props {
  sessions: Session[]
}

export default function AdminReviewTable({ sessions }: Props) {
  const [isPending, startTransition] = useTransition()

  const handleAction = (id: string, status: 'approved' | 'rejected') => {
    startTransition(() => {
      updateSessionStatus(id, status)
    })
  }

  return (
    <table className="w-full text-sm border">
      <thead>
        <tr className="bg-muted text-left">
          <th className="p-2">Titel</th>
          <th className="p-2">User</th>
          <th className="p-2">Status</th>
          <th className="p-2">Aktion</th>
        </tr>
      </thead>
      <tbody>
        {sessions.map((session) => (
          <tr key={session.id} className="border-t">
            <td className="p-2">{session.title}</td>
            <td className="p-2 text-muted-foreground">{session.user_id.slice(0, 8)}</td>
            <td className="p-2 font-medium">
              {session.status === 'pending'
                ? '🟡 Ausstehend'
                : session.status === 'approved'
                ? '🟢 Freigegeben'
                : '🔴 Abgelehnt'}
            </td>
            <td className="p-2 space-x-2">
              <button
                className="text-green-600 hover:underline"
                disabled={isPending}
                onClick={() => handleAction(session.id, 'approved')}
              >
                ✅ Freigeben
              </button>
              <button
                className="text-red-600 hover:underline"
                disabled={isPending}
                onClick={() => handleAction(session.id, 'rejected')}
              >
                ❌ Ablehnen
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
