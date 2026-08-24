// lib/auth/naechstes-ziel.ts
//
// Wohin Login/Register nach Erfolg gehen dürfen. Nur relative Pfade unter
// /account* und /reisen*. Alles andere fällt auf den sicheren Default.

export const SICHERES_NACH_ANMELDUNG = '/reisen'

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

function pfadErlaubt(pathname: string): boolean {
  return (
    pathname === '/account' ||
    pathname.startsWith('/account/') ||
    pathname === '/reisen' ||
    pathname.startsWith('/reisen/')
  )
}

/**
 * Liefert nur ein erlaubtes internes Ziel. Ungültige, fremde oder
 * ausserhalb der Allowlist liegende Werte werden verworfen.
 */
export function erlaubtesNaechstesZiel(roh: string | null | undefined): string {
  if (typeof roh !== 'string') return SICHERES_NACH_ANMELDUNG
  const url = alsInternerUrl(roh)
  if (!url || !pfadErlaubt(url.pathname)) return SICHERES_NACH_ANMELDUNG
  return `${url.pathname}${url.search}${url.hash}`
}

/**
 * Wohin eine Login-/Register-Seite einen bereits belegten User schickt.
 * Ohne vertrauenswürdigen User bleibt die Seite stehen.
 */
export function anmeldeSeiteZiel(
  user: { id: string } | null | undefined,
  next: string | null | undefined,
): string | null {
  if (!user?.id) return null
  return erlaubtesNaechstesZiel(next)
}
