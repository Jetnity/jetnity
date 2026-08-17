#!/usr/bin/env node
// Welche Tabellen und RPCs benutzt der Anwendungscode wirklich?
//
// Ein `rg tabellenname` zählt zu viel: `payments` trifft auch `admin_payments`,
// `session_metrics` auch `creator_session_metrics`. Für die Entscheidung, ob eine
// Struktur obsolet ist, reicht das nicht. Dieses Modul sucht deshalb nur nach den
// Stellen, an denen der Supabase-Client eine Struktur tatsächlich anspricht:
//
//   .from('tabelle')      Tabellen- und View-Zugriff
//   .rpc('funktion')      Funktionsaufruf
//
// Migrationen, generierte Typen und die Skripte hier zählen nicht als Verwendung.

import { readFileSync } from 'node:fs'
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
 * Liefert `{ tabellen, rpcs }` – jeweils Name -> Liste der Fundstellen.
 */
export function verwendung() {
  const tabellen = new Map()
  const rpcs = new Map()

  for (const datei of quelldateien()) {
    let inhalt
    try {
      inhalt = readFileSync(datei, 'utf8')
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

function main() {
  const { tabellen, rpcs } = verwendung()
  for (const [titel, map] of [
    ['Tabellen / Views', tabellen],
    ['RPCs', rpcs],
  ]) {
    console.log(`\n=== ${titel} (${map.size}) ===`)
    for (const [name, stellen] of [...map.entries()].sort()) {
      console.log(`  ${name.padEnd(34)} ${stellen.length}x  ${stellen.slice(0, 3).join('  ')}`)
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main()
