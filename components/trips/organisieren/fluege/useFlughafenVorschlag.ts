'use client'

import { useEffect, useRef, useState } from 'react'
import type { FlughafenAuswahl } from '@/lib/airports/auswahl'
import { FLUGHAFEN_VORSCHLAG_RADIUS_KM, type FlughafenVorschlag } from '@/lib/airports/naechster'

/**
 * Flughafenfeld mit Vorbelegung: Fehlt ein bekannter Flughafen, fragt das Feld
 * einmal nach dem nächsten großen Flughafen zum Katalogort. Eine eigene Wahl
 * des Nutzers wird nie nachträglich überschrieben.
 */
export function useFlughafenVorschlag(
  anfang: FlughafenAuswahl | null,
  ort: { placeId: string | null | undefined; name: string | null | undefined },
): [FlughafenAuswahl | null, (wert: FlughafenAuswahl | null) => void, string | null] {
  const [wert, setWert] = useState(anfang)
  const [hinweis, setHinweis] = useState<string | null>(null)
  const beruehrt = useRef(false)
  const placeId = anfang ? null : ort.placeId?.trim() || null
  const name = ort.name?.trim() || 'dieses Ziel'

  useEffect(() => {
    if (!placeId) return
    const abbruch = new AbortController()
    fetch(`/api/search/airports?naechster=${encodeURIComponent(placeId)}`, { signal: abbruch.signal })
      .then((antwort) => (antwort.ok ? (antwort.json() as Promise<{ vorschlag: FlughafenVorschlag | null }>) : null))
      .then((daten) => {
        if (!daten || beruehrt.current) return
        if (daten.vorschlag) {
          setWert({ iata: daten.vorschlag.iata, name: daten.vorschlag.name })
          setHinweis(`Vorschlag: nächster grosser Flughafen, ca. ${daten.vorschlag.km} km von ${name}. Du kannst ihn ändern.`)
        } else {
          setHinweis(`Im Umkreis von ${FLUGHAFEN_VORSCHLAG_RADIUS_KM} km um ${name} ist kein grosser Linienflughafen hinterlegt. Bitte wähle einen Flughafen.`)
        }
      })
      .catch(() => {})
    return () => abbruch.abort()
  }, [placeId, name])

  const setzen = (neu: FlughafenAuswahl | null) => {
    beruehrt.current = true
    setHinweis(null)
    setWert(neu)
  }
  return [wert, setzen, hinweis]
}
