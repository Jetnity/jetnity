#!/usr/bin/env node
// Sanitized receipts only. Runtime remains the final sanitizer.

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { AGENT, CONTRACT_VERSION, GENERATION } from './constants.mjs'
import { assertSanitized, relativeEvidencePath } from './privacy.mjs'

export const RECEIPT_WHITELIST = Object.freeze([
  'contractVersion',
  'agent',
  'generation',
  'runId',
  'productHead',
  'implementation',
  'realExecution',
  'runtimeIntegration',
  'gates',
  'notes',
  'sourcePins',
])

export function whitelistReceipt(raw) {
  const out = {}
  for (const key of RECEIPT_WHITELIST) {
    if (raw[key] !== undefined) out[key] = raw[key]
  }
  return assertSanitized(out, 'receipt')
}

export function writeSanitizedReceipt(evidenceDir, name, raw) {
  mkdirSync(evidenceDir, { recursive: true })
  if (/\.(har|zip)$/i.test(name) || /storageState|trace/i.test(name)) {
    throw new Error(`refusing secret-bearing artifact name ${name}`)
  }
  const payload = whitelistReceipt(raw)
  const filePath = join(evidenceDir, name)
  writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`)
  return relativeEvidencePath(filePath, evidenceDir)
}
