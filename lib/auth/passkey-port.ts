// Injizierbarer Passkey-Port auf der offiziellen Supabase-Form.
// Die installierte Auth-JS 2.71.1 hat diese Methoden nicht. Der Port ruft
// sie nur, wenn das Laufzeitobjekt sie wirklich besitzt und das Gate offen ist.
// Kein eigener WebAuthn-Verifier, kein zweiter Speicher, kein AAL2-Schreiben.
// Tests ersetzen den Client durch Fakes. Das ist MOCK_PASS, kein Hosted-E2E.

import { istVerifizierterTotpFaktor, mfaFaktorenListeLesen } from '@/lib/auth/account-security-faktoren'
import { brauchtLoginTotpStepUp } from '@/lib/auth/mfa'
import {
  passkeyAnzeigename,
  passkeyHandlungErlaubt,
  passkeyHandlungSperre,
  passkeyKontoBestaetigt,
  passkeyNameGueltig,
  type PasskeyHandlungEingabe,
  type PasskeySperrgrund,
} from '@/lib/auth/passkey-faehigkeit'

const PASSKEY_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type PasskeyFehlerCode =
  | 'geschlossen'
  | 'abgebrochen'
  | 'challenge_abgelaufen'
  | 'bereits_vorhanden'
  | 'unbekanntes_credential'
  | 'server_aus'
  | 'origin'
  | 'sdk_fehlt'
  | 'konto_nicht_bestaetigt'
  | 'zu_viele'
  | 'name_ungueltig'
  | 'nicht_gelistet'
  | 'nicht_erlaubt'
  | 'aal_unbekannt'
  | 'netz'
  | 'pruefung'
  | 'unbekannt'

export type PasskeyEintrag = {
  id: string
  anzeigename: string
  erstelltAm: string | null
}

export type PasskeyAuthFehler = {
  message?: string
  code?: string
  name?: string
  status?: number
}

export type PasskeyAuthAntwort<T> = {
  data: T
  error: PasskeyAuthFehler | null
}

export type PasskeyAuthSchnittstelle = {
  registerPasskey?: () => Promise<PasskeyAuthAntwort<{ id?: string; friendly_name?: string; created_at?: string } | null>>
  signInWithPasskey?: () => Promise<
    PasskeyAuthAntwort<{
      session?: unknown
      user?: unknown
    } | null>
  >
  getUser?: () => Promise<PasskeyAuthAntwort<{ user?: unknown } | null>>
  signInWithPassword?: (args: { email: string; password: string }) => Promise<PasskeyAuthAntwort<unknown>>
  signOut?: (args?: { scope?: 'local' | 'global' | 'others' }) => Promise<{ error: PasskeyAuthFehler | null }>
  mfa?: {
    listFactors?: () => Promise<PasskeyAuthAntwort<unknown>>
    challenge?: (args: { factorId: string }) => Promise<PasskeyAuthAntwort<{ id?: string; challenge_id?: string } | null>>
    verify?: (args: { factorId: string; challengeId: string; code: string }) => Promise<{ error: PasskeyAuthFehler | null }>
    getAuthenticatorAssuranceLevel?: () => Promise<
      PasskeyAuthAntwort<{ currentLevel?: string | null; nextLevel?: string | null } | null>
    >
  }
  passkey?: {
    list?: () => Promise<PasskeyAuthAntwort<unknown[] | null>>
    update?: (args: { passkeyId: string; friendlyName: string }) => Promise<PasskeyAuthAntwort<unknown>>
    delete?: (args: { passkeyId: string }) => Promise<PasskeyAuthAntwort<unknown>>
  }
}

export type PasskeyAnmeldungErgebnis =
  | { art: 'geschlossen'; grund: PasskeySperrgrund }
  | { art: 'fehler'; code: PasskeyFehlerCode }
  | { art: 'totp_step_up' }
  | { art: 'weiter' }

export type PasskeyListeErgebnis =
  | { art: 'geschlossen'; grund: PasskeySperrgrund }
  | { art: 'fehler'; code: PasskeyFehlerCode }
  | { art: 'leer' }
  | { art: 'liste'; eintraege: PasskeyEintrag[] }

export type PasskeySchreibErgebnis =
  | { ok: true }
  | { ok: false; code: PasskeyFehlerCode }

/** Frischer Nachweis am Schreibzugang. Eine bestehende Sitzung oder getUser() ist keiner. */
export type PasskeySchreibBeweis =
  | { art: 'totp'; factorId: string; challengeId: string; code: string }
  | { art: 'passwort'; passwort: string }

