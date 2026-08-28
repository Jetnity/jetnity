// lib/modell/gast-cookie.ts
//
// Der sichtbare Vertrag der Gast-Quota-Kennung. Das Schreiben des Cookies
// bleibt in `kontingent.ts`; hier liegt nur, was ohne Request-Kontext
// prüfbar sein muss.

export const GAST_COOKIE_VERTRAG = {
  name: 'jetnity_gast',
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAgeTage: 30,
  muster: /^[0-9a-f]{32}$/,
} as const

export function istGueltigeGastkennung(wert: string | undefined): wert is string {
  return Boolean(wert && GAST_COOKIE_VERTRAG.muster.test(wert))
}
