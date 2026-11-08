import test from 'node:test'
import { nativeAcceptanceFailureProof } from '../../scripts/db/official-truth-accepted-store-trip-integration-1/native-acceptance-failures'

test('Accepted Store Trip Integration 1: actual unbound archive/legacy refusal and final source expiry',
  {timeout:240_000},nativeAcceptanceFailureProof)
