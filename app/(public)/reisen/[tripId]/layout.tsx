import '@/components/trips/reiseplan/etappen.css'
import '@/components/trips/reiseplan/etappen-tage.css'
import '@/components/trips/reiseplan/kartenauswahl.css'
import '@/components/trips/kostenkarte.css'
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
import { mapPilotConfig } from '@/lib/maps/config'
import { weatherRequestOrigin } from '@/lib/reisewetter/request-origin'
import { weatherProviderConfigured } from '@/lib/reisewetter/provider-config'

export default async function ReiseLayout({ children, params }: { children: ReactNode; params: Promise<{ tripId: string }> }) {
  const origin = weatherRequestOrigin(process.env)
  if (!origin) return children
  await connection()
  if ((await headers()).get('host') !== new URL(origin).host) return children
  const config = mapPilotConfig(process.env, origin)
  const { tripId } = await params
  return <WetterRahmen aktiv={weatherProviderConfigured(process.env.OPENWEATHER_API_KEY)}>
    {config || process.env.VERCEL_ENV === 'preview'
      ? <ReisekartenRahmen key={tripId} enabled={Boolean(config)} expiresAt={config?.expiresAt ?? null}>{children}</ReisekartenRahmen>
      : children}
  </WetterRahmen>
}
