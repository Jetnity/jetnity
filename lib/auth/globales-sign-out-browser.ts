import type { GlobalesSignOutErgebnis, GlobalesSignOutZiel } from './globales-sign-out'

/**
 * The server Action remains primary and preserves its unscoped/global
 * revocation semantics. If it reports a failure, the already-signed-in
 * browser may retry the SAME global auth.signOut() with the session it owns.
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
    if (session.error || session.data?.session) return failed
    navigate(ziel)
    return { ok: true, ziel }
  } catch {
    return failed
  }
}
