'use server'

import { redirect } from 'next/navigation'
import { createServerActionClient } from '@/lib/supabase/server'

/**
 * Abmelden aus jedem Bereich heraus.
 *
 * Bewusst eine Server Action und kein `/logout`-Pfad: Ein Link, der beim
 * Aufruf abmeldet, wird von Next.js vorausgeladen und von Browsern
 * vorgeholt – die Sitzung endet dann, ohne dass jemand geklickt hat.
 */
export async function signOutAction() {
  const supabase = createServerActionClient()
  await supabase.auth.signOut()
  redirect('/')
}
