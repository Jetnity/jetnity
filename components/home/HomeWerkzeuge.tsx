import { Bed, Compass, Plane, Route, TrainFront, type LucideIcon } from 'lucide-react'

import { Faehigkeitskennzeichen } from '@/components/home/Faehigkeitskennzeichen'
import { HOMEPAGE_UEBERSCHRIFTEN, HOMEPAGE_WERKZEUGE } from '@/lib/seo/final-homepage'

const IKONEN: Record<(typeof HOMEPAGE_WERKZEUGE)[number]['titel'], LucideIcon> = {
  Reiseplan: Route,
  Flüge: Plane,
  Unterkunft: Bed,
  Aktivitäten: Compass,
  Mobilität: TrainFront,
}

export function HomeWerkzeuge() {
  return (
    <section className="mx-auto max-w-[1450px] px-3 py-12 sm:px-5 sm:py-20" aria-labelledby="werkzeuge-titel">
      <div className="max-w-3xl px-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Zusammenhang</p>
        <h2
          id="werkzeuge-titel"
          className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl"
        >
          {HOMEPAGE_UEBERSCHRIFTEN.werkzeuge}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink-800">
          Flug, Unterkunft, Aktivitäten, Mobilität und der Reiseplan gehören zu derselben Reise. Du hältst
          sie nicht in fünf getrennten Tools nebeneinander.
        </p>
      </div>

      <div className="mt-8 overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_rgba(15,46,42,0.06)] sm:rounded-[36px] lg:grid lg:grid-cols-[minmax(16rem,0.78fr)_minmax(0,1.22fr)]">
        <div className="relative bg-brand-800 px-6 py-8 text-white sm:px-8 sm:py-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-citrus-400">Eine Reise</p>
            <p className="mt-3 max-w-xs text-2xl font-semibold tracking-[-0.04em] text-balance sm:text-3xl">
              Alles bleibt an derselben Reise.
            </p>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-6 text-ink-300 lg:mt-8">
            Reiseplan, Flüge, Unterkunft, Aktivitäten und Mobilität.
          </p>
          <span
            className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 rounded-full border-4 border-white bg-citrus-400 lg:block"
            aria-hidden="true"
          />
        </div>

        <div className="relative px-4 py-5 sm:px-8 sm:py-8">
          <span className="absolute bottom-8 left-[1.35rem] top-8 w-px bg-brand-800/15" aria-hidden="true" />
          <ul>
            {HOMEPAGE_WERKZEUGE.map((werkzeug) => {
              const Icon = IKONEN[werkzeug.titel]
              return (
                <li key={werkzeug.titel} className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3 py-3 sm:grid-cols-[3.25rem_minmax(0,1fr)] sm:gap-4">
                  <span className="relative z-10 flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-100 text-brand-800">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="text-base font-semibold tracking-[-0.02em]">{werkzeug.titel}</h3>
                      <Faehigkeitskennzeichen kennzeichnung={werkzeug.kennzeichnung} />
                    </div>
                    <p className="mt-1 text-sm leading-6 text-ink-800">{werkzeug.text}</p>
                  </div>
                </li>
              )
            })}
            <li className="relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3 py-3 sm:grid-cols-[3.25rem_minmax(0,1fr)] sm:gap-4">
              <span className="relative z-10 mt-0.5 h-11 w-11 rounded-2xl border border-dashed border-line-400 bg-white" aria-hidden="true" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h3 className="text-base font-semibold tracking-[-0.02em]">
                    Eine Änderung kann andere Bereiche betreffen.
                  </h3>
                  <Faehigkeitskennzeichen kennzeichnung="Produktvorschau" />
                </div>
                <p className="mt-1 text-sm leading-6 text-ink-800">
                  Wenn sich die Route ändert, können Unterkunft, Wege und Tagesplan mitbetroffen sein. Das zeigt
                  Jetnity hier als Richtung. Eine automatische Umsetzung mit echten Anbieterdaten ist in
                  Vorbereitung.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </section>
  )
}
