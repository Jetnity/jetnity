import test from 'node:test'
import { nativeRecoveryProof } from '../native-recovery'

test('Accepted Store Trip Integration 1: native abandonment, late reply, R4 race and orphan expiry recovery',
  {timeout:240_000},nativeRecoveryProof)
