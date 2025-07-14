import { cookies } from 'next/headers'
import { createServerComponentClient } from '@/lib/supabase/server'
import FeedCard from '@/components/feed/FeedCard'
import type { Database } from '@/types/supabase'

type Session = Database['public']['Tables']['creator_sessions']['Row']

export default async function FeedPage() {
  const supabase = createServerComponentClient({ cookies })

  const { data, error } = await supabase
    .from('creator_sessions')
    .select('id, title, user_id, published_at')
    .is('published_at', null)

  if (error) {
    console.error('Fehler beim Laden der Sessions:', error.message)
    return <p className="text-red-600 p-4">Fehler beim Laden.</p>
  }

  const sessions = data as Session[]

  return (
    <main className="p-6 space-y-8">
      {!sessions || sessions.length === 0 ? (
        <p className="text-muted-foreground text-center">
          Keine passenden Stories gefunden.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {sessions.map((session) => (
            <FeedCard
              key={session.id}
              id={session.id}
              title={session.title ?? 'Ohne Titel'}
              userId={session.user_id}
            />
          ))}
        </div>
      )}
    </main>
  )
}
