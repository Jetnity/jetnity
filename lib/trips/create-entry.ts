// lib/trips/create-entry.ts
//
// TW6-A Create-Entry / Product-Owner-Option 1.
//
// Nur Darstellung und Fail-fast vor teuren Create-Schritten. Der Gastspeicher
// (ADR-0013 / ADR-0042), Guest→Account und der SQL-Default `balanced` bleiben
// unverändert. Dieses Modul erfindet keinen Startort und keine zweite Ablage.
//
// Progressive weitere Ziele / Stage-Create sind nicht Teil dieses Schnitts.

import type { Sitzungsstand } from '@/lib/auth/oeffentliche-navigation'
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

/** Search-Params, die /planen zu einem ziel- oder ideenspezifischen Handoff machen. */
const PLANEN_HANDOFF_PARAMS = ['zielId', 'ziel', 'idee'] as const

export type GastCreateGate =
  | { erlaubt: true }
  | { erlaubt: false; bestehendeId: string }

/**
 * Ob ein Create-Versuch weiterlaufen darf, bevor ein Modell- oder
 * Ortsbestätigungsaufruf Geld oder Netz kostet.
 *
 * Konten dürfen mehrere Reisen anlegen. Gäste mit aktiver Reise nicht.
 * Derselbe Gate gilt erneut unmittelbar vor einem späteren Übernehmen.
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

/**
 * Erneute Prüfung unmittelbar vor Ortsauflösung, Modell oder Persistenz.
 * Der Slot kann sich in einem anderen Tab inzwischen belegt haben.
 */
export function gastCreateVorNetzschritt(eingabe: {
  angemeldet: boolean
  aktiveReiseId?: string | null
}): GastCreateGate {
  return gastCreateGate(eingabe)
}

export type CreateEinstieg =
  | { art: 'fortsetzen'; href: string; label: 'Reise fortsetzen' }
  | { art: 'erstellen'; href: '/planen'; label: 'Reise erstellen' }

/** Primärer nächster Schritt für einen nachgewiesenen Gast. Kein zweiter Create. */
export function createEinstiegFuerGast(aktiv: { id: string } | null | undefined): CreateEinstieg {
  if (aktiv?.id) {
    return { art: 'fortsetzen', href: `/reisen/${aktiv.id}`, label: 'Reise fortsetzen' }
  }
  return { art: 'erstellen', href: '/planen', label: 'Reise erstellen' }
}

/**
 * Nur nacktes `/planen` ist ein generischer Create-CTA.
 * `zielId` / `ziel` / `idee` bleiben ein zielgerichteter Handoff – die
 * /planen-Gate fängt den zweiten Gast-Versuch dort ehrlich ab.
 */
export function istGenerischerCreateHref(href: string): boolean {
  try {
    const url = new URL(href, 'https://jetnity.invalid')
    if (url.pathname !== '/planen') return false
    return PLANEN_HANDOFF_PARAMS.every((name) => !url.searchParams.get(name)?.trim())
  } catch {
    return false
  }
}

export type GenericCreateZiel = {
  href: string
  labelErsetzen: boolean
}

/**
 * Generische Create-CTAs für einen nachgewiesenen Gast.
 *
 * `sitzung` ist Pflicht: `unbekannt` und `konto` dürfen liegengebliebenen
 * Guest-LocalStorage nicht als Gast-Wahrheit lesen. Zielspezifische Handoffs
 * werden nicht umgeschrieben, auch wenn eine Gastreise existiert.
 */
export function genericCreateHrefFuerGast(
  createHref: string,
  aktiv: { id: string } | null | undefined,
  sitzung: Sitzungsstand,
): GenericCreateZiel {
  if (sitzung !== 'gast' || !istGenerischerCreateHref(createHref)) {
    return { href: createHref, labelErsetzen: false }
  }
  const id = aktiv?.id?.trim()
  if (id) {
    return { href: `/reisen/${id}`, labelErsetzen: true }
  }
  return { href: createHref, labelErsetzen: false }
}

/** Einheitliche CTA-Semantik für Navbar, Footer, Homepage-Generika, 404 und /reisen. */
export function genericCreateCtaFuerSitzung(eingabe: {
  createHref: string
  createLabel: string
  sitzung: Sitzungsstand
  aktiv: { id: string } | null | undefined
}): { href: string; label: string; labelErsetzen: boolean } {
  const aktiv = eingabe.sitzung === 'gast' ? eingabe.aktiv : null
  const ziel = genericCreateHrefFuerGast(eingabe.createHref, aktiv, eingabe.sitzung)
  return {
    href: ziel.href,
    labelErsetzen: ziel.labelErsetzen,
    label: ziel.labelErsetzen ? 'Reise fortsetzen' : eingabe.createLabel,
  }
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
