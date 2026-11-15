import test from 'node:test'
import { runBg1Native } from '../../scripts/db/official-truth-v3-background-guard-1/native'

// Mandatory exact entry in the existing real PG17 job, never an availability skip.
test('BG1 used upgrade, full audit, sticky incident, Owner recovery and selected public boundary', { timeout: 700000 }, runBg1Native)
