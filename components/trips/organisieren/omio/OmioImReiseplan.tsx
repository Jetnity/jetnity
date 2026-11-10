'use client'
import { useEffect, useMemo, useState } from 'react'
import type { Trip } from '@/types/trips'
import { reiseAbschnitte } from '@/lib/providers/omio/reise'
import type { Register } from '@/lib/providers/omio/katalog'
import OmioVergleich from './OmioVergleich'
import Verbindungen from '../Verbindungen'

export default function OmioImReiseplan({ reise, etappen, kanteId }: { reise: Trip; etappen: React.ReactNode; kanteId?: string }) {
  const [register, setRegister] = useState<Register | null>(null),
    [fehler, setFehler] = useState(false),
    [versuch, setVersuch] = useState(0)
  useEffect(() => {
    const request = new AbortController()
    fetch('/api/mobility/omio', { signal: request.signal })
      .then(async (res) => {
        if (!res.ok) throw Error()
        const data: Register = await res.json()
        if (!request.signal.aborted) setRegister(data)
      })
      .catch(() => {
        if (!request.signal.aborted) setFehler(true)
      })
    return () => request.abort()
  }, [versuch])
  const abschnitte = useMemo(() => reiseAbschnitte(reise), [reise])
  const startIndex = kanteId ? abschnitte.findIndex(s => s.kanteId === kanteId) : 0
  const start = abschnitte[startIndex]
  const fehlt = Boolean(kanteId && !start)
  if (fehler)
    return (
      <>
        <p className="ov-hint" role="status">
          Omio-Katalog vorübergehend nicht verfügbar.{' '}
          <button
            type="button"
            className="underline"
            onClick={() => {
              setFehler(false)
              setVersuch((v) => v + 1)
            }}
          >
            Erneut laden
          </button>
        </p>
        <Verbindungen reise={reise} etappen={etappen} start={start} abschnittFehlt={fehlt} />
      </>
    )
  if (!register)
    return (
      <p className="ov-hint" role="status">
        Streckenkatalog wird geladen …
      </p>
    )
  return (
    <>
      {fehlt && <p className="ov-hint" role="status">Dieser Reiseabschnitt hat sich geändert. Wähle Start und Ziel erneut.</p>}
      <OmioVergleich
      key={reise.id}
      startIndex={startIndex}
      katalog={register}
      abschnitte={abschnitte}
      kontext={reise.id}
      reisende={reise.travellers}
      waehrung={reise.currency}
    />
    </>
  )
}
