type Sitzung = { user: { id: string } } | null
type Callback = (event: string, session: Sitzung) => void

const callbacks = new Set<Callback>()
let session: Sitzung = null
let settled = false
let resolveReady: (value: Sitzung) => void = () => {}
const ready = new Promise<Sitzung>((resolve) => {
  resolveReady = resolve
})

function apply(next: Sitzung, event: string) {
  session = next
  if (!settled) {
    settled = true
    resolveReady(session)
  }
  for (const callback of callbacks) callback(event, session)
}

/**
 * Replaces `@/lib/supabase/client` only inside the guest-nav harness bundle.
 * No network, no account, no cookies.
 */
export function createBrowserClient() {
  return {
    auth: {
      async getSession() {
        const current = await ready
        return { data: { session: current } }
      },
      onAuthStateChange(callback: Callback) {
        callbacks.add(callback)
        return {
          data: {
            subscription: {
              unsubscribe() {
                callbacks.delete(callback)
              },
            },
          },
        }
      },
    },
  }
}

export function installGastNavSitzungStub() {
  if (typeof window === 'undefined' || typeof window.location?.search !== 'string') return
  const mode = new URLSearchParams(window.location.search).get('sitzung') ?? 'gast'
  const api = {
    konto() {
      apply({ user: { id: 'synthetic-account' } }, 'SIGNED_IN')
    },
    gast() {
      apply(null, 'SIGNED_OUT')
    },
  }
  ;(window as Window & { __sitzung?: typeof api }).__sitzung = api
  if (mode === 'halten') return
  if (mode === 'konto') api.konto()
  else api.gast()
}

if (typeof window !== 'undefined' && typeof window.location?.search === 'string') {
  installGastNavSitzungStub()
}
