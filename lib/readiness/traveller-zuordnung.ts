// lib/readiness/traveller-zuordnung.ts
//
// Traveller-spezifische Readiness darf nicht still zu trip-level werden.
// Nur eine ausdrückliche null-Ref bedeutet: der Check gehört der ganzen Reise.

export const TRAVELLER_ID_FEHLT = 'Dieser Vorbereitungspunkt gehört zu einem unbekannten Reisenden.'
export const TRAVELLER_ID_UNGUELTIG = 'Dieser Vorbereitungspunkt kann dem Reisenden nicht sicher zugeordnet werden.'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type TravellerZuordnung =
  | { ok: true; travellerId: string | null }
  | { ok: false; meldung: string }

export function travellerIdAufloesen(
  party: readonly { id: string; clientRef: string }[] | null | undefined,
  travellerClientRef: string | null | undefined,
): TravellerZuordnung {
  if (travellerClientRef == null || travellerClientRef === '') {
    return { ok: true, travellerId: null }
  }
  const gefunden = (party ?? []).filter((eintrag) => eintrag.clientRef === travellerClientRef)
  if (gefunden.length !== 1) {
    return { ok: false, meldung: TRAVELLER_ID_FEHLT }
  }
  const id = gefunden[0]?.id ?? ''
  if (!UUID.test(id)) {
    return { ok: false, meldung: TRAVELLER_ID_UNGUELTIG }
  }
  return { ok: true, travellerId: id }
}
