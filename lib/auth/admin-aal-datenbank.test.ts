import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { CAPABILITIES, databaseFunctionFor } from '@/lib/auth/roles'

const MIGRATIONEN = join(process.cwd(), 'supabase', 'migrations')

function migrationen(): string {
  return readdirSync(MIGRATIONEN)
    .filter(datei => datei.endsWith('.sql'))
    .sort()
    .map(datei => readFileSync(join(MIGRATIONEN, datei), 'utf8'))
    .join('\n')
}

function letzterFunktionskoerper(sql: string, name: string): string {
  const muster = new RegExp(
    `create or replace function public\\.${name}\\(\\)[\\s\\S]*?as \\$\\$([\\s\\S]*?)\\$\\$`,
    'g',
  )
  const treffer = [...sql.matchAll(muster)]
  assert.ok(treffer.length > 0, `public.${name}() fehlt in den Migrationen`)
  return treffer[treffer.length - 1][1]
}

describe('Admin AAL2 auf der Datenebene', () => {
  const sql = migrationen()

  test('die AAL-Hilfsfunktion liest ausschließlich den signierten JWT-Claim und ist fail closed', () => {
    const koerper = letzterFunktionskoerper(sql, 'aktuelles_admin_aal2')
    assert.match(koerper, /auth\.jwt\(\)\s*->>\s*'aal'/)
    assert.match(koerper, /=\s*'aal2'/)
    assert.match(koerper, /coalesce\(/)
    assert.equal(/nextLevel|factor|user_metadata/i.test(koerper), false)
  })

  test('jede administrative Fähigkeit verlangt zusätzlich aktuelles AAL2', () => {
    for (const faehigkeit of CAPABILITIES) {
      const name = databaseFunctionFor(faehigkeit)
      const koerper = letzterFunktionskoerper(sql, name)
      assert.match(
        koerper,
        /aktuelles_admin_aal2\(\)/,
        `${name}() muss die AAL2-Datenbankgrenze anwenden`,
      )
    }
  })

  test('AAL2 ersetzt die Rollen-/Capability-Prüfung nicht', () => {
    for (const faehigkeit of CAPABILITIES) {
      const name = databaseFunctionFor(faehigkeit)
      const koerper = letzterFunktionskoerper(sql, name)
      assert.match(
        koerper,
        /hat_rolle_mindestens\('[a-z]+'\)/,
        `${name}() muss Rolle UND AAL2 verlangen`,
      )
    }
  })
})
