#!/usr/bin/env node
// Spielt noch nicht angewendete Migrationen auf das bestätigte Ziel.
//
// Default: Development-Branch (`ziel()`). Production nur mit
// --produktion --projekt-ref <exakter Ref>, nachdem die Management API
// bestätigt hat, dass das Ziel ein eigenständiges Projekt ist.

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { anwendenAuftragLesen } from '@/lib/rollout/schreibauftrag'
import { zielFuerAuftrag } from '../auth/ziel'
import { runSql } from './sql.mjs'

const MIGRATIONS_DIR = new URL('../../supabase/migrations/', import.meta.url).pathname

function alleMigrationen() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((datei) => {
      const [version, ...rest] = datei.replace(/\.sql$/, '').split('_')
      return { datei, version, name: rest.join('_') || 'migration' }
    })
}

async function angewendeteVersionen() {
  const rows = (await runSql('select version from supabase_migrations.schema_migrations')) as {
    version: string
  }[]
  return new Set(rows.map((r) => r.version))
}

function literal(text: string) {
  return `'${String(text).split("'").join("''")}'`
}

async function main() {
  const auftrag = anwendenAuftragLesen(process.argv)
  await zielFuerAuftrag(auftrag)
  console.log(`Ziel: ${auftrag.modus}`)

  const nurProbe = process.argv.includes('--probe')
  const angewendet = await angewendeteVersionen()
  const offen = alleMigrationen().filter((m) => !angewendet.has(m.version))

  if (offen.length === 0) {
    console.log('Nichts offen – der Branch entspricht den Migrationen im Repository.')
    return
  }

  console.log(`Offen: ${offen.map((m) => m.datei).join(', ')}`)
  if (nurProbe) return

  for (const m of offen) {
    const sql = readFileSync(join(MIGRATIONS_DIR, m.datei), 'utf8')
    const eintrag = `insert into supabase_migrations.schema_migrations (version, name, statements)
                     values (${literal(m.version)}, ${literal(m.name)}, array[${literal(sql)}])`

    process.stdout.write(`  ${m.datei} … `)
    try {
      await runSql(['begin;', sql, ';', eintrag, ';', 'commit;'].join('\n'))
      console.log('angewendet')
    } catch (err) {
      console.log('FEHLGESCHLAGEN')
      console.error(err instanceof Error ? err.message : err)
      process.exit(1)
    }
  }

  console.log('Fertig.')
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
