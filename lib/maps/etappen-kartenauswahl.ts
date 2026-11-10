import { luftlinieKm } from '@/lib/hotels/geo'
import type { MapStop } from '@/lib/maps/trip-map'

export type KartenPosition = { lat: number; lng: number }
export type KartenVerbindung = { vonId: string; nachId: string }

export function etappenVerbindung(stops: readonly MapStop[], auswahl?: KartenVerbindung | null) {
  if (!auswahl) return null
  const starts = stops.filter((s) => s.stageId === auswahl.vonId)
  const ziele = stops.filter((s) => s.stageId === auswahl.nachId)
  const von = starts.length === 1 ? starts[0] : null
  const nach = ziele.length === 1 && auswahl.nachId !== auswahl.vonId ? ziele[0] : null
  const a = von?.position
  const b = nach?.position
  const km = a && b ? luftlinieKm({ lat: a.lat, lon: a.lng }, { lat: b.lat, lon: b.lng }) : null
  return { von, nach, km }
}

export function laengengradBei(lng: number, bezug: number) {
  return lng + 360 * Math.round((bezug - lng) / 360)
}

/** Der kleinste zusammenhängende Längengradbereich liegt gegenüber der grössten Lücke. */
export function ausschnittMitte(punkte: readonly KartenPosition[]) {
  if (!punkte.length) return 0
  const laengen = punkte.map((p) => (p.lng + 360) % 360).sort((a, b) => a - b)
  let maxLuecke = -1
  let start = 0
  for (let i = 0; i < laengen.length; i++) {
    const danach = i === laengen.length - 1 ? laengen[0] + 360 : laengen[i + 1]
    const luecke = danach - laengen[i]
    if (luecke > maxLuecke) {
      start = danach
      maxLuecke = luecke
    }
  }
  const mitte = (start + (360 - maxLuecke) / 2) % 360
  return mitte > 180 ? mitte - 360 : mitte
}

const ganzeKm = new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 })
export function luftlinieText(km: number) {
  if (km > 0 && km < 1) return 'Unter 1 km Luftlinie'
  return `${ganzeKm.format(km)} km Luftlinie`
}
