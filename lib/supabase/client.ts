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
function getSupabaseBrowser(): SupabaseClient<Database> {
  if (_sb) return _sb;

  const { url, anon } = getEnv();

  // Typ-Stabilisierung zwischen @supabase/ssr und supabase-js unter TS5/strict:
  const sb = _createBrowserClient(url, anon) as unknown as SupabaseClient<Database>;
  _sb = sb;
  return sb;
}

/** Alias, damit `import { createBrowserClient } from "@/lib/supabase/client"` funktioniert */
export const createBrowserClient = getSupabaseBrowser;

/**
 * Rückwärtskompatibler, lazy Browser-Client.
 *
 * Viele ältere Komponenten importieren `supabase` direkt. Der Proxy verhindert,
 * dass der Client schon während Import/SSR initialisiert wird. Dadurch bleiben
 * Builds und öffentliche Seiten auch ohne lokale Supabase-Konfiguration stabil.
 */
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, property) {
    const client = getSupabaseBrowser();
    const value = Reflect.get(client, property, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

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
    if (
      event === 'SIGNED_IN' ||
      event === 'SIGNED_OUT' ||
      event === 'TOKEN_REFRESHED' ||
      event === 'USER_UPDATED'
    ) {
      try {
        await fetch(endpoint, { method: 'POST', credentials: 'include' });
      } catch {
        /* ignore */
      }
    }
  });

  return () => subscription?.unsubscribe?.();
}
