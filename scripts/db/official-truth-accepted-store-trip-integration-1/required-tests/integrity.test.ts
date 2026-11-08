import test from 'node:test'
import { nativeAcceptedStoreIntegrityProof } from '../native'

test('Accepted Store Trip Integration 1: actual retained-row integrity and own-Trip recovery with independent A/B',
  {timeout:240_000},nativeAcceptedStoreIntegrityProof)
