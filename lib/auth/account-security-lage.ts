// lib/auth/account-security-lage.ts
//
// AP-5-S1: ehrliche Security-Zustände. Browser-WebAuthn darf Server-Truth
// niemals überschreiben. Faktor-IDs sind keine Geräteidentität.

import { tomlWert, type TomlTabelle } from '@/lib/supabase/config-toml'

export type SecurityLage = 'empty' | 'unsupported' | 'unavailable' | 'error' | 'ready' | 'loading'

export type TotpListeLage = Exclude<SecurityLage, 'unavailable'>

export type PasskeyLage = 'unsupported' | 'unavailable' | 'empty'

const UUID_ARTIG = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Fail-closed: Passkeys sind nur unterstützt, wenn `auth.passkey.enabled`
 * in der gelesenen `config.toml` ausdrücklich `true` ist.
 */
export function passkeysServerAktiviertAusToml(config: TomlTabelle): boolean {
  return tomlWert(config, 'auth.passkey.enabled') === true
}

export function totpListeLage(eingabe: {
  listFactorsVorhanden: boolean
  laden: boolean
  fehler: boolean
  anzahl: number
}): TotpListeLage {
  if (!eingabe.listFactorsVorhanden) return 'unsupported'
  if (eingabe.laden) return 'loading'
  if (eingabe.fehler) return 'error'
  if (eingabe.anzahl === 0) return 'empty'
  return 'ready'
}

/**
 * Server-/Config-Authority zuerst. Ein vorhandenes Browser-WebAuthn macht
 * deaktivierte Passkeys nicht live und nicht „nur noch auf den Browser wartend“.
 */
export function passkeyLage(eingabe: {
  serverAktiviert: boolean
  browserWebAuthn: boolean | null
}): PasskeyLage {
  if (!eingabe.serverAktiviert) return 'unsupported'
  if (eingabe.browserWebAuthn !== true) return 'unavailable'
  return 'empty'
}

export function totpFaktorAnzeigename(freundlicherName?: string | null): string {
  const name = freundlicherName?.trim() ?? ''
  if (!name || UUID_ARTIG.test(name) || name.length > 80) return 'Authenticator-App'
  return name
}

export function totpFaktorStatusText(status?: string | null): string | null {
  if (status === 'verified') return 'bestätigt'
  if (status === 'unverified') return 'Einrichtung nicht abgeschlossen'
  return null
}

export const TOTP_LAGE_TEXTE: Record<TotpListeLage, string> = {
  loading: 'Zweite Faktoren werden geladen.',
  empty: 'Noch keine Authenticator-App eingerichtet.',
  unsupported:
    'Die Liste der zweiten Faktoren kann in dieser Umgebung nicht gelesen werden. Das heisst nicht, dass keine Faktoren vorhanden sind.',
  error: 'Die zweiten Faktoren konnten gerade nicht geladen werden. Ob welche eingerichtet sind, ist deshalb unbekannt.',
  ready: 'Eingerichtete Authenticator-Apps.',
}

export const PASSKEY_LAGE_TEXTE: Record<PasskeyLage, string> = {
  unsupported:
    'Passkeys sind in der Jetnity-Anmeldung derzeit nicht unterstützt. Das gilt unabhängig davon, ob dieser Browser Face ID, Touch ID oder einen Sicherheitsschlüssel anbietet.',
  unavailable: 'Dieser Browser bietet keine Passkey-Anmeldung an.',
  empty: 'Noch kein Passkey eingerichtet.',
}

/**
 * Sekundärer Hinweis. Ändert die Lage niemals von unsupported weg.
 */
export function passkeyBrowserHinweis(eingabe: {
  lage: PasskeyLage
  browserWebAuthn: boolean | null
}): string | null {
  if (eingabe.lage !== 'unsupported') return null
  if (eingabe.browserWebAuthn !== true) return null
  return 'Dieser Browser könnte Passkeys technisch anbieten. Die Server-Konfiguration lässt das trotzdem nicht zu.'
}

export function darfTotpEinrichten(lage: TotpListeLage): boolean {
  return lage === 'empty' || lage === 'ready'
}

export function darfPasskeyHinzufuegen(lage: PasskeyLage): boolean {
  return lage === 'empty'
}
