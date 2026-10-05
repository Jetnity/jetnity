#!/usr/bin/env node
// Execute the accepted TypeScript parser through locked tsx and compare
// the owned JS port on the same fixtures. Not a second contract.

import { createInterface } from 'node:readline'
import { parseAdminAccountCountsPayload as accepted } from '@/lib/admin/account-counts-delivery/parser'
import { parseAdminAccountCountsPayload as port } from './payload.mjs'

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const lines: string[] = []
    const rl = createInterface({ input: process.stdin })
    rl.on('line', (line) => lines.push(line))
    rl.on('close', () => resolve(lines.join('\n')))
    rl.on('error', reject)
  })
}

async function main() {
  const fixtures = JSON.parse(await readStdin())
  if (!Array.isArray(fixtures)) {
    throw new Error('parser-equivalence stdin must be a JSON array of payloads')
  }
  const results = fixtures.map((payload: unknown) => ({
    accepted: accepted(payload).ok === true,
    port: port(payload).ok === true,
  }))
  process.stdout.write(JSON.stringify(results))
}

void main()
