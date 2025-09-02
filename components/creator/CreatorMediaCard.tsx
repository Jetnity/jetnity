'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MoreHorizontal, Link2, Eye, Pencil, Trash2 } from 'lucide-react'
import type { Tables } from '@/types/supabase'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

type Upload = Tables<'creator_uploads'> & {
  creator_profile?: Tables<'creator_profiles'> | null
}

type Props = {
  upload: Upload
  /** öffnet eine Vorschau (Modal/Routing) */
  onPreview?: (u: Upload) => void
  /** kopiert/öffnet den öffentlichen Link */
  onCopyLink?: (u: Upload) => void
  /** optional bearbeiten/löschen wie gehabt */
  onEdit?: () => void
  onDelete?: () => void
  /** optional: klickbare Ziel-URL (ersetzt onPreview) */
  href?: string
  className?: string
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

export default function CreatorMediaCard({
  upload,
  onPreview,
  onCopyLink,
  onEdit,
  onDelete,
  href,
  className,
}: Props) {
  const {
    id,
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

  // Haupt-Klick: entweder href oder onPreview
  const Main = href
    ? ({ children }: { children: React.ReactNode }) => (
        <Link href={href} aria-label={`Vorschau von ${title ?? 'Upload'}`}>{children}</Link>
      )
    : ({ children }: { children: React.ReactNode }) => (
        <button
          type="button"
          className="block w-full text-left"
          onClick={() => onPreview?.(upload)}
          aria-label={`Vorschau von ${title ?? 'Upload'} öffnen`}
        >
          {children}
        </button>
      )

  return (
    <article
      className={cn(
        'group/card isolate relative overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition',
        'hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900',
        className
      )}
    >
      {/* Klickfläche: Bild + (optional) Titelbereich */}
      <Main>
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
            <div className="absolute left-3 top-3 rounded-full bg-white/85 px-3 py-1 text-[11px] font-medium shadow backdrop-blur">
              {format}
            </div>
          )}
        </div>
      </Main>

      {/* Hover/Fokus-Actions – Desktop (oben rechts) */}
      <div
        className={cn(
          'pointer-events-none absolute right-3 top-3 z-10 hidden items-center gap-2 opacity-0 transition',
          'group-hover/card:opacity-100 group-focus-within/card:opacity-100',
          'sm:flex'
        )}
      >
        {onCopyLink && (
          <ActionPill
            icon={<Link2 className="h-4 w-4" />}
            label="Link"
            onClick={() => onCopyLink?.(upload)}
          />
        )}
        {(onPreview || href) && (
          <ActionPill
            icon={<Eye className="h-4 w-4" />}
            label="Vorschau"
            onClick={() => (href ? null : onPreview?.(upload))}
            asLink={!!href}
            linkHref={href}
          />
        )}
        {(onEdit || onDelete) && (
          <div className="pointer-events-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="secondary" className="h-7 w-7 rounded-full bg-white/90 backdrop-blur">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="mr-2 h-4 w-4" /> Bearbeiten
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={onDelete}>
                    <Trash2 className="mr-2 h-4 w-4" /> Löschen
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Touch/klein: Bottom-Actionbar (überdeckt Inhalte nicht) */}
      <div className="sm:hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-black/10 to-transparent" />
        <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-10 flex items-center justify-end gap-2 p-2">
          {onCopyLink && (
            <ActionPill
              icon={<Link2 className="h-4 w-4" />}
              label="Link"
              onClick={() => onCopyLink?.(upload)}
            />
          )}
          {(onPreview || href) && (
            <ActionPill
              icon={<Eye className="h-4 w-4" />}
              label="Vorschau"
              onClick={() => (href ? null : onPreview?.(upload))}
              asLink={!!href}
              linkHref={href}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="line-clamp-1 text-base font-semibold leading-5" title={title ?? ''}>
          {title ?? 'Ohne Titel'}
        </h3>

        {(region || mood || dateLabel) && (
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-500">
            {region && <span>📍 {region}</span>}
            {mood && <span>🎛️ {mood}</span>}
            {dateLabel && <span>• {dateLabel}</span>}
          </div>
        )}

        {description && <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{description}</p>}

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

        {/* Creator Fußzeile oder Placeholder */}
        <div className="mt-3 text-xs text-neutral-400">
          {creator_profile ? 'Profil verknüpft' : <em>Kein Profil verknüpft</em>}
        </div>
      </div>
    </article>
  )
}

/* ───────────────────── UI Bits ───────────────────── */

function ActionPill({
  icon,
  label,
  onClick,
  asLink,
  linkHref,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  asLink?: boolean
  linkHref?: string
}) {
  const classes =
    'pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium shadow backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'

  if (asLink && linkHref) {
    return (
      <Link href={linkHref} className={classes} aria-label={label}>
        {icon}
        {label}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={classes} aria-label={label}>
      {icon}
      {label}
    </button>
  )
}
