// lib/account/kontoloeschung-zustand.ts
//
// Oberfläche der Kontolöschung. Sie sendet nur Bestätigung und Passwort.
// Die Berechtigung prüft die Edge Function.

import {
  KONTO_LOESCHEN_PHRASE,
  KONTO_LOESCHUNG_FUNKTION,
  identitaetsBeweis,
} from '@/lib/account/kontoloeschung'

export const KONTO_LOESCHUNG_TEXTE = {
  titel: 'Konto löschen',
  erklaerung:
    'Das Löschen ist endgültig. Dein Konto, deine Reisen, deine Reisenden und deine bestätigten Besuche werden dauerhaft entfernt. Es gibt keine Wiederherstellung und keine Frist, in der du das rückgängig machen kannst.',
  exportHinweis: 'Lade vorher deine Konto- und Reisedaten herunter, wenn du sie behalten willst.',
  phraseLabel: 'Tippe KONTO LÖSCHEN, um zu bestätigen.',
  passwortLabel: 'Aktuelles Passwort',
  totpLabel: 'Code aus der Authenticator-App',
  totpHinweis:
    'Für dieses Löschen ist eine aktuelle Zwei-Faktor-Bestätigung nötig. Das gilt nur für diesen Vorgang und schaltet keine allgemeine Zwei-Faktor-Pflicht ein.',
  oauth:
    'Dieses Konto kann hier nicht gelöscht werden, weil die Anmeldung nicht über ein Passwort geprüft werden kann.',
  unbekannt: 'Das Konto kann gerade nicht gelöscht werden. Es wurde nichts entfernt.',
  erfolg: 'Dein Konto wurde dauerhaft gelöscht.',
  bereits: 'Dieses Konto ist bereits gelöscht.',
  residual:
    'Dein Konto wurde entfernt. Verknüpfte Sicherheitsereignisse konnten nicht vollständig entfernt werden.',
  sitzung: 'Die lokale Sitzung wurde auf diesem Gerät beendet.',
} as const

const SAETZE: Record<string, string> = {
  nicht_angemeldet: 'Die Sitzung ist nicht mehr gültig. Bitte melde dich erneut an.',
  ziel_nicht_erlaubt: 'Das Konto wurde nicht gelöscht.',
  ungueltig: 'Das Konto wurde nicht gelöscht. Bitte prüfe die Eingabe.',
  bestaetigung_falsch: 'Die Bestätigung muss genau KONTO LÖSCHEN lauten.',
  passwort_fehlt: 'Bitte gib dein aktuelles Passwort ein.',
  passwort_falsch: 'Das Passwort stimmt nicht. Das Konto wurde nicht gelöscht.',
  identitaet_weicht_ab: 'Das Konto wurde nicht gelöscht.',
  nur_oauth: KONTO_LOESCHUNG_TEXTE.oauth,
  nicht_unterstuetzt: KONTO_LOESCHUNG_TEXTE.oauth,
  aal2_erforderlich: 'Zum Löschen ist eine aktuelle Zwei-Faktor-Bestätigung nötig. Das Konto wurde nicht gelöscht.',
  aal_unbekannt: 'Der Sicherheitsstand der Sitzung konnte nicht geprüft werden. Das Konto wurde nicht gelöscht.',
  faktoren_unlesbar: 'Die Zwei-Faktor-Anmeldung konnte nicht geprüft werden. Das Konto wurde nicht gelöscht.',
  speicher_blockiert: 'Das Konto wurde nicht gelöscht, weil noch Dateien daran hängen, die Jetnity nicht sicher entfernen kann.',
  speicher_unbekannt: 'Das Konto wurde nicht gelöscht, weil der Dateibesitz nicht sicher geprüft werden konnte.',
  loeschung_fehlgeschlagen: 'Das Konto wurde nicht gelöscht. Bitte versuche es später erneut.',
  nicht_verfuegbar: 'Das Löschen ist gerade nicht verfügbar. Das Konto wurde nicht entfernt.',
  methode: 'Das Konto wurde nicht gelöscht.',
  code_ungueltig: 'Bitte gib den 6-stelligen Code aus der Authenticator-App ein.',
  bestaetigung_fehlgeschlagen: 'Die Zwei-Faktor-Bestätigung ist fehlgeschlagen. Das Konto wurde nicht gelöscht.',
}

export function loeschungOberflaeche(input: {
  anbieter: readonly string[]
  email: string | null
  verifizierteTotp: number | null
  aal: 'aal1' | 'aal2' | null
}): {
  beweis: 'passwort' | 'nur_oauth' | 'nicht_unterstuetzt' | 'unbekannt'
  mfa: 'kein_faktor' | 'bereits_aal2' | 'step_up' | 'aal_unbekannt'
} {
  if (input.verifizierteTotp === null) {
    return { beweis: identitaetsBeweis(input.anbieter), mfa: 'aal_unbekannt' }
  }
  const beweis = input.email ? identitaetsBeweis(input.anbieter) : 'nicht_unterstuetzt'
  return {
    beweis,
    mfa: loeschungMfaPlan({ verifizierteTotp: input.verifizierteTotp, aal: input.aal }),
  }
}

export function loeschungMfaPlan(input: {
  verifizierteTotp: number
  aal: 'aal1' | 'aal2' | null
}): 'kein_faktor' | 'bereits_aal2' | 'step_up' | 'aal_unbekannt' {
  if (input.verifizierteTotp === 0) return 'kein_faktor'
  if (input.aal === 'aal2') return 'bereits_aal2'
  if (input.aal === 'aal1') return 'step_up'
  return 'aal_unbekannt'
}

