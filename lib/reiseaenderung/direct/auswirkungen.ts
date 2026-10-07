import { istKommerziell } from '@/lib/reiseaenderung/geschuetzt'
import { aenderungsAuswirkung, planSnapshot } from '@/lib/trips/trip-plan-integrated/day'
import { reiseDiff } from '@/lib/reiseaenderung/diff'
import { tripZeitpruefung } from '@/lib/trips/trip-timeline-temporal-review-1'
import type { Trip, TripItem, TripDay } from '@/types/trips'

export type Auswirkungsgruppe = { titel: string; zeilen: { id: string; text: string }[] }
const datum = (s: string | null) => s ?? 'offen'
const termin = (p: TripItem) => `Beginn ${datum(p.startsOn)} ${p.startsAt ?? '(Zeit offen)'}; Ende ${datum(p.endsOn)} ${p.endsAt ?? '(Zeit offen)'}`
function tagText(t: Trip, day: TripDay | undefined): string {
  if (!day) return 'Ungeplant'
  const stage = t.stages.find(s => s.id === day.stageId)
  return `Tag ${day.dayIndex}${day.title ? ` „${day.title}“` : ''} · ${datum(day.dayDate)}${stage ? ` · Etappe ${stage.position}: ${stage.name}` : ' · ohne Etappe'}`
}
export function auswirkungen(vorher: Trip, nachher: Trip): Auswirkungsgruppe[] {
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
    .map((p, i) => ({ id: `time-${i}`, text: `${labels.get(p.itemIds[0])} / ${labels.get(p.itemIds[1])}: ${p.state === 'proven_conflict' ? 'nachgewiesene' : 'mögliche'} Überschneidung im gespeicherten Plan.` }))
  if (zeit.coverage.state !== 'complete' || zeit.pairs.some(p => p.state === 'not_evaluable')) temporal.push({ id: 'coverage', text: 'Die vorhandenen Zeitangaben erlauben keine vollständige Konfliktprüfung. Fehlende Zeit-, Orts- oder Zeitzonenangaben bleiben offen.' })
  const impact = aenderungsAuswirkung(planSnapshot(vorher), planSnapshot(nachher))
  const preparation = (impact?.targets ?? []).map(target => {
    const task = nachher.readinessItems?.find(t => t.clientRef === target.id)
    const points = target.reasons.map(id => oldItems.find(p => p.id === id)?.title ?? 'Planpunkt').join(', ')
    return { id: target.id, text: `${task?.title ?? 'Vorbereitung'}: Bezug zu ${points} wäre betroffen. Der gespeicherte Bearbeitungsstand bleibt unverändert; bitte in Vorbereitung erneut prüfen.` }
  })
  return [ { titel: 'Grunddaten und Zeitraum', zeilen: basic }, { titel: 'Etappen', zeilen: stages }, { titel: 'Tage', zeilen: days },
    { titel: 'Normale Planpunkte, die entfernt würden', zeilen: removed }, { titel: 'Geschützte Planpunkte mit betroffenem Reisezeitraum oder Tageskontext', zeilen: preserved },
    { titel: 'Weitere betroffene Planpunkte', zeilen: moved }, { titel: 'Zeitprüfung des vorgeschlagenen Plans', zeilen: temporal }, { titel: 'Betroffene Vorbereitungen', zeilen: preparation } ]
}
