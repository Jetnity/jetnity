import { Bed, Compass, Plane, Route, TrainFront } from 'lucide-react'

import { HOMEPAGE_UEBERSCHRIFTEN, HOMEPAGE_WERKZEUGE } from '@/lib/seo/final-homepage'

const SYMBOLE = [Route, Plane, Bed, Compass, TrainFront]

export function HomeWerkzeuge() {
  return (
    <section className="mx-auto max-w-[1450px] px-5 pb-12 sm:px-8 sm:pb-16" aria-labelledby="werkzeuge-titel">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Alles verbunden</p>
        <h2 id="werkzeuge-titel" className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl">
          {HOMEPAGE_UEBERSCHRIFTEN.werkzeuge}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink-800">
          Ein Flug bestimmt deine Ankunft. Die Lage deines Hotels beeinflusst deine Wege. Jetnity stimmt die Teile aufeinander ab.
        </p>
      </div>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {HOMEPAGE_WERKZEUGE.map((werkzeug, index) => {
          const Symbol = SYMBOLE[index]!
          return (
            <li key={werkzeug.titel} className="flex min-w-0 gap-3 border-t border-line-200 py-5 sm:block">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-100 text-brand-800">
                <Symbol className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 sm:mt-3">
                <h3 className="text-lg font-semibold tracking-[-0.025em]">{werkzeug.titel}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-800">{werkzeug.text}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
