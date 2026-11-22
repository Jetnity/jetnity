'use client'

import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'

import LandFeld from '@/components/country/LandFeld'
import EinreiseKundenanzeige from '@/components/readiness/EinreiseKundenanzeige'
import AtOfficialGuidance from '@/components/readiness/AtOfficialGuidance'
import FollowupOfficialGuidance from '@/components/readiness/FollowupOfficialGuidance'
import NextEightOfficialGuidance from '@/components/readiness/NextEightOfficialGuidance'
import { landAnzeigeText } from '@/lib/country/darstellung'
import { istKatalogLand, type Iso3166Alpha2 } from '@/lib/country/katalog'
import { einreisePrueferLaden, einreisePrueferSicht } from '@/lib/readiness/einreise-laenderpruefer'
import { EINREISE_PRUEFER_MAX_PAESSE, reisendeJeLand, reisendeMitPass, type EinreisePrueferVorbelegung } from '@/lib/readiness/einreise-pruefer-vorbelegung'
import { loadChDeVisa } from '@/lib/readiness/official-truth-product-v3/visitor/ch-de-http'
import { loadAtVisa } from '@/lib/readiness/official-truth-at-method-v1/at-visa-http'
import { createV3VisitorController, type V3VisitorUiState } from '@/lib/readiness/official-truth-product-v3/visitor/controller'

function passHinweis(pass: string, personen: EinreisePrueferVorbelegung['personen']): string | undefined {
  if (personen.length === 0 || !istKatalogLand(pass)) return undefined
  const namen = reisendeMitPass(personen, pass)
  return namen ? `Gehört zu: ${namen}` : 'Bei keiner reisenden Person dieser Reise hinterlegt.'
}

const sekundär = 'inline-flex min-h-11 items-center justify-center rounded-full border border-line-200 px-4 text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15'

/**
 * Öffentlicher Länderprüfer. Nur die freigegebene CH→DE-Abfrage geht an den bestehenden Controller.
 * Jede andere Kombination bleibt „Noch nicht bestätigt“.
 *
 * `eingebettet`: im Workspace steht die `h1` schon im Reisekopf; der Prüfer beginnt dann mit `h2`.
 * `vorbelegung` füllt nur die Felder vor; abgefragt wird erst nach «Einreise anzeigen».
 */
