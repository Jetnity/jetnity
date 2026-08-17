// check-jetnity-setup.ts
// Jetnity Setup-Check – Mega Pro (TypeScript, no deps)

import fs from 'node:fs'
import path from 'node:path'

/* ───────────────────────── CLI ───────────────────────── */
const argv = process.argv.slice(2)
const flag = (name: string, def = false) => (argv.includes(`--${name}`) ? true : def)
const arg = (name: string, def = '') => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 ? (argv[i + 1] ?? def) : def
}

const ROOT = path.resolve(arg('root', process.cwd()))
const FIX = flag('fix')
const CI = flag('ci')
const VERBOSE = flag('verbose')

/* ───────────────────────── Pretty Output ───────────────────────── */
const supportsColor = process.stdout.isTTY
const color = (c: string) => (s: string) => (supportsColor ? `\x1b[${c}m${s}\x1b[0m` : s)
const gray = color('90')
const green = color('32')
const yellow = color('33')
const red = color('31')
const cyan = color('36')
const bold = color('1')
const log = {
  info: (m: string) => console.log(gray('•'), m),
  ok: (m: string) => console.log(green('✅'), m),
  warn: (m: string) => console.log(yellow('⚠️ '), m),
  err: (m: string) => console.log(red('❌'), m),
  head: (m: string) => console.log(bold(cyan('\n' + m))),
}
let ERRORS = 0
let WARNINGS = 0
const fail = (m: string) => {
  ERRORS++
  log.err(m)
}
const warn = (m: string) => {
  WARNINGS++
  log.warn(m)
}

/* ───────────────────────── Config ───────────────────────── */
const mustExist = [
  'tsconfig.json',
  'lib/supabase/client.ts',
  'lib/supabase/server.ts',
  // Die Schematypen liegen nur noch hier. Eine zweite, kleinere Fassung unter
  // types/supabase.types.ts war ein veralteter Abzug ohne Importe.
  'types/supabase.ts',
]

const bannedPackages = [
  '@supabase/auth-helpers-react',
  '@supabase/auth-helpers-nextjs',
  '@supabase/auth-helpers-shared',
]

// createServerComponentClient darf NUR aus '@/lib/supabase/server' kommen
const badCreateServerImport =
  /import\s*{[^}]*createServerComponentClient[^}]*}\s*from\s*['"](?!@\/lib\/supabase\/server)['"]/g

// Ignorieren (Ordner + spezifische Files)
const ignore = new Set([
  'node_modules',
  '.next',
  '.git',
  '.turbo',
  'dist',
  'build',
  '.vercel',
  '.cache',
  'scripts',                 // gesamten scripts/ Ordner ignorieren (optional)
  'check-jetnity-setup.ts',  // dieses File
  'check-jetnity-setup.mjs', // mjs-Variante, falls vorhanden
])

/* ───────────────────────── Helpers ───────────────────────── */
const join = (...p: string[]) => path.join(ROOT, ...p)
const exists = (p: string) => fs.existsSync(join(p))

function* walk(dir: string): Iterable<string> {
  const full = join(dir)
  if (!fs.existsSync(full)) return
  for (const ent of fs.readdirSync(full, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      if (ignore.has(ent.name)) continue
      yield* walk(path.join(dir, ent.name))
    } else {
      yield path.join(dir, ent.name)
    }
  }
}
function readJson<T = any>(p: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(join(p), 'utf8')) as T
  } catch {
    return null
  }
}
const mask = (v?: string) => (!v ? '—' : v.length <= 8 ? '••••' : `${v.slice(0, 2)}••••${v.slice(-4)}`)

/* ───────────────────────── Checks ───────────────────────── */
function checkMustExist() {
  log.head('🔎 Dateien – müssen existieren')
  for (const f of mustExist) (exists(f) ? log.ok(`${f} gefunden`) : fail(`${f} fehlt`))
}

function checkForbiddenImports() {
  log.head('🧹 Verbotene/alte Imports')

  // Echte Imports/Requires extrahieren
  const importRe =
    /import\s+[^'"]*from\s*['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)/g

  for (const file of walk('.')) {
    if (!/\.(ts|tsx|js|jsx|mjs)$/.test(file)) continue
    if (file.endsWith('check-jetnity-setup.ts') || file.endsWith('check-jetnity-setup.mjs')) continue
    if (file.startsWith('scripts/')) continue

    const content = fs.readFileSync(join(file), 'utf8')

    // 1) Veraltete Pakete nur melden, wenn wirklich importiert/required
    let m: RegExpExecArray | null
    while ((m = importRe.exec(content))) {
      const spec = m[1] || m[2] // import ... from 'spec' | require('spec')
      if (spec && bannedPackages.includes(spec)) {
        fail(`Veraltetes Paket in ${file}: ${spec}`)
      }
    }

    // 2) createServerComponentClient nur erlaubt aus '@/lib/supabase/server'
    if (badCreateServerImport.test(content)) {
      fail(
        `Falscher Import von createServerComponentClient in ${file} ` +
          `(muss aus "@/lib/supabase/server" kommen)`
      )
    }
  }

  log.ok('Import-Scan abgeschlossen')
}

