import Image from 'next/image'
import type { Tables } from '@/types/supabase'
import CreatorMiniProfile from '@/components/creator/CreatorMiniProfile'
import { cn } from '@/lib/utils'

type Upload = Tables<'creator_uploads'> & { creator_profile?: Tables<'creator_profiles'> | null }

type Props = {
  upload: Upload
  onEdit?: () => void
  onDelete?: () => void
}

export default function CreatorMediaCard({ upload, onEdit, onDelete }: Props) {
  return (
    <div className={cn(
      "bg-white rounded-xl shadow p-4 flex flex-col items-center relative",
      "transition hover:shadow-xl hover:scale-[1.01]"
    )}>
      <div className="w-full relative">
        <Image
          src={upload.image_url ?? ''}
          alt={upload.title ?? 'Upload'}
          width={320}
          height={180}
          className="rounded mb-2 object-cover w-full h-44"
          style={{ objectFit: 'cover', background: '#eee' }}
        />
        {/* Optional Edit/Delete (hover, top-right) */}
        {(onEdit || onDelete) && (
          <div className="absolute top-3 right-3 flex gap-1">
            {onEdit && (
              <button onClick={onEdit} className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 shadow">
                Bearbeiten
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 shadow">
                Löschen
              </button>
            )}
          </div>
        )}
      </div>
      <h3 className="font-semibold text-lg mb-2 text-center w-full truncate" title={upload.title ?? ''}>
        {upload.title ?? 'Ohne Titel'}
      </h3>
      {/* Mini-Profil unter jedem Upload */}
      <div className="mt-2 w-full flex justify-center">
        {upload.creator_profile ? (
          <CreatorMiniProfile creator={upload.creator_profile} size={32} />
        ) : (
          <span className="text-xs text-neutral-400 italic">Kein Profil verknüpft</span>
        )}
      </div>
    </div>
  )
}
