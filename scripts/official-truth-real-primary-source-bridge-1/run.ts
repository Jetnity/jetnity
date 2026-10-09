// Explicit developer CLI. No argument reads a government source. Reports go only
// to stdout; caller may retain the closed sanitized JSON in task-owned evidence.
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runLiveOfficialSource, runOfflineFixture } from './bridge'
import { emptyReport, serializeReport } from './report'

export async function main(args: readonly string[]) {
  if (args.length === 0) return { exitCode: 0, report: emptyReport() }
  if (args.length !== 1 || !['--offline-fixture', '--live-official'].includes(args[0]!)) {
    return { exitCode: 2, report: { ...emptyReport(), engineering: 'FAILED' as const, reason: 'invalid_arguments' as const } }
  }
  try {
    const report = args[0] === '--offline-fixture' ? await runOfflineFixture() : await runLiveOfficialSource()
    // Safe source refusal is a valid engineering outcome; it never means legal PASS.
    return { exitCode: 0, report }
  } catch {
    return { exitCode: 1, report: { ...emptyReport(), engineering: 'FAILED' as const, reason: 'runner_failed' as const } }
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(({ exitCode, report }) => {
    try { process.stdout.write(serializeReport(report)); process.exitCode = exitCode }
    catch { process.stdout.write(serializeReport({ ...emptyReport(), engineering: 'FAILED', reason: 'runner_failed' })); process.exitCode = 1 }
  })
}
