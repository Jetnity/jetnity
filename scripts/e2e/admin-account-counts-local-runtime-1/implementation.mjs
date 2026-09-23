#!/usr/bin/env node
// Truthful capability map. Code-completeness and actual execution stay distinct.
// Review 5294264491 found remaining tar-buffer, snapshot-dotenv, browser-ownership
// and evidence-order defects. Those F1–F4 corrections are in this head.
// Real stack execution remains NOT RUN.

export const IMPLEMENTATION = Object.freeze({
  preflight: 'IMPLEMENTED',
  sourcePins: 'IMPLEMENTED',
  ownedLifecycle: 'REVIEW_FIX_F3_F4',
  envGuard: 'REUSED_AND_EXTENDED',
  cliIdentity: 'REVIEW_FIX_F1',
  dockerCapability: 'IMPLEMENTED',
  stackStart: 'IMPLEMENTED',
  migrationReplay: 'IMPLEMENTED',
  catalogVerification: 'IMPLEMENTED',
  fixtureProvision: 'IMPLEMENTED',
  appLaunch: 'IMPLEMENTED',
  serverRpcObservation: 'IMPLEMENTED',
  browserSessionFactory: 'REVIEW_FIX_F3',
  frozenContext: 'IMPLEMENTED',
  orchestration: 'REVIEW_FIX_F3_F4',
  browserFlows: 'SIBLING_OWNED',
  realStackExecution: 'NOT_RUN',
  codeCompleteClaim: false,
  note:
    'F1–F4 from review 5294264491. Tar-member hashing writes to an isolated file with timeout/maxBytes (2MiB no longer ENOBUFS). Snapshots exclude disclosed dotenv templates including the baseline .env.example without inheriting configuration. One browsers map is shared from runner through context to cleanup; acquired Context is recorded before fallible policy; request-event violations are contained. Sanitized artifacts export before private HOME deletion; failure receipts never recreate deleted private state. Official binaries, Docker and the real stack were not executed in this correction.',
})

export function notACompletedExecution(kind, reason) {
  return Object.assign(new Error(`${kind} is not a completed execution path: ${reason}`), {
    code: 'NOT_COMPLETED_EXECUTION',
    kind,
  })
}
