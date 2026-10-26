import { execFileSync, spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const REPO = join(dirname(fileURLToPath(import.meta.url)), '../..')
const DIR = join(REPO, 'scripts/multi-stop-create-day-allocation-1')
const EVIDENCE = join(REPO, 'docs/evidence/multi-stop-create-day-allocation-1')
const OUT = join('/tmp', 'multi-stop-create-day-allocation-1')

mkdirSync(OUT, { recursive: true })
mkdirSync(EVIDENCE, { recursive: true })

const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim()
const screens = join(EVIDENCE, `screens-${head.slice(0, 12)}`)
mkdirSync(screens, { recursive: true })
const evidenceFile = join(EVIDENCE, `mounted-${head.slice(0, 12)}.json`)

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
  banner: {
    js: 'globalThis.process = globalThis.process || { env: { NODE_ENV: "production" } }; globalThis.global = globalThis;',
  },
  plugins: [
    {
      name: 'allocation-harness-aliases',
      setup(build) {
        build.onResolve({ filter: /.*/ }, (args) => {
          if (args.path === 'next/navigation') return { path: join(DIR, 'shims/navigation.ts') }
          if (args.path === 'next/link') return { path: join(DIR, 'shims/link.tsx') }
          if (args.path === '@/lib/trips/aktionen') return { path: join(DIR, 'shims/aktionen.ts') }
          if (args.path === '@/lib/places/aktionen') return { path: join(DIR, 'shims/orte.ts') }
          if (args.path === 'server-only') return { path: join(DIR, 'shims/empty.ts') }
          return null
        })
      },
    },
  ],
})

const harnessJs = readFileSync(join(OUT, 'harness.js'))
const css = `${await compileCss()}\n${readFileSync(join(REPO, 'components/trips/multi-stop-create-day-allocation-1/allocation.css'), 'utf8')}`
const seite = (angemeldet) => `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Tageszuordnung</title><link rel="stylesheet" href="/style.css"></head><body class="bg-canvas text-ink-800"><script>window.__planenAngemeldet=${angemeldet ? 'true' : 'false'}</script><div id="root" class="min-w-0 max-w-full"></div><script src="/harness.js"></script></body></html>`

const orte = [
  { id: 'geonames:2657896', label: 'Zürich', description: 'Schweiz', typ: 'city', ariaLabel: 'Stadt Zürich, Schweiz' },
  { id: 'geonames:1609350', label: 'Bangkok', description: 'Thailand', typ: 'city', ariaLabel: 'Stadt Bangkok, Thailand' },
  { id: 'geonames:1153671', label: 'Chiang Mai', description: 'Thailand', typ: 'city', ariaLabel: 'Stadt Chiang Mai, Thailand' },
  { id: 'geonames:1151254', label: 'Phuket', description: 'Thailand', typ: 'city', ariaLabel: 'Stadt Phuket, Thailand' },
]

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1')
  if (url.pathname === '/harness.js') {
    res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-store' })
    res.end(harnessJs)
    return
  }
  if (url.pathname === '/style.css') {
    res.writeHead(200, { 'content-type': 'text/css; charset=utf-8', 'cache-control': 'no-store' })
    res.end(css)
    return
  }
  if (url.pathname === '/api/search/places') {
    const frage = (url.searchParams.get('q') || '').toLowerCase()
    const treffer = orte.filter((ort) => ort.label.toLowerCase().includes(frage) || frage.includes('z'))
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
    res.end(JSON.stringify(frage.length < 2 ? [] : treffer.slice(0, 4)))
    return
  }
  if (url.pathname === '/' || url.pathname === '/konto') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
    res.end(seite(url.pathname === '/konto'))
    return
  }
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' })
  res.end('not found')
})

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const adresse = server.address()
const origin = `http://127.0.0.1:${adresse.port}`
const kind = await new Promise((resolve) => {
  const child = spawn('node', ['--import', 'tsx', '--test', 'scripts/multi-stop-create-day-allocation-1/mounted.ts'], {
    cwd: REPO,
    env: {
      ...process.env,
      ALLOCATION_HARNESS_ORIGIN: origin,
      ALLOCATION_EVIDENCE_FILE: evidenceFile,
      ALLOCATION_SCREENS: screens,
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
  ...(roh ?? { status: 'NOT VERIFIED', cases: [] }),
  author: 'Jetnity Multi Stop Create Day Allocation 1 — Cursor Generation 1',
  session: 'bc-a0a82333-7855-4ba7-b641-39af97c78458',
  model: 'grok-4.7-high-fast',
  commit: head,
  exit: kind.status,
  origin,
  hostedPersistence: 'not invoked',
  stdoutTail: String(kind.stdout || '').slice(-4000),
  stderrTail: String(kind.stderr || '').slice(-4000),
}
writeFileSync(evidenceFile, `${JSON.stringify(ergebnis, null, 2)}\n`)
server.close()
process.exit(kind.status)
