'use client'

import type { Tables } from '@/types/supabase'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type BlogPost = Tables<'blog_posts'>

interface BlogCardProps {
  post: BlogPost
}

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <article className={cn(
      "group flex flex-col rounded-2xl shadow-lg border bg-white dark:bg-neutral-900 overflow-hidden transition-all hover:scale-[1.015] hover:shadow-2xl"
    )}>
      {post.cover_image && (
        <Link href={`/blog/${post.slug}`}>
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-56 object-cover group-hover:brightness-90 transition"
          />
        </Link>
      )}
      <div className="flex flex-col gap-2 p-5">
        <Link href={`/blog/${post.slug}`}>
          <h2 className="text-xl font-bold group-hover:underline">{post.title}</h2>
        </Link>
        {post.tags && (
          <div className="flex gap-2 flex-wrap mt-1">
            {post.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}
        <p className="text-sm text-neutral-500 mt-1 line-clamp-3">{post.excerpt}</p>
        <div className="flex justify-between items-center mt-2 text-xs text-neutral-400">
          {post.published_at && (
            <span>
              {new Date(post.published_at).toLocaleDateString()}
            </span>
          )}
          {post.is_featured && (
            <Badge variant="info" className="ml-2">Featured</Badge>
          )}
        </div>
      </div>
    </article>
  )
}
