import type { Trip } from '@/types/trips'
import { tripMapStops } from './trip-map'

export type Position = { lat: number; lng: number }
export type Reiseort = {
  id: string
  name: string
  art: 'Abreise' | 'Etappe' | 'Hotel' | 'Besuch' | 'Flughafen'
  etappeId?: string
  detail?: string
  position: Position | null
  tage: string[]
}
export function istPosition(p: unknown): p is Position {
  if (!p || typeof p !== 'object' || !('lat' in p) || !('lng' in p)) return false
  return typeof p.lat === 'number' && Number.isFinite(p.lat) && Math.abs(p.lat) <= 90
    && typeof p.lng === 'number' && Number.isFinite(p.lng) && Math.abs(p.lng) <= 180
}
export const PARIS_ORTE: Reiseort[] = [
  { id: 'cdg-t2', art: 'Flughafen', name: 'Paris Charles de Gaulle', detail: 'Bahnhof CDG 2 TGV · Terminal 2', position: { lat: 49.004233, lng: 2.570917 }, tage: ['ankunft'] },
  { id: 'normandy', art: 'Hotel', name: 'Normandy Hotel', detail: '7 rue de l’Échelle, Paris', position: { lat: 48.8641052, lng: 2.334119 }, tage: ['ankunft', 'museen'] },
  // The Louvre's visitor directions link identifies the Cour Napoléon entrance.
  // https://www.louvre.fr/en/visit/map-entrances-directions
  { id: 'louvre', art: 'Besuch', name: 'Pyramide du Louvre', detail: 'Cour Napoléon, Paris', position: { lat: 48.8606111, lng: 2.337644 }, tage: ['museen'] },
  { id: 'orsay', art: 'Besuch', name: 'Musée d’Orsay', detail: 'Esplanade Valéry Giscard d’Estaing, Paris', position: { lat: 48.860128, lng: 2.32675 }, tage: ['museen'] },
]

export function reiseKarteninhalt(reise: Trip) {
  if (reise.id === 'paris-beispiel') return { orte: PARIS_ORTE, tage: [
    { id: 'ankunft', name: 'Tag 1 · Ankunft' }, { id: 'museen', name: 'Tag 2 · Museen' },
  ] }
  const orte: Reiseort[] = tripMapStops(reise).map(s => ({
    id: 'etappe-' + s.stageId, etappeId: s.stageId, name: s.name, art: 'Etappe', position: s.position, tage: s.dayIds,
  }))
  const seen = new Set<string>()
  for (const item of [...reise.days.flatMap(d => d.items), ...reise.ohneTag]) {
    if (seen.has(item.id) || (item.kind !== 'stay' && item.kind !== 'activity')) continue
    seen.add(item.id)
    const tage = reise.days.filter(d => d.id === item.dayId || (item.kind === 'stay' && item.stageId === d.stageId
      && d.dayDate && item.startsOn && item.endsOn && d.dayDate >= item.startsOn && d.dayDate <= item.endsOn))
    orte.push({ id: 'ort-' + item.id, etappeId: item.stageId ?? tage[0]?.stageId ?? undefined, name: item.title, art: item.kind === 'stay' ? 'Hotel' : 'Besuch',
      position: null, tage: tage.map(d => d.id) })
  }
  return { orte, tage: reise.days.map(d => ({ id: d.id, name: 'Tag ' + d.dayIndex + (d.title ? ' · ' + d.title : '') })) }
}

/** Prefer the adjacent planned visit. An airport transfer uses a hotel from the same trip context. */
export function wegauswahl(orte: Reiseort[], fokus?: string) {
  const pins = orte.filter((o): o is Reiseort & { position: Position } => !!o.position)
  const ort = pins.find(o => o.id === fokus) ?? pins[0]
  if (!ort) return { pins, start: undefined, ziel: undefined }
  const moeglich = pins.filter(o => o.id !== ort.id && (!ort.etappeId || !o.etappeId || ort.etappeId === o.etappeId))
  const selberTag = moeglich.filter(o => ort.tage.some(t => o.tage.includes(t)))
  const kontext = selberTag.length ? selberTag : moeglich
  const index = pins.indexOf(ort)
  const vorher = pins.slice(0, index).reverse().find(o => kontext.includes(o))
  const nachher = pins.slice(index + 1).find(o => kontext.includes(o))
  if (ort.art === 'Flughafen') return { pins, start: ort, ziel: kontext.find(o => o.art === 'Hotel') ?? nachher ?? vorher }
  if (ort.art === 'Besuch' && vorher) return { pins, start: vorher, ziel: ort }
  if (nachher) return { pins, start: ort, ziel: nachher }
  return { pins, start: vorher ?? ort, ziel: vorher ? ort : undefined }
}
