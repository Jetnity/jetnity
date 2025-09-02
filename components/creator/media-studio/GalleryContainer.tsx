'use client'

import React from 'react'
import { toast } from 'sonner'
import { useGallery } from './useGallery'
import GalleryGrid from './GalleryGrid'
import type { Tables } from '@/types/supabase'

type MediaItem = Tables<'session_media'>

export default function GalleryContainer({
  userId,
  sessionId,
  className,
}: { userId: string; sessionId?: string | null; className?: string }) {
  const { items, loading, hasMore, loadMore } = useGallery({ userId, sessionId, pageSize: 36 })

  async function bulkDelete(ids: string[]) {
    try {
      const res = await fetch('/api/media/bulk-delete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'delete failed')
      toast.success(`Entfernt: ${j.deleted}`)
    } catch (e: any) {
      toast.error('Löschen fehlgeschlagen', { description: String(e?.message || e) })
    }
  }

  async function bulkTag(ids: string[], tag: string) {
    try {
      const res = await fetch('/api/media/bulk-tag', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids, tag, mode: 'add' }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'tag failed')
      toast.success(`Tag „${tag}“ zugewiesen (${j.updated})`)
    } catch (e: any) {
      toast.error('Tagging fehlgeschlagen', { description: String(e?.message || e) })
    }
  }

  function openItem(item: MediaItem) {
    // optional: Deep-Link oder Modal öffnen – aktuell handled GalleryGrid-Preview
    console.debug('open item', item.id)
  }

  if (loading && !items.length) {
    return <div className="rounded-xl border bg-card/50 p-6 text-sm text-muted-foreground">Lade Medien…</div>
  }

  return (
    <GalleryGrid
      className={className}
      media={items}
      hasMore={hasMore}
      onLoadMore={loadMore}
      onBulkDelete={bulkDelete}
      onBulkTag={bulkTag}
      onOpenItem={openItem}
      columnsMin={240}
      localBatchSize={40}
    />
  )
}
