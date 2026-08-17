#!/usr/bin/env node
// Spielt noch nicht angewendete Migrationen auf den Supabase-Development-Branch.
//
// `supabase db push` braucht das Datenbankpasswort. Zur Verfügung steht hier
// nur der Management-Token, mit dem auch der Supabase-MCP arbeitet. Dieses
// Skript nimmt deshalb denselben Weg: eine Anweisung über die Management-API,
// und derselbe Eintrag in `supabase_migrations.schema_migrations`, den die CLI
// schreiben würde. Ein späteres `supabase db push` sieht die Migration damit
// als angewendet.
//
// Jede Migration läuft in einer eigenen Transaktion: Entweder sie gilt ganz
// oder gar nicht. DDL ist in PostgreSQL transaktional.
//
// Aufruf:
//   node scripts/db/anwenden.mjs           # alle offenen Migrationen
//   node scripts/db/anwenden.mjs --probe   # nur zeigen, was offen ist

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

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
  const rows = await runSql('select version from supabase_migrations.schema_migrations')
  return new Set(rows.map((r) => r.version))
}

/** Verdoppelt einfache Anführungszeichen – der Text landet als SQL-Literal. */
function literal(text) {
  return `'${String(text).split("'").join("''")}'`
}

async function main() {
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

    // `statements` erwartet die CLI als Array; die Migration als Ganzes
    // einzutragen ist zulässig und hält den Eintrag lesbar.
    const eintrag = `insert into supabase_migrations.schema_migrations (version, name, statements)
                     values (${literal(m.version)}, ${literal(m.name)}, array[${literal(sql)}])`

    process.stdout.write(`  ${m.datei} … `)
    try {
      await runSql(['begin;', sql, ';', eintrag, ';', 'commit;'].join('\n'))
      console.log('angewendet')
    } catch (err) {
      console.log('FEHLGESCHLAGEN')
      console.error(err.message)
      process.exit(1)
    }
  }

  console.log('Fertig.')
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