function alsSchnittstelle(auth: unknown): PasskeyAuthSchnittstelle {
  if (!auth || typeof auth !== 'object') return {}
  return auth as PasskeyAuthSchnittstelle
}

export function passkeyFehlerCode(fehler: unknown): PasskeyFehlerCode {
  const objekt = fehler && typeof fehler === 'object' ? (fehler as PasskeyAuthFehler) : null
  const name = typeof objekt?.name === 'string' ? objekt.name : ''
  const code = typeof objekt?.code === 'string' ? objekt.code.toLowerCase() : ''
  const meldung = typeof objekt?.message === 'string' ? objekt.message.toLowerCase() : ''
  const status = typeof objekt?.status === 'number' ? objekt.status : null

  if (status === 0 || code.includes('network') || meldung.includes('failed to fetch') || meldung.includes('networkerror')) {
    return 'netz'
  }
  if (name === 'NotAllowedError' || name === 'AbortError' || code === 'user_cancelled' || meldung.includes('cancel') || meldung.includes('abgebrochen')) {
    return 'abgebrochen'
  }
  if (code === 'passkey_disabled' || meldung.includes('passkey_disabled')) return 'server_aus'
  if (
    code === 'webauthn_challenge_expired' ||
    code === 'webauthn_challenge_not_found' ||
    (meldung.includes('challenge') && meldung.includes('expir'))
  ) {
    return 'challenge_abgelaufen'
  }
  if (code === 'webauthn_credential_exists') return 'bereits_vorhanden'
  if (code === 'webauthn_credential_not_found') return 'unbekanntes_credential'
  if (code === 'too_many_passkeys') return 'zu_viele'
  if (code === 'email_not_confirmed' || code === 'phone_not_confirmed') return 'konto_nicht_bestaetigt'
  if (code === 'user_banned') return 'nicht_erlaubt'
  if (name === 'SecurityError' || code.includes('origin') || meldung.includes('relying party')) return 'origin'
  if (code === 'webauthn_verification_failed') return 'pruefung'
  if (code === 'passkey_method_missing') return 'sdk_fehlt'
  return 'unbekannt'
}

function passkeyEintragLesen(roh: unknown): PasskeyEintrag | null {
  if (!roh || typeof roh !== 'object') return null
  const id = (roh as { id?: unknown }).id
  if (typeof id !== 'string' || !PASSKEY_ID.test(id)) return null
  const erstellt = (roh as { created_at?: unknown }).created_at
  const erstelltAm = typeof erstellt === 'string' && /^\d{4}-\d{2}-\d{2}/.test(erstellt) ? erstellt.slice(0, 10) : null
  return {
    id,
    anzeigename: passkeyAnzeigename((roh as { friendly_name?: unknown }).friendly_name),
    erstelltAm,
  }
}

function geschlossen(gate: PasskeyHandlungEingabe): { art: 'geschlossen'; grund: PasskeySperrgrund } {
  return { art: 'geschlossen', grund: passkeyHandlungSperre(gate) ?? 'server_aus' }
}

export async function passkeyAuflisten(auth: unknown, gate: PasskeyHandlungEingabe): Promise<PasskeyListeErgebnis> {
  if (!passkeyHandlungErlaubt(gate)) return geschlossen(gate)
  const liste = alsSchnittstelle(auth).passkey?.list
  if (typeof liste !== 'function') return { art: 'fehler', code: 'sdk_fehlt' }
  try {
    const antwort = await liste()
    if (antwort.error) return { art: 'fehler', code: passkeyFehlerCode(antwort.error) }
    if (!Array.isArray(antwort.data)) return { art: 'fehler', code: 'unbekannt' }
    const eintraege: PasskeyEintrag[] = []
    for (const roh of antwort.data) {
      const eintrag = passkeyEintragLesen(roh)
      if (!eintrag) return { art: 'fehler', code: 'unbekannt' }
      eintraege.push(eintrag)
    }
    if (eintraege.length === 0) return { art: 'leer' }
    return { art: 'liste', eintraege }
  } catch (fehler) {
    return { art: 'fehler', code: passkeyFehlerCode(fehler) }
  }
}

function kontoEmail(user: unknown): string | null {
  if (!user || typeof user !== 'object') return null
  const email = (user as { email?: unknown }).email
  return typeof email === 'string' && email.includes('@') ? email : null
}

