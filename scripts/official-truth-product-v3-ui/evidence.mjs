// Read-only run identity for synthetic test artifacts. No GitHub/API calls.
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = join(dirname(fileURLToPath(import.meta.url)), '../..')
export const U1_EVIDENCE_DIRECTORY = join(REPO, 'test-results/official-truth-product-v3-ui')

function u1EvidenceBinding() {
  const checkedOutHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).trim()
  const sourceHead = process.env.JETNITY_U1_SOURCE_HEAD ?? null
  if (sourceHead !== null) {
    if (!/^[a-f0-9]{40}$/.test(sourceHead)) throw new Error('Invalid source head for U1 evidence')
    execFileSync('git', ['merge-base', '--is-ancestor', sourceHead, checkedOutHead], { cwd: REPO, stdio: 'pipe' })
  }
  if (process.env.GITHUB_ACTIONS === 'true' && sourceHead === null) throw new Error('CI U1 evidence requires the source head')
  return { checkedOutHead, sourceHead, worktreeDirty: execFileSync('git', ['status', '--porcelain'], { cwd: REPO, encoding: 'utf8' }).trim().length > 0,
    githubSha: process.env.GITHUB_SHA ?? null, runId: process.env.GITHUB_RUN_ID ?? null,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null, event: process.env.GITHUB_EVENT_NAME ?? null }
}

export function writeU1Evidence(name, value) {
  if (!/^(?:audit|http-smoke|benchmark|bundle-inputs|run-binding)\.json$/.test(name)) throw new Error('Unknown U1 evidence artifact')
  mkdirSync(U1_EVIDENCE_DIRECTORY, { recursive: true })
  const artifact = { ...value, binding: u1EvidenceBinding() }
  writeFileSync(join(U1_EVIDENCE_DIRECTORY, name), `${JSON.stringify(artifact, null, 2)}\n`)
  return artifact
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] !== '--initialize') throw new Error('Expected --initialize')
  // This fixed ignored directory contains only this harness's reproducible output.
  rmSync(U1_EVIDENCE_DIRECTORY, { recursive: true, force: true })
  writeU1Evidence('run-binding.json', { status: 'initialized', node: process.version, recordedAt: new Date().toISOString() })
  writeU1Evidence('audit.json', { status: 'not_started', screenshots: [], layouts: [], interactions: [] })
}
