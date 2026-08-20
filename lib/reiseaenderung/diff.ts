// lib/reiseaenderung/diff.ts
//
// Vorher/Nachher in Sätzen, die Reisende lesen können.
//
// Die Vorschau darf nicht wie eine gebuchte Reise aussehen, und sie darf nicht
// nur JSON zeigen. Diese Datei macht aus zwei Reisegraphen eine kurze Liste
// von Änderungen. Keine Preise, keine Anbieter.
//
// Frei von Next, Supabase und `process.env`.

import { TEMPO_BEZEICHNUNG } from '@/lib/trips/bezeichnungen'
import type { Reisegraph, TripDay, TripItem, TripStage } from '@/types/trips'

export type DiffEintrag = {
  art: 'stammdaten' | 'etappe' | 'tag' | 'punkt'
  text: string
}

function punkte(reise: Reisegraph): TripItem[] {
  return [...reise.days.flatMap((tag) => tag.items), ...reise.ohneTag]
}

function zeitraum(reise: Reisegraph): string {
  if (reise.startDate && reise.endDate) return `${reise.startDate} – ${reise.endDate}`
  return `${reise.days.length} ${reise.days.length === 1 ? 'Tag' : 'Tage'}`
}

function etappenNamen(liste: TripStage[]): string {
  return liste.map((etappe) => etappe.name).join(', ')
}

/**
 * Die Änderungen zwischen zwei Fassungen derselben Reise.
 *
 * Reihenfolge: Stammdaten, Etappen, Dauer, Tage, Planpunkte. Leere Listen
 * bedeuten: es hat sich fachlich nichts geändert – dann sollte niemand
 * „Übernehmen“ anbieten.
 */
export function reiseDiff(vorher: Reisegraph, nachher: Reisegraph): DiffEintrag[] {
  const eintraege: DiffEintrag[] = []

  if (vorher.title !== nachher.title) {
    eintraege.push({ art: 'stammdaten', text: `Titel: „${vorher.title}“ → „${nachher.title}“` })
  }
  if (vorher.origin !== nachher.origin) {
    eintraege.push({
      art: 'stammdaten',
      text: `Abreise: ${vorher.origin ?? 'offen'} → ${nachher.origin ?? 'offen'}`,
    })
  }
  if (vorher.travellers !== nachher.travellers) {
    eintraege.push({
      art: 'stammdaten',
      text: `Reisende: ${vorher.travellers} → ${nachher.travellers}`,
    })
  }
  if (vorher.budgetAmount !== nachher.budgetAmount) {
    eintraege.push({
      art: 'stammdaten',
      text: `Budgetziel: ${vorher.budgetAmount ?? 'offen'} → ${nachher.budgetAmount ?? 'offen'}`,
    })
  }
  if (vorher.pace !== nachher.pace) {
    eintraege.push({
      art: 'stammdaten',
      text: `Tempo: ${TEMPO_BEZEICHNUNG[vorher.pace].titel} → ${TEMPO_BEZEICHNUNG[nachher.pace].titel}`,
    })
  }
  if (zeitraum(vorher) !== zeitraum(nachher)) {
    eintraege.push({
      art: 'stammdaten',
      text: `Zeitraum: ${zeitraum(vorher)} → ${zeitraum(nachher)}`,
    })
  }

  const vorherEtappen = new Map(vorher.stages.map((etappe) => [etappe.id, etappe]))
  const nachherEtappen = new Map(nachher.stages.map((etappe) => [etappe.id, etappe]))

  for (const etappe of nachher.stages) {
    if (!vorherEtappen.has(etappe.id)) {
      const tage = nachher.days.filter((tag) => tag.stageId === etappe.id).length
      eintraege.push({
        art: 'etappe',
        text: `Neu: ${etappe.name} (${tage} ${tage === 1 ? 'Tag' : 'Tage'})`,
      })
    }
  }
  for (const etappe of vorher.stages) {
    if (!nachherEtappen.has(etappe.id)) {
      eintraege.push({ art: 'etappe', text: `Entfernt: ${etappe.name}` })
    }
  }

  if (vorher.days.length !== nachher.days.length) {
    eintraege.push({
      art: 'tag',
      text: `Dauer: ${vorher.days.length} → ${nachher.days.length} ${nachher.days.length === 1 ? 'Tag' : 'Tage'}`,
    })
  }

  const vorherTage = new Map(vorher.days.map((tag) => [tag.id, tag]))
  const nachherTage = new Map(nachher.days.map((tag) => [tag.id, tag]))

  for (const tag of nachher.days) {
    if (!vorherTage.has(tag.id)) {
      eintraege.push({
        art: 'tag',
        text: `Neuer Tag ${tag.dayIndex}${tag.title ? `: ${tag.title}` : ''}`,
      })
    } else {
      const alt = vorherTage.get(tag.id) as TripDay
      if (alt.title !== tag.title && tag.title) {
        eintraege.push({
          art: 'tag',
          text: `Tag ${tag.dayIndex}: „${alt.title ?? 'ohne Titel'}“ → „${tag.title}“`,
        })
      }
    }
  }
  for (const tag of vorher.days) {
    if (!nachherTage.has(tag.id)) {
      eintraege.push({
        art: 'tag',
        text: `Tag ${tag.dayIndex} entfernt${tag.title ? ` (${tag.title})` : ''}`,
      })
    }
  }

  const vorherPunkte = new Map(punkte(vorher).map((punkt) => [punkt.id, punkt]))
  const nachherPunkte = new Map(punkte(nachher).map((punkt) => [punkt.id, punkt]))

  for (const punkt of punkte(nachher)) {
    if (!vorherPunkte.has(punkt.id)) {
      eintraege.push({ art: 'punkt', text: `Neu: ${punkt.title}` })
    }
  }
  for (const punkt of punkte(vorher)) {
    if (!nachherPunkte.has(punkt.id)) {
      eintraege.push({ art: 'punkt', text: `Entfernt: ${punkt.title}` })
    }
  }

  if (etappenNamen(vorher.stages) !== etappenNamen(nachher.stages) && eintraege.every((e) => e.art !== 'etappe')) {
    eintraege.push({
      art: 'etappe',
      text: `Etappen: ${etappenNamen(vorher.stages)} → ${etappenNamen(nachher.stages)}`,
    })
  }

  return eintraege
}
