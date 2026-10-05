#!/usr/bin/env node
// Nachweis, dass die Baseline-Migration das Development-Schema reproduziert.
//
// Ablauf:
//   1. Momentaufnahme des laufenden Schemas
//   2. In EINER Transaktion: `public` verwerfen, aus den Migrationen neu aufbauen,
//      Momentaufnahme ziehen, Transaktion zurückrollen
//   3. Beide Momentaufnahmen vergleichen
//
// Der Wiederaufbau läuft ausschließlich in einer zurückgerollten Transaktion.
// DDL ist in PostgreSQL transaktional, das Schema bleibt danach unverändert.
// Ein Fehler an irgendeiner Stelle bricht die Transaktion ab, ohne Spuren zu
// hinterlassen.
//
// Aufruf:
//   node scripts/db/reproduzierbarkeit.mjs            # alle Migrationen
//   node scripts/db/reproduzierbarkeit.mjs --nur-baseline

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { runSql } from './sql.mjs'
import { fingerprintSql } from './inventory.mjs'

// `pg_get_constraintdef`, `format_type` und Verwandte schreiben Namen genau dann
// schema-qualifiziert, wenn sie über den `search_path` nicht erreichbar sind.
// Der Dump setzt `search_path` bewusst auf leer, die Live-Sitzung nicht – ohne
// eine gemeinsame Einstellung würde jede zweite Zeile als Abweichung erscheinen,
// obwohl das Objekt identisch ist.
const SEARCH_PATH = "set local search_path = public, extensions;\n"

const MIGRATIONS_DIR = new URL('../../supabase/migrations/', import.meta.url).pathname

export function migrationFiles({ onlyBaseline = false } = {}) {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
  return onlyBaseline ? files.slice(0, 1) : files
}

/** Sortiert Arrays stabil, damit die Reihenfolge der Aggregation nichts verfälscht. */
function normalise(value) {
  if (Array.isArray(value)) {
    return value
      .map(normalise)
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, normalise(value[k])]),
    )
  }
  return value
}

/**
 * Standardrechte, die die Supabase-Plattform selbst als `supabase_admin` setzt.
 *
 * Sie gehören nicht zum Anwendungsschema und lassen sich aus einer Migration
 * auch gar nicht herstellen: `alter default privileges for role supabase_admin`
 * scheitert als `postgres` mit „permission denied to change default privileges".
 * Sie sind in der Inventur dokumentiert, aber vom Reproduzierbarkeitsvergleich
 * ausgenommen.
 */
function isPlatformOwned(section, row) {
  return section === 'default_grants' && row.grantor === 'supabase_admin'
}

function diffSections(actual, rebuilt) {
  const findings = []
  for (const section of Object.keys(actual)) {
    const a = actual[section].filter((row) => !isPlatformOwned(section, row))
    const b = (rebuilt[section] ?? []).filter((row) => !isPlatformOwned(section, row))
    const as = new Set(a.map((x) => JSON.stringify(x)))
    const bs = new Set(b.map((x) => JSON.stringify(x)))
    const onlyLive = [...as].filter((x) => !bs.has(x))
    const onlyRebuilt = [...bs].filter((x) => !as.has(x))
    if (onlyLive.length || onlyRebuilt.length) {
      findings.push({ section, onlyLive, onlyRebuilt })
    }
  }
  return findings
}

async function main() {
  const onlyBaseline = process.argv.includes('--nur-baseline')
  const files = migrationFiles({ onlyBaseline })

  console.log(`Migrationen: ${files.join(', ')}`)

  const live = (await runSql('begin;\n' + SEARCH_PATH + fingerprintSql('public') + ';\nrollback;'))[0]
    .fingerprint

  const sql = [
    'begin;',
    // `drop owned` fasst auch Standardrechte; das Schema selbst wird neu gebaut.
    'drop schema if exists public cascade;',
    'create schema public;',
    ...files.map((f) => readFileSync(join(MIGRATIONS_DIR, f), 'utf8')),
    SEARCH_PATH,
    fingerprintSql('public') + ';',
    'rollback;',
  ].join('\n')

  let rebuilt
  try {
    const rows = await runSql(sql)
    rebuilt = rows[0].fingerprint
  } catch (err) {
    console.error('Wiederaufbau fehlgeschlagen – Transaktion wurde verworfen.')
    console.error(err.message)
    process.exit(1)
  }

  // Gegenprobe: das Schema muss nach dem Rollback unverändert sein.
  const after = (await runSql('begin;\n' + SEARCH_PATH + fingerprintSql('public') + ';\nrollback;'))[0]
    .fingerprint
  if (JSON.stringify(normalise(live)) !== JSON.stringify(normalise(after))) {
    console.error('FEHLER: Das Schema hat sich durch den Test verändert. Bitte prüfen.')
    process.exit(1)
  }

  const findings = diffSections(normalise(live), normalise(rebuilt))

  if (findings.length === 0) {
    console.log('\nOK – der Wiederaufbau aus den Migrationen entspricht dem laufenden Schema.')
    return
  }

  const limit = Number(process.env.DB_DIFF_LIMIT ?? 40)
  console.log('\nAbweichungen:')
  for (const f of findings) {
    console.log(`\n[${f.section}] nur live: ${f.onlyLive.length}, nur nachgebaut: ${f.onlyRebuilt.length}`)
    for (const x of f.onlyLive.slice(0, limit)) console.log('  - live    ', x)
    for (const x of f.onlyRebuilt.slice(0, limit)) console.log('  + nachgeb.', x)
  }
  process.exit(1)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
}
