#!/usr/bin/env node
// scripts/ux-u1a2-geometry-1/audit.mjs
//
// Runs the mounted geometry test and writes sanitized JSON.
// Screenshots stay outside the repository.

import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const evidenz = process.env.UX_U1A2_EVIDENCE || join(process.cwd(), 'docs/evidence/ux-v1-u1a2-geometry-1/messung.json')
const bilder = process.env.UX_U1A2_SCREENSHOTS || '/opt/cursor/artifacts/ux-u1a2'
mkdirSync(bilder, { recursive: true })

const lauf = spawnSync(
  'node',
  ['--import', './scripts/server-only-test-register.mjs', '--import', 'tsx', '--test', 'lib/trips/ux-u1a2-geometry-1.test.ts'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      UX_U1A2_EVIDENCE: evidenz,
      UX_U1A2_SCREENSHOTS: bilder,
    },
  },
)

process.exit(lauf.status ?? 1)
