import { createServerComponentClient } from '@/lib/supabase/server'
import BlogCard from '@/components/blog/BlogCard'
import type { Database } from '@/types/supabase'

export default async function BlogPage() {
  const supabase = createServerComponentClient();

  // Featured Posts
  const { data: featured, error: featuredError } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('published_at', { ascending: false })

  // Trending Posts (z.B. nach Views)
  const { data: trending, error: trendingError } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('views', { ascending: false })
    .limit(6)

  // Alle Blogposts (ohne Featured, keine Doppelungen)
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  // Fehler-Handling
  if (error || featuredError || trendingError) {
    return (
      <div className="text-destructive p-8 text-center">
        Fehler beim Laden der Blogposts:<br />
        {error?.message || featuredError?.message || trendingError?.message}
      </div>
    )
  }

  // Featured IDs zum Filtern der restlichen Posts (keine Doppelungen)
  const featuredIds = new Set((featured ?? []).map(post => post.id))
  const postsWithoutFeatured = (posts ?? []).filter(post => !featuredIds.has(post.id))

  return (
    <main className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-extrabold mb-8">Jetnity Blog</h1>

      {/* Featured */}
      {featured && featured.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">✨ Featured</h2>
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {featured.map(post => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      {trending && trending.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">🔥 Trending</h2>
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {trending.map(post => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* Alle übrigen Posts */}
      <section>
        <h2 className="text-xl font-bold mb-4">Alle Beiträge</h2>
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {postsWithoutFeatured.length > 0 ? (
            postsWithoutFeatured.map(post => (
              <BlogCard key={post.id} post={post} />
            ))
          ) : (
            <div className="col-span-full text-muted-foreground text-center">
              Noch keine Blogposts veröffentlicht.
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
