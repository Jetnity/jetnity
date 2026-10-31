/** Replaces the browser Supabase client inside the local fixture. No network and no session. */
export function createBrowserClient(): never {
  throw new Error('supabase-unconfigured')
}
