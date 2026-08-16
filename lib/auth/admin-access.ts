// lib/auth/admin-access.ts
//
// Die Zugangsentscheidung für den Administrationsbereich – als reine Funktion.
//
// Absichtlich ohne Next-, Supabase- oder Umgebungszugriff: Wer entscheidet,
// bekommt alle Eingaben übergeben. Dadurch ist jeder Pfad einzeln testbar,
// insbesondere der Fehlerfall, der früher stillschweigend zu einer Freigabe
// über die E-Mail-Domain führte.

import { canAccessAdminArea, hasAtLeast, type Role } from '@/lib/auth/roles'

/**
 * Ergebnis der Rollenabfrage. Der Unterschied zwischen „keine Rolle
 * hinterlegt“ und „Abfrage fehlgeschlagen“ ist wesentlich: Nur der erste Fall
 * ist eine Aussage über die Berechtigung, der zweite ist ein Ausfall.
 */
export type RoleLookup =
  | { status: 'ok'; role: Role }
  | { status: 'unknown' }
  | { status: 'failed'; reason: string }

export type AdminUser = {
  id: string
  email: string | null
}

/** Warum ein Zugriff gilt – für Protokollierung und Tests. */
export type AdminGrant = 'role' | 'break-glass'

export type AdminDenial = 'unauthenticated' | 'forbidden' | 'lookup-failed'

export type AdminDecision =
  | { allowed: true; grant: AdminGrant; role: Role | null }
  | { allowed: false; denial: AdminDenial }

/**
 * Liest die Break-Glass-Allowlist aus `ADMIN_ALLOWED_EMAILS`.
 *
 * Ausschliesslich exakte E-Mail-Adressen. Es gibt bewusst keinen
 * Domain-Fallback und keine im Quellcode hinterlegte Vorbelegung: Eine Domain
 * allein erteilt keine Administrationsrechte, und wer die Liste nicht setzt,
 * hat keinen Notzugang – nicht versehentlich einen offenen.
 */
export function parseBreakGlassAllowlist(raw: string | null | undefined): ReadonlySet<string> {
  if (!raw) return new Set()
  return new Set(
    raw
      .split(',')
      .map(entry => entry.trim().toLowerCase())
      .filter(isPlainAddress),
  )
}

/**
 * Nur vollständige Adressen zählen. Eine Domain, ein Platzhalter oder ein
 * halber Eintrag wird verworfen und nicht als Zeichenkette aufbewahrt – sonst
 * stünde in der Liste etwas, das nach einer Regel aussieht, aber keine ist.
 */
function isPlainAddress(entry: string): boolean {
  const parts = entry.split('@')
  if (parts.length !== 2) return false

  const [local, domain] = parts
  if (!local || /[*?\s]/.test(local)) return false
  if (!domain.includes('.') || /[*?\s]/.test(domain)) return false
  if (domain.startsWith('.') || domain.endsWith('.')) return false

  return true
}

export function isBreakGlassEmail(
  email: string | null | undefined,
  allowlist: ReadonlySet<string>,
): boolean {
  if (!email) return false
  return allowlist.has(email.trim().toLowerCase())
}

/**
 * Entscheidet über den Zugang zum Administrationsbereich.
 *
 * Reihenfolge:
 *
 * 1. Ohne verifizierte Identität gibt es keinen Zugang.
 * 2. Reguläre Quelle ist die Rolle aus der Datenbank.
 * 3. Der ausdrücklich konfigurierte Notzugang greift, wenn die Rolle nicht
 *    reicht oder nicht ermittelbar war. Das ist genau sein Zweck, deshalb wirkt
 *    er auch bei einem Ausfall der Rollenabfrage – der Aufrufer protokolliert
 *    jede solche Nutzung.
 * 4. Ist die Rollenabfrage fehlgeschlagen und kein Notzugang konfiguriert,
 *    wird abgelehnt. Ein Ausfall wird nie zu einer Freigabe.
 */
export function decideAdminAccess(input: {
  user: AdminUser | null
  lookup: RoleLookup
  allowlist: ReadonlySet<string>
  /** Optional höhere Anforderung als der reine Bereichszugang. */
  minimumRole?: Role
}): AdminDecision {
  const { user, lookup, allowlist, minimumRole } = input

  if (!user) return { allowed: false, denial: 'unauthenticated' }

  const role = lookup.status === 'ok' ? lookup.role : null

  if (role && canAccessAdminArea(role) && (!minimumRole || hasAtLeast(role, minimumRole))) {
    return { allowed: true, grant: 'role', role }
  }

  if (isBreakGlassEmail(user.email, allowlist)) {
    return { allowed: true, grant: 'break-glass', role }
  }

  if (lookup.status === 'failed') {
    return { allowed: false, denial: 'lookup-failed' }
  }

  return { allowed: false, denial: 'forbidden' }
}

/** HTTP-Status, den eine API-Route für eine Ablehnung senden muss. */
export function statusForDenial(denial: AdminDenial): 401 | 403 | 503 {
  switch (denial) {
    case 'unauthenticated':
      return 401
    case 'forbidden':
      return 403
    case 'lookup-failed':
      return 503
  }
}

/** Kurze, nicht ausplaudernde Begründung für eine API-Antwort. */
export function messageForDenial(denial: AdminDenial): string {
  switch (denial) {
    case 'unauthenticated':
      return 'Nicht angemeldet.'
    case 'forbidden':
      return 'Keine Berechtigung für diesen Bereich.'
    case 'lookup-failed':
      return 'Berechtigung konnte derzeit nicht geprüft werden.'
  }
}
