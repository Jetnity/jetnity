import type { GlobalesSignOutErgebnis, GlobalesSignOutZiel } from './globales-sign-out'

/**
 * The browser owns the authenticated session and tries the same unscoped/
 * global auth.signOut() first; the Server Action remains the fallback.
 * Remote success alone is insufficient if the local browser remains signed in.
 * Neither local-only scope nor manual cookie deletion are acceptable:
 * a successful redirect needs confirmed remote revocation AND no local session.
 */
export async function signOutBrowserFallback(
  failed: GlobalesSignOutErgebnis,
  auth: {
    signOut: () => Promise<{ error: unknown }>
    getSession: () => Promise<{ data: { session: unknown | null }; error: unknown }>
  },
  ziel: GlobalesSignOutZiel,
  navigate: (destination: GlobalesSignOutZiel) => void,
): Promise<GlobalesSignOutErgebnis> {
  if (failed.ok) return failed
  try {
    const { error } = await auth.signOut()
    if (error) return failed
    const session = await auth.getSession()
    if (session.error || session.data?.session !== null) return failed
    navigate(ziel)
    return { ok: true, ziel }
  } catch {
    return failed
  }
}
