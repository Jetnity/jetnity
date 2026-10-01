'use client'

import * as React from 'react'
import { AlertCircle, Check, ChevronDown, RotateCcw } from 'lucide-react'

import LandFeld from '@/components/country/LandFeld'
import { landAnzeigeText, landPraefixText } from '@/lib/country/darstellung'
import {
  MEHRERE_REISENDE_HINWEIS,
  READINESS_ART_BEZEICHNUNG,
  READINESS_GRUPPE,
  READINESS_GRUPPE_TITEL,
  SENSITIVE_HINWEIS,
  nutzerstandText,
  officialFehlendeAngabenText,
  officialListeHinweis,
  officialPruefungAusEvaluations,
  officialStatusText,
} from '@/lib/readiness/bezeichnungen'
import type { OfficialEvaluation } from '@/lib/readiness/official'
import { officialChecklist, type OfficialChecklistEintrag } from '@/lib/readiness/official-presentation'
import { gruppenUnterschiede, slotMissingFactsErgaenzen, travellerSlots } from '@/lib/readiness/party'
import {
  PREPARATION_BEREICHE,
  PREPARATION_DISCLAIMER,
  PREPARATION_PREMIUM_EXPERIENCE,
  preparationPersoenlichAufteilen,
  preparationPlatzhalterGruppe,
  preparationPlatzhalterZeile,
  preparationUebersichtStatus,
  type PreparationBereichId,
} from '@/lib/readiness/preparation-premium-experience-5'
import { readinessAnsicht, readinessZusammenfassungText } from '@/lib/readiness/status'
import {
  readinessWorkspaceSichtbar,
  readinessWorkspaceZusammenfassung,
} from '@/lib/readiness/workspace-presentation'
import {
  citizenshipClientRefFuer,
  dokumenteAlsPayload,
  dokumenteAusTraveller,
  dokumenteNachCitizenships,
  neueDokumentClientRef,
  type DokumentFormularZeile,
} from '@/lib/readiness/dokument-formular'
import { DOKUMENT_LEBENSZYKLUS_COPY } from '@/lib/traveller/dokument-lebenszyklus-copy'
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
  officialEvaluations,
  onSetzen,
  onEntfernen,
  onTravellerSetzen,
  onTravellerEntfernen,
  registryUebernahme,
}: {
  reise: Trip
  officialEvaluations?: OfficialEvaluation[]
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
  const [offen, setOffen] = React.useState(false)
  const [meldung, setMeldung] = React.useState('')
  const [titel, setTitel] = React.useState('')
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
  const persoenlich = preparationPersoenlichAufteilen(sichtbareItems)
  const anwendbareSlots = slots.filter((slot) => slot.applicable)
  const fehlendeFakten = [...new Set(anwendbareSlots.flatMap((slot) => slot.missingFacts))]
  const pruefung = officialPruefungAusEvaluations(evaluations)
  const uebersichtStatus = preparationUebersichtStatus(pruefung, officialStatusText(summary.officialStatus))

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
      <p className="mt-1 text-sm leading-6 text-ink-800">{readinessZusammenfassungText(sichtbareZusammenfassung)}</p>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        <Zahl label="Offen" wert={sichtbareZusammenfassung.open} />
        <Zahl label="Erledigt" wert={sichtbareZusammenfassung.done} />
        <Zahl label="Erneut prüfen" wert={sichtbareZusammenfassung.stale} />
        <Zahl label="Nicht relevant" wert={sichtbareZusammenfassung.skipped} />
      </dl>

      <p className="mt-3 rounded-xl bg-surface-25 px-[12px] py-2 text-xs leading-5 text-ink-800" role="status">
        {uebersichtStatus}. {PREPARATION_DISCLAIMER}
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
        className="mt-3 inline-flex min-h-[44px] w-full items-center justify-between gap-[12px] rounded-full border border-line-200 px-[16px] text-left text-sm font-semibold break-words text-brand-800 transition hover:border-line-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
      >
        {offen ? 'Vorbereitung schliessen' : 'Vorbereitung öffnen'}
        <ChevronDown className={cn('h-4 w-4', offen && 'rotate-180')} aria-hidden="true" />
      </button>

      <div
        id="reisevorbereitung-detail"
        hidden={!offen}
        className={
          offen
            ? 'mt-4 grid w-full min-w-0 max-w-full grid-cols-1 gap-3'
            : 'hidden'
        }
      >
        <nav aria-label="Bereiche der Vorbereitung" className="grid w-full grid-cols-1 gap-2">
          {PREPARATION_BEREICHE.map((bereich) => (
            <a
              key={bereich.id}
              href={`#preparation-${bereich.id}`}
              className="block min-h-[44px] w-full min-w-0 break-words rounded-2xl border border-line-200 px-[12px] py-[10px] text-sm font-semibold leading-5 text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
            >
              {bereich.titel}
            </a>
          ))}
        </nav>

        <Bereich
          id="reisende-dokumente"
          hinweis={
            fehlendeFakten.length > 0
              ? officialFehlendeAngabenText(fehlendeFakten)
              : `${anwendbareSlots.length} ${anwendbareSlots.length === 1 ? 'Person' : 'Personen'}`
          }
        >
          <p className="text-xs leading-5 text-ink-800">
            Mehrere Staatsbürgerschaften und Reisedokumente sind möglich. Jetnity fragt nur notwendige Angaben.
            Keine Passnummern, keine Gesundheitsdaten.
          </p>
          <p className="text-xs leading-5 text-ink-800">{DOKUMENT_LEBENSZYKLUS_COPY.reiseHinweis}</p>
          {registryUebernahme}
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
              onTravellerSetzen={onTravellerSetzen}
              onTravellerEntfernen={onTravellerEntfernen}
              onFehler={setMeldung}
            />
          ))}
        </Bereich>

        <Bereich
          id="offizielle-anforderungen"
          hinweis={officialAbschnittHinweis(checkliste)}
        >
          <p className="text-xs leading-5 text-ink-800">{officialListeHinweis(evaluations)}</p>
          {checkliste.map((gruppe) => {
            const gemeinsam = preparationPlatzhalterGruppe(gruppe.eintraege)
            return (
              <section key={gruppe.id} className="grid gap-2" data-official-group={gruppe.id}>
                <h5 className="text-sm font-semibold text-brand-800">{gruppe.titel}</h5>
                {gemeinsam.art === 'gemeinsam' ? (
                  <p role="status" className="text-sm font-semibold leading-6 text-brand-800">
                    {gemeinsam.zeile}
                  </p>
                ) : null}
                <ul className="grid gap-2">
                  {gruppe.eintraege.map((eintrag, index) => (
                    <OfficialZeile
                      key={`${eintrag.scopeKey}:${index}`}
                      eintrag={eintrag}
                      statusSichtbar={gemeinsam.art !== 'gemeinsam'}
                    />
                  ))}
                </ul>
              </section>
            )
          })}
        </Bereich>

        <Bereich
          id="tickets-buchungen"
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
          hinweis={persoenlich.eigene.length === 0 ? 'Eigene Punkte ohne amtliche Wirkung' : punkteHinweis(persoenlich.eigene)}
        >
          {persoenlich.eigene.length > 0 ? punktListe(persoenlich.eigene) : null}
          {onSetzen ? (
            <form onSubmit={eigeneHinzufuegen} className="grid gap-2">
              <label className="grid gap-1 text-sm font-medium text-brand-800">
                Eigene Vorbereitung
                <input
                  value={titel}
                  onChange={(event) => setTitel(event.target.value)}
                  maxLength={80}
                  className="min-h-[44px] w-full min-w-0 rounded-2xl border border-line-200 px-[12px] text-base text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                  placeholder="z. B. Reiseadapter einpacken"
                />
              </label>
              <p className="text-xs leading-5 text-ink-800">{SENSITIVE_HINWEIS}</p>
              <button
                type="submit"
                className="flex min-h-[44px] w-full items-center justify-center break-words rounded-full bg-brand-800 px-[16px] text-center text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
              >
                Punkt hinzufügen
              </button>
            </form>
          ) : persoenlich.eigene.length === 0 ? (
            <p className="text-xs leading-5 text-ink-800">Noch keine eigene Vorbereitung.</p>
          ) : null}
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

