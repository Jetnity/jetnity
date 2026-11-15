import { notFound } from 'next/navigation'
import AktivitaetenBereich from '@/components/trips/AktivitaetenBereich'
import Hotelsuche from '@/components/trips/organisieren/Hotelsuche'
import Flugvergleich from '@/components/trips/organisieren/fluege/Flugvergleich'
import { flugWidgetOrigin } from '@/lib/providers/travelpayouts/suche'
import type { Trip, TripStage } from '@/types/trips'

export const metadata = { title: 'Paris · Kartenvorschau', robots: { index: false, follow: false } }

type Suchbereich = 'fluege' | 'unterkunft' | 'aktivitaeten'

// Isolated, read-only search context for the protected Paris map example.
export default async function KartenSuche({ params, bereich }: {
  params: Promise<{ tripId: string }>
  bereich: Suchbereich
}) {
  const { tripId } = await params
  if (process.env.VERCEL_ENV !== 'preview' ||
      process.env.VERCEL_GIT_COMMIT_REF !== 'feat/private-travel-ux-20261113' ||
      tripId !== 'paris-beispiel') notFound()

  const stadt: TripStage = {
    id: 'paris', name: 'Paris', position: 1, countryCode: 'FR', placeId: 'geonames:2988507',
    latitude: 48.85341, longitude: 2.3488, arrivalDate: null, departureDate: null,
  }
  const ziel = bereich === 'fluege'
    ? { ...stadt, name: 'Paris Charles de Gaulle', placeId: 'airport:CDG', latitude: null, longitude: null }
    : stadt
  const reise: Trip = {
    id: 'paris-beispiel', clientRef: null, title: 'Paris', stages: [ziel], days: [], ohneTag: [],
    status: 'draft', pace: 'balanced', interests: [], origin: null, originPlaceId: null,
    startDate: null, endDate: null, travellers: 1, currency: 'CHF', budgetAmount: null, travelWish: null,
    revision: 1, lastMutationId: null, createdAt: '2026-11-15T00:00:00Z', updatedAt: '2026-11-15T00:00:00Z',
  }
  const origin = flugWidgetOrigin(process.env.NEXT_PUBLIC_TRAVELPAYOUTS_FRAME_ORIGIN)
  const titel = bereich === 'fluege' ? 'Flüge nach Paris-CDG' : bereich === 'unterkunft' ? 'Hotels in Paris' : 'Aktivitäten in Paris'
  return (
    <main className="org-wrap mx-auto w-full max-w-6xl px-4 py-8">
      <p className="text-sm text-ink-700">Paris · Beispielreise</p>
      <h1 className="mb-5 text-3xl font-semibold text-brand-800">{titel}</h1>
      {bereich === 'fluege' && (origin
        ? <Flugvergleich reise={reise} origin={origin} />
        : <p>Der Flugvergleich ist in dieser Vorschau gerade nicht verfügbar.</p>)}
      {bereich === 'unterkunft' &&
        <Hotelsuche reise={reise} start={stadt} auswahlVersion={0} etappen={<p>Paris, Frankreich</p>} />}
      {bereich === 'aktivitaeten' && <AktivitaetenBereich reise={reise} organisierenEtappe={stadt.id} />}
    </main>
  )
}
