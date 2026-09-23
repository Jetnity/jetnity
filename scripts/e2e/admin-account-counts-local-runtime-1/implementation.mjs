#!/usr/bin/env node
// Truthful capability map. Code-completeness and actual execution stay distinct.
// Missing Docker blocks a real run; it does not turn these modules into stubs.

export const IMPLEMENTATION = Object.freeze({
  preflight: 'IMPLEMENTED',
  sourcePins: 'IMPLEMENTED',
  ownedLifecycle: 'REUSED_556',
  envGuard: 'REUSED_AND_EXTENDED',
  cliIdentity: 'IMPLEMENTED',
  dockerCapability: 'IMPLEMENTED',
  stackStart: 'IMPLEMENTED',
  migrationReplay: 'IMPLEMENTED',
  fixtureProvision: 'IMPLEMENTED',
  appLaunch: 'IMPLEMENTED',
  serverRpcObservation: 'IMPLEMENTED',
  browserSessionFactory: 'IMPLEMENTED',
  frozenContext: 'IMPLEMENTED',
  orchestration: 'IMPLEMENTED',
  browserFlows: 'SIBLING_OWNED',
  note:
    'This lane implements isolated local stack/schema/fixture/app/observer/orchestration code. Default invocation is no-start. Full acceptance still requires the sibling browser module and a later TL-gated real integrated run. Missing Docker is an execution blocker, not a Production P0 incident and not permission to ship placeholders.',
})

export function notACompletedExecution(kind, reason) {
  return Object.assign(new Error(`${kind} is not a completed execution path: ${reason}`), {
    code: 'NOT_COMPLETED_EXECUTION',
    kind,
  })
}
