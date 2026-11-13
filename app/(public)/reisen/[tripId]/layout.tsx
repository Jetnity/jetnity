import '@/components/trips/reiseplan/etappen.css'
import '@/components/trips/reiseplan/etappen-tage.css'
import '@/components/trips/reiseplan/kartenauswahl.css'
import type { ReactNode } from 'react'
import 'leaflet/dist/leaflet.css'
import '@/components/trips/organisieren/omio/vergleich.css'
import '@/components/trips/organisieren/organisieren.css'
import '@/components/trips/organisieren/hotelsuche.css'
import '@/components/trips/organisieren/fluege/flugsuche.css'

export default function ReiseLayout({ children }: { children: ReactNode }) {
  return children
}
