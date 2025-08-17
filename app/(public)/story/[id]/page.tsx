// app/(public)/story/[id]/page.tsx
import Image from 'next/image'
import { createServerComponentClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import SessionViewTracker from '@/components/story/SessionViewTracker' // ← neu

export default async function PublicStoryPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerComponentClient()

  // Text-Snippets der Story
  const { data: snippets, error: snippetsError } = await supabase
    .from('session_snippets')
    .select('content')
    .eq('session_id', params.id)
    .order('created_at', { ascending: true })

  if (snippetsError) {
    // Optional: Logging hier, aber für Public-Page reicht notFound
    return notFound()
  }

  // Medien (Bilder) der Story
  const { data: media, error: mediaError } = await supabase
    .from('session_media')
    .select('image_url')
    .eq('session_id', params.id)
    .order('created_at', { ascending: true })

  if (!snippets || snippets.length === 0) return notFound()

  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">🌍 Jetnity Reise-Story</h1>

      {media && media.length > 0 && (
        <div className="space-y-6 mb-8">
          {media.map((img, i) => (
            <div key={i} className="relative w-full h-[320px] sm:h-[400px]">
              <Image
                src={img.image_url}
                alt={`Story-Bild ${i + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="rounded-xl object-cover shadow"
                priority={i === 0}
              />
            </div>
          ))}
        </div>
      )}

      <article className="space-y-4 text-lg leading-relaxed text-gray-800">
        {snippets.map((s, i) => (
          <p key={i}>{s.content}</p>
        ))}
      </article>

      {/* View-Tracking + kompakte Impact-Anzeige */}
      <SessionViewTracker sessionId={params.id} />

      <div className="mt-12 text-center text-sm text-gray-400">
        Jetnity Story-ID: <code>{params.id}</code>
      </div>
    </main>
  )
}
