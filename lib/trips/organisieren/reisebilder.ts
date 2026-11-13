import type { TripSummaryStage } from '@/types/trips'

type Bildziel = {
  land: string
  ids: readonly string[]
  namen: readonly string[]
  src: string
}

const lokal = (name: string) => `/images/organisieren/${name}.webp`

// Local editorial assets only. Available sources and licensing are recorded in
// public/images/organisieren/Bildnachweise.txt; inherited JPG provenance gaps
// are tracked in docs/PRIVATE_TRAVEL_UX_IMAGES_2026-11-13.md. This bounded catalogue
// not a promise of worldwide coverage or a runtime third-party image search.
const ziele: readonly Bildziel[] = [
  { land: 'FR', ids: ['geonames:2988507'], namen: ['paris'], src: '/images/organisieren/paris.jpg' },
  { land: 'TH', ids: ['geonames:1609350', 'geonames:1609348', 'airport:BKK', 'airport:DMK'], namen: ['bangkok'], src: lokal('hero') },
  { land: 'TH', ids: ['geonames:1611309'], namen: ['ko chang', 'koh chang'], src: lokal('chang') },
  { land: 'TH', ids: ['geonames:1151254', 'airport:HKT'], namen: ['phuket'], src: lokal('phuket') },
  { land: 'TH', ids: ['geonames:1605651'], namen: ['thailand'], src: lokal('hero') },
  { land: 'ID', ids: ['geonames:1631470'], namen: ['nusa penida'], src: lokal('nusa-penida') },
  { land: 'PA', ids: ['geonames:3703430', 'geonames:3703443'], namen: ['panama', 'panama city', 'panama-stadt', 'ciudad de panama'], src: lokal('panama') },
  { land: 'NL', ids: ['geonames:2759794'], namen: ['amsterdam'], src: '/images/amsterdam.jpg' },
  { land: 'PT', ids: ['geonames:2267057'], namen: ['lissabon', 'lisbon', 'lisboa'], src: '/images/lisbon.jpg' },
  { land: 'CH', ids: ['geonames:2657928'], namen: ['zermatt'], src: '/images/zermatt.jpg' },
]

function namensschluessel(name: string): string {
  return name.trim().toLocaleLowerCase('de').normalize('NFD').replace(/\p{M}/gu, '').replace(/\s+/g, ' ')
}

/** Unknown or contradictory places receive a neutral map, never another city's photo. */
export function reisebildAusEtappe(etappe?: Pick<TripSummaryStage, 'name' | 'countryCode' | 'placeId'>): string {
  const neutral = lokal('reiseatlas')
  if (!etappe) return neutral
  const placeId = etappe.placeId
  if (placeId) {
    const ziel = ziele.find((eintrag) => eintrag.ids.includes(placeId))
    return ziel && (!etappe.countryCode || etappe.countryCode === ziel.land) ? ziel.src : neutral
  }
  // Legacy display names are accepted only together with their explicit country.
  const name = namensschluessel(etappe.name)
  const ziel = ziele.find((eintrag) => eintrag.land === etappe.countryCode && eintrag.namen.includes(name))
  return ziel?.src ?? neutral
}
