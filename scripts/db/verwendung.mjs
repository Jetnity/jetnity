#!/usr/bin/env node
// Welche Tabellen und RPCs benutzt der Anwendungscode wirklich?
//
// Ein `rg tabellenname` zählt zu viel: `payments` trifft auch die Funktion
// `admin_payments_summary_30d`, `refunds` auch die Route `payments/refund`. Für
// die Entscheidung, ob eine Struktur obsolet ist, reicht das nicht – genau
// diese Entscheidung stand in Phase 1.4b für 29 Tabellen an. Dieses Modul sucht
// deshalb nur nach den Stellen, an denen der Supabase-Client eine Struktur
// tatsächlich anspricht:
//
//   .from('tabelle')      Tabellen- und View-Zugriff
//   .rpc('funktion')      Funktionsaufruf
//
// Migrationen, generierte Typen und die Skripte hier zählen nicht als Verwendung.
//
// Aufruf:
//   npm run db:verwendung             # auflisten
//   npm run db:verwendung -- --pruefen # gegen types/supabase.ts prüfen
//
// `--pruefen` schlägt fehl, sobald der Code eine Struktur anspricht, die es im
// Schema nicht gibt. Die Prüfung liest nur die erzeugte Typdatei und braucht
// deshalb keinen Datenbankzugang – sie läuft in der CI mit.

import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const IGNORIERTE_PFADE = [
  /^supabase\/migrations\//,
  /^scripts\/db\//,
  /^types\/supabase/,
  /^node_modules\//,
  /\.md$/,
]

const QUELL_ENDUNGEN = /\.(ts|tsx|js|jsx|mjs|cjs)$/

/** Alle vom Projekt versionierten Quelldateien. */
function quelldateien() {
  const out = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
  return out
    .split('\n')
    .filter(Boolean)
    .filter((f) => QUELL_ENDUNGEN.test(f))
    .filter((f) => !IGNORIERTE_PFADE.some((re) => re.test(f)))
}

