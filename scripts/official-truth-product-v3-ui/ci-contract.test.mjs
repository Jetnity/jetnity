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
const families = ['verify', 'persisted_native', 'refresh_native', 'accepted_store_native', 'official_truth_v3_ui']

test('CI aggregate requires success from all original families and the isolated UI family', () => {
  const aggregate = workflow.jobs.required_verify
  assert.deepEqual(aggregate.needs, families)
  assert.equal(aggregate.if, '${{ always() }}')
  const gate = aggregate.steps[0]
  const variables = Object.keys(gate.env)
  assert.equal(variables.length, 5)
  for (const family of families) {
    assert.ok(workflow.jobs[family])
    assert.ok(Object.values(gate.env).includes(`\${{ needs.${family}.result }}`))
  }
  const allSucceeded = Object.fromEntries(variables.map((name) => [name, 'success']))
  const run = (results) => spawnSync('/bin/bash', ['-e', '-o', 'pipefail', '-c', gate.run], { env: { PATH: process.env.PATH, ...results }, encoding: 'utf8' })
  assert.equal(run(allSucceeded).status, 0)
  for (const name of variables) for (const status of ['failure', 'cancelled', 'skipped']) {
    assert.notEqual(run({ ...allSucceeded, [name]: status }).status, 0, `${name}/${status} must fail the aggregate`)
  }
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
