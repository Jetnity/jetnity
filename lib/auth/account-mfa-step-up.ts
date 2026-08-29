// lib/auth/account-mfa-step-up.ts
//
// AP-5-S4: nutzerfreundlicher MFA-Step-up vor Unenroll eines
// verifizierten TOTP-Faktors. Kein globales Consumer-AAL2.
// Challenge-ID / Factor-ID / OTP bleiben intern. Erfolg erst nach
// bestätigtem Unenroll und bestätigtem Sitzungs-/AAL-Abgleich.

import {
  securityFehlerAusUnbekannt,
  securityFehlerIstDicht,
} from '@/lib/auth/account-security-fehler'
import {
  totpFaktorenAusAntwort,
  type MfaListFactorsData,
  type TotpFaktorAnzeige,
} from '@/lib/auth/account-security-faktoren'

export type MfaStepUpLage = 'idle' | 'working' | 'success' | 'error' | 'unavailable' | 'unsupported'

export type MfaStepUpPhase = 'idle' | 'pruefen' | 'warte_auf_code' | 'bestaetigen' | 'entfernen'

export type MfaAalStufe = 'aal1' | 'aal2'

export type MfaAalStand = {
  currentLevel: MfaAalStufe | null
  nextLevel: MfaAalStufe | null
}

export type MfaStepUpFehlerCode =
  | 'session_required'
  | 'unsupported'
  | 'unavailable'
  | 'aal_unbekannt'
  | 'aal_nicht_bestaetigt'
  | 'challenge_failed'
  | 'verify_invalid'
  | 'verify_expired'
  | 'verify_failed'
  | 'unenroll_failed'
  | 'unenroll_failed_nach_step_up'
  | 'unenroll_aal2_required'
  | 'faktor_stale'
  | 'code_ungueltig'
  | 'kein_verifizierter_totp'
  | 'network'
  | 'rate_limited'
  | 'sitzung_unbestaetigt_nach_unenroll'
  | 'sitzung_unbestaetigt_abmelden_fehlgeschlagen'
  | 'unknown'

export type MfaStepUpFehler = {
  code: MfaStepUpFehlerCode
  text: string
  erneut: 'idle' | 'warte_auf_code' | null
}

export type MfaStepUpZustand = {
  lage: MfaStepUpLage
  phase: MfaStepUpPhase
  zielFaktorId: string | null
  brauchtStepUp: boolean
  lokalBeenden: boolean
  fehler: MfaStepUpFehler | null
}

export type MfaStepUpEreignis =
  | { typ: 'starte'; faktorId: string }
  | { typ: 'plan_direkt' }
  | { typ: 'plan_step_up' }
  | { typ: 'client_unbekannt' }
  | { typ: 'client_ohne_sitzung' }
  | { typ: 'plan_fehler'; fehler: MfaStepUpFehler }
  | { typ: 'code_bereit' }
  | { typ: 'abbrechen' }
  | { typ: 'zuruecksetzen' }
  | { typ: 'ausfuehren_ok' }
  | { typ: 'ausfuehren_fehler'; fehler: MfaStepUpFehler }
  | { typ: 'unenroll_ok_sitzung_unbestaetigt'; lokalBeendet: boolean }

export type MfaUnenrollPlan =
  | { art: 'direkt_unenroll'; grund: 'unverified' | 'bereits_aal2' }
  | { art: 'step_up'; grund: 'verified_braucht_aal2'; challengeFaktorId: string }
  | { art: 'unsupported'; grund: 'api_fehlt' }
  | { art: 'unavailable'; grund: 'kein_verifizierter_totp' | 'aal_unbekannt' }
  | { art: 'fehler'; grund: 'faktor_stale' | 'session_required' }

export type MfaStepUpAuthFehler = {
  message?: string
  code?: string
  status?: number
}

export type MfaStepUpAuth = {
  getUser: () => Promise<{
    data: { user: { id?: string | null } | null }
    error: MfaStepUpAuthFehler | null
  }>
  refreshSession?: () => Promise<{
    data: { session: { access_token?: string | null } | null; user: { id?: string | null } | null }
    error: MfaStepUpAuthFehler | null
  }>
  signOut?: (options: { scope: 'local' }) => Promise<{ error: MfaStepUpAuthFehler | null }>
  mfa?: {
    listFactors?: () => Promise<{
      data: MfaListFactorsData | null
      error: MfaStepUpAuthFehler | null
    }>
    getAuthenticatorAssuranceLevel?: () => Promise<{
      data: { currentLevel?: string | null; nextLevel?: string | null } | null
      error: MfaStepUpAuthFehler | null
    }>
    challenge?: (args: { factorId: string }) => Promise<{
      data: { id?: string; challenge_id?: string } | null
      error: MfaStepUpAuthFehler | null
    }>
    verify?: (args: {
      factorId: string
      challengeId: string
      code: string
    }) => Promise<{ error: MfaStepUpAuthFehler | null }>
    unenroll?: (args: { factorId: string }) => Promise<{
      error: MfaStepUpAuthFehler | null
    }>
  }
}

export const MFA_STEP_UP_ANFANG: MfaStepUpZustand = {
  lage: 'idle',
  phase: 'idle',
  zielFaktorId: null,
  brauchtStepUp: false,
  lokalBeenden: false,
  fehler: null,
}

export const MFA_STEP_UP_ERFOLG_TEXT = 'Authenticator-App entfernt.'

export const MFA_STEP_UP_DIALOG_TITEL = 'Authenticator-App bestätigen'

export const MFA_STEP_UP_DIALOG_TEXT =
  'Zum Entfernen einer bestätigten Authenticator-App fordert Jetnity für diesen Vorgang eine aktuelle Zwei-Faktor-Bestätigung an. Dadurch kann diese Sitzung technisch auf die Zwei-Faktor-Stufe angehoben werden. Es wird keine globale Zwei-Faktor-Pflicht für alle Kontobereiche aktiviert.'

