// lib/trips/trip-plan-premium-experience-4.ts
//
// Reine Darstellungshilfe für den Reiseplan.
// Keine Reisewahrheit, keine URL-Regel, kein Provider, keine Sortierung.

/** Ab dieser Breite ersetzt ein Raster den Telefonstreifen. */
export const PLAN_TAG_TABLET_AB_PX = 768

/** Ab dieser Breite hat das Raster höchstens sieben Tagesspalten. */
export const PLAN_TAG_DESKTOP_AB_PX = 1024

export const PLAN_TAG_SPALTEN_TABLET = 4
export const PLAN_TAG_SPALTEN_DESKTOP = 7

export type PlanTagSpalten = 'navigator' | typeof PLAN_TAG_SPALTEN_TABLET | typeof PLAN_TAG_SPALTEN_DESKTOP

/**
 * Telefon: kein umbrechendes Tagesfeld, nur der kompakte Navigator.
 * Tablet: vier Spalten als Brücke. Desktop und breiter: höchstens sieben.
 */
export function planTagSpalten(breite: number): PlanTagSpalten {
  if (!Number.isFinite(breite) || breite < PLAN_TAG_TABLET_AB_PX) return 'navigator'
  if (breite < PLAN_TAG_DESKTOP_AB_PX) return PLAN_TAG_SPALTEN_TABLET
  return PLAN_TAG_SPALTEN_DESKTOP
}

export type PlanTagRef = {
  id: string
  dayIndex: number
}

export type PlanTagNavigator = {
  /** Kanonische Tagesnummer, nicht eine neu erfundene Zählung. */
  index: number
  gesamt: number
  text: string
  vorherId: string | null
  naechsterId: string | null
}

/** Sichtbare Reihenfolge aus der bereits abgeleiteten Timeline. Keine neue Zuordnung. */
export function planTageFolgen(etappen: readonly { tage: readonly PlanTagRef[] }[]): PlanTagRef[] {
  return etappen.flatMap((etappe) => etappe.tage.map((tag) => ({ id: tag.id, dayIndex: tag.dayIndex })))
}

/**
 * Vor/Zurück folgt der Timeline-Reihenfolge.
 * Der Text behält die kanonische `dayIndex`-Nummer.
 * Ein unbekannter Tag liefert `null`, statt still auf Tag 1 zu springen.
 */
export function planTagNavigator(tage: readonly PlanTagRef[], aktivId: string): PlanTagNavigator | null {
  if (tage.length === 0) return null
  const stelle = tage.findIndex((tag) => tag.id === aktivId)
  if (stelle < 0) return null
  const tag = tage[stelle]
  return {
    index: tag.dayIndex,
    gesamt: tage.length,
    text: `Tag ${tag.dayIndex} von ${tage.length}`,
    vorherId: stelle > 0 ? tage[stelle - 1].id : null,
    naechsterId: stelle < tage.length - 1 ? tage[stelle + 1].id : null,
  }
}

export type TagStreifenEingabe = {
  scrollLeft: number
  clientWidth: number
  scrollWidth: number
  buttonOffset: number
  buttonWidth: number
  luft?: number
}

/**
 * Horizontalziel, damit der gewählte Tag im Streifen vollständig sichtbar bleibt.
 * `null`, wenn er schon im Fenster liegt. Die Seite selbst wird nicht bewegt.
 */
export function tagStreifenZiel(eingabe: TagStreifenEingabe): number | null {
  const luft = eingabe.luft ?? 4
  const links = eingabe.buttonOffset
  const rechts = eingabe.buttonOffset + eingabe.buttonWidth
  const fensterLinks = eingabe.scrollLeft
  const fensterRechts = eingabe.scrollLeft + eingabe.clientWidth
  if (links >= fensterLinks + luft && rechts <= fensterRechts - luft) return null

  const roh = eingabe.buttonOffset - (eingabe.clientWidth - eingabe.buttonWidth) / 2
  const max = Math.max(0, eingabe.scrollWidth - eingabe.clientWidth)
  return Math.min(max, Math.max(0, Math.round(roh)))
}

export type TagVertikalEingabe = {
  top: number
  bottom: number
  kante: number
  viewportHeight: number
  luft?: number
}

/**
 * Scroll-Delta, damit der gewählte Tag nicht unter der klebenden Kante
 * und nicht unter dem unteren Rand liegt. `null`, wenn er schon frei liegt.
 * Ein zu hohes Element bleibt an der Oberkante ausgerichtet.
 */
export function tagVertikalZiel(eingabe: TagVertikalEingabe): number | null {
  const luft = eingabe.luft ?? 8
  const oben = eingabe.kante + luft
  const unten = eingabe.viewportHeight - luft
  if (eingabe.top >= oben && eingabe.bottom <= unten) return null
  if (eingabe.top < oben) return eingabe.top - oben
  if (eingabe.bottom > unten) return eingabe.bottom - unten
  return null
}

/**
 * Nur die Korrektur nach unten, wenn der Tag unter der klebenden Kante liegt.
 * Ein Tag weiter unten auf der Seite bleibt dort. Vor/Zurück soll den
 * Tageskontext nicht von der Arbeitsfläche wegschieben.
 */
export function tagUnterKanteZiel(eingabe: TagVertikalEingabe): number | null {
  const delta = tagVertikalZiel(eingabe)
  if (delta == null || delta >= 0) return null
  return delta
}
