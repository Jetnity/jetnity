import { notFound } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import BlogSharePanel from '@/components/blog/BlogSharePanel'
import dynamic from 'next/dynamic'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import Link from 'next/link'
import CreatorMiniProfile from '@/components/creator/CreatorMiniProfile'
import type { Tables } from '@/types/supabase'

// Dynamisch, damit SSR-frei
const CommentsWidget = dynamic(
  () => import('@/components/blog/CommentsWidget'),
  { ssr: false }
)

// Highlight.js + Marked Integration
const renderer = new marked.Renderer()
renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
  const validLang = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
  const highlighted = hljs.highlight(text, { language: validLang }).value
  return `<pre><code class="hljs ${validLang}">${highlighted}</code></pre>`
}
marked.setOptions({ renderer })

interface BlogPostPageProps {
  params: { slug: string }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const supabase = createServerComponentClient()

  // --- WICHTIG: Vollständige Creator-Relation!
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      creator:creator_profiles (
        id,
        name,
        avatar_url,
        username,
        bio,
        website,
        instagram,
        tiktok,
        youtube,
        twitter
      )
    `)
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single<Tables<'blog_posts'> & { creator: Tables<'creator_profiles'> }>()

  if (!post || error) notFound()

  const htmlContent = post.content ? marked.parse(post.content) : ''

  return (
    <main className="max-w-3xl mx-auto py-12 px-4">
      {/* Cover Image */}
      {post.cover_image && (
        <img
          src={post.cover_image}
          alt={post.title}
          className="w-full max-h-[360px] object-cover rounded-xl mb-8 shadow"
        />
      )}

      <h1 className="text-3xl font-extrabold mb-2">{post.title}</h1>
      <div className="flex items-center gap-2 mb-4">
        {post.tags?.map((tag: string) => (
          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
        ))}
        {post.is_featured && <Badge variant="info">Featured</Badge>}
      </div>

      {/* Creator-Mini-Profile */}
      <div className="mb-8">
        {post.creator && <CreatorMiniProfile creator={post.creator} />}
      </div>

      {/* Markdown Content */}
      <article
        className="prose prose-neutral dark:prose-invert max-w-none text-lg"
        dangerouslySetInnerHTML={{ __html: htmlContent as string }}
      />

      {post.seo_description && (
        <div className="mt-8 text-xs text-neutral-400">{post.seo_description}</div>
      )}

      {/* Social Sharing Panel */}
      <div className="mt-10 mb-8">
        <BlogSharePanel title={post.title} />
      </div>

      {/* Blog-Kommentare (Supabase-Widget, SSR-frei) */}
      <div className="mt-10">
        <CommentsWidget blogId={post.id} />
      </div>

      {/* Zurück zum Blog */}
      <div className="mt-10 flex flex-wrap gap-2">
        <Link href="/blog" className="text-blue-600 hover:underline text-sm">
          ← Zurück zum Blog
        </Link>
      </div>
    </main>
  )
}
