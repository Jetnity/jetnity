import { istKommerziell } from '@/lib/reiseaenderung/geschuetzt'
import { aenderungsAuswirkung, planSnapshot } from '@/lib/trips/trip-plan-integrated/day'
import { reiseDiff } from '@/lib/reiseaenderung/diff'
import { tripZeitpruefung } from '@/lib/trips/trip-timeline-temporal-review-1'
import { unterkunftAbdeckung, type UnterkunftAbdeckung, type UnterkunftLuecke } from '@/lib/trips/naechte-abdeckung'
import { GRENZEN } from '@/lib/trips/schema'
import type { Trip, TripItem, TripDay } from '@/types/trips'

export type Auswirkungsgruppe = { titel: string; zeilen: { id: string; text: string }[] }
const datum = (s: string | null) => s ?? 'offen'
const termin = (p: TripItem) => `Beginn ${datum(p.startsOn)} ${p.startsAt ?? '(Zeit offen)'}; Ende ${datum(p.endsOn)} ${p.endsAt ?? '(Zeit offen)'}`
function tagText(t: Trip, day: TripDay | undefined): string {
  if (!day) return 'Ungeplant'
  const stage = t.stages.find(s => s.id === day.stageId)
  return `Tag ${day.dayIndex}${day.title ? ` „${day.title}“` : ''} · ${datum(day.dayDate)}${stage ? ` · Etappe ${stage.position}: ${stage.name}` : ' · ohne Etappe'}`
}
export function auswirkungen(
  vorher: Trip,
  nachher: Trip,
  unterkunftLesen: (reise: Trip) => UnterkunftAbdeckung = unterkunftAbdeckung,
): Auswirkungsgruppe[] {
  const basic = reiseDiff(vorher, nachher).filter(d => d.art === 'stammdaten').map((d, i) => ({ id: `basic-${i}`, text: d.text }))
  if (vorher.budgetAmount !== nachher.budgetAmount) {
    const row = basic.find(d => d.text.startsWith('Budgetziel:'))
    if (row) row.text = `Budgetziel (${vorher.currency}): ${vorher.budgetAmount ?? 'offen'} → ${nachher.budgetAmount ?? 'offen'}`
  }
  // A non-lossy summary of all trip-wide material fields.
  basic.push({ id: 'range', text: `Reise: ${datum(vorher.startDate)} bis ${datum(vorher.endDate)} (${vorher.days.length} Tage) → ${datum(nachher.startDate)} bis ${datum(nachher.endDate)} (${nachher.days.length} Tage)` })
  const stages: Auswirkungsgruppe['zeilen'] = [], days: Auswirkungsgruppe['zeilen'] = []
  for (const s of vorher.stages) {
    const next = nachher.stages.find(n => n.id === s.id)
    const oldDays = vorher.days.filter(d => d.stageId === s.id).length
    const newDays = nachher.days.filter(d => d.stageId === s.id).length
    if (!next || oldDays !== newDays || s.arrivalDate !== next.arrivalDate || s.departureDate !== next.departureDate || s.position !== next.position)
      stages.push({ id: s.id, text: `Etappe ${s.position}: ${s.name} · ${oldDays} Tage (${datum(s.arrivalDate)} – ${datum(s.departureDate)}) → ${next ? `Etappe ${next.position}, ${newDays} Tage (${datum(next.arrivalDate)} – ${datum(next.departureDate)})` : 'wird entfernt'}` })
  }
  for (const old of vorher.days) {
    const next = nachher.days.find(n => n.id === old.id)
    if (!next || old.dayIndex !== next.dayIndex || old.dayDate !== next.dayDate || old.stageId !== next.stageId)
      days.push({ id: old.id, text: `${tagText(vorher, old)} → ${next ? tagText(nachher, next) : 'wird entfernt'}` })
  }
  for (const day of nachher.days) if (!vorher.days.some(d => d.id === day.id)) days.push({ id: day.id, text: `${tagText(nachher, day)} wird hinzugefügt (ohne Planpunkte).` })
  const oldItems = [...vorher.days.flatMap(d => d.items), ...vorher.ohneTag]
  const newItems = new Map([...nachher.days.flatMap(d => d.items), ...nachher.ohneTag].map(p => [p.id, p]))
  const removed: Auswirkungsgruppe['zeilen'] = [], preserved: Auswirkungsgruppe['zeilen'] = [], moved: Auswirkungsgruppe['zeilen'] = []
  for (const old of oldItems) {
    const next = newItems.get(old.id), day = vorher.days.find(d => d.id === old.dayId)
    const nextDay = nachher.days.find(d => d.id === next?.dayId)
    const context = `${old.title} · ${tagText(vorher, day)}`
    if (!next) { removed.push({ id: old.id, text: `${context} · ${termin(old)} wird entfernt.` }); continue }
    const placement = old.dayId !== next.dayId || old.stageId !== next.stageId || old.position !== next.position || day?.dayIndex !== nextDay?.dayIndex || day?.dayDate !== nextDay?.dayDate
    if (istKommerziell(old)) {
      if (placement || vorher.startDate !== nachher.startDate || vorher.endDate !== nachher.endDate)
        preserved.push({ id: old.id, text: `${context} → ${tagText(nachher, nextDay)}. Geschützt: ${termin(old)} bleibt unverändert. Buchungs- und Preisangaben bleiben erhalten.` })
    } else if (placement || termin(old) !== termin(next))
      moved.push({ id: old.id, text: `${context}, Position ${old.position}, ${termin(old)} → ${tagText(nachher, nextDay)}, Position ${next.position}, ${termin(next)}` })
  }
  const zeit = tripZeitpruefung(nachher)
  const labels = new Map([...newItems].map(([id, p]) => [id, `${p.title} · ${tagText(nachher, nachher.days.find(d => d.id === p.dayId))}`]))
  const temporal = zeit.pairs.filter(p => p.state === 'proven_conflict' || p.state === 'possible_conflict')
    .map((p, i) => ({ id: `time-${i}`, text: `${labels.get(p.itemIds[0])} / ${labels.get(p.itemIds[1])}: ${p.state === 'proven_conflict' ? 'nachgewiesene' : 'mögliche'} Überschneidung im vorgeschlagenen Plan.` }))
  if (zeit.coverage.state !== 'complete' || zeit.pairs.some(p => p.state === 'not_evaluable')) temporal.push({ id: 'coverage', text: 'Die vorhandenen Zeitangaben erlauben keine vollständige Konfliktprüfung. Fehlende Zeit-, Orts- oder Zeitzonenangaben bleiben offen.' })
  const impact = aenderungsAuswirkung(planSnapshot(vorher), planSnapshot(nachher))
  const preparation = (impact?.targets ?? []).map(target => {
    const task = nachher.readinessItems?.find(t => t.clientRef === target.id)
    const points = target.reasons.map(id => oldItems.find(p => p.id === id)?.title ?? 'Planpunkt').join(', ')
    return { id: target.id, text: `${task?.title ?? 'Vorbereitung'}: Bezug zu ${points} wäre betroffen. Der gespeicherte Bearbeitungsstand bleibt unverändert; bitte in Vorbereitung erneut prüfen.` }
  })
  const gruppen: Auswirkungsgruppe[] = [ { titel: 'Grunddaten und Zeitraum', zeilen: basic }, { titel: 'Etappen', zeilen: stages }, { titel: 'Tage', zeilen: days },
    { titel: 'Normale Planpunkte, die entfernt würden', zeilen: removed }, { titel: 'Geschützte Planpunkte mit betroffenem Reisezeitraum oder Tageskontext', zeilen: preserved },
    { titel: 'Weitere betroffene Planpunkte', zeilen: moved }, { titel: 'Zeitprüfung des vorgeschlagenen Plans', zeilen: temporal }, { titel: 'Betroffene Vorbereitungen', zeilen: preparation } ]
  const unterkunft = unterkunftsgruppe(vorher, nachher, unterkunftLesen)
  if (unterkunft) gruppen.push(unterkunft)
  return gruppen
}

