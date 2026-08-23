// lib/seasonal/kalender.ts
//
// Kalender-, Instant- und Offset-Hüllen-Primitiven.
// Date-only bleibt zonenlos. Foundation-D-HH:mm bleibt ohne erfundene Zone.
// Kein stilles Anhängen von Z.

export function kalenderteileGueltig(jahr: number, monat: number, tag: number): boolean {
  if (!Number.isInteger(jahr) || !Number.isInteger(monat) || !Number.isInteger(tag)) return false
  const geprueft = new Date(Date.UTC(jahr, monat - 1, tag))
  return (
    geprueft.getUTCFullYear() === jahr &&
    geprueft.getUTCMonth() === monat - 1 &&
    geprueft.getUTCDate() === tag
  )
}

export function istSchaltjahr(jahr: number): boolean {
  return (jahr % 4 === 0 && jahr % 100 !== 0) || jahr % 400 === 0
}

export function istKalenderdatum(wert: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(wert)) return false
  const [jahr, monat, tag] = wert.split('-').map(Number)
  return kalenderteileGueltig(jahr ?? 0, monat ?? 0, tag ?? 0)
}

function istIsoZeit(wert: string): boolean {
  const treffer = wert.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?Z$/)
  if (!treffer) return false
  const jahr = Number(treffer[1])
  const monat = Number(treffer[2])
  const tag = Number(treffer[3])
  const stunde = Number(treffer[4])
  const minute = Number(treffer[5])
  const sekunde = Number(treffer[6])
  if (!kalenderteileGueltig(jahr, monat, tag)) return false
  return stunde <= 23 && minute <= 59 && sekunde <= 59
}

export function isoZeitLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const zeit = wert.trim()
  return istIsoZeit(zeit) ? zeit : null
}

export function isoDatumLesen(wert: unknown): string | null {
  if (typeof wert !== 'string') return null
  const text = wert.trim()
  if (istKalenderdatum(text)) return text
  return isoZeitLesen(text)
}

export function zeitMs(wert: string): number {
  return Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(wert) ? `${wert}T00:00:00.000Z` : wert)
}

export function zeitgrenzeMs(wert: string, kante: 'start' | 'end'): number {
  if (/^\d{4}-\d{2}-\d{2}$/.test(wert)) {
    return Date.parse(kante === 'start' ? `${wert}T00:00:00.000Z` : `${wert}T23:59:59.999Z`)
  }
  if (zeitForm(wert) === 'clock') return Number.NaN
  return Date.parse(wert)
}

export function zeitForm(wert: string): 'date' | 'clock' | 'instant' | 'invalid' {
  if (/^\d{4}-\d{2}-\d{2}$/.test(wert)) return 'date'
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?Z$/.test(wert)) return 'instant'
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(wert)) return 'clock'
  return 'invalid'
}

export function kalendertagAus(wert: string): string | null {
  const treffer = /^(\d{4}-\d{2}-\d{2})/.exec(wert)
  return treffer?.[1] ?? null
}

export function ziviluhrAus(wert: string): string | null {
  const treffer = /T(\d{2}:\d{2})/.exec(wert)
  return treffer?.[1] ?? null
}

export function datumTeile(wert: string): { jahr: number; monat: number; tag: number } | null {
  const tag = kalendertagAus(wert)
  if (!tag || !istKalenderdatum(tag)) return null
  const [jahr, monat, tagZahl] = tag.split('-').map(Number)
  if (jahr == null || monat == null || tagZahl == null) return null
  return { jahr, monat, tag: tagZahl }
}

export function datumFormatieren(jahr: number, monat: number, tag: number): string | null {
  if (!kalenderteileGueltig(jahr, monat, tag)) return null
  return `${String(jahr).padStart(4, '0')}-${String(monat).padStart(2, '0')}-${String(tag).padStart(2, '0')}`
}

const MAX_OST_OFFSET_MS = 14 * 60 * 60 * 1000
const MAX_WEST_OFFSET_MS = 12 * 60 * 60 * 1000

function seiteHat(wert: string | null, form: 'clock' | 'instant' | 'date'): boolean {
  return Boolean(wert && zeitForm(wert) === form)
}

function zivilRechenwert(tag: string, uhr: string): number {
  return Date.parse(`${tag}T${uhr}:00.000Z`)
}

function clockUnsicherheit(
  start: string | null,
  ende: string | null,
): { minMs: number; maxMs: number } | null {
  const von = start ?? ende
  const bis = ende ?? start
  if (!von || !bis) return null
  const startTag = kalendertagAus(von)
  const endeTag = kalendertagAus(bis)
  if (!startTag || !endeTag) return null
  const startUhr = ziviluhrAus(von) ?? '00:00'
  const endeUhr = ziviluhrAus(bis) ?? '23:59'
  const minMs = zivilRechenwert(startTag, startUhr) - MAX_OST_OFFSET_MS
  const maxMs = zivilRechenwert(endeTag, endeUhr) + MAX_WEST_OFFSET_MS
  if (!Number.isFinite(minMs) || !Number.isFinite(maxMs)) return null
  return { minMs, maxMs }
}