const FEHLER_TEXTE: Record<MfaStepUpFehlerCode, string> = {
  session_required: 'Die Sitzung ist nicht mehr gültig. Bitte melde dich erneut an.',
  unsupported: 'Die Zwei-Faktor-Bestätigung ist in dieser Umgebung nicht unterstützt.',
  unavailable: 'Die Zwei-Faktor-Bestätigung ist gerade nicht verfügbar.',
  aal_unbekannt:
    'Der Sitzungsstand konnte nicht geprüft werden. Die Authenticator-App wurde nicht entfernt.',
  aal_nicht_bestaetigt:
    'Die Bestätigung hat den Sitzungsstand nicht ausreichend erhöht. Die Authenticator-App wurde nicht entfernt.',
  challenge_failed: 'Die Bestätigung konnte nicht gestartet werden. Bitte versuche es erneut.',
  verify_invalid: 'Der Code ist ungültig. Bitte prüfe die Authenticator-App und versuche es erneut.',
  verify_expired: 'Der Bestätigungscode ist abgelaufen. Bitte starte die Bestätigung neu.',
  verify_failed: 'Die Bestätigung ist fehlgeschlagen. Bitte versuche es erneut.',
  unenroll_failed: 'Die Authenticator-App konnte nicht entfernt werden. Bitte versuche es erneut.',
  unenroll_failed_nach_step_up:
    'Die Zwei-Faktor-Bestätigung für diese Sitzung hat geklappt. Die Authenticator-App wurde trotzdem nicht entfernt. Bitte versuche das Entfernen erneut.',
  unenroll_aal2_required:
    'Zum Entfernen einer bestätigten Authenticator-App ist eine aktuelle Zwei-Faktor-Bestätigung nötig.',
  faktor_stale:
    'Diese Authenticator-App ist nicht mehr dieselbe wie zuvor. Die Liste wird neu geladen. Es wurde nichts entfernt.',
  code_ungueltig: 'Bitte 6-stelligen Code eingeben.',
  kein_verifizierter_totp:
    'Es gibt keine bestätigte Authenticator-App, mit der diese Sitzung bestätigt werden kann. Die App wurde nicht entfernt.',
  network: 'Die Verbindung war unterbrochen. Bitte prüfe das Netz und versuche es erneut.',
  rate_limited: 'Zu viele Versuche. Bitte warte kurz und versuche es erneut.',
  sitzung_unbestaetigt_nach_unenroll:
    'Die Authenticator-App wurde entfernt. Der Sicherheitsstand dieser Sitzung konnte danach nicht bestätigt werden. Diese Sitzung wird deshalb auf diesem Gerät beendet. Bitte melde dich erneut an.',
  sitzung_unbestaetigt_abmelden_fehlgeschlagen:
    'Die Authenticator-App wurde entfernt. Der Sicherheitsstand dieser Sitzung konnte nicht bestätigt werden, und das lokale Abmelden ist fehlgeschlagen. Melde dich bitte selbst ab und erneut an.',
  unknown: 'Das hat gerade nicht geklappt. Bitte versuche es erneut.',
}

const LAGE_TEXTE: Record<MfaStepUpLage, string> = {
  idle: 'Bestätigte Authenticator-Apps brauchen eine aktuelle Zwei-Faktor-Bestätigung, bevor sie entfernt werden. Jetnity fordert das nur für diesen Vorgang an. Diese Sitzung kann dabei auf die Zwei-Faktor-Stufe angehoben werden; eine globale Pflicht entsteht dadurch nicht.',
  working: 'Bitte warten…',
  success: MFA_STEP_UP_ERFOLG_TEXT,
  error: 'Die Authenticator-App konnte nicht entfernt werden.',
  unsupported: FEHLER_TEXTE.unsupported,
  unavailable: FEHLER_TEXTE.unavailable,
}

export function mfaStepUpFehler(code: MfaStepUpFehlerCode): MfaStepUpFehler {
  return {
    code,
    text: FEHLER_TEXTE[code],
    erneut: erneutFuer(code),
  }
}

function erneutFuer(code: MfaStepUpFehlerCode): MfaStepUpFehler['erneut'] {
  if (
    code === 'unsupported' ||
    code === 'unavailable' ||
    code === 'session_required' ||
    code === 'kein_verifizierter_totp' ||
    code === 'aal_unbekannt' ||
    code === 'sitzung_unbestaetigt_nach_unenroll' ||
    code === 'sitzung_unbestaetigt_abmelden_fehlgeschlagen'
  ) {
    return null
  }
  if (
    code === 'code_ungueltig' ||
    code === 'verify_invalid' ||
    code === 'verify_expired' ||
    code === 'verify_failed' ||
    code === 'challenge_failed' ||
    code === 'aal_nicht_bestaetigt'
  ) {
    return 'warte_auf_code'
  }
  return 'idle'
}

function aalStufeLesen(wert: unknown): MfaAalStufe | null {
  if (wert === 'aal1' || wert === 'aal2') return wert
  return null
}

export function aalStandLesen(
  data: { currentLevel?: string | null; nextLevel?: string | null } | null | undefined,
): MfaAalStand {
  return {
    currentLevel: aalStufeLesen(data?.currentLevel ?? null),
    nextLevel: aalStufeLesen(data?.nextLevel ?? null),
  }
}

export function aalIstAusreichendFuerVerifiedUnenroll(stand: MfaAalStand): boolean {
  return stand.currentLevel === 'aal2'
}

export function faktorIstVerifiziert(status: string | null | undefined): boolean | 'unbekannt' {
  if (status === 'verified') return true
  if (status === 'unverified') return false
  return 'unbekannt'
}