const NACHT_MS = 86_400_000
/** Stage and stay spans are not limited by the trip-duration rule, so each interval is capped on its own. */
const SPANNEN_GRENZE = GRENZEN.reisedauerInTagen
/** Estimated night walks across both snapshots. The 20-row pager does not bound this. */
const ARBEIT_GRENZE = 40_000
const UNTERKUNFT_TITEL = 'Unterkunftsplanung nach der Änderung'
type UnterkunftLeser = (reise: Trip) => UnterkunftAbdeckung
type Arbeit = { art: 'ok'; naechte: number } | { art: 'abgelehnt' }
type Seite =
  | { art: 'plan'; wert: UnterkunftAbdeckung }
  | { art: 'unklar' }
  | { art: 'nicht_verfuegbar' }

function kalender(wert: string | null | undefined): wert is string {
  if (!wert || !/^\d{4}-\d{2}-\d{2}$/.test(wert)) return false
  const [jahr, monat, tag] = wert.split('-').map(Number)
  const geprueft = new Date(Date.UTC(jahr, monat - 1, tag))
  return geprueft.getUTCFullYear() === jahr && geprueft.getUTCMonth() === monat - 1 && geprueft.getUTCDate() === tag
}

/** Half-open night count without listing the nights. Invalid or empty intervals cost nothing. */
function spanne(start: string | null | undefined, end: string | null | undefined): number {
  if (!kalender(start) || !kalender(end) || start >= end) return 0
  const tage = Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / NACHT_MS)
  return Number.isFinite(tage) && tage > 0 ? tage : 0
}

