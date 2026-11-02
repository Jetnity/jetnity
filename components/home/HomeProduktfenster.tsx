import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Coffee, MapPin, Route, Sun } from 'lucide-react'

import { HOMEPAGE_PRODUKTFENSTER as fenster, HOMEPAGE_UEBERSCHRIFTEN } from '@/lib/seo/final-homepage'

const TAGES_SYMBOLE = [Coffee, MapPin, Sun]

export function HomeProduktfenster() {
  return (
    <section className="mx-auto max-w-[1450px] px-3 pb-6 sm:px-5 sm:pb-10" aria-labelledby="produktfenster-titel">
      <div className="mb-8 max-w-3xl px-2 sm:px-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">So sieht deine Reise aus</p>
        <h2 id="produktfenster-titel" className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl">
          {HOMEPAGE_UEBERSCHRIFTEN.produktfenster}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink-800">
          Mehrere Orte, kleine Entdeckungen und genug Platz für spontane Ideen. Ein Beispiel, wie du mit Jetnity alles zusammenhältst.
        </p>
      </div>
      <article className="overflow-hidden rounded-[28px] border border-line-200 bg-white shadow-sm sm:rounded-[36px]" aria-label="Beispielreise Lissabon und Porto">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-brand-800 px-5 py-4 text-white sm:px-8">
          <span className="flex items-center gap-2 text-sm font-semibold">
            <Route className="h-5 w-5 shrink-0 text-citrus-400" aria-hidden="true" />
            Deine Reise auf einen Blick
          </span>
          <span className="rounded-full border border-white/30 px-3 py-1 text-xs font-medium">{fenster.kennzeichnung}</span>
        </div>
        <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <div className="min-w-0 border-b border-line-200 lg:border-b-0 lg:border-r">
            <div className="relative h-48 sm:h-56">
              <Image src="/images/lisbon.jpg" alt="Straßenbahn in einer Gasse von Lissabon" fill sizes="(min-width: 1536px) 616px, (min-width: 1024px) 42vw, 100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 bg-brand-900/90 px-5 py-4 text-white sm:px-8">
                <h3 className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">{fenster.titel}</h3>
                <p className="mt-2 text-sm text-white/90">{fenster.meta}</p>
              </div>
            </div>
            <div className="p-5 sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Deine Route</p>
              <ol className="mt-5 space-y-6">
                {fenster.route.map((halt, index) => (
                  <li key={halt.ort} className="relative flex items-start gap-4">
                    {index === 0 ? <span className="absolute bottom-[-1.5rem] left-[1.05rem] top-8 w-px bg-brand-800/20" aria-hidden="true" /> : null}
                    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-100 text-sm font-semibold">{index + 1}</span>
                    <div className="min-w-0">
                      <p className="font-semibold">{halt.ort}</p>
                      <p className="mt-1 text-sm leading-6 text-ink-800">{halt.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="min-w-0 p-5 sm:p-8 lg:p-10">
            <ul className="flex flex-wrap gap-2" aria-label="Bereiche deiner Reise">
              {fenster.modi.map((modus) => (
                <li key={modus} className={`rounded-full px-3 py-2 text-xs font-semibold ${modus === 'Reiseplan' ? 'bg-brand-800 text-white' : 'bg-surface-100 text-brand-800'}`}>
                  {modus}
                </li>
              ))}
            </ul>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Tag 2 · Dein Tagesplan</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">{fenster.tag}</h3>
            <ol className="mt-6 divide-y divide-line-200">
              {fenster.tagesplan.map((punkt, index) => {
                const Symbol = TAGES_SYMBOLE[index]!
                return (
                  <li key={punkt.zeit} className="flex gap-4 py-5 first:pt-0">
                    <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-100"><Symbol className="h-5 w-5" aria-hidden="true" /></span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-ink-800">{punkt.zeit} · {punkt.art}</p>
                      <p className="mt-1 font-semibold">{punkt.titel}</p>
                      <p className="mt-1 text-sm leading-6 text-ink-800">{punkt.text}</p>
                    </div>
                  </li>
                )
              })}
            </ol>
            <Link href="#travel-idea" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full font-semibold text-brand-800 underline decoration-brand-800/30 underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/25">
              Deine eigene Reise planen <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </article>
    </section>
  )
}
