import { createHash } from 'node:crypto'
import { execFileSync, spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const REPO = join(dirname(fileURLToPath(import.meta.url)), '../..')
const DIR = join(REPO, 'scripts/account-world-visit-workflow-completion-1')
const EVIDENCE = join(REPO, 'docs/evidence/account-world-visit-workflow-completion-1')
const OUT = join('/tmp', 'account-world-visit-workflow-completion-1')

mkdirSync(OUT, { recursive: true })
mkdirSync(EVIDENCE, { recursive: true })

function git(args) {
  return execFileSync('git', args, { cwd: REPO, encoding: 'utf8' }).trim()
}

const head = git(['rev-parse', 'HEAD'])
const tree = git(['rev-parse', 'HEAD^{tree}'])
const statusBefore = git(['status', '--porcelain'])
const trackedDirtyBefore = statusBefore.split('\n').filter((line) => line && !line.startsWith('??'))
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

const beweise = [
  'scripts/account-world-visit-workflow-completion-1/run.mjs',
  'scripts/account-world-visit-workflow-completion-1/mounted.ts',
  'scripts/account-world-visit-workflow-completion-1/mount.tsx',
  'scripts/account-world-visit-workflow-completion-1/shims/aktionen.ts',
  'scripts/account-world-visit-workflow-completion-1/shims/navigation.ts',
  'styles/globals.css',
]

const command = 'node scripts/account-world-visit-workflow-completion-1/run.mjs'
const testCommand = 'node --import tsx --test scripts/account-world-visit-workflow-completion-1/mounted.ts'

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
const { chromium } = require('playwright')
const browser = await chromium.launch({ headless: true })
const browserVersion = browser.version()
await browser.close()
const playwrightVersion = require('playwright/package.json').version
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
const statusAfter = git(['status', '--porcelain'])
const trackedDirtyAfter = statusAfter.split('\n').filter((line) => line && !line.startsWith('??'))
const cssSha256 = createHash('sha256').update(css).digest('hex')
const sourceHashes = Object.fromEntries(quellen.map((datei) => [datei, sha(datei)]))
let screenshots = []
try {
  screenshots = JSON.parse(readFileSync(join(screens, 'manifest.json'), 'utf8')).map((shot) => ({
    ...shot,
    commit: head,
    cssSha256,
    sources: sourceHashes,
  }))
} catch {
  screenshots = []
}
const ergebnis = {
  status: kind.status === 0 ? 'PASS' : 'FAIL',
  author: 'Jetnity Account World Visit Workflow Completion 1 — Cursor Generation 1',
  session: 'bc-af293d35-d2af-43d8-b193-9fbaab7c351b',
  model: 'grok-4.7-high-fast',
  command,
  testCommand,
  node: process.version,
  playwright: playwrightVersion,
  browser: browserVersion,
  commit: head,
  tree,
  exit: kind.status,
  origin: harnessOrigin,
  aliasBoundary: 'esbuild aliases replace only next/navigation and lib/account/besuche-aktionen.ts. AccountBesuche, the form, the hook, copy and project CSS stay real.',
  notClaimed: 'This is not hosted Account proof, not SQL or RLS proof, not a full Next.js router proof, and not a device proof. A refresh request is not causal readback. A changed stamp is not a newer database snapshot. This receipt does not amend run-82260869d6cb.json, run-8b1e6ac0185c.json, or run-31dcf14acd91.json.',
  inputMethods: {
    requestSubmit: 'The same-turn double submit calls form.requestSubmit() twice in one turn. That is guard admission, not a keyboard Enter pair.',
    keyboard: 'Opening the editor, cancelling it with Escape, and submitting one edit use page.keyboard.press. The cancel button uses a pointer click.',
  },
  screenshotNote: 'Each PNG is an element capture of the named target after the page viewport and root font are set. It is not a viewport crop of the map. Section and document overflow are still measured on the viewport. In this Chromium, window scrollTop clamps below the visit controls when the root font is 32px, so a viewport crop stays on the map.',
  tracked: {
    before: statusBefore,
    beforeDirty: trackedDirtyBefore,
    after: statusAfter,
    afterDirty: trackedDirtyAfter,
    cleanBefore: trackedDirtyBefore.length === 0,
  },
  sources: sourceHashes,
  proof: Object.fromEntries(beweise.map((datei) => [datei, sha(datei)])),
  cssSha256,
  screenshots,
  stdoutTail: kind.stdout.slice(-4000),
  stderrTail: kind.stderr.slice(-4000),
}
writeFileSync(evidenceFile, `${JSON.stringify(ergebnis, null, 2)}\n`)
server.close()
console.log(`evidence ${evidenceFile}`)
process.exit(kind.status ?? 1)
