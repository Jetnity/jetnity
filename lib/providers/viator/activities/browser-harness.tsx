'use client'

import { createRoot } from 'react-dom/client'

import AktivitaetKarte from '@/components/trips/AktivitaetKarte'
import ViatorPruefung from '@/components/trips/ViatorPruefung'
import type { ActivityOptionSichtbar } from '@/lib/activities/client-sicht'

const IMAGE = 'https://hare-media-cdn.tripadvisor.com/media/attractions-splice-spp-720x480/06/71/ef/dc.jpg'
const LINK = 'https://www.viator.com/tours/Example/Fixture/d1-10001P1?pid=P00000000&medium=api'

const option: ActivityOptionSichtbar = {
  id: 'viator:10001P1',
  provider: 'viator',
  externalRef: '10001P1',
  title: 'Spaziergang durch die Altstadt',
  description: 'Eine kurze Beschreibung ohne Verfügbarkeitszusage.',
  locationName: null,
  punkt: null,
  dauerMinuten: 90,
  timeslot: null,
  preis: 42,
  preisWaehrung: 'EUR',
  bewertung: 4.5,
  bewertungenAnzahl: 8,
  stornierbar: null,
  kategorien: [],
  tags: [],
  bildUrl: IMAGE,
  preisRolle: 'rrp_from',
  labels: [],
  reasons: [],
  konflikt: 'unbekannt',
}

function mountViatorHarness() {
  const root = document.getElementById('root')
  if (!root) return
  createRoot(root).render(
    <main className="mx-auto max-w-3xl p-4">
      <AktivitaetKarte option={option} laeuft={false} onPruefen={() => undefined} />
      <ViatorPruefung
        productCode="10001P1"
        dayDate="2026-11-02"
        gewuenschteWaehrung="CHF"
        vorgabe={{
          detail: {
            productCode: '10001P1',
            title: 'Spaziergang durch die Altstadt',
            description: 'Details ohne Live-Zusage.',
            imageUrl: IMAGE,
            price: { amount: 42, currency: 'EUR', priceRole: 'rrp_from', checkoutCurrencyConfirmed: false },
            productOptionCodes: ['TG1'],
            ageBands: [{ ageBand: 'ADULT', startAge: 18, endAge: 99, minTravelersPerBooking: 1, maxTravelersPerBooking: 9 }],
            productUrl: LINK,
          },
          plan: { supplierCurrency: 'EUR', options: [{ productOptionCode: 'TG1', startTimes: ['10:00'] }] },
        }}
      />
    </main>,
  )
}

mountViatorHarness()
