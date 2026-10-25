import { createHash } from 'node:crypto'
import { execFileSync, spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const REPO = join(dirname(fileURLToPath(import.meta.url)), '../..')
const DIR = join(REPO, 'scripts/my-trips-collection-archive-workflow-completion-1')
const EVIDENCE = join(REPO, 'docs/evidence/my-trips-collection-archive-workflow-completion-1')
const OUT = join('/tmp', 'my-trips-collection-archive-workflow-completion-1')

mkdirSync(OUT, { recursive: true })
mkdirSync(EVIDENCE, { recursive: true })

const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim()
const tree = execFileSync('git', ['rev-parse', 'HEAD^{tree}'], { cwd: REPO, encoding: 'utf8' }).trim()
const dirty = execFileSync('git', ['status', '--porcelain'], { cwd: REPO, encoding: 'utf8' })
const screens = join(EVIDENCE, `screens-${head}`)
mkdirSync(screens, { recursive: true })
let evidenceFile = join(EVIDENCE, `run-${head}.json`)
if (existsSync(evidenceFile)) evidenceFile = join(EVIDENCE, `run-${head}-${Date.now()}.json`)

const quellen = [
  'app/(public)/reisen/page.tsx',
  'components/trips/MyTripsCollection.tsx',
  'components/trips/useMyTripsCollectionNavigation.ts',
  'components/trips/useTripArchiveWorkflow.ts',
  'components/trips/KontoReiseArchivAktion.tsx',
  'components/trips/KontoReiseEintrag.tsx',
  'lib/trips/reisen-uebersicht.ts',
  'lib/trips/reisen-sammlung-abfrage.ts',
  'lib/trips/reisen-sammlung-daten.ts',
  'lib/trips/trip-archive-workflow.ts',
]

function sha(datei) {
  return createHash('sha256').update(readFileSync(join(REPO, datei))).digest('hex')
}

function blob(datei) {
  return execFileSync('git', ['hash-object', datei], { cwd: REPO, encoding: 'utf8' }).trim()
}

function compileCss() {
  const postcss = require('postcss')
  const nesting = require('tailwindcss/nesting')
  const tailwindcss = require('tailwindcss')
  const autoprefixer = require('autoprefixer')
  const from = join(REPO, 'styles/globals.css')
  const config = require(join(REPO, 'tailwind.config.js'))
  return postcss([nesting(), tailwindcss(config), autoprefixer()])
    .process(readFileSync(from, 'utf8'), { from })
    .then((result) => result.css)
}

const esbuild = require('esbuild')
const aktionen = join(DIR, 'shims/aktionen.ts')
const navigation = join(DIR, 'shims/navigation.ts')

await esbuild.build({
  absWorkingDir: REPO,
  entryPoints: [join(DIR, 'mount.tsx')],
  outfile: join(OUT, 'harness.js'),
  bundle: true,
  format: 'iife',
  platform: 'browser',
  jsx: 'automatic',
  alias: { '@': REPO },
  define: { 'process.env.NODE_ENV': '"production"' },
  banner: { js: 'globalThis.process = globalThis.process || { env: { NODE_ENV: "production" } }; globalThis.global = globalThis;' },
  logLevel: 'silent',
  plugins: [
    {
      name: 'sammlung-harness-aliases',
      setup(build) {
        build.onResolve({ filter: /.*/ }, (args) => {
          if (args.path === 'next/navigation') return { path: navigation }
          if (args.path === '@/lib/trips/archiv-aktionen' || args.path.endsWith('/lib/trips/archiv-aktionen')) return { path: aktionen }
          return null
        })
      },
    },
  ],
})

const harnessJs = readFileSync(join(OUT, 'harness.js'))
const css = await compileCss()
const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Sammlung</title><link rel="stylesheet" href="/style.css"></head><body class="bg-canvas text-ink-800"><div id="root"></div><script src="/harness.js"></script></body></html>`

const server = createServer((req, res) => {
  const pfad = new URL(req.url || '/', 'http://127.0.0.1').pathname
  if (pfad === '/harness.js') {
    res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' })
    res.end(harnessJs)
    return
  }
  if (pfad === '/style.css') {
    res.writeHead(200, { 'content-type': 'text/css; charset=utf-8', 'cache-control': 'no-store' })
    res.end(css)
    return
  }
  if (pfad === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
    res.end(html)
    return
  }
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
  res.end('not found')
})

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const adresse = server.address()
const origin = `http://127.0.0.1:${adresse.port}`
const befehl = 'node --import tsx --test scripts/my-trips-collection-archive-workflow-completion-1/mounted.test.ts'

const kind = await new Promise((resolve) => {
  const child = spawn('node', ['--import', 'tsx', '--test', 'scripts/my-trips-collection-archive-workflow-completion-1/mounted.test.ts'], {
    cwd: REPO,
    env: {
      ...process.env,
      MY_TRIPS_HARNESS_ORIGIN: origin,
      MY_TRIPS_EVIDENCE_FILE: evidenceFile,
      MY_TRIPS_SCREENS: screens,
    },
  })
  let stdout = ''
  let stderr = ''
  child.stdout.on('data', (chunk) => {
    const text = String(chunk)
    stdout = (stdout + text).slice(-12000)
    process.stdout.write(text)
  })
  child.stderr.on('data', (chunk) => {
    const text = String(chunk)
    stderr = (stderr + text).slice(-12000)
    process.stderr.write(text)
  })
  child.on('exit', (status) => resolve({ status: status ?? 1, stdout, stderr }))
})

const roh = existsSync(evidenceFile) ? JSON.parse(readFileSync(evidenceFile, 'utf8')) : null
const ergebnis = {
  ...(roh ?? { status: 'NOT VERIFIED', cases: [], blocked: kind.stderr || kind.stdout || 'mounted cases did not write evidence' }),
  author: 'Jetnity My Trips Collection and Archive Workflow Completion 1 — Cursor Generation 1',
  session: 'bc-27e5e422-852b-49c7-9b67-0fc723f13175',
  model: 'grok-4.7-high-fast',
  commit: head,
  tree,
  dirty: dirty.trim(),
  command: befehl,
  exit: kind.status,
  origin,
  aliasBoundary:
    'esbuild aliases replace only next/navigation and @/lib/trips/archiv-aktionen. Collection, card, archive button, copy and project CSS stay real. The navigation shim returns void and has no arrival generation. No deployed route, account session, or Supabase client.',
  fixtureBoundary:
    'Synthetic local Playwright. push and refresh do not change the URL or props. The script sets useSearchParams and passes a new result object only when it wants a server snapshot. A resolved refresh is not a list observation.',
  rootFontNote: 'The 32px check sets font-size on documentElement. It is not native browser zoom, not a device, and not a screen reader.',
  correlationLimit:
    'A changed URL or a new result object is an observation. It does not identify which gesture produced the server render. The 8000ms lease is a UI guard, not a read receipt.',
  sources: Object.fromEntries(quellen.map((datei) => [datei, { sha256: sha(datei), blob: blob(datei) }])),
  stdoutTail: String(kind.stdout || '').slice(-4000),
  stderrTail: String(kind.stderr || '').slice(-4000),
}
if (kind.status !== 0) ergebnis.status = 'FAIL'
writeFileSync(evidenceFile, `${JSON.stringify(ergebnis, null, 2)}\n`)
server.close()
console.log(`evidence ${evidenceFile}`)
console.log(`exit ${kind.status} cases ${ergebnis.cases?.length ?? 0} status ${ergebnis.status}`)
process.exit(kind.status ?? 1)