export function nutzbarerChallengeFaktor(
  faktoren: Array<Pick<TotpFaktorAnzeige, 'id' | 'status'>>,
  zielFaktorId: string,
): string | null {
  const verifiziert = faktoren.filter((faktor) => faktor.status === 'verified' && faktor.id.length > 0)
  const anderer = verifiziert.find((faktor) => faktor.id !== zielFaktorId)
  if (anderer) return anderer.id
  return verifiziert.find((faktor) => faktor.id === zielFaktorId)?.id ?? null
}

export function mfaSitzungNachUnenrollIstSauber(eingabe: {
  zielFaktorId: string
  faktoren: Array<Pick<TotpFaktorAnzeige, 'id' | 'status'>>
  aal: MfaAalStand
}): boolean {
  if (eingabe.faktoren.some((faktor) => faktor.id === eingabe.zielFaktorId)) return false
  if (eingabe.aal.currentLevel !== 'aal1' && eingabe.aal.currentLevel !== 'aal2') return false
  const hatNochVerified = eingabe.faktoren.some((faktor) => faktor.status === 'verified')
  if (!hatNochVerified && eingabe.aal.currentLevel === 'aal2') return false
  return true
}

export function mfaUnenrollPlanen(eingabe: {
  zielFaktorId: string
  bekannterStatus?: string | null
  faktoren: Array<Pick<TotpFaktorAnzeige, 'id' | 'status'>>
  aal: MfaAalStand | null
  aalLesbar: boolean
  apis: {
    listFactors: boolean
    getAal: boolean
    challenge: boolean
    verify: boolean
    unenroll: boolean
  }
  sitzungVorhanden: boolean
}): MfaUnenrollPlan {
  if (!eingabe.sitzungVorhanden) return { art: 'fehler', grund: 'session_required' }
  if (!eingabe.apis.unenroll) return { art: 'unsupported', grund: 'api_fehlt' }
  if (!eingabe.zielFaktorId) return { art: 'fehler', grund: 'faktor_stale' }

  const ziel = eingabe.faktoren.find((faktor) => faktor.id === eingabe.zielFaktorId) ?? null
  const status = ziel?.status ?? eingabe.bekannterStatus ?? null
  const verifiziert = faktorIstVerifiziert(status)

  if (!ziel) {
    if (verifiziert === false) return { art: 'direkt_unenroll', grund: 'unverified' }
    if (!eingabe.apis.listFactors) return { art: 'unsupported', grund: 'api_fehlt' }
    return { art: 'fehler', grund: 'faktor_stale' }
  }

  if (verifiziert === false) {
    return { art: 'direkt_unenroll', grund: 'unverified' }
  }

  if (!eingabe.apis.getAal) return { art: 'unsupported', grund: 'api_fehlt' }
  if (!eingabe.aalLesbar || !eingabe.aal) return { art: 'unavailable', grund: 'aal_unbekannt' }
  if (aalIstAusreichendFuerVerifiedUnenroll(eingabe.aal)) {
    return { art: 'direkt_unenroll', grund: 'bereits_aal2' }
  }
  if (!eingabe.apis.challenge || !eingabe.apis.verify) {
    return { art: 'unsupported', grund: 'api_fehlt' }
  }

  const challengeFaktorId =
    verifiziert === true
      ? nutzbarerChallengeFaktor(eingabe.faktoren, eingabe.zielFaktorId)
      : eingabe.faktoren.find((faktor) => faktor.status === 'verified' && faktor.id.length > 0)?.id ??
        null
  if (!challengeFaktorId) return { art: 'unavailable', grund: 'kein_verifizierter_totp' }
  return { art: 'step_up', grund: 'verified_braucht_aal2', challengeFaktorId }
}

export function mfaStepUpCodePruefen(code: string): MfaStepUpFehler | null {
  if (!/^\d{6}$/.test(code)) return mfaStepUpFehler('code_ungueltig')
  return null
}

export function mfaStepUpChallengeIdLesen(
  data: { id?: string; challenge_id?: string } | null | undefined,
): string | null {
  const id = data?.id ?? data?.challenge_id
  return typeof id === 'string' && id.length > 0 ? id : null
}

