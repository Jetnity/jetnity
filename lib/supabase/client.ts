'use client';

import { createBrowserClient as _createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

function getEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error('[supabase] NEXT_PUBLIC_SUPABASE_URL oder NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt');
  }
  return { url, anon };
}

// HMR-sicheres Singleton (ohne globale TS-Deklarationen)
let _sb: SupabaseClient<Database> | null = null;
let _authListenerStarted = false;

/** Memoized Browser-Client */
export function getSupabaseBrowser(): SupabaseClient<Database> {
  if (_sb) return _sb;
  const { url, anon } = getEnv();
  _sb = _createBrowserClient<Database>(url, anon);
  return _sb;
}

/** Alias, damit `import { createBrowserClient } from "@/lib/supabase/client"` funktioniert */
export const createBrowserClient = getSupabaseBrowser;

/** Bequemer Default (optional) */
export const supabase = getSupabaseBrowser();

/**
 * Optional: Server-Cookies in Sync halten (für RLS/SSR).
 * In `app/layout.tsx` einmalig per:
 *   useEffect(() => startSupabaseAuthListener(), []);
 * Gibt eine Cleanup-Funktion zurück (unsubscribe).
 */
export function startSupabaseAuthListener(options?: { refreshEndpoint?: string }) {
  if (_authListenerStarted) return () => {};
  _authListenerStarted = true;

  const endpoint = options?.refreshEndpoint ?? '/auth/refresh';
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
    if (['SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
      try {
        await fetch(endpoint, { method: 'POST', credentials: 'include' });
      } catch {
        /* ignore */
      }
    }
  });

  return () => {
    subscription?.unsubscribe?.();
  };
}
