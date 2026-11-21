import { notFound } from 'next/navigation'
import Hotelsuche from '@/components/trips/organisieren/Hotelsuche'
import { uiAuditSeiteAktiv } from '@/lib/ui-audit/freigabe'
import { referenzReise } from '@/lib/trips/ux-u1c-route-design-alignment-1/fixture'
import '@/components/trips/organisieren/organisieren.css'
import '@/components/trips/organisieren/auswahl/suchauswahl.css'
import '@/components/trips/organisieren/hotelsuche.css'

// Internal synthetic fixture only: no authenticated trip, no DB read/write.
// UI-audit refuses Production even when the audit flag is accidentally set.
export const metadata = {
  title: 'Hotelsuche · Vorschau',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default function HotelDiscoveryPreview() {
  if (!uiAuditSeiteAktiv({
    VERCEL_ENV: process.env.VERCEL_ENV,
    JETNITY_UI_AUDIT: process.env.JETNITY_UI_AUDIT,
  })) notFound()

  const reise = referenzReise()
  reise.title = 'Bangkok – reine Hotelsuche-Vorschau'
  reise.startDate = '2026-12-14'
  reise.endDate = '2026-12-20'
  reise.travellers = 2
  reise.currency = 'CHF'
  reise.stages = [{
    ...reise.stages[0],
    name: 'Bangkok',
    countryCode: 'TH',
    placeId: 'geonames:1609350',
    arrivalDate: '2026-12-14',
    departureDate: '2026-12-20',
    latitude: 13.75,
    longitude: 100.52,
  }]
  reise.days = reise.days.slice(0, 6).map((tag, index) => ({
    ...tag,
    dayIndex: index + 1,
    dayDate: `2026-12-${String(14 + index).padStart(2, '0')}`,
    stageId: reise.stages[0].id,
    items: [],
  }))
  return (
    <main className="org-workspace" style={{
      padding: 'clamp(1rem, 4vw, 4rem)', maxWidth: 1440, margin: 'auto',
    }}>
      <p style={{ marginBottom: '1rem' }}>
        Jetnity · interne Dev-Vorschau · Bangkok, 14.–20. Dezember · 2 Reisende
      </p>
      <Hotelsuche reise={reise} start={reise.stages[0]} auswahlVersion={0}
        etappen={<span>Bangkok · 6 Nächte · nur synthetische Daten</span>} />
    </main>
  )
}
