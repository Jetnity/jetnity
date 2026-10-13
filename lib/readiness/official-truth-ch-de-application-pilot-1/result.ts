import type { OfficialEvaluation } from '@/lib/readiness/official'
export type PilotStatus = 'context_missing' | 'context_changed' | 'unsupported_context' | 'disabled'
  | 'source_not_admitted' | 'unavailable' | 'verified'
export type PilotResult = {
  status: PilotStatus; tripId: string; revision: number; contextFingerprint: string;
  expiresAt: string | null; evaluations: OfficialEvaluation[];
}
export const pilotMessages: Record<PilotStatus, string> = {
  context_missing: 'Wähle ein verknüpftes Dokument und speichere deine Reiseangaben.',
  context_changed: 'Deine Reiseangaben haben sich geändert. Bitte bestätige sie erneut.',
  unsupported_context: 'Diese Angaben werden vom begrenzten CH–DE-Pilot noch nicht unterstützt. Es liegt keine Visumauskunft vor.',
  disabled: 'Die offizielle Prüfung ist noch nicht freigegeben. Deine Angaben bleiben gespeichert.',
  source_not_admitted: 'Für diese Prüfung liegt keine aktuelle Quellen- und Prüffreigabe vor.',
  unavailable: 'Die Prüfung konnte nicht abgeschlossen werden. Ein früheres Ergebnis wird nicht weiter angezeigt.',
  verified: 'Eine Visumfrage wurde anhand der aktuellen Quelle geprüft. Weitere Anforderungen bleiben ungeprüft. Dies ist keine Einreisegarantie.',
}
