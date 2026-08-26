// lib/trips/create-entry.ts
//
// TW-6 Create-Entry / Product-Owner-Option 1.
//
// Nur Darstellung und Fail-fast vor teuren Create-Schritten. Der Gastspeicher
// (ADR-0013 / ADR-0042), Guest→Account und der SQL-Default `balanced` bleiben
// unverändert. Dieses Modul erfindet keinen Startort und keine zweite Ablage.

import type { TripInterest, TripPace } from '@/types/trips'

/**
 * Persistenzdefault, wenn der Nutzer kein Tempo gewählt hat.
 *
 * SQL/`reise_anlegen` schreibt weiterhin `coalesce(nullif(pace,''), 'balanced')`.
 * Die UI darf diesen Wert nicht als bewusste Auswahl zeigen.
 */
export const CREATE_PERSISTENZ_TEMPO: TripPace = 'balanced'

/** Keine Interessen-Wahl im TW-6-Create. Persistenz bleibt eine leere Menge. */
export const CREATE_PERSISTENZ_INTERESSEN: TripInterest[] = []

export type GastCreateGate =
  | { erlaubt: true }
  | { erlaubt: false; bestehendeId: string }

/**
 * Ob ein Create-Versuch weiterlaufen darf, bevor ein Modell- oder
 * Ortsbestätigungsaufruf Geld oder Netz kostet.
 *
 * Konten dürfen mehrere Reisen anlegen. Gäste mit aktiver Reise nicht.
 */
export function gastCreateGate(eingabe: {
  angemeldet: boolean
  aktiveReiseId?: string | null
}): GastCreateGate {
  if (eingabe.angemeldet) return { erlaubt: true }
  const id = eingabe.aktiveReiseId?.trim()
  if (id) return { erlaubt: false, bestehendeId: id }
  return { erlaubt: true }
}

export function darfCreateModellAufrufen(gate: GastCreateGate): boolean {
  return gate.erlaubt
}

export type CreateEinstieg =
  | { art: 'fortsetzen'; href: string; label: 'Reise fortsetzen' }
  | { art: 'erstellen'; href: '/planen'; label: 'Reise erstellen' }

/** Primärer nächster Schritt für einen Gast. Kein zweiter Create. */
export function createEinstiegFuerGast(aktiv: { id: string } | null | undefined): CreateEinstieg {
  if (aktiv?.id) {
    return { art: 'fortsetzen', href: `/reisen/${aktiv.id}`, label: 'Reise fortsetzen' }
  }
  return { art: 'erstellen', href: '/planen', label: 'Reise erstellen' }
}

/**
 * Generische Marketing-/Nav-CTAs: mit aktiver Gastreise zur bestehenden Reise,
 * sonst zum Create. Zielspezifische Karten bleiben beim Create-Href – die
 * /planen-Gate fängt den zweiten Versuch dort ab, statt eine Bali-Karte still
 * auf eine Lissabon-Reise umzubiegen.
 */
export function genericCreateHrefFuerGast(
  createHref: string,
  aktiv: { id: string } | null | undefined,
): { href: string; labelErsetzen: boolean } {
  if (aktiv?.id) {
    return { href: `/reisen/${aktiv.id}`, labelErsetzen: true }
  }
  return { href: createHref, labelErsetzen: false }
}

/** Homepage-/Planen-Vorbelegung: nur wirklich vorhandene Felder. */
export function planenVorbelegung(eingabe: {
  zielId?: string | null
  zielName?: string | null
  idee?: string | null
  originId?: string | null
  originName?: string | null
}): {
  destinationId: string
  destination: string
  idee: string
  originId: string
  origin: string
} {
  return {
    destinationId: eingabe.zielId?.trim() ?? '',
    destination: eingabe.zielName?.trim() ?? '',
    idee: eingabe.idee?.trim() ?? '',
    originId: '',
    origin: '',
  }
}
