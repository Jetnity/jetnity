import test from 'node:test'
import { nativeAcceptedStoreWaitLifecycleProof } from '../../scripts/db/official-truth-accepted-store-trip-integration-1/native'

test('Accepted Store Trip Integration 1: actual four Finalize waits, authority/Trip controls and immutable lifecycle',
  {timeout:240_000},nativeAcceptedStoreWaitLifecycleProof)
