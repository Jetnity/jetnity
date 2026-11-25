// One-shot public link check; no scheduler, credentials, database or publishing.
// Run: node --import tsx scripts/official-truth-at-visitor-links.ts
import { AT_VISITOR_INFORMATION_LINKS } from '../lib/readiness/official-truth-at-method-v1/at-visitor-links'

import { pruefen } from './official-truth-at-visitor-link-check'

async function main() {
  let failed = false
  for (const link of AT_VISITOR_INFORMATION_LINKS) {
    try {
      const result = await pruefen(link.href, fetch)
      console.log(JSON.stringify({ label: link.label, requested: link.href, ...result }))
      failed ||= !result.ok
    } catch (error) {
      failed = true
      console.error(JSON.stringify({ label: link.label, requested: link.href, ok: false, error: error instanceof Error ? error.message : String(error) }))
    }
  }
  if (failed) process.exitCode = 1
}

void main()
