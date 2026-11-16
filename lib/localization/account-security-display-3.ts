import type { UiSprache } from './ui-sprache'
import { sicherheitText, type SicherheitTextSchluessel } from './account-security-texte'
import { PASSWORT_RICHTLINIE } from '@/lib/auth/passwort-richtlinie'
import type { PasswortAenderungSchritt, PasswortAenderungZustand } from '@/lib/auth/account-password-aenderung'
import { LOKAL_HINWEIS_LABEL, type SitzungAal, type SitzungLage, type SitzungZustand } from '@/lib/auth/account-session-view'
import type { LogoutLage, LogoutScope, LogoutZustand } from '@/lib/auth/account-logout-scopes'
import type { MfaStepUpLage, MfaStepUpZustand } from '@/lib/auth/account-mfa-step-up'

// These mappings project the existing state machines. They never decide whether
// an action is allowed, change a state, or infer success from translated copy.
const PASSWORT_STATUS = {
  idle: 'password.status.idle', requesting_code: 'password.status.requesting_code',
  code_sent: 'password.status.code_sent', verifying: 'password.status.verifying',
  updating: 'password.status.updating', success: 'password.status.success', error: 'password.status.error',
  unsupported: 'password.error.reauth_unsupported', unavailable: 'password.error.reauth_unavailable',
} as const satisfies Record<PasswortAenderungSchritt, SicherheitTextSchluessel>

export function sicherheitPasswortStatus(sprache: UiSprache, zustand: PasswortAenderungZustand): string {
  const fehler = ['error', 'unsupported', 'unavailable'].includes(zustand.schritt) ? zustand.fehler : null
  return sicherheitText(sprache, fehler ? `password.error.${fehler.code}` : PASSWORT_STATUS[zustand.schritt], {
    minimum: PASSWORT_RICHTLINIE.mindestlaenge,
  })
}

export function sicherheitPasswortStaerke(sprache: UiSprache, punkte: number): string {
  const schluessel = ['password.strength.0', 'password.strength.1', 'password.strength.2', 'password.strength.3', 'password.strength.4'] as const
  return sicherheitText(sprache, schluessel[Math.max(0, punkte - 1)] ?? 'password.strength.0')
}

export function sicherheitPasswortRegeln(sprache: UiSprache): string[] {
  return [
    sicherheitText(sprache, 'password.minimum', { minimum: PASSWORT_RICHTLINIE.mindestlaenge }),
    sicherheitText(sprache, 'password.rule.letters'),
    sicherheitText(sprache, 'password.rule.number'),
    sicherheitText(sprache, 'password.rule.symbol'),
  ]
}

const SITZUNG_STATUS = {
  loading: 'session.status.loading', current: 'session.status.current',
  unavailable: 'session.error.session_required', unsupported: 'session.error.unsupported', error: 'session.error.unknown',
} as const satisfies Record<SitzungLage, SicherheitTextSchluessel>

export function sicherheitSitzungStatus(sprache: UiSprache, zustand: SitzungZustand): string {
  const fehler = ['error', 'unsupported', 'unavailable'].includes(zustand.lage) ? zustand.fehler : null
  return sicherheitText(sprache, fehler ? `session.error.${fehler.code}` : SITZUNG_STATUS[zustand.lage])
}

export function sicherheitSitzungAal(sprache: UiSprache, aal: SitzungAal | null): string | null {
  return aal ? sicherheitText(sprache, `session.${aal}`) : null
}

export function sicherheitSitzungAblauf(sprache: UiSprache, unix: number | null): string | null {
  if (!unix || !Number.isFinite(unix)) return null
  const date = new Intl.DateTimeFormat(sprache === 'en' ? 'en-GB' : 'de-CH', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(unix * 1000))
  return sicherheitText(sprache, 'session.expiry', { date })
}

/** Only replace the known UI prefix. The existing sanitized browser/platform facts are unchanged. */
export function sicherheitLokalerHinweis(sprache: UiSprache, text: string): string {
  const prefix = `${LOKAL_HINWEIS_LABEL}: `
  return text.startsWith(prefix) ? `${sicherheitText(sprache, 'session.localLabel')}: ${text.slice(prefix.length)}` : text
}

export function sicherheitLogoutAktion(sprache: UiSprache, scope: LogoutScope): { label: string; beschreibung: string } {
  return {
    label: sicherheitText(sprache, `logout.action.${scope}.label`),
    beschreibung: sicherheitText(sprache, `logout.action.${scope}.description`),
  }
}

const LOGOUT_STATUS = {
  idle: 'logout.status.idle', working: 'logout.status.working', success: 'logout.status.success', error: 'logout.status.error',
  unavailable: 'logout.error.unavailable', unsupported: 'logout.error.unsupported',
} as const satisfies Record<LogoutLage, SicherheitTextSchluessel>

export function sicherheitLogoutStatus(sprache: UiSprache, zustand: LogoutZustand): string {
  if (zustand.lage === 'success' && zustand.scope) {
    return `${sicherheitText(sprache, `logout.success.${zustand.scope}`)} ${sicherheitText(sprache, 'logout.jwtHint')}`
  }
  if (['error', 'unsupported', 'unavailable'].includes(zustand.lage) && zustand.fehler) {
    return sicherheitText(sprache, `logout.error.${zustand.fehler.code}`)
  }
  if (zustand.lage === 'working' && zustand.scope) {
    return sicherheitText(sprache, 'logout.status.scopeWorking', { action: sicherheitLogoutAktion(sprache, zustand.scope).label })
  }
  if (zustand.bestaetigungFuer === 'global') return sicherheitText(sprache, 'logout.status.confirm')
  return sicherheitText(sprache, LOGOUT_STATUS[zustand.lage])
}

const STEP_UP_STATUS = {
  idle: 'step.status.idle', working: 'step.status.working', success: 'step.status.success', error: 'step.status.error',
  unavailable: 'step.error.unavailable', unsupported: 'step.error.unsupported',
} as const satisfies Record<MfaStepUpLage, SicherheitTextSchluessel>

export function sicherheitStepUpStatus(sprache: UiSprache, zustand: MfaStepUpZustand): string {
  if (['error', 'unsupported', 'unavailable'].includes(zustand.lage) && zustand.fehler) {
    return sicherheitText(sprache, `step.error.${zustand.fehler.code}`)
  }
  if (zustand.lage === 'working' && zustand.phase === 'warte_auf_code') return sicherheitText(sprache, 'step.status.working')
  if (zustand.phase === 'warte_auf_code') return sicherheitText(sprache, 'step.description')
  if (zustand.lage === 'working' && ['pruefen', 'entfernen', 'bestaetigen'].includes(zustand.phase)) {
    const schluessel = {
      pruefen: 'step.phase.pruefen', entfernen: 'step.phase.entfernen', bestaetigen: 'step.phase.bestaetigen',
    } as const
    return sicherheitText(sprache, schluessel[zustand.phase as keyof typeof schluessel])
  }
  return sicherheitText(sprache, STEP_UP_STATUS[zustand.lage])
}

export function sicherheitFaktorStatus(sprache: UiSprache, status: string | null): string | null {
  if (status === 'verified') return sicherheitText(sprache, 'totp.verified')
  if (status === 'unverified') return sicherheitText(sprache, 'totp.unverified')
  return null
}
