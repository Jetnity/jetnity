import Image from "next/image"
import type { Tables } from '@/types/supabase'

type Upload = Tables<'creator_uploads'>

type Props = {
  upload: Upload
  onEdit?: () => void
  onDelete?: () => void
}

export default function CreatorMediaCard({ upload, onEdit, onDelete }: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center">
      <Image
        src={upload.image_url ?? ''}
        alt={upload.title ?? 'Upload'}
        width={320}
        height={180}
        className="rounded mb-2 object-cover"
      />
      <h3 className="font-semibold text-lg mb-2">{upload.title ?? 'Ohne Titel'}</h3>
      <div className="flex gap-2">
        {onEdit && <button onClick={onEdit} className="text-blue-600 hover:underline">Bearbeiten</button>}
        {onDelete && <button onClick={onDelete} className="text-red-600 hover:underline">Löschen</button>}
      </div>
    </div>
  )
}
