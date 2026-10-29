'use client'

// components/trips/DiscoverCarsWidgetOptin.tsx
//
// Inertes Gehäuse für ein offizielles DiscoverCars-Suchwidget.
// Normal bleibt es ohne Ladeknopf: der Konto-Export fehlt, und ein Klick
// wäre keine Einwilligung. Die Prüfnaht zeigt nur eine lokale Textseite.

import * as React from 'react'

import { ORGANISIEREN_FLAECHE_KLASSE } from '@/lib/trips/organize-premium-experience-6'
import {
  WIDGET_FIXTURE_TEXT,
  WIDGET_QUELLENSTATUS,
  widgetAnfang,
  widgetAnsicht,
  widgetDarfAusfuehren,
  widgetPruefnaht,
  type WidgetAnsicht,
} from '@/lib/providers/discovercars/widget/vertrag'

const AKTION_KLASSE =
  'inline-flex min-h-11 w-full min-w-0 max-w-full items-center justify-center rounded-full border border-brand-800 bg-white px-5 py-2 text-center text-sm font-semibold leading-5 text-brand-800 break-words transition hover:bg-surface-25 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:pointer-events-none disabled:opacity-60 sm:w-auto'

type Laden = (lauf: number) => Promise<'fixture' | 'fehler'>

function sichtbarAus(
  zustand: { reiseId: string; naht: boolean; ansicht: WidgetAnsicht },
  reiseId: string,
  naht: boolean,
): WidgetAnsicht {
  if (zustand.reiseId === reiseId && zustand.naht === naht) return zustand.ansicht
  return widgetAnfang(naht, reiseId)
}

