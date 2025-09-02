// components/creator/media-studio/MediaStudio.tsx
'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Tables } from '@/types/supabase'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import MediaUploadForm from './MediaUploadForm'
import TextToImageGenerator from './TextToImageGenerator'
import GalleryGrid from './GalleryGrid'
import StoryExportPanel from './StoryExportPanel'
import StoryPdfExportButton from './StoryPdfExportButton'
import StoryMarkdownExportButton from './StoryMarkdownExportButton'
import StoryLinkCopyButton from './StoryLinkCopyButton'
import VisibilityToggle from './VisibilityToggle'
import StoryBuilder from './StoryBuilder'
import StorySessionExport from './StorySessionExport'
import SessionRating from './SessionRating'
import SessionPerformancePanel from './SessionPerformancePanel'

type MediaItem = Tables<'session_media'>
type SessionMetric = Tables<'creator_session_metrics'>
type SessionRow = Tables<'creator_sessions'>
type SnippetRow = Tables<'session_snippets'>

interface MediaStudioProps {
  sessionId: string
  userId: string
}

type FilterType = 'all' | 'image' | 'video'

const PAGE_SIZE = 36

// ---------- Helpers (schema-agnostisch)
function getMime(item: MediaItem): string {
  const anyItem = item as unknown as Record<string, any>
  return (anyItem.mime_type ?? anyItem.mimetype ?? '') as string
}
function getUrl(item: MediaItem): string {
  const anyItem = item as unknown as Record<string, any>
  return (anyItem.url ?? anyItem.image_url ?? anyItem.video_url ?? anyItem.src ?? '') as string
}
function getThumbUrl(item: MediaItem): string {
  const anyItem = item as unknown as Record<string, any>
  return (anyItem.thumbnail_url ?? anyItem.thumb_url ?? anyItem.preview_url ?? getUrl(item)) as string
}
function extFromUrl(u: string): string {
  const base = u.split('?')[0]
  const dot = base.lastIndexOf('.')
  return dot >= 0 ? base.slice(dot + 1).toLowerCase() : ''
}
function isVideo(item: MediaItem): boolean {
  const mime = getMime(item)
  if (mime.startsWith('video/')) return true
  if (mime.startsWith('image/')) return false
  const ext = extFromUrl(getUrl(item))
  return ['mp4', 'mov', 'm4v', 'webm', 'mkv', 'avi'].includes(ext)
}
function isImage(item: MediaItem): boolean {
  const mime = getMime(item)
  if (mime.startsWith('image/')) return true
  if (mime.startsWith('video/')) return false
  const ext = extFromUrl(getUrl(item))
  return ['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif'].includes(ext)
}
function getTitle(item: MediaItem): string {
  const anyItem = item as unknown as Record<string, any>
  return (anyItem.title ?? anyItem.name ?? anyItem.filename ?? 'Untitled') as string
}
function getDescription(item: MediaItem): string {
  const anyItem = item as unknown as Record<string, any>
  return (anyItem.description ?? '') as string
}

