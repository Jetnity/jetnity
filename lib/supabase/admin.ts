// lib/supabase/admin.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-only Admin Client (Service Role) für Cron/Backoffice/Server-RPCs.
 * ⚠️ Niemals in Client Components importieren!
 */
export function createAdminClient<T = any>(): SupabaseClient<T> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL fehlt')
  }
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY fehlt')
  }

  return createClient<T>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-Client-Info': 'jetnity-cron' } },
  })
}

/** Alias für bestehenden Code – verhindert Refactor-Aufwand */
export const createSupabaseAdmin = createAdminClient
