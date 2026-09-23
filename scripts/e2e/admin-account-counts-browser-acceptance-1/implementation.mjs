#!/usr/bin/env node
// Truthful implementation boundary for this command. Docker installation
// cannot make run.mjs start a stack, provision GoTrue, or drive the app.

export const IMPLEMENTATION = Object.freeze({
  preflight: 'IMPLEMENTED',
  sourcePins: 'IMPLEMENTED',
  ownedLifecycle: 'IMPLEMENTED',
  envGuard: 'IMPLEMENTED',
  stackStart: 'NOT IMPLEMENTED',
  fixtureProvision: 'NOT IMPLEMENTED',
  browserAcceptance: 'NOT IMPLEMENTED',
  serverRpcObservation: 'NOT IMPLEMENTED',
  migrationReplay: 'NOT IMPLEMENTED',
  note:
    'This command implements isolated preflight, working-tree source identity, effective-environment construction, and confirmed owned-process cleanup only. It does not start containers, apply SQL, provision Auth, or drive login/TOTP/Admin rendering. Missing Docker is an execution blocker, not a Production P0 incident.',
})

export function notImplementedError(kind) {
  return new Error(
    `${kind} is NOT IMPLEMENTED in this harness command. ${IMPLEMENTATION.note}`,
  )
}
