'use client'

// components/trips/MeineReisenHubAudit.tsx
//
// Fixture-Harness für den Premium-Hub. Keine Produktdaten, kein Schreibweg.
// Die Gruppen entstehen weiterhin erst in KontoReisenGruppen am Geräte-Kalendertag.

import type { Route } from 'next'
import Link from 'next/link'
import { AlertCircle, MapPin, Plus } from 'lucide-react'

import AccountNavigation from '@/components/account/AccountNavigation'
import KontoReisenGruppen from '@/components/trips/KontoReisenGruppen'
import { REISEN_LISTE_GRENZE } from '@/lib/trips/liste-grenze'
import {
  MEINE_REISEN_HAUPT,
  MEINE_REISEN_INNEN,
  MEINE_REISEN_KOPF,
  MEINE_REISEN_LEAD,
  MEINE_REISEN_NEU,
  MEINE_REISEN_TITEL,
} from '@/lib/trips/my-trips-premium-hub-ux-1'
import type { TripSummary } from '@/types/trips'

export type MeineReisenHubAuditZustand =
  | 'po'
  | 'gemischt'
  | 'archiv'
  | 'leer'
  | 'fehler'
  | 'grenze'

function plusTage(iso: string, tage: number) {
  const [jahr, monat, tag] = iso.split('-').map(Number)
  const datum = new Date(Date.UTC(jahr, monat - 1, tag))
  datum.setUTCDate(datum.getUTCDate() + tage)
  return datum.toISOString().slice(0, 10)
}

function reise(teil: Partial<TripSummary> & Pick<TripSummary, 'id' | 'title'>): TripSummary {
  return {
    origin: 'Zürich',
    startDate: null,
    endDate: null,
    travellers: 2,
    currency: 'CHF',
    budgetAmount: null,
    status: 'planned',
    updatedAt: '2026-09-20T10:00:00.000Z',
    stages: [{ name: 'Lissabon', position: 1 }],
    stageCount: 1,
    dayCount: 7,
    itemCount: 4,
    ...teil,
  }
}

function fixtures(zustand: MeineReisenHubAuditZustand, heute: string): TripSummary[] {
  if (zustand === 'leer' || zustand === 'fehler') return []
  if (zustand === 'grenze') {
    return Array.from({ length: REISEN_LISTE_GRENZE }, (_, index) =>
      reise({
        id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
        title: `Reise ${index + 1}`,
        startDate: plusTage(heute, 10 + index),
        endDate: plusTage(heute, 16 + index),
        updatedAt: `2026-09-20T10:${String(index % 60).padStart(2, '0')}:00.000Z`,
      }),
    )
  }

  const lissabon = reise({
    id: '00000000-0000-4000-8000-000000000001',
    title: 'Lissabon im Oktober',
    startDate: plusTage(heute, 21),
    endDate: plusTage(heute, 28),
    stages: [
      { name: 'Lissabon', position: 1 },
      { name: 'Sintra', position: 2 },
    ],
    stageCount: 2,
    dayCount: 8,
    itemCount: 6,
    status: 'planned',
  })
  const kyoto = reise({
    id: '00000000-0000-4000-8000-000000000002',
    title: 'Kyoto im November',
    origin: 'Genf',
    startDate: plusTage(heute, 48),
    endDate: plusTage(heute, 58),
    stages: [{ name: 'Kyoto', position: 1 }],
    stageCount: 1,
    dayCount: 11,
    itemCount: 9,
    travellers: 1,
    status: 'booked',
    updatedAt: '2026-09-18T08:00:00.000Z',
  })

  if (zustand === 'po') return [lissabon, kyoto]

  const aktiv = reise({
    id: '00000000-0000-4000-8000-000000000003',
    title: 'Porto jetzt',
    startDate: plusTage(heute, -2),
    endDate: plusTage(heute, 4),
    stages: [{ name: 'Porto', position: 1 }],
    status: 'booked',
    dayCount: 7,
    itemCount: 5,
  })
  const vergangen = reise({
    id: '00000000-0000-4000-8000-000000000004',
    title: 'Rom im Frühling',
    startDate: plusTage(heute, -40),
    endDate: plusTage(heute, -33),
    stages: [{ name: 'Rom', position: 1 }],
    status: 'planned',
    dayCount: 8,
    itemCount: 3,
  })
  const offen = reise({
    id: '00000000-0000-4000-8000-000000000005',
    title: 'Noch ohne Datum',
    origin: null,
    stages: [],
    stageCount: 0,
    dayCount: 0,
    itemCount: 0,
    status: 'draft',
    travellers: 1,
  })

  if (zustand === 'gemischt') return [aktiv, lissabon, vergangen, offen]

  return [
    lissabon,
    reise({
      id: '00000000-0000-4000-8000-000000000006',
      title: 'Archivierte Bali-Reise',
      status: 'archived',
      archivePreviousStatus: 'planned',
      startDate: plusTage(heute, -80),
      endDate: plusTage(heute, -70),
      stages: [{ name: 'Ubud', position: 1 }],
    }),
    reise({
      id: '00000000-0000-4000-8000-000000000007',
      title: 'Archiv ohne Provenienz',
      status: 'archived',
      archivePreviousStatus: null,
      startDate: plusTage(heute, -20),
      endDate: plusTage(heute, -12),
      stages: [{ name: 'Wien', position: 1 }],
    }),
  ]
}

function kopf() {
  return (
    <div className={MEINE_REISEN_KOPF}>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Dein Jetnity</p>
        <h1 className={MEINE_REISEN_TITEL}>Meine Reisen</h1>
        <p className={MEINE_REISEN_LEAD}>
          Deine Reisen sind in deinem Konto gespeichert und auf allen Geräten sichtbar.
        </p>
      </div>
      <Link href={'/planen' as Route} className={MEINE_REISEN_NEU}>
        <Plus className="h-4 w-4" />
        Neue Reise
      </Link>
    </div>
  )
}

export default function MeineReisenHubAudit({
  zustand,
  heute,
}: {
  zustand: MeineReisenHubAuditZustand
  heute: string
}) {
  const reisen = fixtures(zustand, heute)

  return (
    <>
      <AccountNavigation />
      <main data-reisen-audit={zustand} className={MEINE_REISEN_HAUPT}>
        <div className={MEINE_REISEN_INNEN}>
          {kopf()}
          {zustand === 'fehler' ? (
            <section
              role="alert"
              className="rounded-[26px] border border-red-200 bg-red-50 px-6 py-10 text-center sm:px-10"
            >
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-red-600">
                <AlertCircle className="h-5 w-5" />
              </span>
              <h2 className="mt-5 text-xl font-semibold text-red-800">
                Deine Reisen konnten nicht geladen werden.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-red-700">
                Das ist ein Fehler auf unserer Seite, nicht in deinen Daten. Bitte lade die Seite neu.
              </p>
            </section>
          ) : zustand === 'leer' ? (
            <section className="rounded-[30px] border border-dashed border-line-400 bg-white/65 px-6 py-14 text-center sm:px-10">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-brand-600">
                <MapPin className="h-5 w-5" />
              </span>
              <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-brand-800">
                Noch keine Reise in deinem Konto.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-700">
                Erstelle deine erste Reise. Sie wird dauerhaft gespeichert und lässt sich von jedem Gerät aus
                weiterplanen.
              </p>
              <Link
                href={'/planen' as Route}
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand-800 px-5 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Reise erstellen
              </Link>
            </section>
          ) : (
            <KontoReisenGruppen reisen={reisen} />
          )}
        </div>
      </main>
    </>
  )
}
