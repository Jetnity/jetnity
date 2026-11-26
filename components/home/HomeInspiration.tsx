import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { inspirationsbild } from '@/lib/inspiration/bildfreigabe'
import { HOMEPAGE_UEBERSCHRIFTEN } from '@/lib/seo/final-homepage'
import type { PublicInspiration } from '@/lib/inspiration/cms-public'

export type HomeInspirationsziel = {
  name: string
  country: string
  image: string
  href: string
}

export function HomeInspiration({ ziele, status = 'static' }: {
  ziele: readonly HomeInspirationsziel[]; status?: PublicInspiration['status']
}) {
  return (
    <section
      id="entdecken"
      lang="de"
      className="mx-auto max-w-7xl scroll-mt-28 px-5 py-14 sm:px-8 sm:py-20"
      aria-labelledby="inspiration-titel"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Inspiration</p>
          <h2
            id="inspiration-titel"
            className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl"
          >
            {HOMEPAGE_UEBERSCHRIFTEN.inspiration}
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-6 text-ink-800">
          Deine Reise sollte es auch sein. Jetnity berücksichtigt deine Interessen, dein Tempo und die Menschen, mit denen du reist.
        </p>
      </div>
      {status === 'fallback' && <p role="status" className="mt-6 text-sm leading-6 text-ink-950">
        Weitere Reiseideen sind vorübergehend nicht verfügbar. Entdecke inzwischen diese Auswahl.
      </p>}
      {status !== 'unavailable' && ziele.length ? <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ziele.map((ziel) => {
          const bild = inspirationsbild(ziel.image)
          return (
            <li key={ziel.name} className="min-w-0">
              <Link
                href={ziel.href}
                className="hs-bild-rand group relative flex min-h-[280px] overflow-hidden rounded-[28px] bg-brand-800 text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 sm:min-h-[360px]"
              >
                <Image
                  src={bild.src}
                  alt={bild.neutral ? '' : `${ziel.name}, ${ziel.country}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-[1.03]"
                />
                <span className="relative mt-auto flex w-full items-end justify-between gap-3 bg-gradient-to-t from-black/85 via-black/70 via-55% to-transparent p-5 pt-16">
                  <span className="min-w-0">
                    <span className="block text-xs text-white">{ziel.country}</span>
                    <h3 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">{ziel.name}</h3>
                  </span>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10">
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul> : <p role="status" className="mt-8 rounded-2xl border border-line-200 bg-surface-0 p-5 text-ink-950">
        {status === 'unavailable' ? 'Reiseideen derzeit nicht verfügbar.' : 'Derzeit sind keine Reiseideen veröffentlicht.'}
      </p>}
      <Link
        href="/entdecken"
        className="mt-6 inline-flex min-h-11 max-w-full items-center gap-2 rounded-full border border-brand-800 px-4 py-3 text-sm font-semibold text-brand-800 hover:bg-surface-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
      >
        <span className="min-w-0">Mehr Reiseideen</span>
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
      </Link>
    </section>
  )
}
