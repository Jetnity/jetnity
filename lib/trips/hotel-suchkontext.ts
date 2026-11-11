import { geoPunktGueltig, luftlinieKm } from '@/lib/hotels/geo'
import { istOrtId } from '@/lib/places/domain'
import { hotelDaten } from '@/lib/trips/organisieren/katalog'
import type { Trip, TripStage } from '@/types/trips'

export type HotelPlanOrt = {
  key: string
  name: string
  hinweis: string
  placeId: string | null
  latitude: number | null
  longitude: number | null
  /** Manual stop titles stay inside Jetnity; the provider receives a neutral label. */
  kartenname: string
}

export function hotelPosition(ort: { latitude?: number | null; longitude?: number | null }) {
  return typeof ort.latitude === 'number' && typeof ort.longitude === 'number' &&
    geoPunktGueltig({ lat: ort.latitude, lon: ort.longitude })
    ? { lat: ort.latitude, lon: ort.longitude } : null
}

/** Read only: exact stage identity and structured places, never item titles/notes. */
export function hotelPlanOrte(reise: Trip, etappe?: TripStage): HotelPlanOrt[] {
  if (!etappe || !reise.stages.some(s => s.id === etappe.id)) return []
  const mitte = hotelPosition(etappe)
  const orte: HotelPlanOrt[] = []
  for (const stopp of [...reise.stages].sort((a, b) => a.position - b.position)) {
    const punkt = hotelPosition(stopp)
    if (stopp.id === etappe.id || !mitte || !punkt || luftlinieKm(mitte, punkt) > 50) continue
    orte.push({ key: `etappe:${stopp.id}`, name: stopp.name, hinweis: 'Stopp aus deinem Reiseplan', placeId: stopp.placeId,
      latitude: stopp.latitude, longitude: stopp.longitude, kartenname: stopp.placeId ? stopp.name : `Reisestopp ${stopp.position}` })
  }
  const punkte = [...reise.days.filter(d => d.stageId === etappe.id).flatMap(d => d.items.filter(i => !i.stageId || i.stageId === etappe.id)),
    ...reise.ohneTag.filter(i => i.stageId === etappe.id)]
  const seen = new Set([etappe.placeId, ...orte.map(o => o.placeId)])
  for (const punkt of punkte) {
    if (punkt.kind !== 'transfer' && punkt.kind !== 'flight' && punkt.kind !== 'rental_car') continue
    for (const [placeId, name] of [[punkt.destinationPlaceId, punkt.destinationName], [punkt.originPlaceId, punkt.originName]]) {
      if (!placeId || !name?.trim() || !istOrtId(placeId) || seen.has(placeId)) continue
      seen.add(placeId)
      orte.push({ key: `ort:${placeId}`, name, hinweis: 'Ort aus deiner geplanten Verbindung', placeId,
        latitude: null, longitude: null, kartenname: '' })
    }
  }
  return orte.slice(0, 12)
}

/** Changes to relevant graph facts invalidate search drafts, including removed coordinates. */
export function hotelKontextVersion(reise: Trip): string {
  return JSON.stringify([reise.id, reise.travellers, reise.currency, reise.stages.map(s =>
    [s, hotelDaten(reise, s), hotelPlanOrte(reise, s)])])
}
