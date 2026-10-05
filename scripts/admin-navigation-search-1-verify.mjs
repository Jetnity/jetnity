#!/usr/bin/env node
import { spawnSync } from 'node:child_process'

const unit = spawnSync(
  process.execPath,
  [
    '--import',
    './scripts/server-only-test-register.mjs',
    '--import',
    'tsx',
    '--test',
    'lib/admin/navigation-search.test.ts',
    'lib/admin/navigation.test.ts',
    'lib/admin/ehrliche-zustaende.test.ts',
  ],
  { stdio: 'inherit' },
)
if (unit.status) process.exit(unit.status ?? 1)

const hydrated = spawnSync(process.execPath, ['scripts/admin-navigation-search-1-hydrated.mjs'], {
  stdio: 'inherit',
})
process.exit(hydrated.status ?? 1)
