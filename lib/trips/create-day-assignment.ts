// lib/trips/create-day-assignment.ts
//
// Reine Erstzuordnung vorhandener Kalendertage auf bestätigte Zielvorkommen.
// Guest und Account benutzen genau diese Abbildung. Sie erfindet keine Daten,
// Hotel-Nächte oder Transfers und verschiebt keine Ansprüche still.

import {
  dayStageAssignmentModeAbleiten,
  type DayStageAssignmentMode,
} from '@/lib/trips/day-stage-assignment'
import { TAGE_MAXIMUM, ZEITRAUM_ZU_LANG, reisetageBauen, zeitraumIstZuLang } from '@/lib/trips/tage'

/** Dieselbe Etappengrenze wie `GRENZEN.etappenJeReise`. */
export const ZUORDNUNG_ANSPRUECHE_MAXIMUM = 50

export type Tagesanspruch = {
  /** 1-basierte Position des Zielvorkommens in der bestätigten Reihenfolge. */
  occurrence: number
  startDate: string
  endDate: string
}

export type TageszuordnungEingabe = {
  stageCount: number
  startDate: string
  endDate: string
  /** Fehlend: keine Verteilung. Vorhandene Ansprüche sind eine ausdrückliche Wahl. */
  allocation?: { claims: readonly Tagesanspruch[] } | null
}

export type TageszuordnungErfolg = {
  ok: true
  positions: Array<number | null>
  mode: DayStageAssignmentMode
  assigned: number
  unassigned: number
}

export type TageszuordnungFehler = {
  ok: false
  message: string
  focusOccurrence: number | null
}

const REIHENFOLGE =
  'Die bekannten Tage folgen nicht der Reihenfolge der Ziele. Bitte korrigiere die Zuordnung. Sie wird nicht automatisch verschoben.'
const DOPPELT = 'Ein Tag ist doppelt zugeordnet.'
const AUSSERHALB = 'Ein Zuordnungstag liegt außerhalb des Reisezeitraums.'
const FREMDE =
  'Die Tageszuordnung verweist auf ein Ziel, das in dieser Reise nicht vorkommt.'
const NUR_MEHRERE = 'Eine Tagesverteilung ist nur bei mehreren Zielen möglich.'
const UMFANG = `Die Tageszuordnung umfasst höchstens ${ZUORDNUNG_ANSPRUECHE_MAXIMUM} Ansprüche.`
const KEINE_TAGE = 'Für diesen Zeitraum gibt es keine Reisetage.'
const ENDE_VOR_ANFANG = 'Das Zuordnungsende liegt vor dem Anfang.'
const KEINE_ZAHL = 'Die Tageszuordnung braucht eine ganze Zielnummer.'

function isoDatum(wert: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(wert)) return false
  const [jahr, monat, tag] = wert.split('-').map(Number)
  const geprueft = new Date(Date.UTC(jahr, monat - 1, tag))
  return (
    geprueft.getUTCFullYear() === jahr &&
    geprueft.getUTCMonth() === monat - 1 &&
    geprueft.getUTCDate() === tag
  )
}

function fehler(message: string, focusOccurrence: number | null = null): TageszuordnungFehler {
  return { ok: false, message, focusOccurrence }
}

/**
 * Baut je Kalendertag die Etappenposition oder `null`.
 *
 * Bekannte Positionen müssen in der Reihenfolge der Zielvorkommen liegen,
 * sobald Tage ohne Zuordnung ausgelassen werden. Lücken bleiben leer.
 */
