import { uiSpracheLesen, type UiSprache } from '@/lib/localization/ui-sprache'

export type UiEinstellungenLesen =
  | { status: 'bereit'; benutzerId: string; sprache: UiSprache; gespeichert: boolean }
  | { status: 'nicht_angemeldet' | 'nicht_verfuegbar' }

export type UiEinstellungenSpeichernErgebnis =
  | { ok: true; benutzerId: string; sprache: UiSprache }
  | {
      ok: false
      code:
        | 'eingabe'
        | 'nicht_angemeldet'
        | 'nicht_verfuegbar'
        | 'konto_gewechselt'
        | 'nicht_bestaetigt'
        | 'abgelehnt'
    }

export type UiEinstellungenSpeichernEingabe = {
  sprache: UiSprache
  /** Comparison with the current session only; never selects a write target. */
  erwarteteBenutzerId: string
}

export function uiBenutzerIdLesen(wert: unknown): string | null {
  if (typeof wert !== 'string' || wert.length === 0 || wert.length > 128) return null
  if (wert !== wert.trim() || /[\u0000-\u001f\u007f]/.test(wert)) return null
  return wert
}

/** A new bounded value is captured before the first asynchronous operation. */
export function uiEinstellungenEingabeLesen(wert: unknown): UiEinstellungenSpeichernEingabe | null {
  try {
    if (!wert || typeof wert !== 'object' || Array.isArray(wert)) return null
    const prototyp = Object.getPrototypeOf(wert)
    if (prototyp !== Object.prototype && prototyp !== null) return null
    const schluessel = Reflect.ownKeys(wert)
    if (schluessel.length !== 2 || !schluessel.includes('sprache') || !schluessel.includes('erwarteteBenutzerId')) {
      return null
    }
    const sprachFeld = Object.getOwnPropertyDescriptor(wert, 'sprache')
    const kontoFeld = Object.getOwnPropertyDescriptor(wert, 'erwarteteBenutzerId')
    if (!sprachFeld || !('value' in sprachFeld) || !kontoFeld || !('value' in kontoFeld)) return null
    const sprache = uiSpracheLesen(sprachFeld.value)
    const erwarteteBenutzerId = uiBenutzerIdLesen(kontoFeld.value)
    if (!sprache || !erwarteteBenutzerId) return null
    return { sprache, erwarteteBenutzerId }
  } catch {
    return null
  }
}
