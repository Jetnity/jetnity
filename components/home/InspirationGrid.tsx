// components/home/InspirationGrid.tsx

'use client'

import Image from 'next/image'
import type { Tables } from '@/types/supabase'

type Upload = Tables<'creator_uploads'>

export default function InspirationGrid({ uploads }: { uploads: Upload[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {uploads.map((upload) => (
        <div
          key={upload.id}
          className="rounded overflow-hidden shadow hover:shadow-lg transition"
        >
          <Image
            src={upload.image_url ?? '/placeholder.png'}
            alt={upload.title}
            width={800}
            height={500}
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <h3 className="text-xl font-semibold">{upload.title}</h3>
            <p className="text-sm text-gray-500">{upload.region} – {upload.mood}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
