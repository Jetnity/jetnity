'use client'

// components/trips/DiscoverCarsAffiliateLinks.tsx
//
// Opt-in-Link zu DiscoverCars. Die Adresse kommt nur aus den geprüften
// Konstanten. Ein Klick verlässt Jetnity. Vorher wird nichts geladen.

import * as React from 'react'

import {
  DISCOVERCARS_BKK_STATION,
  discoverCarsAffiliateZiel,
  discoverCarsIstBkkStation,
  discoverCarsMehrereStationen,
  type DiscoverCarsBkkStation,
} from '@/lib/providers/discovercars/affiliate/ziel'
import { ORGANISIEREN_FLAECHE_KLASSE } from '@/lib/trips/organize-premium-experience-6'

const LINK_KLASSE =
  'inline-flex min-h-11 w-full min-w-0 max-w-full items-center justify-center rounded-full border border-brand-800 bg-white px-5 py-2 text-center text-sm font-semibold leading-5 text-brand-800 break-words transition hover:bg-surface-25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 sm:w-auto'

const WAHL_KLASSE =
  'flex min-h-11 w-full min-w-0 items-center gap-3 rounded-2xl border border-line-200 bg-white px-3 py-2 text-sm leading-5 text-brand-800 break-words focus-within:ring-4 focus-within:ring-brand-600/15'

function anfangsStation(wert: unknown): DiscoverCarsBkkStation | null {
  return discoverCarsIstBkkStation(wert) ? DISCOVERCARS_BKK_STATION : null
}

export default function DiscoverCarsAffiliateLinks({
  reiseId,
  stationen,
  gewaehlteStation = null,
}: {
  /** Nur zum Zurücksetzen der Wahl. Steht nicht in der Adresse und nicht im Markup. */
  reiseId: string
  /** Anzahl der Etappen, nur für den Hinweis bei mehreren Stationen. */
  stationen: number
  /**
   * Bereits getroffene eigene Stationswahl. Mietwagen übergibt das nicht.
   * Alles ausser der geprüften BKK-Identität bleibt die allgemeine Suche.
   */
  gewaehlteStation?: unknown
}) {
  const [merke, setMerke] = React.useState(() => ({
    reiseId,
    station: anfangsStation(gewaehlteStation),
  }))
  if (merke.reiseId !== reiseId) {
    setMerke({ reiseId, station: null })
  }
  const station = merke.reiseId === reiseId ? merke.station : null
  const ziel = discoverCarsAffiliateZiel({
    ausdruecklich: station !== null,
    station,
  })
  const mehrere = discoverCarsMehrereStationen(stationen)

  return (
    <section
      aria-label="DiscoverCars, externer Mietwagen-Link"
      data-discovercars-affiliate="1"
      data-discovercars-art={ziel.art}
      data-organisieren-flaeche="affiliate"
      className={ORGANISIEREN_FLAECHE_KLASSE}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
        Affiliate-Link
      </p>
      <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800 break-words sm:text-2xl">
        Mietwagen bei DiscoverCars
      </h2>
      <div className="mt-4 grid gap-3 text-sm leading-6 text-ink-800">
        <p id="discovercars-erklaerung">
          Vergleiche und suche Mietwagen bei DiscoverCars. Abholung, Rückgabe und Mietdauer wählst
          du dort. Preise, Verfügbarkeit und Buchung bestätigt DiscoverCars.
        </p>
        {mehrere ? (
          <p data-discovercars-hinweis="mehrere-stationen">
            Mehrere Stationen ändern daran nichts.
          </p>
        ) : null}
        {ziel.art === 'bkk' ? (
          <p data-discovercars-hinweis="bkk">
            Suvarnabhumi (BKK) ist vorausgewählt. Datum und Mietdauer trägst du dort ein. CHF ist
            die Voreinstellung dieser Seite, kein bestätigter Preis und nicht die Währung deiner
            Reise.
          </p>
        ) : null}
      </div>

      <fieldset className="mt-4 grid min-w-0 gap-2">
        <legend className="text-sm font-semibold text-brand-800">Abholung</legend>
        <label className={WAHL_KLASSE}>
          <input
            className="h-5 w-5 shrink-0 accent-brand-800"
            type="radio"
            name="discovercars-abholstation"
            checked={ziel.art === 'generisch'}
            aria-describedby="discovercars-erklaerung"
            onChange={() => setMerke({ reiseId, station: null })}
          />
          <span>Abholort bei DiscoverCars wählen</span>
        </label>
        <label className={WAHL_KLASSE}>
          <input
            className="h-5 w-5 shrink-0 accent-brand-800"
            type="radio"
            name="discovercars-abholstation"
            checked={ziel.art === 'bkk'}
            aria-describedby="discovercars-erklaerung"
            onChange={() => setMerke({ reiseId, station: DISCOVERCARS_BKK_STATION })}
          />
          <span>Flughafen Suvarnabhumi (BKK)</span>
        </label>
      </fieldset>

      <a
        className={`${LINK_KLASSE} mt-4`}
        href={ziel.href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        referrerPolicy="no-referrer"
        data-discovercars-href={ziel.art}
      >
        {ziel.art === 'bkk'
          ? 'Suvarnabhumi (BKK) bei DiscoverCars öffnen'
          : 'Bei DiscoverCars suchen'}
        <span className="sr-only">, öffnet in einem neuen Tab, Affiliate</span>
      </a>
    </section>
  )
}
