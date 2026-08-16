/**
 * Vergleicht die Abhaengigkeiten in package.json mit den Paketen, die im
 * Quellcode tatsaechlich importiert werden.
 *
 * Ein Paket gilt als benutzt, wenn es importiert wird oder in einem
 * npm-Skript aufgerufen wird. Werkzeuge, die allein ueber Konfiguration
 * wirken (Build, Lint, PostCSS, Tailwind-Plugins), stehen in OHNE_IMPORT;
 * ihr Fehlen im Code sagt nichts ueber ihre Notwendigkeit aus.
 *
 * ABSICHTLICH ist eine Ausnahmeliste: Pakete, die noch nicht importiert
 * werden, aber mit Begruendung bleiben. Jeder Eintrag traegt seinen Grund.
 *
 * Aufruf: node scripts/pakete.mjs
 * Exit-Code 1, wenn ein unbegruendetes Paket ohne Verwendung gefunden wird.
 */
import { readFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join, extname, relative } from 'node:path'

const ROOT = process.cwd()
const CODE = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css'])

// Wirken ueber Konfiguration statt ueber Importe.
const OHNE_IMPORT = new Set([
  'next', 'react', 'react-dom', 'typescript', 'tailwindcss', 'postcss',
  'autoprefixer', 'eslint', 'eslint-config-next',
  'tailwindcss-animate', 'tailwind-scrollbar-hide',
])

// Noch nicht importiert, bleibt aber mit Begruendung (ADR-0026).
const ABSICHTLICH = new Map([
  ['zod', 'Laufzeitvalidierung der strukturierten V2-Reisedaten und der Modellantworten'],
])

const alleDateien = async (dir, acc = []) => {
  let einträge
  try {
    einträge = await readdir(dir, { withFileTypes: true })
  } catch {
    return acc
  }
  for (const e of einträge) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue
    const p = join(dir, e.name)
    if (e.isDirectory()) await alleDateien(p, acc)
    else if (CODE.has(extname(e.name))) acc.push(p)
  }
  return acc
}

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
const dateien = await alleDateien(ROOT)

// Paketnamen aus Importen sammeln. Bei Scopes gehoert der zweite Teil dazu.
const paketVon = (spez) => {
  if (spez.startsWith('.') || spez.startsWith('@/') || spez.startsWith('/')) return null
  const teile = spez.split('/')
  return spez.startsWith('@') ? teile.slice(0, 2).join('/') : teile[0]
}

const MUSTER = [
  /\bfrom\s*['"]([^'"]+)['"]/g,
  /\bimport\s*['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
]

const benutzt = new Map() // Paket -> Set(Datei)
for (const d of dateien) {
  const text = readFileSync(d, 'utf8')
  for (const muster of MUSTER) {
    muster.lastIndex = 0
    let m
    while ((m = muster.exec(text))) {
      const p = paketVon(m[1])
      if (!p) continue
      if (!benutzt.has(p)) benutzt.set(p, new Set())
      benutzt.get(p).add(relative(ROOT, d))
    }
  }
}

// Ein in einem npm-Skript aufgerufenes Werkzeug zaehlt als benutzt.
const skripte = Object.values(pkg.scripts || {}).join(' ')
const imSkript = (name) => new RegExp(`(^|[\\s"'&|])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s"'&|]|$)`).test(skripte)

let unbegruendet = 0

for (const feld of ['dependencies', 'devDependencies']) {
  const deps = pkg[feld] || {}
  const offen = []
  let geprueft = 0
  for (const name of Object.keys(deps).sort()) {
    if (OHNE_IMPORT.has(name)) continue
    if (name.startsWith('@types/')) continue // gehoeren zu ihrem Laufzeitpaket
    geprueft++
    if (benutzt.has(name) || imSkript(name)) continue
    offen.push(name)
  }
  console.log(`\n${feld}: ${geprueft} geprueft, ${offen.length} ohne Verwendung`)
  for (const name of offen) {
    const grund = ABSICHTLICH.get(name)
    if (grund) console.log(`  behalten     ${name} – ${grund}`)
    else { console.log(`  UNGENUTZT    ${name}`); unbegruendet++ }
  }
}

const konfig = [...OHNE_IMPORT].filter((n) => pkg.dependencies?.[n] || pkg.devDependencies?.[n])
console.log(`\nnicht geprueft (wirken ueber Konfiguration): ${konfig.join(', ')}`)

if (unbegruendet > 0) {
  console.log(`\n${unbegruendet} Paket(e) ohne Verwendung und ohne Begruendung.`)
  process.exitCode = 1
}
