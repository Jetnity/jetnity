import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  officialTruthBernResearchQuarantineNotRun,
} from '@/lib/readiness/official-truth-bern-research-quarantine-1/offline'

export async function runOfficialTruthBernResearchQuarantine1(args: readonly string[]) {
  const base = {
    schema: 'official_truth_bern_research_quarantine_1',
    execution: 'NOT_RUN',
    realNetworkAttempts: 0,
    researchOnlyNotQualified: true,
    result: officialTruthBernResearchQuarantineNotRun(),
  } as const
  if (args.length === 0) return { exitCode: 0, report: base }
  return {
    exitCode: 2,
    report: {
      ...base,
      execution: 'INVALID_ARGUMENTS',
      result: { ...base.result, phase: 'blocked' as const, reason: 'invalid_request' as const },
    },
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runOfficialTruthBernResearchQuarantine1(process.argv.slice(2)).then(({ exitCode, report }) => {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
    process.exitCode = exitCode
  })
}
