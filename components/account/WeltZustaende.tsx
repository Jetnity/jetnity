'use client'

// Die sichtbare Sprache der Länderzustände auf der Account-Weltkarte.
//
// Ein Zustand wird nie allein über die Farbe getragen. Jeder Zustand hat eine
// eigene Füllung *und* eine eigene Textur *und* ein Wort:
//
//   besucht         volle Fläche, keine Schraffur
//   geplant         helle Fläche mit Schraffur
//   besucht+geplant volle Fläche mit derselben Schraffur darüber
//
// Der überlagerte Zustand ist damit buchstäblich die Summe der beiden anderen
// und keine dritte Farbe, die man erst lernen müsste. Wer Grüntöne nicht
// unterscheidet, sieht die Schraffur; wer nichts sieht, liest die Länderliste.
//
// Die Grenzlinien der Grundkarte werden nach diesen Flächen gezeichnet und
// bleiben deshalb unter jeder Füllung lesbar.

import { useId } from 'react'

import { weltPunktLage } from '@/lib/account/world-map-ansicht'
import {
  WELT_ZUSTAND_TEXT,
  type WeltLandFlaeche,
  type WeltLandZustand,
} from '@/lib/account/welt-laender'

/** Flächenfüllung je Zustand. Die Schraffur kommt als zweite Ebene darüber. */
const FUELLUNG: Readonly<Record<WeltLandZustand, string>> = {
  besucht: 'fill-brand-800/45',
  geplant: 'fill-brand-600/10',
  beides: 'fill-brand-800/45',
}

const MIT_SCHRAFFUR: Readonly<Record<WeltLandZustand, boolean>> = {
  besucht: false,
  geplant: true,
  beides: true,
}

/** Umrisse der Länder, die einen Zustand tragen. */
const UMRISS: Readonly<Record<WeltLandZustand, string>> = {
  besucht: 'stroke-brand-900/75',
  geplant: 'stroke-brand-800/60',
  beides: 'stroke-brand-900/85',
}

export function weltMusterId(basis: string): string {
  return `${basis}-geplant-schraffur`
}

/**
 * Definition der Schraffur. Die Musterweite steht in Projektionsgrad, damit sie
 * bei jeder Kartenbreite denselben Anteil der Fläche bedeckt.
 */
export function WeltMusterDefs({ id }: { id: string }) {
  return (
    <defs>
      <pattern
        id={weltMusterId(id)}
        width="4"
        height="4"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <line x1="0" y1="0" x2="0" y2="4" className="stroke-brand-900/55" strokeWidth="1.3" />
      </pattern>
    </defs>
  )
}

/**
 * Form der Ersatzmarke je Zustand.
 *
 * Fläche und Schraffur stehen für ein Land, das kleiner als ein Strich ist,
 * nicht zur Verfügung – es bleibt ein Punkt. Damit die drei Zustände trotzdem
 * ohne Farbe und ohne Deckkraft unterscheidbar sind, unterscheidet sich die
 * *Form*, und zwar nach derselben Logik wie bei den Flächen: der überlagerte
 * Zustand ist die Summe der beiden anderen.
 *
 *   besucht  ein geschlossener Ring        (wie die volle Fläche)
 *   geplant  ein gestrichelter Ring        (wie die Schraffur)
 *   beides   beide Ringe, ineinander       (wie Fläche mit Schraffur)
 */
const MARKE: Readonly<Record<WeltLandZustand, 'ring' | 'ring-gestrichelt' | 'doppelring'>> = {
  besucht: 'ring',
  geplant: 'ring-gestrichelt',
  beides: 'doppelring',
}

/** Randfarbe je Zustand, passend zum Umriss der Flächen. */
const MARKE_RAND: Readonly<Record<WeltLandZustand, string>> = {
  besucht: 'border-brand-900/80',
  geplant: 'border-brand-800/70',
  beides: 'border-brand-900/85',
}

/**
 * Die Ersatzmarken liegen über der Karte, nicht in ihr.
 *
 * Der Grund ist eine Messung: in der Kartengrafik skaliert ein Radius mit der
 * Kartenbreite, die Ortsmarken darüber sind dagegen in Bildpunkten gesetzt und
 * bleiben gleich gross. Auf 390 Pixel Breite verschwand der Ring eines
 * geplanten Kleinstaats deshalb vollständig unter dem Punkt derselben Reise –
 * die Form war im Baum vorhanden und im Bild nicht zu sehen.
 *
 * In dieser Ebene hat die Marke auf jeder Breite dieselbe Grösse, und weil sie
 * vor den Ortsmarken steht, liegt sie unter ihnen: der Ring umschliesst den
 * Punkt, statt mit ihm zu ringen.
 */
