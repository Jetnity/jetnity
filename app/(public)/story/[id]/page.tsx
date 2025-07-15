// app/(public)/story/[id]/page.tsx

import { createServerComponentClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import type { Database } from '@/types/supabase'

type Snippet = Database['public']['Tables']['session_snippets']['Row']
type MediaItem = Database['public']['Tables']['session_media']['Row']

export default async function PublicStoryPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerComponentClient({ cookies: cookies() })

  const { data: snippets } = await supabase
    .from('session_snippets')
    .select('content')
    .eq('session_id', params.id)
    .order('created_at', { ascending: true })

  const { data: media } = await supabase
    .from('session_media')
    .select('image_url')
    .eq('session_id', params.id)
    .order('created_at', { ascending: true })

  if (!snippets || snippets.length === 0) return notFound()

  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">🌍 Jetnity Reise-Story</h1>

      {media?.map((img, i) => (
        <img
          key={i}
          src={img.image_url}
          alt={`Story-Bild ${i + 1}`}
          className="w-full rounded-xl mb-6 shadow"
        />
      ))}

      <article className="space-y-4 text-lg leading-relaxed text-gray-800">
        {snippets.map((s, i) => (
          <p key={i}>{s.content}</p>
        ))}
      </article>

      <div className="mt-12 text-center text-sm text-gray-400">
        Jetnity Story-ID: <code>{params.id}</code>
      </div>
    </main>
  )
}
