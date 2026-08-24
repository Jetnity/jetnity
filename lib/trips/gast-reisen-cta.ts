// lib/trips/gast-reisen-cta.ts
//
// Primärer nächster Schritt auf /reisen ohne Konto. Nur der vorhandene
// Gastspeicher zählt – kein zweiter Draft-State.

export type GastReisenCta =
  | { art: 'fortsetzen'; href: string; label: 'Reise fortsetzen' }
  | { art: 'erstellen'; href: '/planen'; label: 'Reise erstellen' }

export function gastReisenPrimaerCta(aktiv: { id: string } | null | undefined): GastReisenCta {
  if (aktiv?.id) {
    return { art: 'fortsetzen', href: `/reisen/${aktiv.id}`, label: 'Reise fortsetzen' }
  }
  return { art: 'erstellen', href: '/planen', label: 'Reise erstellen' }
}
