import test from 'node:test'
import { nativeAcceptanceFailureProof } from '../native-acceptance-failures'

test('Accepted Store Trip Integration 1: actual unbound archive/legacy refusal and final source expiry',
  {timeout:240_000},nativeAcceptanceFailureProof)
