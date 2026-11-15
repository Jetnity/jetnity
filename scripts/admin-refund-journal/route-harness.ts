// Actual route + actual Supabase query builder; synthetic guard/session/HTTP only.
const proof = { input: JSON.parse(process.env.REFUND_JOURNAL_PROOF ?? '{}'), clients: 0, guards: [], calls: [] }
Object.assign(globalThis, { __refundJournalRouteProof: proof })
// The fixture client has its own non-network fetch. Any accidental fallback is forbidden.
globalThis.fetch = async () => { throw new Error('Unexpected network outside the fixture') }

async function run() {
  const { GET } = await import('../../app/api/admin/payments/refunds/route')
  const response = await GET(new Request(`https://journal.invalid/api/admin/payments/refunds${proof.input.query ?? ''}`))
  console.log(JSON.stringify({
    clients: proof.clients, guards: proof.guards, calls: proof.calls,
    status: response.status, cache: response.headers.get('Cache-Control'), body: await response.json(),
  }))
}
void run().catch(error => { console.error(error); process.exitCode = 1 })
