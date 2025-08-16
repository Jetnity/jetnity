'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useUser } from '@/lib/supabase/useUser'
import type { Tables } from '@/types/supabase'

// Typ für Kommentar + optionales Profil
type BlogComment = Tables<'blog_comments'> & {
  user?: {
    id: string
    name?: string
    avatar_url?: string
    email?: string
  }
}

const STATUS_LABELS: Record<string, string> = {
  visible: 'Sichtbar',
  pending: 'Ausstehend',
  rejected: 'Abgelehnt',
  invisible: 'Versteckt',
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'error' | 'outline'> = {
  visible: 'default',
  pending: 'secondary',
  rejected: 'error',
  invisible: 'outline',
}

export default function CommentModerationPanel() {
  const [comments, setComments] = useState<BlogComment[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  useEffect(() => {
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('blog_comments')
        .select(`
          *,
          user:user_id (id, name, avatar_url, email)
        `)
        .order('created_at', { ascending: false })
      if (error) {
        toast.error('Fehler beim Laden der Kommentare')
      } else {
        // Filter/massage data to ensure user is either undefined or a valid object
        const safeData = (data || []).map((c: any) => ({
          ...c,
          user: typeof c.user === 'object' && c.user !== null && !('code' in c.user) ? c.user : undefined,
        }))
        setComments(safeData)
      }
    }
    fetchComments()
  }, [])

  const updateStatus = async (id: string, status: string) => {
    setLoadingAction(id)
    const { error } = await supabase
      .from('blog_comments')
      .update({ status })
      .eq('id', id)
    if (error) {
      toast.error('Status konnte nicht geändert werden')
    } else {
      setComments((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
      toast.success('Status aktualisiert')
    }
    setLoadingAction(null)
  }

  const filtered = filter === 'all' ? comments : comments.filter(c => c.status === filter)

  return (
    <Card className="p-6 space-y-6">
      <div className="flex flex-wrap gap-2 mb-4">
        {(['all', 'visible', 'pending', 'rejected', 'invisible'] as const).map((s) => (
          <Button
            key={s}
            variant={filter === s ? 'default' : 'outline'}
            onClick={() => setFilter(s)}
            size="sm"
          >
            {s === 'all' ? 'Alle' : STATUS_LABELS[s]}
          </Button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground">Keine Kommentare gefunden.</div>
      ) : (
        filtered.map((comment) => (
          <div key={comment.id} className="flex gap-4 py-4 border-b last:border-b-0 items-center">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {comment.user?.avatar_url && (
                  <img
                    src={comment.user.avatar_url}
                    alt={comment.user.name || comment.user.email || 'User'}
                    className="w-7 h-7 rounded-full object-cover border"
                  />
                )}
                <span className="font-semibold">{comment.user?.name || comment.user?.email || 'User'}</span>
                <Badge variant={STATUS_VARIANTS[comment.status as string]}>
                  {STATUS_LABELS[comment.status as string]}
                </Badge>
                <span className="ml-2 text-xs text-muted-foreground">
                  {comment.created_at && new Date(comment.created_at).toLocaleString()}
                </span>
              </div>
              <div className="text-sm text-neutral-800 dark:text-neutral-200 break-words">
                {comment.content}
              </div>
            </div>
            <div className="flex gap-2 ml-4 shrink-0">
              <Button
                variant="default"
                size="sm"
                disabled={loadingAction === comment.id || comment.status === 'visible'}
                onClick={() => updateStatus(comment.id, 'visible')}
              >
                Freischalten
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={loadingAction === comment.id || comment.status === 'pending'}
                onClick={() => updateStatus(comment.id, 'pending')}
              >
                Ausstehend
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={loadingAction === comment.id || comment.status === 'rejected'}
                onClick={() => updateStatus(comment.id, 'rejected')}
              >
                Ablehnen
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={loadingAction === comment.id || comment.status === 'invisible'}
                onClick={() => updateStatus(comment.id, 'invisible')}
              >
                Verstecken
              </Button>
            </div>
          </div>
        ))
      )}
    </Card>
  )
}
