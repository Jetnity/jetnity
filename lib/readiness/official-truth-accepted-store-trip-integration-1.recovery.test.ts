import test from 'node:test'
import { nativeRecoveryProof } from '../../scripts/db/official-truth-accepted-store-trip-integration-1/native-recovery'

test('Accepted Store Trip Integration 1: native abandonment, late reply, R4 race and orphan expiry recovery',
  {timeout:240_000},nativeRecoveryProof)
