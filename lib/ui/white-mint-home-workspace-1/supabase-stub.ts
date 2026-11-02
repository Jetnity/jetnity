/** Local fixture only. Default: unconfigured; opt-in: an explicitly signed-out guest. No network. */
export function createBrowserClient() {
  if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('fixture-session') === 'guest') {
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      },
    }
  }
  throw new Error('supabase-unconfigured')
}
