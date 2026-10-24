// components/trips/gast-reise-lesezustand.ts
//
// Readonly reconciliation for the guest list and the first workspace read.
//
// The compatible loader still returns an empty active trip for unreadable,
// invalid, and genuinely absent storage. This module reads the existing
// create occupancy first. A failed occupancy stops there: the loader can
// migrate if storage changes before its own preflight, and that write cannot
// be undone. Absence, a valid draft, and a legacy draft still load once.
// A mismatch stays recoverable. It does not delete, reset, adopt, or invent an id.

import {
  gastCreateBelegungLesen,
  type GastCreateBelegung,
} from '@/lib/trips/create-entry'
import {
  SCHLUESSEL,
  gastspeicherLaden,
  type Gastspeicher,
} from '@/lib/trips/gastspeicher'
import type { Trip } from '@/types/trips'

export type GastListeLesung =
  | { art: 'nicht_beobachtet' }
  | { art: 'speicher_unlesbar'; schrieb: false }
  | { art: 'ungueltig'; warteschlange: Trip[]; schrieb: false }
  | { art: 'abweichend'; schrieb: boolean }
  | { art: 'belegt_ohne_kennung'; schrieb: false }
  | { art: 'fehlend'; schrieb: boolean }
  | { art: 'nur_warteschlange'; warteschlange: Trip[]; schrieb: boolean }
  | { art: 'gueltig'; reise: Trip; warteschlange: Trip[]; schrieb: boolean }

export type GastArbeitsbereichLesung =
  | { art: 'nicht_beobachtet' }
  | { art: 'speicher_unlesbar' }
  | { art: 'ungueltig'; warteschlange: Trip[] }
  | { art: 'abweichend' }
  | { art: 'belegt_ohne_kennung' }
  | { art: 'fehlend' }
  | { art: 'andere_reise'; id: string; titel: string }
  | { art: 'passend'; reise: Trip }

type Roh = {
  aktiv: string | null
  warteschlange: string | null
  legacy: string | null
}

function rohSchnappschuss(): { ok: true; werte: Roh } | { ok: false } {
  try {
    if (typeof window === 'undefined') return { ok: false }
    const speicher = window.localStorage
    if (!speicher || typeof speicher.getItem !== 'function') return { ok: false }
    return {
      ok: true,
      werte: {
        aktiv: speicher.getItem(SCHLUESSEL.aktiv),
        warteschlange: speicher.getItem(SCHLUESSEL.warteschlange),
        legacy: speicher.getItem(SCHLUESSEL.legacy),
      },
    }
  } catch {
    return { ok: false }
  }
}

function gleich(links: Roh, rechts: Roh): boolean {
  return (
    links.aktiv === rechts.aktiv &&
    links.warteschlange === rechts.warteschlange &&
    links.legacy === rechts.legacy
  )
}

/** Create is only honest once the active slot is confirmed empty. */
export function gastListeDarfErstellen(liste: GastListeLesung): boolean {
  return liste.art === 'fehlend' || liste.art === 'nur_warteschlange'
}

/** The workspace offers create only when this device has no active draft. */
export function gastArbeitsbereichDarfErstellen(lese: GastArbeitsbereichLesung): boolean {
  return lese.art === 'fehlend'
}

/**
 * Pure join of one pre-load occupancy, one loader result, and one post-load
 * occupancy. `schrieb` reports whether the loader changed the three known keys.
 */
