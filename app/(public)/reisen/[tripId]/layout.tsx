import '@/components/trips/reiseplan/etappen.css'
import '@/components/trips/reiseplan/etappen-tage.css'
import '@/components/trips/reiseplan/kartenauswahl.css'
import type { ReactNode } from 'react'
import 'leaflet/dist/leaflet.css'
import '@/components/trips/organisieren/omio/vergleich.css'
import '@/components/trips/organisieren/organisieren.css'
import '@/components/trips/organisieren/hotelsuche.css'
import '@/components/trips/organisieren/fluege/flugsuche.css'

import { connection } from 'next/server'
import ReisekartenRahmen from '@/components/trips/reisekarte/Reisekarte'
import '@/components/trips/reisekarte/reisekarte.css'
import { APP_MAP_ORIGIN, isAppMapPreview, mapPilotConfig } from '@/lib/maps/config'

export default async function ReiseLayout({ children, params }: { children: ReactNode; params: Promise<{ tripId: string }> }) {
  if (!isAppMapPreview(process.env)) return children
  await connection()
  const { tripId } = await params
  const config = mapPilotConfig(process.env, APP_MAP_ORIGIN)
  return <ReisekartenRahmen key={tripId} expiresAt={config?.expiresAt ?? null}>{children}</ReisekartenRahmen>
}
