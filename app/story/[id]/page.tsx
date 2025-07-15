// app/story/[id]/page.tsx

import { createServerComponentClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import SessionImpact from '@/components/story/SessionImpact'
import SessionViewTracker from '@/components/story/SessionViewTracker'
import type { Database } from '@/types/supabase'

// Supabase-Typen
type Session = Database['public']['Tables']['creator_sessions']['Row']
type Snippet = Database['public']['Tables']['session_snippets']['Row']
type Media = Database['public']['Tables']['session_media']['Row']

export default async function StoryPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies })

  // Nutzer laden
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return redirect('/login')

  // Session laden
  const { data: session, error } = await supabase
    .from('creator_sessions')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !session) return notFound()

  // Zugriff prüfen: Nur Ersteller oder Admin dürfen diese Session sehen
  const isOwner = session.user_id === user.id
  const isAdmin = user.role === 'admin' || user.email?.endsWith('@jetnity.com')

  if (!isOwner && !isAdmin) return redirect('/unauthorized')

  // Snippets laden
  const { data: snippets } = await supabase
    .from('session_snippets')
    .select('*')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true })

  // Media laden
  const { data: media } = await supabase
    .from('session_media')
    .select('*')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true })

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <h1 className="text-3xl font-bold mb-4 text-center">{session.title}</h1>

      {session.rating && (
        <p className="text-sm text-center text-green-600">
          🎯 CoPilot Score: {session.rating}/100
        </p>
      )}

      {session.insights && (
        <p className="text-sm text-muted-foreground text-center whitespace-pre-line">
          💡 {session.insights}
        </p>
      )}

      {media && media.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold mb-2">Media</h2>
          <ul className="list-disc pl-4 space-y-1">
            {media.map((item) => (
              <li key={item.id}>
                <img src={item.image_url} alt="" className="w-full rounded-xl shadow" />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-muted-foreground">Keine Medien vorhanden.</p>
      )}

      {snippets && snippets.length > 0 ? (
        <section>
          <h2 className="text-lg font-semibold mb-2">Snippets</h2>
          <ul className="list-disc pl-4 space-y-1">
            {snippets.map((item) => (
              <li key={item.id}>{item.content}</li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-muted-foreground">Keine Snippets vorhanden.</p>
      )}

      <div className="mt-12 text-center text-sm text-gray-400">
        Jetnity Story-ID: <code>{params.id}</code>
      </div>

      <SessionImpact sessionId={session.id} />
      <SessionViewTracker sessionId={session.id} />
    </main>
  )
}