export function mfaStepUpWeiter(zustand: MfaStepUpZustand, ereignis: MfaStepUpEreignis): MfaStepUpZustand {
  switch (ereignis.typ) {
    case 'starte':
      if (!darfMfaStepUpStarten(zustand)) return zustand
      if (!ereignis.faktorId) return zustand
      return {
        lage: 'working',
        phase: 'pruefen',
        zielFaktorId: ereignis.faktorId,
        brauchtStepUp: false,
        lokalBeenden: false,
        fehler: null,
      }
    case 'plan_direkt':
      if (zustand.lage !== 'working' || zustand.phase !== 'pruefen' || !zustand.zielFaktorId) {
        return zustand
      }
      return {
        lage: 'working',
        phase: 'entfernen',
        zielFaktorId: zustand.zielFaktorId,
        brauchtStepUp: false,
        lokalBeenden: false,
        fehler: null,
      }
    case 'plan_step_up':
      if (zustand.lage !== 'working' || zustand.phase !== 'pruefen' || !zustand.zielFaktorId) {
        return zustand
      }
      return {
        lage: 'idle',
        phase: 'warte_auf_code',
        zielFaktorId: zustand.zielFaktorId,
        brauchtStepUp: true,
        lokalBeenden: false,
        fehler: null,
      }
    case 'client_unbekannt':
      if (!darfPlanErgebnis(zustand)) return zustand
      return {
        lage: 'unsupported',
        phase: zustand.phase,
        zielFaktorId: zustand.zielFaktorId,
        brauchtStepUp: zustand.brauchtStepUp,
        lokalBeenden: false,
        fehler: mfaStepUpFehler('unsupported'),
      }
    case 'client_ohne_sitzung':
      if (!darfPlanErgebnis(zustand)) return zustand
      return {
        lage: 'unavailable',
        phase: zustand.phase,
        zielFaktorId: zustand.zielFaktorId,
        brauchtStepUp: zustand.brauchtStepUp,
        lokalBeenden: false,
        fehler: mfaStepUpFehler('session_required'),
      }
    case 'plan_fehler':
      if (!darfPlanErgebnis(zustand)) return zustand
      return lageFuerFehler(zustand, ereignis.fehler)
    case 'code_bereit':
      if (!darfStepUpCodeSenden(zustand) || !zustand.zielFaktorId) return zustand
      return {
        lage: 'working',
        phase: 'bestaetigen',
        zielFaktorId: zustand.zielFaktorId,
        brauchtStepUp: true,
        lokalBeenden: false,
        fehler: null,
      }
    case 'abbrechen':
      if (mfaStepUpIstBeschaeftigt(zustand)) return zustand
      return MFA_STEP_UP_ANFANG
    case 'zuruecksetzen':
      return MFA_STEP_UP_ANFANG
    case 'ausfuehren_ok':
      if (zustand.lage !== 'working') return zustand
      if (zustand.phase !== 'bestaetigen' && zustand.phase !== 'entfernen') return zustand
      return {
        lage: 'success',
        phase: zustand.phase,
        zielFaktorId: zustand.zielFaktorId,
        brauchtStepUp: zustand.brauchtStepUp,
        lokalBeenden: false,
        fehler: null,
      }
    case 'unenroll_ok_sitzung_unbestaetigt':
      if (zustand.lage !== 'working') return zustand
      if (zustand.phase !== 'bestaetigen' && zustand.phase !== 'entfernen') return zustand
      return {
        lage: 'error',
        phase: zustand.phase,
        zielFaktorId: zustand.zielFaktorId,
        brauchtStepUp: zustand.brauchtStepUp,
        lokalBeenden: ereignis.lokalBeendet,
        fehler: mfaStepUpFehler(
          ereignis.lokalBeendet
            ? 'sitzung_unbestaetigt_nach_unenroll'
            : 'sitzung_unbestaetigt_abmelden_fehlgeschlagen',
        ),
      }
    case 'ausfuehren_fehler':
      if (zustand.phase === 'warte_auf_code') return lageFuerFehler(zustand, ereignis.fehler)
      if (zustand.lage !== 'working') return zustand
      return lageFuerFehler(zustand, ereignis.fehler)
    default:
      return zustand
  }
}

function darfPlanErgebnis(zustand: MfaStepUpZustand): boolean {
  return (
    (zustand.lage === 'working' && (zustand.phase === 'pruefen' || zustand.phase === 'entfernen' || zustand.phase === 'bestaetigen')) ||
    zustand.phase === 'warte_auf_code'
  )
}

function lageFuerFehler(zustand: MfaStepUpZustand, fehler: MfaStepUpFehler): MfaStepUpZustand {
  if (fehler.code === 'unsupported') {
    return {
      lage: 'unsupported',
      phase: zustand.phase,
      zielFaktorId: zustand.zielFaktorId,
      brauchtStepUp: zustand.brauchtStepUp,
      lokalBeenden: false,
      fehler,
    }
  }
  if (fehler.code === 'unavailable' || fehler.code === 'session_required') {
    return {
      lage: 'unavailable',
      phase: zustand.phase,
      zielFaktorId: zustand.zielFaktorId,
      brauchtStepUp: zustand.brauchtStepUp,
      lokalBeenden: false,
      fehler,
    }
  }
  return {
    lage: 'error',
    phase: fehler.erneut === 'warte_auf_code' ? 'warte_auf_code' : zustand.phase,
    zielFaktorId: zustand.zielFaktorId,
    brauchtStepUp: zustand.brauchtStepUp,
    lokalBeenden: false,
    fehler,
  }
}

export function darfMfaStepUpStarten(zustand: MfaStepUpZustand): boolean {
  if (zustand.lage === 'working' || zustand.lage === 'unsupported' || zustand.lage === 'unavailable') {
    return false
  }
  if (zustand.phase === 'warte_auf_code') return false
  if (zustand.lage === 'error' && zustand.fehler?.erneut === 'warte_auf_code') return false
  return true
}

export function darfStepUpCodeSenden(zustand: MfaStepUpZustand): boolean {
  return (
    zustand.phase === 'warte_auf_code' &&
    (zustand.lage === 'idle' || (zustand.lage === 'error' && zustand.fehler?.erneut === 'warte_auf_code'))
  )
}

export function mfaStepUpIstBeschaeftigt(zustand: MfaStepUpZustand): boolean {
  return zustand.lage === 'working'
}

export function mfaStepUpErfolgBehaupten(zustand: MfaStepUpZustand): boolean {
  return zustand.lage === 'success' && !zustand.fehler && !zustand.lokalBeenden
}

export function mfaStepUpSollLokalenAuthVerlassen(zustand: MfaStepUpZustand): boolean {
  return zustand.lokalBeenden === true && zustand.lage === 'error'
}

export function mfaStepUpDialogOffen(zustand: MfaStepUpZustand): boolean {
  return (
    zustand.phase === 'warte_auf_code' ||
    zustand.phase === 'bestaetigen' ||
    (zustand.lage === 'error' && zustand.fehler?.erneut === 'warte_auf_code')
  )
}

export function mfaStepUpStatusText(zustand: MfaStepUpZustand): string {
  if (
    (zustand.lage === 'error' || zustand.lage === 'unsupported' || zustand.lage === 'unavailable') &&
    zustand.fehler
  ) {
    return zustand.fehler.text
  }
  if (zustand.lage === 'working' && zustand.phase === 'warte_auf_code') {
    return LAGE_TEXTE.working
  }
  if (zustand.phase === 'warte_auf_code') return MFA_STEP_UP_DIALOG_TEXT
  if (zustand.lage === 'working' && zustand.phase === 'pruefen') {
    return 'Der Sitzungsstand wird geprüft.'
  }
  if (zustand.lage === 'working' && zustand.phase === 'entfernen') {
    return 'Authenticator-App wird entfernt.'
  }
  if (zustand.lage === 'working' && zustand.phase === 'bestaetigen') {
    return 'Bestätigung wird geprüft.'
  }
  return LAGE_TEXTE[zustand.lage]
}

