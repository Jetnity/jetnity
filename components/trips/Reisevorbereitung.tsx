'use client'

import * as React from 'react'
import { AlertCircle, Check, ChevronDown, RotateCcw } from 'lucide-react'

import LandFeld from '@/components/country/LandFeld'
import { landAnzeigeText, landPraefixText } from '@/lib/country/darstellung'
import EigeneReisevorbereitung from '@/components/trips/EigeneReisevorbereitung'
import { Hinweis } from '@/components/ui/hinweis'
import type { PersonalSteuerung } from '@/components/trips/usePersonalPreparationLifecycle'
import type { TripTravellerSteuerung } from '@/components/trips/useTripTravellerSnapshotLifecycle'
import { travellerDraftBlocksOfficial,officialTravellerDraftMessage } from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/traveller-draft-guard'
import {
  MEHRERE_REISENDE_HINWEIS,
  READINESS_ART_BEZEICHNUNG,
  READINESS_GRUPPE,
  READINESS_GRUPPE_TITEL,
  SENSITIVE_HINWEIS,
  nutzerstandText,
  officialFehlendeAngabenText,
  officialPruefungAusEvaluations,
  officialStatusText,
} from '@/lib/readiness/bezeichnungen'
import type { OfficialEvaluation } from '@/lib/readiness/official'
import EinreiseKundenanzeige from '@/components/readiness/EinreiseKundenanzeige'
import { einreiseKundenanzeige } from '@/lib/readiness/einreise-kundenanzeige'
import { officialChecklist } from '@/lib/readiness/official-presentation'
import { gruppenUnterschiede, slotMissingFactsErgaenzen, travellerSlots } from '@/lib/readiness/party'
import {
  PREPARATION_BEREICHE,
  PREPARATION_DISCLAIMER,
  PREPARATION_PREMIUM_EXPERIENCE,
  preparationPersoenlichAufteilen,
  preparationStandSatz,
  preparationUebersichtStatus,
  type PreparationBereichId,
} from '@/lib/readiness/preparation-premium-experience-5'
import { readinessAnsicht } from '@/lib/readiness/status'
import {
  readinessWorkspaceSichtbar,
  readinessWorkspaceZusammenfassung,
} from '@/lib/readiness/workspace-presentation'
import { DOKUMENT_LEBENSZYKLUS_COPY } from '@/lib/traveller/dokument-lebenszyklus-copy'
import { KOPFZAHL_WIDERSPRUCH, mehrereReisendeLage } from '@/lib/trips/uebersicht'
import {
  dokumentAblaufGegenReise,
  dokumentReiseAblaufText,
  dokumentReiseAblaufWarnung,
} from '@/lib/traveller/dokument-lebenszyklus'
import type { ReadinessKind, ReadinessUserStatus, TravellerDocumentType, Trip } from '@/types/trips'
import type { ReadinessViewItem } from '@/lib/readiness/domain'
import { cn } from '@/lib/utils'

const DOKUMENT_TYP_LABEL: Record<TravellerDocumentType, string> = {
  passport: 'Reisepass',
  national_id: 'Personalausweis',
  unknown: 'Unbekannt',
}

type TravellerEingabe = {
  clientRef: string
  label: string | null
  residenceCountryCode: string | null
  citizenships: Array<{ clientRef?: string; countryCode: string }>
  documents: Array<{
    clientRef?: string
    documentType: TravellerDocumentType
    issuingCountryCode: string | null
    expiresOn: string | null
    citizenshipClientRef: string | null
  }>
}

type Slot = ReturnType<typeof travellerSlots>[number]

const BEREICH_TITEL = Object.fromEntries(PREPARATION_BEREICHE.map((bereich) => [bereich.id, bereich.titel])) as Record<
  PreparationBereichId,
  string
>

