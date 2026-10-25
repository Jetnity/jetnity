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

function readJson(dir, rel) {
  return JSON.parse(readFileSync(join(dir, rel), 'utf8'))
}

function writeJson(dir, rel, value) {
  writeFileSync(join(dir, rel), JSON.stringify(value))
}

function mutate(dir, change) {
  const rel = 'docs/evidence/dependency-advisory-triage-1/triage-matrix.json'
  const matrix = readJson(dir, rel)
  change(matrix)
  writeJson(dir, rel, matrix)
}

const clean = stage()
const cleanRun = validate(clean)
check('clean evidence passes', cleanRun.status === 0, cleanRun.stderr || cleanRun.stdout)
rmSync(clean, { recursive: true, force: true })

const cases = [
  ['empty rows fail', (dir) => mutate(dir, (matrix) => { matrix.rows = [] })],
  ['false version join fails', (dir) => mutate(dir, (matrix) => { matrix.rows[0].version = '0.0.0' })],
  ['missing U floor fails', (dir) => mutate(dir, (matrix) => { matrix.rows[0].uFloor = false })],
  ['unsupported npm-view claim fails', (dir) => mutate(dir, (matrix) => { matrix.rows[0].fixedVersion = '1.1.19 confirmed by npm view' })],
  ['missing expected row fails', (dir) => mutate(dir, (matrix) => { matrix.rows.shift() })],
  ['raw lock version disagreement fails', (dir) => {
    const inventoryRel = 'docs/evidence/dependency-advisory-triage-1/lockfile-inventory.json'
    const inventory = readJson(dir, inventoryRel)
    for (const entry of inventory.entries) if (entry.path === 'node_modules/ws') entry.version = '8.18.2'
    writeJson(dir, inventoryRel, inventory)
    mutate(dir, (matrix) => {
      for (const row of matrix.rows) if (row.name === 'ws') row.version = '8.18.2'
    })
  }],
  ['deleted required fields fail', (dir) => mutate(dir, (matrix) => {
    for (const row of matrix.rows) {
      delete row.retrievedAt
      delete row.impact
      delete row.uncertainty
      delete row.parentChain
    }
  })],
  ['wrong-major retained candidate fails', (dir) => mutate(dir, (matrix) => {
    const row = matrix.rows.find((item) => item.advisoryId === 'GHSA-3jxr-9vmj-r5cp' && item.version === '2.0.2')
    row.chosenCandidate = '1.1.21'
  })],
  ['deleted omit-dev rows fail', (dir) => {
    const rel = 'docs/evidence/dependency-advisory-triage-1/npm-audit-lockfile-omit-dev.json'
    const omit = readJson(dir, rel)
    omit.vulnerabilities = {}
    writeJson(dir, rel, omit)
  }],
]

for (const [name, change] of cases) {
  const dir = stage()
  change(dir)
  const run = validate(dir)
  check(name, run.status === 1, `exit ${run.status} ${run.stderr.split('\n')[0] || ''}`)
  rmSync(dir, { recursive: true, force: true })
}

if (failures.length) {
  process.stderr.write(`${failures.join('\n')}\n`)
  process.exit(1)
}
process.stdout.write('FIXTURE_RESULT pass\n')
