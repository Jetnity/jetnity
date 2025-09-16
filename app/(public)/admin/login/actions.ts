'use server'

import { redirect } from 'next/navigation'
import { createServerActionClient } from '@/lib/supabase/server'

export type AuthState = {
  ok?: boolean
  error?: string
  magicSent?: boolean
}

const ALLOW = new Set(
  (process.env.ADMIN_ALLOWED_EMAILS ??
    'feirovsasa@icloud.com,info@pazzar.ch,info@jetnity.com'
  )
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
)

function emailAllowed(email?: string | null) {
  const e = (email ?? '').toLowerCase()
  if (!e) return false
  if (ALLOW.size > 0 && ALLOW.has(e)) return true
  return e.endsWith('@jetnity.com') // Fallback
}

export async function signInWithPasswordAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!email) return { error: 'Bitte E-Mail eingeben.' }
  if (!password) return { error: 'Bitte Passwort eingeben.' }
  if (!emailAllowed(email)) return { error: 'Diese E-Mail ist nicht freigegeben.' }

  const supabase = createServerActionClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  // Doppelt absichern
  const { data: auth } = await supabase.auth.getUser()
  const userEmail = auth?.user?.email?.toLowerCase()
  if (!emailAllowed(userEmail)) {
    await supabase.auth.signOut()
    return { error: 'Diese E-Mail ist nicht freigegeben.' }
  }

  redirect('/admin')
}

export async function sendMagicLinkAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!email) return { error: 'Bitte E-Mail eingeben.' }
  if (!emailAllowed(email)) return { error: 'Diese E-Mail ist nicht freigegeben.' }

  const supabase = createServerActionClient()
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${site}/admin` },
  })
  if (error) return { error: error.message }

  return { ok: true, magicSent: true }
}

export async function signOutAction() {
  const supabase = createServerActionClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
