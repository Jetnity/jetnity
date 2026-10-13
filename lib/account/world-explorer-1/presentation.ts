import type { BesuchAnzeige } from '@/lib/account/besuche'
import type { WeltBesuchtAnsicht } from '@/lib/account/welt-ansicht'
import type { WeltLaenderAbleitung, WeltLandFlaeche, WeltLandZustand } from '@/lib/account/welt-laender'
import { WELT_ZUSTAND_TEXT } from '@/lib/account/welt-laender'
import { istGueltigeKarteKoordinate, weltKarteProjektion, type WorldMapAbleitung, type WorldMapOrt, type WorldMapReise } from '@/lib/account/world-map'
import { weltPunktLage } from '@/lib/account/world-map-ansicht'

export type ExplorerFilter = 'alle' | 'besucht' | 'geplant' | 'beides'
export type ExplorerRecord = {
  id: string
  art: 'land' | 'besuch' | 'ort'
  label: string
  code: string | null
  landLabel: string | null
  zustand: WeltLandZustand
  punkt: { links: number; oben: number } | null
  besuch?: BesuchAnzeige
  ort?: WorldMapOrt
  flaeche?: WeltLandFlaeche
}

export function suchText(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/ß/g, 'ss').trim()
}

/** Account-owned records only. Labels match text; stored codes/IDs establish identity. */
export function explorerRecords(welt: WorldMapAbleitung, besucht: WeltBesuchtAnsicht, laender: WeltLaenderAbleitung): ExplorerRecord[] {
  const bekannteBesuche = new Set(besucht.lage === 'fehler' ? [] : besucht.laenderCodes)
  const bekanntePlaene = new Set(welt.lage === 'fehler' ? [] : welt.laenderCodes)
  const laenderRecords: ExplorerRecord[] = laender.flaechen.flatMap((flaeche) => {
    const war = bekannteBesuche.has(flaeche.code)
    const plant = bekanntePlaene.has(flaeche.code)
    if (!war && !plant) return []
    const zustand = war && plant ? 'beides' : war ? 'besucht' : 'geplant'
    return [{ id: `land:${flaeche.code}`, art: 'land', label: flaeche.label, code: flaeche.code,
      landLabel: flaeche.label, zustand, punkt: null, flaeche: { ...flaeche, zustand } }]
  })
  const labels = new Map(laenderRecords.map((land) => [land.code, land.label]))
  const events: ExplorerRecord[] = besucht.lage === 'fehler' ? [] : besucht.eintraege.map((besuch) => {
    const punkt = istGueltigeKarteKoordinate(besuch.latitude, besuch.longitude)
      ? weltKarteProjektion(besuch.latitude!, besuch.longitude!) : null
    return { id: `besuch:${besuch.id}`, art: 'besuch', label: besuch.titel, code: besuch.countryCode,
      landLabel: labels.get(besuch.countryCode) ?? besuch.landLabel, zustand: 'besucht',
      punkt: punkt ? weltPunktLage(punkt.x, punkt.y) : null, besuch }
  })
  const places: ExplorerRecord[] = welt.lage === 'fehler' ? [] : welt.orte.map((ort) => ({
    id: `ort:${ort.schluessel}`, art: 'ort', label: ort.name, code: ort.countryCode,
    landLabel: labels.get(ort.countryCode) ?? ort.countryLabel, zustand: 'geplant',
    punkt: ort.geplottet && ort.x !== null && ort.y !== null ? weltPunktLage(ort.x, ort.y) : null, ort,
  }))
  return [...laenderRecords, ...events, ...places]
}

export function filterRecords(records: readonly ExplorerRecord[], query: string, filter: ExplorerFilter): ExplorerRecord[] {
  const suche = suchText(query.slice(0, 120))
  const countries = new Map(records.filter((r) => r.art === 'land').map((r) => [r.code, r]))
  const sourceMatches = (r: ExplorerRecord) => filter === 'alle' || filter === 'beides' || r.art === 'land' || r.zustand === filter
  const filterMatches = (r: ExplorerRecord) => {
    if (!sourceMatches(r)) return false
    const zustand = countries.get(r.code)?.zustand ?? r.zustand
    return filter === 'alle' || zustand === filter || (filter !== 'beides' && zustand === 'beides')
  }
  const eligible = records.filter(filterMatches)
  const countryMatches = new Set(eligible.filter((r) => r.art === 'land' &&
    (!suche || suchText(`${r.label} ${r.code}`).includes(suche))).map((r) => r.code))
  const matches = eligible.filter((r) => countryMatches.has(r.code) || !suche || suchText(r.label).includes(suche))
  const matchedCodes = new Set(matches.map((r) => r.code).filter(Boolean))
  const matchedIds = new Set(matches.map((r) => r.id))
  return eligible.filter((r) => matchedIds.has(r.id) || (r.art === 'land' && matchedCodes.has(r.code)))
}

export function recordStatus(record: ExplorerRecord): string {
  return record.art === 'besuch' ? 'Bestätigter Besuch' : WELT_ZUSTAND_TEXT[record.zustand]
}

export function positionText(record: ExplorerRecord): string | null {
  if (record.art === 'land') return record.flaeche?.pfad || record.flaeche?.punkt ? null : 'Keine Kartenposition verfügbar.'
  return record.punkt ? null : 'Keine nutzbare Kartenposition gespeichert.'
}

/** Only planned place provenance supplies trip links. A visit never supplies a trip. */
export function countryTrips(orte: readonly WorldMapOrt[], code: string): WorldMapReise[] {
  const byId = new Map<string, WorldMapReise>()
  for (const ort of orte) {
    if (ort.countryCode !== code) continue
    for (const reise of ort.reisen) if (!byId.has(reise.tripId)) byId.set(reise.tripId, reise)
  }
  return [...byId.values()].sort((a, b) => a.tripId < b.tripId ? -1 : a.tripId > b.tripId ? 1 : 0)
}
