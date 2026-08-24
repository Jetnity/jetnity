// lib/account/navigation.ts
//
// Die kompakte Account-Navigation zeigt nur Ziele, die in AP-1 wirklich
// existieren. Reisende, Favoriten und Abonnement kommen später – tote oder
// „bald“-Links wären eine zweite, unfertige Informationsarchitektur.

export const ACCOUNT_NAVIGATION = [
  { label: 'Übersicht', href: '/account' },
  { label: 'Reisen', href: '/reisen' },
  { label: 'Einstellungen', href: '/account/settings' },
] as const

export type AccountNavigationsziel = (typeof ACCOUNT_NAVIGATION)[number]['href']

/**
 * Welcher Account-Punkt zum aktuellen Pfad gehört.
 *
 * `/account/security` liegt unter Einstellungen, nicht unter Übersicht.
 * `/account` selbst ist nur die Übersicht – kein Präfix-Match, sonst wäre
 * jede Unterseite gleichzeitig „Übersicht“.
 */
export function accountNavigationAktiv(pathname: string, href: string): boolean {
  if (href === '/account') return pathname === '/account' || pathname === '/account/'
  if (href === '/account/settings') {
    return (
      pathname === '/account/settings' ||
      pathname.startsWith('/account/settings/') ||
      pathname === '/account/security' ||
      pathname.startsWith('/account/security/')
    )
  }
  if (href === '/reisen') return pathname === '/reisen' || pathname.startsWith('/reisen/')
  return pathname === href || pathname.startsWith(`${href}/`)
}