function officialAbschnittHinweis(
  checkliste: ReturnType<typeof officialChecklist>,
): string {
  const eintraege = checkliste.flatMap((gruppe) => gruppe.eintraege)
  if (eintraege.length === 0) return 'Noch keine prüfbaren offiziellen Anforderungen'
  const kompakt = eintraege.filter((eintrag) => eintrag.kompakt).length
  const einzeln = eintraege.length - kompakt
  const teile: string[] = []
  if (einzeln > 0) teile.push(`${einzeln} einzeln sichtbar`)
  if (kompakt > 0) teile.push(`${kompakt} noch nicht prüfbar`)
  return teile.join(' · ')
}

function Bereich({
  id,
  hinweis,
  children,
}: {
  id: PreparationBereichId
  hinweis: string
  children: React.ReactNode
}) {
  const ref = React.useRef<HTMLDetailsElement>(null)
  const bereit = React.useRef(false)
  React.useLayoutEffect(() => {
    if (bereit.current || !ref.current) return
    bereit.current = true
    ref.current.open = true
  }, [])

  return (
    <details
      ref={ref}
      id={`preparation-${id}`}
      data-preparation-section={id}
      className="group/bereich scroll-mt-28 min-w-0 rounded-2xl border border-line-200 bg-surface-25"
    >
      <summary className="flex min-h-[44px] w-full min-w-0 cursor-pointer list-none items-center justify-between gap-[8px] rounded-2xl px-[12px] py-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="block break-words text-sm font-semibold leading-5 text-brand-800">{BEREICH_TITEL[id]}</span>
          <span className="mt-0.5 block break-words text-xs leading-5 text-ink-800">{hinweis}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-brand-800 group-open/bereich:rotate-180" aria-hidden="true" />
      </summary>
      <div className="grid w-full min-w-0 grid-cols-1 gap-3 border-t border-line-200 px-[8px] py-3">{children}</div>
    </details>
  )
}

