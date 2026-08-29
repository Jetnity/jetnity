// lib/traveller/account-registry-meldung.ts
//
// Datenbankablehnungen der Registry in Sätze, die Owner lesen können.
// Roh-SQL und Constraint-Namen bleiben intern.

import { problemAus } from '@/lib/api/datenbank-lesen'

export const REGISTRY_NICHT_ANGEMELDET =
  'Für diesen Schritt ist eine Anmeldung erforderlich. Bitte melde dich erneut an.'

export const REGISTRY_NICHT_GEFUNDEN = 'Dieser Registry-Eintrag wurde nicht gefunden.'

export const REGISTRY_SCHREIB_503 =
  'Die Reisendenangabe konnte gerade nicht gespeichert werden. Bitte versuche es in einem Moment erneut.'

export const REGISTRY_SCHREIB_500 =
  'Die Reisendenangabe konnte nicht gespeichert werden. Bitte prüfe deine Angaben.'

export const REGISTRY_DOPPELTE_STAAT = 'Diese Staatsbürgerschaft ist bereits hinterlegt.'

export const REGISTRY_STAAT_LIMIT = 'Ein Registry-Reisender trägt höchstens 8 Staatsbürgerschaften.'

export const REGISTRY_DOKUMENT_LIMIT = 'Ein Registry-Reisender trägt höchstens 12 Reisedokumente.'

export const REGISTRY_BEZEICHNUNG_ABGELEHNT =
  'Diese Bezeichnung ist nicht zulässig. Verwende eine kurze, datensparsame Bezeichnung ohne Ausweisdaten.'

export function registrySchreibmeldung(
  fehler: { message: string; code?: string | null },
  status?: number,
): string {
  const problem = problemAus({ data: null, error: fehler, status }, fehler)
  if (problem.status === 503) return REGISTRY_SCHREIB_503

  const text = fehler.message
  const code = fehler.code ?? ''

  if (code === '23505' || /account_traveller_citizenships_land_eindeutig/.test(text)) {
    return REGISTRY_DOPPELTE_STAAT
  }
  if (/höchstens 8 Staatsbürgerschaften/.test(text)) return REGISTRY_STAAT_LIMIT
  if (/höchstens 12 Reisedokumente/.test(text)) return REGISTRY_DOKUMENT_LIMIT
  if (
    /account_travellers_keine_ausweisnummern/.test(text) ||
    /account_travellers_keine_html/.test(text) ||
    /account_travellers_label_laenge/.test(text)
  ) {
    return REGISTRY_BEZEICHNUNG_ABGELEHNT
  }

  return REGISTRY_SCHREIB_500
}