export default function Reisevorbereitung({
  reise,
  officialEvaluations: gelieferteOfficialEvaluations,
  onSetzen,
  onEntfernen,
  onTravellerSetzen,
  onTravellerEntfernen,
  registryUebernahme,
  officialPilot: geliefertesOfficialPilot,
  offeneBereiche,
  onBereichOffen,
  onZiel,
  eigeneSteuerung = null,
  travellerSteuerung = null,
}: {
  reise: Trip
  offeneBereiche: ReadonlySet<PreparationBereichId>
  onBereichOffen: (id: PreparationBereichId, offen: boolean) => void
  onZiel: (id: PreparationBereichId) => void
  eigeneSteuerung?: PersonalSteuerung | null
  travellerSteuerung?: TripTravellerSteuerung | null
  officialEvaluations?: OfficialEvaluation[]
  officialPilot?: React.ReactNode
  registryUebernahme?: React.ReactNode
  onSetzen?: (eingabe: {
    clientRef: string
    kind: ReadinessKind
    userStatus: ReadinessUserStatus
    countryCode: string | null
    tripItemId: string | null
    title: string | null
  }) => Promise<string | null>
  onEntfernen?: (clientRef: string) => Promise<string | null>
  onTravellerSetzen?: (eingabe: TravellerEingabe) => Promise<string | null>
  onTravellerEntfernen?: (clientRef: string) => Promise<string | null>
}) {
  const [meldung, setMeldung] = React.useState('')
  const entwurfOffen = travellerDraftBlocksOfficial(reise, travellerSteuerung)
  const officialEvaluations = entwurfOffen ? undefined : gelieferteOfficialEvaluations
  const officialPilot = entwurfOffen
    ? <p role="status" data-official-draft-blocked className="text-sm leading-6 text-ink-900">{officialTravellerDraftMessage}</p>
    : geliefertesOfficialPilot
  const { items, summary, evaluations } = readinessAnsicht(reise, officialEvaluations)
  const sichtbareItems = readinessWorkspaceSichtbar(items)
  const sichtbareZusammenfassung = readinessWorkspaceZusammenfassung(summary, items)
  const slots = travellerSlots(reise).map((slot) =>
    slotMissingFactsErgaenzen(
      slot,
      evaluations
        .filter((eintrag) => eintrag.travellerClientRef === slot.clientRef)
        .flatMap((eintrag) => eintrag.missingFacts),
    ),
  )
  const unterschiede = gruppenUnterschiede(reise)
  const checkliste = officialChecklist({
    evaluations,
    party: reise.party ?? [],
    slots,
  })
  const einreise = einreiseKundenanzeige({
    evaluations,
    party: reise.party ?? [],
    slots,
    laender: reise.stages.map((etappe) => etappe.countryCode),
  })
  const persoenlich = preparationPersoenlichAufteilen(sichtbareItems)
  const anwendbareSlots = slots.filter((slot) => slot.applicable)
  const fehlendeFakten = [...new Set(anwendbareSlots.flatMap((slot) => slot.missingFacts))]
  const pruefung = officialPruefungAusEvaluations(evaluations)
  const uebersichtStatus = preparationUebersichtStatus(pruefung, officialStatusText(summary.officialStatus))
  const reisendeLage = mehrereReisendeLage(reise)

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

  const punktListe = (liste: readonly ReadinessViewItem[]) => (
    <ul className="grid gap-2">
      {liste.map((item) => (
        <Vorbereitungspunkt
          key={item.clientRef}
          item={item}
          slots={slots}
          onSetzen={onSetzen}
          onEntfernen={onEntfernen}
          setzen={setzen}
          setMeldung={setMeldung}
        />
      ))}
    </ul>
  )

  return (
    <section
      aria-labelledby="reisevorbereitung-titel"
      data-preparation-premium={PREPARATION_PREMIUM_EXPERIENCE}
      className="w-full min-w-0 max-w-full rounded-2xl border border-line-200 bg-white px-[12px] py-4"
    >
      <p className="break-words text-xs font-semibold uppercase tracking-[0.08em] text-brand-600">Einreise & Reisevorbereitung</p>
      <h3 id="reisevorbereitung-titel" className="mt-1 text-base font-semibold tracking-[-0.02em] text-brand-800">
        Was diese Reise offiziell und persönlich braucht
      </h3>
      <p className="mt-1 text-sm leading-6 text-ink-800" data-preparation-stand>
        {preparationStandSatz(sichtbareZusammenfassung)}
      </p>

      <Hinweis
        className="mt-3"
        role="status"
        titel={`${uebersichtStatus}.`}
        aktion={
          fehlendeFakten.length > 0 && onTravellerSetzen ? (
            <a
              href="#preparation-reisende-dokumente"
              onClick={(event) => {
                event.preventDefault()
                onZiel('reisende-dokumente')
              }}
              className="inline-flex min-h-[44px] items-center font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
            >
              Angaben ergänzen
            </a>
          ) : null
        }
      >
        <p>{PREPARATION_DISCLAIMER}</p>
        {reisendeLage === 'hinweis' ? <p data-mehrere-reisende="hinweis">{MEHRERE_REISENDE_HINWEIS}</p> : null}
        {reisendeLage === 'widerspruch' ? <p data-mehrere-reisende="unklar">{KOPFZAHL_WIDERSPRUCH}</p> : null}
        {summary.unknownCountryContext ? (
          <p>Für mindestens eine Etappe ist der Länderkontext nicht vollständig bestimmbar.</p>
        ) : null}
      </Hinweis>

      <div id="reisevorbereitung-detail" className="mt-4 grid w-full min-w-0 max-w-full grid-cols-1 gap-3">
        <nav aria-label="Bereiche der Vorbereitung" className="flex w-full min-w-0 max-w-full flex-wrap gap-2">
          {PREPARATION_BEREICHE.map((bereich) => (
            <a
              key={bereich.id}
              href={`#preparation-${bereich.id}`}
              onClick={(event) => {
                event.preventDefault()
                onZiel(bereich.id)
              }}
              className="inline-flex min-h-[44px] max-w-full items-center break-words rounded-full border border-line-200 px-4 py-2 text-meta font-semibold leading-5 text-brand-800 hover:bg-surface-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
            >
              {bereich.titel}
            </a>
          ))}
        </nav>

        <Bereich
          id="offizielle-anforderungen"
          hervorheben
          offen={offeneBereiche.has('offizielle-anforderungen')}
          onOffen={onBereichOffen}
          hinweis={einreise.satz}
        >
          <div data-official-group={checkliste.map((gruppe) => gruppe.id).join(' ')}>
            <EinreiseKundenanzeige anzeige={einreise} satzZeigen={false} />
          </div>
        </Bereich>

        <Bereich
          id="reisende-dokumente"
          offen={offeneBereiche.has('reisende-dokumente')}
          onOffen={onBereichOffen}
          hinweis={
            fehlendeFakten.length > 0
              ? officialFehlendeAngabenText(fehlendeFakten)
              : `${anwendbareSlots.length} ${anwendbareSlots.length === 1 ? 'Person' : 'Personen'}`
          }
        >
          <p className="max-w-prose text-xs leading-5 text-ink-800">
            Mehrere Staatsbürgerschaften und Reisedokumente sind möglich. Jetnity fragt nur notwendige Angaben.
            Keine Passnummern, keine Gesundheitsdaten.
          </p>
          <p className="text-xs leading-5 text-ink-800">{DOKUMENT_LEBENSZYKLUS_COPY.reiseHinweis}</p>
          {registryUebernahme}
          {officialPilot}
          {unterschiede.mehrereTraveller &&
          (unterschiede.unterschiedlicheCitizenships || unterschiede.unterschiedlicheDokumente) ? (
            <p className="text-xs leading-5 text-ink-800">
              Diese Reisenden haben unterschiedliche Staatsbürgerschaften oder Dokumente. Jede Person wird einzeln
              betrachtet.
            </p>
          ) : null}
          {anwendbareSlots.map((slot) => (
            <ReisendenKarte
              key={slot.clientRef}
              slot={slot}
              tripStart={reise.startDate}
              tripEnd={reise.endDate}
              steuerung={onTravellerSetzen || onTravellerEntfernen ? travellerSteuerung : null}
            />
          ))}
        </Bereich>

        <Bereich
          id="tickets-buchungen"
          offen={offeneBereiche.has('tickets-buchungen')}
          onOffen={onBereichOffen}
          hinweis={
            persoenlich.tickets.length === 0
              ? 'Noch kein Ticket und keine Buchungsbestätigung'
              : punkteHinweis(persoenlich.tickets)
          }
        >
          {persoenlich.tickets.length === 0 ? (
            <p className="text-xs leading-5 text-ink-800">
              Noch kein Ticket und keine Buchungsbestätigung in dieser Reise.
            </p>
          ) : (
            punktListe(persoenlich.tickets)
          )}
        </Bereich>

        {persoenlich.weitere.length > 0 ? (
          <section className="grid gap-3" data-preparation-section="weitere">
            {(['einreise', 'dokumente', 'versicherung', 'bestaetigung', 'sonstiges'] as const).map((gruppe) => {
              const gruppeItems = persoenlich.weitere.filter((item) => READINESS_GRUPPE[item.kind] === gruppe)
              if (gruppeItems.length === 0) return null
              return (
                <div key={gruppe} className="grid gap-2">
                  <h4 className="text-sm font-semibold text-brand-800">{READINESS_GRUPPE_TITEL[gruppe]}</h4>
                  {punktListe(gruppeItems)}
                </div>
              )
            })}
          </section>
        ) : null}

        <Bereich
          id="eigene-vorbereitung"
          offen={offeneBereiche.has('eigene-vorbereitung')}
          onOffen={onBereichOffen}
          hinweis={persoenlich.eigene.length === 0 ? 'Eigene Punkte ohne amtliche Wirkung' : punkteHinweis(persoenlich.eigene)}
        >
          <EigeneReisevorbereitung
            reise={reise}
            items={persoenlich.eigene}
            onSetzen={onSetzen}
            onEntfernen={onEntfernen}
            steuerung={eigeneSteuerung}
            erstellenLabel="Punkt hinzufügen"
          />
        </Bereich>
      </div>

      {meldung && (
        <p className="mt-3 text-sm leading-6 text-brand-800" role="alert">
          {meldung}
        </p>
      )}
    </section>
  )
}

