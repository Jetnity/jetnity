import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { SECURITY_LISTEN_MAX_ZEILEN } from '@/lib/admin/security/filter-ehrlichkeit'

const root = process.cwd()
const paket = join(root, 'scripts/db/security-events-dev-1')
const runner = join(root, 'scripts/db/security-events-dev-1-lokal.mjs')

function quelle(pfad: string) {
  return readFileSync(pfad, 'utf8')
}

describe('Development security-event logging guard', () => {
  test('the package stays outside migrations and auto-run hooks', () => {
    const dateien = readdirSync(paket).filter((name) => name.endsWith('.sql'))
    assert.ok(dateien.includes('10-install-dormant.sql'))
    assert.ok(dateien.includes('40-rollback.sql'))
    const sql = dateien.map((name) => quelle(join(paket, name))).join('\n')
    assert.match(sql, /interval '7 days'/)
    assert.match(sql, /interval '2 hours'/)
    assert.match(sql, /1000/)
    assert.match(sql, /0 \* \* \* \*/)
    assert.match(sql, /jetnity-security-events-dev-cleanup-v1/)
    assert.doesNotMatch(sql, /_older_than/)
    assert.doesNotMatch(sql, /DROP SCHEMA\s+jetnity_internal\s+CASCADE/i)
    assert.doesNotMatch(sql, /postgres:\/\//)
    assert.doesNotMatch(sql, /qscbgcdmivbbnzrcyegn/)
    const migrationen = readdirSync(join(root, 'supabase/migrations')).join('\n')
    assert.doesNotMatch(migrationen, /security_event_dev_cleanup/)
    const workflow = quelle(join(root, '.github/workflows/ci.yml'))
    const packageJson = quelle(join(root, 'package.json'))
    assert.doesNotMatch(workflow, /security-events-dev-1/)
    assert.doesNotMatch(packageJson, /security-events-dev-1/)
  })

  test('account erasure still deletes security_events directly', () => {
    const accountDelete = quelle(join(root, 'supabase/functions/account-delete-v1/index.ts'))
    assert.match(
      accountDelete,
      /admin\.from\('security_events'\)\.delete\(\)\.eq\('user_id', userId\)/,
    )
  })

  test('recorded-only Security limits stay in place', () => {
    assert.equal(SECURITY_LISTEN_MAX_ZEILEN, 200)
    const hinweis = quelle(join(root, 'lib/admin/ehrliche-zustaende.ts'))
    assert.match(hinweis, /nicht enforced/)
    assert.match(hinweis, /keine vollständige Event-Ingestion/)
  })

  test('the local runner refuses a remote override before opening a database', () => {
    const runnerQuelle = quelle(runner)
    assert.match(runnerQuelle, /JETNITY_ALLOW_REMOTE_DB/)
    assert.match(runnerQuelle, /DATABASE_URL/)
    assert.doesNotMatch(runnerQuelle, /SUPABASE_ACCESS_TOKEN/)
    let abgelehnt = false
    try {
      execFileSync(process.execPath, [runner], {
        env: { ...process.env, JETNITY_ALLOW_REMOTE_DB: '1' },
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    } catch (fehler) {
      const text = `${(fehler as { stderr?: string }).stderr ?? ''}`
      abgelehnt = /JETNITY_ALLOW_REMOTE_DB/.test(text)
    }
    assert.equal(abgelehnt, true)
  })
})
