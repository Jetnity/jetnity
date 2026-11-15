'use client'

import { createBrowserClient } from '@/lib/supabase/client'

export type KontoBeobachter = (benutzerId: string, beiWechsel: () => void) => () => void

// Browser events invalidate the screen; the Server Action alone authorizes
// a write through a fresh getUser() on the request's own session.
export const beobachteEinstellungenKonto: KontoBeobachter = (benutzerId, beiWechsel) => {
  try {
    const client = createBrowserClient()
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      if (!session?.user?.id || session.user.id !== benutzerId) beiWechsel()
    })
    return () => data.subscription.unsubscribe()
  } catch {
    beiWechsel()
    return () => undefined
  }
}
