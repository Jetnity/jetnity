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
import {
  aktiveGastreiseKennungLesen,
  aktiveGastreiseVorpruefen,
  GastreiseBestehtFehler,
  GastreiseUnbrauchbarFehler,
  GastspeicherUnlesbarFehler,
  type AktiveGastreiseVorpruefung,
} from '@/lib/trips/gastspeicher'
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

export type GastCreateBelegung =
  | { art: 'nicht_beobachtet' }
  | { art: 'speicher_unlesbar' }
  | { art: 'ungueltig' }
  | { art: 'gueltig'; id: string }
  | { art: 'fehlend' }

export type GastCreateGate =
  | { erlaubt: true }
  | { erlaubt: false; grund: 'besteht'; bestehendeId: string }
  | { erlaubt: false; grund: 'ungueltig' }
  | { erlaubt: false; grund: 'speicher_unlesbar' }
  | { erlaubt: false; grund: 'nicht_beobachtet' }

export const GAST_CREATE_ERHALTUNG_TEXTE = {
  wartetHaupt: 'Der Browserspeicher wird geprüft.',
  wartetNeben: 'Ob auf diesem Gerät ein Entwurf liegt, ist noch nicht bekannt.',
  ungueltigHaupt: 'Dieser Entwurf ist nicht lesbar.',
  unlesbarHaupt: 'Der Browserspeicher ist nicht lesbar.',
  erneut: 'Erneut prüfen',
} as const

/**
 * Frische Beobachtung des aktiven Gastschlüssels für Create-Wege.
 *
 * Ruft die vorhandene Vorprüfung auf. Kein Loader, keine Migration.
 * Ein gültiger Entwurf liefert nur die Kennung, nie erfundenen Inhalt.
 */
export function gastCreateBelegungLesen(): GastCreateBelegung {
  return gastCreateBelegungAusVorpruefung(aktiveGastreiseVorpruefen(), aktiveGastreiseKennungLesen())
}

export function gastCreateBelegungAusVorpruefung(
  vorpruefung: AktiveGastreiseVorpruefung,
  gueltigeId?: string | null,
): GastCreateBelegung {
  if (vorpruefung.art === 'nicht_im_browser') return { art: 'nicht_beobachtet' }
  if (vorpruefung.art === 'speicher_unlesbar') return { art: 'speicher_unlesbar' }
  if (vorpruefung.art === 'ungueltig') return { art: 'ungueltig' }
  if (vorpruefung.art === 'fehlend') return { art: 'fehlend' }
  const id = gueltigeId?.trim()
  if (id) return { art: 'gueltig', id }
  return { art: 'ungueltig' }
}

/**
 * Ob ein Create-Versuch weiterlaufen darf, bevor ein Modell- oder
 * Ortsbestätigungsaufruf Geld oder Netz kostet.
 *
 * Konten dürfen mehrere Reisen anlegen und lesen dafür keinen Gastspeicher.
 * Gäste brauchen eine frische Belegung oder – für ältere Aufrufer – eine
 * gültige Kennung. Ausbleibende Beobachtung ist kein freier Slot.
 */
export function gastCreateGate(eingabe: {
  angemeldet: boolean
  aktiveReiseId?: string | null
  belegung?: GastCreateBelegung
}): GastCreateGate {
  if (eingabe.angemeldet) return { erlaubt: true }
  if (eingabe.belegung) return gastCreateGateAusBelegung(eingabe.belegung)
  const id = eingabe.aktiveReiseId?.trim()
  if (id) return { erlaubt: false, grund: 'besteht', bestehendeId: id }
  return { erlaubt: true }
}

function gastCreateGateAusBelegung(belegung: GastCreateBelegung): GastCreateGate {
  if (belegung.art === 'nicht_beobachtet') return { erlaubt: false, grund: 'nicht_beobachtet' }
  if (belegung.art === 'speicher_unlesbar') return { erlaubt: false, grund: 'speicher_unlesbar' }
  if (belegung.art === 'ungueltig') return { erlaubt: false, grund: 'ungueltig' }
  if (belegung.art === 'gueltig') {
    return { erlaubt: false, grund: 'besteht', bestehendeId: belegung.id }
  }
  return { erlaubt: true }
}

export function darfCreateModellAufrufen(gate: GastCreateGate): boolean {
  return gate.erlaubt
}

export function gastCreateGateMeldung(gate: Extract<GastCreateGate, { erlaubt: false }>): string {
  if (gate.grund === 'besteht') return new GastreiseBestehtFehler(gate.bestehendeId).message
  if (gate.grund === 'ungueltig') return new GastreiseUnbrauchbarFehler().message
  if (gate.grund === 'speicher_unlesbar') return new GastspeicherUnlesbarFehler().message
  return (
    'Ob ein Entwurf vorhanden ist, konnte noch nicht geprüft werden. Es kann deshalb gerade ' +
    'keine neue Reise angelegt werden.'
  )
}

/**
 * Erneute Prüfung unmittelbar vor Ortsauflösung, Modell oder Persistenz.
 * Der Slot kann sich in einem anderen Tab inzwischen belegt haben.
 *
 * Ohne mitgegebene Belegung oder Kennung beobachtet der Gastweg den
 * Speicher frisch. Konten bleiben unabhängig vom Gastspeicher.
 */
export function gastCreateVorNetzschritt(eingabe: {
  angemeldet: boolean
  aktiveReiseId?: string | null
  belegung?: GastCreateBelegung
}): GastCreateGate {
  return gastCreateGate(eingabe)
}

/**
 * Action-time Create-Prüfung. Konten inspecten den Gastspeicher nicht.
 * Gäste lesen die aktiven Bytes jetzt, nicht den Stand vom ersten Render.
 */
export function gastCreateJetztPruefen(angemeldet: boolean): GastCreateGate {
  if (angemeldet) return { erlaubt: true }
  return gastCreateGate({
    angemeldet: false,
    belegung: gastCreateBelegungLesen(),
  })
}

export type PlanenCreateGateSicht =
  | { art: 'kinder' }
  | { art: 'warte' }
  | { art: 'ungueltig'; neben: string }
  | { art: 'unlesbar'; neben: string }
  | { art: 'besteht'; bestehendeId: string; titel: string | null; neben: string }

/**
 * Reine Sichtentscheidung für /planen. Kein Speicherzugriff.
 * Konten sehen immer das Formular. Gäste brauchen eine Beobachtung.
 */
export function planenCreateGateSicht(eingabe: {
  angemeldet: boolean
  beobachtet: boolean
  belegung: GastCreateBelegung | null
  aktivTitel?: string | null
}): PlanenCreateGateSicht {
  if (eingabe.angemeldet) return { art: 'kinder' }
  if (!eingabe.beobachtet || !eingabe.belegung) return { art: 'warte' }

  const gate = gastCreateGate({ angemeldet: false, belegung: eingabe.belegung })
  if (gate.erlaubt) return { art: 'kinder' }
  if (gate.grund === 'besteht') {
    return {
      art: 'besteht',
      bestehendeId: gate.bestehendeId,
      titel: eingabe.aktivTitel?.trim() || null,
      neben: new GastreiseBestehtFehler(gate.bestehendeId).message,
    }
  }
  if (gate.grund === 'ungueltig') {
    return { art: 'ungueltig', neben: gastCreateGateMeldung(gate) }
  }
  if (gate.grund === 'speicher_unlesbar') {
    return { art: 'unlesbar', neben: gastCreateGateMeldung(gate) }
  }
  return { art: 'warte' }
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