function kalendertageVergleichen(
  reiseStart: string | null,
  reiseEnde: string | null,
  eventStart: string | null,
  eventEnde: string | null,
): 'overlaps' | 'before' | 'after' | 'insufficient' {
  const tripStart = kalendertagAus(reiseStart ?? reiseEnde ?? '')
  const tripEnd = kalendertagAus(reiseEnde ?? reiseStart ?? '')
  if (!tripStart || !tripEnd) return 'insufficient'
  const eventStartTag = eventStart ? kalendertagAus(eventStart) : null
  const eventEndeTag = eventEnde ? kalendertagAus(eventEnde) : eventStartTag
  if (eventEndeTag && eventEndeTag < tripStart) return 'before'
  if (eventStartTag && eventStartTag > tripEnd) return 'after'
  return 'overlaps'
}

function dateUnsicherheit(
  start: string | null,
  ende: string | null,
): { minMs: number; maxMs: number } | null {
  const von = start ?? ende
  const bis = ende ?? start
  if (!von || !bis) return null
  const startTag = kalendertagAus(von)
  const endeTag = kalendertagAus(bis)
  if (!startTag || !endeTag) return null
  const minMs = Date.parse(`${startTag}T00:00:00.000Z`) - MAX_OST_OFFSET_MS
  const maxMs = Date.parse(`${endeTag}T23:59:59.999Z`) + MAX_WEST_OFFSET_MS
  if (!Number.isFinite(minMs) || !Number.isFinite(maxMs)) return null
  return { minMs, maxMs }
}

function instantGegenHuelle(
  fenster: { minMs: number; maxMs: number },
  eventStart: string | null,
  eventEnde: string | null,
): 'before' | 'after' | 'insufficient' {
  const eventStartMs = eventStart && zeitForm(eventStart) === 'instant' ? Date.parse(eventStart) : null
  const eventEndMs = eventEnde && zeitForm(eventEnde) === 'instant' ? Date.parse(eventEnde) : eventStartMs
  if (eventEndMs != null && Number.isFinite(eventEndMs) && eventEndMs < fenster.minMs) return 'before'
  if (eventStartMs != null && Number.isFinite(eventStartMs) && eventStartMs > fenster.maxMs) return 'after'
  return 'insufficient'
}

export function zeitraeumeUeberschneiden(
  reiseStart: string | null,
  reiseEnde: string | null,
  eventStart: string | null,
  eventEnde: string | null,
): 'overlaps' | 'before' | 'after' | 'insufficient' {
  if (!reiseStart && !reiseEnde) return 'insufficient'
  const tripHatUhr = seiteHat(reiseStart, 'clock') || seiteHat(reiseEnde, 'clock')
  const eventHatInstant = seiteHat(eventStart, 'instant') || seiteHat(eventEnde, 'instant')
  const eventNurDatum =
    !eventHatInstant &&
    (seiteHat(eventStart, 'date') || seiteHat(eventEnde, 'date') || (!eventStart && !eventEnde))

  if (tripHatUhr && eventHatInstant) {
    const fenster = clockUnsicherheit(reiseStart, reiseEnde)
    if (!fenster) return 'insufficient'
    return instantGegenHuelle(fenster, eventStart, eventEnde)
  }
  if (!tripHatUhr && eventHatInstant) {
    const fenster = dateUnsicherheit(reiseStart, reiseEnde)
    if (!fenster) return 'insufficient'
    return instantGegenHuelle(fenster, eventStart, eventEnde)
  }
  if (eventNurDatum) {
    return kalendertageVergleichen(reiseStart, reiseEnde, eventStart, eventEnde)
  }

  const tripStart = reiseStart ? zeitgrenzeMs(reiseStart, 'start') : reiseEnde ? zeitgrenzeMs(reiseEnde, 'start') : null
  const tripEnd = reiseEnde ? zeitgrenzeMs(reiseEnde, 'end') : reiseStart ? zeitgrenzeMs(reiseStart, 'end') : null
  if (tripStart == null || tripEnd == null || !Number.isFinite(tripStart) || !Number.isFinite(tripEnd)) {
    return 'insufficient'
  }
  const eventStartMs = eventStart ? zeitgrenzeMs(eventStart, 'start') : null
  const eventEndMs = eventEnde ? zeitgrenzeMs(eventEnde, 'end') : null
  if (eventEndMs != null && Number.isFinite(eventEndMs) && eventEndMs < tripStart) return 'before'
  if (eventStartMs != null && Number.isFinite(eventStartMs) && eventStartMs > tripEnd) return 'after'
  return 'overlaps'
}
