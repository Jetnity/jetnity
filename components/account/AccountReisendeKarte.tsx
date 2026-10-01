'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useSyncExternalStore, useTransition } from 'react'

import LandFeld from '@/components/country/LandFeld'
import { heutigesDatum } from '@/lib/account/naechste-reise'
import { COUNTRY_COPY } from '@/lib/country/copy'
import { landAnzeigeText, landPraefixText } from '@/lib/country/darstellung'
import { landFeldHatAuswahl } from '@/lib/country/land-feld'
import { REGISTRY_COPY, REGISTRY_DOKUMENT_TYP_LABEL } from '@/lib/traveller/account-registry-copy'
import { DOKUMENT_LEBENSZYKLUS_COPY } from '@/lib/traveller/dokument-lebenszyklus-copy'
import {
  registryCitizenshipAnlegen,
  registryCitizenshipLoeschen,
  registryDocumentAendern,
  registryDocumentAnlegen,
  registryDocumentLoeschen,
  registryTravellerAendern,
  registryTravellerLoeschen,
} from '@/lib/traveller/account-registry-aktionen'
import {
  registryCitizenshipDoppelt,
  registryDokumentFormularAnfang,
  registryKindLimitErreicht,
} from '@/lib/traveller/account-registry-eingabe'
import { registryDokumentCitizenshipId } from '@/lib/traveller/account-registry-anzeige'
import type { AccountRegistryDocument, AccountRegistryTraveller } from '@/lib/traveller/account-registry'
import {
  registryAnzahlText,
  registryKompaktkarte,
} from '@/lib/traveller/account-travellers-premium-registry-ux-1'
import { TRAVELLER_DOCUMENT_TYPES } from '@/types/trips'

type Status = { art: 'erfolg' | 'fehler'; text: string }

const feldKlasse =
  'min-h-11 w-full max-w-full scroll-mt-32 rounded-2xl border border-line-200 bg-white px-3 text-base text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2'

const nebenAktion =
  'inline-flex min-h-11 w-full scroll-mt-32 items-center justify-center whitespace-normal rounded-full border border-line-200 bg-white px-4 py-2 text-center text-base font-semibold leading-tight text-brand-800 hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:opacity-60 sm:w-auto'

const hauptAktion =
  'inline-flex min-h-11 w-full scroll-mt-32 items-center justify-center whitespace-normal rounded-full bg-brand-800 px-4 py-2 text-center text-base font-semibold leading-tight text-white hover:bg-brand-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:opacity-60 sm:w-auto'

const gefahrAktion =
  'inline-flex min-h-11 w-full scroll-mt-32 items-center justify-center whitespace-normal rounded-full border border-red-200 bg-red-50 px-4 py-2 text-center text-base font-semibold leading-tight text-red-800 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:opacity-60 sm:w-auto'

function leseGeraeteKalendertag(): string | null {
  return heutigesDatum()
}

function keinServerKalendertag(): string | null {
  return null
}

function ohneKalendertagAbo(): () => void {
  return () => {}
}

