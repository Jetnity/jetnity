import { Bed, Compass, Plane, Route, TrainFront } from 'lucide-react'

import { HOMEPAGE_UEBERSCHRIFTEN, HOMEPAGE_WERKZEUGE } from '@/lib/seo/final-homepage'

const SYMBOLE = [Route, Plane, Bed, Compass, TrainFront]

/** Vierte Karte des Raster in «Jetnity sieht, was zusammengehört»; eigener Abschnitt mit eigener H2. */
export function HomeWerkzeuge() {
  return (
    <section
      className="hs-karte p-5 sm:p-8 md:col-span-2 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-10 lg:col-span-7"
      aria-labelledby="werkzeuge-titel"
    >
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Alles verbunden</p>
        <h2 id="werkzeuge-titel" className="mt-3 text-3xl font-semibold leading-[1.1] tracking-[-0.045em] text-balance sm:text-4xl">
          {HOMEPAGE_UEBERSCHRIFTEN.werkzeuge}
        </h2>
        <p className="mt-4 max-w-prose text-base leading-7 text-ink-800">
          Ein Flug bestimmt deine Ankunft. Die Lage deines Hotels beeinflusst deine Wege. Jetnity stimmt die Teile aufeinander ab.
        </p>
      </div>
      <ul className="hs-kette mt-6 md:mt-0">
        {HOMEPAGE_WERKZEUGE.map((werkzeug, index) => {
          const Symbol = SYMBOLE[index]!
          return (
            <li key={werkzeug.titel}>
              <span className="hs-knoten">
                <Symbol className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 self-center">
                <h3 className="text-lg font-semibold tracking-[-0.025em]">{werkzeug.titel}</h3>
                <p className="mt-0.5 text-sm leading-6 text-ink-800">{werkzeug.text}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
