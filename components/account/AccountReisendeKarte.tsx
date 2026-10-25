'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

import type { RegistryWorkflow } from '@/components/account/useAccountRegistryWorkflow'
import LandFeld from '@/components/country/LandFeld'
import { heutigesDatum } from '@/lib/account/naechste-reise'
import { COUNTRY_COPY } from '@/lib/country/copy'
import { landAnzeigeText, landPraefixText } from '@/lib/country/darstellung'
import { landFeldHatAuswahl } from '@/lib/country/land-feld'
import { REGISTRY_COPY, REGISTRY_DOKUMENT_TYP_LABEL } from '@/lib/traveller/account-registry-copy'
import { DOKUMENT_LEBENSZYKLUS_COPY } from '@/lib/traveller/dokument-lebenszyklus-copy'
import {
  registryCitizenshipDoppelt,
  registryKindLimitErreicht,
} from '@/lib/traveller/account-registry-eingabe'
import { registryTravellerAnzeigeName } from '@/lib/traveller/account-registry-anzeige'
import type { AccountRegistryDocument, AccountRegistryTraveller } from '@/lib/traveller/account-registry'
import {
  registryAktuellerBlocker,
  registryListenBild,
  registryWiederholungBereit,
  type RegistryBeleg,
  type RegistryStand,
} from '@/lib/traveller/account-registry-workflow'
import {
  registryAnzahlText,
  registryKompaktkarte,
} from '@/lib/traveller/account-travellers-premium-registry-ux-1'
import { TRAVELLER_DOCUMENT_TYPES } from '@/types/trips'

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

function textFelder(wert: unknown): { label: string; residenceCountryCode: string } {
  const felder = wert as { label?: string; residenceCountryCode?: string } | null
  return { label: felder?.label ?? '', residenceCountryCode: felder?.residenceCountryCode ?? '' }
}

function staatFelder(wert: unknown): { countryCode: string } {
  const felder = wert as { countryCode?: string } | null
  return { countryCode: felder?.countryCode ?? '' }
}

function dokumentFelder(wert: unknown): {
  documentType: string
  issuingCountryCode: string
  citizenshipId: string
  expiresOn: string
} {
  const felder = wert as {
    documentType?: string
    issuingCountryCode?: string
    citizenshipId?: string
    expiresOn?: string
  } | null
  return {
    documentType: felder?.documentType ?? '',
    issuingCountryCode: felder?.issuingCountryCode ?? '',
    citizenshipId: felder?.citizenshipId ?? '',
    expiresOn: felder?.expiresOn ?? '',
  }
}

function erfolgText(aktion: RegistryBeleg['aktion']): string {
  if (aktion === 'traveller-anlegen') return REGISTRY_COPY.erfolgAngelegt
  if (aktion === 'traveller-aendern') return REGISTRY_COPY.erfolgGeaendert
  if (aktion === 'traveller-loeschen') return REGISTRY_COPY.erfolgGeloescht
  if (aktion === 'citizenship-loeschen') return REGISTRY_COPY.erfolgCitizenshipEntfernt
  if (aktion === 'document-loeschen') return REGISTRY_COPY.erfolgDokumentEntfernt
  if (aktion === 'citizenship-anlegen') return REGISTRY_COPY.erfolgCitizenship
  return REGISTRY_COPY.erfolgDokument
}

