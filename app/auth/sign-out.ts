'use server'

import { redirect } from 'next/navigation'
import { createServerActionClient } from '@/lib/supabase/server'
import {
  GLOBALES_SIGN_OUT_ZIEL_ADMIN,
  GLOBALES_SIGN_OUT_ZIEL_PUBLIC,
  globalesSignOutAusAntwort,
  globalesSignOutAusWurf,
  globalesSignOutDarfWeiterleiten,
  type GlobalesSignOutErgebnis,
} from '@/lib/auth/globales-sign-out'

/**
 * Abmelden aus jedem Bereich heraus.
 *
 * Bewusst eine Server Action und kein `/logout`-Pfad: Ein Link, der beim
 * Aufruf abmeldet, wird von Next.js vorausgeladen und von Browsern
 * vorgeholt – die Sitzung endet dann, ohne dass jemand geklickt hat.
 *
 * Das Ziel steht im Code. Ein aus der Anfrage übernommenes
 * Weiterleitungsziel wäre eine offene Weiterleitung.
 * Weitergeleitet wird nur nach bestätigtem Erfolg.
 */
export async function signOutAction(
  vorher: GlobalesSignOutErgebnis | null,
  formular?: FormData,
): Promise<GlobalesSignOutErgebnis> {
  void vorher
  void formular
  const ergebnis = await allgemeinesSignOut(GLOBALES_SIGN_OUT_ZIEL_PUBLIC)
  if (globalesSignOutDarfWeiterleiten(ergebnis)) {
    redirect(ergebnis.ziel)
  }
  return ergebnis
}

/**
 * Gleiche Aktion, anderes Ziel – für den Administrationsbereich, damit man
 * dort nach dem Abmelden nicht auf der öffentlichen Startseite landet.
 *
 * Das Ziel steht bewusst im Code und kommt nicht aus dem Formular: Ein aus der
 * Anfrage übernommenes Weiterleitungsziel wäre eine offene Weiterleitung.
 */
export async function signOutToAdminLoginAction(
  vorher: GlobalesSignOutErgebnis | null,
  formular?: FormData,
): Promise<GlobalesSignOutErgebnis> {
  void vorher
  void formular
  const ergebnis = await allgemeinesSignOut(GLOBALES_SIGN_OUT_ZIEL_ADMIN)
  if (globalesSignOutDarfWeiterleiten(ergebnis)) {
    redirect(ergebnis.ziel)
  }
  return ergebnis
}

async function allgemeinesSignOut(
  ziel: typeof GLOBALES_SIGN_OUT_ZIEL_PUBLIC | typeof GLOBALES_SIGN_OUT_ZIEL_ADMIN,
): Promise<GlobalesSignOutErgebnis> {
  try {
    const supabase = await createServerActionClient()
    const { error } = await supabase.auth.signOut()
    return globalesSignOutAusAntwort(error, ziel)
  } catch (fehler) {
    return globalesSignOutAusWurf(fehler)
  }
}
