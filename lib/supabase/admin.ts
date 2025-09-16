// lib/supabase/admin.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env ${name} for admin Supabase client`)
  return v
}

/** Service-Role Client (server-only, keine Session-Persistenz) */
export function getAdminClient(): SupabaseClient<Database> {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, init) },
  })
}

/** Aliase für Legacy-Imports – damit alte Files weiter kompilieren */
export function createSupabaseAdmin(): SupabaseClient<Database> { return getAdminClient() }
export function createAdminClient(): SupabaseClient<Database> { return getAdminClient() }
export function getServiceRoleClient(): SupabaseClient<Database> { return getAdminClient() }

export default getAdminClient
