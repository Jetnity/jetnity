'use client'

// components/trips/TripWorkspace.tsx
//
// Der Reise-Arbeitsbereich. Eine Ansicht für beide Ablagen.
//
// Auf schmalen Viewports gilt zuerst Orientierung, dann Aktion: kompakter Kopf,
// klebende Bereichsnavigation, nur der aktive Bereich. Die Übersicht enthält
// den Tagesplan. Desktop behält die bisherige breite Arbeitsansicht. Der aktive
// Bereich ist Client-State, nicht Teil der URL.
//
// Besuchte Mobile-Bereiche bleiben eingehängt (keine erneute Suche), sind aber
// visuell `display: none`. `hidden` plus Tailwind `grid` würde den Bereich
// semantisch verbergen und trotzdem Layout erzeugen.

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import {
  ARBEITSBEREICH_DESKTOP_AB_PX,
  STANDARD_ARBEITSBEREICH,
  type Arbeitsbereich,
  aenderungIstSichtbar,
  arbeitsbereichLesen,
  bereichDarstellungKlasse,
  bereichSollMounten,
  bereichSollSichtbar,
  bereichStatus,
  besuchteBereicheErweitern,
  gewaehlterTagId,
} from '@/lib/trips/arbeitsbereich'
import type { OfficialEvaluation } from '@/lib/readiness/official'
import type { SafetyEvaluation } from '@/lib/safety/domain'
import ReiseSicherheit from '@/components/trips/ReiseSicherheit'
import type { ReadinessKind, ReadinessUserStatus, TravellerDocumentType } from '@/types/trips'
import type { PlanpunktFormular } from '@/lib/trips/schema'
import TripWorkspaceKopf from '@/components/trips/TripWorkspaceKopf'
import TripWorkspaceNavigation from '@/components/trips/TripWorkspaceNavigation'
import TripWorkspacePlan from '@/components/trips/TripWorkspacePlan'
import Reisevorbereitung from '@/components/trips/Reisevorbereitung'
import TripWorkspaceUebersicht from '@/components/trips/TripWorkspaceUebersicht'
import FlugBestand from '@/components/trips/FlugBestand'
import UnterkunftBestand from '@/components/trips/UnterkunftBestand'
import type { Trip, TripItem, TripSource } from '@/types/trips'

function kompakteAnsichtAbonnieren(melden: () => void) {
  const mq = window.matchMedia(`(min-width: ${ARBEITSBEREICH_DESKTOP_AB_PX}px)`)
  mq.addEventListener('change', melden)
  return () => mq.removeEventListener('change', melden)
}

function kompakteAnsichtLesen() {
  return !window.matchMedia(`(min-width: ${ARBEITSBEREICH_DESKTOP_AB_PX}px)`).matches
}

type TripWorkspaceProps = {
  reise: Trip
  quelle: TripSource
  ohneTag?: TripItem[]
  onPunktAnlegen: (tagId: string, eingabe: PlanpunktFormular) => Promise<string | null>
  onPunktEntfernen: (tagId: string, punktId: string) => Promise<string | null>
  kopfzeile?: React.ReactNode
  hinweis?: React.ReactNode
  aenderung?: React.ReactNode
  flugsuche?: React.ReactNode
  hotelsuche?: React.ReactNode
  aktivitaetensuche?: React.ReactNode
  mobilitaetssuche?: React.ReactNode
  onBuchungsstatus?: (itemId: string, gebucht: boolean) => Promise<string | null>
  onReadinessSetzen?: (eingabe: {
    clientRef: string
    kind: ReadinessKind
    userStatus: ReadinessUserStatus
    countryCode: string | null
    tripItemId: string | null
    title: string | null
  }) => Promise<string | null>
  onReadinessEntfernen?: (clientRef: string) => Promise<string | null>
  onTravellerSetzen?: (eingabe: {
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
  }) => Promise<string | null>
  onTravellerEntfernen?: (clientRef: string) => Promise<string | null>
  /**
   * Optionale serverseitige Official Evaluations.
   * Ohne Lieferung bleibt der lokale fail-closed Fallback.
   * Kein Provider-Call und kein Secret im Client.
   */
  officialEvaluations?: OfficialEvaluation[]
  safetyEvaluations?: SafetyEvaluation[]
  /**
   * Nur für interne Audits: startet nicht in der Übersicht.
   * Der Produktweg lässt den Parameter weg.
   */
  anfangsBereich?: Arbeitsbereich
}

