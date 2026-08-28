// lib/project-sanitation/closure-invariants.test.ts
//
// Read-only Evidence-Lock für Issue #134. Beweist, dass die noch offenen
// Sanitation-Funde weiter im Tree liegen und dieser Slice sie nicht gelöscht hat.
// Dateiexistenz ist kein Beweis für git-diff-Nicht-Änderung.
// Kein Runtime-Write. Kein Cloud-Write. Kein Branch-Delete. Kein PR-Close.

import { existsSync, readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

function lies(rel: string): string {
  return readFileSync(join(wurzel, rel), 'utf8')
}

describe('project sanitation closure invariants', () => {
  test('PR #88 ist CLOSE-SAFE; Unique Evidence hängt am Branch', () => {
    const matrix = lies('docs/PROJECT_SANITATION_HISTORICAL_PR_CLOSURE_MATRIX_2026-08-28.md')
    assert.match(matrix, /CLOSE-SAFE/)
    assert.match(matrix, /HISTORICAL-EVIDENCE/)
    assert.match(matrix, /DELETE-SAFE/)
    assert.match(matrix, /audit\/project-sanitation-inventory-2026-08-26/)
    assert.match(matrix, /Eine Regel/)
    assert.match(matrix, /Close löscht den Branch nicht/)
    assert.equal(existsSync(join(wurzel, 'docs/history/PROJECT_SANITATION_AUDIT_STATUS_2026-08-26.md')), false)
  })

  test('PR-Close und Branch-Delete sind getrennte Achsen', () => {
    const task = lies('docs/PROJECT_SANITATION_CLOSURE_TASK_2026-08-28.md')
    assert.match(task, /PR-Disposition ≠ Branch-Retention/)
    assert.match(task, /KEEP-FUTURE/)
    assert.match(task, /ADR-0184/)
    const inventory = lies('docs/PROJECT_SANITATION_LIVE_INVENTORY_STATUS_2026-08-28.md')
    assert.match(inventory, /\*\*MERGED\*\*/)
    assert.match(inventory, /Eine Regel für #88/)
    assert.match(inventory, /#28.*KEEP-FUTURE/s)
    assert.match(inventory, /DELETE-SAFE/)
  })

  test('aktuelle Closure-Deliverables existieren', () => {
    for (const rel of [
      'docs/PROJECT_SANITATION_CLOSURE_TASK_2026-08-28.md',
      'docs/PROJECT_SANITATION_LIVE_INVENTORY_STATUS_2026-08-28.md',
      'docs/PROJECT_SANITATION_HISTORICAL_PR_CLOSURE_MATRIX_2026-08-28.md',
      'docs/PROJECT_SANITATION_REMOTE_BRANCH_DISPOSITION_MATRIX_2026-08-28.md',
      'docs/PROJECT_SANITATION_CLOSURE_SELF_REVIEW_2026-08-28.md',
      'docs/PROJECT_SANITATION_CLOSURE_HANDOFF_2026-08-28.md',
      'docs/PROJECT_SANITATION_AGENT_ROTATION_RECORD_GENERATION_3_2026-08-28.md',
    ]) {
      assert.equal(existsSync(join(wurzel, rel)), true, rel)
    }
  })

  test('still actionable leftovers wurden nicht gelöscht', () => {
    const trackedTemp = [
      'supabase/.temp/cli-latest',
      'supabase/.temp/gotrue-version',
      'supabase/.temp/pooler-url',
      'supabase/.temp/postgres-version',
      'supabase/.temp/rest-version',
      'supabase/.branches/_current_branch',
    ]
    for (const rel of trackedTemp) {
      assert.equal(existsSync(join(wurzel, rel)), true, rel)
    }
    assert.equal(existsSync(join(wurzel, 'public/images/prague.jpg')), true)
    assert.equal(existsSync(join(wurzel, 'components/layout/CookieConsent.tsx')), true)
    const ignore = lies('.gitignore')
    assert.match(ignore, /supabase\/\.temp\//)
    assert.match(ignore, /supabase\/\.branches\//)
    const nextConfig = lies('next.config.js')
    assert.match(nextConfig, /jetnity\.ai/)
    assert.match(nextConfig, /oaidalleapiprodscus\.blob\.core\.windows\.net/)
  })

  test('pooler-url enthält keinen Live-Secret-Wert', () => {
    const pooler = lies('supabase/.temp/pooler-url')
    assert.match(pooler, /\[YOUR-PASSWORD\]/)
    assert.equal(pooler.includes('eyJ'), false)
    assert.equal(/service_role|sb_secret|sk_live/.test(pooler), false)
  })

  test('integrierte AP-5-S1-Evidence bleibt erhalten und dieser Slice ändert keine Account-Auth-Runtime', () => {
    const status = lies('docs/PROJECT_SANITATION_CLOSURE_TASK_2026-08-28.md')
    assert.match(status, /Account-\/Auth-\/MFA-\/Session-Dateien/)
    assert.match(status, /nicht/)
    assert.equal(
      existsSync(join(wurzel, 'docs/AP5_S1_SECURITY_UI_TRUTH_TASK_2026-08-28.md')),
      true,
      'AP-5-S1 task evidence must remain after PR #133 merge',
    )
    const decisions = lies('DECISIONS.md')
    assert.match(decisions, /## ADR-0183 – AP-5-S1/)
    assert.match(decisions, /## ADR-0184 – Project Sanitation Closure/)
  })
})