export function gastListeAusBeobachtung(
  belegt: GastCreateBelegung,
  ladung: Gastspeicher,
  danach: GastCreateBelegung,
  schrieb: boolean,
): GastListeLesung {
  if (belegt.art === 'nicht_beobachtet' || danach.art === 'nicht_beobachtet') {
    return { art: 'nicht_beobachtet' }
  }

  const aktiv = ladung.aktiv
  const warteschlange = ladung.warteschlange

  if (danach.art === 'gueltig' && aktiv && aktiv.id === danach.id) {
    return { art: 'gueltig', reise: aktiv, warteschlange, schrieb }
  }

  if (danach.art === 'speicher_unlesbar') {
    return { art: 'speicher_unlesbar', schrieb: false }
  }

  if (belegt.art === 'speicher_unlesbar') {
    if (danach.art === 'fehlend' && !aktiv && warteschlange.length === 0) {
      return { art: 'fehlend', schrieb }
    }
    if (danach.art === 'fehlend' && !aktiv && warteschlange.length > 0) {
      return { art: 'nur_warteschlange', warteschlange, schrieb }
    }
    return { art: 'abweichend', schrieb }
  }

  if (danach.art === 'ungueltig') {
    if (aktiv) return { art: 'abweichend', schrieb }
    return { art: 'ungueltig', warteschlange, schrieb: false }
  }

  if (belegt.art === 'ungueltig') {
    return { art: 'abweichend', schrieb }
  }

  if (danach.art === 'belegt_ohne_kennung') {
    return { art: 'belegt_ohne_kennung', schrieb: false }
  }

  if (belegt.art === 'belegt_ohne_kennung') {
    return { art: 'abweichend', schrieb }
  }

  if (danach.art === 'gueltig' || belegt.art === 'gueltig') {
    return { art: 'abweichend', schrieb }
  }

  if (!aktiv && warteschlange.length > 0) {
    return { art: 'nur_warteschlange', warteschlange, schrieb }
  }

  if (!aktiv) return { art: 'fehlend', schrieb }

  return { art: 'abweichend', schrieb }
}

/**
 * Fresh list observation.
 *
 * Invalid and unreadable occupancy does not enter `gastspeicherLaden()`.
 * That loader migrates legacy drafts, and a later disagreement cannot undo
 * a write if the key changes between the two reads. No readonly contract
 * returns the queue without that loader, so an invalid draft does not list
 * a queue. A confirmed-empty active slot still loads, which is the ordinary
 * queue and legacy path.
 */
export function gastListeBeobachten(): GastListeLesung {
  const belegt = gastCreateBelegungLesen()
  if (belegt.art === 'nicht_beobachtet') return { art: 'nicht_beobachtet' }
  if (belegt.art === 'speicher_unlesbar') return { art: 'speicher_unlesbar', schrieb: false }
  if (belegt.art === 'ungueltig') return { art: 'ungueltig', warteschlange: [], schrieb: false }

  const davor = rohSchnappschuss()
  let ladung: Gastspeicher
  try {
    ladung = gastspeicherLaden()
  } catch {
    return { art: 'speicher_unlesbar', schrieb: false }
  }
  const nachher = rohSchnappschuss()
  const danach = gastCreateBelegungLesen()
  if (!davor.ok || !nachher.ok) {
    if (danach.art === 'speicher_unlesbar') return { art: 'speicher_unlesbar', schrieb: false }
    return { art: 'abweichend', schrieb: false }
  }

  const schrieb = !gleich(davor.werte, nachher.werte)
  return gastListeAusBeobachtung(belegt, ladung, danach, schrieb)
}

export function gastArbeitsbereichAusListe(
  tripId: string,
  liste: GastListeLesung,
): GastArbeitsbereichLesung {
  switch (liste.art) {
    case 'nicht_beobachtet':
      return { art: 'nicht_beobachtet' }
    case 'speicher_unlesbar':
      return { art: 'speicher_unlesbar' }
    case 'ungueltig':
      return { art: 'ungueltig', warteschlange: liste.warteschlange }
    case 'abweichend':
      return { art: 'abweichend' }
    case 'belegt_ohne_kennung':
      return { art: 'belegt_ohne_kennung' }
    case 'fehlend':
    case 'nur_warteschlange':
      return { art: 'fehlend' }
    case 'gueltig':
      if (liste.reise.id === tripId) return { art: 'passend', reise: liste.reise }
      return {
        art: 'andere_reise',
        id: liste.reise.id,
        titel: liste.reise.title.trim(),
      }
  }
}

/** Fresh workspace observation for one requested id. Does not substitute another trip. */
export function gastArbeitsbereichBeobachten(tripId: string): GastArbeitsbereichLesung {
  return gastArbeitsbereichAusListe(tripId, gastListeBeobachten())
}
