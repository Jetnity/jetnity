import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { observeBp1Once } from './source-probe'
import { bp1Report, serializeBp1Report } from './observations'

function command(input: unknown): 'plan' | 'observe' | 'invalid' {
  try {
    if (!Array.isArray(input) || Object.getPrototypeOf(input) !== Array.prototype || input.length > 1) return 'invalid'
    const descriptors = Object.getOwnPropertyDescriptors(input)
    if (Reflect.ownKeys(input).length !== input.length + 1) return 'invalid'
    if (input.length === 0) return 'plan'
    const arg = descriptors['0']
    if (!arg || !('value' in arg)) return 'invalid'
    if (arg.value === '--plan') return 'plan'
    return arg.value === '--observe-bp1-once' ? 'observe' : 'invalid'
  } catch { return 'invalid' }
}
/** Imports/default/plan are inert. The flag expresses intent, NOT an approval token. */
export async function runBp1(args: unknown) {
  const selected = command(args)
  if (selected !== 'observe') return { exitCode: selected === 'plan' ? 0 : 2,
    report: bp1Report({ mode: 'PLAN', outcome: selected === 'plan' ? 'NOT_RUN' : 'INVALID_ARGUMENTS',
      reason: selected === 'plan' ? 'not_run' : 'invalid_arguments' }) }
  const report = await observeBp1Once()
  return { exitCode: report.outcome === 'UNQUALIFIED_BODY_OBSERVED' ? 0 : 1, report }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runBp1(process.argv.slice(2)).then(({ exitCode, report }) => {
    process.stdout.write(serializeBp1Report(report))
    process.exitCode = exitCode
  }).catch(() => {
    process.stdout.write(serializeBp1Report(bp1Report({ mode: 'PLAN', outcome: 'ERROR', reason: 'observer_failed' })))
    process.exitCode = 1
  })
}
