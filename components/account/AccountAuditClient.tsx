'use client'

// Nur für /ui-audit/account. Fixtures nie im Produktspeicher.

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

import AccountNavigation from '@/components/account/AccountNavigation'
import AccountUebersicht from '@/components/account/AccountUebersicht'
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
  stages: [{ name: 'Lissabon', position: 1 }],
  stageCount: 1,
  dayCount: 5,
  itemCount: 0,
}

export default function AccountAuditClient() {
  const suche = useSearchParams()
  const zustand = suche.get('zustand') ?? 'reise'

  const sicht = useMemo(() => {
    if (zustand === 'fehler') {
      return {
        name: 'Sasa',
        problem: { status: 503 as const, message: 'unavailable' },
        naechste: null,
        hatReisen: false,
      }
    }
    if (zustand === 'leer') {
      return { name: 'Sasa', problem: null, naechste: null, hatReisen: false }
    }
    return {
      name: 'Sasa',
      problem: null,
      naechste: naechsteReiseAus([REISE], '2026-08-24'),
      hatReisen: true,
    }
  }, [zustand])

  return (
    <div data-account-audit={zustand} className="min-h-screen bg-surface-75">
      <AccountNavigation />
      <main className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-6xl">
          <AccountUebersicht {...sicht} />
        </div>
      </main>
    </div>
  )
}
