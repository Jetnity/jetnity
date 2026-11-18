import { notFound } from 'next/navigation'
import Flugvergleich from '@/components/trips/organisieren/fluege/Flugvergleich'
import { uiAuditSeiteAktiv } from '@/lib/ui-audit/freigabe'
import { referenzReise } from '@/lib/trips/ux-u1c-route-design-alignment-1/fixture'
import '@/components/trips/organisieren/organisieren.css'
import '@/components/trips/organisieren/auswahl/suchauswahl.css'
import '@/components/trips/organisieren/fluege/flugsuche.css'

export const metadata = { title: 'Flugsuche · Vorschau', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default function FlightDiscoveryPreview() {
  if (!uiAuditSeiteAktiv({ VERCEL_ENV: process.env.VERCEL_ENV, JETNITY_UI_AUDIT: process.env.JETNITY_UI_AUDIT })) notFound()
  const reise = referenzReise()
  reise.title = 'Österreich'
  reise.startDate = '2026-12-14'
  reise.endDate = '2026-12-20'
  reise.travellers = 2
  reise.stages = [{ ...reise.stages[0], name: 'Wien', placeId: 'airport:VIE', countryCode: 'AT' }]
  return <main className="org-workspace" style={{ padding: 'clamp(1rem, 4vw, 4rem)', maxWidth: 1440, margin: 'auto' }}>
    <p style={{ marginBottom: '1rem' }}>Jetnity · Lokale Vorschau · Österreich, 14.–20. Dezember · 2 Reisende</p>
    <Flugvergleich reise={reise} origin={process.env.NEXT_PUBLIC_TRAVELPAYOUTS_FRAME_ORIGIN ?? ''} />
  </main>
}