function punkteHinweis(items: readonly ReadinessViewItem[]): string {
  const offen = items.filter((item) => item.currentness === 'current' && item.userStatus === 'open').length
  const erledigt = items.filter((item) => item.currentness === 'current' && item.userStatus === 'done').length
  const erneut = items.filter((item) => item.currentness === 'stale').length
  const teile = [`${items.length} ${items.length === 1 ? 'Punkt' : 'Punkte'}`]
  if (offen > 0) teile.push(`${offen} offen`)
  if (erledigt > 0) teile.push(`${erledigt} erledigt`)
  if (erneut > 0) teile.push(`${erneut} erneut prüfen`)
  return teile.join(' · ')
}

function Bereich({
  id,
  hinweis,
  children,
  offen,
  onOffen,
  hervorheben = false,
}: {
  id: PreparationBereichId
  hinweis: string
  children: React.ReactNode
  offen: boolean
  onOffen: (id: PreparationBereichId, offen: boolean) => void
  hervorheben?: boolean
}) {
  return (
    <details
      open={offen}
      id={`preparation-${id}`}
      data-preparation-section={id}
      className={cn(
        'group/bereich scroll-mt-28 min-w-0 rounded-2xl border bg-surface-25',
        hervorheben ? 'border-brand-800' : 'border-line-200',
      )}
    >
      <summary
        data-preparation-heading
        onClick={(event) => {
          event.preventDefault()
          onOffen(id, !offen)
        }}
        className="flex min-h-[44px] w-full min-w-0 cursor-pointer list-none items-center justify-between gap-[8px] rounded-2xl px-[12px] py-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="block max-w-full break-words text-sm font-semibold leading-5 text-brand-800">{BEREICH_TITEL[id]}</span>
          <span className="mt-0.5 block max-w-full break-words text-xs leading-5 text-ink-800">{hinweis}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-brand-800 group-open/bereich:rotate-180" aria-hidden="true" />
      </summary>
      <div className="grid w-full min-w-0 grid-cols-1 gap-3 border-t border-line-200 px-[8px] py-3 [&>p]:max-w-prose">{children}</div>
    </details>
  )
}

