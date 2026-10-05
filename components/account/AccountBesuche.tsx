'use client'

// Die Verwaltungsfläche der bestätigten Besuchshistorie.
//
// Sie zeigt dieselbe Karte wie zuvor, darunter die Ereignisse. Wiederholte
// Besuche desselben Ortes bleiben getrennte Zeilen. Die erste Seite zeigt
// zwölf Ereignisse; der Rest bleibt in derselben Liste und kommt über eine
// lokale Aufklappung oder die lokale Suche dazu. Nichts davon fragt neu an
// und nichts wird zusammengelegt.
//
// Bestätigen, ändern und widerrufen greifen ausschliesslich auf die eigene
// Besuchshistorie zu. Eine Reise wird hier nicht verändert.

import { useRouter } from 'next/navigation'
import { AlertCircle, MapPin, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, useTransition } from 'react'

import AccountBesuchFormular, {
  BESUCH_FORMULAR_LEER,
  besuchEingabeAus,
  type BesuchFormularWert,
} from '@/components/account/AccountBesuchFormular'
import AccountWeltKarte from '@/components/account/AccountWeltKarte'
import {
  BESUCH_VERWALTUNG_ANFANG,
  BESUCH_VERWALTUNG_SCHRITT,
  besuchEreignisZahlText,
  besuchSuchtrefferText,
  besuchVerwaltungAusschnitt,
  besuchWeitereText,
} from '@/lib/account/account-world-visit-management-premium-1'
import type { Besuch, BesuchAnzeige } from '@/lib/account/besuche'
import {
  besuchAendern,
  besuchBestaetigen,
  besuchWiderrufen,
} from '@/lib/account/besuche-aktionen'
import { BESUCHE_COPY } from '@/lib/account/besuche-copy'
import type { WeltBesuchtAnsicht } from '@/lib/account/welt-ansicht'
import type { WeltLaenderAbleitung } from '@/lib/account/welt-laender'
import type { WorldMapAbleitung } from '@/lib/account/world-map'
import type { Problem } from '@/lib/api/datenbank-lesen'

type Status = { art: 'erfolg' | 'fehler'; text: string } | null

const aktionKlasse =
  'inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border border-line-200 bg-white px-4 text-xs font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:opacity-60'

function formularWertAus(besuch: Besuch): BesuchFormularWert {
  return {
    ort: besuch.placeId && besuch.placeLabel ? { id: besuch.placeId, name: besuch.placeLabel } : null,
    countryCode: besuch.placeId ? '' : (besuch.countryCode ?? ''),
    jahr: besuch.jahr === null ? '' : String(besuch.jahr),
    monat: besuch.monat === null ? '' : String(besuch.monat),
    tag: besuch.tag === null ? '' : String(besuch.tag),
  }
}

function statusKlasse(art: 'erfolg' | 'fehler'): string {
  return art === 'fehler'
    ? 'rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800'
    : 'rounded-2xl border border-brand-100 bg-surface-50 px-4 py-3 text-sm leading-6 text-brand-800'
}

