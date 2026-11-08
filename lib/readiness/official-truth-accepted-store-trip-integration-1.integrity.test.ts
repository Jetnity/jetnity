import test from 'node:test'
import { nativeAcceptedStoreIntegrityProof } from '../../scripts/db/official-truth-accepted-store-trip-integration-1/native'

test('Accepted Store Trip Integration 1: actual retained-row integrity and own-Trip recovery with independent A/B',
  {timeout:240_000},nativeAcceptedStoreIntegrityProof)
