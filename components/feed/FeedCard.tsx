'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { incrementSessionImpression } from '@/lib/supabase/actions'
import CreatorMiniProfile from '@/components/creator/CreatorMiniProfile'
import type { Tables } from '@/types/supabase'

type CreatorProfile = Tables<'creator_profiles'>

interface FeedCardProps {
  id: string
  title: string
  rating?: number
  imageUrl?: string
  creator?: CreatorProfile | null // jetzt das vollständige Profil!
}

export default function FeedCard({ id, title, rating, imageUrl, creator }: FeedCardProps) {
  useEffect(() => {
    incrementSessionImpression(id)
  }, [id])

  return (
    <Link
      href={`/story/${id}`}
      aria-label={`Öffne Story: ${title}`}
      className="group block transition hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
    >
      <div className="p-4 rounded-2xl border bg-white shadow-sm group-hover:shadow-md transition space-y-3">
        {/* Bild (optional, für später aktivieren) */}
        {imageUrl && (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-40 object-cover rounded-xl mb-3"
          />
        )}

        <h3 className="font-semibold text-lg text-gray-800 mb-2">{title}</h3>

        {/* Modernes Creator-Profil */}
        {creator ? (
          <div className="mb-2">
            <CreatorMiniProfile creator={creator} size={32} />
          </div>
        ) : (
          <div className="text-xs text-neutral-400 italic mb-2">Kein Creator-Profil</div>
        )}

        <div className="flex gap-4 items-center text-sm">
          <span className="text-neutral-600">
            🧠 Score: <strong>{rating ?? 'n/a'}</strong>
          </span>
        </div>
      </div>
    </Link>
  )
}
