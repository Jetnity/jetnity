import type { Trip } from '@/types/trips'
import { normal, tag, type Abschnitt, type Ort } from './katalog'

type ReiseAbschnitt = Abschnitt & { kanteId: string; ausTagesplan?: boolean }

function wechselImTagesplan(reise: Trip) {
  const tage = [...(reise.days ?? [])].sort((a, b) => a.dayIndex - b.dayIndex)
  const daten = new Map<string, string>()
  if (new Set(tage.map(tag => tag.dayIndex)).size !== tage.length) return daten
  for (let i = 1; i < tage.length; i++) {
    const von = tage[i - 1]
    const nach = tage[i]
    if (!von.stageId || !nach.stageId || von.stageId === nach.stageId) continue
    const id = `connection:${von.stageId}:${nach.stageId}`
    const genauEinTag = nach.dayIndex === von.dayIndex + 1 && von.dayDate && nach.dayDate &&
      tag(von.dayDate) && tag(nach.dayDate) && Date.parse(nach.dayDate) - Date.parse(von.dayDate) === 86_400_000
    daten.set(id, genauEinTag && !daten.has(id) ? nach.dayDate! : '')
  }
  return daten
}
export function reiseAbschnitte(reise: Trip): ReiseAbschnitt[] {
  const stages = [...reise.stages].sort((a, b) => a.position - b.position)
  const stopps = stages.map((s) => ({
    ort: {
      id: 'reise:' + s.id,
      name: s.name,
      country: s.countryCode ?? '',
      lat: s.latitude,
      lng: s.longitude,
      placeId: s.placeId,
    } satisfies Ort,
    an: s.arrivalDate,
    ab: s.departureDate,
  }))
  const legs: ReiseAbschnitt[] = []
  const tagesplan = wechselImTagesplan(reise)
  for (let i = 1; i < stopps.length; i++) {
    const a = stopps[i - 1]!,
      b = stopps[i]!
    if (a.ort.placeId && a.ort.placeId === b.ort.placeId) continue
    const kanteId = `connection:${stages[i - 1].id}:${stages[i].id}`
    const gespeichert = [b.an, a.ab].find((v) => v && tag(v)) ?? ''
    const vorschlag = tagesplan.get(kanteId)
    legs.push({ kanteId, von: a.ort, nach: b.ort, datum: gespeichert || vorschlag || '',
      ausTagesplan: !gespeichert && Boolean(vorschlag) })
  }
  const start = stopps[0]
  if (
    reise.origin &&
    start &&
    normal(reise.origin) !== normal(start.ort.name) &&
    !(reise.originPlaceId && reise.originPlaceId === start.ort.placeId)
  ) {
    const von: Ort = {
      id: 'reise:ursprung',
      name: reise.origin,
      country: '',
      lat: null,
      lng: null,
      placeId: reise.originPlaceId,
    }
    legs.push({ kanteId: `outbound:${stages[0].id}`, von, nach: start.ort, datum: reise.startDate ?? start.an ?? '' })
  }
  return legs
}
