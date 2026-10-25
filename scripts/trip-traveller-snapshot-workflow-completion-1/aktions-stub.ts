type Aufruf = { name: string; args: unknown[] }

function merken(name: string, args: unknown[]) {
  const ziel = (globalThis as { __KONTO_AUFRUFE__?: Aufruf[] }).__KONTO_AUFRUFE__
  ziel?.push({ name, args })
  return { ok: true as const, wert: null, meldung: '' }
}

function aktion(name: string) {
  return async (...args: unknown[]) => merken(name, args)
}

export const travellerSetzen = aktion('travellerSetzen')
export const travellerEntfernen = aktion('travellerEntfernen')
export const registryTravellerInReiseUebernehmen = aktion('registryTravellerInReiseUebernehmen')
export const readinessSetzen = aktion('readinessSetzen')
export const readinessEntfernen = aktion('readinessEntfernen')
export const planpunktAnlegen = aktion('planpunktAnlegen')
export const planpunktEntfernen = aktion('planpunktEntfernen')
export const planpunktBearbeiten = aktion('planpunktBearbeiten')
export const planpunktBuchungsstatusSetzen = aktion('planpunktBuchungsstatusSetzen')
export const reiseLoeschen = aktion('reiseLoeschen')
export const flugRouteManuellSetzen = aktion('flugRouteManuellSetzen')
export const unterkunftZeitraumSetzen = aktion('unterkunftZeitraumSetzen')
export const activityInReiseUebernehmen = aktion('activityInReiseUebernehmen')
export const flugInReiseUebernehmen = aktion('flugInReiseUebernehmen')
export const hotelInReiseUebernehmen = aktion('hotelInReiseUebernehmen')
export const mobilityManuellInReiseAnlegen = aktion('mobilityManuellInReiseAnlegen')
export const rentalCarManuellInReiseAnlegen = aktion('rentalCarManuellInReiseAnlegen')
