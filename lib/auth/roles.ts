// lib/auth/roles.ts
//
// Einzige Quelle für das Jetnity-Rollenmodell.
//
// Vor Phase 1.3 existierten vier voneinander abweichende Rollenlisten (Guard,
// Users-Seite, Server-Actions, Tabellen-Komponente). Jede Ergänzung musste an
// vier Stellen nachgezogen werden, und die Reihenfolgen widersprachen sich.
// Alle Rollenentscheidungen laufen deshalb ab jetzt über dieses Modul.
//
// Bewusst frei von Next- und Supabase-Importen, damit die Regeln ohne Laufzeit
// und ohne Datenbank getestet werden können.

export const ROLES = ['user', 'creator', 'moderator', 'operator', 'admin', 'owner'] as const

export type Role = (typeof ROLES)[number]

/** Rolle, die ein Konto ohne hinterlegte Rolle erhält. */
export const DEFAULT_ROLE: Role = 'user'

/**
 * Rangfolge der Rollen. Die Abstände sind absichtlich grob gewählt, damit
 * später Zwischenstufen ergänzt werden können, ohne bestehende Werte zu ändern.
 */
const RANK: Record<Role, number> = {
  user: 0,
  creator: 10,
  moderator: 20,
  operator: 30,
  admin: 40,
  owner: 50,
}

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value)
}

/**
 * Wandelt einen Datenbank- oder Formularwert in eine Rolle um.
 * Gibt `null` zurück, wenn der Wert keine bekannte Rolle ist – der Aufrufer
 * entscheidet dann bewusst, was das bedeutet, statt stillschweigend auf eine
 * Standardrolle zu fallen.
 */
export function parseRole(value: unknown): Role | null {
  if (typeof value !== 'string') return null
  const normalised = value.trim().toLowerCase()
  return isRole(normalised) ? normalised : null
}

export function rankOf(role: Role): number {
  return RANK[role]
}

/** Trifft die Rolle mindestens die geforderte Stufe? */
export function hasAtLeast(role: Role, minimum: Role): boolean {
  return RANK[role] >= RANK[minimum]
}

/** Ab dieser Stufe darf ein Konto den Administrationsbereich betreten. */
const ADMIN_AREA_MINIMUM: Role = 'moderator'

export function canAccessAdminArea(role: Role): boolean {
  return hasAtLeast(role, ADMIN_AREA_MINIMUM)
}

/** Darf Konten sehen und Status ändern. */
export function canManageUsers(role: Role): boolean {
  return hasAtLeast(role, 'moderator')
}

/**
 * Darf `actor` die Rolle von `target` auf `next` setzen?
 *
 * Zwei Regeln verhindern eine Rechteausweitung:
 *
 * 1. Niemand ändert die eigene Rolle. Damit ist eine Selbstbeförderung
 *    ausgeschlossen und niemand sperrt sich selbst versehentlich aus.
 * 2. Nur wer echt höher steht, darf eingreifen – sowohl gegenüber der
 *    bisherigen als auch gegenüber der künftigen Rolle. Ein Moderator kann so
 *    keinen Administrator ernennen, und ein Administrator keinen zweiten.
 *
 * Der Owner ist die einzige Ausnahme: Er darf jede Rolle vergeben, auch die
 * eigene Stufe, damit eine Nachfolge überhaupt eingerichtet werden kann.
 */
export function canAssignRole(args: {
  actorRole: Role
  actorId: string
  targetId: string
  currentTargetRole: Role
  nextRole: Role
}): boolean {
  const { actorRole, actorId, targetId, currentTargetRole, nextRole } = args

  if (!canManageUsers(actorRole)) return false
  if (actorId === targetId) return false

  if (actorRole === 'owner') return true

  return rankOf(actorRole) > rankOf(currentTargetRole) && rankOf(actorRole) > rankOf(nextRole)
}

/** Rollen, die `actor` überhaupt vergeben kann – Grundlage für Auswahlfelder. */
export function assignableRoles(actorRole: Role): Role[] {
  if (actorRole === 'owner') return [...ROLES]
  if (!canManageUsers(actorRole)) return []
  return ROLES.filter(role => rankOf(actorRole) > rankOf(role))
}

export const ROLE_LABELS: Record<Role, string> = {
  user: 'Nutzer',
  creator: 'Creator',
  moderator: 'Moderation',
  operator: 'Betrieb',
  admin: 'Administration',
  owner: 'Inhaber',
}

export const ACCOUNT_STATUSES = ['active', 'pending', 'disabled', 'banned'] as const

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number]

export function isAccountStatus(value: unknown): value is AccountStatus {
  return typeof value === 'string' && (ACCOUNT_STATUSES as readonly string[]).includes(value)
}
