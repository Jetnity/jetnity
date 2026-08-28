'use server'

import { createServerActionClient } from '@/lib/supabase/server'
import {
  logoutScopeAusfuehren,
  type LogoutAuth,
  type LogoutEreignis,
} from '@/lib/auth/account-logout-scopes'

export type AccountLogoutScopeErgebnis = Extract<
  LogoutEreignis,
  { typ: 'client_unbekannt' | 'client_ohne_sitzung' | 'ausfuehren_ok' | 'ausfuehren_fehler' }
>

function authVomServer(client: { auth: { getUser: LogoutAuth['getUser']; signOut?: LogoutAuth['signOut'] } }): LogoutAuth {
  return {
    getUser: () => client.auth.getUser(),
    signOut:
      typeof client.auth.signOut === 'function'
        ? (options) => client.auth.signOut({ scope: options.scope })
        : undefined,
  }
}

/**
 * Scoped Logout nur für `/account/security`.
 * Das allgemeine `signOutAction` bleibt unscoped und damit global.
 */
export async function accountLogoutScopeAction(scopeRoh: unknown): Promise<AccountLogoutScopeErgebnis> {
  const supabase = await createServerActionClient()
  return logoutScopeAusfuehren(authVomServer(supabase), scopeRoh)
}