export function WeltPunktMarken({ flaechen }: { flaechen: readonly WeltLandFlaeche[] }) {
  const marken = flaechen.flatMap((flaeche) => {
    if (flaeche.punkt === null) return []
    const lage = weltPunktLage(flaeche.punkt.x, flaeche.punkt.y)
    return lage ? [{ flaeche, lage }] : []
  })

  if (marken.length === 0) return null

  return (
    <>
      {marken.map(({ flaeche, lage }) => (
        <span
          key={`punkt-${flaeche.code}`}
          aria-hidden="true"
          data-welt-land={flaeche.code}
          data-welt-land-zustand={flaeche.zustand}
          data-welt-land-marke={MARKE[flaeche.zustand]}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${lage.links}%`, top: `${lage.oben}%` }}
        >
          <span
            className={`block h-8 w-8 rounded-full border-[3px] ${MARKE_RAND[flaeche.zustand]} ${
              flaeche.zustand === 'geplant' ? 'border-dashed' : 'border-solid'
            }`}
          />
          {flaeche.zustand === 'beides' ? (
            <span
              className={`absolute left-1/2 top-1/2 block h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed ${
                MARKE_RAND[flaeche.zustand]
              }`}
            />
          ) : null}
        </span>
      ))}
    </>
  )
}

/**
 * Die eingefärbten Länder.
 *
 * Länder ohne Zustand kommen hier nicht vor: sie bleiben die neutrale
 * Grundkarte, und neutral heisst „hierüber liegt keine Aussage vor“.
 */
export function WeltFuellungen({
  id,
  flaechen,
}: {
  id: string
  flaechen: readonly WeltLandFlaeche[]
}) {
  const mitFlaeche = flaechen.filter(
    (flaeche): flaeche is WeltLandFlaeche & { pfad: string } => flaeche.pfad !== null,
  )
  return (
    <g aria-hidden="true" data-welt-zustaende={flaechen.length}>
      {mitFlaeche.map((flaeche) => (
        <path
          key={`fuellung-${flaeche.code}`}
          d={flaeche.pfad}
          fillRule="evenodd"
          data-welt-land={flaeche.code}
          data-welt-land-zustand={flaeche.zustand}
          className={FUELLUNG[flaeche.zustand]}
        />
      ))}
      {mitFlaeche
        .filter((flaeche) => MIT_SCHRAFFUR[flaeche.zustand])
        .map((flaeche) => (
          <path
            key={`schraffur-${flaeche.code}`}
            d={flaeche.pfad}
            fillRule="evenodd"
            fill={`url(#${weltMusterId(id)})`}
          />
        ))}
      {mitFlaeche.map((flaeche) => (
        <path
          key={`umriss-${flaeche.code}`}
          d={flaeche.pfad}
          fill="none"
          className={`${UMRISS[flaeche.zustand]} [vector-effect:non-scaling-stroke]`}
          strokeWidth="1"
          strokeLinejoin="round"
        />
      ))}
    </g>
  )
}

/**
 * Dieselbe Behandlung wie auf der Karte, klein genug für Legende und Liste.
 *
 * `alsPunkt` zeigt die Ersatzmarke statt der Fläche. Ein Land, das auf der
 * Karte ein Ring ist, soll in der Liste nicht als gefülltes Quadrat stehen –
 * sonst sucht man auf der Karte nach einer Fläche, die es dort nicht gibt.
 */
export function WeltZustandProbe({
  zustand,
  alsPunkt = false,
}: {
  zustand: WeltLandZustand
  alsPunkt?: boolean
}) {
  // Eigene Id je Probe: dieselbe Probe steht in der Legende und in jeder Zeile
  // der Länderliste, und zwei gleiche Ids im Dokument sind kein gültiges HTML.
  const musterId = `${useId()}-probe`

  return (
    <span aria-hidden="true" className="relative flex h-5 w-5 shrink-0 items-center justify-center">
      <svg viewBox="0 0 16 16" className="h-4 w-4">
        <defs>
          <pattern
            id={musterId}
            width="4"
            height="4"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="4" className="stroke-brand-900/55" strokeWidth="1.6" />
          </pattern>
        </defs>
        {alsPunkt ? (
          <g data-welt-probe-marke={MARKE[zustand]}>
            {zustand === 'geplant' ? (
              <circle
                cx="8"
                cy="8"
                r="3.6"
                fill="none"
                strokeWidth="1.8"
                strokeDasharray="2.6 2.2"
                strokeLinecap="round"
                className={UMRISS[zustand]}
              />
            ) : (
              <circle cx="8" cy="8" r="3.6" fill="none" strokeWidth="2.4" className={UMRISS[zustand]} />
            )}
            {zustand === 'beides' ? (
              <circle
                cx="8"
                cy="8"
                r="6.6"
                fill="none"
                strokeWidth="1.6"
                strokeDasharray="2.6 2.2"
                strokeLinecap="round"
                className={UMRISS[zustand]}
              />
            ) : null}
          </g>
        ) : (
          <>
            <rect x="1" y="1" width="14" height="14" rx="3" className={FUELLUNG[zustand]} />
            {MIT_SCHRAFFUR[zustand] ? (
              <rect x="1" y="1" width="14" height="14" rx="3" fill={`url(#${musterId})`} />
            ) : null}
            <rect
              x="1"
              y="1"
              width="14"
              height="14"
              rx="3"
              fill="none"
              strokeWidth="1.5"
              className={UMRISS[zustand]}
            />
          </>
        )}
      </svg>
    </span>
  )
}

/**
 * Die Zustände als Text.
 *
 * Diese Liste ist kein Beiwerk zur Karte, sondern ihr gleichwertiger Zwilling:
 * sie trägt dieselbe Aussage ohne Farbe, ohne Fläche und ohne Zeigegerät.
 */
export function WeltLaenderListe({ flaechen }: { flaechen: readonly WeltLandFlaeche[] }) {
  if (flaechen.length === 0) return null

  return (
    <ul data-welt-laender-liste={flaechen.length} className="mt-3 flex flex-wrap gap-1.5">
      {flaechen.map((flaeche) => (
        <li key={flaeche.code} className="min-w-0">
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-line-200 bg-surface-0 py-1 pl-1.5 pr-2.5">
            <WeltZustandProbe zustand={flaeche.zustand} alsPunkt={flaeche.punkt !== null} />
            <span className="min-w-0 break-words text-xs leading-5 text-brand-800">
              <span className="font-semibold">{flaeche.label}</span>
              <span className="text-ink-700"> · {WELT_ZUSTAND_TEXT[flaeche.zustand]}</span>
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
}
