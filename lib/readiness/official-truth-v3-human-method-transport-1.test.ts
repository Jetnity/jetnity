import test from 'node:test'
import { runHumanMethodTransportNative } from '../../scripts/db/official-truth-v3-human-method-transport-1/native'

// Root must explicitly integrate this exact wrapper into the closed PG17
// selector. PG16 Core is not an acceptable execution or publication fallback.
test('HMT1 mandatory PostgreSQL17 human-method transport proof', {
  timeout:240_000,
  concurrency:false,
}, runHumanMethodTransportNative)
