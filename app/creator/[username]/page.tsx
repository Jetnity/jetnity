import { notFound } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import type { Tables } from '@/types/supabase'
import BlogCard from '@/components/blog/BlogCard'
import CreatorMediaCard from '@/components/creator/CreatorMediaCard'

interface PageProps {
  params: { username: string }
}

export default async function CreatorProfilePage({ params }: PageProps) {
  const supabase = createServerComponentClient()

  // 1. Creator laden (anhand username)
  const { data: creator, error: creatorError } = await supabase
    .from('creator_profiles')
    .select('*')
    .eq('username', params.username)
    .single<Tables<'creator_profiles'>>()

  if (!creator || creatorError) notFound()

  // 2. Uploads des Creators laden
  const { data: uploads } = creator.user_id
    ? await supabase
        .from('creator_uploads')
        .select('*')
        .eq('user_id', creator.user_id)
        .order('created_at', { ascending: false })
    : { data: [] }

  // 3. Blogposts des Creators laden (optional)
  const { data: blogposts } = creator.user_id
    ? await supabase
        .from('blog_posts')
        .select('*')
        .eq('creator_id', creator.user_id)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
    : { data: [] }

  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      {/* Creator Header */}
      <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
        <div className="w-28 h-28 rounded-full overflow-hidden border bg-neutral-100 dark:bg-neutral-800 shadow">
          {creator.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creator.avatar_url}
              alt={creator.name || creator.username || 'Creator'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-5xl text-neutral-400 bg-neutral-200">
              👤
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col gap-2 items-center md:items-start">
          <h1 className="text-2xl font-extrabold">{creator.name || creator.username}</h1>
          {creator.username && (
            <div className="text-blue-600 font-mono text-xs">@{creator.username}</div>
          )}
          {creator.bio && (
            <div className="text-neutral-600 dark:text-neutral-300 italic text-sm max-w-xl">{creator.bio}</div>
          )}
          {/* Socials */}
          <div className="flex gap-3 mt-2 flex-wrap">
            {creator.website && (
              <a href={creator.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-700 hover:underline">🌐 Website</a>
            )}
            {creator.instagram && (
              <a href={creator.instagram} target="_blank" rel="noopener noreferrer" className="text-xs text-pink-500 hover:underline">Instagram</a>
            )}
            {creator.tiktok && (
              <a href={creator.tiktok} target="_blank" rel="noopener noreferrer" className="text-xs text-black hover:underline">TikTok</a>
            )}
            {creator.youtube && (
              <a href={creator.youtube} target="_blank" rel="noopener noreferrer" className="text-xs text-red-600 hover:underline">YouTube</a>
            )}
            {creator.twitter && (
              <a href={creator.twitter} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">Twitter/X</a>
            )}
          </div>
        </div>
      </div>

      {/* Impact Score & Statistiken – Platz für spätere Performance Widgets */}

      {/* Uploads */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Uploads</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {uploads?.length
            ? uploads.map(upload => (
                <CreatorMediaCard key={upload.id} upload={upload} />
              ))
            : <div className="col-span-full text-neutral-400 text-center">Noch keine Uploads.</div>
          }
        </div>
      </section>

      {/* Blogposts */}
      <section>
        <h2 className="text-xl font-bold mb-4">Blogposts</h2>
        <div className="grid gap-4">
          {blogposts?.length
            ? blogposts.map(post => (
                <BlogCard key={post.id} post={post} />
              ))
            : <div className="text-neutral-400 text-center">Noch keine Blogposts.</div>
          }
        </div>
      </section>
    </main>
  )
}
