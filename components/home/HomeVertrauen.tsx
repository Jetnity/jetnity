import Link from 'next/link'

import { Faehigkeitskennzeichen } from '@/components/home/Faehigkeitskennzeichen'
import {
  HOMEPAGE_FAEHIGKEITEN,
  HOMEPAGE_UEBERSCHRIFTEN,
  HOMEPAGE_VERTRAUEN,
} from '@/lib/seo/final-homepage'

export function HomeVertrauen() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-4 sm:px-8 sm:py-8" aria-labelledby="vertrauen-titel">
      <div className="rounded-[28px] border border-black/5 bg-white px-5 py-8 sm:px-8 sm:py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Vertrauen</p>
        <h2
          id="vertrauen-titel"
          className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl"
        >
          {HOMEPAGE_UEBERSCHRIFTEN.vertrauen}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink-800">
          Jetnity ist zuerst auf die Schweiz ausgerichtet und für Reisen weltweit gedacht.
        </p>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {HOMEPAGE_VERTRAUEN.map((satz) => (
            <li key={satz} className="min-w-0 rounded-2xl bg-surface-75 px-4 py-4 text-sm leading-6 text-ink-950">
              {satz}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm leading-6 text-ink-800">
          <Link
            href="/privacy"
            className="inline-flex min-h-11 items-center font-semibold text-brand-800 underline decoration-ink-500 underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20"
          >
            Datenschutz
          </Link>
        </p>

        <h3 className="mt-10 text-xl font-semibold tracking-[-0.03em]">Was heute gilt</h3>
        <ul className="mt-4 grid gap-3">
          {HOMEPAGE_FAEHIGKEITEN.map((faehigkeit) => (
            <li
              key={faehigkeit.id}
              id={faehigkeit.id === 'jetnity-pro' ? 'pro' : undefined}
              data-faehigkeit={faehigkeit.id}
              data-stand={faehigkeit.stand}
              className="grid min-w-0 gap-2 rounded-2xl bg-surface-25 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
            >
              <div className="min-w-0">
                <p className="font-semibold tracking-[-0.02em]">{faehigkeit.titel}</p>
                <p className="mt-1 text-sm leading-6 text-ink-800">{faehigkeit.text}</p>
              </div>
              <Faehigkeitskennzeichen kennzeichnung={faehigkeit.kennzeichnung} className="sm:mt-0.5" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
