import { tageUtc } from '@/lib/activities/zeit'
import { routeFactsFuerPunkt } from '@/lib/route/ableitung'
import { lokalePlanzeit } from '@/lib/trips/trip-timeline-core-1'
import type { Zeitpruefung } from '@/lib/trips/trip-timeline-temporal-review-1'
import type { TripDay, TripItem } from '@/types/trips'

const kurz = new Intl.DateTimeFormat('de-CH', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const wochenTag = new Intl.DateTimeFormat('de-CH', { weekday: 'long', timeZone: 'UTC' })
const monat = new Intl.DateTimeFormat('de-CH', { month: 'short', timeZone: 'UTC' })

function datum(wert: string | null): string | null {
  return wert && tageUtc(wert) !== null ? wert : null
}

function zeitMitDatum(zeit: string, termin: string | null, tagesdatum: string | null): string {
  return termin && termin !== tagesdatum ? kurz.format(new Date(termin + 'T00:00:00Z')) + ' · ' + zeit : zeit
}

function zeitangabe(punkt: TripItem, tagesdatum: string | null) {
  let startTag = punkt.startsOn
  let start = punkt.startsAt
  let endTag = punkt.endsOn
  let ende = punkt.endsAt
  if (punkt.kind === 'flight' && punkt.routeItinerary) {
    const route = routeFactsFuerPunkt(punkt)
    // A flight can contain several separate legs. The preview shows its first departure.
    if (route.quelle !== 'flight_itinerary') return { tag: null, uhrzeit: null, label: 'Zeit prüfen' }
    const abflug = route.legs[0]?.segments[0]
    startTag = abflug?.departureDate ?? null
    start = abflug?.departureTime ?? null
    endTag = null
    ende = null
  }
  const von = lokalePlanzeit(start)
  const bis = lokalePlanzeit(ende)
  const reisetag = datum(startTag)
  const enddatum = datum(endTag)
  const pruefen = Boolean((start && !von) || (ende && !bis) || (startTag && !reisetag) || (endTag && !enddatum))
  if (pruefen) return { tag: null, uhrzeit: null, label: 'Zeit prüfen' }
  if (von) {
    const anfang = zeitMitDatum(von, reisetag, tagesdatum)
    let label = anfang
    if (bis) {
      const endetAnAnderemTag = Boolean(enddatum && enddatum !== (reisetag ?? tagesdatum))
      const endeText = endetAnAnderemTag ? zeitMitDatum(bis, enddatum, null) : bis
      label += !enddatum && bis < von ? ' · Ende ' + bis + ' (Datum offen)' : ' – ' + endeText
    }
    return { tag: reisetag ?? tagesdatum, uhrzeit: von, label }
  }
  if (bis) return { tag: enddatum ?? tagesdatum, uhrzeit: bis, label: 'Bis ' + zeitMitDatum(bis, enddatum, tagesdatum) }
  if (reisetag && tagesdatum !== reisetag) return { tag: reisetag, uhrzeit: null, label: kurz.format(new Date(reisetag + 'T00:00:00Z')) }
  return { tag: null, uhrzeit: null, label: 'Ohne Uhrzeit' }
}

export function etappenAgenda(days: readonly TripDay[]) {
  return days.map((tag) => {
    const iso = datum(tag.dayDate)
    const time = iso ? new Date(iso + 'T00:00:00Z') : null
    const eintraege = tag.items.map((punkt) => ({ punkt, ...zeitangabe(punkt, iso) }))
      .sort((a, b) => Number(!a.uhrzeit) - Number(!b.uhrzeit)
        || (a.tag ?? '').localeCompare(b.tag ?? '')
        || (a.uhrzeit ?? '').localeCompare(b.uhrzeit ?? '')
        || a.punkt.position - b.punkt.position
        || a.punkt.id.localeCompare(b.punkt.id))
    const erster = eintraege[0]
    const zweiter = erster?.uhrzeit ? eintraege.find((eintrag) => !eintrag.uhrzeit) ?? eintraege[1] : eintraege[1]
    return {
      id: tag.id,
      index: tag.dayIndex,
      iso,
      datumUngueltig: Boolean(tag.dayDate && !iso),
      title: tag.title?.trim(),
      kalendertag: time?.getUTCDate(),
      monat: time ? monat.format(time) : null,
      wochentag: time ? wochenTag.format(time) : null,
      datumText: time ? kurz.format(time) : null,
      anzahl: eintraege.length,
      vorschau: [erster, zweiter].filter((eintrag) => eintrag !== undefined),
    }
  }).sort((a, b) => Number(!a.iso) - Number(!b.iso) || (a.iso ?? '').localeCompare(b.iso ?? '') || a.index - b.index)
}

export function offenerEtappentag(tage: ReturnType<typeof etappenAgenda>, heute: string | null) {
  return tage.find((tag) => tag.anzahl === 0 && !tag.datumUngueltig && (tag.iso ? heute !== null && tag.iso >= heute : true))
}

/** Show only local-clock collisions with the same explicit context, or overlaps established on the instant axis. */
export function tagesKonflikte(days: readonly TripDay[], pruefung: Zeitpruefung) {
  const tagZuPunkt = new Map(days.flatMap((tag) => tag.items.map((punkt) => [punkt.id, tag.id] as const)))
  const hinweise = new Map<string, { ids: [string, string]; sicher: boolean; minuten: number | null }>()
  for (const paar of pruefung.pairs) {
    const [a, b] = paar.itemIds
    if (a === b || paar.reasons.includes('date_mismatch')) continue
    const sicher = paar.state === 'proven_conflict'
    if (!sicher && !(paar.state === 'possible_conflict' && paar.comparisonBasis === 'civil_only')) continue
    for (const id of [tagZuPunkt.get(a), tagZuPunkt.get(b)]) {
      if (id && (!hinweise.has(id) || (sicher && !hinweise.get(id)?.sicher))) {
        hinweise.set(id, { ids: paar.itemIds, sicher, minuten: sicher ? paar.overlapMinutes : null })
      }
    }
  }
  return hinweise
}
