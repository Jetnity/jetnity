// lib/auth/admin-aal.ts
//
// AAL2-Wahrheit für den Administrationsbereich – als reine Funktion.
//
// Entscheidend ist ausschliesslich die aktuell erreichte Assurance
// (`currentLevel === 'aal2'`). `nextLevel`, die Existenz eines TOTP-Faktors
// oder eine frühere Anmeldung ersetzen das nicht. Der Guard wendet diese
// Regel an, nachdem Rolle/Capability bzw. Break-Glass schon entschieden haben;
// Break-Glass umgeht AAL2 deshalb nicht.

import type { AdminDecision, AdminDenial } from '@/lib/auth/admin-access'

export const ADMIN_STEP_UP_PFAD = '/admin/mfa'
export const SICHERES_ADMIN_ZIEL = '/admin'
export const ADMIN_MFA_EINRICHTUNG = '/account/security'

export type AuthenticatorAssuranceLevel = 'aal1' | 'aal2'

export type AalLookup =
  | { status: 'ok'; currentLevel: AuthenticatorAssuranceLevel }
  | { status: 'failed'; reason: string }

export type AdminLoginFortgang =
  | { art: 'freigeben' }
  | { art: 'step-up' }
  | { art: 'ablehnen'; denial: Exclude<AdminDenial, 'aal2-required'> }

/**
 * Liest nur `currentLevel`. `nextLevel` darf niemals eine Freigabe begründen.
 */
export function parseAalLookup(
  data: { currentLevel?: string | null; nextLevel?: string | null } | null | undefined,
  error?: { message?: string } | null,
): AalLookup {
  if (error) {
    return { status: 'failed', reason: error.message?.trim() || 'AAL nicht lesbar' }
  }

  const current = data?.currentLevel
  if (current === 'aal1' || current === 'aal2') {
    return { status: 'ok', currentLevel: current }
  }

  return { status: 'failed', reason: 'AAL ohne belastbare currentLevel' }
}

export function istAktuellesAal2(aal: AalLookup): boolean {
  return aal.status === 'ok' && aal.currentLevel === 'aal2'
}

/**
 * Hängt die AAL2-Pflicht an eine bereits getroffene Zugangsentscheidung.
 *
 * Eine Ablehnung wegen Rolle/Capability bleibt unverändert – auch wenn AAL2
 * vorläge. Nur eine vorherige Freigabe kann an AAL scheitern.
 */
export function applyAdminAal(decision: AdminDecision, aal: AalLookup): AdminDecision {
  if (!decision.allowed) return decision
  if (aal.status === 'failed') return { allowed: false, denial: 'aal-lookup-failed' }
  if (aal.currentLevel !== 'aal2') return { allowed: false, denial: 'aal2-required' }
  return decision
}

/**
 * Nach Passwortlogin: AAL1-Admins behalten die Sitzung für den Step-up.
 * Fehlende Rolle oder Rollenausfall beenden die Sitzung wie bisher.
 * Ein AAL-Ausfall beendet sie nicht – das Konto ist berechtigt, nur die
 * Assurance war nicht prüfbar.
 */
export function entscheideAdminLoginFortgang(decision: AdminDecision): AdminLoginFortgang {
  if (decision.allowed) return { art: 'freigeben' }
  if (decision.denial === 'aal2-required') return { art: 'step-up' }
  return { art: 'ablehnen', denial: decision.denial }
}

export function adminLoginSollAbmelden(fortgang: AdminLoginFortgang): boolean {
  return fortgang.art === 'ablehnen' && fortgang.denial !== 'aal-lookup-failed'
}

function wiederholtDekodieren(wert: string): string | null {
  let aktuell = wert
  for (let i = 0; i < 4; i += 1) {
    try {
      const naechstes = decodeURIComponent(aktuell)
      if (naechstes === aktuell) return aktuell
      aktuell = naechstes
    } catch {
      return null
    }
  }
  return null
}

function alsInternerUrl(roh: string): URL | null {
  const getrimmt = roh.trim()
  if (!getrimmt) return null
  if (getrimmt.includes('\\') || getrimmt.includes('\0')) return null

  const dekodiert = wiederholtDekodieren(getrimmt)
  if (!dekodiert) return null
  if (/^[a-zA-Z][a-zA-Z+\-.]*:/.test(dekodiert)) return null
  if (dekodiert.startsWith('//')) return null
  if (!dekodiert.startsWith('/')) return null

  try {
    const url = new URL(dekodiert, 'https://jetnity.invalid')
    if (url.origin !== 'https://jetnity.invalid') return null
    if (url.username || url.password) return null
    return url
  } catch {
    return null
  }
}

function istAdminLoginOderStepUp(pathname: string): boolean {
  return (
    pathname === '/admin/login' ||
    pathname.startsWith('/admin/login/') ||
    pathname === ADMIN_STEP_UP_PFAD ||
    pathname.startsWith(`${ADMIN_STEP_UP_PFAD}/`)
  )
}

function istErlaubtesAdminPfad(pathname: string): boolean {
  if (istAdminLoginOderStepUp(pathname)) return false
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

/**
 * Nur interne Admin-Ziele. Login- und Step-up-Pfade sind ausgeschlossen,
 * damit nach erfolgreichem AAL2 kein Redirect-Loop entsteht. Fremde Hosts
 * und Consumer-Pfade fallen auf `/admin`.
 */
export function erlaubtesAdminZiel(roh: string | null | undefined): string {
  if (typeof roh !== 'string') return SICHERES_ADMIN_ZIEL
  const url = alsInternerUrl(roh)
  if (!url || !istErlaubtesAdminPfad(url.pathname)) return SICHERES_ADMIN_ZIEL
  return `${url.pathname}${url.search}${url.hash}`
}

export function istKeinTotpFaktorFehler(error: unknown): boolean {
  return error instanceof Error && /kein totp-faktor/i.test(error.message)
}
