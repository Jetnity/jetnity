'use client'

import * as React from 'react'
import { AlertCircle, Check, ChevronDown, RotateCcw } from 'lucide-react'

import {
  MEHRERE_REISENDE_HINWEIS,
  READINESS_ART_BEZEICHNUNG,
  READINESS_GRUPPE,
  READINESS_GRUPPE_TITEL,
  SENSITIVE_HINWEIS,
  nutzerstandText,
  officialStatusText,
} from '@/lib/readiness/bezeichnungen'
import { travellerSlots } from '@/lib/readiness/party'
import { readinessAnsicht, readinessZusammenfassungText } from '@/lib/readiness/status'
import type { ReadinessKind, ReadinessUserStatus, TravellerDocumentType, Trip } from '@/types/trips'
import { cn } from '@/lib/utils'

const GRUPPEN = ['einreise', 'dokumente', 'versicherung', 'bestaetigung', 'sonstiges'] as const

export default function Reisevorbereitung({
  reise,
  onSetzen,
  onEntfernen,
  onTravellerSetzen,
  onTravellerEntfernen,
}: {
  reise: Trip
  onSetzen?: (eingabe: {
    clientRef: string
    kind: ReadinessKind
    userStatus: ReadinessUserStatus
    countryCode: string | null
    tripItemId: string | null
    title: string | null
  }) => Promise<string | null>
  onEntfernen?: (clientRef: string) => Promise<string | null>
  onTravellerSetzen?: (eingabe: {
    clientRef: string
    label: string | null
    nationalityCountryCode: string | null
    residenceCountryCode: string | null
    documentType: TravellerDocumentType | null
    documentIssuingCountryCode: string | null
    documentExpiresOn: string | null
  }) => Promise<string | null>
  onTravellerEntfernen?: (clientRef: string) => Promise<string | null>
}) {
  const [offen, setOffen] = React.useState(false)
  const [meldung, setMeldung] = React.useState('')
  const [titel, setTitel] = React.useState('')
  const { items, summary, evaluations } = readinessAnsicht(reise)
  const slots = travellerSlots(reise)

  const setzen = async (
    item: {
      clientRef: string
      kind: ReadinessKind
      countryCode: string | null
      tripItemId: string | null
      title: string | null
    },
    userStatus: ReadinessUserStatus,
  ) => {
    if (!onSetzen) return
    setMeldung('')
    const fehler = await onSetzen({ ...item, userStatus })
    if (fehler) setMeldung(fehler)
  }

  const eigeneHinzufuegen = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!onSetzen) return
    setMeldung('')
    const fehler = await onSetzen({
      clientRef: `preparation:${titel.trim().toLowerCase().slice(0, 40)}`,
      kind: 'preparation',
      userStatus: 'open',
      countryCode: null,
      tripItemId: null,
      title: titel,
    })
    if (fehler) setMeldung(fehler)
    else setTitel('')
  }

  return (
    <section aria-labelledby="reisevorbereitung-titel" className="rounded-2xl border border-line-200 bg-white px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Einreise & Reisevorbereitung</p>
      <h3 id="reisevorbereitung-titel" className="mt-1 text-base font-semibold tracking-[-0.02em] text-brand-800">
        Was diese Reise offiziell und persönlich braucht
      </h3>
      <p className="mt-1 text-sm leading-6 text-ink-800">{readinessZusammenfassungText(summary)}</p>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <Zahl label="Offen" wert={summary.open} />
        <Zahl label="Erledigt" wert={summary.done} />
        <Zahl label="Erneut prüfen" wert={summary.stale} />
        <Zahl label="Nicht relevant" wert={summary.skipped} />
      </dl>

      <p className="mt-3 rounded-xl bg-surface-25 px-3 py-2 text-xs leading-5 text-ink-800" role="status">
        Automatische Einreiseprüfung derzeit nicht verfügbar. {officialStatusText(summary.officialStatus)}. Ein
        Häkchen ist keine offizielle Visa- oder Einreisebestätigung.
      </p>

      {summary.individualClaimsForbidden && (
        <p className="mt-2 text-xs leading-5 text-ink-800">{MEHRERE_REISENDE_HINWEIS}</p>
      )}
      {summary.unknownCountryContext && (
        <p className="mt-2 text-xs leading-5 text-ink-800">
          Für mindestens eine Etappe ist der Länderkontext nicht vollständig bestimmbar.
        </p>
      )}

      <button
        type="button"
        aria-expanded={offen}
        aria-controls="reisevorbereitung-detail"
        onClick={() => setOffen((wert) => !wert)}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-between rounded-full border border-line-200 px-4 text-sm font-semibold text-brand-800 transition hover:border-line-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
      >
        {offen ? 'Vorbereitung schliessen' : 'Vorbereitung öffnen'}
        <ChevronDown className={cn('h-4 w-4', offen && 'rotate-180')} aria-hidden="true" />
      </button>

      <div id="reisevorbereitung-detail" hidden={!offen} className="mt-4 grid gap-4">
        <section className="grid gap-2">
          <h4 className="text-sm font-semibold text-brand-800">Reisendenkontext</h4>
          <p className="text-xs leading-5 text-ink-800">
            Jetnity fragt nur fehlende Angaben. Keine Passnummern, keine Gesundheitsdaten.
          </p>
          {slots.filter((slot) => slot.applicable).map((slot) => (
            <ReisendenKarte
              key={slot.clientRef}
              slot={slot}
              onTravellerSetzen={onTravellerSetzen}
              onTravellerEntfernen={onTravellerEntfernen}
              onFehler={setMeldung}
            />
          ))}
        </section>

        <section className="grid gap-2">
          <h4 className="text-sm font-semibold text-brand-800">Offizielle Anforderungen</h4>
          <p className="text-xs leading-5 text-ink-800">
            {evaluations.length === 0
              ? 'Noch keine prüfbaren offiziellen Anforderungen.'
              : 'Ohne Provider bleibt jede offizielle Aussage unknown. Unterschiedliche Reisende werden getrennt bewertet.'}
          </p>
          <ul className="grid gap-2">
            {slots
              .filter((slot) => slot.applicable)
              .map((slot) => {
                const eigene = evaluations.filter((eintrag) => eintrag.travellerClientRef === slot.clientRef)
                const required = eigene.filter((eintrag) => eintrag.result === 'required').length
                return (
                  <li key={`off-${slot.clientRef}`} className="rounded-2xl border border-line-200 px-3 py-3">
                    <p className="text-sm font-semibold text-brand-800">{slot.label}</p>
                    <p className="mt-0.5 text-xs leading-5 text-ink-800">
                      {required > 0
                        ? `${required} offiziell erforderlich`
                        : 'Noch nicht automatisch geprüft'}
                      {slot.missingFacts.includes('nationality') ? ' · Staatsangehörigkeit fehlt' : ''}
                    </p>
                  </li>
                )
              })}
          </ul>
        </section>

        {GRUPPEN.map((gruppe) => {
          const gruppeItems = items.filter((item) => READINESS_GRUPPE[item.kind] === gruppe)
          if (gruppe === 'sonstiges' && gruppeItems.length === 0 && !onSetzen) return null
          return (
            <section key={gruppe} className="grid gap-2">
              <h4 className="text-sm font-semibold text-brand-800">{READINESS_GRUPPE_TITEL[gruppe]}</h4>
              {gruppeItems.length === 0 && gruppe !== 'sonstiges' ? (
                <p className="text-xs leading-5 text-ink-800">Noch kein prüfbarer Punkt in diesem Bereich.</p>
              ) : null}
              <ul className="grid gap-2">
                {gruppeItems.map((item) => (
                  <li
                    key={item.clientRef}
                    className="rounded-2xl border border-line-200 px-3 py-3"
                    data-readiness-kind={item.kind}
                    data-readiness-status={item.userStatus}
                    data-readiness-currentness={item.currentness}
                  >
                    <div className="flex items-start gap-3">
                      <StandSymbol status={item.userStatus} currentness={item.currentness} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-brand-800">
                          {item.title ?? READINESS_ART_BEZEICHNUNG[item.kind]}
                          {item.countryCode ? ` · ${item.countryCode}` : ''}
                        </p>
                        <p className="mt-0.5 text-xs leading-5 text-ink-800">
                          {nutzerstandText(item.userStatus, item.currentness)}
                          {' · '}
                          {officialStatusText(item.official.status)}
                        </p>
                        {onSetzen && item.currentness !== 'not_applicable' && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <StatusKnopf
                              aktiv={item.userStatus === 'open' && item.currentness === 'current'}
                              onClick={() => setzen(item, 'open')}
                            >
                              Offen
                            </StatusKnopf>
                            <StatusKnopf
                              aktiv={item.userStatus === 'done' && item.currentness === 'current'}
                              onClick={() => setzen(item, 'done')}
                            >
                              Erledigt
                            </StatusKnopf>
                            <StatusKnopf
                              aktiv={item.userStatus === 'skipped' && item.currentness === 'current'}
                              onClick={() => setzen(item, 'skipped')}
                            >
                              Nicht relevant
                            </StatusKnopf>
                            {item.kind === 'preparation' && onEntfernen && (
                              <button
                                type="button"
                                className="min-h-11 rounded-full px-3 text-xs font-semibold text-ink-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                                onClick={async () => {
                                  setMeldung('')
                                  const fehler = await onEntfernen(item.clientRef)
                                  if (fehler) setMeldung(fehler)
                                }}
                              >
                                Entfernen
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}

        {onSetzen && (
          <form onSubmit={eigeneHinzufuegen} className="grid gap-2 rounded-2xl border border-line-200 px-3 py-3">
            <label className="grid gap-1 text-sm font-medium text-brand-800">
              Eigene Vorbereitung
              <input
                value={titel}
                onChange={(event) => setTitel(event.target.value)}
                maxLength={80}
                className="min-h-11 w-full min-w-0 rounded-2xl border border-line-200 px-3 text-base text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                placeholder="z. B. Reiseadapter einpacken"
              />
            </label>
            <p className="text-xs leading-5 text-ink-800">{SENSITIVE_HINWEIS}</p>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-800 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
            >
              Punkt hinzufügen
            </button>
          </form>
        )}
      </div>

      {meldung && (
        <p className="mt-3 text-sm leading-6 text-brand-800" role="alert">
          {meldung}
        </p>
      )}
    </section>
  )
}

function Zahl({ label, wert }: { label: string; wert: number }) {
  return (
    <div className="rounded-xl bg-surface-25 px-3 py-2">
      <dt className="text-xs text-ink-800">{label}</dt>
      <dd className="text-base font-semibold text-brand-800">{wert}</dd>
    </div>
  )
}

function StandSymbol({
  status,
  currentness,
}: {
  status: ReadinessUserStatus
  currentness: 'current' | 'stale' | 'not_applicable'
}) {
  if (currentness === 'stale') {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-75 text-brand-800">
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Erneut prüfen</span>
      </span>
    )
  }
  if (status === 'done' && currentness === 'current') {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-100 text-brand-700">
        <Check className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Von dir erledigt</span>
      </span>
    )
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-25 text-ink-800">
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">{nutzerstandText(status, currentness)}</span>
    </span>
  )
}

function ReisendenKarte({
  slot,
  onTravellerSetzen,
  onTravellerEntfernen,
  onFehler,
}: {
  slot: ReturnType<typeof travellerSlots>[number]
  onTravellerSetzen?: (eingabe: {
    clientRef: string
    label: string | null
    nationalityCountryCode: string | null
    residenceCountryCode: string | null
    documentType: TravellerDocumentType | null
    documentIssuingCountryCode: string | null
    documentExpiresOn: string | null
  }) => Promise<string | null>
  onTravellerEntfernen?: (clientRef: string) => Promise<string | null>
  onFehler: (meldung: string) => void
}) {
  const [nationality, setNationality] = React.useState(slot.traveller?.nationalityCountryCode ?? '')
  const [residence, setResidence] = React.useState(slot.traveller?.residenceCountryCode ?? '')
  const [documentType, setDocumentType] = React.useState<TravellerDocumentType | ''>(
    slot.traveller?.documentType ?? '',
  )
  const [issuing, setIssuing] = React.useState(slot.traveller?.documentIssuingCountryCode ?? '')
  const [expires, setExpires] = React.useState(slot.traveller?.documentExpiresOn ?? '')

  if (!onTravellerSetzen) {
    return (
      <p className="text-xs leading-5 text-ink-800">
        {slot.label}
        {slot.missingFacts.length > 0 ? ` · fehlend: ${slot.missingFacts.join(', ')}` : ' · Angaben vollständig'}
      </p>
    )
  }

  return (
    <form
      className="grid gap-2 rounded-2xl border border-line-200 px-3 py-3"
      onSubmit={async (event) => {
        event.preventDefault()
        onFehler('')
        const fehler = await onTravellerSetzen({
          clientRef: slot.clientRef,
          label: slot.traveller?.label ?? slot.label,
          nationalityCountryCode: nationality || null,
          residenceCountryCode: residence || null,
          documentType: documentType || null,
          documentIssuingCountryCode: issuing || null,
          documentExpiresOn: expires || null,
        })
        if (fehler) onFehler(fehler)
      }}
    >
      <p className="text-sm font-semibold text-brand-800">{slot.label}</p>
      <label className="grid gap-1 text-xs font-medium text-brand-800">
        Staatsangehörigkeit (ISO-2)
        <input
          value={nationality}
          onChange={(event) => setNationality(event.target.value.toUpperCase())}
          maxLength={2}
          className="min-h-11 w-full min-w-0 rounded-2xl border border-line-200 px-3 text-base text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
          placeholder="z. B. CH"
        />
      </label>
      {slot.missingFacts.includes('residence') && (
        <label className="grid gap-1 text-xs font-medium text-brand-800">
          Wohnsitzland (ISO-2)
          <input
            value={residence}
            onChange={(event) => setResidence(event.target.value.toUpperCase())}
            maxLength={2}
            className="min-h-11 w-full min-w-0 rounded-2xl border border-line-200 px-3 text-base text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
            placeholder="z. B. CH"
          />
        </label>
      )}
      {slot.missingFacts.includes('document_type') && (
        <label className="grid gap-1 text-xs font-medium text-brand-800">
          Reisedokument
          <select
            value={documentType}
            onChange={(event) => setDocumentType(event.target.value as TravellerDocumentType | '')}
            className="min-h-11 w-full min-w-0 rounded-2xl border border-line-200 px-3 text-base text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
          >
            <option value="">Noch nicht angegeben</option>
            <option value="passport">Reisepass</option>
            <option value="national_id">Personalausweis</option>
          </select>
        </label>
      )}
      {slot.missingFacts.includes('document_issuing_country') && documentType && (
        <label className="grid gap-1 text-xs font-medium text-brand-800">
          Ausstellendes Land (ISO-2)
          <input
            value={issuing}
            onChange={(event) => setIssuing(event.target.value.toUpperCase())}
            maxLength={2}
            className="min-h-11 w-full min-w-0 rounded-2xl border border-line-200 px-3 text-base text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
          />
        </label>
      )}
      {slot.missingFacts.includes('document_expiry') && documentType && (
        <label className="grid gap-1 text-xs font-medium text-brand-800">
          Ablaufdatum
          <input
            type="date"
            value={expires}
            onChange={(event) => setExpires(event.target.value)}
            className="min-h-11 w-full min-w-0 rounded-2xl border border-line-200 px-3 text-base text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
          />
        </label>
      )}
      <p className="text-xs leading-5 text-ink-800">{SENSITIVE_HINWEIS}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-brand-800 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
        >
          Angaben speichern
        </button>
        {slot.persisted && onTravellerEntfernen && (
          <button
            type="button"
            className="min-h-11 rounded-full px-3 text-xs font-semibold text-ink-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
            onClick={async () => {
              onFehler('')
              const fehler = await onTravellerEntfernen(slot.clientRef)
              if (fehler) onFehler(fehler)
            }}
          >
            Angaben entfernen
          </button>
        )}
      </div>
    </form>
  )
}

function StatusKnopf({
  aktiv,
  onClick,
  children,
}: {
  aktiv: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={aktiv}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-11 items-center rounded-full px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15',
        aktiv ? 'bg-brand-800 text-white' : 'border border-line-200 text-brand-800',
      )}
    >
      {children}
    </button>
  )
}
