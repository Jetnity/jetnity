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
  const supabase = await createServerActionClient()
  await supabase.auth.signOut()
  redirect('/')
}

/**
 * Gleiche Aktion, anderes Ziel – für den Administrationsbereich, damit man
 * dort nach dem Abmelden nicht auf der öffentlichen Startseite landet.
 *
 * Das Ziel steht bewusst im Code und kommt nicht aus dem Formular: Ein aus der
 * Anfrage übernommenes Weiterleitungsziel wäre eine offene Weiterleitung.
 */
export async function signOutToAdminLoginAction() {
  const supabase = await createServerActionClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