export function loeschungKannAbsenden(input: {
  confirmation: string
  password: string
  beweis: 'passwort' | 'nur_oauth' | 'nicht_unterstuetzt' | 'unbekannt'
  mfa: 'kein_faktor' | 'bereits_aal2' | 'step_up' | 'aal_unbekannt'
  totpCode: string
  arbeitet: boolean
}): boolean {
  if (input.arbeitet) return false
  if (input.beweis !== 'passwort') return false
  if (input.mfa === 'aal_unbekannt') return false
  if (input.confirmation !== KONTO_LOESCHEN_PHRASE) return false
  if (input.password.length === 0) return false
  if (input.mfa === 'step_up' && !/^\d{6}$/.test(input.totpCode)) return false
  return true
}

export function loeschungAntwortLesen(
  status: number,
  body: unknown,
):
  | { art: 'geloescht' }
  | { art: 'residual' }
  | { art: 'nicht_gefunden' }
  | { art: 'abgelehnt'; code: string }
  | { art: 'unbekannt' } {
  if (body == null || typeof body !== 'object' || Array.isArray(body)) return { art: 'unbekannt' }
  const roh = body as Record<string, unknown>
  if (status === 200 && roh.status === 'deleted') return { art: 'geloescht' }
  if (status === 500 && roh.status === 'deleted_security_events_residual') return { art: 'residual' }
  if (status === 404 && roh.status === 'not_found') return { art: 'nicht_gefunden' }
  if (roh.status === 'rejected' && typeof roh.code === 'string') return { art: 'abgelehnt', code: roh.code }
  return { art: 'unbekannt' }
}

export function loeschungSatz(
  ergebnis:
    | { art: 'geloescht' }
    | { art: 'residual' }
    | { art: 'nicht_gefunden' }
    | { art: 'abgelehnt'; code: string }
    | { art: 'unbekannt' },
): string {
  if (ergebnis.art === 'geloescht') return KONTO_LOESCHUNG_TEXTE.erfolg
  if (ergebnis.art === 'residual') return KONTO_LOESCHUNG_TEXTE.residual
  if (ergebnis.art === 'nicht_gefunden') return KONTO_LOESCHUNG_TEXTE.bereits
  if (ergebnis.art === 'abgelehnt') return SAETZE[ergebnis.code] ?? KONTO_LOESCHUNG_TEXTE.unbekannt
  return KONTO_LOESCHUNG_TEXTE.unbekannt
}

export function zielNachLoeschung(art: 'geloescht' | 'residual' | 'nicht_gefunden'): string {
  if (art === 'residual') return '/konto-geloescht?stand=ereignisse'
  if (art === 'nicht_gefunden') return '/konto-geloescht?stand=bereits'
  return '/konto-geloescht'
}

export function kontoLoeschungHttpAuftrag(eingabe: {
  supabaseUrl: string
  accessToken: string
  confirmation: string
  password: string
}):
  | {
      url: string
      init: { method: 'POST'; headers: { Authorization: string; 'Content-Type': string }; body: string }
    }
  | { art: 'nicht_verfuegbar' } {
  const basis = eingabe.supabaseUrl.trim().replace(/\/$/, '')
  if (!basis || !eingabe.accessToken) return { art: 'nicht_verfuegbar' }
  let url: URL
  try {
    url = new URL(`${basis}/functions/v1/${KONTO_LOESCHUNG_FUNKTION}`)
  } catch {
    return { art: 'nicht_verfuegbar' }
  }
  if (url.search) return { art: 'nicht_verfuegbar' }
  return {
    url: url.toString(),
    init: {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${eingabe.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        confirmation: eingabe.confirmation,
        password: eingabe.password,
      }),
    },
  }
}

export async function lokaleSitzungNachLoeschung(
  signOut: ((options: { scope: 'local' }) => Promise<{ error: unknown }>) | undefined,
): Promise<{ versucht: true; bereinigt: boolean }> {
  if (!signOut) return { versucht: true, bereinigt: false }
  try {
    const ergebnis = await signOut({ scope: 'local' })
    return { versucht: true, bereinigt: !ergebnis.error }
  } catch {
    return { versucht: true, bereinigt: false }
  }
}

export type LoeschungMfaAuth = {
  mfa?: {
    challenge?: (args: { factorId: string }) => Promise<{
      data: { id?: string } | null
      error: { message?: string } | null
    }>
    verify?: (args: { factorId: string; challengeId: string; code: string }) => Promise<{
      error: { message?: string } | null
    }>
    getAuthenticatorAssuranceLevel?: () => Promise<{
      data: { currentLevel?: string | null } | null
      error: { message?: string } | null
    }>
  }
}

export async function totpFuerLoeschungBestaetigen(
  auth: LoeschungMfaAuth,
  faktorId: string,
  code: string,
): Promise<'aal2' | 'code_ungueltig' | 'bestaetigung_fehlgeschlagen' | 'aal_unbekannt'> {
  if (!/^\d{6}$/.test(code) || !faktorId) return 'code_ungueltig'
  const challenge = auth.mfa?.challenge
  const verify = auth.mfa?.verify
  const aal = auth.mfa?.getAuthenticatorAssuranceLevel
  if (!challenge || !verify || !aal) return 'bestaetigung_fehlgeschlagen'
  const herausforderung = await challenge({ factorId: faktorId })
  const challengeId = herausforderung.data?.id
  if (herausforderung.error || !challengeId) return 'bestaetigung_fehlgeschlagen'
  const bestaetigt = await verify({ factorId: faktorId, challengeId, code })
  if (bestaetigt.error) return 'bestaetigung_fehlgeschlagen'
  const stand = await aal()
  if (stand.error || stand.data?.currentLevel !== 'aal2') return 'aal_unbekannt'
  return 'aal2'
}
