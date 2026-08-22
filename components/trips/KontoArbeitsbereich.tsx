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
import { travellerEntfernen, travellerSetzen } from '@/lib/readiness/reisende-aktionen'
import { planpunktAnlegen, planpunktBuchungsstatusSetzen, planpunktEntfernen, reiseLoeschen } from '@/lib/trips/aktionen'
import type { PlanpunktFormular } from '@/lib/trips/schema'
import AktivitaetenBereich from '@/components/trips/AktivitaetenBereich'
import MobilitaetBereich from '@/components/trips/MobilitaetBereich'
import FlugSuche from '@/components/trips/FlugSuche'
import HotelBereich from '@/components/trips/HotelBereich'
import ReiseAenderung from '@/components/trips/ReiseAenderung'
import TripWorkspace from '@/components/trips/TripWorkspace'
import type { Trip, TripItem } from '@/types/trips'

export default function KontoArbeitsbereich({
  reise,
  ohneTag,
}: {
  reise: Trip
  ohneTag: TripItem[]
}) {
  const router = useRouter()
  const [loeschmeldung, setLoeschmeldung] = React.useState('')
  const [loescht, setLoescht] = React.useState(false)

  const anlegen = async (tagId: string, eingabe: PlanpunktFormular) => {
    const ergebnis = await planpunktAnlegen({ ...eingabe, tripId: reise.id, dayId: tagId })
    if (!ergebnis.ok) return ergebnis.meldung
    router.refresh()
    return null
  }

  const entfernen = async (_tagId: string, punktId: string) => {
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

  return (
    <TripWorkspace
      reise={reise}
      quelle="account"
      ohneTag={ohneTag}
      onPunktAnlegen={anlegen}
      onPunktEntfernen={entfernen}
      onReadinessSetzen={async (eingabe) => {
        const ergebnis = await readinessSetzen({ ...eingabe, tripId: reise.id })
        if (!ergebnis.ok) return ergebnis.meldung
        router.refresh()
        return null
      }}
      onTravellerSetzen={async (eingabe) => {
        const ergebnis = await travellerSetzen({ ...eingabe, tripId: reise.id })
        if (!ergebnis.ok) return ergebnis.meldung
        router.refresh()
        return null
      }}
      onTravellerEntfernen={async (clientRef) => {
        const ergebnis = await travellerEntfernen({ tripId: reise.id, clientRef })
        if (!ergebnis.ok) return ergebnis.meldung
        router.refresh()
        return null
      }}
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
        <ReiseAenderung reise={reise} quelle="account" onGespeichert={() => router.refresh()} />
      }
      flugsuche={
        <FlugSuche
          reise={reise}
          tagId={reise.days[0]?.id ?? null}
          onUebernehmen={async (tagId, option: FlugOptionSichtbar) => {
            const ergebnis = await flugInReiseUebernehmen({
              tripId: reise.id,
              dayId: tagId,
              option,
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
            const ergebnis = await mobilityManuellInReiseAnlegen({
              ...eingabe,
              tripId: reise.id,
            })
            if (!ergebnis.ok) return ergebnis.meldung
            router.refresh()
            return null
          }}
          onMietwagenAnlegen={async (eingabe: RentalCarManuellEingabe) => {
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex min-w-0 items-center gap-2 text-xs leading-5 text-white/65">
            <Cloud className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Änderungen werden sofort in deinem Konto gespeichert.
          </p>
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
  )
}
