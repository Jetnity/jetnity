'use client'

import { useEffect, useState } from 'react'
import { nenntNurLand, reisebildAusEtappe } from '@/lib/trips/organisieren/reisebilder'
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
  // Never pin a network failure or a no-photo response for this whole browser
  // visit. The original Map kept Promise<null> until the tab was closed.
  void value.then(photo => { if (!photo && pending.get(key) === value) pending.delete(key) })
  return value
}

export function useStadtbild(ziel?: Ziel) {
  const local = reisebildAusEtappe(ziel)
  const key = local === reisebildAusEtappe() && !nenntNurLand(ziel) && ziel?.placeId?.startsWith('geonames:') && ziel.countryCode
    ? new URLSearchParams({ place: ziel.placeId, country: ziel.countryCode }).toString() : ''
  const [result, setResult] = useState<{ key: string; photo: CityPhoto | null } | null>(null)
  useEffect(() => {
    if (!key) return
    let active = true
    let retry: ReturnType<typeof setTimeout> | null = null
    void request(key).then(photo => {
      if (!active) return
      setResult({ key, photo })
      // One bounded retry permits the user to see newly recovered licensed
      // Commons imagery without refreshing the entire travel workspace.
      // No loop, no extra retry for successful requests, no paid provider.
      if (!photo) retry = setTimeout(() => {
        if (!active) return
        void request(key).then(next => { if (active) setResult({ key, photo: next }) })
      }, 75_000)
    })
    return () => { active = false; if (retry !== null) clearTimeout(retry) }
  }, [key])
  const photo = result?.key === key ? result.photo : null
  return { src: photo?.src ?? local, photo }
}

export function StadtbildNachweis({ ziel }: { ziel?: Ziel }) {
  const { photo } = useStadtbild(ziel)
  if (!photo) return null
  return <p className="max-w-prose break-words text-xs leading-5 text-ink-600">Foto {ziel?.name}: <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{photo.title}</a> · {photo.author} · <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{photo.license}</a>. Bildausschnitt je nach Darstellung.</p>
}

export function StadtbildMiniatur({ ziel, className }: { ziel?: Ziel; className: string }) {
  const { src } = useStadtbild(ziel)
  return <span className={className} style={{ backgroundImage: `url(${JSON.stringify(src)})` }} />
}
