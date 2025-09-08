// lib/supabase/server.ts
import 'server-only'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { SupabaseClient, Session, User } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY // optional (nur Server)

function assertEnvAnon() {
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    throw new Error('[supabase] NEXT_PUBLIC_SUPABASE_URL oder NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt')
  }
}
function assertEnvService() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE) {
    throw new Error('[supabase] SUPABASE_SERVICE_ROLE_KEY fehlt (für Admin-Client)')
  }
}

/** Read-only Cookies-Adapter (RSC) – erfüllt neues API (get/getAll/set/remove) */
function rscCookiesAdapter(store: ReturnType<typeof cookies>) {
  return {
    get(name: string) {
      return store.get(name)?.value
    },
    getAll() {
      return store.getAll().map((c) => ({ name: c.name, value: c.value }))
    },
    set(_name: string, _value: string, _options: CookieOptions) {
      /* no-op in RSC */
    },
    remove(_name: string, _options: CookieOptions) {
      /* no-op in RSC */
    },
  }
}

/** Mutierbarer Cookies-Adapter (Route Handler / Server Actions) */
function mutableCookiesAdapter(store: ReturnType<typeof cookies>) {
  return {
    get(name: string) {
      return store.get(name)?.value
    },
    getAll() {
      return store.getAll().map((c) => ({ name: c.name, value: c.value }))
    },
    set(name: string, value: string, options: CookieOptions) {
      store.set({ name, value, ...options })
    },
    remove(name: string, _options: CookieOptions) {
      // sicheres Entfernen
      try {
        // Next 14+
        // @ts-ignore - delete ist vorhanden, aber nicht immer typisiert
        store.delete?.(name)
      } catch {
        // Fallback: auslaufen lassen
        store.set({ name, value: '', maxAge: 0, path: '/' })
      }
    },
  }
}

/** Für Server Components (RSC) – Cookies read-only */
export function createServerComponentClient<Db = Database>(): SupabaseClient<Db> {
  assertEnvAnon()
  const store = cookies()
  // NOTE: Upstream-Types von @supabase/ssr und supabase-js geraten hier in Strict/TS5 durcheinander.
  // Wir casten bewusst zurück auf den erwarteten Clienttyp, damit Projekt-weite Row-Typen stabil bleiben.
  const client = createServerClient<Db>(SUPABASE_URL!, SUPABASE_ANON!, {
    cookies: rscCookiesAdapter(store),
  }) as unknown as SupabaseClient<Db>
  return client
}

/** Für Route Handlers (/app/api/*) – Cookies mutierbar */
export function createRouteHandlerClient<Db = Database>(): SupabaseClient<Db> {
  assertEnvAnon()
  const store = cookies()
  const client = createServerClient<Db>(SUPABASE_URL!, SUPABASE_ANON!, {
    cookies: mutableCookiesAdapter(store),
  }) as unknown as SupabaseClient<Db>
  return client
}

/** Für Server Actions – identisch zum Route Handler */
export function createServerActionClient<Db = Database>(): SupabaseClient<Db> {
  assertEnvAnon()
  const store = cookies()
  const client = createServerClient<Db>(SUPABASE_URL!, SUPABASE_ANON!, {
    cookies: mutableCookiesAdapter(store),
  }) as unknown as SupabaseClient<Db>
  return client
}

/**
 * Admin-Client mit Service-Role (volle Rechte).
 * Nur serverseitig verwenden (Route-Handler / Server Actions)!
 */
export function createAdminClient<Db = Database>(): SupabaseClient<Db> {
  assertEnvService()
  const store = cookies()
  const client = createServerClient<Db>(SUPABASE_URL!, SUPABASE_SERVICE!, {
    cookies: mutableCookiesAdapter(store),
  }) as unknown as SupabaseClient<Db>
  return client
}

/* ───────────── Convenience ───────────── */

export async function getSessionServer(): Promise<Session | null> {
  const supabase = createServerComponentClient()
  const { data } = await supabase.auth.getSession()
  return data?.session ?? null
}

export async function getUserServer(): Promise<User | null> {
  const session = await getSessionServer()
  return session?.user ?? null
}
