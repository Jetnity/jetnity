'use client'

import MediaItemCard from './MediaItemCard'
import type { Tables } from '@/types/supabase'

type MediaItem = Tables<'session_media'>

interface GalleryGridProps {
  media: MediaItem[]
}

export default function GalleryGrid({ media }: GalleryGridProps) {
  if (!media.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Noch keine Medien vorhanden. Lade ein Bild hoch oder generiere eines mit KI.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {media.map((item) => (
        <MediaItemCard
          key={item.id}
          imageUrl={item.image_url}
          createdAt={item.created_at ?? ''}
          isAiGenerated={item.is_ai_generated ?? false}
          description={item.description ?? ''}
          tags={item.tags ?? []}
        />
      ))}
    </div>
  )
}
