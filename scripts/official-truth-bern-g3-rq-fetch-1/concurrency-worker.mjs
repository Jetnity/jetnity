// Test-only IPC worker. No network or real GitHub writer exists here.
import { createRequire } from 'node:module'
const { simulateBernGlobalClaimForOfflineTests } = createRequire(import.meta.url)('../../lib/readiness/official-truth-bern-g3-rq-fetch-1/authorization.ts')
if (!process.env.NODE_TEST_CONTEXT || !process.send) throw new Error('offline_test_worker_only')
let sequence = 0
const pending = new Map()
process.on('message', message => {
  const handler = pending.get(message.id)
  if (handler) { pending.delete(message.id); handler(message.response) }
})
const rpc = args => new Promise(resolve => {
  const id = ++sequence
  pending.set(id, resolve)
  process.send({ id, ...args })
})
const result = await simulateBernGlobalClaimForOfflineTests({ mainSha: 'a'.repeat(40), commentId: 7000000001 }, {
  read: path => rpc({ op: 'read', path }),
  createRef: (ref, sha) => rpc({ op: 'create', ref, sha }),
  transport: async () => { await rpc({ op: 'transport' }) },
})
process.send({ op: 'finished', result }, () => process.disconnect())