export default function AccountReisendeKarte({
  traveller,
  verwaltet,
  onVerwalten,
  onStatus,
}: {
  traveller: AccountRegistryTraveller
  verwaltet: boolean
  onVerwalten: () => void
  onStatus: (status: Status) => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editiert, setEditiert] = useState(false)
  const [loeschenOffen, setLoeschenOffen] = useState(false)
  const [label, setLabel] = useState(traveller.facts.label ?? '')
  const [wohnsitz, setWohnsitz] = useState(traveller.facts.residenceCountryCode ?? '')
  const [staatOffen, setStaatOffen] = useState(false)
  const [neueStaatsbuergerschaft, setNeueStaatsbuergerschaft] = useState('')
  const [dokument, setDokument] = useState(registryDokumentFormularAnfang)
  const [dokumentModus, setDokumentModus] = useState<string | null>(null)
  const schalterRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const loeschenRef = useRef<HTMLElement>(null)
  const loeschenKnopfRef = useRef<HTMLButtonElement>(null)
  const warOffen = useRef(false)
  const heute = useSyncExternalStore(ohneKalendertagAbo, leseGeraeteKalendertag, keinServerKalendertag)

  const citizenships = traveller.facts.citizenships
  const documents = traveller.facts.documents
  const kompakt = registryKompaktkarte(traveller, heute)
  const staatVoll = registryKindLimitErreicht('citizenship', citizenships.length)
  const dokumentVoll = registryKindLimitErreicht('document', documents.length)
  const panelId = `registry-panel-${traveller.id}`

  useEffect(() => {
    if (verwaltet && !warOffen.current) panelRef.current?.focus()
    if (!verwaltet && warOffen.current) {
      setEditiert(false)
      setLoeschenOffen(false)
      setStaatOffen(false)
      setNeueStaatsbuergerschaft('')
      setDokumentModus(null)
      setDokument(registryDokumentFormularAnfang())
    }
    warOffen.current = verwaltet
  }, [verwaltet])

  useEffect(() => {
    if (loeschenOffen) loeschenRef.current?.focus()
  }, [loeschenOffen])

  function ausfuehren(
    arbeit: () => Promise<{ ok: true; wert: null } | { ok: false; meldung: string }>,
    erfolg: string,
  ) {
    startTransition(async () => {
      const ergebnis = await arbeit()
      if (!ergebnis.ok) {
        onStatus({ art: 'fehler', text: ergebnis.meldung })
        return
      }
      onStatus({ art: 'erfolg', text: erfolg })
      setLoeschenOffen(false)
      setDokument(registryDokumentFormularAnfang())
      setDokumentModus(null)
      setNeueStaatsbuergerschaft('')
      setStaatOffen(false)
      router.refresh()
    })
  }

  function dokumentOeffnen(modus: string, vorbelegt?: AccountRegistryDocument) {
    setStaatOffen(false)
    setDokumentModus(modus)
    setDokument(
      vorbelegt
        ? {
            documentType: vorbelegt.documentType,
            issuingCountryCode: vorbelegt.issuingCountryCode ?? '',
            citizenshipId: registryDokumentCitizenshipId(vorbelegt.citizenshipClientRef, citizenships),
            expiresOn: vorbelegt.expiresOn ?? '',
          }
        : registryDokumentFormularAnfang(),
    )
  }

  return (
    <article className="min-w-0 rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_16px_50px_rgba(15,46,42,0.06)] sm:p-6">
      <header className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="break-words text-xl font-semibold tracking-[-0.03em] text-brand-800">{kompakt.name}</h2>
          <p className="mt-1 break-words text-sm text-ink-700">{kompakt.wohnsitz}</p>
          <p className="mt-2 text-sm leading-6 text-ink-700">
            {registryAnzahlText(
              kompakt.staatsbuergerschaften.length,
              REGISTRY_COPY.kompaktKeineStaatsbuergerschaft,
              REGISTRY_COPY.kompaktStaatsbuergerschaftEinzahl,
              REGISTRY_COPY.kompaktStaatsbuergerschaftMehrzahl,
            )}
            {' · '}
            {registryAnzahlText(
              kompakt.dokumente.length,
              REGISTRY_COPY.kompaktKeineDokumente,
              REGISTRY_COPY.kompaktDokumentEinzahl,
              REGISTRY_COPY.kompaktDokumentMehrzahl,
            )}
          </p>
          {kompakt.staatsbuergerschaften.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label={REGISTRY_COPY.staatsbuergerschaftenTitel}>
              {kompakt.staatsbuergerschaften.map((eintrag) => (
                <li
                  key={eintrag.id}
                  className="max-w-full break-words rounded-full bg-surface-100 px-3 py-1 text-sm font-semibold text-brand-800"
                >
                  {eintrag.label}
                </li>
              ))}
            </ul>
          ) : null}
          {kompakt.dokumente.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2" aria-label={REGISTRY_COPY.dokumenteTitel}>
              {kompakt.dokumente.map((eintrag) => (
                <li
                  key={eintrag.id}
                  className="max-w-full break-words rounded-full bg-surface-50 px-3 py-1 text-sm text-brand-800"
                >
                  {eintrag.typLabel}
                </li>
              ))}
            </ul>
          ) : null}
          {kompakt.ablaufWarnungen > 0 ? (
            <p role="status" className="mt-3 text-sm font-semibold leading-6 text-red-800">
              {registryAnzahlText(
                kompakt.ablaufWarnungen,
                REGISTRY_COPY.kompaktAblaufHinweisEinzahl,
                REGISTRY_COPY.kompaktAblaufHinweisEinzahl,
                REGISTRY_COPY.kompaktAblaufHinweisMehrzahl,
              )}
            </p>
          ) : null}
        </div>
        <button
          ref={schalterRef}
          type="button"
          aria-expanded={verwaltet}
          aria-controls={panelId}
          onClick={onVerwalten}
          className={verwaltet ? nebenAktion : hauptAktion}
        >
          {verwaltet ? REGISTRY_COPY.verwaltungSchliessen : REGISTRY_COPY.verwalten}
        </button>
      </header>

      {verwaltet ? (
        <div
          id={panelId}
          ref={panelRef}
          tabIndex={-1}
          data-registry-verwaltung="offen"
          className="mt-6 scroll-mt-32 outline-none"
          onKeyDown={(event) => {
            if (event.key !== 'Escape') return
            event.preventDefault()
            schalterRef.current?.focus()
            onVerwalten()
          }}
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className={nebenAktion}
              onClick={() => {
                setLabel(traveller.facts.label ?? '')
                setWohnsitz(traveller.facts.residenceCountryCode ?? '')
                setLoeschenOffen(false)
                setEditiert((wert) => !wert)
              }}
            >
              {editiert ? REGISTRY_COPY.abbrechen : REGISTRY_COPY.aendern}
            </button>
            <button
              ref={loeschenKnopfRef}
              type="button"
              className={gefahrAktion}
              onClick={() => {
                setEditiert(false)
                setLoeschenOffen(true)
              }}
            >
              {REGISTRY_COPY.loeschen}
            </button>
          </div>

          {editiert ? (
            <form
              className="mt-5 grid max-w-xl gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                startTransition(async () => {
                  const ergebnis = await registryTravellerAendern({
                    id: traveller.id,
                    label,
                    residenceCountryCode: wohnsitz,
                  })
                  if (!ergebnis.ok) {
                    onStatus({ art: 'fehler', text: ergebnis.meldung })
                    return
                  }
                  onStatus({ art: 'erfolg', text: REGISTRY_COPY.erfolgGeaendert })
                  setEditiert(false)
                  router.refresh()
                })
              }}
            >
              <label className="grid gap-1 text-sm font-medium text-brand-800">
                {REGISTRY_COPY.bezeichnungLabel}
                <input
                  value={label}
                  onChange={(event) => setLabel(event.target.value)}
                  maxLength={40}
                  autoComplete="off"
                  autoFocus
                  className={feldKlasse}
                />
              </label>
              <LandFeld label={REGISTRY_COPY.wohnsitzLabel} value={wohnsitz} onChange={setWohnsitz} />
              <button type="submit" disabled={pending} className={hauptAktion}>
                {REGISTRY_COPY.speichern}
              </button>
            </form>
          ) : null}

          {loeschenOffen ? (
            <section
              ref={loeschenRef}
              role="alertdialog"
              aria-labelledby={`${traveller.id}-loeschen-titel`}
              tabIndex={-1}
              className="mt-5 scroll-mt-32 rounded-2xl border border-red-200 bg-red-50 p-4 outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              <h3 id={`${traveller.id}-loeschen-titel`} className="text-sm font-semibold text-red-800">
                {REGISTRY_COPY.loeschenTitel}
              </h3>
              <p className="mt-2 text-sm leading-6 text-red-800">{REGISTRY_COPY.loeschenText}</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={pending}
                  className={gefahrAktion}
                  onClick={() =>
                    ausfuehren(
                      () => registryTravellerLoeschen({ id: traveller.id }),
                      REGISTRY_COPY.erfolgGeloescht,
                    )
                  }
                >
                  {REGISTRY_COPY.loeschenBestaetigen}
                </button>
                <button
                  type="button"
                  className={nebenAktion}
                  onClick={() => {
                    setLoeschenOffen(false)
                    loeschenKnopfRef.current?.focus()
                  }}
                >
                  {REGISTRY_COPY.abbrechen}
                </button>
              </div>
            </section>
          ) : null}

          <section className="mt-8 max-w-xl">
            <h3 className="text-sm font-semibold text-brand-800">{REGISTRY_COPY.staatsbuergerschaftenTitel}</h3>
            <p className="mt-1 text-sm leading-6 text-ink-700">{REGISTRY_COPY.staatsbuergerschaftenHinweis}</p>
            {citizenships.length === 0 ? (
              <p className="mt-3 text-sm text-ink-700">Noch keine Staatsbürgerschaft hinterlegt.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {citizenships.map((citizenship) => (
                  <li
                    key={citizenship.id}
                    className="flex flex-col gap-2 rounded-2xl bg-surface-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="break-words text-sm font-semibold text-brand-800">
                      {landAnzeigeText(citizenship.countryCode)}
                    </span>
                    <button
                      type="button"
                      disabled={pending}
                      className={nebenAktion}
                      onClick={() =>
                        ausfuehren(
                          () =>
                            registryCitizenshipLoeschen({
                              travellerId: traveller.id,
                              citizenshipId: citizenship.id,
                            }),
                          REGISTRY_COPY.erfolgCitizenshipEntfernt,
                        )
                      }
                    >
                      {REGISTRY_COPY.staatsbuergerschaftEntfernen}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs leading-5 text-ink-700">{REGISTRY_COPY.staatsbuergerschaftLoeschenHinweis}</p>
            {staatVoll ? (
              <p className="mt-3 text-sm text-ink-700">{REGISTRY_COPY.staatsbuergerschaftLimit}</p>
            ) : staatOffen ? (
              <form
                className="mt-4 flex flex-col gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  const land = neueStaatsbuergerschaft.trim().toUpperCase()
                  if (!landFeldHatAuswahl(land)) {
                    onStatus({ art: 'fehler', text: COUNTRY_COPY.bitteWaehlen })
                    return
                  }
                  if (registryCitizenshipDoppelt(land, citizenships.map((eintrag) => eintrag.countryCode))) {
                    onStatus({ art: 'fehler', text: REGISTRY_COPY.staatsbuergerschaftDoppelt })
                    return
                  }
                  ausfuehren(
                    () =>
                      registryCitizenshipAnlegen({
                        travellerId: traveller.id,
                        countryCode: land,
                      }),
                    REGISTRY_COPY.erfolgCitizenship,
                  )
                }}
              >
                <LandFeld
                  label={REGISTRY_COPY.staatsbuergerschaftenTitel}
                  value={neueStaatsbuergerschaft}
                  onChange={setNeueStaatsbuergerschaft}
                  optional={false}
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="submit" disabled={pending} className={hauptAktion}>
                    {REGISTRY_COPY.staatsbuergerschaftHinzufuegen}
                  </button>
                  <button
                    type="button"
                    className={nebenAktion}
                    onClick={() => {
                      setStaatOffen(false)
                      setNeueStaatsbuergerschaft('')
                    }}
                  >
                    {REGISTRY_COPY.abbrechen}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className={`${hauptAktion} mt-4`}
                onClick={() => {
                  setDokumentModus(null)
                  setDokument(registryDokumentFormularAnfang())
                  setStaatOffen(true)
                }}
              >
                {REGISTRY_COPY.staatsbuergerschaftHinzufuegen}
              </button>
            )}
          </section>

          <section className="mt-8 max-w-xl">
            <h3 className="text-sm font-semibold text-brand-800">{REGISTRY_COPY.dokumenteTitel}</h3>
            <p className="mt-1 text-sm leading-6 text-ink-700">{REGISTRY_COPY.dokumenteHinweis}</p>
            <p className="mt-1 text-xs leading-5 text-ink-700">{DOKUMENT_LEBENSZYKLUS_COPY.kontoHinweis}</p>
            {documents.length === 0 ? (
              <p className="mt-3 text-sm text-ink-700">Noch keine Dokument-Metadaten hinterlegt.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {documents.map((eintrag) => {
                  const zugeordnet = citizenships.find((staat) => staat.clientRef === eintrag.citizenshipClientRef)
                  const zeile = kompakt.dokumente.find((kandidat) => kandidat.id === eintrag.id)
                  return (
                    <li key={eintrag.id} className="rounded-2xl bg-surface-50 px-3 py-3">
                      <p className="text-sm font-semibold text-brand-800">
                        {REGISTRY_DOKUMENT_TYP_LABEL[eintrag.documentType]}
                      </p>
                      <p className="mt-1 break-words text-sm text-ink-700">
                        {eintrag.issuingCountryCode
                          ? landPraefixText('Ausstellungsland', eintrag.issuingCountryCode)
                          : 'Ausstellungsland nicht hinterlegt'}
                        {' · '}
                        {zugeordnet
                          ? landPraefixText('Zuordnung', zugeordnet.countryCode)
                          : REGISTRY_COPY.dokumentKeineZuordnung}
                        {eintrag.expiresOn ? ` · Ablaufdatum ${eintrag.expiresOn}` : ''}
                      </p>
                      {zeile?.ablaufSichtbar ? (
                        <p
                          role="status"
                          className={
                            zeile.ablaufWarnung
                              ? 'mt-2 text-sm leading-6 text-red-800'
                              : 'mt-2 text-sm leading-6 text-ink-700'
                          }
                        >
                          {zeile.ablaufText}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          className={nebenAktion}
                          onClick={() => dokumentOeffnen(eintrag.id, eintrag)}
                        >
                          {REGISTRY_COPY.dokumentAendern}
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          className={nebenAktion}
                          onClick={() =>
                            ausfuehren(
                              () =>
                                registryDocumentLoeschen({
                                  travellerId: traveller.id,
                                  documentId: eintrag.id,
                                }),
                              REGISTRY_COPY.erfolgDokumentEntfernt,
                            )
                          }
                        >
                          {REGISTRY_COPY.dokumentEntfernen}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            {dokumentVoll && (dokumentModus === null || dokumentModus === 'neu') ? (
              <p className="mt-3 text-sm text-ink-700">{REGISTRY_COPY.dokumentLimit}</p>
            ) : null}

            {dokumentModus && !(dokumentVoll && dokumentModus === 'neu') ? (
              <form
                className="mt-4 grid gap-4"
                data-registry-dokument-edit={dokumentModus === 'neu' ? '' : dokumentModus}
                onSubmit={(event) => {
                  event.preventDefault()
                  const nutzlast = {
                    travellerId: traveller.id,
                    documentType: dokument.documentType,
                    issuingCountryCode: dokument.issuingCountryCode,
                    citizenshipId: dokument.citizenshipId,
                    expiresOn: dokument.expiresOn,
                  }
                  if (dokumentModus !== 'neu') {
                    ausfuehren(
                      () => registryDocumentAendern({ ...nutzlast, documentId: dokumentModus }),
                      REGISTRY_COPY.erfolgDokument,
                    )
                    return
                  }
                  ausfuehren(() => registryDocumentAnlegen(nutzlast), REGISTRY_COPY.erfolgDokument)
                }}
              >
                <label className="grid gap-1 text-sm font-medium text-brand-800">
                  {REGISTRY_COPY.dokumentTypLabel}
                  <select
                    value={dokument.documentType}
                    onChange={(event) =>
                      setDokument((aktuell) => ({
                        ...aktuell,
                        documentType: event.target.value as typeof aktuell.documentType,
                      }))
                    }
                    className={feldKlasse}
                  >
                    <option value="">{REGISTRY_COPY.dokumentTypPlatzhalter}</option>
                    {TRAVELLER_DOCUMENT_TYPES.map((typ) => (
                      <option key={typ} value={typ}>
                        {REGISTRY_DOKUMENT_TYP_LABEL[typ]}
                      </option>
                    ))}
                  </select>
                </label>
                <LandFeld
                  label={REGISTRY_COPY.dokumentIssuerLabel}
                  hinweis={REGISTRY_COPY.dokumentIssuerHinweis}
                  value={dokument.issuingCountryCode}
                  onChange={(issuingCountryCode) =>
                    setDokument((aktuell) => ({ ...aktuell, issuingCountryCode }))
                  }
                />
                <label className="grid gap-1 text-sm font-medium text-brand-800">
                  {REGISTRY_COPY.dokumentCitizenshipLabel}
                  <select
                    value={dokument.citizenshipId}
                    onChange={(event) =>
                      setDokument((aktuell) => ({ ...aktuell, citizenshipId: event.target.value }))
                    }
                    className={feldKlasse}
                  >
                    <option value="">{REGISTRY_COPY.dokumentKeineZuordnung}</option>
                    {citizenships.map((citizenship) => (
                      <option key={citizenship.id} value={citizenship.id}>
                        {landAnzeigeText(citizenship.countryCode)}
                      </option>
                    ))}
                  </select>
                  <span className="font-normal text-ink-700">{REGISTRY_COPY.dokumentCitizenshipHinweis}</span>
                </label>
                <label className="grid gap-1 text-sm font-medium text-brand-800">
                  {REGISTRY_COPY.dokumentGueltigLabel}
                  <input
                    type="date"
                    value={dokument.expiresOn}
                    onChange={(event) =>
                      setDokument((aktuell) => ({ ...aktuell, expiresOn: event.target.value }))
                    }
                    className={feldKlasse}
                  />
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="submit" disabled={pending} className={hauptAktion}>
                    {dokumentModus === 'neu' ? REGISTRY_COPY.dokumentHinzufuegen : REGISTRY_COPY.speichern}
                  </button>
                  <button
                    type="button"
                    className={nebenAktion}
                    onClick={() => {
                      setDokumentModus(null)
                      setDokument(registryDokumentFormularAnfang())
                    }}
                  >
                    {REGISTRY_COPY.abbrechen}
                  </button>
                </div>
              </form>
            ) : dokumentVoll ? null : (
              <button
                type="button"
                className={`${hauptAktion} mt-4`}
                onClick={() => dokumentOeffnen('neu')}
              >
                {REGISTRY_COPY.dokumentHinzufuegen}
              </button>
            )}
          </section>
        </div>
      ) : null}
    </article>
  )
}
