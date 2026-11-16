import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { selectU1SystemBrowser } from './browser.mjs'

const require = createRequire(import.meta.url)
const { load } = require('js-yaml')
const workflow = load(readFileSync(new URL('../../.github/workflows/ci.yml', import.meta.url), 'utf8'))
const families = ['verify', 'persisted_native', 'refresh_native', 'accepted_store_native', 'official_truth_v3_ui', 'hosted_v3_native_pg17', 'cms_native', 'marketing_native']

test('CI aggregate requires success from all eight families including mandatory Admin native proofs', () => {
  const aggregate = workflow.jobs.required_verify
  assert.equal(aggregate.name, 'Typecheck, Lint & Build')
  assert.equal(aggregate['timeout-minutes'], 2)
  assert.deepEqual(aggregate.needs, families)
  assert.equal(aggregate.if, '${{ always() }}')
  const gate = aggregate.steps[0]
  const variables = Object.keys(gate.env)
  assert.equal(variables.length, 8)
  for (const family of families) {
    assert.ok(workflow.jobs[family])
    assert.ok(Object.values(gate.env).includes(`\${{ needs.${family}.result }}`))
  }
  const allSucceeded = Object.fromEntries(variables.map((name) => [name, 'success']))
  const run = (results) => spawnSync('/bin/bash', ['-e', '-o', 'pipefail', '-c', gate.run], { env: { PATH: process.env.PATH, ...results }, encoding: 'utf8' })
  assert.equal(run(allSucceeded).status, 0)
  for (const name of variables) for (const status of ['failure', 'cancelled', 'skipped', '']) {
    assert.notEqual(run({ ...allSucceeded, [name]: status }).status, 0, `${name}/${status} must fail the aggregate`)
  }
  for (const name of variables) {
    const missing = { ...allSucceeded }
    delete missing[name]
    assert.notEqual(run(missing).status, 0, `${name}/missing must fail the aggregate`)
  }
})

test('Admin native jobs preserve complete typed PostgreSQL 17 proofs in the required CI run', () => {
  const provisionName = 'Provision mandatory PostgreSQL 17 from signed official packages'
  const existingProvision = workflow.jobs.hosted_v3_native_pg17.steps.find((step) => step.name === provisionName)
  for (const [family, directory] of [
    ['cms_native', 'admin-editorial-cms-1'], ['marketing_native', 'admin-marketing-drafts-1'],
  ]) {
    const job = workflow.jobs[family]
    assert.deepEqual(job.permissions, { contents: 'read' })
    assert.equal(job['runs-on'], 'ubuntu-24.04')
    assert.equal(job['timeout-minutes'], 30)
    assert.equal('if' in job, false)
    assert.equal('continue-on-error' in job, false)
    assert.ok(job.steps.every((step) => !('if' in step) && !('continue-on-error' in step)))
    assert.equal(job.steps[0].with['fetch-depth'], 0)
    assert.deepEqual(job.steps.find((step) => step.uses === 'actions/setup-node@v4')?.with, { 'node-version': '22.x', cache: 'npm' })
    for (const command of ['npm ci', 'npm run check:setup:ci', 'npm run check:operating-mode']) {
      assert.equal(job.steps.filter((step) => step.run === command).length, 1, family + ': ' + command)
    }
    assert.equal(job.steps.filter((step) => step.name === provisionName).length, 1)
    assert.deepEqual(job.steps.find((step) => step.name === provisionName), existingProvision)
    const typecheck = job.steps.find((step) => step.name === 'Typecheck native proof')?.run ?? ''
    const roots = [`scripts/db/${directory}/fixture.ts`, `scripts/db/${directory}/native.test.ts`]
    if (family === 'cms_native') roots.push('scripts/db/admin-runtime-bg1-1/native.test.ts')
    assert.ok(typecheck.includes(`rootNames: [${roots.map(path => `'${path}'`).join(', ')}]`))
    assert.ok(typecheck.includes('...ts.getPreEmitDiagnostics(program)'))
    assert.ok(typecheck.includes('process.exitCode = 1'))
    const originalCommand = `node --import ./scripts/server-only-test-register.mjs --import tsx --test --test-reporter=tap --test-concurrency=1 scripts/db/${directory}/native.test.ts`
    assert.equal(job.steps.filter(step => step.run === originalCommand).length, 1)
    if (family === 'cms_native') {
      const offers = job.steps.at(-1)
      assert.equal(offers.name, 'saved_offers exact Production BG1 successor - owned PG17 proof')
      assert.equal(offers['timeout-minutes'], 12)
      assert.equal(offers.run, 'node --import ./scripts/server-only-test-register.mjs --import tsx --test --test-reporter=tap --test-concurrency=1 scripts/db/saved-offers-bg1-additive-1/native.test.ts')
      const transition = job.steps.at(-2)
      assert.equal(transition.name, 'Run atomic Admin BG1 transition and guarded runtime proof')
      assert.equal(transition['timeout-minutes'], 25)
      assert.equal(transition.run, 'node --import ./scripts/server-only-test-register.mjs --import tsx --test --test-reporter=tap --test-concurrency=1 scripts/db/admin-runtime-bg1-1/native.test.ts')
      assert.equal(job.steps.at(-2).run, originalCommand)
    } else assert.equal(job.steps.at(-1).run, originalCommand)
    assert.equal(JSON.stringify(job).includes('secrets.'), false)
  }
})

