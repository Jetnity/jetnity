import test from 'node:test'
import { runComposedDevNative } from '../../scripts/db/official-truth-v3-composed-dev-1/native'

// Mandatory in Root's separately selected PG17 integration; never an availability skip.
test('COMPOSED-DEV1 exact common package, human authority, worker and unused recovery', { timeout: 240_000 }, runComposedDevNative)
