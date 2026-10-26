// lib/activities/getyourguide/widget.ts
//
// GetYourGuide-eigene Naht. Kein generisches Plugin, kein geratenes Markup,
// kein Skript und keine Produktadresse. Die Anwendung bleibt leer.

import type { Ort } from '@/lib/places/domain'

import { anwendungsFreigabe, type GetYourGuideFreigabe } from '@/lib/activities/getyourguide/freigabe'

export type GygZielabbildung =
  | { art: 'ort'; ortId: string; typ: 'city' | 'region' | 'island'; kennung: string }
  | { art: 'land'; countryCode: string; kennung: string }

export type GygOeffentlicherBezug = {
  readonly anbieter: 'getyourguide'
  readonly umfang: 'stadt' | 'region' | 'insel' | 'land'
  readonly oeffentlicheKennung: string
}

export type GygLadeErgebnis = { art: 'ressource' } | { art: 'abgelehnt'; meldung: string }

export type GygRenderer = {
  laden: (
    bezug: GygOeffentlicherBezug,
    ziel: HTMLElement,
    signal: AbortSignal,
  ) => Promise<GygLadeErgebnis>
  entsorgen: (ziel: HTMLElement) => void
}

/**
 * Asynchrone exakte Ortsbestätigung für die Prüfung.
 * Die Anwendung übergibt null. Das ist nicht der Places-Serveraufruf.
 */
export type GygKanonBestaetigen = (id: string, signal: AbortSignal) => Promise<Ort | null>

export type GetYourGuideNaht = {
  herkunft: 'anwendung' | 'pruefung'
  freigabe: GetYourGuideFreigabe
  orteLesen: ((id: string) => Ort | null) | null
  kanonBestaetigen: GygKanonBestaetigen | null
  abbildung: readonly GygZielabbildung[]
  renderer: GygRenderer | null
}

export const GETYOURGUIDE_ANWENDUNGS_ABBILDUNG: readonly GygZielabbildung[] = Object.freeze([])

export const ANWENDUNGS_NAHT: GetYourGuideNaht = Object.freeze({
  herkunft: 'anwendung' as const,
  freigabe: anwendungsFreigabe(),
  orteLesen: null,
  kanonBestaetigen: null,
  abbildung: GETYOURGUIDE_ANWENDUNGS_ABBILDUNG,
  renderer: null,
})

const BEZUG_SCHLUESSEL = ['anbieter', 'umfang', 'oeffentlicheKennung'] as const
const UMFANG = {
  city: 'stadt',
  region: 'region',
  island: 'insel',
  land: 'land',
} as const

function kennungZulaessig(kennung: string, gesperrt: readonly string[]): boolean {
  if (!/^[a-z0-9][a-z0-9:-]{2,79}$/.test(kennung)) return false
  if (/https?:|geonames:|airport:|\/|@|\s/i.test(kennung)) return false
  const vergleich = kennung.toLowerCase()
  return !gesperrt.some((privat) => {
    if (!privat) return false
    const wert = privat.toLowerCase()
    if (wert === vergleich) return true
    return wert.length >= 8 && vergleich.includes(wert)
  })
}

export function oeffentlichenBezugBauen(
  ziel:
    | { art: 'ort'; ortId: string; typ: 'city' | 'region' | 'island' }
    | { art: 'land'; countryCode: string },
  abbildung: readonly GygZielabbildung[],
  gesperrt: readonly string[] = [],
): GygOeffentlicherBezug | null {
  const treffer = abbildung.filter((eintrag) => {
    if (ziel.art === 'land') return eintrag.art === 'land' && eintrag.countryCode === ziel.countryCode
    return eintrag.art === 'ort' && eintrag.ortId === ziel.ortId && eintrag.typ === ziel.typ
  })
  if (treffer.length !== 1) return null
  const kennung = treffer[0]?.kennung
  if (!kennung || !kennungZulaessig(kennung, gesperrt)) return null
  const umfang = ziel.art === 'land' ? UMFANG.land : UMFANG[ziel.typ]
  return Object.freeze({
    anbieter: 'getyourguide',
    umfang,
    oeffentlicheKennung: kennung,
  })
}

export function bezugIstOeffentlich(wert: unknown): wert is GygOeffentlicherBezug {
  if (!wert || typeof wert !== 'object') return false
  const schluessel = Object.keys(wert)
  if (schluessel.length !== BEZUG_SCHLUESSEL.length) return false
  if (BEZUG_SCHLUESSEL.some((name) => !schluessel.includes(name))) return false
  const bezug = wert as GygOeffentlicherBezug
  if (bezug.anbieter !== 'getyourguide') return false
  if (bezug.umfang !== 'stadt' && bezug.umfang !== 'region' && bezug.umfang !== 'insel' && bezug.umfang !== 'land') {
    return false
  }
  return typeof bezug.oeffentlicheKennung === 'string' && /^[a-z0-9][a-z0-9:-]{2,79}$/.test(bezug.oeffentlicheKennung)
}

export function gygLadenErlaubt(
  art: string,
  ausloeser: 'aktion' | 'mount' | 'hover' | 'wechsel',
): boolean {
  return art === 'bereit' && ausloeser === 'aktion'
}
