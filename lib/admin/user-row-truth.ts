// Wahrheit der angezeigten Kontenzeile.
//
// Unbekannte gespeicherte Rollen und Status bleiben unbekannt. Es gibt keine
// stillschweigende Nutzerrolle und keinen stillschweigenden Aktivstatus.
// Die Server-Actions bleiben die einzige Autorität für eine tatsächliche
// Änderung. Dieses Modul entscheidet nur, ob die Oberfläche eine Änderung
// überhaupt anbieten darf.

import {
  isAccountStatus,
  parseRole,
  rankOf,
  type AccountStatus,
  type Role,
} from '@/lib/auth/roles'

/** Sichtbare Kennung: leer, Zwischenraum und Steuerzeichen sind nicht sendbar. */
const DISPATCHABLE_USER_ID = /^[A-Za-z0-9_-]{1,128}$/

export function isDispatchableUserId(value: string): boolean {
  return DISPATCHABLE_USER_ID.test(value)
}

export function displayedStoredUserId(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

/** Bekannte Rolle oder `null`. Niemals die Vorgaberolle als Ersatz. */
export function displayedStoredRole(value: unknown): Role | null {
  return parseRole(value)
}

/** Bekannter Status oder `null`. Niemals `active` als Ersatz. */
export function displayedStoredStatus(value: unknown): AccountStatus | null {
  return typeof value === 'string' && isAccountStatus(value) ? value : null
}

export type MutationBlockReason =
  | 'malformed-identity'
  | 'unknown-role'
  | 'unknown-status'
  | 'self'
  | 'rank'

export function mutationBlockReason(args: {
  userId: string
  role: Role | null
  status: AccountStatus | null
  actorId: string
  actorRole: Role
}): MutationBlockReason | null {
  if (args.userId === args.actorId) return 'self'
  if (!isDispatchableUserId(args.userId)) return 'malformed-identity'
  if (!args.role) return 'unknown-role'
  if (!args.status) return 'unknown-status'
  if (args.actorRole === 'owner') return null
  if (rankOf(args.actorRole) > rankOf(args.role)) return null
  return 'rank'
}

/** Dieselbe Umschaltung wie bisher: gesperrt wird entsperrt, alles andere gesperrt. */
export function banToggleTarget(status: AccountStatus): AccountStatus {
  return status === 'banned' ? 'active' : 'banned'
}
