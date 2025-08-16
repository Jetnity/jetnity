import Link from 'next/link'
import type { Tables } from '@/types/supabase'

type CreatorProfile = Tables<'creator_profiles'>

interface Props {
  creator: CreatorProfile
  size?: number // optional, z.B. 32/40/48 px
  withUsername?: boolean
  withSocials?: boolean
}

export default function CreatorMiniProfile({
  creator,
  size = 40,
  withUsername = true,
  withSocials = false,
}: Props) {
  if (!creator) return null

  return (
    <Link
      href={`/creator/${creator.username}`}
      className="flex items-center gap-2 group hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-xl px-2 py-1 transition"
      title={creator.name ?? creator.username ?? ''}
    >
      {/* Avatar */}
      <div
        className="rounded-full border bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center"
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      >
        {creator.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={creator.avatar_url}
            alt={creator.name || creator.username || 'Creator'}
            className="object-cover w-full h-full rounded-full"
            width={size}
            height={size}
          />
        ) : (
          <span className="text-xl text-neutral-400">👤</span>
        )}
      </div>
      {/* Name & Username */}
      <div className="flex flex-col">
        <span className="font-semibold text-base leading-tight group-hover:underline">
          {creator.name || creator.username}
        </span>
        {withUsername && creator.username && (
          <span className="text-xs text-blue-500 leading-tight">@{creator.username}</span>
        )}
        {withSocials && (
          <div className="flex gap-1 mt-1">
            {creator.instagram && (
              <a href={creator.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-500 text-xs hover:underline">IG</a>
            )}
            {creator.tiktok && (
              <a href={creator.tiktok} target="_blank" rel="noopener noreferrer" className="text-black text-xs hover:underline">TikTok</a>
            )}
            {creator.youtube && (
              <a href={creator.youtube} target="_blank" rel="noopener noreferrer" className="text-red-500 text-xs hover:underline">YT</a>
            )}
            {creator.twitter && (
              <a href={creator.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs hover:underline">X</a>
            )}
            {creator.website && (
              <a href={creator.website} target="_blank" rel="noopener noreferrer" className="text-blue-700 text-xs hover:underline">Web</a>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
