// Fail-closed Passkey-Freigabe. Browser-WebAuthn, eine Vorschau-Origin
// und eine zu alte SDK-Version machen die Server-Sperre nicht rückgängig.
// Geplante RP-ID bleibt jetnity.com. Keine Config wird hier geschrieben.

export const PASSKEY_RP_ID_GEPLANT = 'jetnity.com'

export type PasskeySperrgrund =
  | 'server_aus'
  | 'sdk_fehlt'
  | 'browser_fehlt'
  | 'browser_unbekannt'
  | 'origin_passt_nicht'
  | 'origin_unbekannt'

export type PasskeyHandlungEingabe = {
  serverAktiviert: boolean
  sdkVorhanden: boolean
  browserWebAuthn: boolean | null
  origin: string | null
}

const PASSKEY_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function passkeySdkVorhanden(auth: unknown): boolean {
  if (!auth || typeof auth !== 'object') return false
  const client = auth as {
    registerPasskey?: unknown
    signInWithPasskey?: unknown
    passkey?: { list?: unknown; update?: unknown; delete?: unknown } | null
  }
  return (
    typeof client.registerPasskey === 'function' &&
    typeof client.signInWithPasskey === 'function' &&
    typeof client.passkey?.list === 'function' &&
    typeof client.passkey?.update === 'function' &&
    typeof client.passkey?.delete === 'function'
  )
}

/**
 * Eine Origin darf nur dann einen Passkey anbieten, wenn sie HTTPS ist und
 * ihr Hostname die geplante RP-ID oder eine Subdomain davon ist.
 * localhost und *.vercel.app erfüllen jetnity.com nicht.
 */
export function passkeyOriginErlaubt(origin: string | null, rpId = PASSKEY_RP_ID_GEPLANT): boolean {
  if (!origin || !rpId || rpId.includes('/') || rpId.includes(':')) return false
  let url: URL
  try {
    url = new URL(origin)
  } catch {
    return false
  }
  if (url.protocol !== 'https:') return false
  if (url.username || url.password) return false
  const host = url.hostname.toLowerCase()
  const erwartet = rpId.toLowerCase()
  if (host === erwartet) return true
  return host.endsWith(`.${erwartet}`) && host.length > erwartet.length + 1
}

export function passkeyHandlungSperre(eingabe: PasskeyHandlungEingabe): PasskeySperrgrund | null {
  if (eingabe.serverAktiviert !== true) return 'server_aus'
  if (eingabe.sdkVorhanden !== true) return 'sdk_fehlt'
  if (eingabe.browserWebAuthn !== true) {
    return eingabe.browserWebAuthn === false ? 'browser_fehlt' : 'browser_unbekannt'
  }
  if (!passkeyOriginErlaubt(eingabe.origin)) {
    return eingabe.origin ? 'origin_passt_nicht' : 'origin_unbekannt'
  }
  return null
}

export function passkeyHandlungErlaubt(eingabe: PasskeyHandlungEingabe): boolean {
  return passkeyHandlungSperre(eingabe) === null
}

export function passkeyKontoBestaetigt(user: unknown): boolean {
  if (!user || typeof user !== 'object') return false
  const konto = user as {
    is_anonymous?: unknown
    email_confirmed_at?: unknown
    phone_confirmed_at?: unknown
    confirmed_at?: unknown
  }
  if (konto.is_anonymous === true) return false
  return [konto.email_confirmed_at, konto.phone_confirmed_at, konto.confirmed_at].some(
    (wert) => typeof wert === 'string' && wert.trim().length > 0,
  )
}

export function passkeyNameGueltig(name: string): boolean {
  const text = name.normalize('NFKC').trim().replace(/[\u0000-\u001F\u007F]/g, '')
  if (text !== name.trim()) return false
  if (text.length < 1 || text.length > 120) return false
  if (text.includes('@')) return false
  if (PASSKEY_ID.test(text)) return false
  return true
}

export function passkeyAnzeigename(name: unknown): string {
  if (typeof name !== 'string' || !passkeyNameGueltig(name)) return 'Passkey'
  return name.trim()
}
