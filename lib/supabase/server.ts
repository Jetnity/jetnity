// lib/supabase/server.ts
import 'server-only'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/** Next 14: Store. Next 15/16: Promise<Store>. `Awaited` hält beide Linien. */
type CookieStore = Awaited<ReturnType<typeof cookies>>

function assertEnvAnon() {
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    throw new Error('[supabase] NEXT_PUBLIC_SUPABASE_URL oder NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt')
  }
}

/** Read-only Cookies-Adapter (RSC) – erfüllt neues API (get/getAll/set/remove) */
function rscCookiesAdapter(store: CookieStore) {
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
function mutableCookiesAdapter(store: CookieStore) {
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
      try {
        store.delete(name)
      } catch {
        store.set({ name, value: '', maxAge: 0, path: '/' })
      }
    },
  }
}

/** Für Server Components (RSC) – Cookies read-only */
export async function createServerComponentClient<Db = Database>(): Promise<SupabaseClient<Db>> {
  const store = await cookies()
  assertEnvAnon()
  const client = createServerClient<Db>(SUPABASE_URL!, SUPABASE_ANON!, {
    cookies: rscCookiesAdapter(store),
  }) as unknown as SupabaseClient<Db>
  return client
}

/** Für Route Handlers (/app/api/*) – Cookies mutierbar */
export async function createRouteHandlerClient<Db = Database>(): Promise<SupabaseClient<Db>> {
  const store = await cookies()
  assertEnvAnon()
  const client = createServerClient<Db>(SUPABASE_URL!, SUPABASE_ANON!, {
    cookies: mutableCookiesAdapter(store),
  }) as unknown as SupabaseClient<Db>
  return client
}

/** Für Server Actions – identisch zum Route Handler */
export async function createServerActionClient<Db = Database>(): Promise<SupabaseClient<Db>> {
  const store = await cookies()
  assertEnvAnon()
  const client = createServerClient<Db>(SUPABASE_URL!, SUPABASE_ANON!, {
    cookies: mutableCookiesAdapter(store),
  }) as unknown as SupabaseClient<Db>
  return client
}

/* Hier standen bis Phase 1.2b drei ungenutzte Helfer, die als Vorlage
   gefaehrlich gewesen waeren:

   - `createAdminClient` erzeugte einen Client mit dem Service-Role-Key und
     haengte ihm den mutierbaren Cookie-Adapter an. Ein Client mit vollen
     Rechten darf keine Auth-Cookies der Besucherin lesen oder schreiben; er
     gehoert ohne Sitzungsverwaltung aufgebaut.
   - `getSessionServer`/`getUserServer` lasen die Identitaet aus
     `auth.getSession()`. Auf dem Server prueft das die Signatur des Tokens
     nicht nach, der Inhalt stammt aus dem Cookie. Wer serverseitig
     entscheidet, muss `auth.getUser()` verwenden.

   Der eine verbliebene Service-Role-Zugang sitzt in lib/modell/kontingent.ts:
   cookie-los, nicht exportiert, nur die zwei Kontingent-RPCs. Begruendung in
   DECISIONS.md ADR-0052 (Nachtrag). */

/* ───────────── Kompatibilitätsschicht ─────────────
   Viele Dateien importieren `createServerClient` direkt.
   Der Alias bleibt die async RSC-Factory – keine synchrone Hintertür.
   Für API-Routen nutze in Zukunft bitte `createRouteHandlerClient`.
*/
export { createServerComponentClient as createServerClient }
