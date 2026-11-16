'use client'

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'

import LandFeld from '@/components/country/LandFeld'
import EinreiseKundenanzeige from '@/components/readiness/EinreiseKundenanzeige'
import { landAnzeigeText } from '@/lib/country/darstellung'
import { istKatalogLand } from '@/lib/country/katalog'
import { einreiseAusBesucher, type EinreiseAnzeige } from '@/lib/readiness/einreise-kundenanzeige'
import { CH_DE_VISA_INPUT, loadChDeVisa } from '@/lib/readiness/official-truth-product-v3/visitor/ch-de-http'
import type { V3VisitorView } from '@/lib/readiness/official-truth-product-v3/visitor/presentation'

const sekundär = 'inline-flex min-h-11 items-center justify-center rounded-full border border-line-200 px-4 text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15'

function anzeigeAusAntwort(ziel: string, paesse: readonly string[], antwort: V3VisitorView | null): EinreiseAnzeige {
  const zellen = paesse.map((pass) => {
    const zelle = antwort?.cells.find((eintrag) => eintrag.country === pass)
    return {
      landCode: pass,
      landLabel: landAnzeigeText(pass),
      ergebnisse: (zelle?.results ?? []).map((ergebnis) => ergebnis.status === 'accepted'
        ? {
            status: ergebnis.status,
            informationTopic: ergebnis.informationTopic,
            statements: ergebnis.statements,
            source: ergebnis.source,
            checkedAtText: ergebnis.checkedAtText,
          }
        : { status: ergebnis.status }),
    }
  })
  return einreiseAusBesucher({ zielCode: ziel, zielLabel: landAnzeigeText(ziel), zellen })
}

/**
 * Öffentlicher Länderprüfer. Nur die freigegebene CH→DE-Abfrage wird geladen.
 * Jede andere Kombination bleibt „Noch nicht bestätigt“.
 */
export default function EinreiseLaenderpruefer() {
  const id = useId()
  const [ziel, setZiel] = useState('')
  const [paesse, setPaesse] = useState<string[]>([''])
  const [anzeige, setAnzeige] = useState<EinreiseAnzeige | null>(null)
  const [synthetisch, setSynthetisch] = useState(false)
  const [hinweis, setHinweis] = useState('')
  const [laeuft, setLaeuft] = useState(false)
  const ergebnisTitel = useRef<HTMLHeadingElement>(null)
  const gewaehlt = useMemo(() => paesse.filter(istKatalogLand), [paesse])
  const bereit = istKatalogLand(ziel) && gewaehlt.length > 0 && paesse.every(istKatalogLand) && paesse.length <= 5

  async function senden(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!bereit || !istKatalogLand(ziel)) return
    setLaeuft(true)
    setHinweis('')
    const chDeErlaubt = ziel === CH_DE_VISA_INPUT.destinationCountryCode
      && CH_DE_VISA_INPUT.citizenshipCountryCodes.some((code) => gewaehlt.includes(code))
    let antwort: V3VisitorView | null = null
    if (chDeErlaubt) {
      const ladung = await loadChDeVisa(CH_DE_VISA_INPUT, new AbortController().signal)
      if (ladung.daten) antwort = ladung.daten
      else setHinweis(gewaehlt.length === 1
        ? (ladung.fehler?.meldung ?? 'Die bestätigte Auskunft konnte nicht geladen werden.')
        : 'Für den Schweizer Pass konnte die bestätigte Auskunft nicht geladen werden. Andere Pässe bleiben offen.')
    }
    setSynthetisch(antwort?.synthetic === true)
    setAnzeige(anzeigeAusAntwort(ziel, gewaehlt, antwort))
    setLaeuft(false)
  }

  useEffect(() => {
    if (anzeige) ergebnisTitel.current?.focus()
  }, [anzeige])

  return (
    <section className="mx-auto grid w-full min-w-0 max-w-3xl gap-6 text-brand-800" aria-labelledby={`${id}-titel`}>
      <header className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">Einreise & Visum</p>
        <h1 id={`${id}-titel`} className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          Einreise und Visum prüfen
        </h1>
        <p className="max-w-2xl text-base leading-7 text-ink-900">
          Wähle das Zielland und den Pass. Die Auskunft erscheint hier, für jeden Pass getrennt.
        </p>
      </header>
      <form onSubmit={senden} noValidate className="grid gap-5 rounded-3xl border border-line-200 bg-white px-4 py-5 sm:px-6">
        <LandFeld id={`${id}-ziel`} label="Zielland" value={ziel} optional={false} searchable={false} onChange={(land) => { setAnzeige(null); setZiel(land) }} />
        <fieldset className="grid gap-3">
          <legend className="mb-2 text-base font-semibold">Pass / Staatsangehörigkeit</legend>
          {paesse.map((pass, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <LandFeld
                id={`${id}-pass-${index}`}
                label={`Pass ${index + 1}`}
                value={pass}
                optional={false}
                searchable={false}
                onChange={(wert) => {
                  setAnzeige(null)
                  setPaesse((liste) => liste.map((eintrag, stelle) => stelle === index ? wert : eintrag))
                }}
              />
              {paesse.length > 1 ? (
                <button
                  type="button"
                  className={sekundär}
                  aria-label={`Pass ${index + 1} entfernen`}
                  onClick={() => {
                    setAnzeige(null)
                    setPaesse((liste) => liste.filter((_, stelle) => stelle !== index))
                  }}
                >
                  Entfernen
                </button>
              ) : null}
            </div>
          ))}
          {paesse.length < 5 ? (
            <button type="button" className={`${sekundär} justify-self-start`} onClick={() => setPaesse((liste) => [...liste, ''])}>
              Weiteren Pass hinzufügen
            </button>
          ) : null}
        </fieldset>
        <button
          type="submit"
          disabled={!bereit || laeuft}
          className="min-h-11 rounded-full bg-brand-800 px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {laeuft ? 'Angaben werden geladen' : 'Einreise anzeigen'}
        </button>
      </form>
      {hinweis ? <p role="alert" className="text-sm leading-6 text-ink-900">{hinweis}</p> : null}
      {anzeige ? (
        <div className="grid gap-3">
          <h2 ref={ergebnisTitel} tabIndex={-1} className="text-2xl font-semibold tracking-tight outline-none">
            Einreise nach {landAnzeigeText(ziel)}
          </h2>
          {synthetisch ? (
            <p className="rounded-xl border border-line-200 bg-citrus-300 px-3 py-3 text-sm font-semibold text-brand-900">
              Synthetische Testdaten · Keine echte Einreiseauskunft
            </p>
          ) : null}
          <EinreiseKundenanzeige anzeige={anzeige} />
        </div>
      ) : null}
    </section>
  )
}