function standFuerKunde(status: ReadinessUserStatus, currentness: 'current' | 'stale' | 'not_applicable'): string {
  if (currentness === 'not_applicable') return 'Für diese Reise nicht anwendbar'
  return nutzerstandText(status, currentness)
}

function Vorbereitungspunkt({
  item,
  slots,
  onSetzen,
  onEntfernen,
  setzen,
  setMeldung,
}: {
  item: ReadinessViewItem
  slots: readonly Slot[]
  onSetzen?: (eingabe: {
    clientRef: string
    kind: ReadinessKind
    userStatus: ReadinessUserStatus
    countryCode: string | null
    tripItemId: string | null
    title: string | null
  }) => Promise<string | null>
  onEntfernen?: (clientRef: string) => Promise<string | null>
  setzen: (
    item: {
      clientRef: string
      kind: ReadinessKind
      countryCode: string | null
      tripItemId: string | null
      title: string | null
    },
    userStatus: ReadinessUserStatus,
  ) => Promise<void>
  setMeldung: (meldung: string) => void
}) {
  return (
    <li
      className="grid w-full min-w-0 grid-cols-1 gap-2 rounded-2xl border border-line-200 bg-white px-[12px] py-3"
      data-readiness-kind={item.kind}
      data-readiness-status={item.userStatus}
      data-readiness-currentness={item.currentness}
    >
      <div className="flex min-w-0 items-start gap-[12px]">
        <StandSymbol status={item.userStatus} currentness={item.currentness} />
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-semibold text-brand-800">
            {item.title ?? READINESS_ART_BEZEICHNUNG[item.kind]}
            {item.countryCode ? ` · ${landAnzeigeText(item.countryCode)}` : ''}
            {item.travellerClientRef
              ? ` · ${slots.find((slot) => slot.clientRef === item.travellerClientRef)?.label ?? 'Reisende Person'}`
              : ''}
          </p>
          <p className="mt-0.5 break-words text-xs leading-5 text-ink-800">
            {standFuerKunde(item.userStatus, item.currentness)}
            {' · '}
            {officialStatusText(item.official.status)}
          </p>
        </div>
      </div>
      {onSetzen && item.currentness !== 'not_applicable' && (
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Dein Stand"
            className="grid w-full min-w-0 grid-cols-3 gap-1 rounded-full border border-line-200 bg-surface-25 p-1 sm:w-auto sm:min-w-[20rem]"
          >
            <StatusKnopf aktiv={item.userStatus === 'open' && item.currentness === 'current'} onClick={() => setzen(item, 'open')}>
              Offen
            </StatusKnopf>
            <StatusKnopf aktiv={item.userStatus === 'done' && item.currentness === 'current'} onClick={() => setzen(item, 'done')}>
              Erledigt
            </StatusKnopf>
            <StatusKnopf
              aktiv={item.userStatus === 'skipped' && item.currentness === 'current'}
              onClick={() => setzen(item, 'skipped')}
            >
              Nicht relevant
            </StatusKnopf>
          </div>
          {item.kind === 'preparation' && onEntfernen && (
            <button
              type="button"
              className="flex min-h-[44px] items-center justify-center break-words rounded-full px-[12px] text-center text-xs font-semibold text-ink-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
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
    </li>
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
      <span className="flex size-[40px] shrink-0 items-center justify-center rounded-xl bg-surface-75 text-brand-800">
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Erneut prüfen</span>
      </span>
    )
  }
  if (status === 'done' && currentness === 'current') {
    return (
      <span className="flex size-[40px] shrink-0 items-center justify-center rounded-xl bg-surface-100 text-brand-700">
        <Check className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Von dir erledigt</span>
      </span>
    )
  }
  return (
    <span className="flex size-[40px] shrink-0 items-center justify-center rounded-xl bg-surface-25 text-ink-800">
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">{standFuerKunde(status, currentness)}</span>
    </span>
  )
}

function staatsbuergerschaftenText(codes: readonly string[]): string {
  const namen = codes.map((code) => landAnzeigeText(code)).filter((name) => name.length > 0)
  if (namen.length === 0) return 'keine hinterlegt'
  return namen.join(', ')
}

function ReisendenZusammenfassung({
  slot,
  tripStart,
  tripEnd,
}: {
  slot: Slot
  tripStart: string | null
  tripEnd: string | null
}) {
  const citizenships = slot.traveller?.citizenships ?? []
  const codes = citizenships.map((eintrag) => eintrag.countryCode)
  const dokumente = slot.traveller?.documents ?? []
  const wohnsitz = slot.traveller?.residenceCountryCode
  const nochNichts = !wohnsitz && codes.length === 0 && dokumente.length === 0
  return (
    <div className="grid min-w-0 gap-1" data-traveller-summary={slot.clientRef}>
      <h5 tabIndex={-1} className="break-words text-sm font-semibold text-brand-800 outline-none">{slot.label}</h5>
      {nochNichts ? (
        <p className="break-words text-xs leading-5 text-ink-800">Noch keine Angaben hinterlegt.</p>
      ) : (
        <>
          <p className="break-words text-xs leading-5 text-ink-800">
            {wohnsitz ? landPraefixText('Wohnsitz', wohnsitz) : 'Wohnsitz nicht hinterlegt'}
          </p>
          <p className="break-words text-xs leading-5 text-ink-800">
            Staatsbürgerschaften: {staatsbuergerschaftenText(codes)}
          </p>
        </>
      )}
      {nochNichts ? null : dokumente.length === 0 ? (
        <p className="text-xs leading-5 text-ink-800">Keine Reisedokument-Metadaten hinterlegt.</p>
      ) : (
        <ul className="grid gap-2">
          {dokumente.map((document) => {
            const gebunden = citizenships.find((eintrag) => eintrag.clientRef === document.citizenshipClientRef)
            return (
              <li key={document.clientRef || document.id} className="min-w-0">
                <p className="break-words text-xs leading-5 text-ink-800">
                  {DOKUMENT_TYP_LABEL[document.documentType]}
                  {document.issuingCountryCode ? ` · ${landAnzeigeText(document.issuingCountryCode)}` : ' · Ausstellungsland nicht hinterlegt'}
                  {gebunden
                    ? ` · Staatsbürgerschaft ${landAnzeigeText(gebunden.countryCode)}`
                    : ' · Staatsbürgerschaft nicht zugeordnet'}
                  {document.expiresOn ? ` · Ablaufdatum ${document.expiresOn}` : ''}
                </p>
                <DokumentReiseAblaufHinweis expiresOn={document.expiresOn} tripStart={tripStart} tripEnd={tripEnd} />
              </li>
            )
          })}
        </ul>
      )}
      {slot.missingFacts.length > 0 ? (
        <p className="text-xs leading-5 text-ink-800">{officialFehlendeAngabenText(slot.missingFacts)}</p>
      ) : (
        <p className="text-xs leading-5 text-ink-800">Angaben erfasst</p>
      )}
    </div>
  )
}

function ReisendenKarte({
  slot,
  tripStart,
  tripEnd,
  steuerung,
}: {
  slot: Slot
  tripStart: string | null
  tripEnd: string | null
  steuerung: TripTravellerSteuerung | null
}) {
  const entwurf = steuerung?.entwurf(slot.clientRef) ?? null
  const intent = steuerung?.intent(slot.clientRef)
  const statusRef = React.useRef<HTMLParagraphElement>(null)
  const entfernenRef = React.useRef<HTMLButtonElement>(null)
  const programmFokus = React.useRef(false)
  const focusTarget = steuerung?.focusTarget ?? null
  const phase = intent?.phase ?? null
  const fokusVerbraucht = steuerung?.fokusVerbraucht
  React.useEffect(() => {
    if (!focusTarget || focusTarget !== slot.clientRef || !phase) return
    const ziel = phase === 'idle' ? entfernenRef.current : statusRef.current
    if (!ziel) return
    programmFokus.current = true
    ziel.focus()
    programmFokus.current = false
    if (document.activeElement === ziel) fokusVerbraucht?.()
  }, [focusTarget, fokusVerbraucht, phase, slot.clientRef])

  const gesperrt = steuerung ? steuerung.speichernGesperrt(slot.clientRef) : true
  const abwesend = Boolean(entwurf && entwurf.hadPresent && entwurf.membership === 'absent' && !entwurf.reentry)

  return (
    <article
      data-preparation-traveller={slot.clientRef}
      data-traveller-phase={intent?.phase ?? 'leer'}
      className="grid w-full min-w-0 max-w-full grid-cols-1 gap-2 rounded-2xl border border-line-200 bg-white px-[12px] py-3"
      onFocusCapture={(event) => {
        if (!steuerung || programmFokus.current) return
        if (!event.nativeEvent.isTrusted) return
        steuerung.interaktion()
      }}
    >
      <ReisendenZusammenfassung slot={slot} tripStart={tripStart} tripEnd={tripEnd} />
      {steuerung && entwurf ? (
        <details className="group/traveller w-full min-w-0">
          <summary className="flex min-h-[44px] w-full cursor-pointer list-none items-center justify-between gap-[8px] rounded-full px-1 text-sm font-semibold break-words text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 [&::-webkit-details-marker]:hidden">
            Angaben bearbeiten
            <ChevronDown className="h-4 w-4 group-open/traveller:rotate-180" aria-hidden="true" />
          </summary>
          <form
            className="mt-2 grid w-full min-w-0 max-w-full grid-cols-1 gap-2 [&>*]:min-w-0 [&>*]:max-w-full [&>p]:max-w-prose [&_.grid]:w-full [&_.grid]:min-w-0 [&_.grid]:max-w-full [&_.grid]:grid-cols-1 [&_select]:max-w-full [&_input]:max-w-full"
            onSubmit={(event) => {
              event.preventDefault()
              steuerung.speichern(slot.clientRef)
            }}
          >
            <p className="text-xs leading-5 text-ink-800">
              Offizielle Prüfung noch nicht verfügbar. Angaben werden nur erfasst, nicht bewertet.
              {slot.missingFacts.length === 0 ? ' Angaben erfasst.' : ' Für eine zuverlässige Prüfung fehlen Angaben.'}
            </p>
            <fieldset className="grid w-full min-w-0 max-w-full grid-cols-1 gap-2">
              <legend className="text-xs font-medium text-brand-800">Staatsbürgerschaften</legend>
              {entwurf.citizenships.map((zeile, index) => (
                <div key={zeile.clientRef} className="grid min-w-0 gap-2">
                  <LandFeld
                    label={`Staatsbürgerschaft ${index + 1}`}
                    value={zeile.countryCode}
                    onChange={(naechsterCode) => steuerung.staatsbuergerschaftSetzen(slot.clientRef, zeile.clientRef, naechsterCode)}
                    optional={false}
                  />
                  {entwurf.citizenships.length > 1 ? (
                    <button
                      type="button"
                      className="min-h-[44px] justify-self-start rounded-full px-[12px] text-xs font-semibold text-ink-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                      onClick={() => steuerung.staatsbuergerschaftEntfernen(slot.clientRef, zeile.clientRef)}
                    >
                      Entfernen
                    </button>
                  ) : null}
                </div>
              ))}
              {entwurf.citizenships.length < 8 ? (
                <button
                  type="button"
                  className="min-h-[44px] justify-self-start rounded-full px-[12px] text-xs font-semibold text-brand-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                  onClick={() => steuerung.staatsbuergerschaftHinzufuegen(slot.clientRef)}
                >
                  Weitere Staatsbürgerschaft
                </button>
              ) : null}
            </fieldset>
            <LandFeld
              label="Wohnsitzland, falls relevant"
              value={entwurf.residenceCountryCode ?? ''}
              onChange={(countryCode) => steuerung.wohnsitzSetzen(slot.clientRef, countryCode)}
            />
            <fieldset className="grid w-full min-w-0 max-w-full grid-cols-1 gap-2">
              <legend className="text-xs font-medium text-brand-800">Reisedokumente</legend>
              {entwurf.documents.map((document, index) => (
                <div key={document.clientRef} className="grid w-full min-w-0 gap-2 rounded-2xl bg-surface-25 px-[12px] py-3">
                  <label className="grid gap-1 text-xs font-medium text-brand-800">
                    Dokument {index + 1}
                    <select
                      value={document.documentType}
                      onChange={(event) =>
                        steuerung.dokumentSetzen(slot.clientRef, document.clientRef, {
                          documentType: event.target.value as TravellerDocumentType | '',
                        })
                      }
                      className="min-h-[44px] w-full min-w-0 rounded-2xl border border-line-200 px-[12px] text-base text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                    >
                      <option value="">Noch nicht angegeben</option>
                      <option value="passport">Reisepass</option>
                      <option value="national_id">Personalausweis</option>
                      {document.documentType === 'unknown' ? <option value="unknown">Unbekannt</option> : null}
                    </select>
                  </label>
                  {document.documentType ? (
                    <>
                      <LandFeld
                        label="Ausstellendes Land"
                        value={document.issuingCountryCode}
                        onChange={(issuingCountryCode) =>
                          steuerung.dokumentSetzen(slot.clientRef, document.clientRef, { issuingCountryCode })
                        }
                      />
                      <label className="grid gap-1 text-xs font-medium text-brand-800">
                        Ablaufdatum, falls bekannt
                        <input
                          type="date"
                          value={document.expiresOn}
                          onChange={(event) =>
                            steuerung.dokumentSetzen(slot.clientRef, document.clientRef, { expiresOn: event.target.value })
                          }
                          className="min-h-[44px] w-full min-w-0 rounded-2xl border border-line-200 px-[12px] text-base text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                        />
                      </label>
                      <DokumentReiseAblaufHinweis
                        expiresOn={document.expiresOn || null}
                        tripStart={tripStart}
                        tripEnd={tripEnd}
                      />
                      <label className="grid gap-1 text-xs font-medium text-brand-800">
                        Zugeordnete Staatsbürgerschaft
                        <select
                          value={document.citizenshipClientRef ?? ''}
                          onChange={(event) =>
                            steuerung.dokumentSetzen(slot.clientRef, document.clientRef, {
                              citizenshipClientRef: event.target.value || null,
                            })
                          }
                          className="min-h-[44px] w-full min-w-0 rounded-2xl border border-line-200 px-[12px] text-base text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                        >
                          <option value="">Noch nicht zugeordnet</option>
                          {entwurf.citizenships.map((zeile, citizenshipIndex) => (
                            <option key={zeile.clientRef} value={zeile.clientRef}>
                              {zeile.countryCode ? landAnzeigeText(zeile.countryCode) : `Ohne Länderangabe ${citizenshipIndex + 1}`}
                            </option>
                          ))}
                        </select>
                      </label>
                    </>
                  ) : null}
                  {entwurf.documents.length > 1 ? (
                    <button
                      type="button"
                      className="min-h-[44px] justify-self-start rounded-full px-[12px] text-xs font-semibold text-ink-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                      onClick={() => steuerung.dokumentEntfernen(slot.clientRef, document.clientRef)}
                    >
                      Dokument entfernen
                    </button>
                  ) : null}
                </div>
              ))}
              {entwurf.documents.length < 12 ? (
                <button
                  type="button"
                  className="min-h-[44px] justify-self-start rounded-full px-[12px] text-xs font-semibold text-brand-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                  onClick={() => steuerung.dokumentHinzufuegen(slot.clientRef)}
                >
                  Weiteres Dokument
                </button>
              ) : null}
            </fieldset>
            <p className="text-xs leading-5 text-ink-800">{SENSITIVE_HINWEIS}</p>
            <div className="grid w-full grid-cols-1 gap-2">
              <button
                type="submit"
                disabled={gesperrt}
                className="flex min-h-[44px] w-full items-center justify-center break-words rounded-full bg-brand-800 px-[16px] text-center text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 disabled:pointer-events-none disabled:opacity-60"
              >
                Angaben speichern
              </button>
            </div>
          </form>
          {intent && intent.satz ? (
            <p ref={statusRef} tabIndex={-1} role={intent.phase === 'not_sent' ? 'alert' : 'status'} className="break-words text-sm leading-6 text-ink-800 outline-none">
              {intent.satz}
              {intent.phase === 'accepted' && intent.refresh === 'unclear' ? ' Ob die Reise neu geladen wurde, ist nicht bekannt.' : ''}
              {intent.phase === 'consistent' ? ' Die geladenen Angaben stimmen mit der letzten Speicherung überein.' : ''}
            </p>
          ) : (
            <p ref={statusRef} tabIndex={-1} className="sr-only outline-none" />
          )}
          {entwurf.conflict ? (
            <div className="grid w-full grid-cols-1 gap-2">
              <p className="break-words text-sm leading-6 text-ink-800">Die geladenen Angaben haben sich geändert. Speichern bleibt zu, bis du eine Möglichkeit wählst.</p>
              <button type="button" className="min-h-[44px] rounded-full px-[12px] text-xs font-semibold text-brand-800" onClick={() => steuerung.neuLaden(slot.clientRef)}>
                Neu laden
              </button>
              <button type="button" className="min-h-[44px] rounded-full px-[12px] text-xs font-semibold text-brand-800" onClick={() => steuerung.eingabenBehalten(slot.clientRef)}>
                Meine Eingaben behalten
              </button>
            </div>
          ) : null}
          {abwesend ? (
            <div className="grid w-full grid-cols-1 gap-2">
              <p className="break-words text-sm leading-6 text-ink-800">Die gespeicherten Angaben für diesen Reiseplatz sind nicht mehr vorhanden. Der Platz in der Personenzahl bleibt. Eine Person im Konto-Register wurde nicht gelöscht.</p>
              <button type="button" className="min-h-[44px] rounded-full px-[12px] text-xs font-semibold text-brand-800" onClick={() => steuerung.neuErfassen(slot.clientRef)}>
                Angaben für diesen Platz neu erfassen
              </button>
            </div>
          ) : null}
          {intent?.guestBlocked ? (
            <button type="button" className="min-h-[44px] rounded-full px-[12px] text-xs font-semibold text-brand-800" onClick={() => steuerung.gespeicherteReiseLaden()}>
              Gespeicherte Reise laden
            </button>
          ) : null}
          {slot.persisted && entwurf.membership === 'present' ? (
            intent?.phase === 'confirm_remove' ? (
              <div
                className="grid w-full grid-cols-1 gap-2"
                onKeyDown={(event) => {
                  if (event.key !== 'Escape') return
                  event.preventDefault()
                  steuerung.entfernenAbbrechen(slot.clientRef)
                  entfernenRef.current?.focus()
                }}
              >
                <p className="break-words text-sm leading-6 text-ink-800">{intent.satz}</p>
                <button type="button" className="min-h-[44px] rounded-full bg-brand-800 px-[16px] text-sm font-semibold text-white" onClick={() => steuerung.entfernenBestaetigen(slot.clientRef)}>
                  Entfernen bestätigen
                </button>
                <button
                  type="button"
                  className="min-h-[44px] rounded-full px-[12px] text-xs font-semibold text-ink-800"
                  onClick={() => {
                    steuerung.entfernenAbbrechen(slot.clientRef)
                    entfernenRef.current?.focus()
                  }}
                >
                  Abbrechen
                </button>
              </div>
            ) : (
              <button
                ref={entfernenRef}
                type="button"
                className="min-h-[44px] rounded-full px-[12px] text-xs font-semibold text-ink-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                onClick={() => steuerung.entfernenAnfragen(slot.clientRef)}
              >
                Angaben entfernen
              </button>
            )
          ) : null}
        </details>
      ) : null}
    </article>
  )
}

function DokumentReiseAblaufHinweis({
  expiresOn,
  tripStart,
  tripEnd,
}: {
  expiresOn: string | null
  tripStart: string | null
  tripEnd: string | null
}) {
  const ablauf = dokumentAblaufGegenReise(expiresOn, tripStart, tripEnd)
  return (
    <p
      role="status"
      className={
        dokumentReiseAblaufWarnung(ablauf)
          ? 'break-words text-sm leading-6 text-red-800'
          : 'break-words text-sm leading-6 text-ink-800'
      }
    >
      {dokumentReiseAblaufText(ablauf)}
    </p>
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
      data-wahl=""
      className={cn(
        'flex min-h-[44px] min-w-0 items-center justify-center break-words rounded-full px-[6px] text-center text-xs font-semibold leading-tight focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15',
        aktiv ? 'bg-brand-800 text-white shadow-card' : 'text-brand-800 hover:bg-white',
      )}
    >
      {children}
    </button>
  )
}
