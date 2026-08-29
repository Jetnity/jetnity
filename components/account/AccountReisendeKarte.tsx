'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { REGISTRY_COPY, REGISTRY_DOKUMENT_TYP_LABEL } from '@/lib/traveller/account-registry-copy'
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
import {
  registryDokumentCitizenshipId,
  registryTravellerAnzeigeName,
} from '@/lib/traveller/account-registry-anzeige'
import type { AccountRegistryTraveller } from '@/lib/traveller/account-registry'
import { TRAVELLER_DOCUMENT_TYPES } from '@/types/trips'

type Status = { art: 'erfolg' | 'fehler'; text: string }

const feldKlasse =
  'min-h-11 w-full rounded-2xl border border-line-200 bg-white px-3 text-sm text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600'

const nebenAktion =
  'inline-flex min-h-11 items-center justify-center rounded-full border border-line-200 bg-white px-4 text-sm font-semibold text-brand-800 hover:bg-surface-50 disabled:opacity-60'

const hauptAktion =
  'inline-flex min-h-11 items-center justify-center rounded-full bg-brand-800 px-4 text-sm font-semibold text-white hover:bg-brand-900 disabled:opacity-60'

const gefahrAktion =
  'inline-flex min-h-11 items-center justify-center rounded-full border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:opacity-60'

