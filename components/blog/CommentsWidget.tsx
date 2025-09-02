'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { marked } from 'marked'

// ───────────────────────────────────────────────────────────────────────────────
// Minimal-Typen (nur was wir wirklich brauchen)
// ───────────────────────────────────────────────────────────────────────────────
type CommentRow = {
  id: string
  blog_id: string | null
  user_id: string | null
  name: string | null
  content: string
  created_at: string
  status: string | null
}

type CreatorProfileRow = {
  id: string
  user_id: string
  display_name: string | null
  name: string | null
  username: string | null
  avatar_url: string | null
  role: string | null
  email: string | null
}

type MiniCreator = {
  id: string
  user_id: string
  display_name: string | null
  name: string | null
  username: string | null
  avatar_url: string | null
  role: string | null
  email: string | null

  // tolerant: viele Cards erwarten diese Keys (können null sein)
  bio: string | null
  created_at: string | null
  facebook: string | null
  instagram: string | null
  tiktok: string | null
  twitter: string | null
  website: string | null
  youtube: string | null
}

type Comment = CommentRow & { creator_profile: MiniCreator | null }

// WICHTIG: keine Typen importieren, keine Generics → keine Prop-Konflikte
const CreatorMiniProfile = dynamic(
  () => import('@/components/creator/CreatorMiniProfile'),
  { ssr: false }
)

interface CommentsWidgetProps {
  blogId: string
}

export default function CommentsWidget({ blogId }: CommentsWidgetProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  const toMini = (p: CreatorProfileRow): MiniCreator => ({
    id: p.id,
    user_id: p.user_id,
    display_name: p.display_name,
    name: p.name,
    username: p.username,
    avatar_url: p.avatar_url,
    role: p.role ?? 'user',
    email: p.email,

    bio: null,
    created_at: null,
    facebook: null,
    instagram: null,
    tiktok: null,
    twitter: null,
    website: null,
    youtube: null,
  })

  // Kommentare + Profile getrennt laden (ohne DB-Join)
  useEffect(() => {
    const load = async () => {
      const { data: rows, error } = await supabase
        .from('blog_comments')
        .select('*')
        .eq('blog_id', blogId)
        .eq('status', 'visible')
        .order('created_at', { ascending: true })
        .limit(200)

      if (error) {
        toast.error('Fehler beim Laden der Kommentare')
        return
      }

      const commentRows = (rows ?? []) as CommentRow[]
      const userIds = Array.from(
        new Set(commentRows.map(r => r.user_id).filter((v): v is string => typeof v === 'string'))
      )

      const map = new Map<string, MiniCreator>()
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from('creator_profiles')
          .select('id, user_id, display_name, name, username, avatar_url, role, email')
          .in('user_id', userIds)

        for (const p of (profiles ?? []) as CreatorProfileRow[]) {
          map.set(p.user_id, toMini(p))
        }
      }

      setComments(
        commentRows.map(r => ({
          ...r,
          creator_profile: r.user_id ? map.get(r.user_id) ?? null : null,
        }))
      )
    }

    if (blogId) load()
  }, [blogId])

  // Absenden (optimistisches Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = content.trim()
    if (!text) return

    setSubmitting(true)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      toast.error('Bitte einloggen, um zu kommentieren.')
      setSubmitting(false)
      return
    }

    const optimistic: Comment = {
      id: `optimistic-${Date.now()}`,
      blog_id: blogId,
      user_id: user.id,
      name: user.user_metadata?.name ?? 'User',
      content: text,
      created_at: new Date().toISOString(),
      status: 'visible',
      creator_profile: {
        id: user.id,
        user_id: user.id,
        display_name: (user.user_metadata as any)?.display_name ?? null,
        name: user.user_metadata?.name ?? null,
        username: (user.user_metadata as any)?.username ?? null,
        avatar_url: (user.user_metadata as any)?.avatar_url ?? null,
        role: 'user',
        email: user.email ?? null,

        bio: null,
        created_at: null,
        facebook: null,
        instagram: null,
        tiktok: null,
        twitter: null,
        website: null,
        youtube: null,
      },
    }

    setComments(prev => [...prev, optimistic])

    const { data, error } = await supabase
      .from('blog_comments')
      .insert({
        blog_id: blogId,
        user_id: user.id,
        name: user.user_metadata?.name ?? 'User',
        content: text,
        status: 'visible',
      })
      .select('*')
      .single()

    if (error || !data) {
      setComments(prev => prev.filter(c => c.id !== optimistic.id))
      toast.error('Kommentar konnte nicht gespeichert werden.')
      setSubmitting(false)
      return
    }

    const row = data as CommentRow
    let creator = optimistic.creator_profile

    if (!creator && row.user_id) {
      const { data: p } = await supabase
        .from('creator_profiles')
        .select('id, user_id, display_name, name, username, avatar_url, role, email')
        .eq('user_id', row.user_id)
        .maybeSingle()

      if (p) creator = toMini(p as CreatorProfileRow)
    }

    const finalized: Comment = { ...row, creator_profile: creator ?? null }
    setComments(prev => prev.map(c => (c.id === optimistic.id ? finalized : c)))

    setContent('')
    inputRef.current?.focus()
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
          {submitting ? 'Wird gesendet…' : 'Kommentar absenden'}
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
                // bewusst locker typisiert:
                <CreatorMiniProfile creator={comment.creator_profile as any} />
              ) : (
                <Badge variant="outline" className="text-xs">
                  {comment.name ?? 'Gast'}
                </Badge>
              )}
              <span className="text-xs text-neutral-400">
                {new Date(comment.created_at).toLocaleString()}
              </span>
            </div>

            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{
                __html: (marked.parse(comment.content ?? '') as string) || '',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
