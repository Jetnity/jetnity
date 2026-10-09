// Explicit offline developer runner; no files, URLs, environment or network inputs.
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createLegalProofPacket } from './packet'
import { syntheticIntent } from './fixtures'

export function main(args: readonly string[]) {
  if (args.length === 0) return { exitCode: 0, execution: 'NOT_RUN' as const, packet: null }
  if (args.length !== 1 || args[0] !== '--synthetic') return { exitCode: 2, execution: 'INVALID_ARGUMENTS' as const, packet: null }
  return { exitCode: 0, execution: 'SYNTHETIC_ONLY' as const, packet: createLegalProofPacket(syntheticIntent()) }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = main(process.argv.slice(2))
  process.stdout.write(JSON.stringify(result, null, 2) + '\n')
  process.exitCode = result.exitCode
}