export function mfaStepUpFehlerEinordnen(eingabe: {
  vorgang: 'sitzung' | 'aal' | 'list' | 'challenge' | 'verify' | 'unenroll'
  meldung?: string | null
  code?: string | null
  status?: number | null
  nachStepUp?: boolean
}): MfaStepUpFehler {
  const meldung = (eingabe.meldung ?? '').toLowerCase()
  const apiCode = (eingabe.code ?? '').toLowerCase()
  const status = eingabe.status ?? null

  if (istNetz(meldung, apiCode, status)) return mfaStepUpFehler('network')
  if (istSitzungFehlt(meldung, apiCode, status)) return mfaStepUpFehler('session_required')
  if (istRateLimit(meldung, apiCode, status)) return mfaStepUpFehler('rate_limited')

  if (eingabe.vorgang === 'sitzung' || eingabe.vorgang === 'aal') {
    if (istNichtUnterstuetzt(meldung, apiCode)) return mfaStepUpFehler('unsupported')
    if (eingabe.vorgang === 'aal') return mfaStepUpFehler('aal_unbekannt')
    return mfaStepUpFehler('unknown')
  }

  if (eingabe.vorgang === 'list') {
    if (istNichtUnterstuetzt(meldung, apiCode)) return mfaStepUpFehler('unsupported')
    return mfaStepUpFehler('unknown')
  }

  if (eingabe.vorgang === 'challenge') {
    if (istNichtUnterstuetzt(meldung, apiCode)) return mfaStepUpFehler('unsupported')
    if (istAbgelaufen(meldung, apiCode)) return mfaStepUpFehler('verify_expired')
    return mfaStepUpFehler('challenge_failed')
  }

  if (eingabe.vorgang === 'verify') {
    if (istAbgelaufen(meldung, apiCode)) return mfaStepUpFehler('verify_expired')
    if (istUngueltigerCode(meldung, apiCode)) return mfaStepUpFehler('verify_invalid')
    if (istNichtUnterstuetzt(meldung, apiCode)) return mfaStepUpFehler('unsupported')
    return mfaStepUpFehler('verify_failed')
  }

  if (istAal2Noetig(meldung, apiCode, status)) return mfaStepUpFehler('unenroll_aal2_required')
  if (eingabe.nachStepUp) return mfaStepUpFehler('unenroll_failed_nach_step_up')
  return mfaStepUpFehler('unenroll_failed')
}

export async function mfaUnenrollVorbereiten(
  auth: MfaStepUpAuth,
  faktorId: string,
  bekannterStatus?: string | null,
): Promise<
  Extract<
    MfaStepUpEreignis,
    { typ: 'client_unbekannt' | 'client_ohne_sitzung' | 'plan_direkt' | 'plan_step_up' | 'plan_fehler' }
  >
> {
  if (!faktorId) {
    return { typ: 'plan_fehler', fehler: mfaStepUpFehler('faktor_stale') }
  }

  const apis = {
    listFactors: typeof auth.mfa?.listFactors === 'function',
    getAal: typeof auth.mfa?.getAuthenticatorAssuranceLevel === 'function',
    challenge: typeof auth.mfa?.challenge === 'function',
    verify: typeof auth.mfa?.verify === 'function',
    unenroll: typeof auth.mfa?.unenroll === 'function',
  }

  try {
    const sitzung = await auth.getUser()
    if (sitzung.error) return sitzungEreignisAusFehler(sitzung.error)
    if (!sitzung.data.user) return { typ: 'client_ohne_sitzung' }

    let faktoren: TotpFaktorAnzeige[] = []
    let listeLesbar = false
    if (apis.listFactors && auth.mfa?.listFactors) {
      const liste = await auth.mfa.listFactors()
      if (liste.error) {
        if (faktorIstVerifiziert(bekannterStatus) === false) {
          return ereignisAusPlan(
            mfaUnenrollPlanen({
              zielFaktorId: faktorId,
              bekannterStatus,
              faktoren: [],
              aal: null,
              aalLesbar: false,
              apis,
              sitzungVorhanden: true,
            }),
          )
        }
        return {
          typ: 'plan_fehler',
          fehler: mfaStepUpFehlerEinordnen({
            vorgang: 'list',
            ...securityFehlerAusUnbekannt(liste.error),
          }),
        }
      }
      faktoren = totpFaktorenAusAntwort(liste.data)
      listeLesbar = true
    }

    const ziel = faktoren.find((faktor) => faktor.id === faktorId) ?? null
    const status = ziel?.status ?? bekannterStatus ?? null
    const brauchtAal = faktorIstVerifiziert(status) !== false

    let aal: MfaAalStand | null = null
    let aalLesbar = false
    if (brauchtAal) {
      if (!apis.getAal || !auth.mfa?.getAuthenticatorAssuranceLevel) {
        return { typ: 'client_unbekannt' }
      }
      const aalAntwort = await auth.mfa.getAuthenticatorAssuranceLevel()
      if (aalAntwort.error) {
        return {
          typ: 'plan_fehler',
          fehler: mfaStepUpFehlerEinordnen({
            vorgang: 'aal',
            ...securityFehlerAusUnbekannt(aalAntwort.error),
          }),
        }
      }
      aal = aalStandLesen(aalAntwort.data)
      aalLesbar = true
    }

    return ereignisAusPlan(
      mfaUnenrollPlanen({
        zielFaktorId: faktorId,
        bekannterStatus: status,
        faktoren: listeLesbar ? faktoren : ziel ? faktoren : [],
        aal,
        aalLesbar,
        apis: { ...apis, listFactors: listeLesbar || apis.listFactors },
        sitzungVorhanden: true,
      }),
    )
  } catch (fehler) {
    return sitzungEreignisAusFehler(fehler)
  }
}

