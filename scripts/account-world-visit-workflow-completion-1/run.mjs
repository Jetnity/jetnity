import { createHash } from 'node:crypto'
import { execFileSync, spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const REPO = join(dirname(fileURLToPath(import.meta.url)), '../..')
const DIR = join(REPO, 'scripts/account-world-visit-workflow-completion-1')
const EVIDENCE = join(REPO, 'docs/evidence/account-world-visit-workflow-completion-1')
const OUT = join('/tmp', 'account-world-visit-workflow-completion-1')

mkdirSync(OUT, { recursive: true })
mkdirSync(EVIDENCE, { recursive: true })

const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim()
const tree = execFileSync('git', ['rev-parse', 'HEAD^{tree}'], { cwd: REPO, encoding: 'utf8' }).trim()
const screens = join(EVIDENCE, `screens-${head.slice(0, 12)}`)
mkdirSync(screens, { recursive: true })
const evidenceFile = join(EVIDENCE, `run-${head.slice(0, 12)}.json`)

const quellen = [
  'components/account/AccountBesuche.tsx',
  'components/account/AccountBesuchFormular.tsx',
  'components/account/useAccountVisitWorkflow.ts',
  'lib/account/account-visit-workflow.ts',
  'lib/account/account-visit-workflow.test.ts',
  'lib/account/besuche-copy.ts',
]

function sha(datei) {
  return createHash('sha256').update(readFileSync(join(REPO, datei))).digest('hex')
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
      name: 'visit-harness-aliases',
      setup(build) {
        build.onResolve({ filter: /.*/ }, (args) => {
          if (args.path === 'next/navigation') return { path: join(DIR, 'shims/navigation.ts') }
          if (args.path === '@/lib/account/besuche-aktionen' || args.path.endsWith('/besuche-aktionen') || args.path.endsWith('/besuche-aktionen.ts')) {
            return { path: join(DIR, 'shims/aktionen.ts') }
          }
          return null
        })
      },
    },
  ],
})

const harnessJs = readFileSync(join(OUT, 'harness.js'))
const css = await compileCss()
const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Besuche</title><link rel="stylesheet" href="/style.css"></head><body class="bg-canvas text-ink-800"><div id="root" class="min-w-0 max-w-full"></div><script src="/harness.js"></script></body></html>`
const server = createServer((req, res) => {
  const pfad = new URL(req.url || '/', 'http://127.0.0.1').pathname
  if (pfad === '/harness.js') {
    res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' })
    res.end(harnessJs)
    return
  }
  if (pfad === '/style.css') {
    res.writeHead(200, { 'content-type': 'text/css; charset=utf-8' })
    res.end(css)
    return
  }
  if (pfad === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    res.end(html)
    return
  }
  res.writeHead(404)
  res.end('not found')
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const adresse = server.address()
const harnessOrigin = `http://127.0.0.1:${adresse.port}`
const kind = await new Promise((resolve) => {
  const child = spawn('node', ['--import', 'tsx', '--test', 'scripts/account-world-visit-workflow-completion-1/mounted.ts'], {
    cwd: REPO,
    env: { ...process.env, VISIT_HARNESS_ORIGIN: harnessOrigin, VISIT_SCREENS: screens },
  })
  let stdout = ''
  let stderr = ''
  child.stdout.on('data', (chunk) => { stdout += String(chunk); process.stdout.write(String(chunk)) })
  child.stderr.on('data', (chunk) => { stderr += String(chunk); process.stderr.write(String(chunk)) })
  child.on('exit', (status) => resolve({ status: status ?? 1, stdout, stderr }))
})
const ergebnis = {
  status: kind.status === 0 ? 'PASS' : 'FAIL',
  author: 'Jetnity Account World Visit Workflow Completion 1 — Cursor Generation 1',
  session: 'bc-af293d35-d2af-43d8-b193-9fbaab7c351b',
  model: 'grok-4.7-high-fast',
  commit: head,
  tree,
  exit: kind.status,
  origin: harnessOrigin,
  aliasBoundary: 'esbuild aliases replace only next/navigation and lib/account/besuche-aktionen.ts. AccountBesuche, the form, the hook, copy and project CSS stay real.',
  notClaimed: 'This is not hosted Account proof, not SQL or RLS proof, not a full Next.js router proof, and not a device proof. A refresh request is not causal readback. A changed stamp is not a newer database snapshot.',
  sources: Object.fromEntries(quellen.map((datei) => [datei, sha(datei)])),
  stdoutTail: kind.stdout.slice(-4000),
  stderrTail: kind.stderr.slice(-4000),
}
writeFileSync(evidenceFile, `${JSON.stringify(ergebnis, null, 2)}\n`)
server.close()
console.log(`evidence ${evidenceFile}`)
process.exit(kind.status ?? 1)
