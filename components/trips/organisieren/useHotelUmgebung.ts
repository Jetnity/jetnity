'use client'

import { useEffect, useState } from 'react'
import { ortBestaetigen } from '@/lib/places/aktionen'
import { hotelPosition, type HotelPlanOrt } from '@/lib/trips/hotel-suchkontext'
import type { Stay22Ort } from '@/lib/providers/stay22/suche'

export default function useHotelUmgebung(anker?: HotelPlanOrt) {
  const identitaet = JSON.stringify(anker ?? null)
  const [geladen, setGeladen] = useState<{ identitaet: string; ort: Stay22Ort | null; fehler: string } | null>(null)
  const position = anker && hotelPosition(anker)
  const direkt: Stay22Ort | null = anker && position ? {
    name: anker.name, adresse: anker.kartenname || 'Reisestopp', latitude: position.lat, longitude: position.lon,
  } : null
  const placeId = anker?.placeId
  const bekanntePosition = Boolean(position)
  useEffect(() => {
    if (!placeId || bekanntePosition) return
    let aktuell = true
    void ortBestaetigen(placeId, placeId.startsWith('airport:') ? 'abreise' : 'ziel')
      .then(result => {
        if (!aktuell) return
        const ort = result.ok ? result.wert : null
        setGeladen({ identitaet, ort: ort ? { name: ort.name, adresse: [ort.name, ort.region, ort.country].filter(Boolean).join(', '), latitude: ort.lat, longitude: ort.lon } : null,
          fehler: result.ok ? '' : result.meldung })
      }).catch(() => {
        if (aktuell) setGeladen({ identitaet, ort: null, fehler: 'Dieser Reiseort konnte nicht geladen werden. Wähle die Etappe oder einen anderen Ort.' })
      })
    return () => { aktuell = false }
  }, [identitaet, placeId, bekanntePosition])
  const passend = geladen?.identitaet === identitaet ? geladen : null
  return { ort: direkt ?? passend?.ort ?? null, laedt: Boolean(anker?.placeId && !direkt && !passend), fehler: passend?.fehler ?? '' }
}
