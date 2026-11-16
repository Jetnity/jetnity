import { createClient } from '@supabase/supabase-js'

export async function requireAdminApi(options) {
  const proof = globalThis.__refundJournalRouteProof
  proof.guards.push(options)
  if (proof.input.gateStatus) return { ok: false, response: new Response(JSON.stringify({ message: 'Synthetic denial' }), { status: proof.input.gateStatus }) }
  return { ok: true, grant: 'role' }
}

export async function createRouteHandlerClient() {
  const proof = globalThis.__refundJournalRouteProof
  proof.clients += 1
  return createClient('https://refund-journal.invalid', 'synthetic-public-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, init) => {
      const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
      if (url.origin !== 'https://refund-journal.invalid' || url.pathname !== '/rest/v1/refunds' || init?.method !== 'GET') {
        throw new Error('Unexpected fixture transport')
      }
      proof.calls.push({ url: url.href, method: init.method, signal: Boolean(init.signal) })
      if (proof.input.transportFailure) throw new Error('Synthetic connection interruption')
      return new Response(JSON.stringify(proof.input.responseBody ?? proof.input.rows ?? []), {
        status: proof.input.dbStatus ?? 200, headers: { 'Content-Type': 'application/json' },
      })
    } },
  })
}