function OfficialZeile({
  eintrag,
  statusSichtbar,
}: {
  eintrag: OfficialChecklistEintrag
  statusSichtbar: boolean
}) {
  const zeile = preparationPlatzhalterZeile(eintrag.ergebnisText, eintrag.freshnessText)
  return (
    <li
      className={cn(
        'min-w-0 rounded-2xl border border-line-200 bg-white px-[12px] py-3',
        eintrag.kompakt && 'py-2',
      )}
      data-official-requirement-type={eintrag.requirementType ?? undefined}
      data-official-freshness={eintrag.freshness}
      data-official-status={eintrag.status}
      data-official-result={eintrag.result}
      data-official-placeholder-block={eintrag.kompakt ? 'true' : undefined}
    >
      <p className="break-words text-sm font-semibold text-brand-800">{eintrag.titel}</p>
      <p className="mt-0.5 break-words text-xs leading-5 text-ink-800">
        {eintrag.travellerLabel}
        {' · '}
        {eintrag.credentialLabel}
        {eintrag.ortText ? ` · ${eintrag.ortText}` : ''}
      </p>
      {eintrag.kompakt ? (
        statusSichtbar ? (
          <p role="status" className="mt-2 break-words text-sm font-semibold leading-6 text-brand-800">
            {zeile}
          </p>
        ) : (
          <p className="sr-only">{zeile}</p>
        )
      ) : (
        <>
          <p role="status" className="mt-2 break-words text-sm font-semibold leading-6 text-brand-800">
            {eintrag.ergebnisText}
          </p>
          {eintrag.timingTexte.map((text) => (
            <p key={text} className="mt-1 break-words text-xs leading-5 text-ink-800">
              {text}
            </p>
          ))}
          {eintrag.authorityText ? (
            <p className="mt-1 break-words text-xs leading-5 text-ink-800">Stelle {eintrag.authorityText}</p>
          ) : null}
          {eintrag.pruefzeitText ? (
            <p className="mt-1 break-words text-xs leading-5 text-ink-800">{eintrag.pruefzeitText}</p>
          ) : null}
          <p className="mt-1 break-words text-xs leading-5 text-ink-800">{eintrag.freshnessText}</p>
          {eintrag.aktionen.length > 0 ? (
            <div className="mt-2 grid w-full grid-cols-1 gap-2">
              {eintrag.aktionen.map((aktion) => (
                <a
                  key={`${aktion.href}:${aktion.label}`}
                  href={aktion.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-[44px] w-full min-w-0 items-center break-words text-sm font-semibold leading-5 text-brand-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                >
                  {aktion.label}
                </a>
              ))}
            </div>
          ) : null}
        </>
      )}
    </li>
  )
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
              ? ` · ${slots.find((slot) => slot.clientRef === item.travellerClientRef)?.label ?? item.travellerClientRef}`
              : ''}
          </p>
          <p className="mt-0.5 break-words text-xs leading-5 text-ink-800">
            {nutzerstandText(item.userStatus, item.currentness)}
            {' · '}
            {officialStatusText(item.official.status)}
          </p>
        </div>
      </div>
      {onSetzen && item.currentness !== 'not_applicable' && (
        <div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:flex sm:flex-wrap">
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
          {item.kind === 'preparation' && onEntfernen && (
            <button
              type="button"
              className="flex min-h-[44px] w-full items-center justify-center break-words rounded-full px-[12px] text-center text-xs font-semibold text-ink-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 sm:w-auto"
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

function Zahl({ label, wert }: { label: string; wert: number }) {
  return (
    <div className="min-w-0 rounded-xl bg-surface-25 px-[12px] py-2">
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
      <span className="sr-only">{nutzerstandText(status, currentness)}</span>
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
  return (
    <div className="grid min-w-0 gap-1" data-traveller-summary={slot.clientRef}>
      <p className="break-words text-sm font-semibold text-brand-800">{slot.label}</p>
      <p className="break-words text-xs leading-5 text-ink-800">
        {wohnsitz ? landPraefixText('Wohnsitz', wohnsitz) : 'Wohnsitz nicht hinterlegt'}
      </p>
      <p className="break-words text-xs leading-5 text-ink-800">
        Staatsbürgerschaften: {staatsbuergerschaftenText(codes)}
      </p>
      {dokumente.length === 0 ? (
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
  onTravellerSetzen,
  onTravellerEntfernen,
  onFehler,
}: {
  slot: Slot
  tripStart: string | null
  tripEnd: string | null
  onTravellerSetzen?: (eingabe: TravellerEingabe) => Promise<string | null>
  onTravellerEntfernen?: (clientRef: string) => Promise<string | null>
  onFehler: (meldung: string) => void
}) {
  const [residence, setResidence] = React.useState(slot.traveller?.residenceCountryCode ?? '')
  const [citizenships, setCitizenships] = React.useState<string[]>(
    slot.traveller?.citizenships.map((eintrag) => eintrag.countryCode) ?? [''],
  )
  const [documents, setDocuments] = React.useState<DokumentFormularZeile[]>(
    dokumenteAusTraveller(slot.traveller?.documents),
  )

  return (
    <article className="grid w-full min-w-0 max-w-full grid-cols-1 gap-2 rounded-2xl border border-line-200 bg-white px-[12px] py-3">
      <ReisendenZusammenfassung slot={slot} tripStart={tripStart} tripEnd={tripEnd} />
      {onTravellerSetzen ? (
        <details className="group/traveller w-full min-w-0">
          <summary className="flex min-h-[44px] w-full cursor-pointer list-none items-center justify-between gap-[8px] rounded-full px-1 text-sm font-semibold break-words text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 [&::-webkit-details-marker]:hidden">
            Angaben bearbeiten
            <ChevronDown className="h-4 w-4 group-open/traveller:rotate-180" aria-hidden="true" />
          </summary>
          <form
            className="mt-2 grid w-full min-w-0 max-w-full grid-cols-1 gap-2 [&_.grid]:w-full [&_.grid]:min-w-0 [&_.grid]:max-w-full [&_.grid]:grid-cols-1"
            onSubmit={async (event) => {
              event.preventDefault()
              onFehler('')
              const laender = citizenships.map((code) => code.trim().toUpperCase()).filter((code) => /^[A-Z]{2}$/.test(code))
              const fehler = await onTravellerSetzen({
                clientRef: slot.clientRef,
                label: slot.traveller?.label ?? slot.label,
                residenceCountryCode: residence || null,
                citizenships: laender.map((countryCode) => ({
                  clientRef: citizenshipClientRefFuer(countryCode),
                  countryCode,
                })),
                documents: dokumenteAlsPayload(documents, laender),
              })
              if (fehler) onFehler(fehler)
            }}
          >
            <p className="text-xs leading-5 text-ink-800">
              Offizielle Prüfung noch nicht verfügbar. Angaben werden nur erfasst, nicht bewertet.
              {slot.missingFacts.length === 0 ? ' Angaben erfasst.' : ' Für eine zuverlässige Prüfung fehlen Angaben.'}
            </p>
            <fieldset className="grid w-full min-w-0 max-w-full grid-cols-1 gap-2">
              <legend className="text-xs font-medium text-brand-800">Staatsbürgerschaften</legend>
              {citizenships.map((code, index) => (
                <div key={`cit-${index}`} className="grid min-w-0 gap-2">
                  <LandFeld
                    label={`Staatsbürgerschaft ${index + 1}`}
                    value={code}
                    onChange={(naechsterCode) => {
                      const naechste = [...citizenships]
                      naechste[index] = naechsterCode
                      setCitizenships(naechste)
                    }}
                    optional={false}
                  />
                  {citizenships.length > 1 ? (
                    <button
                      type="button"
                      className="min-h-[44px] justify-self-start rounded-full px-[12px] text-xs font-semibold text-ink-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                      onClick={() => {
                        const naechste = citizenships.filter((_, i) => i !== index)
                        setCitizenships(naechste)
                        setDocuments(dokumenteNachCitizenships(documents, naechste))
                      }}
                    >
                      Entfernen
                    </button>
                  ) : null}
                </div>
              ))}
              {citizenships.length < 8 ? (
                <button
                  type="button"
                  className="min-h-[44px] justify-self-start rounded-full px-[12px] text-xs font-semibold text-brand-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                  onClick={() => setCitizenships([...citizenships, ''])}
                >
                  Weitere Staatsbürgerschaft
                </button>
              ) : null}
            </fieldset>
            <LandFeld label="Wohnsitzland, falls relevant" value={residence} onChange={setResidence} />
            <fieldset className="grid w-full min-w-0 max-w-full grid-cols-1 gap-2">
              <legend className="text-xs font-medium text-brand-800">Reisedokumente</legend>
              {documents.map((document, index) => (
                <div key={document.clientRef || `doc-${index}`} className="grid w-full min-w-0 gap-2 rounded-2xl bg-surface-25 px-[12px] py-3">
                  <label className="grid gap-1 text-xs font-medium text-brand-800">
                    Dokument {index + 1}
                    <select
                      value={document.documentType}
                      onChange={(event) => {
                        const naechste = [...documents]
                        naechste[index] = {
                          ...document,
                          documentType: event.target.value as TravellerDocumentType | '',
                        }
                        setDocuments(naechste)
                      }}
                      className="min-h-[44px] w-full min-w-0 rounded-2xl border border-line-200 px-[12px] text-base text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                    >
                      <option value="">Noch nicht angegeben</option>
                      <option value="passport">Reisepass</option>
                      <option value="national_id">Personalausweis</option>
                    </select>
                  </label>
                  {document.documentType ? (
                    <>
                      <LandFeld
                        label="Ausstellendes Land"
                        value={document.issuingCountryCode}
                        onChange={(issuingCountryCode) => {
                          const naechste = [...documents]
                          naechste[index] = { ...document, issuingCountryCode }
                          setDocuments(naechste)
                        }}
                      />
                      <label className="grid gap-1 text-xs font-medium text-brand-800">
                        Ablaufdatum, falls bekannt
                        <input
                          type="date"
                          value={document.expiresOn}
                          onChange={(event) => {
                            const naechste = [...documents]
                            naechste[index] = { ...document, expiresOn: event.target.value }
                            setDocuments(naechste)
                          }}
                          className="min-h-[44px] w-full min-w-0 rounded-2xl border border-line-200 px-[12px] text-base text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                        />
                      </label>
                      <DokumentReiseAblaufHinweis
                        expiresOn={document.expiresOn || null}
                        tripStart={tripStart}
                        tripEnd={tripEnd}
                      />
                      {citizenships.some((code) => /^[A-Z]{2}$/.test(code.trim())) ? (
                        <label className="grid gap-1 text-xs font-medium text-brand-800">
                          Zugeordnete Staatsbürgerschaft
                          <select
                            value={document.citizenshipClientRef ?? ''}
                            onChange={(event) => {
                              const naechste = [...documents]
                              naechste[index] = {
                                ...document,
                                citizenshipClientRef: event.target.value || null,
                              }
                              setDocuments(naechste)
                            }}
                            className="min-h-[44px] w-full min-w-0 rounded-2xl border border-line-200 px-[12px] text-base text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                          >
                            <option value="">Noch nicht zugeordnet</option>
                            {[...new Set(citizenships.map((code) => code.trim().toUpperCase()).filter((code) => /^[A-Z]{2}$/.test(code)))].map(
                              (code) => (
                                <option key={code} value={citizenshipClientRefFuer(code)}>
                                  {landAnzeigeText(code)}
                                </option>
                              ),
                            )}
                          </select>
                        </label>
                      ) : null}
                    </>
                  ) : null}
                  {documents.length > 1 ? (
                    <button
                      type="button"
                      className="min-h-[44px] justify-self-start rounded-full px-[12px] text-xs font-semibold text-ink-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                      onClick={() => setDocuments(documents.filter((_, i) => i !== index))}
                    >
                      Dokument entfernen
                    </button>
                  ) : null}
                </div>
              ))}
              {documents.length < 12 ? (
                <button
                  type="button"
                  className="min-h-[44px] justify-self-start rounded-full px-[12px] text-xs font-semibold text-brand-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
                  onClick={() =>
                    setDocuments([
                      ...documents,
                      {
                        clientRef: neueDokumentClientRef(),
                        documentType: '',
                        issuingCountryCode: '',
                        expiresOn: '',
                        citizenshipClientRef: null,
                      },
                    ])
                  }
                >
                  Weiteres Dokument
                </button>
              ) : null}
            </fieldset>
            <p className="text-xs leading-5 text-ink-800">{SENSITIVE_HINWEIS}</p>
            <div className="grid w-full grid-cols-1 gap-2">
              <button
                type="submit"
                className="flex min-h-[44px] w-full items-center justify-center break-words rounded-full bg-brand-800 px-[16px] text-center text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
              >
                Angaben speichern
              </button>
              {slot.persisted && onTravellerEntfernen && (
                <button
                  type="button"
                  className="min-h-[44px] rounded-full px-[12px] text-xs font-semibold text-ink-800 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15"
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
      className={cn(
        'flex min-h-[44px] w-full min-w-0 items-center justify-center break-words rounded-full px-[12px] text-center text-xs font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-600/15 sm:inline-flex sm:w-auto',
        aktiv ? 'bg-brand-800 text-white' : 'border border-line-200 text-brand-800',
      )}
    >
      {children}
    </button>
  )
}
