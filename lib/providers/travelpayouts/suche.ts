import { heutigesDatum } from '@/lib/account/naechste-reise'
import { tageDifferenz, tageUtc } from '@/lib/activities/zeit'
import type { Trip } from '@/types/trips'

export interface FlugVergleichEingabe {
  art: 'einfach' | 'retour' | 'gabel'
  von?: string
  nach?: string
  rueckflugAb?: string
  hin: string
  rueck: string
  erwachsene: number
  kinder: number
  babys: number
  kabine: 'economy' | 'business'
}

/** Dedicated host required: never execute provider code on the account origin. */
export function flugWidgetOrigin(value: string | undefined): string | null {
  if (!value) return null
  try {
    const u = new URL(value)
    const local = u.hostname === '127.0.0.1' || u.hostname === 'localhost'
    if (
      (u.protocol !== 'https:' && !(local && u.protocol === 'http:')) ||
      u.username ||
      u.password ||
      u.search ||
      u.hash ||
      u.pathname !== '/'
    )
      return null
    if (u.hostname === 'jetnity.com' || u.hostname === 'www.jetnity.com')
      return null
    return u.origin
  } catch {
    return null
  }
}

export function flugKontext(reise: Trip): string {
  return JSON.stringify([
    reise.id,
    reise.originPlaceId,
    reise.origin,
    reise.startDate,
    reise.endDate,
    reise.travellers,
    reise.stages.map((s) => [s.id, s.placeId, s.name, s.latitude, s.longitude]),
  ])
}

export function flugVergleichUrl(
  e: FlugVergleichEingabe,
  origin: string,
  heute = heutigesDatum(),
): { url: string } | { fehler: string } {
  const host = flugWidgetOrigin(origin)
  if (!host) return { fehler: 'Die Flugsuche ist gerade nicht verfügbar.' }
  const iata = (v?: string): v is string =>
    typeof v === 'string' && /^[A-Z]{3}$/.test(v)
  if (
    !['einfach', 'retour', 'gabel'].includes(e.art) ||
    !iata(e.von) ||
    !iata(e.nach) ||
    (e.art === 'gabel' && !iata(e.rueckflugAb))
  )
    return { fehler: 'Bitte wähle alle Flughäfen aus den Vorschlägen.' }
  if (e.von === e.nach || (e.art === 'gabel' && e.von === e.rueckflugAb))
    return { fehler: 'Abflug und Ankunft müssen verschieden sein.' }
  // The documented flightSearch format omits the year: only encode the next occurrence.
  const daten = e.art === 'einfach' ? [e.hin] : [e.hin, e.rueck]
  if (
    tageUtc(heute) === null ||
    daten.some(
      (d) =>
        tageUtc(d) === null ||
        d < heute ||
        (tageDifferenz(heute, d) ?? 999) > 330,
    ) ||
    (e.art !== 'einfach' && e.rueck < e.hin)
  )
    return {
      fehler:
        'Bitte wähle gültige Flugtermine innerhalb der nächsten 330 Tage. Der Rückflug darf nicht vor dem Hinflug liegen.',
    }
  const gaeste = [e.erwachsene, e.kinder, e.babys]
  if (
    gaeste.some((n) => !Number.isInteger(n) || n < 0) ||
    e.erwachsene < 1 ||
    gaeste.reduce((a, b) => a + b, 0) > 9 ||
    e.babys > e.erwachsene
  )
    return {
      fehler: 'Wähle bis zu 9 Reisende und höchstens ein Baby pro Erwachsenen.',
    }
  if (e.kabine !== 'economy' && e.kabine !== 'business')
    return { fehler: 'Bitte wähle Economy oder Business.' }
  const ddmm = (d: string) => d.slice(8, 10) + d.slice(5, 7)
  let search = e.von + ddmm(e.hin) + e.nach
  if (e.art === 'retour') search += ddmm(e.rueck)
  if (e.art === 'gabel') search += '-' + e.rueckflugAb + ddmm(e.rueck)
  search += (e.kabine === 'business' ? 'c' : '') + e.erwachsene
  if (e.kinder || e.babys) search += e.kinder
  if (e.babys) search += e.babys
  const url = new URL('/', host)
  url.searchParams.set('flightSearch', search)
  url.searchParams.set('origin_airports', e.art === 'einfach' ? '0' : '0,1')
  url.searchParams.set(
    'destination_airports',
    e.art === 'einfach' ? '0' : '0,1',
  )
  return { url: url.href }
}
