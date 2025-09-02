// components/blog/BlogCardFeatured.tsx
'use client'

import * as React from 'react'
import Link from 'next/link'
import type { Tables } from '@/types/supabase'
import { Eye, Clock, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

type BlogPost = Tables<'blog_posts'>

interface Props {
  post: BlogPost
  className?: string
  priority?: boolean
}

function formatDateCH(value?: string | null) {
  if (!value) return null
  try {
    return new Intl.DateTimeFormat('de-CH', { dateStyle: 'medium' }).format(new Date(value))
  } catch {
    return null
  }
}
function readingMinutesFrom(text?: string | null) {
  if (!text) return 1
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}
function fmt(n?: number | null) {
  if (n == null) return null
  return new Intl.NumberFormat('de-CH').format(n)
}

export default function BlogCardFeatured({ post, className, priority }: Props) {
  const [loaded, setLoaded] = React.useState(false)
  const date = formatDateCH(post.published_at ?? undefined)
  const minutes = readingMinutesFrom(post.excerpt ?? post.content ?? undefined)
  const views = fmt((post as any).views as number | undefined)
  const tags = (Array.isArray(post.tags) ? post.tags : []).slice(0, 4) as string[]

  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-3xl border border-border bg-card shadow-e2 transition',
        'hover:shadow-e3',
        className
      )}
    >
      {/* Klickbare Fläche */}
      <Link href={`/blog/${post.slug}`} aria-label={post.title} className="absolute inset-0 z-20" />

      {/* Bild */}
      <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-muted">
        {post.cover_image ? (
          <img
            src={post.cover_image}
            alt={post.title}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={cn(
              'h-full w-full object-cover transition duration-700',
              loaded ? 'blur-0 scale-100' : 'blur-[8px] scale-[1.03]'
            )}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <span>Kein Cover</span>
          </div>
        )}

        {/* Oberes Overlay: Featured + Tags */}
        <div className="absolute inset-x-0 top-0 z-10 p-4 md:p-5 flex items-start justify-between">
          {/* Featured */}
          {post.is_featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/95 px-3 py-1 text-xs font-semibold text-white shadow">
              <Star className="h-3.5 w-3.5" />
              Featured
            </span>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="ml-auto flex flex-wrap gap-1">
              {tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/25 bg-black/35 px-2 py-0.5 text-[11px] text-white backdrop-blur supports-blur:backdrop-blur-xl"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Unteres Overlay: Gradient + Content */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
          <div className="h-28 bg-gradient-to-t from-black/65 via-black/35 to-transparent" />
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 p-4 md:p-6 lg:p-8">
          <h2 className="max-w-4xl text-white text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight drop-shadow">
            {post.title}
          </h2>

          {post.excerpt && (
            <p
              className="mt-2 max-w-2xl text-white/90 smart-snippet--clamp"
              style={{ ['--snippet-lines' as any]: 2 }}
            >
              {post.excerpt}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/90">
            {date && <time dateTime={post.published_at ?? undefined}>{date}</time>}
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {minutes} Min. Lesezeit
            </span>
            {views && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {views}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* sichtbarer Focus-Ring */}
      <div className="pointer-events-none absolute inset-0 rounded-3xl ring-primary/40 focus-within:ring-2" />
    </article>
  )
}
