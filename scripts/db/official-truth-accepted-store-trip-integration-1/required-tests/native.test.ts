import test from 'node:test'
import { nativeAcceptedStoreProof } from '../native'

test('Accepted Store Trip Integration 1: actual native producer, durable commit, fresh reader and restore refusal',
  {timeout:240_000},nativeAcceptedStoreProof)