function checkTsconfig() {
  log.head('⚙️  tsconfig.json')
  const ts = readJson<any>('tsconfig.json')
  if (!ts) {
    fail('tsconfig.json nicht lesbar')
    return
  }
  ts.compilerOptions ??= {}
  const co = ts.compilerOptions as Record<string, any>

  if (co.baseUrl !== '.') {
    if (FIX) {
      co.baseUrl = '.'
      log.ok('baseUrl → "." (fix)')
    } else warn('baseUrl sollte "." sein')
  } else log.ok('baseUrl ist "."')

  const desiredPaths = { '@/*': ['./*'] }
  const samePaths = JSON.stringify(co.paths || {}) === JSON.stringify(desiredPaths)
  if (!samePaths) {
    if (FIX) {
      co.paths = desiredPaths
      log.ok('paths → { "@/*": ["./*"] } (fix)')
    } else warn('Pfadalias "@/..." fehlt oder ist abweichend')
  } else log.ok('Pfadalias @/* korrekt')

  if (co.strict !== true) {
    if (FIX) {
      co.strict = true
      log.ok('strict → true (fix)')
    } else warn('compilerOptions.strict = true empfohlen')
  } else log.ok('strict ist aktiv')

  if (co.moduleResolution !== 'bundler') {
    if (FIX) {
      co.moduleResolution = 'bundler'
      log.ok('moduleResolution → "bundler" (fix)')
    } else warn('moduleResolution "bundler" empfohlen (Next + TS 5)')
  } else log.ok('moduleResolution "bundler" ok')

  if (co.jsx !== 'preserve' && co.jsx !== 'react-jsx') {
    if (FIX) {
      co.jsx = 'preserve'
      log.ok('jsx → "preserve" (fix)')
    } else warn('compilerOptions.jsx = "preserve" empfohlen')
  }

  if (FIX) fs.writeFileSync(join('tsconfig.json'), JSON.stringify(ts, null, 2) + '\n')
}

function checkPackageJson() {
  log.head('📦 package.json – Versionen')
  const pkg = readJson<any>('package.json')
  if (!pkg) {
    warn('package.json nicht gefunden/lesbar')
    return
  }
  const dep = (n: string) => pkg.dependencies?.[n] || pkg.devDependencies?.[n] || null
  const next = dep('next')
  const ssr = dep('@supabase/ssr')
  next ? log.ok(`next ${next}`) : warn('next nicht gefunden')
  ssr ? log.ok(`@supabase/ssr ${ssr}`) : warn('@supabase/ssr nicht gefunden')
}

function checkNextConfig() {
  log.head('🖼️ next.config.* – Images')

  const candidates = ['next.config.js', 'next.config.mjs', 'next.config.ts']
  const file = candidates.find((f) => exists(f))
  if (!file) {
    warn('keine next.config.* gefunden')
    return
  }

  const content = fs.readFileSync(join(file), 'utf8')

  // Keine Regex-Literal-Syntax (verhindert Parser-/ASI-Probleme)
  const hasImages = new RegExp('images\\s*:\\s*{').test(content)
  const hasRemotePatterns = new RegExp('remotePatterns\\s*:\\s*\\[').test(content)

  if (!hasImages) warn(`${file}: images{} Abschnitt fehlt`)
  else log.ok(`${file}: images{} gefunden`)

  if (!hasRemotePatterns) warn(`${file}: images.remotePatterns fehlt`)
  else log.ok(`${file}: images.remotePatterns ok`)
}

function checkEnv() {
  log.head('🔐 .env / .env.local – Schlüssel')
  const envFiles = ['.env.local', '.env']
  let found = false
  for (const f of envFiles) {
    if (!exists(f)) continue
    found = true
    const raw = fs.readFileSync(join(f), 'utf8')
    const map = Object.fromEntries(
      raw
        .split('\n')
        .filter((l) => !l.trim().startsWith('#') && l.includes('='))
        .map((l) => {
          const i = l.indexOf('=')
          return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
        })
    ) as Record<string, string>

    // `SUPABASE_SERVICE_ROLE_KEY` steht hier bewusst nicht mehr: Seit Phase 1.4
    // gibt es keinen Codepfad, der ihn liest. Ihn weiter abzufragen legte nahe,
    // er gehöre in eine lokale Umgebung.
    const keys = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      // optional:
      'NEXT_PUBLIC_APP_URL',
    ]
    log.info(`${f}:`)
    for (const k of keys) {
      const val = map[k]
      val ? log.ok(`  ${k} = ${mask(val)}`) : warn(`  ${k} fehlt`)
    }
  }
  if (!found) warn('Keine .env/.local gefunden')
}

/* ───────────────────────── RUN ───────────────────────── */
console.log(bold('\n🚀 Jetnity Setup-Check (Mega Pro)\n'))
log.info(`Root: ${ROOT}`)
if (FIX) log.info('Auto-Fix: aktiv')
if (VERBOSE) log.info('Verbose: aktiv')

try {
  checkMustExist()
  checkForbiddenImports()
  checkTsconfig()
  checkPackageJson()
  checkNextConfig()
  checkEnv()
} catch (e: any) {
  fail(`Unerwarteter Fehler: ${e?.message || String(e)}`)
}

console.log('\n' + '-'.repeat(48))
if (ERRORS === 0 && WARNINGS === 0) console.log(green('✅ Alles sauber.'))
else {
  if (ERRORS > 0) console.log(red(`❌ Errors: ${ERRORS}`))
  if (WARNINGS > 0) console.log(yellow(`⚠️  Warnings: ${WARNINGS}`))
}
console.log('-'.repeat(48) + '\n')
if (CI && ERRORS > 0) process.exit(1)
