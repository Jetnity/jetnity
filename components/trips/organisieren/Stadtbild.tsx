'use client'

import { useEffect, useState } from 'react'
import { reisebildAusEtappe } from '@/lib/trips/organisieren/reisebilder'
import type { CityPhoto } from '@/lib/travel-images/city-photo'
import type { TripSummaryStage } from '@/types/trips'

type Ziel = Pick<TripSummaryStage, 'name' | 'countryCode' | 'placeId'>
const pending = new Map<string, Promise<CityPhoto | null>>()
function request(key: string): Promise<CityPhoto | null> {
  const found = pending.get(key)
  if (found) return found
  if (pending.size >= 200) pending.delete(pending.keys().next().value!)
  const value = fetch('/api/travel-images?' + key).then(async r => r.ok ? (await r.json()).photo as CityPhoto | null : null).catch(() => null)
  pending.set(key, value)
  return value
}

export function useStadtbild(ziel?: Ziel) {
  const local = reisebildAusEtappe(ziel)
  const key = local === reisebildAusEtappe() && ziel?.placeId?.startsWith('geonames:') && ziel.countryCode
    ? new URLSearchParams({ place: ziel.placeId, country: ziel.countryCode }).toString() : ''
  const [result, setResult] = useState<{ key: string; photo: CityPhoto | null } | null>(null)
  useEffect(() => {
    if (!key) return
    let active = true
    void request(key).then(photo => { if (active) setResult({ key, photo }) })
    return () => { active = false }
  }, [key])
  const photo = result?.key === key ? result.photo : null
  return { src: photo?.src ?? local, photo }
}

export function StadtbildNachweis({ ziel }: { ziel?: Ziel }) {
  const { photo } = useStadtbild(ziel)
  if (!photo) return null
  return <p className="break-words text-xs leading-5 text-ink-600">Foto {ziel?.name}: <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{photo.title}</a> · {photo.author} · <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{photo.license}</a>. Bildausschnitt je nach Darstellung.</p>
}

export function StadtbildMiniatur({ ziel, className }: { ziel?: Ziel; className: string }) {
  const { src } = useStadtbild(ziel)
  return <span className={className} style={{ backgroundImage: `url(${JSON.stringify(src)})` }} />
}
