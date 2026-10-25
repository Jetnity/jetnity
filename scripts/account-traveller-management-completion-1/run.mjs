// Synthetic mounted proof for AccountReisende.
// Aliases replace only the registry actions module and next/navigation.
import { createHash } from 'node:crypto'
import { execFileSync, spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const REPO = join(dirname(fileURLToPath(import.meta.url)), '../..')
const DIR = join(REPO, 'scripts/account-traveller-management-completion-1')
const EVIDENCE = join(REPO, 'docs/evidence/account-traveller-management-completion-1')
const OUT = join('/tmp', 'account-traveller-management-completion-1')

mkdirSync(OUT, { recursive: true })
mkdirSync(EVIDENCE, { recursive: true })

const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim()
const screens = join(EVIDENCE, `screens-${head}`)
mkdirSync(screens, { recursive: true })
let evidenceFile = join(EVIDENCE, `run-${head}.json`)
if (existsSync(evidenceFile)) evidenceFile = join(EVIDENCE, `run-${head}-${Date.now()}.json`)

const quellen = [
  'components/account/AccountReisende.tsx',
  'components/account/AccountReisendeKarte.tsx',
  'components/account/useAccountRegistryWorkflow.ts',
  'lib/traveller/account-registry-workflow.ts',
  'lib/traveller/account-registry-copy.ts',
  'lib/traveller/account-registry-workflow.test.ts',
  'lib/traveller/account-registry-workflow-ui.test.ts',
  'lib/traveller/account-registry-workflow-mounted.ts',
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
  banner: {
    js: 'globalThis.process = globalThis.process || { env: { NODE_ENV: "production" } }; globalThis.global = globalThis;',
  },
  logLevel: 'silent',
  plugins: [
    {
      name: 'registry-harness-aliases',
      setup(build) {
        build.onResolve({ filter: /.*/ }, (args) => {
          if (args.path === 'next/navigation') return { path: navigation }
          if (
            args.path === '@/lib/traveller/account-registry-aktionen' ||
            args.path.endsWith('/account-registry-aktionen') ||
            args.path.endsWith('/account-registry-aktionen.ts')
          ) {
            return { path: aktionen }
          }
          return null
        })
      },
    },
  ],
})

const harnessJs = readFileSync(join(OUT, 'harness.js'))
const css = await compileCss()
const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Registry</title><link rel="stylesheet" href="/style.css"></head><body class="bg-canvas text-ink-800"><button id="ausserhalb" type="button">Ausserhalb</button><div id="root" class="min-w-0 max-w-full"></div><script src="/harness.js"></script></body></html>`

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
const befehl = 'node --import tsx --test lib/traveller/account-registry-workflow-ui.test.ts'

const kind = await new Promise((resolve) => {
  const child = spawn(
    'node',
    ['--import', 'tsx', '--test', 'lib/traveller/account-registry-workflow-ui.test.ts'],
    {
      cwd: REPO,
      env: {
        ...process.env,
        ACCOUNT_TRAVELLER_MANAGEMENT_BROWSER: '1',
        REGISTRY_HARNESS_ORIGIN: origin,
        REGISTRY_EVIDENCE_FILE: evidenceFile,
        REGISTRY_SCREENS: screens,
      },
    },
  )
  let stdout = ''
  let stderr = ''
  child.stdout.on('data', (chunk) => {
    const text = String(chunk)
    stdout = (stdout + text).slice(-8000)
    process.stdout.write(text)
  })
  child.stderr.on('data', (chunk) => {
    const text = String(chunk)
    stderr = (stderr + text).slice(-8000)
    process.stderr.write(text)
  })
  child.on('exit', (status) => resolve({ status: status ?? 1, stdout, stderr }))
})

const roh = existsSync(evidenceFile) ? JSON.parse(readFileSync(evidenceFile, 'utf8')) : null
const ergebnis = {
  ...(roh ?? {
    status: kind.status === 0 ? 'PASS' : 'NOT VERIFIED',
    cases: [],
    blocked: kind.stderr || kind.stdout || 'mounted cases did not write evidence',
  }),
  author: 'Jetnity Account Traveller Management Completion 1 — Cursor Generation 1',
  session: 'bc-3b7c97c5-d9fa-4326-9000-14377b2dd939',
  model: 'grok-4.7-high-fast',
  commit: head,
  command: befehl,
  exit: kind.status,
  origin,
  aliasBoundary:
    'esbuild aliases replace only @/lib/traveller/account-registry-aktionen and next/navigation. LandFeld, copy, limits, card markup and project CSS stay real. No deployed route, account session, or Supabase client.',
  fixtureBoundary:
    'Synthetic local Playwright. Labels are fixed strings such as Synthetische Person A. The action stub returns deferred promises. refresh resolves, rejects, or stays deferred without changing props. The wrapper then passes the next scripted problem and travellers. A resolved refresh is not a list observation.',
  rootFontNote:
    'The 32px check sets font-size on documentElement. It is not native browser zoom, not a device, and not a screen reader.',
  correlationLimit:
    'A changed valid list is a newly observed canonical snapshot. It does not identify which router.refresh produced it and does not prove the read followed an unknown write. Unchanged content stays unconfirmed. There is no server read nonce.',
  sources: Object.fromEntries(quellen.map((datei) => [datei, { sha256: sha(datei), blob: blob(datei) }])),
  stdoutTail: String(kind.stdout || '').slice(-4000),
  stderrTail: String(kind.stderr || '').slice(-4000),
}
if (kind.status !== 0 && ergebnis.status === 'PASS') ergebnis.status = 'FAIL'
writeFileSync(evidenceFile, `${JSON.stringify(ergebnis, null, 2)}\n`)
server.close()
console.log(`evidence ${evidenceFile}`)
console.log(`exit ${kind.status} cases ${ergebnis.cases?.length ?? 0} status ${ergebnis.status}`)
process.exit(kind.status ?? 1)
