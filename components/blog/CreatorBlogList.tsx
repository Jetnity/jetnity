'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import BlogEditModal from './BlogEditModal'
import type { Database, Tables } from '@/types/supabase'

type BlogPost = Tables<'blog_posts'>
type BlogStatus = Database['public']['Enums']['blog_status'] // 'draft' | 'published' | 'scheduled' | 'archived'

export default function CreatorBlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) toast.error('Fehler beim Laden der Blogposts.')
      setPosts((data ?? []) as BlogPost[])
      setLoading(false)
    })()
  }, [])

  // Status ändern (typ-sicher)
  async function updateStatus(post: BlogPost, status: BlogStatus) {
    setLoading(true)
    const { error } = await supabase
      .from('blog_posts')
      .update({ status } as Partial<BlogPost>)
      .eq('id', post.id)

    setLoading(false)

    if (error) {
      toast.error('Fehler beim Statuswechsel.')
      return
    }

    toast.success(status === 'published' ? 'Blogpost veröffentlicht!' : 'Blogpost-Status geändert.')
    setPosts(ps => ps.map(p => (p.id === post.id ? { ...p, status } as BlogPost : p)))
  }

  // Löschen
  async function handleDelete(post: BlogPost) {
    if (!confirm('Diesen Blogpost wirklich löschen?')) return
    setLoading(true)
    const { error } = await supabase.from('blog_posts').delete().eq('id', post.id)
    setLoading(false)

    if (error) {
      toast.error('Fehler beim Löschen.')
      return
    }

    toast.success('Blogpost gelöscht.')
    setPosts(ps => ps.filter(p => p.id !== post.id))
  }

  // Badge-Variante je Status
  const badgeVariantFor = (status?: BlogStatus) => {
    switch (status) {
      case 'published':
        return 'success' as const
      case 'draft':
        return 'warning' as const
      case 'scheduled':
        return 'info' as const
      case 'archived':
        return 'secondary' as const
      default:
        return 'outline' as const
    }
  }

  return (
    <div className="mt-12 space-y-6">
      <h2 className="text-xl font-bold">📝 Meine Blogposts</h2>

      {loading ? (
        <div className="text-neutral-500">Lade Blogposts…</div>
      ) : posts.length === 0 ? (
        <div className="text-neutral-400">Du hast noch keine Blogposts erstellt.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {posts.map(post => {
            const nextStatus: BlogStatus = post.status === 'published' ? 'draft' : 'published'

            return (
              <div
                key={post.id}
                className="rounded-2xl border bg-white dark:bg-neutral-900 p-5 shadow flex flex-col gap-3"
              >
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg line-clamp-2 flex-1">{post.title}</h3>
                  <Badge variant={badgeVariantFor(post.status)}>{post.status ?? 'unknown'}</Badge>
                </div>

                {post.excerpt ? (
                  <div className="line-clamp-2 text-sm text-neutral-500">{post.excerpt}</div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  {(post.tags ?? []).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingPost(post)}>
                    Bearbeiten
                  </Button>
                  <Button
                    size="sm"
                    variant={post.status === 'published' ? 'warning' : 'primary'}
                    onClick={() => updateStatus(post, nextStatus)}
                  >
                    {post.status === 'published' ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDelete(post)}>
                    Löschen
                  </Button>
                </div>

                {editingPost && editingPost.id === post.id && (
                  <BlogEditModal
                    post={editingPost}
                    onClose={() => setEditingPost(null)}
                    onUpdate={updated => {
                      setPosts(ps => ps.map(p => (p.id === updated.id ? updated : p)))
                      setEditingPost(null)
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
