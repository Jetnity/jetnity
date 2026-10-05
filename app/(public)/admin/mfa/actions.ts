'use server'

import { redirect } from 'next/navigation'

import { evaluateAdminAccess } from '@/lib/auth/admin-guard'
import { erlaubtesAdminZiel } from '@/lib/auth/admin-aal'

export type AdminMfaBestaetigung = {
  error?: string
}

/**
 * Belegt AAL2 nach der Client-Challenge erneut serverseitig.
 * Ein manipuliertes Return-Ziel landet immer auf einem internen Admin-Pfad.
 */
export async function bestaetigeAdminAal2Action(
  next: string | null | undefined,
): Promise<AdminMfaBestaetigung> {
  const ziel = erlaubtesAdminZiel(next)
  const decision = await evaluateAdminAccess({ surface: 'admin-mfa' })

  if (decision.allowed) redirect(ziel)
  if (decision.denial === 'unauthenticated') redirect('/admin/login')
  if (decision.denial === 'aal2-required') {
    return { error: 'Die Zwei-Faktor-Bestätigung ist noch nicht abgeschlossen.' }
  }
  if (decision.denial === 'aal-lookup-failed' || decision.denial === 'lookup-failed') {
    return { error: 'Die Berechtigung konnte gerade nicht geprüft werden. Bitte später erneut versuchen.' }
  }

  redirect('/unauthorized?grund=forbidden')
}
