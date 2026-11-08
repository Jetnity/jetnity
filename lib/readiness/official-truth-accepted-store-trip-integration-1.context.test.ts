import test from 'node:test'
import { nativeContextProof } from '../../scripts/db/official-truth-accepted-store-trip-integration-1/native-context'

test('Accepted Store Trip Integration 1: actual saved Trip date, person, credential and declaration boundaries',
  {timeout:240_000},nativeContextProof)
