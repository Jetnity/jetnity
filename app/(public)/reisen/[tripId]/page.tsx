import type { Metadata } from 'next'

import TripWorkspace from '@/components/trips/TripWorkspace'

export const metadata: Metadata = {
  title: 'Reiseübersicht',
  description: 'Plane deine Reise übersichtlich mit Jetnity.',
}

type TripPageProps = {
  params: { tripId: string }
}

export default function TripPage({ params }: TripPageProps) {
  return <TripWorkspace tripId={params.tripId} />
}
