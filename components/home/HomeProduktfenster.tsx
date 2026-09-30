import Link from 'next/link'

import { Faehigkeitskennzeichen } from '@/components/home/Faehigkeitskennzeichen'
import { HOMEPAGE_PRODUKTFENSTER, HOMEPAGE_UEBERSCHRIFTEN } from '@/lib/seo/final-homepage'

export function HomeProduktfenster() {
  const fenster = HOMEPAGE_PRODUKTFENSTER
  return (
    <section className="px-3 sm:px-5" aria-labelledby="produktfenster-titel">
      <div className="mx-auto grid max-w-[1450px] items-center gap-8 rounded-[28px] bg-surface-100 px-5 py-10 sm:px-10 sm:py-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:px-14">
        <div className="min-w-0 max-w-xl">
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
        <article className="min-w-0 rounded-[28px] border border-white/80 bg-white p-4 shadow-[0_24px_70px_rgba(15,46,42,0.08)] sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">
                {fenster.kennzeichnung}
              </p>
              <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em]">{fenster.titel}</h3>
              <p className="mt-1 text-sm text-ink-700">{fenster.meta}</p>
            </div>
          </div>
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Bereiche dieser Reise">
            {fenster.modi.map((modus) => (
              <li
                key={modus.titel}
                className="inline-flex min-h-11 items-center rounded-full bg-brand-800 px-3 text-sm font-semibold text-white"
              >
                {modus.titel}
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-2xl bg-surface-75 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-600">Jetzt wichtig</p>
            <p className="mt-1 text-base font-semibold tracking-[-0.02em]">{fenster.jetztWichtig}</p>
            <p className="mt-1 text-sm leading-6 text-ink-700">{fenster.hinweis}</p>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {fenster.modi.map((modus) => (
              <li key={modus.titel} className="min-w-0 rounded-2xl bg-surface-25 px-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{modus.titel}</span>
                  <Faehigkeitskennzeichen kennzeichnung={modus.kennzeichnung} />
                </div>
                <p className="mt-1 text-sm leading-6 text-ink-800">{modus.text}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-6 text-ink-700">{fenster.modiHinweis}</p>
          <Link
            href="#travel-idea"
            className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-brand-800 underline decoration-ink-500 underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20"
          >
            {fenster.naechsterSchritt}
          </Link>
        </article>
      </div>
    </section>
  )
}
