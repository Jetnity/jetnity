import { notFound } from 'next/navigation'
import AktivitaetenBereich from '@/components/trips/AktivitaetenBereich'
import Hotelsuche from '@/components/trips/organisieren/Hotelsuche'
import Flugvergleich from '@/components/trips/organisieren/fluege/Flugvergleich'
import { flugWidgetOrigin } from '@/lib/providers/travelpayouts/suche'
import type { Trip, TripStage } from '@/types/trips'

export const metadata = { title: 'Paris · Kartenvorschau', robots: { index: false, follow: false } }

import ParisKartenSuche, { type Suchbereich } from '@/components/trips/reisekarte/ParisKartenSuche'

// Isolated, read-only search context for the protected Paris map example.
export default async function KartenSuche({ params, bereich }: {
  params: Promise<{ tripId: string }>
  bereich?: Suchbereich
}) {
  const { tripId } = await params
  if (process.env.VERCEL_ENV !== 'preview' ||
      process.env.VERCEL_GIT_COMMIT_REF !== 'feat/private-travel-ux-20261113' ||
      tripId !== 'paris-beispiel') notFound()

  const stadt: TripStage = {
    id: 'paris', name: 'Paris', position: 1, countryCode: 'FR', placeId: 'geonames:2988507',
    latitude: 48.85341, longitude: 2.3488, arrivalDate: null, departureDate: null,
  }
  const reise: Trip = {
    id: 'paris-beispiel', clientRef: null, title: 'Paris', stages: [stadt], days: [], ohneTag: [],
    status: 'draft', pace: 'balanced', interests: [], origin: null, originPlaceId: null,
    startDate: null, endDate: null, travellers: 1, currency: 'CHF', budgetAmount: null, travelWish: null,
    revision: 1, lastMutationId: null, createdAt: '2026-11-15T00:00:00Z', updatedAt: '2026-11-15T00:00:00Z',
  }
  const origin = flugWidgetOrigin(process.env.NEXT_PUBLIC_TRAVELPAYOUTS_FRAME_ORIGIN)
  const flugReise: Trip = { ...reise, stages: [{ ...stadt, name: 'Paris Charles de Gaulle', placeId: 'airport:CDG', latitude: null, longitude: null }] }
  return <ParisKartenSuche reise={reise} start={bereich}
    fluege={origin ? <Flugvergleich reise={flugReise} origin={origin} /> : <p>Der Flugvergleich ist gerade nicht verfügbar.</p>}
    unterkunft={<Hotelsuche reise={reise} start={stadt} auswahlVersion={0} etappen={<p>Paris, Frankreich</p>} />}
    aktivitaeten={<AktivitaetenBereich reise={reise} organisierenEtappe={stadt.id} />} />
}
