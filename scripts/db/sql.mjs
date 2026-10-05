#!/usr/bin/env node
// Führt SQL gegen den Supabase-Branch aus, auf den SUPABASE_PROJECT_REF zeigt.
// Bewusst nur über die Management-API: kein Service-Role-Key, keine Direktverbindung,
// keine Möglichkeit, versehentlich das Production-Projekt zu treffen (Ref kommt aus der Umgebung).
//
// Aufruf:
//   node scripts/db/sql.mjs "select 1"
//   node scripts/db/sql.mjs --file pfad/zur/datei.sql
//   echo "select 1" | node scripts/db/sql.mjs --stdin
//
// Ausgabe: JSON auf stdout. Fehler gehen mit Exit-Code 1 nach stderr.

import { readFileSync } from 'node:fs'

const API = 'https://api.supabase.com/v1'

export async function runSql(query) {
  const token = process.env.SUPABASE_ACCESS_TOKEN
  const ref = process.env.SUPABASE_PROJECT_REF
  if (!token) throw new Error('SUPABASE_ACCESS_TOKEN fehlt')
  if (!ref) throw new Error('SUPABASE_PROJECT_REF fehlt')

  const res = await fetch(`${API}/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })

  const text = await res.text()
  if (!res.ok) {
    // Der Body kann die Fehlermeldung von Postgres enthalten, aber niemals das Token.
    throw new Error(`SQL fehlgeschlagen (HTTP ${res.status}): ${text}`)
  }
  return text ? JSON.parse(text) : []
}

async function readStdin() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

async function main() {
  const args = process.argv.slice(2)
  let query
  if (args[0] === '--file') query = readFileSync(args[1], 'utf8')
  else if (args[0] === '--stdin') query = await readStdin()
  else query = args.join(' ')

  if (!query || !query.trim()) {
    console.error('Kein SQL übergeben.')
    process.exit(1)
  }

  const rows = await runSql(query)
  process.stdout.write(JSON.stringify(rows, null, 2) + '\n')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
}
