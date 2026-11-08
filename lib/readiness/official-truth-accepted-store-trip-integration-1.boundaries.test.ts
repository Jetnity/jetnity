import test from 'node:test'
import { nativeAcceptedStoreBoundariesProof } from '../../scripts/db/official-truth-accepted-store-trip-integration-1/native'

test('Accepted Store Trip Integration 1: actual pinned SSR, outgoing signals and owned request/key/target boundaries',
  {timeout:240_000},nativeAcceptedStoreBoundariesProof)
