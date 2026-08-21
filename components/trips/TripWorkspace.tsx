'use client'

// components/trips/TripWorkspace.tsx
//
// Der Reise-Arbeitsbereich. Eine Ansicht für beide Ablagen.
//
// Auf schmalen Viewports gilt zuerst Orientierung, dann Aktion: kompakter Kopf,
// klebende Bereichsnavigation, nur der aktive Bereich. Desktop behält die
// bisherige breite Arbeitsansicht. Der aktive Bereich ist Client-State, nicht
// Teil der URL – Iteration 1 vermeidet Router-Komplexität ohne Produktnutzen.

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import {
  ARBEITSBEREICH_DESKTOP_AB_PX,
  STANDARD_ARBEITSBEREICH,
  type Arbeitsbereich,
  aenderungIstSichtbar,
  arbeitsbereichLesen,
  bereichSollMounten,
  bereichSollSichtbar,
  bereichStatus,
  besuchteBereicheErweitern,
  gewaehlterTagId,
} from '@/lib/trips/arbeitsbereich'
import type { PlanpunktFormular } from '@/lib/trips/schema'
import TripWorkspaceKopf from '@/components/trips/TripWorkspaceKopf'
import TripWorkspaceNavigation from '@/components/trips/TripWorkspaceNavigation'
import TripWorkspacePlan from '@/components/trips/TripWorkspacePlan'
import TripWorkspaceUebersicht from '@/components/trips/TripWorkspaceUebersicht'
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
    () => new Set([STANDARD_ARBEITSBEREICH, 'plan', arbeitsbereichLesen(anfangsBereich)]),
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

        {kompakt && <TripWorkspaceNavigation aktiv={bereich} onWechsel={wechseln} />}

        {bereichBereit('uebersicht') && (
          <div hidden={verbergen('uebersicht')}>
            <TripWorkspaceUebersicht
              reise={reise}
              status={status}
              aenderungOffen={aenderungOffen}
              onBereich={wechseln}
              onAenderung={aenderungOeffnen}
              aenderungKnopfRef={aenderungKnopfRef}
            />
          </div>
        )}

        {aenderungBereit && aenderung && (
          <div
            id="reise-aenderung"
            ref={aenderungFeldRef}
            hidden={!aenderungSichtbar}
            inert={!aenderungSichtbar || undefined}
            onKeyDown={(ereignis) => {
              if (ereignis.key !== 'Escape' || !kompakt || !aenderungOffen) return
              ereignis.stopPropagation()
              setAenderungOffen(false)
              aenderungKnopfRef.current?.focus()
            }}
          >
            {aenderung}
          </div>
        )}

        {bereichBereit('fluege') && flugsuche && (
          <div hidden={verbergen('fluege')} inert={verbergen('fluege') || undefined} className="mt-6">
            {flugsuche}
          </div>
        )}

        {bereichBereit('unterkunft') && hotelsuche && (
          <div
            hidden={verbergen('unterkunft')}
            inert={verbergen('unterkunft') || undefined}
            className="mt-6"
          >
            {hotelsuche}
          </div>
        )}

        {bereichBereit('aktivitaeten') && aktivitaeten && (
          <div
            hidden={verbergen('aktivitaeten')}
            inert={verbergen('aktivitaeten') || undefined}
            className="mt-6"
          >
            {aktivitaeten}
          </div>
        )}

        {bereichBereit('plan') && (
          <div hidden={verbergen('plan')}>
            <TripWorkspacePlan
              reise={reise}
              ohneTag={ungeplantePunkte}
              aktiverTag={aktiverTag}
              kompakt={kompakt}
              onTagWechseln={setAktiverTag}
              onPunktAnlegen={onPunktAnlegen}
              onPunktEntfernen={onPunktEntfernen}
            />
          </div>
        )}
      </div>
    </main>
  )
}
