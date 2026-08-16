'use server'

import { redirect } from 'next/navigation'
import { createServerActionClient } from '@/lib/supabase/server'
import { evaluateAdminAccess } from '@/lib/auth/admin-guard'

export type AuthState = {
  ok?: boolean
  error?: string
  magicSent?: boolean
}

/**
 * Hier stand bis Phase 1.3 eine zweite Zugangsliste – mit drei fest im
 * Quellcode hinterlegten Adressen und demselben `@jetnity.com`-Fallback wie im
 * Guard. Sie hatte zwei Nachteile:
 *
 * 1. Wer seine Berechtigung aus einer Datenbankrolle bezog, kam über dieses
 *    Formular trotzdem nicht hinein.
 * 2. Die Meldung „Diese E-Mail ist nicht freigegeben“ verriet vor der
 *    Anmeldung, welche Adressen Administrationsrechte haben.
 *
 * Das Formular beantwortet deshalb nur noch die Frage der Anmeldung. Über den
 * Zugang entscheidet danach dieselbe zentrale Stelle wie überall sonst.
 */
export async function signInWithPasswordAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!email) return { error: 'Bitte E-Mail eingeben.' }
  if (!password) return { error: 'Bitte Passwort eingeben.' }

  const supabase = createServerActionClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  const decision = await evaluateAdminAccess({ surface: 'admin-login' })

  if (!decision.allowed) {
    // Ohne Berechtigung endet die Sitzung sofort wieder, damit dieses
    // Formular keine angemeldete Sitzung für andere Bereiche hinterlässt.
    await supabase.auth.signOut()
    return {
      error:
        decision.denial === 'lookup-failed'
          ? 'Die Berechtigung konnte gerade nicht geprüft werden. Bitte später erneut versuchen.'
          : 'Dieses Konto hat keinen Zugang zur Administration.',
    }
  }

  redirect('/admin')
}

export async function sendMagicLinkAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!email) return { error: 'Bitte E-Mail eingeben.' }

  const supabase = createServerActionClient()
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${site}/admin` },
  })

  if (error) {
    console.error('[admin-login] Magic-Link konnte nicht gesendet werden:', error.message)
  }

  // Immer dieselbe Antwort: Ob es zu dieser Adresse ein Konto gibt und ob es
  // berechtigt ist, gehört nicht in eine öffentliche Formularmeldung.
  return { ok: true, magicSent: true }
}
