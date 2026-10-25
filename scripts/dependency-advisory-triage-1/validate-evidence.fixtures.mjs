/**
 * Local corruption fixtures for the evidence validator.
 * Copies the retained evidence into a temp directory. No registry and no install.
 *
 * Usage: node scripts/dependency-advisory-triage-1/validate-evidence.fixtures.mjs <repo-root>
 */
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { leadingDirective } from './inventory.mjs'

const root = process.argv[2]
if (!root) {
  process.stderr.write('usage: validate-evidence.fixtures.mjs <repo-root>\n')
  process.exit(2)
}

const failures = []
function check(name, ok, detail) {
  if (!ok) failures.push(`${name}: ${detail}`)
  process.stdout.write(`${ok ? 'PASS' : 'FAIL'} ${name}\n`)
}

check('directive after comment', leadingDirective('/* note */\n"use client"\n') === 'use-client', leadingDirective('/* note */\n"use client"\n'))
check('directive without comment', leadingDirective("'use server'\n") === 'use-server', 'plain')
check('directive not after code', leadingDirective('const x = 1\n"use client"\n') === null, 'code precedes')

function stage() {
  const dir = mkdtempSync(join(tmpdir(), 'r107-s-fixture-'))
  cpSync(join(root, 'package.json'), join(dir, 'package.json'))
  cpSync(join(root, 'package-lock.json'), join(dir, 'package-lock.json'))
  cpSync(join(root, 'docs/evidence/dependency-advisory-triage-1'), join(dir, 'docs/evidence/dependency-advisory-triage-1'), { recursive: true })
  return dir
}

function validate(dir) {
  return spawnSync(process.execPath, [join(root, 'scripts/dependency-advisory-triage-1/validate-evidence.mjs'), dir, '--during-fixture'], { encoding: 'utf8' })
}

function mutate(dir, change) {
  const path = join(dir, 'docs/evidence/dependency-advisory-triage-1/triage-matrix.json')
  const matrix = JSON.parse(readFileSync(path, 'utf8'))
  change(matrix)
  writeFileSync(path, JSON.stringify(matrix))
  return path
}

const clean = stage()
const cleanRun = validate(clean)
check('clean evidence passes', cleanRun.status === 0, cleanRun.stderr || cleanRun.stdout)
rmSync(clean, { recursive: true, force: true })

const cases = [
  ['empty rows fail', (matrix) => { matrix.rows = [] }],
  ['false version join fails', (matrix) => { matrix.rows[0].version = '0.0.0' }],
  ['missing U floor fails', (matrix) => { matrix.rows[0].uFloor = false }],
  ['unsupported npm-view claim fails', (matrix) => { matrix.rows[0].fixedVersion = '1.1.19 confirmed by npm view' }],
  ['missing expected row fails', (matrix) => { matrix.rows.shift() }],
]

for (const [name, change] of cases) {
  const dir = stage()
  mutate(dir, change)
  const run = validate(dir)
  check(name, run.status === 1, `exit ${run.status} ${run.stderr.split('\n')[0] || ''}`)
  rmSync(dir, { recursive: true, force: true })
}

if (failures.length) {
  process.stderr.write(`${failures.join('\n')}\n`)
  process.exit(1)
}
process.stdout.write('FIXTURE_RESULT pass\n')