async function verifizierteTotpIds(client: PasskeyAuthSchnittstelle): Promise<string[] | PasskeyFehlerCode> {
  if (typeof client.mfa?.listFactors !== 'function') return 'nicht_erlaubt'
  const liste = await client.mfa.listFactors()
  if (liste.error) return 'nicht_erlaubt'
  const lesung = mfaFaktorenListeLesen(liste.data)
  if (lesung.status !== 'ok') return 'nicht_erlaubt'
  return lesung.liste.filter(istVerifizierterTotpFaktor).map((faktor) => faktor.id)
}

/**
 * Der Schreibzugang prüft den Nachweis selbst. getUser() und eine
 * UI-Bestätigung reichen nicht. Bei vorhandenem TOTP ist nur ein gerade
 * verifizierter AAL2-Schritt zulässig, sonst ein frisches Passwort.
 */
async function passkeySchreibBeweisPruefen(
  auth: unknown,
  beweis: PasskeySchreibBeweis | null,
): Promise<PasskeyFehlerCode | null> {
  if (!beweis) return 'nicht_erlaubt'
  const client = alsSchnittstelle(auth)
  try {
    const totpIds = await verifizierteTotpIds(client)
    if (typeof totpIds === 'string') return totpIds
    if (totpIds.length > 0) {
      if (beweis.art !== 'totp') return 'nicht_erlaubt'
      if (!totpIds.includes(beweis.factorId) || beweis.challengeId.trim().length < 8) return 'nicht_erlaubt'
      if (!/^\d{6}$/.test(beweis.code)) return 'nicht_erlaubt'
      if (typeof client.mfa?.verify !== 'function' || typeof client.mfa.getAuthenticatorAssuranceLevel !== 'function') {
        return 'nicht_erlaubt'
      }
      const verifiziert = await client.mfa.verify({
        factorId: beweis.factorId,
        challengeId: beweis.challengeId,
        code: beweis.code,
      })
      if (verifiziert.error) return 'nicht_erlaubt'
      const aal = await client.mfa.getAuthenticatorAssuranceLevel()
      if (aal.error || aal.data?.currentLevel !== 'aal2') return 'nicht_erlaubt'
      return null
    }
    if (beweis.art !== 'passwort' || beweis.passwort.length < 1) return 'nicht_erlaubt'
    if (typeof client.getUser !== 'function' || typeof client.signInWithPassword !== 'function') return 'nicht_erlaubt'
    const nutzer = await client.getUser()
    const email = kontoEmail(nutzer.data?.user)
    if (nutzer.error || !email) return 'nicht_erlaubt'
    const login = await client.signInWithPassword({ email, password: beweis.passwort })
    if (login.error) return 'nicht_erlaubt'
    return null
  } catch {
    return 'nicht_erlaubt'
  }
}

export async function passkeyRegistrieren(
  auth: unknown,
  gate: PasskeyHandlungEingabe,
  beweis: PasskeySchreibBeweis | null,
): Promise<PasskeySchreibErgebnis> {
  if (!passkeyHandlungErlaubt(gate)) return { ok: false, code: 'geschlossen' }
  const client = alsSchnittstelle(auth)
  if (typeof client.getUser !== 'function' || typeof client.registerPasskey !== 'function') {
    return { ok: false, code: 'sdk_fehlt' }
  }
  const nachweis = await passkeySchreibBeweisPruefen(auth, beweis)
  if (nachweis) return { ok: false, code: nachweis }
  try {
    const nutzer = await client.getUser()
    if (nutzer.error || !passkeyKontoBestaetigt(nutzer.data?.user)) {
      return { ok: false, code: 'konto_nicht_bestaetigt' }
    }
    const antwort = await client.registerPasskey()
    if (antwort.error) return { ok: false, code: passkeyFehlerCode(antwort.error) }
    if (!passkeyEintragLesen(antwort.data)) return { ok: false, code: 'unbekannt' }
    return { ok: true }
  } catch (fehler) {
    return { ok: false, code: passkeyFehlerCode(fehler) }
  }
}

