// lib/trips/gast-reisen-cta.ts
//
// Primärer nächster Schritt auf /reisen ohne Konto. Nur der vorhandene
// Gastspeicher zählt – kein zweiter Draft-State.

export {
  createEinstiegFuerGast as gastReisenPrimaerCta,
  type CreateEinstieg as GastReisenCta,
} from '@/lib/trips/create-entry'