export function RegistryBelege({
  stand,
  belege,
  erneut,
  lesen,
}: {
  stand: RegistryStand
  belege: readonly RegistryBeleg[]
  erneut: (beleg: RegistryBeleg) => void
  lesen: () => void
}) {
  if (belege.length === 0) return null
  const lesenSichtbar = belege.some((beleg) => {
    if (beleg.ausgang === 'unbestaetigt' || beleg.ausgang === 'abgewiesen') return true
    return registryListenBild(stand, beleg).nichtGeladen
  })
  return (
    <div data-registry-belege="wahr" aria-busy={stand.lesen.offen} className="mt-4 grid gap-3">
      {belege.map((beleg) => {
        const bild = registryListenBild(stand, beleg)
        const blocker = registryAktuellerBlocker(stand, beleg.schluessel)?.id === beleg.id
        return (
          <div
            key={beleg.id}
            data-registry-beleg={beleg.id}
            data-registry-ausgang={beleg.ausgang}
            data-registry-editor={beleg.editor}
            data-registry-epoche={beleg.epoche}
            role={beleg.ausgang === 'abgewiesen' || beleg.ausgang === 'unbestaetigt' ? 'alert' : 'status'}
            className="rounded-2xl border border-brand-100 bg-surface-50 px-4 py-3 text-sm text-brand-800"
          >
            {beleg.ausgang === 'offen' ? <p>{REGISTRY_COPY.speichert}</p> : null}
            {beleg.ausgang === 'gespeichert' ? <p>{erfolgText(beleg.aktion)}</p> : null}
            {beleg.ausgang === 'abgewiesen' ? <p>{beleg.meldung}</p> : null}
            {beleg.ausgang === 'unbestaetigt' ? <p>{REGISTRY_COPY.unbekannt}</p> : null}
            {bild.nichtGeladen ? <p>{REGISTRY_COPY.listeNichtGeladen}</p> : null}
            {bild.neu ? <p>{REGISTRY_COPY.listeNeu}</p> : null}
            {bild.fehlt ? <p>{REGISTRY_COPY.listeFehlt}</p> : null}
            {blocker ? (
              <div className="mt-3 grid gap-2">
                <p>{REGISTRY_COPY.unbekanntWiederholung}</p>
                <p>{REGISTRY_COPY.erneutHinweis}</p>
                <button
                  type="button"
                  className="inline-flex min-h-11 w-full items-center justify-center whitespace-normal rounded-full bg-brand-800 px-4 py-2 text-center text-base font-semibold text-white sm:w-auto"
                  aria-disabled={!registryWiederholungBereit(stand, beleg)}
                  onClick={() => erneut(beleg)}
                >
                  {REGISTRY_COPY.erneutAktion}
                </button>
              </div>
            ) : null}
          </div>
        )
      })}
      {lesenSichtbar ? (
        <button
          type="button"
          disabled={stand.lesen.offen}
          onClick={lesen}
          className="inline-flex min-h-11 w-full items-center justify-center whitespace-normal rounded-full border border-line-200 bg-white px-4 py-2 text-center text-base font-semibold text-brand-800 sm:w-auto"
        >
          {REGISTRY_COPY.erneutLesen}
          <span className="sr-only">. {REGISTRY_COPY.erneutLesenHinweis}</span>
        </button>
      ) : null}
    </div>
  )
}