function unterkuenfte(reise: Trip): TripItem[] {
  return [...reise.days.flatMap(tag => tag.items), ...reise.ohneTag].filter(punkt => punkt.kind === 'stay')
}

/** Mirrors which intervals the canonical reader will walk. It does not compute coverage. */
function unterkunftsarbeit(reise: Trip): Arbeit {
  const stufen = reise.stages.map(etappe => spanne(etappe.arrivalDate, etappe.departureDate))
  const staySpannen = unterkuenfte(reise).map(stay => spanne(stay.startsOn, stay.endsOn))
  const tripSpanne = spanne(reise.startDate, reise.endDate)
  if (tripSpanne > SPANNEN_GRENZE || stufen.some(tage => tage > SPANNEN_GRENZE) || staySpannen.some(tage => tage > SPANNEN_GRENZE)) {
    return { art: 'abgelehnt' }
  }
  const alleStufen = reise.stages.length > 0 && stufen.every(tage => tage > 0)
  let pflicht = 0
  let bekannt = false
  if (alleStufen) {
    pflicht = stufen.reduce((summe, tage) => summe + tage, 0)
    bekannt = true
  } else if (reise.stages.length === 0 || reise.stages.length === 1) {
    if (tripSpanne > 0) { pflicht = tripSpanne; bekannt = true }
  } else if (stufen.some(tage => tage > 0) && stufen.some(tage => tage === 0)) {
    pflicht = stufen.reduce((summe, tage) => summe + tage, 0)
    bekannt = false
  } else if (tripSpanne > 0) {
    pflicht = tripSpanne
    bekannt = true
  }
  const naechte = pflicht * (bekannt ? 3 : 2) + staySpannen.reduce((summe, tage) => summe + tage, 0)
  return Number.isFinite(naechte) ? { art: 'ok', naechte } : { art: 'abgelehnt' }
}

function zulassen(links: Arbeit, rechts: Arbeit): { links: boolean; rechts: boolean } {
  if (links.art !== 'ok' || rechts.art !== 'ok') {
    return {
      links: links.art === 'ok' && links.naechte <= ARBEIT_GRENZE,
      rechts: rechts.art === 'ok' && rechts.naechte <= ARBEIT_GRENZE,
    }
  }
  if (links.naechte + rechts.naechte > ARBEIT_GRENZE) return { links: false, rechts: false }
  return { links: links.naechte <= ARBEIT_GRENZE, rechts: rechts.naechte <= ARBEIT_GRENZE }
}

function unterkunftsfakten(reise: Trip): string {
  const stays = [
    ...reise.days.flatMap(tag => tag.items.filter(punkt => punkt.kind === 'stay').map(punkt => [punkt.id, `tag:${tag.id}`, punkt.stageId, punkt.startsOn, punkt.endsOn, punkt.bookingStatus])),
    ...reise.ohneTag.filter(punkt => punkt.kind === 'stay').map(punkt => [punkt.id, 'ohne-tag', punkt.stageId, punkt.startsOn, punkt.endsOn, punkt.bookingStatus]),
  ].sort()
  const stages = reise.stages.map(etappe => [etappe.id, etappe.arrivalDate, etappe.departureDate]).sort()
  return JSON.stringify([reise.startDate, reise.endDate, stages, stays])
}

function planKern(wert: UnterkunftAbdeckung): string {
  return JSON.stringify({
    bekannt: wert.bekannt,
    gesamt: wert.naechteGesamt,
    abgedeckt: wert.naechteAbgedeckt,
    gebucht: wert.naechteGebucht,
    ausgewaehlt: wert.naechteAusgewaehlt,
    luecken: wert.luecken.map(luecke => [luecke.stageId, luecke.start, luecke.end, luecke.naechte]).sort(),
    aufenthalte: wert.aufenthalte.map(aufenthalt => [aufenthalt.item.id, aufenthalt.start, aufenthalt.end, aufenthalt.naechte, aufenthalt.status, aufenthalt.ausserhalb]).sort(),
  })
}

function qualifiziert(wert: UnterkunftAbdeckung): boolean {
  return wert.bekannt
    && wert.naechteGesamt !== null
    && wert.naechteAbgedeckt !== null
    && wert.naechteGebucht !== null
    && wert.naechteAusgewaehlt !== null
    && wert.aufenthalte.every(aufenthalt => aufenthalt.status !== 'unknown')
    && wert.zusammenfassung !== 'Unterkunftsstand noch unklar'
}

/** No stages may use the trip-date fallback for a qualified plan. One stage without its own interval still falls back to the trip calendar. Several stages with a missing interval do not: the calendar length can be known while stage ownership stays unknown. */
function etappenDatenVollstaendig(reise: Trip): boolean {
  if (reise.stages.length === 0) return true
  return reise.stages.every(etappe => spanne(etappe.arrivalDate, etappe.departureDate) > 0)
}

