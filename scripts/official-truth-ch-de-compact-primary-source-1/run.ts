// Developer CLI: no arguments are OFFLINE/NOT_RUN. Only fixed S4/S5 opt-in.
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CH_DE_COMPACT_RELEASE_BLOCKERS } from './manifest'
import { probeChDeCompactOfficialSources } from './source-probe'

export async function runChDeCompact(args: readonly string[]) {
  const base = { schema: 'ch-de-compact-visa-research-v1', sourceStatus: 'SOURCE_NOT_QUALIFIED',
    acceptedOfficialTruth: false, f8: false, hostedImport: false, productionActivated: false,
    blockers: CH_DE_COMPACT_RELEASE_BLOCKERS }
  if (args.length === 0) return { exitCode: 0, report: { ...base, mode: 'OFFLINE', execution: 'NOT_RUN', observations: [] } }
  if (args.length !== 1 || args[0] !== '--live-official') {
    return { exitCode: 2, report: { ...base, mode: 'OFFLINE', execution: 'INVALID_ARGUMENTS', observations: [] } }
  }
  try {
    return { exitCode: 0, report: { ...base, mode: 'LIVE_RESEARCH', execution: 'EXECUTED', observations: await probeChDeCompactOfficialSources() } }
  } catch {
    return { exitCode: 1, report: { ...base, mode: 'LIVE_RESEARCH', execution: 'RUNNER_FAILED', observations: [] } }
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runChDeCompact(process.argv.slice(2)).then(({ exitCode, report }) => {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n')
    process.exitCode = exitCode
  })
}