export default function DiscoverCarsWidgetOptin({
  reiseId,
  pruefnaht,
  laden,
}: {
  /** Nur zum Zurücksetzen. Steht nicht im Markup und in keiner Adresse. */
  reiseId: string
  /** Lokale Prüfnaht. Mietwagen setzt sie nicht. */
  pruefnaht?: unknown
  /** Nur mit Prüfnaht. Rückgabe ausser "fixture" gilt als Fehler. Keine Adresse. */
  laden?: Laden
}) {
  const naht = widgetPruefnaht(pruefnaht) && widgetDarfAusfuehren() === false
  const [zustand, setZustand] = React.useState(() => ({
    reiseId,
    naht,
    ansicht: widgetAnfang(naht, reiseId),
  }))
  const sperre = React.useRef(false)
  const ladenKnopf = React.useRef<HTMLButtonElement | null>(null)
  const schliessenKnopf = React.useRef<HTMLButtonElement | null>(null)
  const fokusZiel = React.useRef<'laden' | 'schliessen' | null>(null)

  if (zustand.reiseId !== reiseId || zustand.naht !== naht) {
    setZustand({
      reiseId,
      naht,
      ansicht: widgetAnsicht(zustand.ansicht, { art: 'setzen', naht, reiseId }),
    })
  }

  React.useEffect(() => {
    sperre.current = false
  }, [reiseId, naht])

  const ansicht = sichtbarAus(zustand, reiseId, naht)

  React.useEffect(() => {
    const ziel = fokusZiel.current
    if (!ziel) return
    fokusZiel.current = null
    const knopf = ziel === 'laden' ? ladenKnopf.current : schliessenKnopf.current
    knopf?.focus()
  }, [ansicht.art])

  const starten = (neu: boolean) => {
    if (!naht || sperre.current) return
    const ereignis = neu ? ({ art: 'klick' } as const) : ({ art: 'erneut' } as const)
    const naechste = widgetAnsicht(ansicht, ereignis)
    if (naechste.art !== 'laedt') return
    sperre.current = true
    const erwartet = naechste.lauf
    const erwartetReise = naechste.reiseId
    setZustand({ reiseId, naht, ansicht: naechste })
    const arbeit = laden ? laden(erwartet) : Promise.resolve('fixture' as const)
    void Promise.resolve(arbeit)
      .then((wert) => (wert === 'fixture' ? 'fixture' : 'fehler'))
      .catch(() => 'fehler' as const)
      .then((wert) => {
        sperre.current = false
        fokusZiel.current = wert === 'fixture' ? 'schliessen' : 'laden'
        setZustand((aktuell) => ({
          ...aktuell,
          ansicht: widgetAnsicht(
            aktuell.ansicht,
            wert === 'fixture'
              ? { art: 'fertig', lauf: erwartet, reiseId: erwartetReise }
              : { art: 'fehlschlag', lauf: erwartet, reiseId: erwartetReise },
          ),
        }))
      })
  }

  const schliessen = () => {
    const naechste = widgetAnsicht(ansicht, { art: 'schliessen' })
    if (naechste.art !== 'bereit') return
    fokusZiel.current = 'laden'
    setZustand({ reiseId, naht, ansicht: naechste })
  }

  return (
    <section
      aria-label="DiscoverCars Suchwidget, nicht geladen"
      aria-busy={ansicht.art === 'laedt'}
      data-discovercars-widget={naht ? 'pruefnaht' : 'inert'}
      data-discovercars-quelle={WIDGET_QUELLENSTATUS}
      className={`${ORGANISIEREN_FLAECHE_KLASSE} max-w-full`}
      onKeyDown={(ereignis) => {
        if (ereignis.key !== 'Escape' || ansicht.art !== 'fixture') return
        ereignis.preventDefault()
        schliessen()
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600 break-words">
        DiscoverCars
      </p>
      <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-brand-800 break-words sm:text-2xl">
        Suchwidget
      </h2>
      <div id="discovercars-widget-erklaerung" className="mt-4 grid gap-3 text-sm leading-6 text-ink-800">
        <p>
          Eine eingebettete Mietwagensuche von DiscoverCars ist hier nicht aktiv. Jetnity lädt
          dafür kein Skript und übernimmt keine Reisedaten.
        </p>
        <p>
          Fahrzeuge, Bilder, Preise und Verfügbarkeit bleiben bei DiscoverCars und erscheinen
          nicht in Jetnity. Die Links darunter öffnen DiscoverCars. Abholung, Rückgabe und
          Mietdauer wählst du dort.
        </p>
        {naht ? (
          <p data-discovercars-widget-hinweis="pruefnaht">
            Lokale Prüfseite. Kein DiscoverCars-Inhalt und kein Anbieteraufruf.
          </p>
        ) : null}
      </div>

      {ansicht.art === 'laedt' ? (
        <p role="status" className="mt-4 text-sm leading-6 text-ink-800">
          Die lokale Prüfseite wird vorbereitet.
        </p>
      ) : null}

      {ansicht.art === 'fehler' ? (
        <p role="alert" data-discovercars-widget-fehler="1" className="mt-4 rounded-2xl bg-surface-25 px-4 py-3 text-sm leading-6 text-ink-800 break-words">
          Die lokale Prüfseite ist nicht erschienen. Die DiscoverCars-Links bleiben nutzbar.
        </p>
      ) : null}

      {ansicht.art === 'fixture' ? (
        <div
          role="status"
          tabIndex={-1}
          data-discovercars-widget-fixture="synthetisch"
          className="mt-4 min-w-0 rounded-2xl bg-surface-25 px-4 py-3 text-sm leading-6 text-ink-800 break-words outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
        >
          {WIDGET_FIXTURE_TEXT}
        </div>
      ) : null}

      {ansicht.art === 'bereit' || ansicht.art === 'laedt' ? (
        <button
          ref={ladenKnopf}
          type="button"
          className={`${AKTION_KLASSE} mt-4`}
          disabled={ansicht.art === 'laedt'}
          aria-describedby="discovercars-widget-erklaerung"
          onClick={() => starten(true)}
        >
          Mietwagensuche bei DiscoverCars laden
        </button>
      ) : null}

      {ansicht.art === 'fehler' ? (
        <button
          ref={ladenKnopf}
          type="button"
          className={`${AKTION_KLASSE} mt-4`}
          aria-describedby="discovercars-widget-erklaerung"
          onClick={() => starten(false)}
        >
          Erneut versuchen
        </button>
      ) : null}

      {ansicht.art === 'fixture' ? (
        <button
          ref={schliessenKnopf}
          type="button"
          className={`${AKTION_KLASSE} mt-4`}
          onClick={schliessen}
        >
          Prüfseite schließen
        </button>
      ) : null}
    </section>
  )
}
