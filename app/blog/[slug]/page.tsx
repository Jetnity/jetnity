// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { createServerComponentClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/supabase'
import { Badge } from '@/components/ui/badge'
import BlogSharePanel from '@/components/blog/BlogSharePanel'
import CreatorMiniProfile from '@/components/creator/CreatorMiniProfile'

import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
import DOMPurify from 'isomorphic-dompurify'

/* ──────────────────────────────────────────────────────────────────────────
   Settings
────────────────────────────────────────────────────────────────────────── */
export const revalidate = 600 // 10 Minuten

// Kommentare sind Client-only
const CommentsWidget = dynamic(
  () => import('@/components/blog/CommentsWidget'),
  { ssr: false }
)

/* ──────────────────────────────────────────────────────────────────────────
   Types
────────────────────────────────────────────────────────────────────────── */
type BlogPost = Tables<'blog_posts'>
type CreatorProfile = Tables<'creator_profiles'>
type BlogPostWithCreator = BlogPost & { creator: CreatorProfile | null }

/* ──────────────────────────────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────────────────────────────── */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') || 'https://jetnity.com'

function formatDate(value: string | null | undefined) {
  if (!value) return null
  try {
    return new Intl.DateTimeFormat('de-CH', { dateStyle: 'long' }).format(
      new Date(value)
    )
  } catch {
    return null
  }
}

function calcReadingMinutes(markdown?: string | null) {
  if (!markdown) return 1
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]+\]\([^)]+\)/g, ' ')
    .replace(/[>#*_~`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const words = text ? text.split(' ').length : 0
  return Math.max(1, Math.round(words / 200))
}

function toPlainText(markdown?: string | null, maxLen = 200) {
  if (!markdown) return ''
  const stripped = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]+\]\([^)]+\)/g, ' ')
    .replace(/[>#*_~`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return stripped.length > maxLen ? stripped.slice(0, maxLen - 1) + '…' : stripped
}

function buildCanonical(slug: string) {
  return `${siteUrl}/blog/${encodeURIComponent(slug)}`
}

/* ──────────────────────────────────────────────────────────────────────────
   Markdown + Highlighting (TS-safe für Marked v12)
────────────────────────────────────────────────────────────────────────── */
const renderer = new marked.Renderer()

// Marked v12 erwartet ein Objekt { text, lang, escaped }
renderer.code = (codeToken: any) => {
  const text: string =
    typeof codeToken === 'string' ? codeToken : codeToken?.text ?? ''
  const langRaw: string | undefined =
    (codeToken?.lang as string | undefined) ?? undefined
  const lang = langRaw && hljs.getLanguage(langRaw) ? langRaw : 'plaintext'
  const highlighted = hljs.highlight(text, { language: lang }).value
  return `<pre><code class="hljs ${lang}">${highlighted}</code></pre>`
}

// Kein "this" verwenden → kein TS-Error
renderer.link = (linkToken: any) => {
  const href: string = linkToken?.href || ''
  const titleAttr = linkToken?.title ? ` title="${linkToken.title}"` : ''
  const isExternal = /^https?:\/\//i.test(href)
  // Text: bevorzugt plain text; fallback parseInline (als any, um TS ruhig zu halten)
  const text: string =
    typeof linkToken?.text === 'string'
      ? linkToken.text
      : (linkToken?.tokens ? (marked as any).parseInline(linkToken.tokens) : 'Link')
  if (isExternal) {
    return `<a href="${href}"${titleAttr} target="_blank" rel="nofollow noopener noreferrer">${text}</a>`
  }
  return `<a href="${href}"${titleAttr}>${text}</a>`
}

marked.setOptions({
  renderer,
  gfm: true,
  breaks: false,
})

async function getPostBySlug(slug: string, withDrafts = false) {
  const supabase = createServerComponentClient()

  let query = supabase
    .from('blog_posts')
    .select(
      `
      *,
      creator:creator_profiles(
        id, name, username, avatar_url, bio, website, instagram, tiktok, youtube, twitter
      )
    `
    )
    .eq('slug', slug)
    .limit(1)

  if (!withDrafts) {
    query = query.eq('status', 'published')
  }

  const { data, error } = await query.maybeSingle<BlogPostWithCreator>()
  if (error || !data) return null
  return data
}

/* ──────────────────────────────────────────────────────────────────────────
   Metadata (SEO)
────────────────────────────────────────────────────────────────────────── */
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const post = await getPostBySlug(params.slug)
  if (!post) return {}

  const title = post.seo_title || post.title
  const description = post.seo_description || toPlainText(post.content, 220)
  const url = buildCanonical(post.slug)
  const images = post.cover_image ? [{ url: post.cover_image }] : undefined

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title,
      description,
      images,
      siteName: 'Jetnity',
      locale: 'de_CH',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.cover_image ? [post.cover_image] : undefined,
    },
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   Page
────────────────────────────────────────────────────────────────────────── */
interface BlogPostPageProps {
  params: { slug: string }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getPostBySlug(params.slug)
  if (!post) notFound()

