// lib/account/navigation.ts
//
// Die kompakte Account-Navigation zeigt nur Ziele, die wirklich existieren.
// Favoriten und Abonnement bleiben bewusst draußen.

export const ACCOUNT_NAVIGATION = [
  { label: 'Übersicht', href: '/account' },
  { label: 'Reisen', href: '/reisen' },
  { label: 'Reisende', href: '/account/travellers' },
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

/**
 * Nur die waagrechte Verschiebung, damit ein aktiver Tab in der Leiste
 * sichtbar wird. `null` heisst: er liegt schon im sichtbaren Bereich.
 * Bewusst kein vertikales `scrollIntoView`, damit die Seite nicht springt.
 */
export function accountNavigationScrollDelta(
  leiste: Pick<DOMRect, 'left' | 'width'>,
  aktiv: Pick<DOMRect, 'left' | 'width'>,
): number | null {
  const leisteRechts = leiste.left + leiste.width
  const aktivRechts = aktiv.left + aktiv.width
  const sichtbar = aktiv.left >= leiste.left - 1 && aktivRechts <= leisteRechts + 1
  if (sichtbar) return null
  return aktiv.left - leiste.left - (leiste.width - aktiv.width) / 2
}
