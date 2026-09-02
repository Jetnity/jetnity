'use client'

// Nur für /ui-audit/account. Fixtures nie im Produktspeicher.

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

import AccountBuchungen from '@/components/account/AccountBuchungen'
import AccountNavigation from '@/components/account/AccountNavigation'
import AccountUebersicht from '@/components/account/AccountUebersicht'
import type { KontoBuchung } from '@/lib/account/buchungen'
import { naechsteReiseAus } from '@/lib/account/naechste-reise'
import type { TripSummary } from '@/types/trips'

const REISE: TripSummary = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Lissabon',
  origin: 'Zürich',
  startDate: '2026-09-12',
  endDate: '2026-09-16',
  travellers: 2,
  currency: 'CHF',
  budgetAmount: null,
  status: 'planned',
  updatedAt: '2026-08-20T10:00:00.000Z',
  stages: [
    {
      name: 'Lissabon',
      position: 1,
      countryCode: 'PT',
      placeId: 'geonames:2267057',
      latitude: 38.7223,
      longitude: -9.1393,
    },
  ],
  stageCount: 1,
  dayCount: 5,
  itemCount: 0,
}

const BUCHUNG: KontoBuchung = {
  id: 'booking-1',
  title: 'Zürich – Lissabon',
  kind: 'flight',
  artBezeichnung: 'Flug',
  startsOn: '2026-09-12',
  startsAt: '08:40',
  endsOn: '2026-09-12',
  endsAt: null,
  tripId: '11111111-1111-4111-8111-111111111111',
  tripTitle: 'Lissabon',
  tripStatus: 'planned',
  tripArchived: false,
}

const ARCHIV_BUCHUNG: KontoBuchung = {
  ...BUCHUNG,
  id: 'booking-2',
  title: 'Lissabon Zentrum',
  kind: 'stay',
  artBezeichnung: 'Unterkunft',
  startsOn: '2025-04-02',
  startsAt: null,
  endsOn: '2025-04-06',
  tripId: '22222222-2222-4222-8222-222222222222',
  tripTitle: 'Algarve 2025',
  tripStatus: 'archived',
  tripArchived: true,
}

export default function AccountAuditClient() {
  const suche = useSearchParams()
  const zustand = suche.get('zustand') ?? 'reise'
  const ansicht = suche.get('ansicht')

  const buchungenSicht = useMemo(() => {
    if (zustand === 'fehler') {
      return { problem: { status: 503 as const, message: 'unavailable' }, buchungen: null, abgeschnitten: false }
    }
    if (zustand === 'leer') {
      return { problem: null, buchungen: [], abgeschnitten: false }
    }
    return { problem: null, buchungen: [BUCHUNG, ARCHIV_BUCHUNG], abgeschnitten: false }
  }, [zustand])

  const sicht = useMemo(() => {
    if (zustand === 'fehler') {
      return {
        name: 'Sasa',
        problem: { status: 503 as const, message: 'unavailable' },
        naechste: null,
        hatReisen: false,
        reisen: [],
      }
    }
    if (zustand === 'leer') {
      return { name: 'Sasa', problem: null, naechste: null, hatReisen: false, reisen: [] }
    }
    return {
      name: 'Sasa',
      problem: null,
      naechste: naechsteReiseAus([REISE], '2026-08-24'),
      hatReisen: true,
      reisen: [REISE],
    }
  }, [zustand])

  return (
    <div data-account-audit={zustand} className="min-h-screen bg-surface-75">
      <AccountNavigation />
      <main className="px-4 py-10 sm:px-6 sm:py-14">
        <div className={ansicht === 'bookings' ? 'mx-auto max-w-3xl' : 'mx-auto max-w-6xl'}>
          {ansicht === 'bookings' ? <AccountBuchungen {...buchungenSicht} /> : <AccountUebersicht {...sicht} />}
        </div>
      </main>
    </div>
  )
}