const FROM_RE = /\.from\(\s*['"`]([\w.]+)['"`]/g
const RPC_RE = /\.rpc\(\s*['"`]([\w.]+)['"`]/g

/**
 * One reviewed LOCAL/UNAPPLIED public wrapper. Not a live generated-schema
 * claim and not a generic unknown-RPC exemption.
 */
export const LOCAL_UNAPPLIED_RPCS = Object.freeze([
  Object.freeze({
    name: 'admin_account_counts_v1',
    sourcePath: 'lib/admin/account-counts-delivery/reader.ts',
    sqlPath: 'scripts/db/admin-account-counts-delivery-1-rpc.sql',
  }),
])

function lokaleRpcRegel(name) {
  const kurz = name.replace(/^public\./, '')
  return LOCAL_UNAPPLIED_RPCS.find((regel) => regel.name === kurz) ?? null
}

/**
 * Liefert `{ tabellen, rpcs }` – jeweils Name -> Liste der Fundstellen.
 * Tests may inject `dateien` and `lese` instead of walking the live git tree.
 */
export function verwendung(optionen = {}) {
  const tabellen = new Map()
  const rpcs = new Map()
  const dateien = optionen.dateien ?? quelldateien()
  const lese = optionen.lese ?? ((datei) => readFileSync(datei, 'utf8'))

  for (const datei of dateien) {
    let inhalt
    try {
      inhalt = lese(datei)
    } catch {
      continue
    }
    const zeilen = inhalt.split('\n')
    zeilen.forEach((zeile, i) => {
      for (const [re, ziel] of [
        [FROM_RE, tabellen],
        [RPC_RE, rpcs],
      ]) {
        re.lastIndex = 0
        let m
        while ((m = re.exec(zeile))) {
          const name = m[1]
          if (!ziel.has(name)) ziel.set(name, [])
          ziel.get(name).push(`${datei}:${i + 1}`)
        }
      }
    })
  }

  return { tabellen, rpcs }
}

const TYPEN_DATEI = 'types/supabase.ts'

/**
 * Namen der Einträge eines Abschnitts aus der erzeugten Typdatei.
 *
 * Die Datei ist stabil eingerückt: Abschnitte stehen auf vier Leerzeichen, ihre
 * Einträge auf sechs. Das reicht, um die Namen ohne TypeScript-Parser zu lesen.
 * Was nach dem Doppelpunkt folgt, ist gleichgültig – eine Funktion mit mehreren
 * Signaturen beginnt ihre Vereinigung erst in der nächsten Zeile.
 */
function namenAusTypen(inhalt, abschnitt) {
  const zeilen = inhalt.split('\n')
  const start = zeilen.findIndex((z) => z === `    ${abschnitt}: {`)
  if (start < 0) return new Set()

  const namen = new Set()
  for (let i = start + 1; i < zeilen.length; i++) {
    if (zeilen[i] === '    }') break
    const treffer = zeilen[i].match(/^ {6}"?([A-Za-z_][\w]*)"?:/)
    if (treffer) namen.add(treffer[1])
  }
  return namen
}

function sqlDateiPruefen(regel, optionen) {
  const vorhanden =
    optionen.sqlVorhanden?.(regel.sqlPath) ?? existsSync(regel.sqlPath)
  if (!vorhanden) return { ok: false, grund: 'missing-sql' }
  const inhalt = optionen.sqlInhalt?.(regel.sqlPath) ?? readFileSync(regel.sqlPath, 'utf8')
  if (!inhalt.includes(regel.name)) return { ok: false, grund: 'missing-sql' }
  return { ok: true }
}

/** Vergleicht die Fundstellen im Code mit dem Schema und liefert die Befunde. */
export function pruefe(optionen = {}) {
  const { tabellen, rpcs } = verwendung(optionen)
  const inhalt = optionen.typenInhalt ?? readFileSync(TYPEN_DATEI, 'utf8')

  const bekannteTabellen = new Set([
    ...namenAusTypen(inhalt, 'Tables'),
    ...namenAusTypen(inhalt, 'Views'),
  ])
  const bekannteFunktionen = namenAusTypen(inhalt, 'Functions')

  const befunde = []
  const lokaleUnapplied = []
  for (const [art, benutzt, bekannt] of [
    ['Tabelle', tabellen, bekannteTabellen],
    ['RPC', rpcs, bekannteFunktionen],
  ]) {
    for (const [name, stellen] of [...benutzt.entries()].sort()) {
      // Ein Schemapräfix kommt in der Typdatei nicht vor; nur `public` zählt.
      const kurz = name.replace(/^public\./, '')
      if (bekannt.has(kurz)) continue

      if (art === 'RPC') {
        const regel = lokaleRpcRegel(name)
        if (regel) {
          const fremd = stellen.filter((stelle) => !stelle.startsWith(`${regel.sourcePath}:`))
          if (fremd.length > 0) {
            befunde.push({ art, name, stellen: fremd, grund: 'wrong-source' })
            continue
          }
          const sql = sqlDateiPruefen(regel, optionen)
          if (!sql.ok) {
            befunde.push({ art, name, stellen, grund: sql.grund })
            continue
          }
          lokaleUnapplied.push({
            art,
            name: regel.name,
            stellen,
            sourcePath: regel.sourcePath,
            sqlPath: regel.sqlPath,
            classification: 'LOCAL/UNAPPLIED',
          })
          continue
        }
      }

      befunde.push({ art, name, stellen })
    }
  }
  return { befunde, lokaleUnapplied, bekannteTabellen, bekannteFunktionen }
}

function main() {
  if (process.argv.includes('--pruefen')) {
    const { befunde, lokaleUnapplied, bekannteTabellen, bekannteFunktionen } = pruefe()
    if (befunde.length === 0) {
      console.log(
        `Jede angesprochene generierte Struktur existiert – geprüft gegen ${bekannteTabellen.size} Tabellen/Views und ${bekannteFunktionen.size} Funktionen in ${TYPEN_DATEI}.`,
      )
      for (const lokal of lokaleUnapplied) {
        console.log(
          `LOCAL/UNAPPLIED ${lokal.art} ${lokal.name} from ${lokal.sourcePath} → ${lokal.sqlPath} (not in generated schema)`,
        )
      }
      return
    }
    console.error(`${befunde.length} Zugriff(e) auf Strukturen, die es im Schema nicht gibt:\n`)
    for (const { art, name, stellen, grund } of befunde) {
      console.error(`  ${art} ${name}${grund ? ` [${grund}]` : ''}`)
      for (const stelle of stellen) console.error(`    ${stelle}`)
    }
    console.error(
      `\nEntweder zeigt der Code auf den falschen Namen, oder die Struktur fehlt in einer Migration.`,
    )
    process.exit(1)
  }

  const { tabellen, rpcs } = verwendung()
  for (const [titel, map] of [
    ['Tabellen / Views', tabellen],
    ['RPCs', rpcs],
  ]) {
    console.log(`\n=== ${titel} (${map.size}) ===`)
    for (const [name, stellen] of [...map.entries()].sort()) {
      const lokal = titel === 'RPCs' && lokaleRpcRegel(name)
      const marke = lokal ? ' LOCAL/UNAPPLIED (not in generated schema)' : ''
      console.log(
        `  ${name.padEnd(34)} ${stellen.length}x${marke}  ${stellen.slice(0, 3).join('  ')}`,
      )
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main()