test('hosted PG17 has two mandatory isolated runners with complete serial proofs and unchanged guards', () => {
  const job = workflow.jobs.hosted_v3_native_pg17
  assert.ok(job)
  assert.equal(job.name, 'Hosted V3 — native PostgreSQL 17 (${{ matrix.group }})')
  assert.equal(job['runs-on'], 'ubuntu-24.04')
  assert.equal(job['timeout-minutes'], 30)
  assert.deepEqual(job.strategy, { 'fail-fast': false, 'max-parallel': 2, matrix: { group: ['main', 'quota'] } })
  assert.equal('if' in job, false)
  assert.equal('continue-on-error' in job, false)
  assert.ok(job.steps.every((step) => !('if' in step) && !('continue-on-error' in step)))
  assert.equal(job.steps[0].uses, 'actions/checkout@v4')
  assert.equal(job.steps[0].with['fetch-depth'], 0)
  const node = job.steps.find((step) => step.uses === 'actions/setup-node@v4')
  assert.deepEqual(node?.with, { 'node-version': '22.x', cache: 'npm' })
  for (const command of ['npm ci', 'npm run check:setup:ci', 'npm run check:operating-mode']) {
    assert.equal(job.steps.filter((step) => step.run === command).length, 1, command)
  }
  const operating = job.steps.find((step) => step.run === 'npm run check:operating-mode')
  assert.deepEqual(operating.env, {
    JETNITY_OPERATING_MODE_EVENT: '${{ github.event_name }}',
    JETNITY_OPERATING_MODE_REF: '${{ github.head_ref || github.ref_name }}',
    JETNITY_OPERATING_MODE_BASE_SHA: '${{ github.event.pull_request.base.sha || github.event.before }}',
    JETNITY_OPERATING_MODE_HEAD_SHA: '${{ github.event.pull_request.head.sha || github.sha }}',
  })
  const provisionName = 'Provision mandatory PostgreSQL 17 from signed official packages'
  const provision = job.steps.find((step) => step.name === provisionName)
  assert.ok(provision)
  assert.equal(provision.shell, 'bash')
  assert.equal(job.steps.filter((step) => step.name === provisionName).length, 1)
  assert.ok(job.steps.indexOf(operating) < job.steps.indexOf(provision))
  const selectedCommand = 'npm run test:hosted-v3-native:${{ matrix.group }}'
  assert.equal(job.steps.at(-1).run, selectedCommand)
  assert.equal(job.steps.filter((step) => step.run === selectedCommand).length, 1)
  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))
  for (const group of ['main', 'quota']) {
    assert.equal(pkg.scripts['test:hosted-v3-native:' + group],
      'node scripts/official-truth-v3-test-selection.mjs hosted-pg17-' + group)
  }
  assert.equal(workflow.jobs.verify.steps.some((step) => step.name === provisionName), false)
  assert.equal(workflow.jobs.verify.steps.filter((step) => step.run === 'npm run test:core').length, 1)
  assert.equal(JSON.stringify(job).includes('secrets.'), false)
})

