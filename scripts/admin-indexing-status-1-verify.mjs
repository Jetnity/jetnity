#!/usr/bin/env node
// Focused verify for Admin indexing status 1. Does not edit the test registry.

import { spawnSync } from 'node:child_process'

const tests = [
  'lib/admin/seo-status.test.ts',
  'lib/seo/oeffentlicher-origin.test.ts',
  'lib/seo/robots-regeln.test.ts',
  'lib/seo/oeffentliche-metadata.test.ts',
  'lib/seo/index-grenze.test.ts',
]

const result = spawnSync(
  process.execPath,
  ['--import', './scripts/server-only-test-register.mjs', '--import', 'tsx', '--test', ...tests],
  { stdio: 'inherit' },
)

if (result.status) process.exit(result.status)

const render = spawnSync(
  process.execPath,
  ['--import', './scripts/server-only-test-register.mjs', '--import', 'tsx', 'scripts/admin-indexing-status-1-render.mjs'],
  { stdio: 'inherit' },
)

process.exit(render.status ?? 1)