export async function mfaUnenrollDirekt(
  auth: MfaStepUpAuth,
  faktorId: string,
): Promise<
  Extract<
    MfaStepUpEreignis,
    {
      typ:
        | 'ausfuehren_ok'
        | 'ausfuehren_fehler'
        | 'client_unbekannt'
        | 'client_ohne_sitzung'
        | 'unenroll_ok_sitzung_unbestaetigt'
    }
  >
> {
  if (!faktorId) {
    return { typ: 'ausfuehren_fehler', fehler: mfaStepUpFehler('faktor_stale') }
  }
  const mfa = auth.mfa
  if (typeof mfa?.unenroll !== 'function') return { typ: 'client_unbekannt' }

  try {
    const sitzung = await auth.getUser()
    if (sitzung.error) return sitzungAusfuehrenEreignisAusFehler(sitzung.error)
    if (!sitzung.data?.user) return { typ: 'client_ohne_sitzung' }

    const bestand = await faktorBestandLesen(auth, faktorId)
    if (bestand.art === 'fehler') return bestand.ereignis
    if (bestand.art === 'fehlend' && bestand.verifiziert !== false) {
      return { typ: 'ausfuehren_fehler', fehler: mfaStepUpFehler('faktor_stale') }
    }

    const { error } = await mfa.unenroll({ factorId: faktorId })
    if (error) {
      return {
        typ: 'ausfuehren_fehler',
        fehler: mfaStepUpFehlerEinordnen({
          vorgang: 'unenroll',
          ...securityFehlerAusUnbekannt(error),
        }),
      }
    }
    if (bestand.verifiziert === false) return { typ: 'ausfuehren_ok' }
    return mfaSitzungNachVerifiedUnenroll(auth, faktorId)
  } catch (fehler) {
    return {
      typ: 'ausfuehren_fehler',
      fehler: mfaStepUpFehlerEinordnen({
        vorgang: 'unenroll',
        ...securityFehlerAusUnbekannt(fehler),
      }),
    }
  }
}

export async function mfaStepUpUndUnenroll(
  auth: MfaStepUpAuth,
  eingabe: { faktorId: string; code: string },
): Promise<
  Extract<
    MfaStepUpEreignis,
    | { typ: 'ausfuehren_ok' | 'ausfuehren_fehler' | 'client_unbekannt' | 'client_ohne_sitzung' | 'unenroll_ok_sitzung_unbestaetigt' }
  >
> {
  const codeFehler = mfaStepUpCodePruefen(eingabe.code)
  if (codeFehler) return { typ: 'ausfuehren_fehler', fehler: codeFehler }
  if (!eingabe.faktorId) {
    return { typ: 'ausfuehren_fehler', fehler: mfaStepUpFehler('faktor_stale') }
  }

  const mfa = auth.mfa
  if (
    typeof mfa?.listFactors !== 'function' ||
    typeof mfa.getAuthenticatorAssuranceLevel !== 'function' ||
    typeof mfa.challenge !== 'function' ||
    typeof mfa.verify !== 'function' ||
    typeof mfa.unenroll !== 'function'
  ) {
    return { typ: 'client_unbekannt' }
  }

  try {
    const sitzung = await auth.getUser()
    if (sitzung.error) return sitzungAusfuehrenEreignisAusFehler(sitzung.error)
    if (!sitzung.data?.user) return { typ: 'client_ohne_sitzung' }

    const liste = await mfa.listFactors()
    if (liste.error) {
      return {
        typ: 'ausfuehren_fehler',
        fehler: mfaStepUpFehlerEinordnen({
          vorgang: 'list',
          ...securityFehlerAusUnbekannt(liste.error),
        }),
      }
    }
    const faktoren = totpFaktorenAusAntwort(liste.data)
    const ziel = faktoren.find((faktor) => faktor.id === eingabe.faktorId)
    if (!ziel) {
      return { typ: 'ausfuehren_fehler', fehler: mfaStepUpFehler('faktor_stale') }
    }

    const aalAntwort = await mfa.getAuthenticatorAssuranceLevel()
    if (aalAntwort.error) {
      return {
        typ: 'ausfuehren_fehler',
        fehler: mfaStepUpFehlerEinordnen({
          vorgang: 'aal',
          ...securityFehlerAusUnbekannt(aalAntwort.error),
        }),
      }
    }
    const aal = aalStandLesen(aalAntwort.data)
    let hatStepUpAusgefuehrt = false

    if (!aalIstAusreichendFuerVerifiedUnenroll(aal)) {
      const challengeFaktorId = nutzbarerChallengeFaktor(faktoren, eingabe.faktorId)
      if (!challengeFaktorId) {
        return { typ: 'ausfuehren_fehler', fehler: mfaStepUpFehler('kein_verifizierter_totp') }
      }

      const challenge = await mfa.challenge({ factorId: challengeFaktorId })
      if (challenge.error) {
        return {
          typ: 'ausfuehren_fehler',
          fehler: mfaStepUpFehlerEinordnen({
            vorgang: 'challenge',
            ...securityFehlerAusUnbekannt(challenge.error),
          }),
        }
      }
      const challengeId = mfaStepUpChallengeIdLesen(challenge.data)
      if (!challengeId) {
        return { typ: 'ausfuehren_fehler', fehler: mfaStepUpFehler('challenge_failed') }
      }

      const verify = await mfa.verify({
        factorId: challengeFaktorId,
        challengeId,
        code: eingabe.code,
      })
      if (verify.error) {
        return {
          typ: 'ausfuehren_fehler',
          fehler: mfaStepUpFehlerEinordnen({
            vorgang: 'verify',
            ...securityFehlerAusUnbekannt(verify.error),
          }),
        }
      }
      hatStepUpAusgefuehrt = true

      const aalErneut = await mfa.getAuthenticatorAssuranceLevel()
      if (aalErneut.error) {
        return {
          typ: 'ausfuehren_fehler',
          fehler: mfaStepUpFehlerEinordnen({
            vorgang: 'aal',
            ...securityFehlerAusUnbekannt(aalErneut.error),
          }),
        }
      }
      if (!aalIstAusreichendFuerVerifiedUnenroll(aalStandLesen(aalErneut.data))) {
        return { typ: 'ausfuehren_fehler', fehler: mfaStepUpFehler('aal_nicht_bestaetigt') }
      }
    }

    const danach = await faktorNochVorhanden(auth, eingabe.faktorId)
    if (danach) return danach

    const { error } = await mfa.unenroll({ factorId: eingabe.faktorId })
    if (error) {
      return {
        typ: 'ausfuehren_fehler',
        fehler: mfaStepUpFehlerEinordnen({
          vorgang: 'unenroll',
          nachStepUp: hatStepUpAusgefuehrt,
          ...securityFehlerAusUnbekannt(error),
        }),
      }
    }
    if (faktorIstVerifiziert(ziel.status) === false) return { typ: 'ausfuehren_ok' }
    return mfaSitzungNachVerifiedUnenroll(auth, eingabe.faktorId)
  } catch (fehler) {
    return {
      typ: 'ausfuehren_fehler',
      fehler: mfaStepUpFehlerEinordnen({
        vorgang: 'verify',
        ...securityFehlerAusUnbekannt(fehler),
      }),
    }
  }
}

