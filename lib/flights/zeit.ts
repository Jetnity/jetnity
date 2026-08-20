// lib/flights/zeit.ts
//
// Ortszeiten und Dauern, ohne Zeitzonen-Umrechnung.
//
// Ein Flug um 07:40 in Zürich ist 07:40. `Date` mit lokaler Zone des Servers
// oder `Z` anzuhängen würde genau die Verfälschung erzeugen, die Phase 3.1
// ausschliesst. Minuten zwischen zwei Ortsangaben sind nur vergleichbar, wenn
// sie am selben Kalenderort gemeint sind – für Umstiege am selben Flughafen
// gilt das.
//
// Frei von Next und Providern.

const MINUTEN_PRO_TAG = 24 * 60

export function dauerAusIso(wert: string): number | null {
  const treffer = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(wert)
  if (!treffer) return null
  const tage = Number(treffer[1] ?? 0)
  const stunden = Number(treffer[2] ?? 0)
  const minuten = Number(treffer[3] ?? 0)
  const sekunden = Number(treffer[4] ?? 0)
  const gesamt = tage * MINUTEN_PRO_TAG + stunden * 60 + minuten + Math.ceil(sekunden / 60)
  return gesamt > 0 ? gesamt : null
}

/** `2026-11-01T07:40:00` → Datum und Uhrzeit, unverändert lokal. */
export function ortszeitAus(wert: string): { date: string; time: string } | null {
  const treffer = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(wert)
  if (!treffer) return null
  return { date: treffer[1]!, time: treffer[2]! }
}

export function minutenSeitMitternacht(uhrzeit: string): number | null {
  const treffer = /^(\d{2}):(\d{2})$/.exec(uhrzeit)
  if (!treffer) return null
  return Number(treffer[1]) * 60 + Number(treffer[2])
}

export function tageZwischen(von: string, bis: string): number | null {
  const start = /^(\d{4})-(\d{2})-(\d{2})$/.exec(von)
  const ende = /^(\d{4})-(\d{2})-(\d{2})$/.exec(bis)
  if (!start || !ende) return null
  const a = Date.UTC(Number(start[1]), Number(start[2]) - 1, Number(start[3]))
  const b = Date.UTC(Number(ende[1]), Number(ende[2]) - 1, Number(ende[3]))
  return Math.round((b - a) / 86_400_000)
}

/**
 * Minuten zwischen zwei Ortszeiten am selben Umsteigeflughafen.
 *
 * Nur Kalenderdifferenz plus Uhrzeit, keine Zone. Ein negativer Wert bedeutet
 * unbrauchbare Providerdaten, nicht eine Zeitzone.
 */
export function umstiegMinuten(
  ankunft: { date: string; time: string },
  abflug: { date: string; time: string },
): number | null {
  const tage = tageZwischen(ankunft.date, abflug.date)
  const von = minutenSeitMitternacht(ankunft.time)
  const nach = minutenSeitMitternacht(abflug.time)
  if (tage === null || von === null || nach === null) return null
  return tage * MINUTEN_PRO_TAG + (nach - von)
}

export function dauerLesbar(minuten: number): string {
  const sicher = Math.max(0, Math.round(minuten))
  const stunden = Math.floor(sicher / 60)
  const rest = sicher % 60
  if (stunden === 0) return `${rest} min`
  if (rest === 0) return `${stunden} h`
  return `${stunden} h ${rest.toString().padStart(2, '0')} min`
}

/** Dezimalbetrag aus Providertext. Mehr als zwei Nachkommastellen sind unbrauchbar. */
export function betragAusText(wert: string): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(wert.trim())) return null
  const gelesen = Number(wert)
  if (!Number.isFinite(gelesen) || gelesen < 0) return null
  return Math.round(gelesen * 100) / 100
}

export function betragDifferenzLesbar(betrag: number, waehrung: string): string {
  const gerundet = Math.round(Math.abs(betrag) * 100) / 100
  const text = new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: waehrung,
    minimumFractionDigits: gerundet % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(gerundet)
  return text
}
