'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import BlogEditModal from './BlogEditModal'
import type { Tables } from '@/types/supabase'

type BlogPost = Tables<'blog_posts'>

export default function CreatorBlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) toast.error('Fehler beim Laden der Blogposts.')
      setPosts(data || [])
      setLoading(false)
    }
    fetchPosts()
  }, [])

  // Publish/Unpublish
  const updateStatus = async (post: BlogPost, status: string) => {
    setLoading(true)
    const { error } = await supabase
      .from('blog_posts')
      .update({ status })
      .eq('id', post.id)
    setLoading(false)
    if (error) toast.error('Fehler beim Statuswechsel.')
    else {
      toast.success(
        status === 'published'
          ? 'Blogpost veröffentlicht!'
          : 'Blogpost zurückgesetzt!'
      )
      setPosts(posts =>
        posts.map(p => (p.id === post.id ? { ...p, status } : p))
      )
    }
  }

  // Löschen
  const handleDelete = async (post: BlogPost) => {
    if (!confirm('Diesen Blogpost wirklich löschen?')) return
    setLoading(true)
    const { error } = await supabase.from('blog_posts').delete().eq('id', post.id)
    setLoading(false)
    if (error) toast.error('Fehler beim Löschen.')
    else {
      toast.success('Blogpost gelöscht.')
      setPosts(posts => posts.filter(p => p.id !== post.id))
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
          {posts.map(post => (
            <div
              key={post.id}
              className="rounded-2xl border bg-white dark:bg-neutral-900 p-5 shadow flex flex-col gap-3"
            >
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg line-clamp-2 flex-1">{post.title}</h3>
                <Badge
                  variant={
                    post.status === 'published'
                      ? 'success'
                      : post.status === 'draft'
                      ? 'warning'
                      : 'outline'
                  }
                >
                  {post.status}
                </Badge>
              </div>
              <div className="line-clamp-2 text-sm text-neutral-500">{post.excerpt}</div>
              <div className="flex flex-wrap gap-2">
                {(post.tags ?? []).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingPost(post)}
                >
                  Bearbeiten
                </Button>
                <Button
                  size="sm"
                  variant={post.status === 'published' ? 'danger' : 'primary'}
                  onClick={() =>
                    updateStatus(post, post.status === 'published' ? 'draft' : 'published')
                  }
                >
                  {post.status === 'published' ? 'Unpublish' : 'Publish'}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(post)}
                >
                  Löschen
                </Button>
              </div>
              {editingPost && editingPost.id === post.id && (
                <BlogEditModal
                  post={editingPost}
                  onClose={() => setEditingPost(null)}
                  onUpdate={updated => {
                    setPosts(posts =>
                      posts.map(p => (p.id === updated.id ? updated : p))
                    )
                    setEditingPost(null)
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