export function mfaStepUpFehlerIstDicht(text: string, roh?: string | null): boolean {
  if (!securityFehlerIstDicht(text, roh)) return false
  if (
    /factor_id|challenge_id|session_id|access_token|refresh_token|otpauth:|gotrue|supabase|bearer\s|authorization:|eyj[a-z0-9_-]+\./i.test(
      text,
    )
  ) {
    return false
  }
  if (/\b\d{6}\b/.test(text)) return false
  return true
}

function ereignisAusPlan(
  plan: MfaUnenrollPlan,
): Extract<
  MfaStepUpEreignis,
  { typ: 'client_unbekannt' | 'client_ohne_sitzung' | 'plan_direkt' | 'plan_step_up' | 'plan_fehler' }
> {
  switch (plan.art) {
    case 'direkt_unenroll':
      return { typ: 'plan_direkt' }
    case 'step_up':
      return { typ: 'plan_step_up' }
    case 'unsupported':
      return { typ: 'client_unbekannt' }
    case 'unavailable':
      return {
        typ: 'plan_fehler',
        fehler: mfaStepUpFehler(plan.grund === 'kein_verifizierter_totp' ? 'kein_verifizierter_totp' : 'aal_unbekannt'),
      }
    case 'fehler':
      if (plan.grund === 'session_required') return { typ: 'client_ohne_sitzung' }
      return { typ: 'plan_fehler', fehler: mfaStepUpFehler('faktor_stale') }
  }
}

export async function mfaSitzungNachVerifiedUnenroll(
  auth: MfaStepUpAuth,
  faktorId: string,
): Promise<
  Extract<MfaStepUpEreignis, { typ: 'ausfuehren_ok' | 'ausfuehren_fehler' | 'unenroll_ok_sitzung_unbestaetigt' }>
> {
  if (typeof auth.refreshSession !== 'function') {
    return sitzungUnbestaetigtNachUnenroll(auth)
  }

  try {
    const refresh = await auth.refreshSession()
    if (refresh.error || !refresh.data?.session || !refresh.data?.user) {
      return sitzungUnbestaetigtNachUnenroll(auth)
    }

    const listFactors = auth.mfa?.listFactors
    const getAal = auth.mfa?.getAuthenticatorAssuranceLevel
    if (typeof listFactors !== 'function' || typeof getAal !== 'function') {
      return sitzungUnbestaetigtNachUnenroll(auth)
    }

    const liste = await listFactors()
    if (liste.error) return sitzungUnbestaetigtNachUnenroll(auth)
    const faktoren = totpFaktorenAusAntwort(liste.data)

    const aalAntwort = await getAal()
    if (aalAntwort.error) return sitzungUnbestaetigtNachUnenroll(auth)
    const aal = aalStandLesen(aalAntwort.data)

    if (!mfaSitzungNachUnenrollIstSauber({ zielFaktorId: faktorId, faktoren, aal })) {
      return sitzungUnbestaetigtNachUnenroll(auth)
    }
    return { typ: 'ausfuehren_ok' }
  } catch {
    return sitzungUnbestaetigtNachUnenroll(auth)
  }
}

async function sitzungUnbestaetigtNachUnenroll(
  auth: MfaStepUpAuth,
): Promise<Extract<MfaStepUpEreignis, { typ: 'unenroll_ok_sitzung_unbestaetigt' }>> {
  if (typeof auth.signOut !== 'function') {
    return { typ: 'unenroll_ok_sitzung_unbestaetigt', lokalBeendet: false }
  }
  try {
    const { error } = await auth.signOut({ scope: 'local' })
    if (error) return { typ: 'unenroll_ok_sitzung_unbestaetigt', lokalBeendet: false }
    return { typ: 'unenroll_ok_sitzung_unbestaetigt', lokalBeendet: true }
  } catch {
    return { typ: 'unenroll_ok_sitzung_unbestaetigt', lokalBeendet: false }
  }
}

