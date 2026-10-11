/**
 * Developer-only, fixed Bern S3 research. NO auto-run on import, CI, Preview,
 * normal app navigation or npm scripts. Phase B requires an independent TL
 * exact-main PASS plus a pre-existing sanitized Issue #934 reservation receipt.
 * This launcher makes no request unless all exact manual gates are supplied.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  retrieveOfficialTruthBernOneShotResearchOnly,
} from '@/lib/readiness/official-truth-server-owned-retrieval'

const CONSUMED_PATH = join(process.cwd(), '.jetnity', 'bern-g3-rq-fetch-1-attempt-consumed.json')

type ExecFn = () => ReturnType<typeof retrieveOfficialTruthBernOneShotResearchOnly>

export async function bernResearchDeveloperOneShot(
  args: readonly string[],
  run: ExecFn = retrieveOfficialTruthBernOneShotResearchOnly,
): Promise<{ exitCode: 0 | 2; report: Readonly<Record<string, unknown>> }> {
  const base = {
    schema: 'official_truth_bern_g3_rq_fetch_1',
    mode: 'research_only',
    sourceFamily: 'german_embassy_bern_research_candidate',
    acceptedOfficialTruth: false,
    providerActivated: false,
    rawSourcePersisted: false,
  }
  if (args.length === 0) {
    return { exitCode: 0, report: Object.freeze({ ...base, phase: 'NOT_RUN', physicalAttemptMade: false }) }
  }
  if (args.length !== 3 || args[0] !== '--execute-owner-approved-once') {
    return { exitCode: 2, report: Object.freeze({ ...base, phase: 'BLOCKED', reason: 'invalid_arguments' }) }
  }
  const head = /^--approved-main-sha=([0-9a-f]{40})$/.exec(args[1] ?? '')
  const receipt = /^--issue-934-consumed-comment=([1-9][0-9]{4,20})$/.exec(args[2] ?? '')
  if (!head || !receipt) {
    return { exitCode: 2, report: Object.freeze({ ...base, phase: 'BLOCKED', reason: 'invalid_approval_receipt' }) }
  }
  let liveHead = ''
  try {
    liveHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  } catch {
    return { exitCode: 2, report: Object.freeze({ ...base, phase: 'BLOCKED', reason: 'git_head_unavailable' }) }
  }
  if (liveHead !== head[1]) {
    return { exitCode: 2, report: Object.freeze({ ...base, phase: 'BLOCKED', reason: 'head_mismatch' }) }
  }
  // The TL MUST independently check this comment is present in Issue #934,
  // identifies current reviewed main SHA, and reserves/consumes the ONLY B attempt.
  // The local file is merely an additional atomic safeguard against repeated
  // invocation in this workspace. It contains NO original response material.
  const reservation = Object.freeze({
    schema: 'bern_g3_rq_fetch_1_attempt_consumed',
    state: 'ATTEMPT_CONSUMED_BEFORE_NETWORK',
    reviewedMainSha: head[1],
    githubIssue: 934,
    ownerReceiptComment: receipt[1],
    reservedAtUtc: new Date().toISOString(),
  })
  try {
    mkdirSync(dirname(CONSUMED_PATH), { recursive: true, mode: 0o700 })
    writeFileSync(CONSUMED_PATH, JSON.stringify(reservation) + '\n', { encoding: 'utf8', flag: 'wx', mode: 0o600 })
  } catch {
    return { exitCode: 2, report: Object.freeze({ ...base, phase: 'BLOCKED', reason: 'attempt_already_reserved_or_unwritable' }) }
  }
  try {
    const outcome = await run()
    return {
      exitCode: outcome.phase === 'observed_research_only' ? 0 : 2,
      report: Object.freeze({ ...base, phase: 'ATTEMPT_CONSUMED', physicalAttemptMade: outcome.networkAttempted, outcome }),
    }
  } catch {
    // The one-shot remains consumed even if an exception is thrown.
    return { exitCode: 2, report: Object.freeze({ ...base, phase: 'ATTEMPT_CONSUMED', reason: 'research_execution_failed' }) }
  }
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