  // Markdown → HTML → sanitize
  const rawHtml = post.content ? ((await marked.parse(post.content)) as string) : ''
  const htmlContent = DOMPurify.sanitize(rawHtml, {
    ADD_ATTR: ['target', 'rel', 'class'],
  })

  const readingMin = calcReadingMinutes(post.content)
  const published = formatDate(post.published_at ?? post.created_at)
  const updated = formatDate(post.updated_at ?? undefined)
  const canonical = buildCanonical(post.slug)
  const dateTimeValue: string | undefined =
    post.published_at ?? post.created_at ?? undefined

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seo_description || toPlainText(post.content, 280),
    image: post.cover_image ? [post.cover_image] : undefined,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.published_at || post.created_at,
    author: post.creator
      ? {
          '@type': 'Person',
          name: post.creator.name || post.creator.username || 'Creator',
          url: post.creator.username
            ? `${siteUrl}/creator/${post.creator.username}`
            : undefined,
        }
      : undefined,
    mainEntityOfPage: canonical,
  }

  return (
    <main className="max-w-3xl mx-auto py-10 px-4 lg:px-0">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:underline">Start</Link>
          </li>
          <li aria-hidden>›</li>
          <li>
            <Link href="/blog" className="hover:underline">Blog</Link>
          </li>
          <li aria-hidden>›</li>
          <li className="text-foreground" aria-current="page">{post.title}</li>
        </ol>
      </nav>

      {/* Cover */}
      {post.cover_image && (
        <img
          src={post.cover_image}
          alt={post.title}
          className="w-full max-h-[420px] object-cover rounded-2xl mb-8 shadow-sm"
          loading="eager"
        />
      )}

      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {/* dateTime exakt als string | undefined */}
          <time dateTime={dateTimeValue}>
            {published}
          </time>
          <span>·</span>
          <span>{readingMin} Min. Lesezeit</span>
          {updated && (
            <>
              <span>·</span>
              <span>Aktualisiert: {updated}</span>
            </>
          )}
        </div>

        {/* Tags & Featured */}
        {(post.tags?.length || post.is_featured) ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(post.tags || []).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {post.is_featured && (
              <Badge variant="default" className="text-xs">Featured</Badge>
            )}
          </div>
        ) : null}
      </header>

      {/* Creator */}
      {post.creator && (
        <div className="mb-8">
          <CreatorMiniProfile creator={post.creator} />
        </div>
      )}

      {/* Content */}
      <article
        className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-img:rounded-xl prose-pre:rounded-xl prose-pre:shadow-sm"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* SEO-Description (klein + dezent) */}
      {post.seo_description && (
        <p className="mt-8 text-xs text-muted-foreground">
          {post.seo_description}
        </p>
      )}

      {/* Teilen */}
      <div className="mt-10">
        <BlogSharePanel title={post.title} />
      </div>

      {/* Kommentare */}
      <div className="mt-10">
        <CommentsWidget blogId={post.id} />
      </div>

      {/* Zurück */}
      <div className="mt-10">
        <Link href="/blog" className="text-sm text-primary hover:underline">
          ← Zurück zum Blog
        </Link>
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  )
}
