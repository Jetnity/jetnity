'use client'

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'

import LandFeld from '@/components/country/LandFeld'
import EinreiseKundenanzeige from '@/components/readiness/EinreiseKundenanzeige'
import AtOfficialGuidance from '@/components/readiness/AtOfficialGuidance'
import { istKatalogLand, type Iso3166Alpha2 } from '@/lib/country/katalog'
import { einreisePrueferLaden, einreisePrueferSicht } from '@/lib/readiness/einreise-laenderpruefer'
import { loadChDeVisa } from '@/lib/readiness/official-truth-product-v3/visitor/ch-de-http'
import { loadAtVisa } from '@/lib/readiness/official-truth-at-method-v1/at-visa-http'
import { createV3VisitorController, type V3VisitorUiState } from '@/lib/readiness/official-truth-product-v3/visitor/controller'

const sekundär = 'inline-flex min-h-11 items-center justify-center rounded-full border border-line-200 px-4 text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15'

/**
 * Öffentlicher Länderprüfer. Nur die freigegebene CH→DE-Abfrage geht an den bestehenden Controller.
 * Jede andere Kombination bleibt „Noch nicht bestätigt“.
 */
export default function EinreiseLaenderpruefer() {
  const id = useId()
  const [ziel, setZiel] = useState('')
  const [paesse, setPaesse] = useState<string[]>([''])
  const [stand, setStand] = useState<V3VisitorUiState>({ phase: 'idle', view: null, message: null })
  const ergebnisTitel = useRef<HTMLHeadingElement>(null)
  const controller = useMemo(
    () => createV3VisitorController(einreisePrueferLaden(loadChDeVisa, loadAtVisa), setStand),
    [],
  )
  useEffect(() => () => controller.dispose(), [controller])
  const gewaehlt = useMemo(() => {
    const gesehen = new Set<string>()
    const auswahl: Iso3166Alpha2[] = []
    for (const pass of paesse) {
      if (!istKatalogLand(pass) || gesehen.has(pass)) continue
      gesehen.add(pass)
      auswahl.push(pass)
    }
    return auswahl
  }, [paesse])
  const bereit = istKatalogLand(ziel) && gewaehlt.length > 0 && paesse.every(istKatalogLand) && paesse.length <= 5
  const sicht = einreisePrueferSicht(stand)
  const zuruecksetzen = (action: () => void) => {
    controller.invalidate()
    action()
  }

  useEffect(() => {
    if ((stand.phase === 'ready' || stand.phase === 'error') && stand.focusResult) ergebnisTitel.current?.focus()
  }, [stand])

  async function senden(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!bereit || !istKatalogLand(ziel)) return
    await controller.submit({ destinationCountryCode: ziel, citizenshipCountryCodes: gewaehlt })
  }

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
        <LandFeld id={`${id}-ziel`} label="Zielland" value={ziel} optional={false} searchable onChange={(land) => zuruecksetzen(() => setZiel(land))} />
        <fieldset className="grid gap-3">
          <legend className="mb-2 text-base font-semibold">Pass / Staatsangehörigkeit</legend>
          {paesse.map((pass, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <LandFeld
                id={`${id}-pass-${index}`}
                label={`Pass ${index + 1}`}
                value={pass}
                optional={false}
                searchable
                onChange={(wert) => zuruecksetzen(() => setPaesse((liste) => liste.map((eintrag, stelle) => stelle === index ? wert : eintrag)))}
              />
              {paesse.length > 1 ? (
                <button
                  type="button"
                  className={sekundär}
                  aria-label={`Pass ${index + 1} entfernen`}
                  onClick={() => zuruecksetzen(() => setPaesse((liste) => liste.filter((_, stelle) => stelle !== index)))}
                >
                  Entfernen
                </button>
              ) : null}
            </div>
          ))}
          {paesse.length < 5 ? (
            <button type="button" className={`${sekundär} justify-self-start`} onClick={() => zuruecksetzen(() => setPaesse((liste) => [...liste, '']))}>
              Weiteren Pass hinzufügen
            </button>
          ) : null}
        </fieldset>
        <button
          type="submit"
          disabled={!bereit || stand.phase === 'loading'}
          className="min-h-11 rounded-full bg-brand-800 px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {stand.phase === 'loading' ? 'Angaben werden geladen' : 'Einreise anzeigen'}
        </button>
      </form>
      {stand.phase === 'error' ? <p role="alert" className="text-sm leading-6 text-ink-900">{stand.message}</p> : null}
      {sicht ? (
        <div className="grid gap-3">
          <h2 ref={ergebnisTitel} tabIndex={-1} className="text-2xl font-semibold tracking-tight outline-none">
            Einreise nach {sicht.zielLabel}
          </h2>
          {sicht.synthetisch ? (
            <p className="rounded-xl border border-line-200 bg-citrus-300 px-3 py-3 text-sm font-semibold text-brand-900">
              Synthetische Testdaten · Keine echte Einreiseauskunft
            </p>
          ) : null}
          {sicht.hinweis ? <p role="status" className="text-sm leading-6 text-ink-900">{sicht.hinweis}</p> : null}
          <EinreiseKundenanzeige anzeige={sicht.anzeige} />
          {sicht.zielCode === 'AT' ? <AtOfficialGuidance /> : null}
        </div>
      ) : null}
    </section>
  )
}
