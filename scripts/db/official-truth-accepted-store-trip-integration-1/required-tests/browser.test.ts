import test from 'node:test'
import { mountedAcceptedStoreProof } from '../browser'

test('Accepted Store Trip Integration 1: actual native result through mounted Workspace lifecycle',
  {timeout:240_000},mountedAcceptedStoreProof)
