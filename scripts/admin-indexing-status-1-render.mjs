#!/usr/bin/env node
// Launches the TypeScript synthetic render harness. Not an authenticated
// /admin session and not a Production/device PASS.

import { spawnSync } from 'node:child_process'

const result = spawnSync(
  process.execPath,
  [
    '--import',
    './scripts/server-only-test-register.mjs',
    '--import',
    'tsx',
    'docs/evidence/admin-indexing-status-1/render-harness.ts',
  ],
  { stdio: 'inherit' },
)

process.exit(result.status ?? 1)
