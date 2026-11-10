'use client'

// components/trips/KontoArbeitsbereich.tsx
//
// Der Arbeitsbereich einer Reise im Konto.
//
// Die Reise kommt fertig vom Server – geladen in einer Server-Komponente, durch
// RLS bereits auf das eigene Konto beschränkt. Diese Komponente ist Client, weil
// die Vorgänge einen Zustand brauchen: welcher Punkt gerade gespeichert wird,
// welche Meldung steht, wann die Ansicht nachzieht.
//
// Nach jedem Vorgang folgt `router.refresh()`. Den lokalen Zustand
// weiterzuschreiben wäre schneller und gleichzeitig eine zweite Wahrheit: Die
// Datenbank hat `position` gesetzt, `updated_at` nachgezogen und vielleicht eine
// Prüfbedingung angewandt. Was danach auf dem Bildschirm steht, soll das sein,
// was gespeichert ist.

import * as React from 'react'
import OfficialTruthPilotForm from './OfficialTruthPilotForm'
import { useOfficialTruthPilot } from './useOfficialTruthPilot'
import { useAcceptedStoreTrip,useOfficialTruthReadOwnership } from './useAcceptedStoreTrip'
import { useRouter } from 'next/navigation'
import { Cloud, Trash2 } from 'lucide-react'

import { activityInReiseUebernehmen } from '@/lib/activities/aktionen'
import type { ActivityOptionSichtbar } from '@/lib/activities/client-sicht'
import { flugInReiseUebernehmen } from '@/lib/flights/aktionen'
import type { FlugOptionSichtbar } from '@/lib/flights/client-sicht'
import { hotelInReiseUebernehmen } from '@/lib/hotels/aktionen'
import type { HotelOptionSichtbar } from '@/lib/hotels/client-sicht'
import { mobilityManuellInReiseAnlegen } from '@/lib/mobility/aktionen'
import type { MobilityManuellEingabe } from '@/lib/mobility/schema'
import { rentalCarManuellInReiseAnlegen } from '@/lib/rental-cars/aktionen'
import type { RentalCarManuellEingabe } from '@/lib/rental-cars/schema'
import { readinessEntfernen, readinessSetzen } from '@/lib/readiness/aktionen'
import type { OfficialEvaluation } from '@/lib/readiness/official'
import { registryTravellerInReiseUebernehmen, travellerEntfernen, travellerSetzen } from '@/lib/readiness/reisende-aktionen'
import type { Problem } from '@/lib/api/datenbank-lesen'
import type { RegistryTripAnzeige } from '@/lib/traveller/account-registry-trip'
import { registryTripUebernahmeGesperrt } from '@/lib/traveller/account-registry-trip'
import RegistryReiseUebernahme from '@/components/trips/RegistryReiseUebernahme'
import { flugRouteManuellSetzen, planpunktAnlegen, planpunktBearbeiten, planpunktBuchungsstatusSetzen, planpunktEntfernen, reiseLoeschen, unterkunftZeitraumSetzen } from '@/lib/trips/aktionen'
import type { PlanpunktFormular } from '@/lib/trips/schema'
import AktivitaetenBereich from '@/components/trips/AktivitaetenBereich'
import MobilitaetBereich from '@/components/trips/MobilitaetBereich'
import FlugSuche from '@/components/trips/FlugSuche'
import HotelBereich from '@/components/trips/HotelBereich'
import ReiseAenderung from '@/components/trips/ReiseAenderung'
import Reisebegleiter from '@/components/trips/Reisebegleiter'
import TripWorkspace from '@/components/trips/TripWorkspace'
import type { Trip, TripItem } from '@/types/trips'

/** Per-mounted-workspace response order; called only by event handlers, never while rendering. */
function createWriteOrder() {
  let generation = 0
  return { next: () => ++generation, isCurrent: (request: number) => request === generation }
}

