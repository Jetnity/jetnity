import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'

import RegistryReiseUebernahme from '@/components/trips/RegistryReiseUebernahme'
import TripWorkspace from '@/components/trips/TripWorkspace'
import TripWorkspaceAuditClient from '@/components/trips/TripWorkspaceAuditClient'
import KontoArbeitsbereich from '@/components/trips/KontoArbeitsbereich'
import GastArbeitsbereich from '@/components/trips/GastArbeitsbereich'
import { gastReadinessSetzen } from '@/lib/readiness/gast'
import { gastreiseSpeichern } from '@/lib/trips/gastspeicher'
import type { Problem } from '@/lib/api/datenbank-lesen'
import type { RegistryTripAnzeige } from '@/lib/traveller/account-registry-trip'
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

type Ergebnis = 'null' | 'string' | 'throw' | 'reject' | 'object'

type RegistryStart = {
  problem: Problem | null
  travellers: RegistryTripAnzeige[] | null
  voll?: boolean
}

type Start =
  | { art: 'account'; reise: Trip; seam?: 'account' | 'guest'; registry?: RegistryStart | null }
  | { art: 'guest'; reise: Trip }
  | { art: 'audit'; nutzlast: unknown }
  | { art: 'konto'; reise: Trip; registry: { problem: Problem | null; travellers: RegistryTripAnzeige[] | null } }

type Bridge = {
  payloads: Payload[]
  entfernen: string[]
  intake: unknown[]
  refresh: () => number
  verhalten: (wert: Ergebnis | 'hold') => void
  refreshWirft: (an: boolean) => void
  freigeben: (wert: Ergebnis) => void
  kanonischSetzen: (reise: Trip) => void
  beideSetzen: (reise: Trip) => void
  reiseSetzen: (reise: Trip) => void
  registrySetzen: (registry: RegistryStart | null) => void
  ausblenden: () => void
  einblenden: () => void
}

declare global {
  interface Window {
    __START__: Start
    __MATRIX__?: Bridge
    __KONTO_AUFRUFE__?: Array<{ name: string; args: unknown[] }>
    __READBACK_LEFT__?: number
    __GET_THROW_LEFT__?: number
  }
}

function wertAus(art: Ergebnis): Promise<string | null> {
  if (art === 'string') return Promise.resolve('Das Ergebnis bleibt unbewiesen.')
  if (art === 'throw') throw new Error('writer')
  if (art === 'reject') return Promise.reject(new Error('writer'))
  if (art === 'object') return Promise.resolve({ falsch: true } as unknown as string)
  return Promise.resolve(null)
}

function AccountHost({ start }: { start: Extract<Start, { art: 'account' }> }) {
  const [reise, setReise] = useState(start.reise)
  const [kanonisch, setKanonisch] = useState(start.reise)
  const [registry, setRegistry] = useState<RegistryStart | null>(start.registry ?? null)
  const [sichtbar, setSichtbar] = useState(true)
  const verhalten = useRef<Ergebnis | 'hold'>('null')
  const refreshWirft = useRef(false)
  const wartend = useRef<Array<(wert: Ergebnis) => void>>([])
  const payloads = useRef<Payload[]>([])
  const entfernen = useRef<string[]>([])
  const intake = useRef<unknown[]>([])
  const refresh = useRef(0)
  const seam = start.seam ?? 'account'

  async function warten(): Promise<string | null> {
    if (verhalten.current === 'hold') {
      const wert = await new Promise<Ergebnis>((resolve) => {
        wartend.current.push(resolve)
      })
      return wertAus(wert)
    }
    return wertAus(verhalten.current)
  }

  useEffect(() => {
    window.__MATRIX__ = {
      get payloads() {
        return payloads.current
      },
      get entfernen() {
        return entfernen.current
      },
      get intake() {
        return intake.current
      },
      refresh: () => refresh.current,
      verhalten: (wert) => {
        verhalten.current = wert
      },
      refreshWirft: (an) => {
        refreshWirft.current = an
      },
      freigeben: (wert) => {
        wartend.current.shift()?.(wert)
      },
      kanonischSetzen: (naechste) => {
        flushSync(() => setKanonisch(naechste))
      },
      beideSetzen: (naechste) => {
        flushSync(() => {
          setReise(naechste)
          setKanonisch(naechste)
        })
      },
      reiseSetzen: (naechste) => {
        flushSync(() => setReise(naechste))
      },
      registrySetzen: (naechste) => {
        flushSync(() => setRegistry(naechste))
      },
      ausblenden: () => flushSync(() => setSichtbar(false)),
      einblenden: () => flushSync(() => setSichtbar(true)),
    }
  })

  if (!sichtbar) return <p data-matrix="weg">Arbeitsbereich ist ausgeblendet</p>

  return (
    <TripWorkspace
      reise={reise}
      quelle={seam === 'guest' ? 'guest' : 'account'}
      readinessKanonischeReise={seam === 'guest' ? undefined : kanonisch}
      onPunktAnlegen={async () => null}
      onPunktEntfernen={async () => null}
      onReadinessAktualisieren={async () => {
        refresh.current += 1
        if (refreshWirft.current) throw new Error('refresh')
        return { art: 'props' }
      }}
      onTravellerSetzen={async (eingabe) => {
        payloads.current.push(eingabe)
        return warten()
      }}
      onTravellerEntfernen={async (clientRef) => {
        entfernen.current.push(clientRef)
        return warten()
      }}
      registrySteuerung={
        registry
          ? (steuerung) => (
              <RegistryReiseUebernahme
                problem={registry.problem}
                travellers={registry.travellers}
                voll={registry.voll === true}
                tripId={reise.id}
                steuerung={steuerung}
                onUebernehmen={async (paar) => {
                  intake.current.push(paar)
                  return warten()
                }}
              />
            )
          : undefined
      }
    />
  )
}

function GuestHost({ reise }: { reise: Trip }) {
  useState(() => {
    localStorage.removeItem('jetnity:reise:v3')
    const graph = gastreiseSpeichern(reise)
    gastReadinessSetzen(graph, {
      clientRef: 'preparation-stand',
      kind: 'preparation',
      userStatus: 'open',
      countryCode: null,
      tripItemId: null,
      title: 'Stand lesen',
    })
    return true
  })
  return <GastArbeitsbereich tripId={reise.id} />
}

function AuditHost({ nutzlast }: { nutzlast: unknown }) {
  useState(() => {
    sessionStorage.setItem('jetnity:ui-audit:workspace', JSON.stringify(nutzlast))
    return true
  })
  return <TripWorkspaceAuditClient />
}

function KontoHost({
  reise,
  registry,
}: {
  reise: Trip
  registry: { problem: Problem | null; travellers: RegistryTripAnzeige[] | null }
}) {
  useState(() => {
    window.__KONTO_AUFRUFE__ = []
    return true
  })
  return <KontoArbeitsbereich reise={reise} ohneTag={[]} officialEvaluations={[]} registry={registry} />
}

function Host() {
  const start = window.__START__
  if (start.art === 'guest') return <GuestHost reise={start.reise} />
  if (start.art === 'audit') return <AuditHost nutzlast={start.nutzlast} />
  if (start.art === 'konto') return <KontoHost reise={start.reise} registry={start.registry} />
  return <AccountHost start={start} />
}

const wurzel = document.getElementById('root')
if (!wurzel) throw new Error('Montagepunkt fehlt')
createRoot(wurzel).render(<Host />)
