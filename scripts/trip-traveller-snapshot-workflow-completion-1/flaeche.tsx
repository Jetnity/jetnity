import { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'

import TripWorkspace from '@/components/trips/TripWorkspace'
import type { TravellerDocumentType, Trip } from '@/types/trips'

type Payload = {
  clientRef: string
  label: string | null
  residenceCountryCode: string | null
  citizenships: Array<{ clientRef?: string; countryCode: string }>
  documents: Array<{
    clientRef?: string
    documentType: TravellerDocumentType
    issuingCountryCode: string | null
    expiresOn: string | null
    citizenshipClientRef: string | null
  }>
}

type Start = {
  reise: Trip
}

type Bruecke = {
  payloads: Payload[]
}

declare global {
  interface Window {
    __START__: Start
    __SNAPSHOT__: Bruecke
  }
}

function Host() {
  const start = window.__START__
  const payloads = useRef<Payload[]>([])

  useEffect(() => {
    window.__SNAPSHOT__ = {
      get payloads() {
        return payloads.current
      },
    }
  }, [])

  return (
    <div data-workspace-harness="trip">
      <TripWorkspace
        reise={start.reise}
        quelle="account"
        onPunktAnlegen={async () => null}
        onPunktEntfernen={async () => null}
        onTravellerSetzen={async (eingabe) => {
          payloads.current.push(eingabe)
          return null
        }}
        onTravellerEntfernen={async () => null}
      />
    </div>
  )
}

const wurzel = document.getElementById('root')
if (!wurzel) throw new Error('Montagepunkt fehlt')
createRoot(wurzel).render(<Host />)