export default function KontoArbeitsbereich({
  reise: serverReise,
  ohneTag: serverOhneTag,
  officialEvaluations,
  officialPilotAvailable = false,
  officialStoreAvailable = false,
  registry,
}: {
  reise: Trip
  ohneTag: TripItem[]
  officialEvaluations: OfficialEvaluation[]
  officialPilotAvailable?: boolean
  officialStoreAvailable?: boolean
  registry?: {
    problem: Problem | null
    travellers: RegistryTripAnzeige[] | null
  }
}) {
  const router = useRouter()
  const [bestaetigt, setBestaetigt] = React.useState<{ basis: Trip; graph: Trip } | null>(null)
  const reise = bestaetigt?.basis === serverReise ? bestaetigt.graph : serverReise
  const ohneTag = bestaetigt?.basis === serverReise ? bestaetigt.graph.ohneTag : serverOhneTag
  const [order] = React.useState(createWriteOrder())
  const [loeschmeldung, setLoeschmeldung] = React.useState('')
  const [loescht, setLoescht] = React.useState(false)
  const accepted = useAcceptedStoreTrip(reise, officialStoreAvailable)
  const pilot = useOfficialTruthPilot(reise, officialEvaluations, graph => {
    order.next()
    setBestaetigt({ basis: serverReise, graph })
    router.refresh()
  })
  const truth = useOfficialTruthReadOwnership(reise,pilot,accepted,officialPilotAvailable,officialStoreAvailable)
  const invalidate = truth.invalidate

  const anlegen = async (tagId: string, eingabe: PlanpunktFormular) => {
    invalidate()
    const request = order.next()
    const ergebnis = await planpunktAnlegen({ ...eingabe, tripId: reise.id, dayId: tagId })
    if (!ergebnis.ok) return ergebnis.meldung
    if (order.isCurrent(request)) setBestaetigt({ basis: serverReise, graph: ergebnis.wert })
    router.refresh()
    return null
  }

  const entfernen = async (_tagId: string, punktId: string) => {
    invalidate()
    order.next()
    const ergebnis = await planpunktEntfernen({ tripId: reise.id, itemId: punktId })
    if (!ergebnis.ok) return ergebnis.meldung
    router.refresh()
    return null
  }

  const loeschen = async () => {
    if (loescht) return
    const sicher = window.confirm(
      `„${reise.title}" wird mit allen Tagen und Planpunkten gelöscht. Das lässt sich nicht rückgängig machen.`,
    )
    if (!sicher) return

    invalidate()
    setLoeschmeldung('')
    setLoescht(true)
    const ergebnis = await reiseLoeschen(reise.id)

    if (!ergebnis.ok) {
      setLoescht(false)
      setLoeschmeldung(ergebnis.meldung)
      return
    }

    // Kein `setLoescht(false)`: Die Seite wechselt, und ein aktiver Knopf für
    // eine gelöschte Reise wäre ein Angebot, das nicht mehr besteht.
    router.replace('/reisen')
  }

  const pilotControls = officialPilotAvailable
    ? <OfficialTruthPilotForm key={`${reise.id}:${reise.revision}`} trip={reise} status={pilot.status} busy={pilot.busy} error={pilot.error}
        onChange={invalidate} onSave={declaration => { accepted.invalidate(); return pilot.save(declaration) }} onCheck={truth.checkPilot} />
    : <p className="rounded-2xl border border-line-200 bg-surface-25 p-4 text-sm leading-6 text-ink-900">Die CH–DE-Prüfung ist derzeit nicht verfügbar. Angaben können noch nicht gespeichert oder geprüft werden.</p>

  const uebernehmeReise = (graph?: Trip) => {
    if (graph && graph.id === reise.id && graph.revision > reise.revision) {
      invalidate()
      order.next()
      setBestaetigt({ basis: serverReise, graph })
    }
    router.refresh()
  }

  return (
    <div onChangeCapture={invalidate}>
    <TripWorkspace
      reise={reise}
      officialEvaluations={truth.evaluations}
      officialPilot={officialStoreAvailable || accepted.engaged ? (
        <div className="grid gap-3">
          {pilotControls}
          <section aria-label="Gespeicherte Einreiseprüfung" className="rounded-2xl border border-line-200 bg-surface-25 p-4 text-sm leading-6 text-ink-900">
            <p role="status">{accepted.message}</p>
            <button type="button" disabled={!accepted.canRead} onClick={truth.readStore}
              className="mt-3 min-h-11 rounded-full bg-brand-800 px-4 text-sm font-semibold text-white disabled:opacity-50">
              {accepted.busy ? 'Gespeicherter Stand wird geprüft …' : 'Gespeicherte Einreiseprüfung erneut prüfen'}
            </button>
          </section>
        </div>
      ) : pilotControls}
      quelle="account"
      onReiseGespeichert={uebernehmeReise}
      ohneTag={ohneTag}
      onVerbindungAnlegen={async values => {
        invalidate()
        order.next()
        const result = await mobilityManuellInReiseAnlegen({...values, tripId: reise.id})
        if (!result.ok) return result.meldung
        router.refresh(); return null
      }}
      onPunktAnlegen={anlegen}
      onPunktBearbeiten={async (original, aenderung) => {
        invalidate()
        const request = order.next()
        const ergebnis = await planpunktBearbeiten({ tripId: reise.id, itemId: original.id, expectedVersion: original.rowVersion, aenderung })
        if (!ergebnis.ok) return ergebnis.meldung
        if (order.isCurrent(request)) setBestaetigt({ basis: serverReise, graph: ergebnis.wert })
        router.refresh()
        return null
      }}
      onPunktEntfernen={entfernen}
      onFlugRouteManuell={async (itemId, segments) => {
        invalidate()
        order.next()
        const ergebnis = await flugRouteManuellSetzen({ tripId: reise.id, itemId, segments })
        if (!ergebnis.ok) return ergebnis.meldung
        router.refresh()
        return null
      }}
      onUnterkunftZeitraum={async (itemId, startsOn, endsOn) => {
        invalidate()
        order.next()
        const ergebnis = await unterkunftZeitraumSetzen({ tripId: reise.id, itemId, startsOn, endsOn })
        if (!ergebnis.ok) return ergebnis.meldung
        router.refresh()
        return null
      }}
      readinessKanonischeReise={serverReise}
      onReadinessAktualisieren={async () => {
        router.refresh()
        return { art: 'props' }
      }}
      onReadinessSetzen={async (eingabe) => {
        const ergebnis = await readinessSetzen({ ...eingabe, tripId: reise.id })
        if (!ergebnis.ok) return ergebnis.meldung
        router.refresh()
        return null
      }}
      onTravellerSetzen={async (eingabe) => {
        invalidate()
        const ergebnis = await travellerSetzen({ ...eingabe, tripId: reise.id })
        if (!ergebnis.ok) return ergebnis.meldung
        return null
      }}
      onTravellerEntfernen={async (clientRef) => {
        invalidate()
        const ergebnis = await travellerEntfernen({ tripId: reise.id, clientRef })
        if (!ergebnis.ok) return ergebnis.meldung
        return null
      }}
      onTravellerEntwurfAenderung={invalidate}
      registrySteuerung={
        registry
          ? (steuerung) => (
              <RegistryReiseUebernahme
                problem={registry.problem}
                travellers={registry.travellers}
                voll={registryTripUebernahmeGesperrt(reise)}
                tripId={reise.id}
                steuerung={steuerung}
                onUebernehmen={async ({ tripId, registryTravellerId }) => {
                  invalidate()
                  const ergebnis = await registryTravellerInReiseUebernehmen({
                    tripId,
                    registryTravellerId,
                  })
                  if (!ergebnis.ok) return ergebnis.meldung
                  return null
                }}
              />
            )
          : undefined
      }
      onReadinessEntfernen={async (clientRef) => {
        const ergebnis = await readinessEntfernen({ tripId: reise.id, clientRef })
        if (!ergebnis.ok) return ergebnis.meldung
        router.refresh()
        return null
      }}
      onBuchungsstatus={async (itemId, gebucht) => {
        const ergebnis = await planpunktBuchungsstatusSetzen({
          tripId: reise.id,
          itemId,
          gebucht,
        })
        if (!ergebnis.ok) return ergebnis.meldung
        router.refresh()
        return null
      }}
      aenderung={
        <ReiseAenderung reise={reise} quelle="account" onGespeichert={uebernehmeReise} />
      }
      begleiter={<Reisebegleiter reise={reise} />}
      flugsuche={
        <FlugSuche
          reise={reise}
          tagId={reise.days[0]?.id ?? null}
          onUebernehmen={async (tagId, option: FlugOptionSichtbar) => {
            invalidate()
            const ergebnis = await flugInReiseUebernehmen({
              tripId: reise.id,
              dayId: tagId,
              optionId: option.id,
            })
            if (!ergebnis.ok) return ergebnis.meldung
            router.refresh()
            return null
          }}
        />
      }
      hotelsuche={
        <HotelBereich
          reise={reise}
          onUebernehmen={async (etappe, option: HotelOptionSichtbar, _zeitraum, dayId) => {
            invalidate()
            const ergebnis = await hotelInReiseUebernehmen({
              tripId: reise.id,
              stageId: etappe.id,
              dayId,
              optionId: option.id,
            })
            if (!ergebnis.ok) return ergebnis.meldung
            router.refresh()
            return null
          }}
        />
      }
      mobilitaetssuche={
        <MobilitaetBereich
          reise={reise}
          ohneTag={ohneTag}
          onBuchungsstatus={async (itemId, gebucht) => {
            const ergebnis = await planpunktBuchungsstatusSetzen({
              tripId: reise.id,
              itemId,
              gebucht,
            })
            if (!ergebnis.ok) return ergebnis.meldung
            router.refresh()
            return null
          }}
          onManuellAnlegen={async (eingabe: MobilityManuellEingabe) => {
            invalidate()
            const ergebnis = await mobilityManuellInReiseAnlegen({
              ...eingabe,
              tripId: reise.id,
            })
            if (!ergebnis.ok) return ergebnis.meldung
            router.refresh()
            return null
          }}
          onMietwagenAnlegen={async (eingabe: RentalCarManuellEingabe) => {
            invalidate()
            const ergebnis = await rentalCarManuellInReiseAnlegen({
              ...eingabe,
              tripId: reise.id,
            })
            if (!ergebnis.ok) return ergebnis.meldung
            router.refresh()
            return null
          }}
        />
      }
      aktivitaetensuche={
        <AktivitaetenBereich
          reise={reise}
          onUebernehmen={async (etappe, tag, option: ActivityOptionSichtbar) => {
            invalidate()
            const ergebnis = await activityInReiseUebernehmen({
              tripId: reise.id,
              stageId: etappe.id,
              dayId: tag.id,
              optionId: option.id,
            })
            if (!ergebnis.ok) return ergebnis.meldung
            router.refresh()
            return null
          }}
        />
      }
      hinweis={
        loeschmeldung ? (
          <p role="alert" className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {loeschmeldung}
          </p>
        ) : null
      }
      kopfzeile={
        <p className="flex min-w-0 items-center gap-2 text-xs leading-5 text-white/65">
          <Cloud className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Änderungen werden sofort in deinem Konto gespeichert.
        </p>
      }
      reiseoptionen={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={loeschen}
            disabled={loescht}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-2 text-sm font-medium text-white/70 transition hover:text-white disabled:pointer-events-none disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {loescht ? 'Reise wird gelöscht …' : 'Reise löschen'}
          </button>
        </div>
      }
    />
    </div>
  )
}