export async function passkeyUmbenennen(
  auth: unknown,
  gate: PasskeyHandlungEingabe,
  eingabe: { id: string; name: string; gelisteteIds: readonly string[]; beweis: PasskeySchreibBeweis | null },
): Promise<PasskeySchreibErgebnis> {
  if (!passkeyHandlungErlaubt(gate)) return { ok: false, code: 'geschlossen' }
  const nachweis = await passkeySchreibBeweisPruefen(auth, eingabe.beweis)
  if (nachweis) return { ok: false, code: nachweis }
  if (!PASSKEY_ID.test(eingabe.id) || !eingabe.gelisteteIds.includes(eingabe.id)) {
    return { ok: false, code: 'nicht_gelistet' }
  }
  if (!passkeyNameGueltig(eingabe.name)) return { ok: false, code: 'name_ungueltig' }
  const update = alsSchnittstelle(auth).passkey?.update
  if (typeof update !== 'function') return { ok: false, code: 'sdk_fehlt' }
  try {
    const antwort = await update({ passkeyId: eingabe.id, friendlyName: eingabe.name.trim() })
    if (antwort.error) return { ok: false, code: passkeyFehlerCode(antwort.error) }
    return { ok: true }
  } catch (fehler) {
    return { ok: false, code: passkeyFehlerCode(fehler) }
  }
}

export async function passkeyEntfernen(
  auth: unknown,
  gate: PasskeyHandlungEingabe,
  eingabe: { id: string; gelisteteIds: readonly string[]; beweis: PasskeySchreibBeweis | null },
): Promise<PasskeySchreibErgebnis> {
  if (!passkeyHandlungErlaubt(gate)) return { ok: false, code: 'geschlossen' }
  const nachweis = await passkeySchreibBeweisPruefen(auth, eingabe.beweis)
  if (nachweis) return { ok: false, code: nachweis }
  if (!PASSKEY_ID.test(eingabe.id) || !eingabe.gelisteteIds.includes(eingabe.id)) {
    return { ok: false, code: 'nicht_gelistet' }
  }
  const entfernen = alsSchnittstelle(auth).passkey?.delete
  if (typeof entfernen !== 'function') return { ok: false, code: 'sdk_fehlt' }
  try {
    const antwort = await entfernen({ passkeyId: eingabe.id })
    if (antwort.error) return { ok: false, code: passkeyFehlerCode(antwort.error) }
    return { ok: true }
  } catch (fehler) {
    return { ok: false, code: passkeyFehlerCode(fehler) }
  }
}

/**
 * Offizielles signInWithPasskey ohne eigene Authenticator-Auswahl.
 * Danach gilt dieselbe TOTP-Regel wie nach dem Passwort-Login.
 * Ein Passkey schreibt currentLevel nie auf aal2.
 */
export async function passkeyAnmeldungAusfuehren(
  auth: unknown,
  gate: PasskeyHandlungEingabe,
): Promise<PasskeyAnmeldungErgebnis> {
  if (!passkeyHandlungErlaubt(gate)) return geschlossen(gate)
  const client = alsSchnittstelle(auth)
  if (typeof client.signInWithPasskey !== 'function') return { art: 'fehler', code: 'sdk_fehlt' }
  try {
    const antwort = await client.signInWithPasskey()
    if (antwort.error) {
      await passkeySitzungBeenden(client)
      return { art: 'fehler', code: passkeyFehlerCode(antwort.error) }
    }
    if (!antwort.data?.session || !antwort.data.user) {
      await passkeySitzungBeenden(client)
      return { art: 'fehler', code: 'unbekannt' }
    }
    const aalLesen = client.mfa?.getAuthenticatorAssuranceLevel
    if (typeof aalLesen !== 'function') {
      await passkeySitzungBeenden(client)
      return { art: 'fehler', code: 'aal_unbekannt' }
    }
    const aal = await aalLesen()
    if (aal.error || !aal.data) {
      await passkeySitzungBeenden(client)
      return { art: 'fehler', code: 'aal_unbekannt' }
    }
    if (brauchtLoginTotpStepUp(aal.data)) return { art: 'totp_step_up' }
    return { art: 'weiter' }
  } catch (fehler) {
    await passkeySitzungBeenden(alsSchnittstelle(auth))
    return { art: 'fehler', code: passkeyFehlerCode(fehler) }
  }
}

/** Beendet die gerade entstandene AAL1-Sitzung auf diesem Gerät. */
export async function passkeySitzungBeenden(auth: unknown): Promise<void> {
  const client = alsSchnittstelle(auth)
  if (typeof client.signOut !== 'function') return
  try {
    await client.signOut({ scope: 'local' })
  } catch {
    // Der Aufrufer darf danach trotzdem nicht weiterleiten.
  }
}
