'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { useState } from 'react'

import {
  WORLD_MAP_OHNE_KOORDINATEN_TEXT,
  WORLD_MAP_OHNE_LAND_TEXT,
  WORLD_MAP_VIEWBOX,
  weltOrtDomId,
  type WorldMapAbleitung,
  type WorldMapOrt,
} from '@/lib/account/world-map'
import { WORLD_MAP_LAND_PFADE } from '@/lib/account/world-map-land'

function markerLinks(ort: WorldMapOrt): number {
  if (ort.x === null) return 0
  return (ort.x / WORLD_MAP_VIEWBOX.width) * 100
}

function markerOben(ort: WorldMapOrt): number {
  if (ort.y === null) return 0
  return (ort.y / WORLD_MAP_VIEWBOX.height) * 100
}

function herkunftText(ort: WorldMapOrt): string {
  const titel = [...new Set(ort.herkuenfte.map((eintrag) => eintrag.tripTitle))]
  if (titel.length === 1) return titel[0] ?? ''
  return titel.join(' · ')
}

export default function AccountWeltKarte({ welt }: { welt: WorldMapAbleitung }) {
  const [gewaehlt, setGewaehlt] = useState<string | null>(null)

  return (
    <section
      aria-labelledby="account-welt-titel"
      data-world-map="ein"
      data-world-map-lage={welt.lage}
      data-world-map-visited={welt.besuchtLage}
      data-world-map-search="nein"
      className="mt-8 rounded-[30px] border border-black/5 bg-white p-6 shadow-[0_16px_50px_rgba(15,46,42,0.06)] sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Deine Reisen im Überblick</p>
      <h2 id="account-welt-titel" className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-3xl">
        {welt.titel}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-700">{welt.unterscheidung}</p>

      {welt.lage === 'fehler' ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm leading-6 text-red-800"
        >
          {welt.fehlerText}
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-line-200 bg-surface-25 px-4 py-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">{welt.geplantLabel}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-800">{welt.zusammenfassung}</p>
              <p className="mt-1 text-sm leading-6 text-ink-700">{welt.laenderText}</p>
            </div>
            <div className="rounded-2xl border border-line-200 bg-surface-25 px-4 py-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">{welt.besuchtLabel}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-800">{welt.besuchtText}</p>
            </div>
          </div>

          <div className="mt-6 overflow-x-hidden">
            <div className="w-full rounded-[24px] bg-surface-50 p-5 sm:p-6">
              <div className="relative w-full">
                <svg
                  viewBox={`0 0 ${WORLD_MAP_VIEWBOX.width} ${WORLD_MAP_VIEWBOX.height}`}
                  role="img"
                  aria-labelledby="account-welt-karte-titel account-welt-karte-desc"
                  className="block h-auto w-full"
                >
                  <title id="account-welt-karte-titel">{welt.titel}</title>
                  <desc id="account-welt-karte-desc">
                    {welt.lage === 'leer'
                      ? welt.leerText
                      : `${welt.zusammenfassung} ${welt.laenderText}`}
                  </desc>
                  {WORLD_MAP_LAND_PFADE.map((pfad) => (
                    <path
                      key={pfad}
                      d={pfad}
                      className="fill-brand-800/15 stroke-brand-800/25"
                      strokeWidth="0.4"
                      strokeLinejoin="round"
                    />
                  ))}
                </svg>
                {welt.orte
                  .filter((ort) => ort.geplottet)
                  .map((ort) => (
                    <button
                      key={ort.schluessel}
                      type="button"
                      aria-label={`${ort.name}, ${welt.geplantLabel}`}
                      aria-current={gewaehlt === ort.schluessel ? 'true' : undefined}
                      aria-controls={weltOrtDomId(ort.schluessel)}
                      onClick={() => {
                        setGewaehlt(ort.schluessel)
                        document.getElementById(weltOrtDomId(ort.schluessel))?.scrollIntoView({
                          block: 'nearest',
                          behavior: 'smooth',
                        })
                      }}
                      className="absolute flex min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/20"
                      style={{ left: `${markerLinks(ort)}%`, top: `${markerOben(ort)}%` }}
                    >
                      <span
                        className={
                          gewaehlt === ort.schluessel
                            ? 'block h-3 w-3 rounded-full bg-brand-800 ring-2 ring-citrus-400'
                            : 'block h-2.5 w-2.5 rounded-full bg-brand-800 ring-2 ring-white'
                        }
                      />
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {welt.lage === 'leer' ? (
            <p className="mt-5 text-sm leading-6 text-ink-700">{welt.leerText}</p>
          ) : (
            <ol className="mt-5 grid gap-3">
              {welt.orte.map((ort) => (
                <li key={ort.schluessel} id={weltOrtDomId(ort.schluessel)}>
                  <article
                    className={
                      gewaehlt === ort.schluessel
                        ? 'rounded-2xl border border-brand-600 bg-surface-50 px-4 py-3'
                        : 'rounded-2xl border border-line-200 bg-surface-0 px-4 py-3'
                    }
                  >
                    <button
                      type="button"
                      className="flex min-h-11 w-full flex-col items-start justify-center text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                      onClick={() => setGewaehlt(ort.schluessel)}
                    >
                      <h3 className="text-sm font-semibold text-brand-800">{ort.name}</h3>
                      <p className="mt-1 text-sm leading-6 text-ink-700">
                        {ort.countryLabel ?? WORLD_MAP_OHNE_LAND_TEXT}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-ink-800">
                        {welt.geplantLabel} in {herkunftText(ort)}
                      </p>
                      {ort.geplottet ? null : (
                        <p className="mt-1 text-sm leading-6 text-ink-700">{WORLD_MAP_OHNE_KOORDINATEN_TEXT}</p>
                      )}
                    </button>
                    {ort.herkuenfte[0] ? (
                      <Link
                        href={`/reisen/${ort.herkuenfte[0].tripId}` as Route}
                        className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-brand-800 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                      >
                        Reise öffnen
                      </Link>
                    ) : null}
                  </article>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </section>
  )
}
