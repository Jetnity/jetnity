/**
 * Erreichbarkeitsanalyse ueber die Importkette.
 *
 * Startpunkte sind alles, was Next.js selbst laedt: Seiten, Layouts, Fehler-
 * und Ladeflaechen, Route Handler, Middleware und die Konfigurationsdateien
 * im Wurzelverzeichnis. Dazu die Testdateien, die der Test-Runner laedt.
 * Von dort werden die Importe verfolgt.
 *
 * Ergebnis: Welche Dateien unter app/, components/, lib/, types/ und hooks/
 * werden von keinem Startpunkt aus erreicht? Absicht ist eine belastbare
 * Liste statt einer Textsuche, die transitive Ketten uebersieht.
 *
 * ABSICHTLICH ist eine Ausnahmeliste fuer Dateien, die bewusst unerreichbar
 * bleiben. Jeder Eintrag traegt seinen Grund.
 *
 * Aufruf: node scripts/erreichbarkeit.mjs [--json]
 * Exit-Code 1, wenn eine verwaiste Datei ohne Begruendung gefunden wird.
 */
import { readFileSync, existsSync, statSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join, dirname, resolve, relative, extname } from 'node:path'

const ROOT = process.cwd()
const CODE = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const BEOBACHTET = ['app', 'components', 'lib', 'types', 'hooks', 'config', 'styles', 'utils']

// Bewusst unerreichbar – mit Grund.
const ABSICHTLICH = new Map([
  [
    'components/layout/CookieConsent.tsx',
    'wartet auf die Rechts-/Produktentscheidung zum Cookie-Banner; wird erst dann eingebunden oder entfernt',
  ],
])

// Next.js laedt diese Dateinamen selbst, ohne dass sie importiert werden.
const ROUTEN_DATEIEN = new Set([
  'page', 'layout', 'template', 'error', 'global-error', 'not-found',
  'loading', 'route', 'default', 'head', 'sitemap', 'robots', 'manifest',
  'icon', 'apple-icon', 'opengraph-image', 'twitter-image',
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

const aufloesen = (spez, vonDatei) => {
  let basis
  if (spez.startsWith('@/')) basis = join(ROOT, spez.slice(2))
  else if (spez.startsWith('.')) basis = resolve(dirname(vonDatei), spez)
  else return null // Paket

  const kandidaten = []
  if (extname(basis) && CODE.has(extname(basis))) kandidaten.push(basis)
  for (const e of CODE) kandidaten.push(basis + e)
  for (const e of CODE) kandidaten.push(join(basis, 'index' + e))

  for (const k of kandidaten) {
    if (existsSync(k) && statSync(k).isFile()) return k
  }
  return null
}

const IMPORT_MUSTER = [
  /\bimport\s+[^'"()]*?from\s*['"]([^'"]+)['"]/g,
  /\bimport\s*['"]([^'"]+)['"]/g,
  /\bexport\s+[^'"()]*?from\s*['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
]

const importeVon = (datei) => {
  let text
  try {
    text = readFileSync(datei, 'utf8')
  } catch {
    return []
  }
  const out = new Set()
  for (const muster of IMPORT_MUSTER) {
    muster.lastIndex = 0
    let m
    while ((m = muster.exec(text))) {
      const ziel = aufloesen(m[1], datei)
      if (ziel) out.add(ziel)
    }
  }
  return [...out]
}

const IST_TEST = /\.(test|spec)\.[cm]?[jt]sx?$/

const istStartpunkt = (datei) => {
  const rel = relative(ROOT, datei)
  if (!rel.includes('/')) return true // Wurzeldateien: middleware.ts, next.config, tailwind.config
  if (rel.startsWith('scripts/')) return true
  // Testdateien laedt `npm test` direkt; sie sind Startpunkte, keine Waisen.
  if (IST_TEST.test(rel)) return true
  if (!rel.startsWith('app/')) return false
  const name = datei.split('/').pop().replace(/\.[^.]+$/, '')
  return ROUTEN_DATEIEN.has(name)
}

const dateien = await alleDateien(ROOT)
const startpunkte = dateien.filter(istStartpunkt)

const erreicht = new Set()
const stapel = [...startpunkte]
while (stapel.length) {
  const d = stapel.pop()
  if (erreicht.has(d)) continue
  erreicht.add(d)
  for (const i of importeVon(d)) if (!erreicht.has(i)) stapel.push(i)
}

const beobachtet = dateien.filter((d) => {
  const rel = relative(ROOT, d)
  return BEOBACHTET.some((b) => rel.startsWith(b + '/'))
})
const verwaist = beobachtet.filter((d) => !erreicht.has(d)).map((d) => relative(ROOT, d)).sort()

const unbegruendet = verwaist.filter((v) => !ABSICHTLICH.has(v))

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ startpunkte: startpunkte.length, erreicht: erreicht.size, verwaist, unbegruendet }, null, 2))
} else {
  console.log(`Startpunkte:        ${startpunkte.length}`)
  console.log(`erreichbare Module: ${erreicht.size}`)
  console.log(`verwaist:           ${verwaist.length}\n`)
  for (const v of verwaist) {
    const grund = ABSICHTLICH.get(v)
    if (grund) console.log(`  behalten   ${v}\n             ${grund}`)
    else console.log(`  VERWAIST   ${v}`)
  }
  if (unbegruendet.length === 0) console.log('\nKeine unbegruendet verwaiste Datei.')
}

if (unbegruendet.length > 0) {
  console.log(`\n${unbegruendet.length} verwaiste Datei(en) ohne Begruendung. Entfernen oder in ABSICHTLICH begruenden.`)
  process.exitCode = 1
}
