#!/usr/bin/env node
// scripts/v1-destination-essentials-density-1-audit.mjs
//
// Disposable synthetic Chromium evidence for V1 Destination Essentials Density 1.
// Renders fixture-injected component HTML with compiled product CSS.
// No authenticated session, provider, model or storage write.

import { spawnSync } from 'node:child_process'

const result = spawnSync(
  process.execPath,
  ['--import', 'tsx', 'docs/evidence/v1-destination-essentials-density-1/render-harness.ts'],
  { stdio: 'inherit' },
)

process.exit(result.status ?? 1)
