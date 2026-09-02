'use client'

// components/trips/TripWorkspace.tsx
//
// Der Reise-Arbeitsbereich. Eine Produktlogik für alle Geräte (ADR-0163 / TW-1).
// Die Übersicht verdichtet vorhandene Reise-Wahrheit (ADR-0164 / TW-2).
// Jetzt wichtig priorisiert vorhandene Signale (ADR-0165 / TW-4).
// Der Verlauf zeigt Etappen und Tage als Timeline (ADR-0166 / TW-3).
// Item- und Gap-Details öffnen vorhandene Flächen kontextuell (ADR-0167 / TW-5).
//
// Die Reise bleibt die primäre Oberfläche. Domain-Flächen sind Details
// und Werkzeuge, keine gleichrangige Hauptnavigation. Commercial-Suche
// wird erst nach ausdrücklicher Nutzeraktion gemountet.

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import {
  ARBEITSBEREICH_DESKTOP_AB_PX,
  type Arbeitsbereich,
  aenderungIstSichtbar,
  bereichDarstellungKlasse,
  gewaehlterTagId,
} from '@/lib/trips/arbeitsbereich'
import { heutigesDatum } from '@/lib/account/naechste-reise'
import type { AttentionAktion } from '@/lib/trips/attention'
import { attentionAbleiten } from '@/lib/trips/attention'
import {
  attentionAktionAlsDetail,
  bestandSollMounten,
  besuchteDomainsErweitern,
  detailAuswahlAusBereich,
  detailBereinigen,
  detailDomainFuerKind,
  detailDomainVon,
  gapAuswahl,
  gapDetailAbleiten,
  itemAuswahl,
  itemDetailAbleiten,
  itemInReise,
  leereDetailAuswahl,
  sucheIstOffen,
  sucheOeffnen,
  sucheSollMounten,
  type DetailDomain,
  type WorkspaceDetailAuswahl,
} from '@/lib/trips/detail'
import { destinationEssentialsAbleiten } from '@/lib/trips/destination-essentials'
import { uebersichtAbleiten } from '@/lib/trips/uebersicht'
import type { OfficialEvaluation } from '@/lib/readiness/official'
import type { SafetyEvaluation } from '@/lib/safety/domain'
import type { SeasonalEvaluation } from '@/lib/seasonal/domain'
import ReiseSicherheit from '@/components/trips/ReiseSicherheit'
import ReisezeitHinweise from '@/components/trips/ReisezeitHinweise'
import type { ReadinessKind, ReadinessUserStatus, TravellerDocumentType } from '@/types/trips'
import type { PlanpunktFormular } from '@/lib/trips/schema'
import TripWorkspaceKopf from '@/components/trips/TripWorkspaceKopf'
import TripWorkspaceNavigation from '@/components/trips/TripWorkspaceNavigation'
import TripWorkspacePlan from '@/components/trips/TripWorkspacePlan'
import Reisevorbereitung from '@/components/trips/Reisevorbereitung'
import TripWorkspaceUebersicht from '@/components/trips/TripWorkspaceUebersicht'
import TripWorkspaceDetail from '@/components/trips/TripWorkspaceDetail'
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
  registryUebernahme?: React.ReactNode
  officialEvaluations?: OfficialEvaluation[]
  safetyEvaluations?: SafetyEvaluation[]
  seasonalEvaluations?: SeasonalEvaluation[]
  /**
   * Nur für interne Audits: startet mit einem Gap, nicht mit der Suche.
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

function FlaecheHuelle({
  name,
  verborgen,
  sichtbarKlasse,
  children,
}: {
  name: string
  verborgen: boolean
  sichtbarKlasse?: string
  children: React.ReactNode
}) {
  return (
    <div
      data-arbeitsbereich={name}
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
  registryUebernahme,
  officialEvaluations,
  safetyEvaluations,
  seasonalEvaluations,
  anfangsBereich,
}: TripWorkspaceProps) {
  const kompakt = React.useSyncExternalStore(
    kompakteAnsichtAbonnieren,
    kompakteAnsichtLesen,
    () => true,
  )

  const [auswahl, setAuswahl] = React.useState<WorkspaceDetailAuswahl>(() =>
    detailAuswahlAusBereich(anfangsBereich),
  )
  const [bestandBesucht, setBestandBesucht] = React.useState<ReadonlySet<DetailDomain>>(() => {
    const start = detailAuswahlAusBereich(anfangsBereich)
    return start.art === 'gap' ? new Set([start.domain]) : new Set()
  })
  const [sucheBesucht, setSucheBesucht] = React.useState<ReadonlySet<DetailDomain>>(new Set())
  const [aktiverTag, setAktiverTag] = React.useState(reise.days[0]?.id ?? '')
  const [aenderungOffen, setAenderungOffen] = React.useState(false)
  const [aenderungBereit, setAenderungBereit] = React.useState(!kompakt)
  const aenderungKnopfRef = React.useRef<HTMLButtonElement>(null)
  const aenderungFeldRef = React.useRef<HTMLDivElement>(null)
  const zurueckRef = React.useRef<HTMLButtonElement>(null)
  const detailFokusRef = React.useRef<HTMLButtonElement>(null)
  const letzterAusloeserRef = React.useRef<HTMLElement | null>(null)
  const vorherOffenRef = React.useRef(false)

  const ungeplantePunkte = ohneTag.length > 0 ? ohneTag : reise.ohneTag
  const bereinigt = detailBereinigen(auswahl, reise, ungeplantePunkte)
  const detailOffen = bereinigt.art !== 'keine'
  const gewaehlterPunktId = bereinigt.art === 'item' ? bereinigt.itemId : undefined

  React.useEffect(() => {
    setAktiverTag((bisher) => gewaehlterTagId(reise, bisher))
  }, [reise])

  React.useEffect(() => {
    setAuswahl((bisher) => detailBereinigen(bisher, reise, ohneTag.length > 0 ? ohneTag : reise.ohneTag))
  }, [reise, ohneTag])

  React.useEffect(() => {
    if (!kompakt) setAenderungBereit(true)
  }, [kompakt])

  React.useEffect(() => {
    if (detailOffen && !vorherOffenRef.current) {
      const ziel = kompakt ? zurueckRef.current : detailFokusRef.current
      ziel?.focus({ preventScroll: true })
      if (!kompakt) ziel?.scrollIntoView({ block: 'start', inline: 'nearest' })
    }
    if (!detailOffen && vorherOffenRef.current) {
      letzterAusloeserRef.current?.focus?.()
    }
    vorherOffenRef.current = detailOffen
  }, [detailOffen, kompakt])

  const merkeAusloeser = () => {
    const aktiv = document.activeElement
    letzterAusloeserRef.current = aktiv instanceof HTMLElement ? aktiv : null
  }

  const oeffneGap = (domain: DetailDomain, signalId?: string) => {
    merkeAusloeser()
    setAuswahl(gapAuswahl(domain, signalId))
    setBestandBesucht((bisher) => besuchteDomainsErweitern(bisher, domain))
  }

  const oeffneItem = (itemId: string) => {
    merkeAusloeser()
    const punkt = itemInReise(reise, ungeplantePunkte, itemId)
    setAuswahl(itemAuswahl(itemId))
    setBestandBesucht((bisher) => besuchteDomainsErweitern(bisher, punkt ? detailDomainFuerKind(punkt.kind) : null))
  }

  const schliessen = () => {
    setAuswahl(leereDetailAuswahl())
  }

  const sucheAusdruecklich = () => {
    setAuswahl((bisher) => sucheOeffnen(bisher))
    setSucheBesucht((bisher) =>
      besuchteDomainsErweitern(bisher, detailDomainVon(bereinigt, reise, ungeplantePunkte)),
    )
  }

  const onAttention = (aktion: AttentionAktion) => {
    const ziel = attentionAktionAlsDetail(aktion)
    if (ziel === 'reise') {
      schliessen()
      document.getElementById('reisevorbereitung-titel')?.scrollIntoView({ block: 'start' })
      return
    }
    if (ziel && ziel.art === 'gap') oeffneGap(ziel.domain, ziel.signalId)
  }

  const aenderungOeffnen = () => {
    const naechster = !aenderungOffen
    setAenderungOffen(naechster)
    if (naechster) setAenderungBereit(true)
  }

  React.useEffect(() => {
    if (!aenderungOffen) return
    const feld = aenderungFeldRef.current?.querySelector<HTMLTextAreaElement>('textarea')
    feld?.focus()
  }, [aenderungOffen])

  const aenderungSichtbar = aenderungIstSichtbar(aenderungOffen)
  const uebersicht = uebersichtAbleiten(reise, ungeplantePunkte, heutigesDatum())
  const destinationEssentials = destinationEssentialsAbleiten({
    reise,
    officialEvaluations,
    safetyEvaluations,
    seasonalEvaluations,
  })
  const attention = attentionAbleiten({
    reise,
    ohneTag: ungeplantePunkte,
    safetyEvaluations,
    seasonalEvaluations,
    officialEvaluations,
  })
  const aktivitaeten = sucheMitTag(aktivitaetensuche, aktiverTag, setAktiverTag)
  const gap = bereinigt.art === 'gap' ? gapDetailAbleiten(reise, ungeplantePunkte, bereinigt.domain) : null
  const item = bereinigt.art === 'item' ? itemDetailAbleiten(reise, ungeplantePunkte, bereinigt.itemId) : null
  const aktiveDomain = detailDomainVon(bereinigt, reise, ungeplantePunkte)
  const uebersichtVerborgen = kompakt && detailOffen
  const detailVerborgen = !detailOffen

  const sicherheit = <ReiseSicherheit reise={reise} evaluations={safetyEvaluations} />
  const reisezeit = <ReisezeitHinweise reise={reise} evaluations={seasonalEvaluations} />

  const vorbereitung = (
    <Reisevorbereitung
      reise={reise}
      officialEvaluations={officialEvaluations}
      onSetzen={onReadinessSetzen}
      onEntfernen={onReadinessEntfernen}
      onTravellerSetzen={onTravellerSetzen}
      onTravellerEntfernen={onTravellerEntfernen}
      registryUebernahme={registryUebernahme}
    />
  )

  const plan = (
    <TripWorkspacePlan
      reise={reise}
      ohneTag={ungeplantePunkte}
      aktiverTag={aktiverTag}
      kompakt={kompakt}
      eingebettet
      onTagWechseln={setAktiverTag}
      onPunktAnlegen={onPunktAnlegen}
      onPunktEntfernen={onPunktEntfernen}
      onPunktOeffnen={oeffneItem}
      gewaehlterPunktId={gewaehlterPunktId}
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
        if (ereignis.key !== 'Escape' || !aenderungOffen) return
        ereignis.stopPropagation()
        setAenderungOffen(false)
        aenderungKnopfRef.current?.focus()
      }}
    >
      {aenderung}
    </div>
  )

  const flugBestandBereit = bestandSollMounten('fluege', bereinigt, bestandBesucht, reise, ungeplantePunkte)
  const hotelBestandBereit = bestandSollMounten('unterkunft', bereinigt, bestandBesucht, reise, ungeplantePunkte)
  const mobilitaetBereit = bestandSollMounten('mobilitaet', bereinigt, bestandBesucht, reise, ungeplantePunkte)
  const flugSucheBereit = sucheSollMounten('fluege', bereinigt, sucheBesucht, reise, ungeplantePunkte)
  const hotelSucheBereit = sucheSollMounten('unterkunft', bereinigt, sucheBesucht, reise, ungeplantePunkte)
  const aktivitaetenSucheBereit = sucheSollMounten('aktivitaeten', bereinigt, sucheBesucht, reise, ungeplantePunkte)

  const sucheSichtbar = sucheIstOffen(bereinigt)

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

        <TripWorkspaceKopf
          reise={reise}
          quelle={quelle}
          kompakt={kompakt}
          uebersicht={uebersicht}
          kopfzeile={kopfzeile}
        />

        <TripWorkspaceNavigation sichtbar={kompakt && detailOffen} onZurueck={schliessen} zurueckRef={zurueckRef} />

        <div
          className={
            !kompakt && detailOffen ? 'lg:grid lg:grid-cols-2 lg:items-start lg:gap-6' : undefined
          }
        >
          <FlaecheHuelle name="uebersicht" verborgen={uebersichtVerborgen}>
            <TripWorkspaceUebersicht
              reise={reise}
              uebersicht={uebersicht}
              attention={attention}
              destinationEssentials={destinationEssentials}
              aenderungOffen={aenderungOffen}
              onLuecke={oeffneGap}
              onAttention={onAttention}
              onAenderung={aenderungOeffnen}
              aenderungKnopfRef={aenderungKnopfRef}
              plan={plan}
              aenderungFeld={aenderungFeld}
              vorbereitung={vorbereitung}
              sicherheit={sicherheit}
              reisezeit={reisezeit}
            />
          </FlaecheHuelle>

          <FlaecheHuelle name="detail" verborgen={detailVerborgen} sichtbarKlasse="min-w-0">
            <div
              onKeyDown={(ereignis) => {
                if (ereignis.key !== 'Escape' || !detailOffen) return
                ereignis.stopPropagation()
                schliessen()
              }}
            >
              {detailOffen ? (
                <TripWorkspaceDetail
                  auswahl={bereinigt}
                  gap={gap}
                  item={item}
                  kompakt={kompakt}
                  onSchliessen={schliessen}
                  onSuche={sucheAusdruecklich}
                  fokusRef={detailFokusRef}
                />
              ) : null}
            </div>
          </FlaecheHuelle>
        </div>

        {flugBestandBereit && (
          <FlaecheHuelle
            name="fluege"
            verborgen={!detailOffen || aktiveDomain !== 'fluege'}
            sichtbarKlasse="mt-4 grid gap-6"
          >
            <FlugBestand reise={reise} ohneTag={ungeplantePunkte} onBuchungsstatus={onBuchungsstatus} />
          </FlaecheHuelle>
        )}
        {hotelBestandBereit && (
          <FlaecheHuelle
            name="unterkunft"
            verborgen={!detailOffen || aktiveDomain !== 'unterkunft'}
            sichtbarKlasse="mt-4 grid gap-6"
          >
            <UnterkunftBestand reise={reise} ohneTag={ungeplantePunkte} onBuchungsstatus={onBuchungsstatus} />
          </FlaecheHuelle>
        )}
        {mobilitaetBereit && mobilitaetssuche && (
          <FlaecheHuelle
            name="mobilitaet"
            verborgen={!detailOffen || aktiveDomain !== 'mobilitaet'}
            sichtbarKlasse="mt-4"
          >
            {mobilitaetssuche}
          </FlaecheHuelle>
        )}
        {flugSucheBereit && flugsuche && (
          <FlaecheHuelle
            name="flugsuche"
            verborgen={!detailOffen || aktiveDomain !== 'fluege' || !sucheSichtbar}
            sichtbarKlasse="mt-4"
          >
            {flugsuche}
          </FlaecheHuelle>
        )}
        {hotelSucheBereit && hotelsuche && (
          <FlaecheHuelle
            name="hotelsuche"
            verborgen={!detailOffen || aktiveDomain !== 'unterkunft' || !sucheSichtbar}
            sichtbarKlasse="mt-4"
          >
            {hotelsuche}
          </FlaecheHuelle>
        )}
        {aktivitaetenSucheBereit && aktivitaeten && (
          <FlaecheHuelle
            name="aktivitaeten"
            verborgen={!detailOffen || aktiveDomain !== 'aktivitaeten' || !sucheSichtbar}
            sichtbarKlasse="mt-4"
          >
            {aktivitaeten}
          </FlaecheHuelle>
        )}
      </div>
    </main>
  )
}