function seiteLesen(reise: Trip, erlaubt: boolean, lesen: UnterkunftLeser): Seite {
  if (!erlaubt) return { art: 'nicht_verfuegbar' }
  try {
    const wert = lesen(reise)
    if (!wert || typeof wert.bekannt !== 'boolean' || !Array.isArray(wert.luecken) || !Array.isArray(wert.aufenthalte)) {
      return { art: 'nicht_verfuegbar' }
    }
    return qualifiziert(wert) && etappenDatenVollstaendig(reise) ? { art: 'plan', wert } : { art: 'unklar' }
  } catch {
    return { art: 'nicht_verfuegbar' }
  }
}

function etappenLabel(luecke: UnterkunftLuecke): string {
  if (!luecke.stageId) return 'ohne Etappenzuordnung'
  return luecke.stageName ? `Etappe ${luecke.stageId} „${luecke.stageName}“` : `Etappe ${luecke.stageId}`
}

function planZeilen(id: string, label: string, wert: UnterkunftAbdeckung, vergleich: boolean): Auswirkungsgruppe['zeilen'] {
  const zeilen: Auswirkungsgruppe['zeilen'] = [{
    id: `${id}-summe`,
    text: `${label}: ${wert.naechteAbgedeckt} von ${wert.naechteGesamt} Nächten im aufgezeichneten Plan abgedeckt, ${wert.naechteGebucht} vom Nutzer als gebucht markiert, ${wert.naechteAusgewaehlt} ausgewählt. Die Check-in-Nacht zählt, die Check-out-Nacht nicht. Das ist aufgezeichneter Planungsstand, keine Anbieterbestätigung, keine Verfügbarkeit und keine Reisebereitschaft.`,
  }]
  if (wert.luecken.length === 0) {
    if (vergleich) zeilen.push({ id: `${id}-keine-luecke`, text: `${label}: keine offene Nachtlücke im kanonischen Zeitraum.` })
  } else {
    wert.luecken.forEach((luecke, index) => {
      zeilen.push({
        id: `${id}-luecke-${index}`,
        text: `${label}, Lücke: Check-in ${luecke.start}, Check-out ${luecke.end}, ${luecke.naechte} Nächte, ${etappenLabel(luecke)}.`,
      })
    })
  }
  const ohneTag = wert.aufenthalte.filter(aufenthalt => aufenthalt.item.dayId === null).length
  zeilen.push({
    id: `${id}-unterkuenfte`,
    text: `${label}: ${wert.aufenthalte.length} aufgezeichnete Unterkünfte, davon ${ohneTag} ohne Tag, jede davon genau einmal gezählt. Nichts wird automatisch beim Anbieter storniert oder umgebucht.`,
  })
  return zeilen
}

function seiteZeilen(id: string, label: string, seite: Seite, vergleich: boolean): Auswirkungsgruppe['zeilen'] {
  if (seite.art === 'plan') return planZeilen(id, label, seite.wert, vergleich)
  if (seite.art === 'unklar') {
    return [{ id: `${id}-unklar`, text: `${label}: Unterkunftsstand noch unklar. Eine Gesamtaussage zur Abdeckung ist nicht möglich.` }]
  }
  return [{ id: `${id}-unverfuegbar`, text: `${label}: Unterkunftsplanung nicht verfügbar. Es wird keine Abdeckung von 0 angenommen.` }]
}

function unterkunftsgruppe(vorher: Trip, nachher: Trip, lesen: UnterkunftLeser): Auswirkungsgruppe | null {
  if (unterkunftsfakten(vorher) === unterkunftsfakten(nachher)) return null
  const erlaubt = zulassen(unterkunftsarbeit(vorher), unterkunftsarbeit(nachher))
  const links = seiteLesen(vorher, erlaubt.links, lesen)
  const rechts = seiteLesen(nachher, erlaubt.rechts, lesen)
  if (links.art === 'plan' && rechts.art === 'plan' && planKern(links.wert) === planKern(rechts.wert)) return null
  const vergleich = links.art === 'plan' && rechts.art === 'plan'
  const zeilen = [
    ...seiteZeilen('lodging-before', 'Bisheriger gespeicherter Plan', links, vergleich),
    ...seiteZeilen('lodging-after', 'Vorschau nach deiner Änderung', rechts, vergleich),
  ]
  if (!vergleich) {
    zeilen.push({
      id: 'lodging-kein-vergleich',
      text: 'Ein Vergleich der beiden Seiten ist nicht möglich. Jede Seite gilt nur für sich.',
    })
  }
  return { titel: UNTERKUNFT_TITEL, zeilen }
}
