'use client'

import Image from 'next/image'
import type { Tables } from '@/types/supabase'
import CreatorMiniProfile from '@/components/creator/CreatorMiniProfile'
import { cn } from '@/lib/utils'

type Upload = Tables<'creator_uploads'> & {
  creator_profile?: Tables<'creator_profiles'> | null
}

type Props = {
  upload: Upload
  onEdit?: () => void
  onDelete?: () => void
}

const FALLBACK_IMG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/Sk9i6cAAAAASUVORK5CYII='

function formatDate(iso?: string | null) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    })
  } catch {
    return ''
  }
}

export default function CreatorMediaCard({ upload, onEdit, onDelete }: Props) {
  const {
    title,
    description,
    image_url,
    file_url,
    format,
    region,
    mood,
    created_at,
    tags,
    creator_profile,
  } = upload

  const imgSrc = image_url || file_url || FALLBACK_IMG
  const dateLabel = formatDate(created_at ?? undefined)
  const tagList = Array.isArray(tags) ? tags.slice(0, 3) : []

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-white border border-neutral-100 shadow-sm',
        'transition hover:shadow-xl'
      )}
    >
      {/* Media */}
      <div className="relative aspect-[16/9] w-full">
        <Image
          src={imgSrc}
          alt={title || 'Upload'}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
          placeholder="blur"
          blurDataURL={FALLBACK_IMG}
          priority={false}
        />

        {/* Format Badge */}
        {format && (
          <div className="absolute left-3 top-3 rounded-full bg-white/85 backdrop-blur px-3 py-1 text-[11px] font-medium shadow">
            {format}
          </div>
        )}

        {/* Hover Actions */}
        {(onEdit || onDelete) && (
          <div className="absolute right-3 top-3 flex gap-2 opacity-0 transition group-hover:opacity-100">
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-2.5 py-1.5 rounded-md bg-blue-600 text-white text-xs shadow hover:bg-blue-700"
                aria-label="Bearbeiten"
              >
                Bearbeiten
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-2.5 py-1.5 rounded-md bg-red-600 text-white text-xs shadow hover:bg-red-700"
                aria-label="Löschen"
              >
                Löschen
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3
          className="font-semibold text-base leading-5 line-clamp-1"
          title={title ?? ''}
        >
          {title ?? 'Ohne Titel'}
        </h3>

        {/* Meta */}
        {(region || mood || dateLabel) && (
          <div className="mt-1 text-xs text-neutral-500 flex gap-2 flex-wrap">
            {region && <span>📍 {region}</span>}
            {mood && <span>🎛️ {mood}</span>}
            {dateLabel && <span>• {dateLabel}</span>}
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="mt-2 text-sm text-neutral-600 line-clamp-2">
            {description}
          </p>
        )}

        {/* Tags */}
        {tagList.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {tagList.map((t) => (
              <span
                key={t}
                className="rounded-full border border-neutral-200 px-2 py-0.5 text-[11px] text-neutral-600"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Creator */}
        <div className="mt-3">
          {creator_profile ? (
            <CreatorMiniProfile creator={creator_profile} size={28} />
          ) : (
            <span className="text-xs text-neutral-400 italic">
              Kein Profil verknüpft
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
