// Required in the existing test:core discovery; no optional environment skip.
import { test } from 'node:test'
import { runPrivateOwnerGuardsNative } from '../../scripts/db/official-truth-v3-private-owner-guards-1/native'

test('PG1 private owner guards: exact independent install, MA1 authority and guarded recovery',
  { timeout: 240_000 }, async t => { await runPrivateOwnerGuardsNative(t) })
