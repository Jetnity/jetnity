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
import { headers } from 'next/headers'
import { WetterRahmen } from '@/components/trips/wetter/Tageswetter'
import ReisekartenRahmen from '@/components/trips/reisekarte/Reisekarte'
import '@/components/trips/reisekarte/reisekarte.css'
import { mapPilotConfig, tripServicesOrigin } from '@/lib/maps/config'

export default async function ReiseLayout({ children, params }: { children: ReactNode; params: Promise<{ tripId: string }> }) {
  const origin = tripServicesOrigin(process.env)
  if (!origin) return children
  await connection()
  if ((await headers()).get('host') !== new URL(origin).host) return children
  const config = mapPilotConfig(process.env, origin)
  const { tripId } = await params
  return <WetterRahmen aktiv={Boolean(process.env.OPENWEATHER_API_KEY)}>
    {config || process.env.VERCEL_ENV === 'preview'
      ? <ReisekartenRahmen key={tripId} enabled={Boolean(config)} expiresAt={config?.expiresAt ?? null}>{children}</ReisekartenRahmen>
      : children}
  </WetterRahmen>
}
