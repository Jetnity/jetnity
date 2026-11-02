import Link from 'next/link'
import { ChevronDown, Compass, LockKeyhole, Sparkles } from 'lucide-react'

import { HOMEPAGE_FAQ, HOMEPAGE_UEBERSCHRIFTEN, HOMEPAGE_VERTRAUEN } from '@/lib/seo/final-homepage'

const SYMBOLE = [Compass, LockKeyhole, Sparkles]

export function HomeVertrauen() {
  return (
    <section
      id="fragen"
      className="mx-auto max-w-[1450px] scroll-mt-28 px-3 py-10 sm:px-5 sm:py-16"
      aria-labelledby="vertrauen-titel"
    >
      <div className="rounded-[28px] bg-white p-5 py-8 sm:rounded-[36px] sm:p-10 lg:p-12">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Mit gutem Gefühl planen</p>
          <h2 id="vertrauen-titel" className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl">
            {HOMEPAGE_UEBERSCHRIFTEN.vertrauen}
          </h2>
        </div>
        <ul className="mt-8 grid gap-6 md:grid-cols-3 md:gap-8">
          {HOMEPAGE_VERTRAUEN.map((punkt, index) => {
            const Symbol = SYMBOLE[index]!
            return (
              <li key={punkt.titel} className="min-w-0">
                <Symbol className="mb-3 h-6 w-6 text-brand-600" aria-hidden="true" />
                <h3 className="font-semibold">{punkt.titel}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-800">{punkt.text}</p>
              </li>
            )
          })}
        </ul>
        <Link
          href="/privacy"
          className="mt-4 inline-flex min-h-11 items-center rounded-lg text-sm font-semibold underline decoration-brand-800/30 underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/25"
        >
          Mehr zum Datenschutz
        </Link>
        <div id="pro" className="mt-8 scroll-mt-28 border-t border-line-200 pt-8 sm:mt-10 sm:pt-10">
          <h2 id="fragen-titel" className="text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">Gut zu wissen, bevor es losgeht.</h2>
          <div className="mt-5 divide-y divide-line-200" aria-labelledby="fragen-titel">
            {HOMEPAGE_FAQ.map((eintrag) => (
              <details key={eintrag.frage} className="group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-4 font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/25 [&::-webkit-details-marker]:hidden">
                  {eintrag.frage}
                  <ChevronDown className="h-5 w-5 shrink-0 motion-safe:transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="max-w-3xl pb-5 pr-4 text-sm leading-7 text-ink-800">{eintrag.antwort}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
