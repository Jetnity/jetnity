import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { HOMEPAGE_UEBERSCHRIFTEN } from '@/lib/seo/final-homepage'

export type HomeInspirationsziel = {
  name: string
  country: string
  image: string
  href: string
}

export function HomeInspiration({ ziele }: { ziele: readonly HomeInspirationsziel[] }) {
  return (
    <section
      id="entdecken"
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
          Jede Karte öffnet die echte Planung mit dem bestätigten Ort. Keine eigene Angebotsseite.
        </p>
      </div>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ziele.map((ziel) => (
          <li key={ziel.name} className="min-w-0">
            <Link
              href={ziel.href}
              className="group relative flex min-h-[280px] overflow-hidden rounded-[28px] bg-brand-800 text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30 sm:min-h-[360px]"
            >
              <Image
                src={ziel.image}
                alt={`${ziel.name}, ${ziel.country}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover motion-safe:transition motion-safe:duration-700 motion-safe:group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <span className="relative mt-auto flex w-full items-end justify-between gap-3 p-5">
                <span className="min-w-0">
                  <span className="block text-xs text-white/80">{ziel.country}</span>
                  <h3 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">{ziel.name}</h3>
                </span>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10">
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
