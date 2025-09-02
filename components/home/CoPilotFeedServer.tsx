// components/home/CoPilotFeedServer.tsx
import Image from 'next/image'
import Link from 'next/link'
import { getTrendingUploads } from '@/lib/intelligence/copilot-feed.server'
import type { Tables } from '@/types/supabase'

type Upload = Tables<'creator_uploads'> & {
  // optional: falls du ein Blur-Preview speicherst
  blur_data_url?: string | null
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
      {children}
    </span>
  )
}

export default async function CoPilotFeedServer() {
  let uploads: Upload[] = []
  try {
    uploads = (await getTrendingUploads()) as Upload[]
  } catch (e) {
    // Fallback UI bei Serverfehlern (die Seite zeigt ohnehin Skeleton über Suspense)
    return (
      <div className="surface-1 rounded-2xl p-6 text-center text-destructive">
        CoPilot konnte keine Empfehlungen laden.
      </div>
    )
  }

  if (!uploads || uploads.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-10">
        Noch keine Empfehlungen von CoPilot Pro verfügbar.
      </p>
    )
  }

  return (
    <section
      aria-label="CoPilot Empfehlungen"
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {uploads.map((u) => {
        const title = u.title || 'Ohne Titel'
        const href = `/creator-dashboard?id=${encodeURIComponent(String(u.id))}`
        const hasImg = Boolean(u.image_url)

        return (
          <article
            key={u.id}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-e1 transition hover:shadow-e3"
          >
            {/* Stretched link für volle Klickfläche */}
            <Link href={href} aria-label={`Öffne Empfehlung: ${title}`} className="absolute inset-0 z-10">
              <span className="sr-only">{title}</span>
            </Link>

            {/* Bildbereich */}
            <div className="relative">
              <div className="relative aspect-[16/9] bg-muted">
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

              {/* kleine Ecke mit Quick-Action */}
              <div className="pointer-events-none absolute right-3 top-3 z-20 rounded-lg bg-background/80 px-2 py-1 text-[11px] shadow-e1 backdrop-blur-sm">
                Empfehlung
              </div>
            </div>

            {/* Inhalt */}
            <div className="p-4">
              <h3 className="line-clamp-2 text-base md:text-lg font-semibold tracking-tight group-hover:underline">
                {title}
              </h3>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {u.region && <Badge>{u.region}</Badge>}
                {u.mood && <Badge>{u.mood}</Badge>}
              </div>

              <div className="mt-3">
                <Link
                  href={href}
                  className="relative z-20 inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm hover:bg-muted/40"
                >
                  Mehr erfahren
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}
