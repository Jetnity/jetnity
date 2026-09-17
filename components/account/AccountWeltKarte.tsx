'use client'

import type { Route } from 'next'
import Link from 'next/link'
import { ArrowUpRight, MapPin, MapPinOff } from 'lucide-react'
import { useCallback, useId, useMemo, useState } from 'react'

import {
  WeltFuellungen,
  WeltLaenderListe,
  WeltMusterDefs,
  WeltPunktMarken,
  WeltZustandProbe,
  weltMusterId,
} from '@/components/account/WeltZustaende'
import type { WeltBesuchtAnsicht } from '@/lib/account/welt-ansicht'
import { weltOhneFlaecheHinweis, type WeltLaenderAbleitung } from '@/lib/account/welt-laender'
import {
  WORLD_MAP_OHNE_KOORDINATEN_TEXT,
  WORLD_MAP_OHNE_LAND_TEXT,
  weltOrtDomId,
  type WorldMapAbleitung,
  type WorldMapOrt,
} from '@/lib/account/world-map'
import {
  WELT_KARTE_ZUSTAND_BESCHREIBUNG,
  WORLD_MAP_AUSSERHALB_RAHMEN_TEXT,
  WORLD_MAP_GRUNDKARTE_BESCHREIBUNG,
  WORLD_MAP_GRUNDKARTE_HINWEIS,
  WORLD_MAP_GRUPPE_FRAGE,
  WORLD_MAP_RAHMEN_VIEWBOX,
  weltKartenAnsicht,
  weltMarkerGruppeText,
  weltOrtReiseAnzeigen,
  type WorldMapAusrichtung,
  type WorldMapMarkerGruppe,
} from '@/lib/account/world-map-ansicht'
import {
  WORLD_MAP_GRENZ_PFADE,
  WORLD_MAP_LAND_PFADE,
  WORLD_MAP_SEE_PFADE,
} from '@/lib/account/world-map-geografie'

/**
 * Die Geometrie steht als ein Pfad je Ebene im Baum, nicht als ein Element je
 * Ring. Das sind drei Knoten statt siebenhundert; die Fuellregel `evenodd`
 * traegt dabei die Loecher, etwa das Kaspische Meer in Eurasien.
 */
const LAND_PFAD = WORLD_MAP_LAND_PFADE.join(' ')
const SEE_PFAD = WORLD_MAP_SEE_PFADE.join(' ')
const GRENZ_PFAD = WORLD_MAP_GRENZ_PFADE.join(' ')

const BESCHRIFTUNG_AUSRICHTUNG = {
  links: 'left-0 translate-x-0',
  mitte: 'left-1/2 -translate-x-1/2',
  rechts: 'right-0 translate-x-0',
} as const

const gruppenAuswahlId = 'account-welt-karte-auswahl'

