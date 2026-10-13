/** Developer-only READ-ONLY preflight. R3 does not authorize live Phase B. */
import childProcess from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { verifyBernGithubPreflight } from '../../lib/readiness/official-truth-bern-g3-rq-fetch-1/authorization'
import { retrieveOfficialTruthBernOneShotResearchOnly } from '../../lib/readiness/official-truth-server-owned-retrieval'
import { createAuthenticatedBernGithubReader } from './github-read'

export async function bernResearchDeveloperOneShot(
  args: readonly string[],
): Promise<{ exitCode: 0 | 2; report: Readonly<Record<string, unknown>> }> {
  const base = { schema: 'official_truth_bern_g3_rq_fetch_1', mode: 'research_only',
    sourceFamily: 'german_embassy_bern_research_candidate', acceptedOfficialTruth: false,
    providerActivated: false, rawSourcePersisted: false, physicalAttemptMade: false }
  const blocked = (reason: string) => ({ exitCode: 2 as const,
    report: Object.freeze({ ...base, phase: 'BLOCKED', reason }) })
  if (args.length === 0) return { exitCode: 0, report: Object.freeze({ ...base, phase: 'NOT_RUN' }) }
  if (args.length !== 3 || args[0] !== '--execute-owner-approved-once') return blocked('invalid_arguments')
  const head = /^--approved-main-sha=([0-9a-f]{40})$/.exec(args[1] ?? '')
  const receipt = /^--issue-934-consumed-comment=([1-9][0-9]{0,15})$/.exec(args[2] ?? '')
  if (!head || !receipt || !Number.isSafeInteger(Number(receipt[1])) || Number(receipt[1]) === 6114368313) {
    return blocked('invalid_approval_receipt')
  }
  try {
    const options = { encoding: 'utf8' as const, timeout: 5000, maxBuffer: 65536, stdio: ['ignore', 'pipe', 'pipe'] as ['ignore', 'pipe', 'pipe'] }
    const current = childProcess.execFileSync('/usr/bin/git', ['rev-parse', 'HEAD'], options).trim()
    const dirty = childProcess.execFileSync('/usr/bin/git', ['status', '--porcelain', '--untracked-files=all'], options).trim()
    if (current !== head[1] || dirty !== '') return blocked('checkout_unverified')
    const read = createAuthenticatedBernGithubReader()
    const gate = await verifyBernGithubPreflight(read, { mainSha: head[1], commentId: Number(receipt[1]) })
    if (!gate.ok) return blocked(gate.reason)
    // Read-only validation does not mint permission. Even a future correct
    // ruleset/receipt cannot activate the explicitly blocked live export.
    const outcome = await retrieveOfficialTruthBernOneShotResearchOnly()
    return blocked(outcome.reason ?? 'live_execution_not_authorized')
  } catch { return blocked('github_unverifiable') }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  bernResearchDeveloperOneShot(process.argv.slice(2)).then(({ exitCode, report }) => {
    process.stdout.write(JSON.stringify(report) + '\n')
    process.exitCode = exitCode
  }).catch(() => {
    process.stderr.write('bern_research_failed_closed\n')
    process.exitCode = 2
  })
}
