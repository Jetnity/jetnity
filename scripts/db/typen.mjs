#!/usr/bin/env node
// Erzeugt types/supabase.ts aus dem Development-Branch.
//
// Die Datei ist die einzige Beschreibung des Schemas für TypeScript. Sie wird
// nicht von Hand gepflegt: Wer eine Spalte ändert, schreibt eine Migration und
// lässt die Typen danach neu erzeugen.
//
// Aufruf:
//   npm run db:typen           # Datei schreiben
//   npm run db:typen -- --pruefen   # nur vergleichen, nichts schreiben
//
// `--pruefen` ist für die CI gedacht: Der Lauf schlägt fehl, sobald die Typen
// im Repository nicht mehr zum Schema passen.

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const ZIEL = new URL('../../types/supabase.ts', import.meta.url).pathname

const KOPF = `// Erzeugt aus dem Supabase-Development-Branch mit \`npm run db:typen\`.
// Nicht von Hand ändern – Änderungen gehören in eine Migration.

`

function erzeuge() {
  const ref = process.env.SUPABASE_PROJECT_REF
  if (!ref) throw new Error('SUPABASE_PROJECT_REF fehlt')
  if (!process.env.SUPABASE_ACCESS_TOKEN) throw new Error('SUPABASE_ACCESS_TOKEN fehlt')

  const out = execFileSync(
    'npx',
    ['--yes', 'supabase@latest', 'gen', 'types', 'typescript', '--project-id', ref, '--schema', 'public'],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  )
  return KOPF + out
}

function main() {
  const neu = erzeuge()
  const pruefen = process.argv.includes('--pruefen')

  let alt = ''
  try {
    alt = readFileSync(ZIEL, 'utf8')
  } catch {
    // Datei fehlt – gilt als Abweichung.
  }

  if (alt === neu) {
    console.log('types/supabase.ts entspricht dem Schema.')
    return
  }

  if (pruefen) {
    console.error('types/supabase.ts weicht vom Schema ab. `npm run db:typen` ausführen.')
    process.exit(1)
  }

  writeFileSync(ZIEL, neu)
  console.log('types/supabase.ts neu erzeugt.')
}

main()