export default function AccountReisendeKarte({
  traveller,
  verwaltet,
  onVerwalten,
  workflow,
}: {
  traveller: AccountRegistryTraveller
  verwaltet: boolean
  onVerwalten: () => void
  workflow: RegistryWorkflow
}) {
  const schalterRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const loeschenRef = useRef<HTMLElement>(null)
  const warOffen = useRef(false)
  const fokusZiel = useRef<{ ziel: string; editor: string } | null>(null)
  const [fokusSchritt, setFokusSchritt] = useState(0)
  const heute = useSyncExternalStore(ohneKalendertagAbo, leseGeraeteKalendertag, keinServerKalendertag)
  const surface = `reisender:${traveller.id}`
  const aendernEditor = `${surface}:aendern`
  const loeschenEditor = `${surface}:loeschen`
  const staatEditor = `${surface}:citizenship-anlegen`
  const dokumentNeuEditor = `${surface}:document-anlegen`
  const aendern = workflow.stand.slots.find((slot) => slot.editor === aendernEditor)
  const loeschen = workflow.stand.slots.find((slot) => slot.editor === loeschenEditor)
  const staat = workflow.stand.slots.find((slot) => slot.editor === staatEditor)
  const dokumentNeu = workflow.stand.slots.find((slot) => slot.editor === dokumentNeuEditor)
  const dokumentEdit = workflow.stand.slots.find(
    (slot) => slot.offen && slot.surface === surface && slot.editor.startsWith('document:') && slot.editor.endsWith(':aendern'),
  )
  const dokumentLoeschen = workflow.stand.slots.find(
    (slot) => slot.offen && slot.surface === surface && slot.editor.startsWith('document:') && slot.editor.endsWith(':loeschen'),
  )
  const staatLoeschen = workflow.stand.slots.find(
    (slot) => slot.offen && slot.surface === surface && slot.editor.startsWith('citizenship:') && slot.editor.endsWith(':loeschen'),
  )
  const citizenships = traveller.facts.citizenships
  const documents = traveller.facts.documents
  const kompakt = registryKompaktkarte(traveller, heute)
  const staatVoll = registryKindLimitErreicht('citizenship', citizenships.length)
  const dokumentVoll = registryKindLimitErreicht('document', documents.length)
  const panelId = `registry-panel-${traveller.id}`
  const dokumentModus = dokumentEdit?.offen ? dokumentEdit.editor.split(':')[1] ?? null : dokumentNeu?.offen ? 'neu' : null
  const dokumentSlot = dokumentEdit?.offen ? dokumentEdit : dokumentNeu?.offen ? dokumentNeu : null
  const dokument = dokumentSlot ? dokumentFelder(dokumentSlot.felder) : null
  const personFelder = aendern?.offen ? textFelder(aendern.felder) : null
  const neueStaatsbuergerschaft = staat?.offen ? staatFelder(staat.felder).countryCode : ''
  const unterwegs = workflow.unterwegs(surface)
  const belege = workflow.stand.belege.filter((beleg) => beleg.surface === surface)

  useEffect(() => {
    if (verwaltet && !warOffen.current) panelRef.current?.focus()
    warOffen.current = verwaltet
  }, [verwaltet])

  useEffect(() => {
    if (loeschen?.offen) loeschenRef.current?.focus()
  }, [loeschen?.offen])

  function fokusNachCommit(ziel: string, editor: string) {
    fokusZiel.current = { ziel, editor }
    setFokusSchritt((wert) => wert + 1)
  }

  useEffect(() => {
    const wunsch = fokusZiel.current
    if (!wunsch) return
    fokusZiel.current = null
    const aktiv = document.activeElement as HTMLElement | null
    const frei = aktiv == null || aktiv === document.body || aktiv === document.documentElement
    const imFormular = Boolean(
      aktiv?.closest?.(`form[data-registry-editor="${CSS.escape(wunsch.editor)}"]`),
    )
    if (!frei && !imFormular) return
    document.querySelector<HTMLElement>(`[data-fokus="${CSS.escape(wunsch.ziel)}"]`)?.focus()
  }, [fokusSchritt])

  function fokusAuf(ziel: string) {
    document.querySelector<HTMLElement>(`[data-fokus="${CSS.escape(ziel)}"]`)?.focus()
  }

  return (
    <article
      data-registry-innen={`reisender:${traveller.id}`}
      className="min-w-0 rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_16px_50px_rgba(15,46,42,0.06)] sm:p-6"
    >
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
                <li key={eintrag.id} className="max-w-full break-words rounded-full bg-surface-100 px-3 py-1 text-sm font-semibold text-brand-800">
                  {eintrag.label}
                </li>
              ))}
            </ul>
          ) : null}
          {kompakt.dokumente.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2" aria-label={REGISTRY_COPY.dokumenteTitel}>
              {kompakt.dokumente.map((eintrag) => (
                <li key={eintrag.id} className="max-w-full break-words rounded-full bg-surface-50 px-3 py-1 text-sm text-brand-800">
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
          data-fokus={`verwalten:${traveller.id}`}
          aria-expanded={verwaltet}
          aria-controls={panelId}
          onClick={onVerwalten}
          className={verwaltet ? nebenAktion : hauptAktion}
        >
          {verwaltet ? REGISTRY_COPY.verwaltungSchliessen : REGISTRY_COPY.verwalten}
        </button>
      </header>

      <RegistryBelege stand={workflow.stand} belege={belege} erneut={workflow.erneut} lesen={workflow.lesen} />

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
            const offen = staatLoeschen ?? dokumentLoeschen ?? (loeschen?.offen ? loeschen : null)
            if (offen) {
              workflow.schliessen(offen.editor)
              if (offen.editor.startsWith('citizenship:')) fokusAuf(`staat-entfernen:${offen.editor.split(':')[1]}`)
              else if (offen.editor.startsWith('document:')) fokusAuf(`dokument-entfernen:${offen.editor.split(':')[1]}`)
              else fokusAuf(`loeschen:${traveller.id}`)
              return
            }
            schalterRef.current?.focus()
            onVerwalten()
          }}
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              data-fokus={`aendern:${traveller.id}`}
              className={nebenAktion}
              onClick={() => {
                if (aendern?.offen) {
                  workflow.schliessen(aendernEditor)
                  fokusAuf(`aendern:${traveller.id}`)
                  return
                }
                workflow.oeffnen(aendernEditor, surface, {
                  label: traveller.facts.label ?? '',
                  residenceCountryCode: traveller.facts.residenceCountryCode ?? '',
                })
              }}
            >
              {aendern?.offen ? REGISTRY_COPY.abbrechen : REGISTRY_COPY.aendern}
            </button>
            <button
              type="button"
              data-fokus={`loeschen:${traveller.id}`}
              className={gefahrAktion}
              onClick={() => workflow.oeffnen(loeschenEditor, surface, { id: traveller.id })}
            >
              {REGISTRY_COPY.loeschen}
            </button>
          </div>

          {personFelder ? (
            <form
              data-registry-editor={aendernEditor}
              data-registry-epoche={aendern?.epoche ?? 0}
              className="mt-5 grid max-w-xl gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                workflow.senden(aendernEditor)
              }}
            >
              <label className="grid gap-1 text-sm font-medium text-brand-800">
                {REGISTRY_COPY.bezeichnungLabel}
                <input
                  value={personFelder.label}
                  onChange={(event) => workflow.setzen(aendernEditor, { ...personFelder, label: event.target.value })}
                  maxLength={40}
                  autoComplete="off"
                  autoFocus
                  className={feldKlasse}
                />
              </label>
              <LandFeld
                label={REGISTRY_COPY.wohnsitzLabel}
                value={personFelder.residenceCountryCode}
                onChange={(residenceCountryCode) => workflow.setzen(aendernEditor, { ...personFelder, residenceCountryCode })}
              />
              {aendern?.konflikt ? (
                <div className="grid gap-2">
                  <p>{REGISTRY_COPY.konflikt}</p>
                  <button type="button" className={nebenAktion} onClick={() => workflow.uebernehmen(aendernEditor)}>
                    {REGISTRY_COPY.uebernehmen}
                  </button>
                </div>
              ) : null}
              <button type="submit" disabled={unterwegs} className={hauptAktion}>
                {REGISTRY_COPY.speichern}
              </button>
            </form>
          ) : null}

          {loeschen?.offen ? (
            <form
              data-registry-editor={loeschenEditor}
              data-registry-epoche={loeschen?.epoche ?? 0}
              onSubmit={(event) => {
                event.preventDefault()
                workflow.senden(loeschenEditor)
              }}
            >
              <section
                ref={loeschenRef}
                role="alertdialog"
                aria-labelledby={`${traveller.id}-loeschen-titel`}
                tabIndex={-1}
                className="mt-5 scroll-mt-32 rounded-2xl border border-red-200 bg-red-50 p-4 outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
              >
                <h3 id={`${traveller.id}-loeschen-titel`} className="text-sm font-semibold text-red-800">
                  {registryTravellerAnzeigeName(traveller.facts.label)} – {REGISTRY_COPY.loeschenTitel}
                </h3>
                <p className="mt-2 text-sm leading-6 text-red-800">{REGISTRY_COPY.loeschenText}</p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button type="submit" disabled={unterwegs} className={gefahrAktion}>
                    {REGISTRY_COPY.loeschenBestaetigen}
                  </button>
                  <button
                    type="button"
                    className={nebenAktion}
                    onClick={() => {
                      workflow.schliessen(loeschenEditor)
                      fokusAuf(`loeschen:${traveller.id}`)
                    }}
                  >
                    {REGISTRY_COPY.abbrechen}
                  </button>
                </div>
              </section>
            </form>
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
                    data-registry-innen={`citizenship:${citizenship.id}`}
                    data-registry-traeger={traveller.id}
                    className="flex flex-col gap-2 rounded-2xl bg-surface-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="break-words text-sm font-semibold text-brand-800">
                      {landAnzeigeText(citizenship.countryCode)}
                    </span>
                    <button
                      type="button"
                      data-fokus={`staat-entfernen:${citizenship.id}`}
                      className={nebenAktion}
                      onClick={() => workflow.oeffnen(`citizenship:${citizenship.id}:loeschen`, surface, { id: citizenship.id })}
                    >
                      {REGISTRY_COPY.staatsbuergerschaftEntfernen}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {staatLoeschen ? (
              <form
                data-registry-editor={staatLoeschen.editor}
                data-registry-epoche={staatLoeschen.epoche}
                className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  workflow.senden(staatLoeschen.editor)
                }}
              >
                <h3 className="text-sm font-semibold text-red-800">
                  {landAnzeigeText(citizenships.find((eintrag) => `citizenship:${eintrag.id}:loeschen` === staatLoeschen.editor)?.countryCode ?? '')} – {REGISTRY_COPY.loeschenTitel}
                </h3>
                <p className="mt-2 text-sm leading-6 text-red-800">{REGISTRY_COPY.staatsbuergerschaftLoeschenHinweis}</p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button type="submit" disabled={unterwegs} className={gefahrAktion}>
                    {REGISTRY_COPY.staatsbuergerschaftEntfernen}
                  </button>
                  <button
                    type="button"
                    className={nebenAktion}
                    onClick={() => {
                      workflow.schliessen(staatLoeschen.editor)
                      fokusAuf(`staat-entfernen:${staatLoeschen.editor.split(':')[1]}`)
                    }}
                  >
                    {REGISTRY_COPY.abbrechen}
                  </button>
                </div>
              </form>
            ) : null}
            <p className="mt-2 text-xs leading-5 text-ink-700">{REGISTRY_COPY.staatsbuergerschaftLoeschenHinweis}</p>
            {staatVoll ? (
              <p className="mt-3 text-sm text-ink-700">{REGISTRY_COPY.staatsbuergerschaftLimit}</p>
            ) : staat?.offen ? (
              <form
                data-registry-editor={staatEditor}
                data-registry-epoche={staat?.epoche ?? 0}
                className="mt-4 flex flex-col gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  const land = neueStaatsbuergerschaft.trim().toUpperCase()
                  if (!landFeldHatAuswahl(land)) {
                    workflow.hinweis(staatEditor, COUNTRY_COPY.bitteWaehlen)
                    return
                  }
                  if (registryCitizenshipDoppelt(land, citizenships.map((eintrag) => eintrag.countryCode))) {
                    workflow.hinweis(staatEditor, REGISTRY_COPY.staatsbuergerschaftDoppelt)
                    return
                  }
                  workflow.setzen(staatEditor, { countryCode: land })
                  workflow.senden(staatEditor)
                }}
              >
                <LandFeld
                  label={REGISTRY_COPY.staatsbuergerschaftenTitel}
                  value={neueStaatsbuergerschaft}
                  onChange={(countryCode) => workflow.setzen(staatEditor, { countryCode })}
                  optional={false}
                />
                {staat.hinweis ? <p role="alert" className="text-sm text-red-800">{staat.hinweis}</p> : null}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="submit" disabled={unterwegs} className={hauptAktion}>
                    {REGISTRY_COPY.staatsbuergerschaftHinzufuegen}
                  </button>
                  <button
                    type="button"
                    className={nebenAktion}
                    onClick={() => {
                      workflow.schliessen(staatEditor)
                      fokusNachCommit(`staat-knopf:${traveller.id}`, staatEditor)
                    }}
                  >
                    {REGISTRY_COPY.abbrechen}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                data-fokus={`staat-knopf:${traveller.id}`}
                className={`${hauptAktion} mt-4`}
                onClick={() => workflow.oeffnen(staatEditor, surface, { countryCode: '' })}
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
                  const zugeordnet = citizenships.find((staatEintrag) => staatEintrag.clientRef === eintrag.citizenshipClientRef)
                  const zeile = kompakt.dokumente.find((kandidat) => kandidat.id === eintrag.id)
                  return (
                    <li
                      key={eintrag.id}
                      data-registry-innen={`document:${eintrag.id}`}
                      data-registry-traeger={traveller.id}
                      className="rounded-2xl bg-surface-50 px-3 py-3"
                    >
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
                        <p role="status" className={zeile.ablaufWarnung ? 'mt-2 text-sm leading-6 text-red-800' : 'mt-2 text-sm leading-6 text-ink-700'}>
                          {zeile.ablaufText}
                        </p>
                      ) : null}
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          data-fokus={`dokument-aendern:${eintrag.id}`}
                          className={nebenAktion}
                          onClick={() =>
                            workflow.oeffnen(`document:${eintrag.id}:aendern`, surface, {
                              documentType: eintrag.documentType,
                              issuingCountryCode: eintrag.issuingCountryCode ?? '',
                              citizenshipId: '',
                              expiresOn: eintrag.expiresOn ?? '',
                            })
                          }
                        >
                          {REGISTRY_COPY.dokumentAendern}
                        </button>
                        <button
                          type="button"
                          data-fokus={`dokument-entfernen:${eintrag.id}`}
                          className={nebenAktion}
                          onClick={() => workflow.oeffnen(`document:${eintrag.id}:loeschen`, surface, { id: eintrag.id })}
                        >
                          {REGISTRY_COPY.dokumentEntfernen}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
            {dokumentLoeschen ? (
              <form
                data-registry-editor={dokumentLoeschen.editor}
                data-registry-epoche={dokumentLoeschen.epoche}
                className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  workflow.senden(dokumentLoeschen.editor)
                }}
              >
                <h3 className="text-sm font-semibold text-red-800">
                  {dokumentTitel(documents.find((eintrag) => `document:${eintrag.id}:loeschen` === dokumentLoeschen.editor))} – {REGISTRY_COPY.loeschenTitel}
                </h3>
                <p className="mt-2 text-sm leading-6 text-red-800">{REGISTRY_COPY.dokumenteHinweis}</p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button type="submit" disabled={unterwegs} className={gefahrAktion}>
                    {REGISTRY_COPY.dokumentEntfernen}
                  </button>
                  <button
                    type="button"
                    className={nebenAktion}
                    onClick={() => {
                      workflow.schliessen(dokumentLoeschen.editor)
                      fokusAuf(`dokument-entfernen:${dokumentLoeschen.editor.split(':')[1]}`)
                    }}
                  >
                    {REGISTRY_COPY.abbrechen}
                  </button>
                </div>
              </form>
            ) : null}

            {dokumentVoll && (dokumentModus === null || dokumentModus === 'neu') ? (
              <p className="mt-3 text-sm text-ink-700">{REGISTRY_COPY.dokumentLimit}</p>
            ) : null}

            {dokument && dokumentModus && dokumentSlot && !(dokumentVoll && dokumentModus === 'neu') ? (
              <form
                className="mt-4 grid gap-4"
                data-registry-editor={dokumentSlot.editor}
                data-registry-epoche={dokumentSlot.epoche}
                data-registry-dokument-edit={dokumentModus === 'neu' ? '' : dokumentModus}
                onSubmit={(event) => {
                  event.preventDefault()
                  workflow.senden(dokumentSlot.editor)
                }}
              >
                <label className="grid gap-1 text-sm font-medium text-brand-800">
                  {REGISTRY_COPY.dokumentTypLabel}
                  <select
                    value={dokument.documentType}
                    onChange={(event) => workflow.setzen(dokumentSlot.editor, { ...dokument, documentType: event.target.value })}
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
                  onChange={(issuingCountryCode) => workflow.setzen(dokumentSlot.editor, { ...dokument, issuingCountryCode })}
                />
                <label className="grid gap-1 text-sm font-medium text-brand-800">
                  {REGISTRY_COPY.dokumentCitizenshipLabel}
                  <select
                    value={dokument.citizenshipId}
                    onChange={(event) => workflow.setzen(dokumentSlot.editor, { ...dokument, citizenshipId: event.target.value })}
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
                    onChange={(event) => workflow.setzen(dokumentSlot.editor, { ...dokument, expiresOn: event.target.value })}
                    className={feldKlasse}
                  />
                </label>
                {dokumentSlot.konflikt ? (
                  <div className="grid gap-2">
                    <p>{REGISTRY_COPY.konflikt}</p>
                    <button type="button" className={nebenAktion} onClick={() => workflow.uebernehmen(dokumentSlot.editor)}>
                      {REGISTRY_COPY.uebernehmen}
                    </button>
                  </div>
                ) : null}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button type="submit" disabled={unterwegs} className={hauptAktion}>
                    {dokumentModus === 'neu' ? REGISTRY_COPY.dokumentHinzufuegen : REGISTRY_COPY.speichern}
                  </button>
                  <button
                    type="button"
                    className={nebenAktion}
                    onClick={() => {
                      workflow.schliessen(dokumentSlot.editor)
                      fokusNachCommit(
                        dokumentModus === 'neu' ? `dokument-knopf:${traveller.id}` : `dokument-aendern:${dokumentModus}`,
                        dokumentSlot.editor,
                      )
                    }}
                  >
                    {REGISTRY_COPY.abbrechen}
                  </button>
                </div>
              </form>
            ) : dokumentVoll ? null : (
              <button
                type="button"
                data-fokus={`dokument-knopf:${traveller.id}`}
                className={`${hauptAktion} mt-4`}
                onClick={() =>
                  workflow.oeffnen(dokumentNeuEditor, surface, {
                    documentType: '',
                    issuingCountryCode: '',
                    citizenshipId: '',
                    expiresOn: '',
                  })
                }
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

function dokumentTitel(eintrag: AccountRegistryDocument | undefined): string {
  if (!eintrag) return REGISTRY_COPY.dokumenteTitel
  const typ = REGISTRY_DOKUMENT_TYP_LABEL[eintrag.documentType]
  return eintrag.issuingCountryCode ? `${typ}, ${landAnzeigeText(eintrag.issuingCountryCode)}` : typ
}
