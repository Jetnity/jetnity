'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

declare global {
  // eslint-disable-next-line no-var
  var __supabase__: SupabaseClient<Database> | undefined
  // eslint-disable-next-line no-var
  var __sbAuthListener__: boolean | undefined
}

/** Memoized Browser-Client (HMR-sicher, nur einmal erzeugt) */
export function getSupabaseBrowser(): SupabaseClient<Database> {
  if (!globalThis.__supabase__) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anon) {
      throw new Error('[supabase] NEXT_PUBLIC_SUPABASE_URL oder NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt')
    }
    globalThis.__supabase__ = createBrowserClient<Database>(url, anon)
  }
  return globalThis.__supabase__!
}

export const supabase = getSupabaseBrowser()

/**
 * Optional: Server-Cookies in Sync halten (für RLS/SSR).
 * Rufe das einmalig in `app/layout.tsx` (Client) per `useEffect(() => startSupabaseAuthListener(), [])` auf.
 * Du brauchst dafür eine POST-Route `/auth/refresh` (siehe Kommentar unten).
 */
export function startSupabaseAuthListener(options?: { refreshEndpoint?: string }) {
  if (globalThis.__sbAuthListener__) return
  const endpoint = options?.refreshEndpoint ?? '/auth/refresh'
  supabase.auth.onAuthStateChange(async (event) => {
    if (['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
      try {
        await fetch(endpoint, { method: 'POST', credentials: 'include' })
      } catch {
        /* ignore network errors */
      }
    }
  })
  globalThis.__sbAuthListener__ = true
}

/*
Optionaler Route-Handler, falls du den Listener nutzt:

// app/auth/refresh/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@/lib/supabase/server'
export async function POST() {
  const supabase = createRouteHandlerClient()
  // Ein Aufruf reicht, damit @supabase/ssr Cookies aktualisiert
  await supabase.auth.getUser()
  return NextResponse.json({ ok: true })
}
*/