test('isolated UI job keeps setup/operating gates and always preserves actual artifacts', () => {
  const job = workflow.jobs.official_truth_v3_ui
  assert.equal(job['runs-on'], 'ubuntu-latest')
  assert.equal(job['timeout-minutes'], 20)
  assert.equal(job.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD, '1')
  assert.equal(job.env.JETNITY_U1_SOURCE_HEAD, '${{ github.event.pull_request.head.sha || github.sha }}')
  assert.equal(job.steps[0].with['fetch-depth'], 0)
  for (const command of ['npm ci', 'npm run check:setup:ci', 'npm run check:operating-mode']) {
    assert.ok(job.steps.some((step) => step.run === command), command)
  }
  const audit = job.steps.find((step) => step.name === 'Actual isolated browser audit')
  assert.ok(audit?.run.endsWith('scripts/official-truth-product-v3-ui/run.mjs'))
  assert.equal('continue-on-error' in job, false)
  assert.ok(job.steps.every((step) => !('continue-on-error' in step)))
  const upload = job.steps.at(-1)
  assert.equal(upload.if, '${{ always() }}')
  assert.equal(upload.with['if-no-files-found'], 'error')
  assert.match(upload.with.name, /github\.run_id.*github\.run_attempt.*github\.sha/)
  assert.equal(JSON.stringify(job).includes('secrets.'), false)
})

test('browser selection rejects absent or nonexecutable files without launching anything', () => {
  assert.throws(() => selectU1SystemBrowser([]), /not skipped/)
  const dir = mkdtempSync(join(tmpdir(), 'jetnity-u1-browser-'))
  try {
    const inert = join(dir, 'inert'), executable = join(dir, 'executable')
    writeFileSync(inert, 'synthetic file, never launched'); chmodSync(inert, 0o600)
    writeFileSync(executable, 'synthetic file, never launched'); chmodSync(executable, 0o700)
    assert.throws(() => selectU1SystemBrowser([inert]), /No executable/)
    assert.equal(selectU1SystemBrowser([join(dir, 'missing'), inert, executable]), executable)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('UI harness has exactly one sandboxed launch and no download or launch fallback', () => {
  const runner = readFileSync(new URL('./run.mjs', import.meta.url), 'utf8')
  assert.equal((runner.match(/chromium\.launch\(/g) ?? []).length, 1)
  assert.match(runner, /chromiumSandbox: true/)
  assert.ok(runner.indexOf('report.browserPath = selectU1SystemBrowser()') < runner.indexOf('chromium.launch('))
  assert.doesNotMatch(runner, /--no-sandbox|--disable-setuid-sandbox|playwright install|channel:\s*['"]chrome/)
})

test('C1 synthetic application scenario requires actual narrow and enlarged-text restriction proof', () => {
  const runner = readFileSync(new URL('./run.mjs', import.meta.url), 'utf8')
  const server = readFileSync(new URL('./synthetic-server.ts', import.meta.url), 'utf8')
  const mount = readFileSync(new URL('./mount.tsx', import.meta.url), 'utf8')
  assert.match(mount, /option value="application"/)
  assert.match(server, /application: createV3VisitorQuery/)
  assert.match(server, /applicationFixture\.application\.projection/)
  assert.match(runner, /scenario\('application'\)/)
  for (const name of ['application-320', 'application-320-text200']) {
    assert.ok(runner.includes(`layout('${name}')`))
    assert.ok(runner.includes(`screenshot('${name}')`))
  }
  assert.ok(runner.includes('Reisebeginn und Reiseende müssen zwischen 2026-11-07 und 2026-11-13 liegen (beide Grenzen eingeschlossen).'))
  assert.equal((runner.match(/await assertApplicationRestrictions\(\)/g) ?? []).length, 2)
  assert.match(runner, /box\.scrollWidth <= box\.width \+ 1 && box\.scrollHeight <= box\.height \+ 1/)
})
