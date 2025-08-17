'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { Tables } from '@/types/supabase'
import { cn } from '@/lib/utils'

type CreatorProfile = Tables<'creator_profiles'>
type CreatorWithFacebook = CreatorProfile & { facebook?: string | null }

interface Props {
  creator: CreatorWithFacebook
  size?: number
  withUsername?: boolean
  withSocials?: boolean
  className?: string
}

function initials(name?: string | null, username?: string | null) {
  const base = (name || username || '').trim()
  if (!base) return '👤'
  const parts = base.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return (base[0] || 'U').toUpperCase()
  if (parts.length === 1) return parts[0][0]?.toUpperCase() || 'U'
  return (parts[0][0] + parts[1][0]).toUpperCase()
}
const normalizeHandle = (v?: string | null) => (v ?? '').trim().replace(/^@/, '')
const ensureHttp = (v?: string | null) => {
  const s = (v ?? '').trim()
  if (!s) return ''
  return /^https?:\/\//i.test(s) ? s : `https://${s}`
}
function socialUrl(
  kind: 'instagram' | 'tiktok' | 'youtube' | 'twitter' | 'facebook' | 'website',
  value?: string | null
) {
  if (!value) return ''
  const raw = value.trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  const handle = normalizeHandle(raw)
  switch (kind) {
    case 'instagram': return `https://instagram.com/${handle}`
    case 'tiktok':    return `https://www.tiktok.com/@${handle}`
    case 'youtube':   return `https://youtube.com/@${handle}`
    case 'twitter':   return `https://x.com/${handle}`
    case 'facebook':  return `https://facebook.com/${handle}`
    case 'website':   return ensureHttp(raw)
  }
}

export default function CreatorMiniProfile({
  creator,
  size = 40,
  withUsername = true,
  withSocials = false,
  className,
}: Props) {
  if (!creator) return null

  const { username, name, avatar_url, instagram, tiktok, youtube, twitter, website, facebook } = creator
  const href = username ? `/creator/${encodeURIComponent(username)}` : '#'
  const alt = name || username || 'Creator'

  const socials = [
    { key: 'instagram', label: 'IG', url: socialUrl('instagram', instagram) },
    { key: 'tiktok',    label: 'TikTok', url: socialUrl('tiktok', tiktok) },
    { key: 'youtube',   label: 'YT', url: socialUrl('youtube', youtube) },
    { key: 'twitter',   label: 'X', url: socialUrl('twitter', twitter) },
    { key: 'facebook',  label: 'FB', url: socialUrl('facebook', facebook) },
    { key: 'website',   label: 'Web', url: socialUrl('website', website) },
  ].filter(s => !!s.url)

  const Avatar = (
    <div
      className="rounded-full border bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden"
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      aria-hidden
    >
      {avatar_url ? (
        <Image
          src={avatar_url}
          alt={alt}
          width={size}
          height={size}
          className="object-cover w-full h-full rounded-full"
          sizes={`${size}px`}
          placeholder="empty"
        />
      ) : (
        <span className="text-xs md:text-sm lg:text-base text-neutral-500 font-semibold select-none">
          {initials(name, username)}
        </span>
      )}
    </div>
  )

  const Content = (
    <div className="flex flex-col min-w-0">
      <span className="font-semibold text-sm leading-tight group-hover:underline truncate">
        {name || username || 'Creator'}
      </span>
      {withUsername && username && (
        <span className="text-xs text-blue-600 leading-tight truncate">@{username}</span>
      )}
      {withSocials && socials.length > 0 && (
        <div className="flex gap-2 mt-1 flex-wrap">
          {socials.map(s => (
            <a
              key={s.key}
              href={s.url!}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'text-[11px] px-1.5 py-[2px] rounded border',
                s.key === 'youtube'  && 'border-red-200 text-red-600',
                s.key === 'instagram'&& 'border-pink-200 text-pink-600',
                s.key === 'tiktok'   && 'border-neutral-300 text-neutral-900 dark:text-white',
                s.key === 'twitter'  && 'border-blue-200 text-blue-600',
                s.key === 'facebook' && 'border-blue-300 text-blue-700',
                s.key === 'website'  && 'border-blue-300 text-blue-700'
              )}
              aria-label={`${s.label} öffnen`}
              title={s.url}
            >
              {s.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )

  if (!username) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-xl px-2 py-1 bg-white/40 dark:bg-neutral-900/40',
          className
        )}
        title={alt}
      >
        {Avatar}
        {Content}
      </div>
    )
  }

  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(
        'flex items-center gap-2 group hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-xl px-2 py-1 transition',
        className
      )}
      aria-label={`Profil von ${alt} öffnen`}
      title={alt}
    >
      {Avatar}
      {Content}
    </Link>
  )
}
