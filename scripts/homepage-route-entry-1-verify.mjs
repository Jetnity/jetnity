#!/usr/bin/env node
// Bounded verify for homepage confirmed route entry 1.
// Does not activate providers, write Production, or close #110.

import { spawnSync } from 'node:child_process'

const tests = [
  'lib/places/route-einstieg.test.ts',
  'lib/places/homepage-route-entry-1.test.ts',
  'lib/places/auswahl.test.ts',
  'lib/places/reiseziele.test.ts',
  'lib/seo/index-grenze.test.ts',
  'lib/trips/create-entry.test.ts',
  'lib/trips/create-stages.test.ts',
  'lib/trips/guest-active-draft-preservation.test.ts',
]

const result = spawnSync(
  process.execPath,
  ['--import', './scripts/server-only-test-register.mjs', '--import', 'tsx', '--test', ...tests],
  { stdio: 'inherit' },
)

if (result.status) process.exit(result.status)

const hydrated = spawnSync(process.execPath, ['scripts/homepage-route-entry-1-hydrated.mjs'], {
  stdio: 'inherit',
})
process.exit(hydrated.status ?? 1)
