// lib/reiseaenderung/fixtures/antworten.ts
//
// Gültige Modellantworten für die Prüfung der Änderungspipeline.
// Kein Test ruft ein Modell auf.

import type { Modelloperation } from '@/lib/reiseaenderung/schema'

export function leereOperation(
  art: Modelloperation['art'],
  extra: Partial<Modelloperation> = {},
): Modelloperation {
  return {
    art,
    etappeId: null,
    tagId: null,
    punktId: null,
    nachEtappeId: null,
    nachTagId: null,
    name: null,
    laendercode: null,
    titel: null,
    notiz: null,
    beginn: null,
    punktArt: null,
    tageDelta: null,
    tage: null,
    reisende: null,
    budgetziel: null,
    tempo: null,
    interessen: null,
    reisewunsch: null,
    abreiseort: null,
    startdatum: null,
    ...extra,
  }
}

export function aenderungAntwort(
  operationen: Modelloperation[],
  extra: Record<string, unknown> = {},
) {
  return {
    zusammenfassung: 'Die Reise wird angepasst.',
    annahmen: [] as string[],
    warnungen: [] as string[],
    operationen,
    ...extra,
  }
}

export const ANTWORT_ZWEI_TAGE_LAENGER = aenderungAntwort([
  leereOperation('dauer_aendern', { tageDelta: 2 }),
])

export const ANTWORT_ZU_DRITT = aenderungAntwort([leereOperation('stammdaten', { reisende: 3 })])
