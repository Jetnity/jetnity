// lib/auth/requireAdmin.ts
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@/lib/supabase/server'

// Optional: per ENV eine Whitelist erlaubter Admin-E-Mails setzen.
// Beispiel in .env.local:
// ADMIN_ALLOWED_EMAILS=feirovsasa@icloud.com,info@pazzar.ch,info@jetnity.com
const ALLOW = new Set(
  (process.env.ADMIN_ALLOWED_EMAILS ?? '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
)

function emailAllowed(email?: string | null) {
  const e = (email ?? '').toLowerCase()
  if (!e) return false
  if (ALLOW.size > 0 && ALLOW.has(e)) return true
  // Fallback: Jetnity-Domain
  return e.endsWith('@jetnity.com')
}

export async function requireAdmin() {
  const supabase = createServerComponentClient()

  const { data: auth } = await supabase.auth.getUser()
  const user = auth?.user
  if (!user) redirect('/admin/login')

  // Rolle aus creator_profiles (fehler-tolerant)
  let role: string | null = null
  try {
    const { data } = await supabase
      .from('creator_profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()
    role = (data?.role as string) ?? null
  } catch {
    role = null
  }

  const roleOk = ['admin', 'owner', 'operator', 'moderator'].includes(role ?? '')
  const emailOk = emailAllowed(user.email)

  if (!emailOk && !roleOk) {
    // Kein Zugriff → zurück zur Admin-Loginseite
    redirect('/admin/login?denied=1')
  }

  return { user, role }
}