export default function AccountReisendeKarte({
  traveller,
  onStatus,
}: {
  traveller: AccountRegistryTraveller
  onStatus: (status: Status) => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editiert, setEditiert] = useState(false)
  const [loeschenOffen, setLoeschenOffen] = useState(false)
  const [label, setLabel] = useState(traveller.facts.label ?? '')
  const [wohnsitz, setWohnsitz] = useState(traveller.facts.residenceCountryCode ?? '')
  const [neueStaatsbuergerschaft, setNeueStaatsbuergerschaft] = useState('')
  const [dokument, setDokument] = useState(registryDokumentFormularAnfang)
  const [dokumentEditId, setDokumentEditId] = useState<string | null>(null)

  const citizenships = traveller.facts.citizenships
  const documents = traveller.facts.documents
  const staatVoll = registryKindLimitErreicht('citizenship', citizenships.length)
  const dokumentVoll = registryKindLimitErreicht('document', documents.length)

  function ausfuehren(arbeit: () => Promise<{ ok: true; wert: null } | { ok: false; meldung: string }>, erfolg: string) {
    startTransition(async () => {
      const ergebnis = await arbeit()
      if (!ergebnis.ok) {
        onStatus({ art: 'fehler', text: ergebnis.meldung })
        return
      }
      onStatus({ art: 'erfolg', text: erfolg })
      setLoeschenOffen(false)
      setDokument(registryDokumentFormularAnfang())
      setDokumentEditId(null)
      setNeueStaatsbuergerschaft('')
      router.refresh()
    })
  }

  return (
    <article className="rounded-[26px] border border-black/5 bg-white p-5 shadow-[0_16px_50px_rgba(15,46,42,0.06)] sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-brand-800">
            {registryTravellerAnzeigeName(traveller.facts.label)}
          </h2>
          <p className="mt-1 text-sm text-ink-700">
            {traveller.facts.residenceCountryCode
              ? `Wohnsitz ${traveller.facts.residenceCountryCode}`
              : REGISTRY_COPY.wohnsitzLeer}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={nebenAktion} onClick={() => setEditiert((wert) => !wert)}>
            {editiert ? REGISTRY_COPY.abbrechen : REGISTRY_COPY.aendern}
          </button>
          <button type="button" className={gefahrAktion} onClick={() => setLoeschenOffen(true)}>
            {REGISTRY_COPY.loeschen}
          </button>
        </div>
      </header>

      {editiert ? (
        <form
          className="mt-5 grid gap-4"
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
              className={feldKlasse}
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-brand-800">
            {REGISTRY_COPY.wohnsitzLabel}
            <input
              value={wohnsitz}
              onChange={(event) => setWohnsitz(event.target.value.toUpperCase())}
              maxLength={2}
              autoComplete="off"
              spellCheck={false}
              className={`${feldKlasse} uppercase`}
            />
          </label>
          <button type="submit" disabled={pending} className={hauptAktion}>
            {REGISTRY_COPY.speichern}
          </button>
        </form>
      ) : null}

      {loeschenOffen ? (
        <section
          role="alertdialog"
          aria-labelledby={`${traveller.id}-loeschen-titel`}
          className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4"
        >
          <h3 id={`${traveller.id}-loeschen-titel`} className="text-sm font-semibold text-red-800">
            {REGISTRY_COPY.loeschenTitel}
          </h3>
          <p className="mt-2 text-sm leading-6 text-red-800">{REGISTRY_COPY.loeschenText}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              className={gefahrAktion}
              onClick={() =>
                ausfuehren(() => registryTravellerLoeschen({ id: traveller.id }), REGISTRY_COPY.erfolgGeloescht)
              }
            >
              {REGISTRY_COPY.loeschenBestaetigen}
            </button>
            <button type="button" className={nebenAktion} onClick={() => setLoeschenOffen(false)}>
              {REGISTRY_COPY.abbrechen}
            </button>
          </div>
        </section>
      ) : null}

      <section className="mt-8">
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
                <span className="text-sm font-semibold text-brand-800">{citizenship.countryCode}</span>
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
        ) : (
          <form
            className="mt-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault()
              const land = neueStaatsbuergerschaft.trim().toUpperCase()
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
            <label className="grid min-w-0 flex-1 gap-1 text-sm font-medium text-brand-800">
              ISO-2
              <input
                value={neueStaatsbuergerschaft}
                onChange={(event) => setNeueStaatsbuergerschaft(event.target.value.toUpperCase())}
                maxLength={2}
                autoComplete="off"
                spellCheck={false}
                className={`${feldKlasse} uppercase`}
              />
            </label>
            <button type="submit" disabled={pending} className={`${hauptAktion} sm:self-end`}>
              {REGISTRY_COPY.staatsbuergerschaftHinzufuegen}
            </button>
          </form>
        )}
      </section>

      <section className="mt-8">
        <h3 className="text-sm font-semibold text-brand-800">{REGISTRY_COPY.dokumenteTitel}</h3>
        <p className="mt-1 text-sm leading-6 text-ink-700">{REGISTRY_COPY.dokumenteHinweis}</p>
        {documents.length === 0 ? (
          <p className="mt-3 text-sm text-ink-700">Noch keine Dokument-Metadaten hinterlegt.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {documents.map((eintrag) => {
              const zugeordnet = citizenships.find((staat) => staat.clientRef === eintrag.citizenshipClientRef)
              return (
                <li key={eintrag.id} className="rounded-2xl bg-surface-50 px-3 py-3">
                  <p className="text-sm font-semibold text-brand-800">
                    {REGISTRY_DOKUMENT_TYP_LABEL[eintrag.documentType]}
                  </p>
                  <p className="mt-1 text-sm text-ink-700">
                    Ausstellungsland {eintrag.issuingCountryCode ?? 'nicht hinterlegt'}
                    {' · '}
                    {zugeordnet
                      ? `Zuordnung ${zugeordnet.countryCode}`
                      : REGISTRY_COPY.dokumentKeineZuordnung}
                    {eintrag.expiresOn ? ` · gültig bis ${eintrag.expiresOn}` : ''}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={nebenAktion}
                      onClick={() => {
                        setDokumentEditId(eintrag.id)
                        setDokument({
                          documentType: eintrag.documentType,
                          issuingCountryCode: eintrag.issuingCountryCode ?? '',
                          citizenshipId: registryDokumentCitizenshipId(eintrag.citizenshipClientRef, citizenships),
                          expiresOn: eintrag.expiresOn ?? '',
                        })
                      }}
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

        {dokumentVoll && !dokumentEditId ? (
          <p className="mt-3 text-sm text-ink-700">{REGISTRY_COPY.dokumentLimit}</p>
        ) : (
          <form
            className="mt-4 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              const nutzlast = {
                travellerId: traveller.id,
                documentType: dokument.documentType,
                issuingCountryCode: dokument.issuingCountryCode,
                citizenshipId: dokument.citizenshipId,
                expiresOn: dokument.expiresOn,
              }
              if (dokumentEditId) {
                ausfuehren(
                  () => registryDocumentAendern({ ...nutzlast, documentId: dokumentEditId }),
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
            <label className="grid gap-1 text-sm font-medium text-brand-800">
              {REGISTRY_COPY.dokumentIssuerLabel}
              <input
                value={dokument.issuingCountryCode}
                onChange={(event) =>
                  setDokument((aktuell) => ({
                    ...aktuell,
                    issuingCountryCode: event.target.value.toUpperCase(),
                  }))
                }
                maxLength={2}
                autoComplete="off"
                spellCheck={false}
                className={`${feldKlasse} uppercase`}
              />
              <span className="font-normal text-ink-700">{REGISTRY_COPY.dokumentIssuerHinweis}</span>
            </label>
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
                    {citizenship.countryCode}
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
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={pending} className={hauptAktion}>
                {dokumentEditId ? REGISTRY_COPY.speichern : REGISTRY_COPY.dokumentHinzufuegen}
              </button>
              {dokumentEditId ? (
                <button
                  type="button"
                  className={nebenAktion}
                  onClick={() => {
                    setDokumentEditId(null)
                    setDokument(registryDokumentFormularAnfang())
                  }}
                >
                  {REGISTRY_COPY.abbrechen}
                </button>
              ) : null}
            </div>
          </form>
        )}
      </section>
    </article>
  )
}
