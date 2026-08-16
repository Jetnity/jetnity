/**
 * Findet benannte Exporte, die niemand importiert.
 *
 * Die Erreichbarkeitsanalyse (scripts/erreichbarkeit.mjs) arbeitet auf
 * Dateiebene: Sie sieht, dass components/ui/card.tsx importiert wird, aber
 * nicht, dass daraus nur fuenf von elf Exporten je verwendet werden. Diese
 * Analyse schliesst die Luecke.
 *
 * Nicht gemeldet werden:
 * - Standardexporte: Next.js laedt Seiten und Layouts darueber, und ein
 *   Standardexport hat keinen Namen, an dem sich eine Verwendung erkennen
 *   liesse.
 * - Typen und Schnittstellen: Sie kosten zur Laufzeit nichts und beschreiben
 *   oft die Signatur eines benutzten Exports.
 * - Dateien unter app/: dort sind Exporte wie `dynamic`, `metadata` oder
 *   `generateMetadata` Vertrag gegenueber dem Framework.
 * - erzeugte Dateien (GENERIERT): Ihr Inhalt kommt aus dem Datenbankschema und
 *   wird nicht von Hand gepflegt.
 *
 * Der Abgleich laeuft ueber den Namen, nicht ueber die Importkette. Ein Name,
 * der irgendwo im Quellcode ausserhalb seiner eigenen Datei vorkommt, gilt als
 * benutzt. Das meldet im Zweifel zu wenig statt zu viel – gewollt, damit die
 * Ausgabe belastbar bleibt.
 *
 * ABSICHTLICH ist eine Ausnahmeliste fuer Exporte, die bewusst ohne Aufrufer
 * bleiben. Jeder Eintrag traegt seinen Grund.
 *
 * Aufruf: node scripts/exporte.mjs
 * Exit-Code 1, wenn ein unbegruendeter Export ohne Aufrufer gefunden wird.
 */
import { readFileSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { join, extname, relative } from 'node:path'

const ROOT = process.cwd()
const CODE = new Set(['.ts', '.tsx'])
const BEOBACHTET = ['components', 'lib', 'types', 'hooks']

// Aus dem Datenbankschema erzeugt, nicht von Hand gepflegt.
const GENERIERT = ['types/supabase.ts']

// Bewusst ohne Aufrufer – mit Grund.
const ABSICHTLICH = new Map([
  [
    'lib/supabase/client.ts:startSupabaseAuthListener',
    'haelt die Server-Cookies mit der Browser-Sitzung im Takt und ist die Gegenseite von app/auth/refresh; wird beim Vereinheitlichen von Auth und Middleware eingebunden oder ersetzt',
  ],
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

const dateien = await alleDateien(ROOT)
const quellen = new Map(dateien.map((d) => [d, readFileSync(d, 'utf8')]))

/** Benannte Laufzeitexporte einer Datei. */
const exporteVon = (text) => {
  const namen = new Set()

  // export const/function/class Name
  for (const m of text.matchAll(/^export\s+(?:async\s+)?(?:const|let|var|function\*?|class)\s+([A-Za-z_$][\w$]*)/gm)) {
    namen.add(m[1])
  }
  // export { A, B as C }
  for (const m of text.matchAll(/^export\s*\{([^}]*)\}(?!\s*from)/gm)) {
    for (const teil of m[1].split(',')) {
      const t = teil.trim()
      if (!t) continue
      if (/^type\s/.test(t)) continue
      const name = (t.split(/\s+as\s+/).pop() || '').trim()
      if (name && /^[A-Za-z_$][\w$]*$/.test(name)) namen.add(name)
    }
  }
  return namen
}

const beobachtet = dateien.filter((d) => {
  const rel = relative(ROOT, d)
  if (GENERIERT.includes(rel)) return false
  return BEOBACHTET.some((b) => rel.startsWith(b + '/'))
})

const befunde = []
for (const datei of beobachtet) {
  const text = quellen.get(datei)
  const namen = exporteVon(text)
  if (namen.size === 0) continue

  for (const name of namen) {
    const muster = new RegExp(`\\b${name.replace(/\$/g, '\\$')}\\b`)
    let benutzt = false
    for (const [andere, anderText] of quellen) {
      if (andere === datei) continue
      if (muster.test(anderText)) { benutzt = true; break }
    }
    if (!benutzt) befunde.push({ datei: relative(ROOT, datei), name })
  }
}

console.log(`geprueft: ${beobachtet.length} Dateien`)
console.log(`Exporte ohne Aufrufer: ${befunde.length}\n`)

let unbegruendet = 0
for (const b of befunde.sort((a, z) => (a.datei + a.name).localeCompare(z.datei + z.name))) {
  const grund = ABSICHTLICH.get(`${b.datei}:${b.name}`)
  if (grund) console.log(`  behalten   ${b.datei} :: ${b.name}\n             ${grund}`)
  else { console.log(`  OHNE AUFRUFER  ${b.datei} :: ${b.name}`); unbegruendet++ }
}
if (unbegruendet === 0) console.log('Kein unbegruendeter Export ohne Aufrufer.')

if (unbegruendet > 0) {
  console.log(`\n${unbegruendet} Export(e) ohne Aufrufer und ohne Begruendung. Entfernen, nicht exportieren oder in ABSICHTLICH begruenden.`)
  process.exitCode = 1
}
