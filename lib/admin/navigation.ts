import { can, type Capability, type Role } from '@/lib/auth/roles'
import type { AdminGrant } from '@/lib/auth/admin-access'

export type AdminNavKind = 'ready' | 'later'

export type AdminNavItem = {
  href: string
  label: string
  kind: AdminNavKind
  /**
   * Nur UX-Hinweis. Server-Gates bleiben alleinige Autorisierung.
   * `null` = für jeden mit Admin-Bereichszugang sichtbar.
   */
  capability: Capability | null
}

export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  { href: '/admin', label: 'Steuerzentrale', kind: 'ready', capability: null },
  { href: '/admin/users', label: 'Nutzer', kind: 'ready', capability: 'konten-verwalten' },
  { href: '/admin/payments', label: 'Zahlungen', kind: 'ready', capability: 'betrieb-lesen' },
  { href: '/admin/security', label: 'Security', kind: 'ready', capability: 'betrieb-lesen' },
  { href: '/admin/system-health', label: 'System Health', kind: 'ready', capability: 'betrieb-lesen' },
  { href: '/admin/analytics', label: 'Analytics', kind: 'later', capability: null },
  { href: '/admin/content', label: 'Content', kind: 'later', capability: null },
  { href: '/admin/marketing', label: 'Marketing', kind: 'later', capability: null },
  { href: '/admin/settings', label: 'Einstellungen', kind: 'later', capability: null },
  { href: '/admin/localization', label: 'Lokalisierung', kind: 'later', capability: null },
] as const

export type AdminNavFilterInput = {
  role: Role | null
  grant: AdminGrant
}

/**
 * UX-Filter für die Sidebar. Versteckt keine Autorisierung.
 * Break-Glass sieht Seiten, die nur Bereichszugang brauchen; Nutzer bleibt
 * ausgeblendet, weil die Seite ohne Datenbankrolle selbst umleitet.
 */
export function filterAdminNav(
  items: readonly AdminNavItem[],
  input: AdminNavFilterInput,
): AdminNavItem[] {
  return items.filter((item) => adminNavItemSichtbar(item, input))
}

export function adminNavItemSichtbar(
  item: AdminNavItem,
  input: AdminNavFilterInput,
): boolean {
  if (item.kind === 'later') {
    return true
  }
  if (item.capability === null) {
    return true
  }
  if (input.role && can(input.role, item.capability)) {
    return true
  }
  if (input.grant === 'break-glass' && item.capability !== 'konten-verwalten') {
    return true
  }
  return false
}

/** Expliziter Vertrag für Tests: Ausblenden ist keine Autorisierung. */
export function adminNavIstNurUx(): true {
  return true
}