function reduzierteBewegung(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Eine Kennzahl der Karte.
 *
 * Die Probe links zeigt dieselbe Füllung und dieselbe Schraffur wie die Karte,
 * das Wort daneben sagt dasselbe noch einmal. Der Wert steht als `N Länder ·
 * M Orte` – oder, wenn es nichts zu zählen gibt, als Satz statt als Null.
 */
function KennzahlZeile({
  zustand,
  label,
  wert,
}: {
  zustand: 'geplant' | 'besucht'
  label: string
  wert: string
}) {
  return (
    <li className="flex min-w-0 items-start gap-2" data-welt-kennzahl={zustand}>
      <WeltZustandProbe zustand={zustand} />
      <span className="min-w-0 text-sm leading-5">
        <span className="font-semibold text-brand-800">{label}:</span>
        <span className="text-ink-800"> {wert}</span>
      </span>
    </li>
  )
}

function MarkerPunkt({ gewaehlt, anzahl }: { gewaehlt: boolean; anzahl: number | null }) {
  return (
    <span aria-hidden="true" className="relative flex items-center justify-center">
      <span
        className={
          gewaehlt
            ? 'absolute h-9 w-9 rounded-full bg-citrus-400/55 ring-1 ring-brand-800/25'
            : 'absolute h-6 w-6 rounded-full bg-brand-800/0 transition-colors group-hover:bg-brand-800/15 motion-reduce:transition-none'
        }
      />
      {anzahl === null ? (
        <span
          className={
            gewaehlt
              ? 'relative block h-4 w-4 rounded-full bg-brand-900 ring-[3px] ring-citrus-400 shadow-[0_2px_6px_rgba(15,46,42,0.45)]'
              : 'relative block h-3 w-3 rounded-full bg-brand-800 ring-2 ring-white shadow-[0_1px_4px_rgba(15,46,42,0.4)]'
          }
        />
      ) : (
        <span
          className={`relative flex h-[18px] w-[18px] items-center justify-center rounded-full text-[10px] font-semibold leading-none shadow-[0_1px_4px_rgba(15,46,42,0.4)] ${
            gewaehlt
              ? 'bg-brand-900 text-citrus-400 ring-[3px] ring-citrus-400'
              : 'bg-brand-800 text-white ring-2 ring-white'
          }`}
        >
          {anzahl}
        </span>
      )}
    </span>
  )
}

function MarkerBeschriftung({
  text,
  unten,
  ausrichtung,
}: {
  text: string
  unten: boolean
  ausrichtung: WorldMapAusrichtung
}) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute max-w-[11rem] truncate rounded-full bg-brand-800 px-2 py-1 text-[11px] font-semibold leading-none text-white shadow-[0_4px_12px_rgba(15,46,42,0.25)] ${
        unten ? 'top-full mt-1' : 'bottom-full mb-1'
      } ${BESCHRIFTUNG_AUSRICHTUNG[ausrichtung]}`}
    >
      {text}
    </span>
  )
}

/**
 * Eine Trefferfläche je Kartenstelle.
 *
 * Liegen mehrere Orte so dicht zusammen, dass ihre Flächen sich überdecken
 * würden, öffnet die Fläche eine Auswahl. Sie entscheidet nicht selbst, welcher
 * Ort gemeint war, und legt die Orte auch nicht zusammen.
 */
function MarkerGruppe({
  gruppe,
  geplantLabel,
  gewaehlterOrt,
  offen,
  onOeffnen,
  onWaehlen,
}: {
  gruppe: WorldMapMarkerGruppe
  geplantLabel: string
  gewaehlterOrt: string | null
  offen: boolean
  onOeffnen: (schluessel: string | null) => void
  onWaehlen: (schluessel: string) => void
}) {
  const mehrere = gruppe.orte.length > 1
  const ort = gruppe.orte[0]
  if (!ort) return null
  const gewaehlt = gruppe.orte.some((eintrag) => eintrag.schluessel === gewaehlterOrt)
  const aktiverOrt = gruppe.orte.find((eintrag) => eintrag.schluessel === gewaehlterOrt) ?? ort

  return (
    <button
      type="button"
      data-world-map-marker={gruppe.schluessel}
      data-world-map-marker-orte={gruppe.orte.length}
      data-world-map-marker-gewaehlt={gewaehlt ? 'ja' : 'nein'}
      aria-label={`${weltMarkerGruppeText(gruppe)}, ${geplantLabel}`}
      aria-current={gewaehlt ? 'true' : undefined}
      aria-expanded={mehrere ? offen : undefined}
      aria-controls={mehrere ? gruppenAuswahlId : weltOrtDomId(ort.schluessel)}
      onClick={() => {
        if (mehrere) onOeffnen(offen ? null : gruppe.schluessel)
        else onWaehlen(ort.schluessel)
      }}
      className={`group absolute flex min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-50 ${
        gewaehlt || offen ? 'z-20' : 'z-10'
      }`}
      style={{ left: `${gruppe.links}%`, top: `${gruppe.oben}%` }}
    >
      <MarkerPunkt gewaehlt={gewaehlt} anzahl={mehrere ? gruppe.orte.length : null} />
      {gewaehlt ? (
        <MarkerBeschriftung
          text={aktiverOrt.name}
          unten={gruppe.oben < 16}
          ausrichtung={gruppe.ausrichtung}
        />
      ) : null}
    </button>
  )
}

/**
 * Auswahl für eine geteilte Trefferfläche. Sie steht unter der Karte statt als
 * Überlagerung darauf: so kann sie auf keiner Breite über den Rand laufen und
 * verdeckt auf dem Telefon nicht die Karte, um die es geht.
 */
function GruppenAuswahl({
  gruppe,
  gewaehlterOrt,
  onSchliessen,
  onWaehlen,
}: {
  gruppe: WorldMapMarkerGruppe
  gewaehlterOrt: string | null
  onSchliessen: () => void
  onWaehlen: (schluessel: string) => void
}) {
  return (
    <div
      id={gruppenAuswahlId}
      className="mt-2 rounded-2xl border border-line-200 bg-surface-0 p-2 shadow-[0_6px_20px_rgba(15,46,42,0.08)]"
      onKeyDown={(ereignis) => {
        if (ereignis.key === 'Escape') {
          ereignis.stopPropagation()
          onSchliessen()
        }
      }}
    >
      <p className="px-1 text-xs font-semibold leading-5 text-ink-800">
        {WORLD_MAP_GRUPPE_FRAGE}
      </p>
      <ul className="mt-1 grid gap-1 sm:grid-cols-2">
        {gruppe.orte.map((eintrag) => (
          <li key={eintrag.schluessel} className="min-w-0">
            <button
              type="button"
              aria-current={eintrag.schluessel === gewaehlterOrt ? 'true' : undefined}
              onClick={() => onWaehlen(eintrag.schluessel)}
              className={
                eintrag.schluessel === gewaehlterOrt
                  ? 'flex min-h-11 w-full min-w-0 items-center rounded-xl border border-brand-600 bg-surface-50 px-3 text-left text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                  : 'flex min-h-11 w-full min-w-0 items-center rounded-xl border border-line-200 px-3 text-left text-sm font-semibold text-brand-800 hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              }
            >
              <span className="min-w-0 break-words">{eintrag.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function OrtZeile({
  ort,
  geplantLabel,
  gewaehlt,
  imRahmen,
  onWaehlen,
}: {
  ort: WorldMapOrt
  geplantLabel: string
  gewaehlt: boolean
  imRahmen: boolean
  onWaehlen: (schluessel: string) => void
}) {
  const reisen = weltOrtReiseAnzeigen(ort.reisen)
  const aufKarte = ort.geplottet && imRahmen
  const ortHinweis = ort.geplottet
    ? imRahmen
      ? null
      : WORLD_MAP_AUSSERHALB_RAHMEN_TEXT
    : WORLD_MAP_OHNE_KOORDINATEN_TEXT

  return (
    <li id={weltOrtDomId(ort.schluessel)} className="flex min-w-0">
      <article
        data-world-map-ort-gewaehlt={gewaehlt ? 'ja' : 'nein'}
        className={
          gewaehlt
            ? 'flex w-full min-w-0 flex-col rounded-2xl border border-brand-600 bg-surface-50 p-3 shadow-[0_2px_10px_rgba(15,46,42,0.07)]'
            : 'flex w-full min-w-0 flex-col rounded-2xl border border-line-200 bg-surface-0 p-3'
        }
      >
        <button
          type="button"
          aria-current={gewaehlt ? 'true' : undefined}
          aria-label={`${ort.name}, ${ort.countryLabel ?? WORLD_MAP_OHNE_LAND_TEXT}, ${geplantLabel}${
            ortHinweis ? `, ${ortHinweis}` : ''
          }`}
          className="flex min-h-11 w-full min-w-0 items-start gap-2.5 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0"
          onClick={() => onWaehlen(ort.schluessel)}
        >
          <span
            aria-hidden="true"
            className={
              aufKarte
                ? 'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-100 text-brand-800'
                : 'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-25 text-ink-650'
            }
          >
            {aufKarte ? <MapPin className="h-3.5 w-3.5" /> : <MapPinOff className="h-3.5 w-3.5" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block break-words text-sm font-semibold leading-5 text-brand-800">
              {ort.name}
            </span>
            <span className="mt-0.5 block break-words text-xs leading-5 text-ink-800">
              {ort.countryLabel ?? WORLD_MAP_OHNE_LAND_TEXT}
            </span>
            {ortHinweis ? (
              <span className="mt-0.5 block break-words text-xs leading-5 text-ink-650">
                {ortHinweis}
              </span>
            ) : null}
          </span>
        </button>
        {reisen.length > 0 ? (
          <ul className="mt-2 flex flex-col gap-1.5 border-t border-line-100 pt-2">
            {reisen.map((reise) => (
              <li key={`${ort.schluessel}:${reise.tripId}`} className="min-w-0">
                <Link
                  href={`/reisen/${reise.tripId}` as Route}
                  aria-label={reise.ariaLabel}
                  className="group flex min-h-11 w-full min-w-0 items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-surface-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-[13px] font-semibold leading-5 text-brand-700 underline-offset-4 group-hover:underline">
                      {reise.titel}
                    </span>
                    <span className="block break-words text-xs leading-5 text-ink-650">
                      {reise.meta}
                      {reise.ordinalText ? ` · ${reise.ordinalText}` : ''}
                    </span>
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-brand-600"
                  />
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </article>
    </li>
  )
}

export default function AccountWeltKarte({
  welt,
  besucht,
  laender,
  aktion,
}: {
  welt: WorldMapAbleitung
  besucht: WeltBesuchtAnsicht
  laender: WeltLaenderAbleitung
  /** Einstieg in die Besuchsverwaltung. Fehlt auf der Seite, die sie selbst ist. */
  aktion?: { href: Route; text: string } | null
}) {
  const [gewaehlt, setGewaehlt] = useState<string | null>(null)
  const [offeneGruppe, setOffeneGruppe] = useState<string | null>(null)
  const musterBasis = useId()
  const ansicht = useMemo(() => weltKartenAnsicht(welt.orte), [welt.orte])
  const ohneFlaeche = weltOhneFlaecheHinweis(laender.ohneFlaeche)
  const imRahmen = useMemo(
    () =>
      new Set(
        ansicht.gruppen.flatMap((gruppe) => gruppe.orte.map((eintrag) => eintrag.schluessel)),
      ),
    [ansicht.gruppen],
  )

  const aktiveGruppe = useMemo(() => {
    const gruppe = ansicht.gruppen.find((eintrag) => eintrag.schluessel === offeneGruppe)
    return gruppe && gruppe.orte.length > 1 ? gruppe : null
  }, [ansicht.gruppen, offeneGruppe])

  const waehlen = useCallback((schluessel: string) => {
    setGewaehlt(schluessel)
    setOffeneGruppe(null)
    const ziel = document.getElementById(weltOrtDomId(schluessel))
    ziel?.scrollIntoView({
      block: 'nearest',
      behavior: reduzierteBewegung() ? 'auto' : 'smooth',
    })
  }, [])

  return (
    <section
      aria-labelledby="account-welt-titel"
      data-world-map="ein"
      data-world-map-lage={welt.lage}
      data-world-map-visited={besucht.lage}
      data-world-map-search="nein"
      className="mt-8 rounded-[30px] border border-black/5 bg-white p-5 shadow-[0_16px_50px_rgba(15,46,42,0.06)] sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">
        Deine Reisen im Überblick
      </p>
      <h2
        id="account-welt-titel"
        className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-brand-800 sm:text-3xl"
      >
        {welt.titel}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-800">{welt.unterscheidung}</p>

      {/* Zwei Kennzahlen, zwei Wahrheiten. Die besuchte Seite hängt nicht am
          Leseergebnis der Reisen: sie bleibt sichtbar, auch wenn die geplante
          Seite gerade nicht gelesen werden konnte – und umgekehrt. Beides als
          eine Zeile zu zeigen hiesse, den Ausfall der einen für eine Aussage
          über die andere zu halten. */}
      <ul className="mt-4 flex flex-col gap-x-6 gap-y-2 sm:flex-row sm:flex-wrap sm:items-start">
        <KennzahlZeile zustand="besucht" label={besucht.label} wert={besucht.kurz} />
        {welt.lage === 'fehler' ? null : (
          <KennzahlZeile zustand="geplant" label={welt.geplantLabel} wert={welt.geplantKennzahl} />
        )}
      </ul>

      {aktion ? (
        <p className="mt-3">
          <Link
            href={aktion.href}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-800 underline-offset-4 hover:underline"
          >
            {aktion.text}
          </Link>
        </p>
      ) : null}

      {besucht.fehlerText ? (
        <p
          role="alert"
          className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800"
        >
          {besucht.fehlerText}
        </p>
      ) : null}

      {welt.lage === 'fehler' ? (
        <div
          role="alert"
          className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm leading-6 text-red-800"
        >
          {welt.fehlerText}
        </div>
      ) : null}

      {/* Die Karte bleibt auch dann stehen, wenn eine der beiden Seiten nicht
          gelesen werden konnte. Sie zeigt dann weniger, aber nichts Falsches. */}
      <div className="mt-5 flex flex-col gap-4">
        <div className="min-w-0">
          <div className="relative rounded-[22px] border border-line-200 bg-surface-50 p-2">
            {/* Nur die Kartenfläche wird beschnitten. Die Marker-Ebene bleibt
                frei, damit ein Punkt am Kartenrand seine volle Trefferfläche
                behält; der Innenabstand der Karte trägt den Überhang. */}
            <div className="overflow-hidden rounded-[14px]">
              <svg
                viewBox={ansicht.viewBox}
                role="img"
                aria-labelledby="account-welt-karte-titel account-welt-karte-desc"
                className="block h-auto w-full"
              >
                <title id="account-welt-karte-titel">{welt.titel}</title>
                <desc id="account-welt-karte-desc">
                  {`${WORLD_MAP_GRUNDKARTE_BESCHREIBUNG} ${besucht.label}: ${
                    besucht.kurz
                  }. ${welt.geplantLabel}: ${
                    welt.lage === 'leer' ? welt.leerText : welt.geplantKennzahl
                  }. ${WELT_KARTE_ZUSTAND_BESCHREIBUNG}`}
                </desc>
                <WeltMusterDefs id={musterBasis} />
                {/* Reine Grundkarte: eine Ebene Wasser, eine Ebene Land mit
                    Küstenlinie, darüber die Zustandsflächen der Länder, dann
                    Binnenseen, dann die Grenzen und das Gradnetz. Die
                    Reihenfolge ist die Aussage: Grenzen liegen über jeder
                    Füllung und bleiben deshalb in jedem Zustand lesbar. */}
                <g aria-hidden="true">
                  <rect
                    x={WORLD_MAP_RAHMEN_VIEWBOX.x}
                    y={WORLD_MAP_RAHMEN_VIEWBOX.y}
                    width={WORLD_MAP_RAHMEN_VIEWBOX.width}
                    height={WORLD_MAP_RAHMEN_VIEWBOX.height}
                    className="fill-surface-100"
                  />
                  {/* Die Strichstärken skalieren bewusst nicht mit der Karte.
                      Eine in Projektionsgrad gemessene Küstenlinie wäre auf
                      390px Breite dünner als ein Bildpunkt und würde zu Grau
                      verwaschen; `non-scaling-stroke` hält sie auf jeder
                      Breite gleich scharf. */}
                  <path
                    d={LAND_PFAD}
                    fillRule="evenodd"
                    className="fill-brand-700/20 stroke-brand-700/60 [vector-effect:non-scaling-stroke]"
                    strokeWidth="0.75"
                    strokeLinejoin="round"
                  />
                </g>
                <WeltFuellungen id={musterBasis} flaechen={laender.flaechen} />
                <g aria-hidden="true">
                  <path
                    d={SEE_PFAD}
                    fillRule="evenodd"
                    className="fill-surface-100 stroke-brand-700/35 [vector-effect:non-scaling-stroke]"
                    strokeWidth="0.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d={GRENZ_PFAD}
                    fill="none"
                    className="stroke-brand-800/45 [vector-effect:non-scaling-stroke]"
                    strokeWidth="0.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {ansicht.gitter.map((linie) => (
                    <line
                      key={linie.schluessel}
                      x1={linie.x1}
                      y1={linie.y1}
                      x2={linie.x2}
                      y2={linie.y2}
                      className="stroke-brand-800/[0.07] [vector-effect:non-scaling-stroke]"
                      strokeWidth="0.5"
                    />
                  ))}
                </g>
              </svg>
            </div>
            <div
              className="absolute inset-2"
              onKeyDown={(ereignis) => {
                if (ereignis.key === 'Escape' && offeneGruppe) {
                  ereignis.stopPropagation()
                  setOffeneGruppe(null)
                }
              }}
            >
              {/* Zuerst die Länder ohne zeichenbare Fläche, dann die Orte:
                  so umschliesst der Ring den Punkt, statt unter ihm zu
                  verschwinden. */}
              <WeltPunktMarken flaechen={laender.flaechen} />
              {ansicht.gruppen.map((gruppe) => (
                <MarkerGruppe
                  key={gruppe.schluessel}
                  gruppe={gruppe}
                  geplantLabel={welt.geplantLabel}
                  gewaehlterOrt={gewaehlt}
                  offen={offeneGruppe === gruppe.schluessel}
                  onOeffnen={setOffeneGruppe}
                  onWaehlen={waehlen}
                />
              ))}
            </div>
          </div>
          {aktiveGruppe ? (
            <GruppenAuswahl
              gruppe={aktiveGruppe}
              gewaehlterOrt={gewaehlt}
              onSchliessen={() => setOffeneGruppe(null)}
              onWaehlen={waehlen}
            />
          ) : null}
          {/* Dieselbe Aussage wie die Farben, in Worten. Sie steht direkt
              unter der Karte, nicht in einem ausklappbaren Nebenzweig. */}
          <WeltLaenderListe flaechen={laender.flaechen} />
          {ohneFlaeche ? (
            <p className="mt-2 text-xs leading-5 text-ink-650">{ohneFlaeche}</p>
          ) : null}
          <p className="mt-2 text-xs leading-5 text-ink-650">
            {welt.lage === 'leer' ? welt.leerText : welt.laenderText}
            {ansicht.rahmenHinweis ? ` ${ansicht.rahmenHinweis}` : ''}
          </p>
          {besucht.ohneLandHinweis ? (
            <p className="mt-1 text-xs leading-5 text-ink-650">{besucht.ohneLandHinweis}</p>
          ) : null}
          {/* Kartenherkunft und Grenz-Vorbehalt stehen sichtbar an der Karte,
              nicht nur in der Dokumentation: gezeichnete Grenzen sind
              Orientierung, keine Aussage Jetnitys über Hoheit. */}
          <p className="mt-1 text-xs leading-5 text-ink-650">{WORLD_MAP_GRUNDKARTE_HINWEIS}</p>
        </div>

        {welt.lage === 'leer' || welt.lage === 'fehler' ? null : (
          <ol className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {welt.orte.map((ort) => (
              <OrtZeile
                key={ort.schluessel}
                ort={ort}
                geplantLabel={welt.geplantLabel}
                gewaehlt={gewaehlt === ort.schluessel}
                imRahmen={imRahmen.has(ort.schluessel)}
                onWaehlen={waehlen}
              />
            ))}
          </ol>
        )}
      </div>

      <p className="mt-4 border-t border-line-100 pt-3 text-xs leading-5 text-ink-650">
        {besucht.text}
      </p>
    </section>
  )
}
