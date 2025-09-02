// components/blog/BlogCard.tsx
'use client'

import * as React from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/supabase'
import { Eye, Star } from 'lucide-react'

type BlogPost = Tables<'blog_posts'>

interface BlogCardProps {
  post: BlogPost
  className?: string
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
  const words = text
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ').filter(Boolean).length
  return Math.max(1, Math.round(words / 200)) // ~200 wpm
}

function formatNumber(n?: number | null) {
  if (n == null) return null
  return new Intl.NumberFormat('de-CH').format(n)
}

export default function BlogCard({ post, className }: BlogCardProps) {
  const [imgLoaded, setImgLoaded] = React.useState(false)
  const date = formatDateCH(post.published_at ?? undefined)
  const minutes = readingMinutesFrom(post.excerpt ?? undefined)
  const views = formatNumber((post as any).views as number | undefined) // optional Spalte
  const tags = (Array.isArray(post.tags) ? post.tags : []).slice(0, 4) as string[]

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-e1 transition-all',
        'hover:shadow-e3 hover:-translate-y-0.5',
        className
      )}
    >
      {/* Stretched link */}
      <Link aria-label={post.title} href={`/blog/${post.slug}`} className="absolute inset-0 z-10">
        <span className="sr-only">{post.title}</span>
      </Link>

      {/* Cover */}
      <div className="relative">
        <div className="aspect-[16/9] overflow-hidden bg-muted">
          {post.cover_image ? (
            // Blur-up Loading
            <img
              src={post.cover_image}
              alt={post.title}
              loading="lazy"
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              className={cn(
                'h-full w-full object-cover transition duration-500',
                imgLoaded ? 'blur-0 scale-100' : 'blur-[6px] scale-[1.02]'
              )}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <span className="text-sm">Kein Cover</span>
            </div>
          )}
        </div>

        {/* Featured Ribbon */}
        {post.is_featured ? (
          <div className="absolute left-3 top-3 z-20">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/95 px-2.5 py-1 text-xs font-semibold text-white shadow">
              <Star className="h-3.5 w-3.5" />
              Featured
            </span>
          </div>
        ) : null}

        {/* Tag Chips overlay (oben rechts) */}
        {tags.length > 0 && (
          <div className="pointer-events-none absolute right-3 top-3 z-20 flex flex-wrap gap-1">
            {tags.map((t) => (
              <span
                key={t}
                className="pointer-events-auto rounded-full border border-white/20 bg-black/35 px-2 py-0.5 text-[11px] text-white backdrop-blur supports-blur:backdrop-blur-xl"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Gradient Overlay for hover polish */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition group-hover:opacity-100" />
      </div>

      {/* Content */}
      <div className="z-0 flex flex-1 flex-col p-5">
        <h2 className="line-clamp-2 text-lg font-bold tracking-tight group-hover:underline">
          {post.title}
        </h2>

        {/* Fallback-Tags im Body (wenn Overlay fehlt / Mobile Breaks) */}
        {tags.length > 0 && (
          <div className="mt-2 hidden flex-wrap gap-2 sm:flex">
            {tags.map((t) => (
              <Badge key={t} variant="secondary" className="text-[11px]">
                {t}
              </Badge>
            ))}
          </div>
        )}

        {/* Excerpt */}
        {post.excerpt && (
          <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
            {post.excerpt}
          </p>
        )}

        {/* Meta Row */}
        <div className="mt-auto flex items-center justify-between pt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            {date && <time dateTime={post.published_at ?? undefined}>{date}</time>}
            <span>·</span>
            <span>{minutes} Min. Lesezeit</span>
          </div>
          <div className="flex items-center gap-1">
            {views && (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span>{views}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Focus sichtbar für A11y */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-primary/40 focus-within:ring-2" />
    </article>
  )
}
