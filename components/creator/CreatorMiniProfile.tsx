'use client'

import Image from 'next/image'
import Link from 'next/link'
import * as React from 'react'
import type { Tables } from '@/types/supabase'
import { cn } from '@/lib/utils'

type CreatorProfile = Tables<'creator_profiles'>
type CreatorWithFacebook = CreatorProfile & { facebook?: string | null }

/* ---------------------------------- Types --------------------------------- */

type SizePreset = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface Props {
  creator: CreatorWithFacebook
  /** Entweder Preset oder explizite Pixelgröße */
  size?: SizePreset | number
  /** Benutzername unter dem Namen einblenden */
  withUsername?: boolean
  /** Social-Pills rendern */
  withSocials?: boolean
  /** Anzahl sichtbarer Social-Pills, Rest wird als +N angezeigt */
  socialsMax?: number
  /** dünner Akzent-Ring um den Avatar */
  avatarRing?: boolean
  /** Verifiziert-Badge (falls euer Schema ein Flag hat) */
  showVerified?: boolean
  /** Link deaktivieren (z. B. in klickbaren Karten, um Nested Links zu vermeiden) */
  disableLink?: boolean
  className?: string
}

/* --------------------------------- Utils ---------------------------------- */

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

const sizeToPx = (s: SizePreset | number | undefined): number => {
  if (typeof s === 'number') return Math.max(16, Math.floor(s))
  switch (s) {
    case 'xs': return 28
    case 'sm': return 36
    case 'md': return 44
    case 'lg': return 56
    case 'xl': return 72
    default:   return 40
  }
}

const isVerified = (c: CreatorWithFacebook): boolean =>
  Boolean((c as any)?.is_verified ?? (c as any)?.verified ?? (c as any)?.verified_at)

/* --------------------------------- Component ------------------------------- */

export default function CreatorMiniProfile({
  creator,
  size = 'sm',
  withUsername = true,
  withSocials = false,
  socialsMax = 4,
  avatarRing = true,
  showVerified = true,
  disableLink = false,
  className,
}: Props) {
  if (!creator) return null

  const px = sizeToPx(size)
  const { username, name, avatar_url, instagram, tiktok, youtube, twitter, website, facebook } = creator
  const href = username ? `/creator/${encodeURIComponent(username)}` : '#'
  const alt = name || username || 'Creator'
  const verified = showVerified && isVerified(creator)

  const allSocials = [
    { key: 'instagram', label: 'IG', url: socialUrl('instagram', instagram) },
    { key: 'tiktok',    label: 'TikTok', url: socialUrl('tiktok', tiktok) },
    { key: 'youtube',   label: 'YT', url: socialUrl('youtube', youtube) },
    { key: 'twitter',   label: 'X', url: socialUrl('twitter', twitter) },
    { key: 'facebook',  label: 'FB', url: socialUrl('facebook', facebook) },
    { key: 'website',   label: 'Web', url: socialUrl('website', website) },
  ].filter(s => !!s.url)

  const visibleSocials = withSocials ? allSocials.slice(0, Math.max(0, socialsMax)) : []
  const hiddenCount = withSocials ? Math.max(0, allSocials.length - visibleSocials.length) : 0

  const [imgError, setImgError] = React.useState(false)
  const [imgLoaded, setImgLoaded] = React.useState(false)

  const Avatar = (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-800',
        avatarRing && 'ring-1 ring-black/5 dark:ring-white/10',
      )}
      style={{ width: px, height: px, minWidth: px, minHeight: px }}
      aria-hidden
    >
      {/* Shimmer while loading */}
      {!imgLoaded && avatar_url && !imgError && (
        <div className="absolute inset-0 animate-pulse bg-neutral-200/60 dark:bg-neutral-700/60" />
      )}

      {avatar_url && !imgError ? (
        <Image
          src={avatar_url}
          alt={alt}
          width={px}
          height={px}
          className="h-full w-full rounded-full object-cover"
          sizes={`${px}px`}
          onError={() => setImgError(true)}
          onLoadingComplete={() => setImgLoaded(true)}
          priority={false}
        />
      ) : (
        <span
          className={cn(
            'select-none font-semibold',
            px >= 64 ? 'text-xl' : px >= 48 ? 'text-base' : 'text-xs'
          )}
        >
          {initials(name, username)}
        </span>
      )}

      {verified && (
        <span
          className={cn(
            'absolute bottom-0 right-0 translate-x-1 translate-y-1 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-neutral-900',
          )}
          style={{ width: Math.max(10, Math.round(px * 0.28)), height: Math.max(10, Math.round(px * 0.28)) }}
          title="Verifiziertes Profil"
          aria-label="Verifiziert"
        />
      )}
    </div>
  )

  const NameBlock = (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1">
        <span className="truncate text-sm font-semibold leading-tight">{name || username || 'Creator'}</span>
      </div>
      {withUsername && username && (
        <span className="truncate text-xs leading-tight text-muted-foreground">@{username}</span>
      )}

      {withSocials && visibleSocials.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {visibleSocials.map(s => (
            <a
              key={s.key}
              href={s.url!}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex items-center rounded-md border bg-background/80 px-1.5 py-0.5 text-[11px] leading-none transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
              )}
              aria-label={`${s.label} öffnen`}
              title={s.url!}
            >
              {s.label}
            </a>
          ))}
          {hiddenCount > 0 && (
            <span
              className="inline-flex select-none items-center rounded-md border border-dashed bg-muted/50 px-1.5 py-0.5 text-[11px] leading-none text-muted-foreground"
              title={`${hiddenCount} weitere`}
              aria-label={`${hiddenCount} weitere Profile`}
            >
              +{hiddenCount}
            </span>
          )}
        </div>
      )}
    </div>
  )

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const baseClass = cn(
      'group inline-flex items-center gap-2 rounded-xl px-2 py-1 transition',
      'hover:bg-accent/40',
      className
    )
    if (!username || disableLink) {
      return (
        <div className={baseClass} title={alt} aria-label={alt}>
          {children}
        </div>
      )
    }
    return (
      <Link
        href={href}
        prefetch={false}
        className={baseClass}
        aria-label={`Profil von ${alt} öffnen`}
        title={alt}
      >
        {children}
      </Link>
    )
  }

  return (
    <Wrapper>
      {Avatar}
      {NameBlock}
    </Wrapper>
  )
}
