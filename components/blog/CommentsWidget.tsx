'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { marked } from 'marked'
import dynamic from 'next/dynamic'

const CreatorMiniProfile = dynamic(
  () => import('@/components/creator/CreatorMiniProfile'),
  { ssr: false }
)

type Comment = {
  id: string
  blog_id: string | null
  user_id: string | null
  name: string | null
  content: string
  created_at: string
  status: string | null
  creator_profile?: {
    id: string
    name?: string
    avatar_url?: string
    username?: string
  } | null
}

interface CommentsWidgetProps {
  blogId: string
}

export default function CommentsWidget({ blogId }: CommentsWidgetProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  // Lade alle sichtbaren Kommentare zu diesem Blogpost inkl. Creator-Profil
  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('blog_comments')
        .select(`
          *,
          creator_profile:creator_profiles (
            id,
            name,
            avatar_url,
            username
          )
        `)
        .eq('blog_id', blogId)
        .eq('status', 'visible')
        .order('created_at', { ascending: true })
      if (error) {
        toast.error('Fehler beim Laden der Kommentare')
        return
      }
      setComments(
        (data || [])
          .filter(
            (c: any) =>
              !c.creator_profile ||
              (c.creator_profile && !('code' in c.creator_profile))
          )
          .map((c: any) => ({
            ...c,
            // If creator_profile is not an object, set it to null
            creator_profile:
              c.creator_profile && typeof c.creator_profile === 'object' && !('code' in c.creator_profile)
                ? c.creator_profile
                : null,
          })) as Comment[]
      )
    }
    if (blogId) fetchComments()
  }, [blogId])

  // Kommentar absenden
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setSubmitting(true)
    // Hole eingeloggten User (Client-Side!)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      toast.error('Bitte einloggen, um zu kommentieren.')
      setSubmitting(false)
      return
    }

    // Optimistisches Update (sofort anzeigen)
    const optimistic: Comment = {
      id: `optimistic-${Date.now()}`,
      blog_id: blogId,
      user_id: user.id,
      name: user.user_metadata?.name ?? 'User',
      content,
      created_at: new Date().toISOString(),
      status: 'visible',
      creator_profile: {
        id: user.id,
        name: user.user_metadata?.name ?? undefined,
        avatar_url: user.user_metadata?.avatar_url ?? undefined,
        username: user.user_metadata?.username ?? undefined,
      }
    }
    setComments(prev => [...prev, optimistic])

    // Kommentar speichern
    const { data, error } = await supabase
      .from('blog_comments')
      .insert({
        blog_id: blogId,
        user_id: user.id,
        name: user.user_metadata?.name ?? 'User',
        content,
        status: 'visible',
      })
      .select(`
        *,
        creator_profile:creator_profiles (
          id,
          name,
          avatar_url,
          username
        )
      `)
      .single()

    if (error || !data) {
      toast.error('Kommentar konnte nicht gespeichert werden.')
      setComments(prev => prev.filter(c => c.id !== optimistic.id))
    } else {
      // Sanitize data to ensure creator_profile is valid
      const sanitizedData = {
        ...data,
        creator_profile:
          data.creator_profile && typeof data.creator_profile === 'object' && !('code' in data.creator_profile)
            ? data.creator_profile
            : null,
      } as Comment
      setComments(prev =>
        prev.map(c => (c.id === optimistic.id ? sanitizedData : c))
      )
      setContent('')
      inputRef.current?.focus()
    }
    setSubmitting(false)
  }

  return (
    <div className="w-full mt-8">
      <h2 className="text-lg font-bold mb-4">💬 Kommentare</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-6">
        <textarea
          ref={inputRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Schreibe einen Kommentar…"
          className="border rounded-lg px-3 py-2 min-h-[64px] shadow-sm resize-vertical"
          rows={3}
          required
        />
        <Button type="submit" disabled={submitting || !content.trim()}>
          Kommentar absenden
        </Button>
      </form>

      <div className="space-y-5">
        {comments.length === 0 && (
          <p className="text-neutral-400 italic">Noch keine Kommentare vorhanden.</p>
        )}
        {comments.map(comment => (
          <div key={comment.id} className="border rounded-lg p-4 bg-white dark:bg-neutral-900 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              {comment.creator_profile ? (
                <CreatorMiniProfile
                  creator={{
                    id: comment.creator_profile.id,
                    user_id: comment.creator_profile.id,
                    name: comment.creator_profile.name ?? null,
                    avatar_url: comment.creator_profile.avatar_url ?? null,
                    username: comment.creator_profile.username ?? null,
                    bio: null,
                    created_at: null,
                    facebook: null,
                    instagram: null,
                    role: null,
                    tiktok: null,
                    twitter: null,
                    website: null,
                    youtube: null,
                  }}
                />
              ) : (
                <Badge variant="outline" className="text-xs">{comment.name ?? 'Gast'}</Badge>
              )}
              <span className="text-xs text-neutral-400">
                {new Date(comment.created_at).toLocaleString()}
              </span>
            </div>
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: marked.parse(comment.content ?? '') as string }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
