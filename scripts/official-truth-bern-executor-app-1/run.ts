import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { blocked } from '../../lib/readiness/official-truth-bern-executor-app-1/policy'
import { liveAppTransport } from './github'

/** Developer-only, no environment overrides, credential arguments or public
 * route. Real IDs require independent TL readback; fixtures cannot configure it.
 * The transport is independently closed even if this first gate is changed. */
export function bernAppDeveloperPreflight(args: readonly string[]) {
  const report = { schema: 'bern_app_preflight_v1', appId: null, installationId: null,
    credentialRead: false, credentialMinted: false, bernRequest: false,
    ...blocked(args.length === 1 && args[0] === '--preflight' ? 'identity_unconfigured' : 'invalid_arguments') }
  return { exitCode: 2, report }
}

// Explicitly retain the second hard gate as part of the developer surface.
// This reports readiness only and cannot read a key, create a token or do I/O.
export function bernAppCustodyGate() {
  try { liveAppTransport(); return blocked('identity_unconfigured') }
  catch { return blocked('custody_and_code_not_accepted') }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = bernAppDeveloperPreflight(process.argv.slice(2))
  process.stdout.write(JSON.stringify(result.report) + '\n')
  process.exitCode = result.exitCode
}