export default function AccountBesuche({
  welt,
  besucht,
  laender,
  besuche,
  problem,
}: {
  welt: WorldMapAbleitung
  besucht: WeltBesuchtAnsicht
  laender: WeltLaenderAbleitung
  besuche: readonly Besuch[]
  problem: Problem | null
}) {
  const router = useRouter()
  const [laeuft, starten] = useTransition()
  const [status, setStatus] = useState<Status>(null)
  const [neu, setNeu] = useState<BesuchFormularWert>(BESUCH_FORMULAR_LEER)
  const [bearbeitet, setBearbeitet] = useState<{ id: string; wert: BesuchFormularWert } | null>(null)
  const [widerruf, setWiderruf] = useState<string | null>(null)
  const [formularOffen, setFormularOffen] = useState(besuche.length === 0)
  const [suche, setSuche] = useState('')
  const [sichtGrenze, setSichtGrenze] = useState(BESUCH_VERWALTUNG_ANFANG)
  const hinzufuegenKnopf = useRef<HTMLButtonElement>(null)
  const formularKnoten = useRef<HTMLDivElement>(null)
  const ortFeld = useRef<HTMLInputElement>(null)
  const statusKnoten = useRef<HTMLParagraphElement>(null)
  const formularFokus = useRef(false)

  const ausschnitt = besuchVerwaltungAusschnitt(besucht.eintraege, suche, sichtGrenze)

  useEffect(() => {
    if (!formularOffen || !formularFokus.current) return
    formularFokus.current = false
    const reduziert = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    formularKnoten.current?.scrollIntoView({
      block: 'start',
      behavior: reduziert ? 'auto' : 'smooth',
    })
    ortFeld.current?.focus({ preventScroll: true })
  }, [formularOffen])

  useEffect(() => {
    if (!status) return
    const reduziert = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    statusKnoten.current?.scrollIntoView({
      block: 'nearest',
      behavior: reduziert ? 'auto' : 'smooth',
    })
  }, [status])

  function hinzufuegenUmschalten() {
    setFormularOffen((offen) => {
      const naechstes = !offen
      formularFokus.current = naechstes
      if (!naechstes) requestAnimationFrame(() => hinzufuegenKnopf.current?.focus())
      return naechstes
    })
  }

  function bestaetigen() {
    starten(async () => {
      const ergebnis = await besuchBestaetigen(besuchEingabeAus(neu))
      if (!ergebnis.ok) {
        setStatus({ art: 'fehler', text: ergebnis.meldung })
        return
      }
      setNeu(BESUCH_FORMULAR_LEER)
      setStatus({ art: 'erfolg', text: BESUCHE_COPY.erfolgBestaetigt })
      router.refresh()
    })
  }

  function aendern() {
    if (!bearbeitet) return
    starten(async () => {
      const ergebnis = await besuchAendern({
        id: bearbeitet.id,
        ...besuchEingabeAus(bearbeitet.wert),
      })
      if (!ergebnis.ok) {
        setStatus({ art: 'fehler', text: ergebnis.meldung })
        return
      }
      setBearbeitet(null)
      setStatus({ art: 'erfolg', text: BESUCHE_COPY.erfolgGeaendert })
      router.refresh()
    })
  }

  function widerrufen(id: string) {
    starten(async () => {
      const ergebnis = await besuchWiderrufen({ id })
      if (!ergebnis.ok) {
        setStatus({ art: 'fehler', text: ergebnis.meldung })
        return
      }
      setWiderruf(null)
      setStatus({ art: 'erfolg', text: BESUCHE_COPY.erfolgWiderrufen })
      router.refresh()
    })
  }

  return (
    <div data-account-besuche={besucht.lage}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
        {BESUCHE_COPY.seitenEyebrow}
      </p>
      <div className="mt-2 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="min-w-0 break-words text-3xl font-semibold tracking-[-0.04em] text-brand-800 sm:text-5xl">
          {BESUCHE_COPY.seitenTitel}
        </h1>
        {problem ? null : (
          <button
            ref={hinzufuegenKnopf}
            type="button"
            data-besuch-hinzufuegen="ein"
            aria-expanded={formularOffen}
            aria-controls="account-besuch-anlegen"
            onClick={hinzufuegenUmschalten}
            className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-full bg-brand-800 px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:w-auto"
          >
            {BESUCHE_COPY.hinzufuegenAktion}
          </button>
        )}
      </div>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink-700">{BESUCHE_COPY.seitenLead}</p>
      <p className="mt-2 max-w-xl text-sm leading-6 text-ink-700">{BESUCHE_COPY.seitenHinweis}</p>

      <AccountWeltKarte welt={welt} besucht={besucht} laender={laender} />

      <section
        aria-labelledby="account-besuche-liste"
        className="mt-14 border-t border-line-200 pt-10"
        data-besuch-verwaltung="ein"
      >
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h2
            id="account-besuche-liste"
            className="text-xl font-semibold tracking-[-0.03em] text-brand-800"
          >
            {BESUCHE_COPY.listeTitel}
          </h2>
          {!problem && besucht.eintraege.length > 0 ? (
            <p className="text-sm text-ink-700" data-besuch-gesamt={besucht.eintraege.length}>
              {besuchEreignisZahlText(besucht.eintraege.length)}
            </p>
          ) : null}
        </div>

        {status ? (
          <p
            ref={statusKnoten}
            role={status.art === 'fehler' ? 'alert' : 'status'}
            data-besuch-status={status.art}
            className={`mt-4 ${statusKlasse(status.art)}`}
          >
            {status.text}
          </p>
        ) : null}

        {problem ? (
          <div
            role="alert"
            className="mt-4 rounded-[26px] border border-red-200 bg-red-50 px-6 py-8 text-center sm:px-10"
          >
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-red-600">
              <AlertCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-lg font-semibold text-red-800">{BESUCHE_COPY.fehlerTitel}</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-red-700">
              {problem.status === 503 ? BESUCHE_COPY.fehler503 : BESUCHE_COPY.fehler500}
            </p>
          </div>
        ) : (
          <>
            {besucht.eintraege.length > 0 ? (
              <div className="mt-4 grid min-w-0 gap-1">
                <label htmlFor="account-besuche-suche" className="text-sm font-medium text-brand-800">
                  {BESUCHE_COPY.sucheLabel}
                </label>
                <input
                  id="account-besuche-suche"
                  data-besuch-suche="ein"
                  type="text"
                  role="searchbox"
                  value={suche}
                  autoComplete="off"
                  spellCheck={false}
                  enterKeyHint="search"
                  placeholder={BESUCHE_COPY.suchePlatzhalter}
                  onChange={(ereignis) => setSuche(ereignis.target.value)}
                  className="min-h-11 w-full rounded-2xl border border-line-200 bg-white px-3 text-base text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 sm:text-sm"
                />
                {ausschnitt.sucheAktiv ? (
                  <p className="text-xs leading-5 text-ink-700" data-besuch-suche-anzahl={ausschnitt.gefiltert.length}>
                    {besuchSuchtrefferText(ausschnitt.gefiltert.length, besucht.eintraege.length)}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-4 rounded-[26px] border border-dashed border-line-400 bg-white/65 px-6 py-8 text-center sm:px-10">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-brand-600">
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-xl font-semibold tracking-[-0.03em] text-brand-800">
                  {BESUCHE_COPY.leerTitel}
                </h3>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-700">
                  {BESUCHE_COPY.leerText}
                </p>
              </div>
            )}

            {formularOffen ? (
              <div
                id="account-besuch-anlegen"
                ref={formularKnoten}
                className="mt-4 scroll-mt-28"
                data-besuch-anlage="offen"
              >
                <h2 className="sr-only">{BESUCHE_COPY.anlegenTitel}</h2>
                <AccountBesuchFormular
                  titel={BESUCHE_COPY.anlegenTitel}
                  aktionText={BESUCHE_COPY.anlegenAktion}
                  wert={neu}
                  onWert={setNeu}
                  onAbsenden={bestaetigen}
                  laeuft={laeuft}
                  ortRef={ortFeld}
                />
              </div>
            ) : null}

            {besuche.length === 0 ? null : ausschnitt.sucheAktiv && ausschnitt.zeilen.length === 0 ? (
              <p
                role="status"
                data-besuch-suche="leer"
                className="mt-4 rounded-2xl border border-dashed border-line-400 bg-white/65 px-4 py-6 text-sm leading-6 text-ink-800"
              >
                {BESUCHE_COPY.sucheLeer}
              </p>
            ) : (
              <>
                <ol
                  className="mt-4 grid min-w-0 grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3"
                  data-besuch-sichtbar={ausschnitt.zeilen.length}
                >
                  {ausschnitt.zeilen.map((eintrag) => (
                    <BesuchZeile
                      key={eintrag.id}
                      eintrag={eintrag}
                      besuche={besuche}
                      bearbeitet={bearbeitet}
                      widerruf={widerruf}
                      laeuft={laeuft}
                      onBearbeiten={setBearbeitet}
                      onWiderruf={setWiderruf}
                      onAendern={aendern}
                      onWiderrufen={widerrufen}
                    />
                  ))}
                </ol>
                {ausschnitt.verborgen > 0 ? (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <p className="w-full text-sm leading-6 text-ink-700" data-besuch-verborgen={ausschnitt.verborgen}>
                      {besuchWeitereText(ausschnitt.verborgen)}
                    </p>
                    <button
                      type="button"
                      data-besuch-weitere="ein"
                      onClick={() => setSichtGrenze((wert) => wert + BESUCH_VERWALTUNG_SCHRITT)}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-line-200 bg-white px-4 text-sm font-semibold text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:w-auto"
                    >
                      {BESUCHE_COPY.weitereAnzeigen}
                    </button>
                    <button
                      type="button"
                      data-besuch-alle="ein"
                      onClick={() => setSichtGrenze(besucht.eintraege.length)}
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-brand-800 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:w-auto"
                    >
                      {BESUCHE_COPY.alleAnzeigen}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </>
        )}
      </section>
    </div>
  )
}

function BesuchZeile({
  eintrag,
  besuche,
  bearbeitet,
  widerruf,
  laeuft,
  onBearbeiten,
  onWiderruf,
  onAendern,
  onWiderrufen,
}: {
  eintrag: BesuchAnzeige
  besuche: readonly Besuch[]
  bearbeitet: { id: string; wert: BesuchFormularWert } | null
  widerruf: string | null
  laeuft: boolean
  onBearbeiten: (wert: { id: string; wert: BesuchFormularWert } | null) => void
  onWiderruf: (id: string | null) => void
  onAendern: () => void
  onWiderrufen: (id: string) => void
}) {
  const inBearbeitung = bearbeitet?.id === eintrag.id
  const imWiderruf = widerruf === eintrag.id

  return (
    <li className="min-w-0">
      <article
        data-besuch={eintrag.id}
        className="flex h-full w-full min-w-0 flex-col rounded-2xl border border-line-200 bg-surface-0 px-3 py-3"
      >
        <h3 className="break-words text-sm font-semibold leading-5 text-brand-800">{eintrag.titel}</h3>
        {eintrag.landLabel ? (
          <p className="break-words text-xs leading-5 text-ink-800">{eintrag.landLabel}</p>
        ) : null}
        <p data-besuch-zeit={eintrag.zeitGenauigkeit} className="break-words text-xs leading-5 text-ink-700">
          {eintrag.zeitText}
        </p>
        {eintrag.wiederholungText ? (
          <p className="break-words text-xs leading-5 text-brand-700">{eintrag.wiederholungText}</p>
        ) : null}

        {imWiderruf ? (
          <div className="mt-2 border-t border-line-100 pt-2">
            <p className="text-xs leading-5 text-ink-800">{BESUCHE_COPY.widerrufenFrage}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={laeuft}
                onClick={() => onWiderrufen(eintrag.id)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-danger-600 px-4 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {BESUCHE_COPY.widerrufenBestaetigen}
              </button>
              <button
                type="button"
                disabled={laeuft}
                onClick={() => onWiderruf(null)}
                className={aktionKlasse}
              >
                {BESUCHE_COPY.abbrechen}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2 border-t border-line-100 pt-2">
            <button
              type="button"
              disabled={laeuft}
              aria-expanded={inBearbeitung}
              onClick={() => {
                const besuch = besuche.find((eintragBesuch) => eintragBesuch.id === eintrag.id)
                if (!besuch) return
                onBearbeiten(inBearbeitung ? null : { id: besuch.id, wert: formularWertAus(besuch) })
              }}
              className={aktionKlasse}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              {BESUCHE_COPY.bearbeiten}
            </button>
            <button
              type="button"
              disabled={laeuft}
              onClick={() => onWiderruf(eintrag.id)}
              className={aktionKlasse}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              {BESUCHE_COPY.widerrufen}
            </button>
          </div>
        )}

        {inBearbeitung && bearbeitet ? (
          <div className="mt-3">
            <AccountBesuchFormular
              titel={BESUCHE_COPY.aendernTitel}
              aktionText={BESUCHE_COPY.aendernAktion}
              wert={bearbeitet.wert}
              onWert={(wert) => onBearbeiten({ id: bearbeitet.id, wert })}
              onAbsenden={onAendern}
              onAbbrechen={() => onBearbeiten(null)}
              laeuft={laeuft}
              zeitNebeneinander={false}
            />
          </div>
        ) : null}
      </article>
    </li>
  )
}
