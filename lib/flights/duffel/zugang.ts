// lib/flights/duffel/zugang.ts
//
// Duffel-lokale Zugangsdaten. Nicht Teil der globalen FlugUmgebung.
// Live-Tokens dürfen Phase 3.1 nicht auslösen.

export type DuffelUmgebung = {
  DUFFEL_ACCESS_TOKEN?: string
}

export function duffelUmgebungAusProzess(): DuffelUmgebung {
  return { DUFFEL_ACCESS_TOKEN: process.env.DUFFEL_ACCESS_TOKEN }
}

/** Nur Duffel-Test. Live-Tokens dürfen Phase 3.1 nicht auslösen. */
export function istDuffelTestToken(wert: string | undefined): boolean {
  const token = wert?.trim() ?? ''
  return token.startsWith('duffel_test_') && token.length >= 20 && token.length <= 200
}
