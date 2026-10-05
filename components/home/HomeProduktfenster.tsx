import Link from 'next/link'

import { Faehigkeitskennzeichen } from '@/components/home/Faehigkeitskennzeichen'
import { HOMEPAGE_PRODUKTFENSTER, HOMEPAGE_UEBERSCHRIFTEN } from '@/lib/seo/final-homepage'

export function HomeProduktfenster() {
  const fenster = HOMEPAGE_PRODUKTFENSTER
  return (
    <section className="px-3 py-2 sm:px-5 sm:py-4" aria-labelledby="produktfenster-titel">
      <div className="mx-auto max-w-[1450px]">
        <div className="max-w-2xl px-2">
          <Faehigkeitskennzeichen kennzeichnung={fenster.kennzeichnung} />
          <h2
            id="produktfenster-titel"
            className="mt-4 text-3xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl"
          >
            {HOMEPAGE_UEBERSCHRIFTEN.produktfenster}
          </h2>
          <p className="mt-4 text-base leading-7 text-ink-800">
            Eine synthetische Reise, gebaut aus dem Muster des Reisebereichs. Sie enthält keine
            Anbieterangebote, keine Buchung und keine amtliche Auskunft.
          </p>
        </div>

        <article className="mt-8 overflow-hidden rounded-[28px] bg-brand-900 text-white shadow-[0_28px_80px_rgba(15,46,42,0.16)] sm:rounded-[36px]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex shrink-0 gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-citrus-400" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-citrus-400">
                {fenster.kennzeichnung}
              </p>
            </div>
            <p className="text-xs text-ink-400">{fenster.meta}</p>
          </div>

          <div className="bg-surface-0 text-brand-900 lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(17rem,0.8fr)]">
            <div className="min-w-0 px-4 py-5 sm:px-7 sm:py-7">
              <h3 className="text-2xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-3xl">{fenster.titel}</h3>
              <p className="mt-1 text-sm text-ink-700">{fenster.meta}</p>

              <div className="mt-5 rounded-[24px] bg-surface-75 px-4 py-4 sm:px-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">Beispielroute</p>
                <ol className="mt-4" aria-label="Lissabon und Porto">
                  {fenster.route.map((halt, index) => (
                    <li key={halt.ort} className="relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3 pb-5 last:pb-0">
                      {index < fenster.route.length - 1 ? (
                        <span className="absolute bottom-0 left-[0.4rem] top-3 w-px bg-brand-800/25" aria-hidden="true" />
                      ) : null}
                      <span className="relative z-10 mt-1.5 h-3.5 w-3.5 rounded-full border-2 border-brand-800 bg-citrus-400" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="text-lg font-semibold tracking-[-0.03em] text-brand-800">{halt.ort}</p>
                        <p className="mt-0.5 text-sm leading-6 text-ink-800">{halt.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-4 rounded-[24px] bg-brand-800 px-4 py-4 text-white sm:px-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-citrus-400">Jetzt wichtig</p>
                <p className="mt-1 text-lg font-semibold tracking-[-0.03em]">{fenster.jetztWichtig}</p>
              </div>

              <p className="mt-4 text-sm leading-6 text-ink-700">{fenster.hinweis}</p>
              <Link
                href="#travel-idea"
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-brand-800 px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/30"
              >
                {fenster.naechsterSchritt}
              </Link>
            </div>

            <div className="border-t border-line-200 bg-surface-25 px-4 py-5 sm:px-6 lg:border-l lg:border-t-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">Bereiche dieser Reise</p>
              <ul className="mt-3" aria-label="Bereiche dieser Reise">
                {fenster.modi.map((modus) => (
                  <li key={modus.titel} className="border-b border-line-200 py-3 last:border-b-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold tracking-[-0.02em] text-brand-800">{modus.titel}</h4>
                      <Faehigkeitskennzeichen kennzeichnung={modus.kennzeichnung} />
                    </div>
                    <p className="mt-1 text-sm leading-6 text-ink-800">{modus.text}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm leading-6 text-ink-700">{fenster.modiHinweis}</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