async function faktorBestandLesen(
  auth: MfaStepUpAuth,
  faktorId: string,
): Promise<
  | { art: 'vorhanden'; verifiziert: boolean | 'unbekannt' }
  | { art: 'fehlend'; verifiziert: boolean | 'unbekannt' }
  | { art: 'fehler'; ereignis: Extract<MfaStepUpEreignis, { typ: 'ausfuehren_fehler' }> }
> {
  const listFactors = auth.mfa?.listFactors
  if (typeof listFactors !== 'function') {
    return { art: 'vorhanden', verifiziert: 'unbekannt' }
  }
  try {
    const antwort = await listFactors()
    if (antwort.error) {
      return {
        art: 'fehler',
        ereignis: {
          typ: 'ausfuehren_fehler',
          fehler: mfaStepUpFehlerEinordnen({
            vorgang: 'list',
            ...securityFehlerAusUnbekannt(antwort.error),
          }),
        },
      }
    }
    const faktoren = totpFaktorenAusAntwort(antwort.data)
    const ziel = faktoren.find((faktor) => faktor.id === faktorId)
    if (!ziel) return { art: 'fehlend', verifiziert: 'unbekannt' }
    return { art: 'vorhanden', verifiziert: faktorIstVerifiziert(ziel.status) }
  } catch (fehler) {
    return {
      art: 'fehler',
      ereignis: {
        typ: 'ausfuehren_fehler',
        fehler: mfaStepUpFehlerEinordnen({
          vorgang: 'list',
          ...securityFehlerAusUnbekannt(fehler),
        }),
      },
    }
  }
}

async function faktorNochVorhanden(
  auth: MfaStepUpAuth,
  faktorId: string,
): Promise<Extract<MfaStepUpEreignis, { typ: 'ausfuehren_fehler' }> | null> {
  const listFactors = auth.mfa?.listFactors
  if (typeof listFactors !== 'function') return null
  try {
    const antwort = await listFactors()
    if (antwort.error) {
      return {
        typ: 'ausfuehren_fehler',
        fehler: mfaStepUpFehlerEinordnen({
          vorgang: 'list',
          ...securityFehlerAusUnbekannt(antwort.error),
        }),
      }
    }
    const faktoren = totpFaktorenAusAntwort(antwort.data)
    if (!faktoren.some((faktor) => faktor.id === faktorId)) {
      return { typ: 'ausfuehren_fehler', fehler: mfaStepUpFehler('faktor_stale') }
    }
    return null
  } catch (fehler) {
    return {
      typ: 'ausfuehren_fehler',
      fehler: mfaStepUpFehlerEinordnen({
        vorgang: 'list',
        ...securityFehlerAusUnbekannt(fehler),
      }),
    }
  }
}

function sitzungAusfuehrenEreignisAusFehler(
  fehler: unknown,
): Extract<MfaStepUpEreignis, { typ: 'client_unbekannt' | 'client_ohne_sitzung' | 'ausfuehren_fehler' }> {
  const ereignis = sitzungEreignisAusFehler(fehler)
  if (ereignis.typ === 'plan_fehler') {
    return { typ: 'ausfuehren_fehler', fehler: ereignis.fehler }
  }
  return ereignis
}

function sitzungEreignisAusFehler(
  fehler: unknown,
): Extract<MfaStepUpEreignis, { typ: 'client_unbekannt' | 'client_ohne_sitzung' | 'plan_fehler' }> {
  const eingeordnet = mfaStepUpFehlerEinordnen({
    vorgang: 'sitzung',
    ...securityFehlerAusUnbekannt(fehler),
  })
  if (eingeordnet.code === 'unsupported') return { typ: 'client_unbekannt' }
  if (eingeordnet.code === 'session_required') return { typ: 'client_ohne_sitzung' }
  return { typ: 'plan_fehler', fehler: eingeordnet }
}

function istNetz(meldung: string, apiCode: string, status: number | null): boolean {
  return (
    status === 0 ||
    apiCode.includes('network') ||
    apiCode.includes('request_timeout') ||
    meldung.includes('failed to fetch') ||
    meldung.includes('networkerror') ||
    meldung.includes('load failed') ||
    (meldung.includes('network') && !meldung.includes('aal'))
  )
}

function istRateLimit(meldung: string, apiCode: string, status: number | null): boolean {
  return status === 429 || apiCode.includes('over_request') || meldung.includes('too many') || meldung.includes('rate limit')
}

function istSitzungFehlt(meldung: string, apiCode: string, status: number | null): boolean {
  return (
    status === 401 ||
    apiCode.includes('session_not_found') ||
    apiCode.includes('session_expired') ||
    apiCode.includes('bad_jwt') ||
    meldung.includes('auth session missing') ||
    meldung.includes('not authenticated')
  )
}

function istNichtUnterstuetzt(meldung: string, apiCode: string): boolean {
  return (
    apiCode.includes('not_supported') ||
    meldung.includes('not a function') ||
    meldung.includes('not supported') ||
    meldung.includes('nicht unterstützt') ||
    meldung.includes('not available') ||
    meldung.includes('not enabled')
  )
}

function istUngueltigerCode(meldung: string, apiCode: string): boolean {
  return (
    apiCode.includes('invalid') ||
    meldung.includes('invalid totp') ||
    meldung.includes('invalid code') ||
    meldung.includes('incorrect') ||
    meldung.includes('wrong code')
  )
}

function istAbgelaufen(meldung: string, apiCode: string): boolean {
  return apiCode.includes('expired') || meldung.includes('expired') || meldung.includes('challenge not found')
}

function istAal2Noetig(meldung: string, apiCode: string, status: number | null): boolean {
  return (
    status === 403 ||
    apiCode.includes('insufficient_aal') ||
    apiCode.includes('aal2') ||
    meldung.includes('aal2') ||
    meldung.includes('insufficient aal') ||
    meldung.includes('higher aal')
  )
}