export default function MediaStudio({ sessionId, userId }: MediaStudioProps) {
  // ---------- State
  const [media, setMedia] = useState<MediaItem[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState<string>('')

  const [performance, setPerformance] = useState<{ impressions: number; views: number }>({
    impressions: 0,
    views: 0,
  })

  const [sessionVisibility, setSessionVisibility] =
    useState<SessionRow['visibility'] | 'private'>('private')
  const [storyText, setStoryText] = useState<string>('')

  const loadedCount = media.length
  const hasMore = loadedCount < totalCount

  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const ioRef = useRef<IntersectionObserver | null>(null)

  // ---------- Filters (clientseitig, schema-agnostisch)
  const applyClientFilters = useCallback(
    (list: MediaItem[]) => {
      let next = list
      if (filter !== 'all') {
        next = next.filter((m) => (filter === 'image' ? isImage(m) : isVideo(m)))
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        next = next.filter((m) => {
          const title = getTitle(m).toLowerCase()
          const desc = getDescription(m).toLowerCase()
          return title.includes(q) || desc.includes(q)
        })
      }
      return next
    },
    [filter, search]
  )

  const filteredMedia = useMemo(() => applyClientFilters(media), [applyClientFilters, media])

  // ---------- Initial Load
  const loadInitial = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [
        { data: items, count, error: e1 },
        perfRes,
        sessRes,
        snippetsRes,
      ] = await Promise.all([
        supabase
          .from('session_media')
          .select('*', { count: 'exact' })
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .range(0, PAGE_SIZE - 1),
        supabase
          .from('creator_session_metrics')
          .select('impressions, views')
          .eq('session_id', sessionId)
          .single(),
        supabase
          .from('creator_sessions')
          .select('visibility, title')
          .eq('id', sessionId)
          .single(),
        // ⚠️ order_index existiert in deinem Schema nicht → weglassen
        supabase
          .from('session_snippets')
          .select('content, created_at')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true }),
      ])

      if (e1) throw e1

      setMedia((items ?? []) as MediaItem[])
      setTotalCount(count ?? (items?.length ?? 0))

      if (!perfRes.error && perfRes.data) {
        const metrics = perfRes.data as SessionMetric
        setPerformance({
          impressions: metrics.impressions ?? 0,
          views: metrics.views ?? 0,
        })
      }

      if (!sessRes.error && sessRes.data) {
        const s = sessRes.data as SessionRow
        setSessionVisibility((s.visibility as SessionRow['visibility']) ?? 'private')
      }

      if (!snippetsRes.error && snippetsRes.data) {
        const text = (snippetsRes.data as SnippetRow[])
          .map((s) => s.content ?? '')
          .filter(Boolean)
          .join('\n\n')
        setStoryText(text)
      }
    } catch (err: any) {
      setError(err?.message ?? 'Unerwarteter Fehler beim Laden.')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  // ---------- Load More (Pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    try {
      const from = loadedCount
      const to = from + PAGE_SIZE - 1
      const { data, error: e } = await supabase
        .from('session_media')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .range(from, to)
      if (e) throw e
      setMedia((prev) => {
        const ids = new Set(prev.map((p) => p.id))
        const add = ((data ?? []) as MediaItem[]).filter((row) => !ids.has(row.id))
        return [...prev, ...add]
      })
    } catch {
      /* optional toast */
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loadingMore, loadedCount, sessionId])

  // ---------- Effects
  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  // Realtime – Payload untypisiert lassen, damit die Overload sauber matched
  useEffect(() => {
    // session_media
    const chMedia = supabase
      .channel(`session_media_${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_media', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          setMedia((prev) => {
            const next = [...prev]
            if (payload.eventType === 'INSERT') {
              const row = payload.new as MediaItem
              if (!next.find((m) => m.id === row.id)) next.unshift(row)
              setTotalCount((c) => c + 1)
            } else if (payload.eventType === 'UPDATE') {
              const row = payload.new as MediaItem
              const i = next.findIndex((m) => m.id === row.id)
              if (i >= 0) next[i] = row
            } else if (payload.eventType === 'DELETE') {
              const id = (payload.old as MediaItem).id
              const i = next.findIndex((m) => m.id === id)
              if (i >= 0) {
                next.splice(i, 1)
                setTotalCount((c) => Math.max(0, c - 1))
              }
            }
            return next
          })
        }
      )
      .subscribe()

    // creator_session_metrics
    const chMetrics = supabase
      .channel(`metrics_${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'creator_session_metrics', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const row = payload.new as SessionMetric
          if (!row) return
          setPerformance({
            impressions: row.impressions ?? 0,
            views: row.views ?? 0,
          })
        }
      )
      .subscribe()

    // creator_sessions
    const chSession = supabase
      .channel(`session_${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'creator_sessions', filter: `id=eq.${sessionId}` },
        (payload) => {
          const row = payload.new as SessionRow
          if (row?.visibility) setSessionVisibility(row.visibility)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(chMedia)
      supabase.removeChannel(chMetrics)
      supabase.removeChannel(chSession)
    }
  }, [sessionId])

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return
    if (ioRef.current) ioRef.current.disconnect()

    ioRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting) {
          setTimeout(() => void loadMore(), 40)
        }
      },
      { rootMargin: '600px 0px' }
    )

    ioRef.current.observe(sentinelRef.current)
    return () => ioRef.current?.disconnect()
  }, [loadMore, filteredMedia.length])

  // ---------- Toolbar Zähler
  const toolbarCounts = useMemo(() => {
    let images = 0
    let videos = 0
    for (const m of media) {
      if (isVideo(m)) videos++
      else if (isImage(m)) images++
    }
    return { images, videos, all: media.length }
  }, [media])

  // ---------- Render
  return (
    <div className="space-y-6">
      {/* Upload & Gen */}
      <MediaUploadForm sessionId={sessionId} userId={userId} />
      <TextToImageGenerator sessionId={sessionId} userId={userId} />

      {/* Toolbar */}
      <div className="rounded-xl border bg-card/60 backdrop-blur p-3 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Alle <Badge className="ml-2" variant="secondary">{toolbarCounts.all}</Badge>
            </Button>
            <Button
              variant={filter === 'image' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('image')}
            >
              Bilder <Badge className="ml-2" variant="secondary">{toolbarCounts.images}</Badge>
            </Button>
            <Button
              variant={filter === 'video' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('video')}
            >
              Videos <Badge className="ml-2" variant="secondary">{toolbarCounts.videos}</Badge>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="In Titeln/Beschreibung suchen…"
              className="h-9 w-full md:w-80"
              aria-label="Medien durchsuchen"
            />
            <div className="text-xs text-muted-foreground hidden md:block">
              Sichtbarkeit:&nbsp;
              <span className="font-medium">{(sessionVisibility ?? 'private').toString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="rounded-xl border bg-card p-3">
        {error && (
          <div className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <GalleryGrid media={filteredMedia} />
            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} />
            {loadingMore && (
              <div className="mt-3 text-center text-sm text-muted-foreground">Lade mehr…</div>
            )}
            {!hasMore && (
              <div className="mt-3 text-center text-xs text-muted-foreground">Alle Inhalte geladen.</div>
            )}
          </>
        )}
      </div>

      {/* Exporte */}
      <StoryExportPanel sessionId={sessionId}>
        <StoryPdfExportButton sessionId={sessionId} />
        <StoryMarkdownExportButton sessionId={sessionId} />
        <StoryLinkCopyButton sessionId={sessionId} />
      </StoryExportPanel>

      {/* Sichtbarkeit, Builder, Session-Export */}
      <VisibilityToggle sessionId={sessionId} currentVisibility={(sessionVisibility as any) ?? 'private'} />
      <StoryBuilder sessionId={sessionId} />
      <StorySessionExport sessionId={sessionId} />

      {/* Rating (mit automatisch aggregiertem Story-Text) */}
      <SessionRating
        sessionId={sessionId}
        storyText={storyText}
        existingRating={undefined}
        existingInsights=""
      />

      {/* Performance */}
      <SessionPerformancePanel
        impressions={performance.impressions}
        views={performance.views}
      />
    </div>
  )
}
