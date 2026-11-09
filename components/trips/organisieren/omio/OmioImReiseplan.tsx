'use client'
import { useEffect, useMemo, useState } from 'react'
import type { Trip } from '@/types/trips'
import OmioVergleich from './OmioVergleich'
import { type Katalog, type Ort } from './katalog'

/** Local pilot. Its catalog is provided by the Swiss advertiser export. */
export default function OmioImReiseplan({ reise }: { reise: Trip }) {
  const [katalog, setKatalog] = useState<Katalog | null>(null),
    [fehler, setFehler] = useState(false),
    [versuch, setVersuch] = useState(0)
  useEffect(() => {
    const request = new AbortController()
    fetch('/omio-prototyp/katalog.json', { signal: request.signal })
      .then(async (res) => {
        if (!res.ok) throw Error()
        const data = (await res.json()) as Katalog
        if (!Array.isArray(data.places) || !data.routes || !data.publisher) throw Error()
        if (!request.signal.aborted) setKatalog(data)
      })
      .catch(() => {
        if (!request.signal.aborted) setFehler(true)
      })
    return () => request.abort()
  }, [versuch])
  const abschnitte = useMemo(() => {
    const stationen: { ort: Ort; datum: string }[] = reise.stages.map((s) => ({
      ort: {
        id: 'reise:' + s.id,
        name: s.name,
        country: s.countryCode ?? '',
        lat: s.latitude,
        lng: s.longitude,
      },
      datum: s.arrivalDate ?? '',
    }))
    if (reise.origin && reise.origin !== stationen[0]?.ort.name)
      stationen.unshift({
        ort: { id: 'reise:ursprung', name: reise.origin, country: '', lat: null, lng: null },
        datum: reise.startDate ?? '',
      })
    return stationen.slice(1).map((s, i) => ({ von: stationen[i]!.ort, nach: s.ort, datum: s.datum }))
  }, [reise])
  if (fehler)
    return (
      <p role="status">
        Der Omio-Katalog konnte nicht geladen werden.{' '}
        <button
          type="button"
          onClick={() => {
            setFehler(false)
            setVersuch((v) => v + 1)
          }}
        >
          Erneut versuchen
        </button>
      </p>
    )
  if (!katalog) return <p role="status">Streckenkatalog wird geladen …</p>
  return <OmioVergleich katalog={katalog} abschnitte={abschnitte} kontext={reise.id} />
}