export function createDayPositions(eingabe: TageszuordnungEingabe): TageszuordnungErfolg | TageszuordnungFehler {
  if (!Number.isInteger(eingabe.stageCount) || eingabe.stageCount < 1) {
    return fehler('Mindestens ein bestätigtes Reiseziel ist erforderlich.')
  }

  if (zeitraumIstZuLang(eingabe.startDate, eingabe.endDate)) return fehler(ZEITRAUM_ZU_LANG)

  const tage = reisetageBauen(eingabe.startDate, eingabe.endDate)
  const ansprueche = eingabe.allocation?.claims
  const hatAnsprueche = ansprueche != null

  if (hatAnsprueche && !Array.isArray(ansprueche)) {
    return fehler('Die Tageszuordnung hat keinen gültigen Behälter.')
  }
  if (hatAnsprueche && ansprueche.length > ZUORDNUNG_ANSPRUECHE_MAXIMUM) {
    return fehler(UMFANG)
  }
  if (hatAnsprueche && ansprueche.length > TAGE_MAXIMUM) {
    return fehler(UMFANG)
  }

  if (eingabe.stageCount === 1) {
    if (hatAnsprueche && ansprueche.length > 0) return fehler(NUR_MEHRERE)
    return {
      ok: true,
      positions: tage.map(() => 1),
      mode: 'single_destination',
      assigned: tage.length,
      unassigned: 0,
    }
  }

  if (!hatAnsprueche || ansprueche.length === 0) {
    return {
      ok: true,
      positions: tage.map(() => null),
      mode: 'unassigned',
      assigned: 0,
      unassigned: tage.length,
    }
  }

  if (tage.length === 0) return fehler(KEINE_TAGE)

  const index = new Map(tage.map((tag, stelle) => [tag.dayDate, stelle]))
  const positions: Array<number | null> = tage.map(() => null)

  for (let stelle = 0; stelle < ansprueche.length; stelle += 1) {
    const anspruch = ansprueche[stelle]
    if (!anspruch || typeof anspruch !== 'object') {
      return fehler('Die Tageszuordnung hat keinen gültigen Behälter.')
    }
    const occurrence = anspruch.occurrence
    if (typeof occurrence !== 'number' || !Number.isInteger(occurrence)) {
      return fehler(KEINE_ZAHL, null)
    }
    if (occurrence < 1 || occurrence > eingabe.stageCount) {
      return fehler(FREMDE, occurrence)
    }
    if (!isoDatum(anspruch.startDate) || !isoDatum(anspruch.endDate)) {
      return fehler(AUSSERHALB, occurrence)
    }
    const von = index.get(anspruch.startDate)
    const bis = index.get(anspruch.endDate)
    if (von == null || bis == null) return fehler(AUSSERHALB, occurrence)
    if (von > bis) return fehler(ENDE_VOR_ANFANG, occurrence)
    for (let tag = von; tag <= bis; tag += 1) {
      if (positions[tag] != null) return fehler(DOPPELT, occurrence)
      positions[tag] = occurrence
    }
  }

  let zuletzt: number | null = null
  for (let stelle = 0; stelle < positions.length; stelle += 1) {
    const position = positions[stelle]
    if (position == null) continue
    if (zuletzt != null && position < zuletzt) {
      return fehler(REIHENFOLGE, position)
    }
    zuletzt = position
  }

  const bekannte = positions.filter((position): position is number => position != null)
  const mode = dayStageAssignmentModeAbleiten({
    stageCount: eingabe.stageCount,
    positions: bekannte,
  })

  return {
    ok: true,
    positions,
    mode,
    assigned: bekannte.length,
    unassigned: positions.length - bekannte.length,
  }
}

export type AnspruchZeile = {
  occurrenceKey: string
  startDate: string
  endDate: string
}

/**
 * Entfernt Ansprüche, deren Zielvorkommen oder Kalendertage nicht mehr
 * dieselben sind. Nichts wird auf ein anderes Ziel oder Datum verschoben.
 */
export function tageszuordnungAngleichen(eingabe: {
  claims: readonly AnspruchZeile[]
  occurrenceKeys: readonly string[]
  startDate: string
  endDate: string
}): { claims: AnspruchZeile[]; hinweis: string | null } {
  const keys = new Set(eingabe.occurrenceKeys)
  const claims: AnspruchZeile[] = []
  let entferntesZiel = false
  let zeitraum = false

  for (const anspruch of eingabe.claims) {
    if (!keys.has(anspruch.occurrenceKey)) {
      entferntesZiel = true
      continue
    }
    const startDraussen =
      anspruch.startDate !== '' &&
      (anspruch.startDate < eingabe.startDate || anspruch.startDate > eingabe.endDate)
    const endeDraussen =
      anspruch.endDate !== '' &&
      (anspruch.endDate < eingabe.startDate || anspruch.endDate > eingabe.endDate)
    if (startDraussen || endeDraussen) {
      zeitraum = true
      continue
    }
    claims.push({ ...anspruch })
  }

  const hinweis = zeitraum
    ? 'Der Zeitraum hat sich geändert. Die betroffene Tageszuordnung wurde gelöscht, damit kein Tag auf ein anderes Datum rutscht.'
    : entferntesZiel
      ? 'Ein entferntes Ziel behält seine Tage nicht. Die betroffenen Tage sind wieder ohne Ziel.'
      : null

  return { claims, hinweis }
}
