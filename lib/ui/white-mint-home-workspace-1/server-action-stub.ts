/** Fixture stand-in for server actions. They are not called by the guest plan/history path. */
async function serverStub(): Promise<never> {
  throw new Error('server-action-stub')
}

export const ortBestaetigen = serverStub
export const reiseorteBestaetigen = serverStub
export const aenderungErzeugen = serverStub
export const aenderungErzeugenGast = serverStub
export const aenderungOrteAufloesen = serverStub
export const aenderungUebernehmen = serverStub
export const manuelleAenderungVorschau = serverStub
export const manuelleAenderungUebernehmen = serverStub
