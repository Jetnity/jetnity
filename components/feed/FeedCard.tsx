'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { incrementSessionImpression } from '@/lib/supabase/actions'
// import { cn } from '@/lib/utils/cn' // falls utility vorhanden für classnames

interface FeedCardProps {
  id: string
  title: string
  userId: string
  rating?: number
  imageUrl?: string // 🔜 optional für Zukunft
}

export default function FeedCard({ id, title, userId, rating }: FeedCardProps) {
  useEffect(() => {
    incrementSessionImpression(id)
  }, [id])

  return (
    <Link
      href={`/story/${id}`}
      aria-label={`Öffne Story: ${title}`}
      className="group block transition hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
    >
      <div className="p-4 rounded-2xl border bg-white shadow-sm group-hover:shadow-md transition space-y-2">
        <h3 className="font-semibold text-lg text-gray-800">{title}</h3>

        <p className="text-sm text-muted-foreground">
          👤 Creator: <code>{userId.slice(0, 8)}</code>
        </p>

        <p className="text-sm text-gray-500">
          🧠 Score: <strong>{rating ?? 'n/a'}</strong>
        </p>
      </div>
    </Link>
  )
}