export default function EinreiseLaenderpruefer({
  eingebettet = false,
  vorbelegung = null,
  onAngabenErgaenzen,
}: {
  eingebettet?: boolean
  vorbelegung?: EinreisePrueferVorbelegung | null
  onAngabenErgaenzen?: () => void
} = {}) {
  const id = useId()
  const [ziel, setZiel] = useState<string>(vorbelegung?.ziele[0] ?? '')
  const [paesse, setPaesse] = useState<string[]>(vorbelegung?.paesse.length ? [...vorbelegung.paesse] : [''])
  const vorausgefuellt = Boolean(vorbelegung && (vorbelegung.ziele.length > 0 || vorbelegung.paesse.length > 0))
  const personenOhnePass = vorbelegung?.personen.filter((person) => person.paesse.length === 0).length ?? 0
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
  const bereit = istKatalogLand(ziel) && gewaehlt.length > 0 && paesse.every(istKatalogLand) && paesse.length <= EINREISE_PRUEFER_MAX_PAESSE
  const personen = vorbelegung?.personen ?? []
  const reisendeJePass = reisendeJeLand(personen)
  const sicht = einreisePrueferSicht(stand, reisendeJePass)
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
        {eingebettet ? (
          <h2 id={`${id}-titel`} className="text-title">
            Einreise und Visum prüfen
          </h2>
        ) : (
          <>
            <p className="text-kicker uppercase text-brand-600">Einreise & Visum</p>
            <h1 id={`${id}-titel`} className="text-display [overflow-wrap:anywhere]">
              Einreise und Visum prüfen
            </h1>
          </>
        )}
        <p className="max-w-prose text-body text-ink-900">
          {vorausgefuellt
            ? 'Zielland und Pässe sind aus deiner Reise vorausgefüllt. Prüfe sie und tippe auf «Einreise anzeigen». Die Auskunft erscheint für jeden Pass getrennt.'
            : 'Wähle das Zielland und den Pass. Die Auskunft erscheint hier, für jeden Pass getrennt.'}
        </p>
      </header>
      <form onSubmit={senden} noValidate className="grid gap-5 rounded-3xl border border-line-200 bg-white px-4 py-5 sm:px-6">
        <div className="grid gap-3">
          <LandFeld id={`${id}-ziel`} label="Zielland" value={ziel} optional={false} searchable onChange={(land) => zuruecksetzen(() => setZiel(land))} />
          {vorbelegung && vorbelegung.ziele.length > 1 ? (
            <div role="group" aria-label="Länder dieser Reise" className="flex flex-wrap items-center gap-2" data-einreise-reiseziele>
              <span className="text-xs leading-5 text-ink-800">Länder dieser Reise:</span>
              {vorbelegung.ziele.map((code) => (
                <button
                  key={code}
                  type="button"
                  aria-pressed={ziel === code}
                  onClick={() => zuruecksetzen(() => setZiel(code))}
                  className={`${sekundär} aria-pressed:border-brand-800 aria-pressed:bg-brand-800 aria-pressed:text-white`}
                >
                  {landAnzeigeText(code)}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <fieldset className="grid gap-3">
          <legend className="mb-2 text-base font-semibold">Pass / Staatsangehörigkeit</legend>
          {vorbelegung && vorbelegung.personen.length > 1 ? (
            <p className="text-xs leading-5 text-ink-800">
              Ein Eintrag je Pass. Unter jedem Pass steht, wem er gehört. Wer zwei Pässe hat, steht bei beiden.
            </p>
          ) : null}
          {paesse.map((pass, index) => (
            <div key={index} className={paesse.length > 1 ? 'grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end' : 'grid gap-2'}>
              <LandFeld
                id={`${id}-pass-${index}`}
                label={`Pass ${index + 1}`}
                hinweis={passHinweis(pass, personen)}
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
          {paesse.length < EINREISE_PRUEFER_MAX_PAESSE ? (
            <button type="button" className={`${sekundär} justify-self-start`} onClick={() => zuruecksetzen(() => setPaesse((liste) => [...liste, '']))}>
              Weiteren Pass hinzufügen
            </button>
          ) : null}
          {vorbelegung && vorbelegung.personen.length > 0 ? (
            <div className="grid gap-2 rounded-2xl bg-surface-25 px-3 py-3 text-xs leading-5 text-ink-800" data-einreise-vorbelegung>
              <p className="text-sm font-semibold text-brand-800">Pässe der Reisenden aus dieser Reise</p>
              <ul className="grid gap-1">
                {vorbelegung.personen.map((person) => (
                  <li key={person.clientRef} className="break-words" data-einreise-vorbelegung-person={person.paesse.length > 0 ? 'angegeben' : 'offen'}>
                    <span className="font-semibold text-brand-800">{person.label}:</span> {person.text}
                  </li>
                ))}
              </ul>
              {vorbelegung.nichtUebernommen.length > 0 ? (
                <p>
                  Hier lassen sich höchstens {EINREISE_PRUEFER_MAX_PAESSE} Pässe auf einmal prüfen. Nicht übernommen:{' '}
                  {vorbelegung.nichtUebernommen.map((code) => landAnzeigeText(code)).join(', ')}. Tausche dafür einen Pass oben aus.
                </p>
              ) : null}
              {personenOhnePass > 0 ? (
                onAngabenErgaenzen ? (
                  <button type="button" onClick={onAngabenErgaenzen} className={`${sekundär} justify-self-start`}>
                    Staatsangehörigkeit ergänzen
                  </button>
                ) : (
                  <p>Fehlende Staatsangehörigkeiten ergänzt du in der Vorbereitung unter «Reisende & Dokumente».</p>
                )
              ) : null}
            </div>
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
      {stand.phase === 'error' ? <p role="alert" className="max-w-prose text-sm leading-6 text-ink-900">{stand.message}</p> : null}
      {sicht ? (
        <div className="grid gap-3">
          <h2 ref={ergebnisTitel} tabIndex={-1} className="text-title outline-none">
            Einreise nach {sicht.zielLabel}
          </h2>
          {sicht.synthetisch ? (
            <p className="rounded-xl border border-line-200 bg-citrus-300 px-3 py-3 text-sm font-semibold text-brand-900">
              Synthetische Testdaten · Keine echte Einreiseauskunft
            </p>
          ) : null}
          {sicht.hinweis ? <p role="status" className="max-w-prose text-sm leading-6 text-ink-900">{sicht.hinweis}</p> : null}
          <EinreiseKundenanzeige anzeige={sicht.anzeige} />
          {sicht.zielCode === 'AT' ? <AtOfficialGuidance citizenshipCodes={sicht.citizenshipCodes} /> : null}
          {['IT','FR','ES','PT'].includes(sicht.zielCode) ? <FollowupOfficialGuidance country={sicht.zielCode} /> : null}
          {['GR','HR','NL','GB','US','TR','TH','AE'].includes(sicht.zielCode) ? <NextEightOfficialGuidance country={sicht.zielCode} /> : null}
        </div>
      ) : null}
    </section>
  )
}
