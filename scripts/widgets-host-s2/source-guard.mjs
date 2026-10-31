import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const host = path.join(root, 'apps/widgets-host')
const findings = []

function text(relative) {
  return readFileSync(path.join(host, relative), 'utf8')
}

const runtime = text('lib/host-runtime.mjs')
const decide = text('lib/decide.mjs')
const registry = text('lib/registry.mjs')
for (const [name, source] of [['runtime', runtime], ['decide', decide]]) {
  for (const pattern of [/discovercars\.com/i, /12go\.asia/i, /trainbusferry/i, /googletagmanager/i, /localStorage/, /sessionStorage/, /indexedDB/, /document\.cookie/, /innerHTML/, /\beval\s*\(/, /process\.env/]) {
    if (pattern.test(source)) findings.push(`${name} contains ${pattern}`)
  }
}
if (!registry.includes('selected: false')) findings.push('registry is not denied')
if (registry.includes('selected: true')) findings.push('registry contains a selected entry')

const expected = [
  ['artifacts/discovercars-widget-allgemein.html', 835, '5a9ea3edf4bfa5762850e0d1e6c9f5d777d860f9442fbe17bf9a76b1618cc8aa'],
  ['artifacts/12go-widget-allgemein.html', 472, '3eeefcb326833997b1792f4a2bbc2b833511beddac2fd9626a2a9c07f68b369e'],
]
for (const [relative, bytes, digest] of expected) {
  const data = readFileSync(path.join(host, relative))
  const actual = createHash('sha256').update(data).digest('hex')
  if (data.length !== bytes || actual !== digest) findings.push(`${relative} hash mismatch`)
}

const historical = path.join(root, 'scripts/widgets-origin-foundation-1/source-scan.mjs')
if (!readFileSync(historical, 'utf8').includes('source-scan PASS')) findings.push('S1 source scan was removed')

const policy = text('lib/audit-network-policy.mjs')
const frame = 'https://widget.discovercars.com/de/locations/'
if (policy.split(frame).length !== 2) findings.push('audit frame source is not the single constant')
const policyStrings = policy.match(/'[^'\n]*'/g) || []
if (policyStrings.some((item) => item.includes('*'))) findings.push('audit policy contains a wildcard')
if (decide.includes('discovercars.com') || decide.includes('googletagmanager')) findings.push('decide embeds a vendor host')
for (const relative of [
  'docs/JETNITY_WIDGETS_HOST_S2_NETWORK_AUDIT_AMENDMENT_V1_2026-10-31.md',
  'docs/JETNITY_WIDGETS_HOST_S2_TASK_V1_2026-10-31.md',
]) {
  const expected = relative.endsWith('AMENDMENT_V1_2026-10-31.md')
    ? 'f1dfddd424f88d071a3a76125a39d71e7e2b3b93'
    : 'e4ae6b5d6291792d1fe798029849d66119fcf3f5'
  const blob = spawnSync('git', ['hash-object', path.join(root, relative)], { encoding: 'utf8' })
  if (blob.stdout.trim() !== expected) findings.push(`${relative} blob changed`)
}

if (findings.length > 0) {
  console.error(findings.join('\n'))
  process.exit(1)
}
console.log('source-guard PASS')
