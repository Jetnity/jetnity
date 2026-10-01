// lib/readiness/preparation-premium-experience-5.ts
//
// Presentation-only Struktur für die Reisevorbereitung.
// Ändert keine OfficialEvaluation, keinen Nutzerstand und keine Persistenz.

import type { ReadinessKind } from '@/types/trips'

export const PREPARATION_PREMIUM_EXPERIENCE = '5' as const

export const PREPARATION_DISCLAIMER =
  'Ein Häkchen ist keine offizielle Visa- oder Einreisebestätigung.'

export const PREPARATION_BEREICHE = [
  { id: 'reisende-dokumente', titel: 'Reisende & Dokumente' },
  { id: 'offizielle-anforderungen', titel: 'Offizielle Anforderungen' },
  { id: 'tickets-buchungen', titel: 'Tickets & Buchungsbestätigungen' },
  { id: 'eigene-vorbereitung', titel: 'Eigene Vorbereitung' },
] as const

export type PreparationBereichId = (typeof PREPARATION_BEREICHE)[number]['id']

const TICKET_ARTEN = ['ticket_confirmation_check', 'booking_confirmation_check'] as const

/**
 * Wiederholt den kurzen Fail-closed-Status nicht, wenn die Prüfung ihn schon sagt.
 * Ein abweichender Status bleibt stehen.
 */
export function preparationUebersichtStatus(pruefung: string, statusText: string): string {
  const links = pruefung.trim()
  const rechts = statusText.trim()
  if (!rechts) return links
  if (!links) return rechts
  const linksKlein = links.toLocaleLowerCase('de')
  const rechtsKlein = rechts.toLocaleLowerCase('de')
  if (linksKlein.includes(rechtsKlein)) return links
  if (rechts === 'Nicht verfügbar' && linksKlein.includes('nicht verfügbar')) return links
  if (
    rechts === 'Noch nicht offiziell geprüft' &&
    /noch nicht (offiziell )?geprüft|fehlen noch Angaben|erneut prüfen|nicht verfügbar/i.test(links)
  ) {
    return links
  }
  return `${links}. ${rechts}`
}

export function preparationPersoenlichAufteilen<T extends { kind: ReadinessKind }>(
  items: readonly T[],
): { tickets: T[]; eigene: T[]; weitere: T[] } {
  const tickets: T[] = []
  const eigene: T[] = []
  const weitere: T[] = []
  for (const item of items) {
    if ((TICKET_ARTEN as readonly string[]).includes(item.kind)) tickets.push(item)
    else if (item.kind === 'preparation') eigene.push(item)
    else weitere.push(item)
  }
  return { tickets, eigene, weitere }
}

export function preparationPlatzhalterZeile(ergebnisText: string, freshnessText: string): string {
  const links = ergebnisText.trim()
  const rechts = freshnessText.trim()
  if (!rechts || links.toLocaleLowerCase('de').includes(rechts.toLocaleLowerCase('de'))) return links
  if (!links) return rechts
  return `${links} · ${rechts}`
}

export type PreparationPlatzhalterDarstellung =
  | { art: 'einzeln' }
  | { art: 'gemeinsam'; zeile: string }

/**
 * Dieselbe Fail-closed-Zeile mehrerer reiner Placeholder einmal zeigen.
 * Abweichende oder evidence-tragende Zeilen bleiben einzeln.
 */
export function preparationPlatzhalterGruppe(
  eintraege: readonly { kompakt: boolean; ergebnisText: string; freshnessText: string }[],
): PreparationPlatzhalterDarstellung {
  if (eintraege.length < 2) return { art: 'einzeln' }
  if (!eintraege.every((eintrag) => eintrag.kompakt)) return { art: 'einzeln' }
  const zeilen = eintraege.map((eintrag) =>
    preparationPlatzhalterZeile(eintrag.ergebnisText, eintrag.freshnessText),
  )
  const erste = zeilen[0] ?? ''
  if (!erste || zeilen.some((zeile) => zeile !== erste)) return { art: 'einzeln' }
  return { art: 'gemeinsam', zeile: erste }
}
