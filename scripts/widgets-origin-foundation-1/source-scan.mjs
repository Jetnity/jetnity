import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const hostRoot = path.join(repoRoot, 'apps/widgets-host')

const REQUIRED = [
  'package.json',
  'package-lock.json',
  'inert-contract.json',
  'next.config.ts',
  'proxy.ts',
  'lib/fail-closed.ts',
  'lib/handlers.ts',
  'lib/origin-contract.ts',
  'app/route.ts',
  'app/embed/discovercars/route.ts',
  'app/embed/twelvego/route.ts',
  'app/[...slug]/route.ts',
]

const SKIP_DIR = new Set(['node_modules', '.next', 'tests'])
const SKIP_FILE = new Set(['package-lock.json', 'next-env.d.ts'])
const CODE = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.css', '.md'])

const FORBIDDEN = [
  [/discovercars\.com/i, 'vendor host'],
  [/widget\.discovercars/i, 'vendor host'],
  [/googletagmanager/i, 'tag manager'],
  [/googleapis/i, 'third-party script host'],
  [/gstatic/i, 'third-party font or script host'],
  [/trainbusferry/i, 'vendor CDN'],
  [/12go\.(asia|com)/i, 'vendor host'],
  [/agent\.12go/i, 'vendor host'],
  [/supabase/i, 'backend client'],
  [/set-cookie/i, 'cookie write'],
  [/document\.cookie/i, 'cookie write'],
  [/<iframe/i, 'frame'],
  [/<script/i, 'script element'],
  [/<form/i, 'form'],
  [/<button/i, 'load control'],
  [/allow-scripts/i, 'sandbox flag'],
  [/allow-same-origin/i, 'sandbox flag'],
  [/NEXT_PUBLIC_/i, 'public env'],
  [/service_role/i, 'secret'],
  [/sk_live/i, 'secret'],
  [/process\.env/i, 'inherited env read'],
  [/from\s+['"]next\/script['"]/, 'next script'],
  [/from\s+['"]next\/image['"]/, 'next image'],
  [/from\s+['"]next\/font/, 'next font'],
  [/dangerouslySetInnerHTML/i, 'html injection'],
  [/NextResponse\.redirect/i, 'redirect'],
  [/\bredirect\s*\(/, 'redirect'],
  [/cookies\s*\(/, 'cookie read'],
  [/\.cookies\b/, 'cookie read'],
  [/headers\.get\s*\(/, 'header read'],
  [/request\.headers/, 'header read'],
  [/searchParams/, 'query branch'],
  [/Access-Control-Allow-Origin/i, 'CORS'],
  [/Access-Control-Allow-Credentials/i, 'CORS'],
  [/\bfetch\s*\(/, 'outbound request'],
  [/XMLHttpRequest/, 'outbound request'],
  [/https?:\/\//i, 'absolute URL'],
  [/console\.(log|info|debug|warn|error)\s*\(/, 'log'],
]

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIR.has(name)) continue
    const full = path.join(dir, name)
    const stat = statSync(full)
    if (stat.isDirectory()) walk(full, acc)
    else if (CODE.has(path.extname(name)) && !SKIP_FILE.has(name)) acc.push(full)
  }
  return acc
}

const findings = []

for (const relative of REQUIRED) {
  const full = path.join(hostRoot, relative)
  if (!existsSync(full)) findings.push(`missing ${relative}`)
}

const pkg = JSON.parse(readFileSync(path.join(hostRoot, 'package.json'), 'utf8'))
for (const [name, version] of Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })) {
  if (typeof version !== 'string' || /[\^~*]/.test(version)) {
    findings.push(`unpinned dependency ${name}@${version}`)
  }
}
for (const [name, version] of [
  ['next', '16.4.1'],
  ['react', '19.2.8'],
  ['react-dom', '19.2.8'],
]) {
  if (pkg.dependencies[name] !== version) findings.push(`expected ${name}@${version}`)
}

const proxy = readFileSync(path.join(hostRoot, 'proxy.ts'), 'utf8')
if (!proxy.includes('failClosed()')) findings.push('proxy does not return failClosed()')
if (/matcher\s*:/.test(proxy)) findings.push('proxy declares a matcher and can skip paths')
if (proxy.includes('NextResponse')) findings.push('proxy must not build a second response type')

const contract = readFileSync(path.join(hostRoot, 'lib/origin-contract.ts'), 'utf8')
for (const phrase of [
  'subdomainIsolatesCredentials: false',
  'sameRegistrableSite: true',
  "parentCookieDomain: '.jetnity.com'",
  "sameOriginSandboxScripts: 'prohibited'",
  "providerScripts: 'separately-gated'",
  "frameAncestorsToday: 'none'",
  'return false',
]) {
  if (!contract.includes(phrase)) findings.push(`origin contract missing ${phrase}`)
}

for (const relative of [
  'app/route.ts',
  'app/embed/discovercars/route.ts',
  'app/embed/twelvego/route.ts',
  'app/[...slug]/route.ts',
]) {
  const text = readFileSync(path.join(hostRoot, relative), 'utf8')
  if (!text.includes("from '../lib/handlers'") && !text.includes("from '../../lib/handlers'") && !text.includes("from '../../../lib/handlers'")) {
    findings.push(`${relative} does not re-export handlers`)
  }
  if (!text.includes('force-dynamic')) findings.push(`${relative} is not force-dynamic`)
}

const nextEnv = path.join(hostRoot, 'next-env.d.ts')
if (existsSync(nextEnv)) {
  const text = readFileSync(nextEnv, 'utf8')
  for (const [pattern, reason] of FORBIDDEN) {
    if (String(pattern).includes('https?')) continue
    if (pattern.test(text)) findings.push(`next-env.d.ts: ${reason} (${pattern})`)
  }
  if (!text.includes('https://nextjs.org/docs/app/api-reference/config/typescript')) {
    findings.push('next-env.d.ts docs URL changed')
  }
}

for (const file of walk(hostRoot)) {
  const text = readFileSync(file, 'utf8')
  const relative = path.relative(hostRoot, file)
  for (const [pattern, reason] of FORBIDDEN) {
    if (pattern.test(text)) findings.push(`${relative}: ${reason} (${pattern})`)
  }
}

if (findings.length > 0) {
  console.error(findings.join('\n'))
  process.exit(1)
}

console.log(`source-scan PASS files=${walk(hostRoot).length}`)
