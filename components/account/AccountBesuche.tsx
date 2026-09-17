'use client'

// Die Verwaltungsfläche der bestätigten Besuchshistorie.
//
// Sie zeigt dieselbe Karte wie die Kontoübersicht, darunter die Ereignisse als
// Liste. Wiederholte Besuche desselben Ortes bleiben getrennte Zeilen und
// tragen sichtbar, das wievielte Ereignis sie sind – zusammengelegt würden
// drei Aufenthalte in Lissabon wie ein dreifach angezeigter Fehler aussehen.
//
// Nichts hier verändert eine Reise. Bestätigen, ändern und widerrufen greifen
// ausschliesslich auf die eigene Besuchshistorie zu.

import { useRouter } from 'next/navigation'
import { AlertCircle, MapPin, Pencil, Trash2 } from 'lucide-react'
import { useState, useTransition } from 'react'

import AccountBesuchFormular, {
  BESUCH_FORMULAR_LEER,
  besuchEingabeAus,
  type BesuchFormularWert,
} from '@/components/account/AccountBesuchFormular'
import AccountWeltKarte from '@/components/account/AccountWeltKarte'
import type { Besuch } from '@/lib/account/besuche'
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

function formularWertAus(besuch: Besuch): BesuchFormularWert {
  return {
    ort: besuch.placeId && besuch.placeLabel ? { id: besuch.placeId, name: besuch.placeLabel } : null,
    countryCode: besuch.placeId ? '' : (besuch.countryCode ?? ''),
    jahr: besuch.jahr === null ? '' : String(besuch.jahr),
    monat: besuch.monat === null ? '' : String(besuch.monat),
    tag: besuch.tag === null ? '' : String(besuch.tag),
  }
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
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-brand-800 sm:text-5xl">
        {BESUCHE_COPY.seitenTitel}
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-ink-700">{BESUCHE_COPY.seitenLead}</p>
      <p className="mt-2 max-w-xl text-sm leading-6 text-ink-700">{BESUCHE_COPY.seitenHinweis}</p>

      {status ? (
        <p
          role={status.art === 'fehler' ? 'alert' : 'status'}
          data-besuch-status={status.art}
          className={
            status.art === 'fehler'
              ? 'mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800'
              : 'mt-6 rounded-2xl border border-brand-100 bg-surface-50 px-4 py-3 text-sm leading-6 text-brand-800'
          }
        >
          {status.text}
        </p>
      ) : null}

      <AccountWeltKarte welt={welt} besucht={besucht} laender={laender} />

      <section aria-labelledby="account-besuche-liste" className="mt-8">
        <h2
          id="account-besuche-liste"
          className="text-xl font-semibold tracking-[-0.03em] text-brand-800"
        >
          {BESUCHE_COPY.listeTitel}
        </h2>

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
        ) : besuche.length === 0 ? (
          <div className="mt-4 rounded-[26px] border border-dashed border-line-400 bg-white/65 px-6 py-12 text-center sm:px-10">
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
        ) : (
          <ol className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
            {besucht.eintraege.map((eintrag) => {
              const inBearbeitung = bearbeitet?.id === eintrag.id
              const imWiderruf = widerruf === eintrag.id

              return (
                <li key={eintrag.id} className="min-w-0">
                  <article
                    data-besuch={eintrag.id}
                    className="flex h-full w-full min-w-0 flex-col rounded-2xl border border-line-200 bg-surface-0 p-4"
                  >
                    <h3 className="break-words text-sm font-semibold leading-5 text-brand-800">
                      {eintrag.titel}
                    </h3>
                    {eintrag.landLabel ? (
                      <p className="mt-0.5 break-words text-xs leading-5 text-ink-800">
                        {eintrag.landLabel}
                      </p>
                    ) : null}
                    <p
                      data-besuch-zeit={eintrag.zeitGenauigkeit}
                      className="mt-1 break-words text-xs leading-5 text-ink-700"
                    >
                      {eintrag.zeitText}
                    </p>
                    {eintrag.wiederholungText ? (
                      <p className="mt-1 break-words text-xs leading-5 text-brand-700">
                        {eintrag.wiederholungText}
                      </p>
                    ) : null}

                    {imWiderruf ? (
                      <div className="mt-3 border-t border-line-100 pt-3">
                        <p className="text-xs leading-5 text-ink-800">
                          {BESUCHE_COPY.widerrufenFrage}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={laeuft}
                            onClick={() => widerrufen(eintrag.id)}
                            className="inline-flex min-h-11 items-center justify-center rounded-full bg-danger-600 px-4 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            {BESUCHE_COPY.widerrufenBestaetigen}
                          </button>
                          <button
                            type="button"
                            disabled={laeuft}
                            onClick={() => setWiderruf(null)}
                            className="inline-flex min-h-11 items-center justify-center rounded-full border border-line-200 bg-white px-4 text-xs font-semibold text-brand-800 disabled:opacity-60"
                          >
                            {BESUCHE_COPY.abbrechen}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-line-100 pt-3">
                        <button
                          type="button"
                          disabled={laeuft}
                          aria-expanded={inBearbeitung}
                          onClick={() => {
                            const besuch = besuche.find((eintragBesuch) => eintragBesuch.id === eintrag.id)
                            if (!besuch) return
                            setBearbeitet(
                              inBearbeitung ? null : { id: besuch.id, wert: formularWertAus(besuch) },
                            )
                          }}
                          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-line-200 bg-white px-4 text-xs font-semibold text-brand-800 disabled:opacity-60"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          {BESUCHE_COPY.bearbeiten}
                        </button>
                        <button
                          type="button"
                          disabled={laeuft}
                          onClick={() => setWiderruf(eintrag.id)}
                          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-line-200 bg-white px-4 text-xs font-semibold text-brand-800 disabled:opacity-60"
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
                          onWert={(wert) => setBearbeitet({ id: bearbeitet.id, wert })}
                          onAbsenden={aendern}
                          onAbbrechen={() => setBearbeitet(null)}
                          laeuft={laeuft}
                        />
                      </div>
                    ) : null}
                  </article>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      {problem ? null : (
        <section className="mt-8" aria-labelledby="account-besuch-anlegen">
          <h2 id="account-besuch-anlegen" className="sr-only">
            {BESUCHE_COPY.anlegenTitel}
          </h2>
          <AccountBesuchFormular
            titel={BESUCHE_COPY.anlegenTitel}
            aktionText={BESUCHE_COPY.anlegenAktion}
            wert={neu}
            onWert={setNeu}
            onAbsenden={bestaetigen}
            laeuft={laeuft}
          />
        </section>
      )}
    </div>
  )
}
