// lib/account/navigation.ts
//
// Die kompakte Account-Navigation zeigt nur Ziele, die wirklich existieren.
// Favoriten und Abonnement bleiben bewusst draußen.

export const ACCOUNT_NAVIGATION = [
  { label: 'Übersicht', href: '/account' },
  { label: 'Reisende', href: '/account/travellers' },
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
  if (href === '/account/travellers') {
    return pathname === '/account/travellers' || pathname.startsWith('/account/travellers/')
  }
  if (href === '/reisen') return pathname === '/reisen' || pathname.startsWith('/reisen/')
  return pathname === href || pathname.startsWith(`${href}/`)
}
