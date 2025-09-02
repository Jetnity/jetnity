// components/home/InspirationGrid.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Tables } from '@/types/supabase'

type Upload = Tables<'creator_uploads'>
type UploadExt = Upload & { blur_data_url?: string | null }

type Props = {
  uploads: UploadExt[]
  /** Erzeugt die Ziel-URL pro Upload (Default: /creator-dashboard?id=…) */
  hrefBuilder?: (u: UploadExt) => string
  /** Grid-Klassen überschreiben (z. B. "grid-cols-2 lg:grid-cols-4") */
  gridClassName?: string
  /** Wrapper-Klassen */
  className?: string
  /** Leerer Zustand: optionaler CTA */
  emptyCtaHref?: string
  emptyCtaLabel?: string
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
      {children}
    </span>
  )
}

export default function InspirationGrid({
  uploads,
  hrefBuilder = (u) => `/creator-dashboard?id=${encodeURIComponent(String(u.id))}`,
  gridClassName,
  className,
  emptyCtaHref = '/search',
  emptyCtaLabel = 'Inspirationen entdecken',
}: Props) {
  if (!uploads || uploads.length === 0) {
    return (
      <div className={cn('surface-1 rounded-2xl p-8 text-center', className)}>
        <p className="text-sm text-muted-foreground">
          Noch keine Inhalte verfügbar.
        </p>
        <div className="mt-4">
          <Link
            href={emptyCtaHref}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm hover:bg-muted/40"
          >
            {emptyCtaLabel} <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <section className={cn('w-full', className)}>
      <div
        className={cn(
          'grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
          gridClassName
        )}
      >
        {uploads.map((u) => {
          const title = u.title || 'Ohne Titel'
          const href = hrefBuilder(u)
          const hasImg = Boolean(u.image_url)

          return (
            <article
              key={u.id}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-e1 transition hover:-translate-y-0.5 hover:shadow-e3"
            >
              {/* Stretched Link für volle Klickfläche */}
              <Link
                href={href}
                className="absolute inset-0 z-10"
                aria-label={`Öffne: ${title}`}
              >
                <span className="sr-only">{title}</span>
              </Link>

              {/* Bildbereich mit Blur-Up (falls vorhanden) */}
              <div className="relative aspect-[4/3] bg-muted">
                {hasImg ? (
                  <Image
                    src={u.image_url as string}
                    alt={title}
                    fill
                    sizes="(min-width:1280px) 33vw, (min-width:768px) 50vw, 100vw"
                    placeholder={u.blur_data_url ? 'blur' : 'empty'}
                    blurDataURL={u.blur_data_url ?? undefined}
                    className="object-cover transition duration-700 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground">
                    Kein Bild
                  </div>
                )}
                {/* dezente Hover-Politur */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-2">
                <h3 className="line-clamp-2 text-base md:text-lg font-semibold tracking-tight group-hover:underline">
                  {title}
                </h3>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {u.region && <Badge>{u.region}</Badge>}
                  {u.mood && <Badge>{u.mood}</Badge>}
                </div>

                <Link
                  href={href}
                  className="relative z-20 inline-block text-sm text-primary underline-offset-4 hover:underline"
                >
                  Mehr erfahren →
                </Link>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
