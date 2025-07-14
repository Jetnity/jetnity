import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@/lib/supabase/server'
import SessionEditor from '@/components/creator/media-studio/SessionEditor'
import SessionShareForm from '@/components/creator/media-studio/SessionShareForm'
import VisibilityToggle from '@/components/creator/media-studio/VisibilityToggle'
import type { Database } from '@/types/supabase'

type Session = Database['public']['Tables']['creator_sessions']['Row']

export default async function SessionPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies: cookies() })

  const { data, error } = await supabase
    .from('creator_sessions')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !data) return notFound()

  const session: Session = data

  return (
    <main className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-2xl font-bold mb-4">🎨 Co-Creation Session</h1>

      <div className="bg-white border p-6 rounded-xl shadow space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{session.title}</h2>
            <div className="text-sm text-gray-500 mt-1">
              <span className="mr-4">
                <strong>Status:</strong>{' '}
                <span className="text-gray-700 font-medium">{session.status ?? 'aktiv'}</span>
              </span>
              <span>
                <strong>Rolle:</strong>{' '}
                <span className="text-gray-700 font-medium">{session.role}</span>
              </span>
            </div>
          </div>

          <VisibilityToggle
            sessionId={session.id}
            currentVisibility={session.visibility ?? 'private'}
          />
        </div>

        <SessionShareForm
          sessionId={session.id}
          sharedWith={session.shared_with ?? []}
        />

        <SessionEditor session={session} />
      </div>
    </main>
  )
}