function sucheMitTag(
  knoten: React.ReactNode,
  tagId: string,
  onTagWechseln: (id: string) => void,
) {
  if (!React.isValidElement(knoten)) return knoten
  return React.cloneElement(
    knoten as React.ReactElement<{ tagId?: string; onTagWechseln?: (id: string) => void }>,
    { tagId, onTagWechseln },
  )
}

function setzeInert(el: HTMLElement | null, verborgen: boolean) {
  if (!el) return
  if (verborgen) el.setAttribute('inert', '')
  else el.removeAttribute('inert')
}

function BereichHuelle({
  bereich,
  verborgen,
  sichtbarKlasse,
  children,
}: {
  bereich: Arbeitsbereich
  verborgen: boolean
  sichtbarKlasse?: string
  children: React.ReactNode
}) {
  return (
    <div
      data-arbeitsbereich={bereich}
      hidden={verborgen}
      className={bereichDarstellungKlasse(verborgen, sichtbarKlasse)}
      ref={(el) => setzeInert(el, verborgen)}
    >
      {children}
    </div>
  )
}

export default function TripWorkspace({
  reise,
  quelle,
  ohneTag = [],
  onPunktAnlegen,
  onPunktEntfernen,
  kopfzeile,
  hinweis,
  aenderung,
  flugsuche,
  hotelsuche,
  aktivitaetensuche,
  mobilitaetssuche,
  onBuchungsstatus,
  onReadinessSetzen,
  onReadinessEntfernen,
  onTravellerSetzen,
  onTravellerEntfernen,
  officialEvaluations,
  safetyEvaluations,
  anfangsBereich,
}: TripWorkspaceProps) {
  const kompakt = React.useSyncExternalStore(
    kompakteAnsichtAbonnieren,
    kompakteAnsichtLesen,
    () => true,
  )

  const [bereich, setBereich] = React.useState<Arbeitsbereich>(() =>
    arbeitsbereichLesen(anfangsBereich),
  )
  const [besucht, setBesucht] = React.useState<ReadonlySet<Arbeitsbereich>>(
    () => new Set([STANDARD_ARBEITSBEREICH, arbeitsbereichLesen(anfangsBereich)]),
  )
  const [aktiverTag, setAktiverTag] = React.useState(reise.days[0]?.id ?? '')
  const [aenderungOffen, setAenderungOffen] = React.useState(false)
  const [aenderungBereit, setAenderungBereit] = React.useState(!kompakt)
  const aenderungKnopfRef = React.useRef<HTMLButtonElement>(null)
  const aenderungFeldRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setAktiverTag((bisher) => gewaehlterTagId(reise, bisher))
  }, [reise])

  React.useEffect(() => {
    if (!kompakt) setAenderungBereit(true)
  }, [kompakt])

  const wechseln = (naechster: Arbeitsbereich) => {
    setBereich(naechster)
    setBesucht((bisher) => besuchteBereicheErweitern(bisher, naechster))
    if (kompakt) {
      document.querySelector('[aria-label="Reisebereiche"]')?.scrollIntoView({ block: 'start' })
    }
  }

  const aenderungOeffnen = () => {
    const naechster = !aenderungOffen
    setAenderungOffen(naechster)
    if (naechster) setAenderungBereit(true)
  }

  React.useEffect(() => {
    if (!aenderungOffen || !kompakt) return
    const feld = aenderungFeldRef.current?.querySelector<HTMLTextAreaElement>('textarea')
    feld?.focus()
  }, [aenderungOffen, kompakt])

  const ungeplantePunkte = ohneTag.length > 0 ? ohneTag : reise.ohneTag
  const aenderungSichtbar = aenderungIstSichtbar(kompakt, aenderungOffen)
  const status = bereichStatus(reise, ungeplantePunkte)
  const aktivitaeten = sucheMitTag(aktivitaetensuche, aktiverTag, setAktiverTag)

  const bereichBereit = (ziel: Arbeitsbereich) =>
    bereichSollMounten(ziel, bereich, besucht, kompakt)

  const verbergen = (ziel: Arbeitsbereich) => !bereichSollSichtbar(ziel, bereich, kompakt)
  const uebersichtVerborgen = verbergen('uebersicht')

  const sicherheit = <ReiseSicherheit reise={reise} evaluations={safetyEvaluations} />

  const vorbereitung = (
    <Reisevorbereitung
      reise={reise}
      officialEvaluations={officialEvaluations}
      onSetzen={onReadinessSetzen}
      onEntfernen={onReadinessEntfernen}
      onTravellerSetzen={onTravellerSetzen}
      onTravellerEntfernen={onTravellerEntfernen}
    />
  )

  const plan = (
    <TripWorkspacePlan
      reise={reise}
      ohneTag={ungeplantePunkte}
      aktiverTag={aktiverTag}
      kompakt={kompakt}
      eingebettet={kompakt}
      onTagWechseln={setAktiverTag}
      onPunktAnlegen={onPunktAnlegen}
      onPunktEntfernen={onPunktEntfernen}
    />
  )

  const aenderungFeld = aenderungBereit && aenderung && (
    <div
      id="reise-aenderung"
      hidden={!aenderungSichtbar}
      ref={(el) => {
        aenderungFeldRef.current = el
        setzeInert(el, !aenderungSichtbar)
      }}
      onKeyDown={(ereignis) => {
        if (ereignis.key !== 'Escape' || !kompakt || !aenderungOffen) return
        ereignis.stopPropagation()
        setAenderungOffen(false)
        aenderungKnopfRef.current?.focus()
      }}
    >
      {aenderung}
    </div>
  )

  return (
    <main className="min-h-screen bg-surface-75 pb-20">
      <div className="mx-auto max-w-7xl px-3 py-8 sm:px-6 sm:py-10">
        <Link
          href="/reisen"
          className="-ml-2 inline-flex min-h-11 items-center gap-2 px-2 text-sm font-medium text-ink-800 transition hover:text-brand-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Meine Reisen
        </Link>

        {hinweis}

        <TripWorkspaceKopf reise={reise} quelle={quelle} kompakt={kompakt} kopfzeile={kopfzeile} />

        {!kompakt && (
          <div className="mt-6 grid gap-4">
            {sicherheit}
            {vorbereitung}
          </div>
        )}

        {kompakt && <TripWorkspaceNavigation aktiv={bereich} onWechsel={wechseln} />}

        {bereichBereit('uebersicht') && (
          <BereichHuelle bereich="uebersicht" verborgen={uebersichtVerborgen}>
            <TripWorkspaceUebersicht
              reise={reise}
              status={status}
              aenderungOffen={aenderungOffen}
              onBereich={wechseln}
              onAenderung={aenderungOeffnen}
              aenderungKnopfRef={aenderungKnopfRef}
              plan={kompakt ? plan : null}
              aenderungFeld={kompakt ? aenderungFeld : null}
              vorbereitung={kompakt ? vorbereitung : null}
              sicherheit={kompakt ? sicherheit : null}
            />
          </BereichHuelle>
        )}

        {!kompakt && aenderungFeld}

        {bereichBereit('fluege') && (
          <BereichHuelle bereich="fluege" verborgen={verbergen('fluege')} sichtbarKlasse="mt-6 grid gap-6">
            <FlugBestand reise={reise} ohneTag={ungeplantePunkte} onBuchungsstatus={onBuchungsstatus} />
            {flugsuche}
          </BereichHuelle>
        )}

        {bereichBereit('unterkunft') && (
          <BereichHuelle
            bereich="unterkunft"
            verborgen={verbergen('unterkunft')}
            sichtbarKlasse="mt-6 grid gap-6"
          >
            <UnterkunftBestand reise={reise} ohneTag={ungeplantePunkte} onBuchungsstatus={onBuchungsstatus} />
            {hotelsuche}
          </BereichHuelle>
        )}

        {bereichBereit('aktivitaeten') && aktivitaeten && (
          <BereichHuelle bereich="aktivitaeten" verborgen={verbergen('aktivitaeten')} sichtbarKlasse="mt-6">
            {aktivitaeten}
          </BereichHuelle>
        )}

        {bereichBereit('mobilitaet') && mobilitaetssuche && (
          <BereichHuelle bereich="mobilitaet" verborgen={verbergen('mobilitaet')} sichtbarKlasse="mt-6">
            {mobilitaetssuche}
          </BereichHuelle>
        )}

        {!kompakt && plan}
      </div>
    </main>
  )
}
