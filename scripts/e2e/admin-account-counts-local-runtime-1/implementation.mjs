#!/usr/bin/env node
// Truthful capability map. Code-completeness and actual execution stay distinct.
// Review 5294684706 found remaining consumer-artifact and explicit-mode defects.
// F1–F3 from 5294264491 stay preserved. Real stack execution remains NOT RUN.

export const IMPLEMENTATION = Object.freeze({
  preflight: 'IMPLEMENTED',
  sourcePins: 'IMPLEMENTED',
  ownedLifecycle: 'REVIEW_FIX_F3_F4',
  envGuard: 'REUSED_AND_EXTENDED',
  cliIdentity: 'REVIEW_FIX_C2',
  dockerCapability: 'IMPLEMENTED',
  stackStart: 'IMPLEMENTED',
  migrationReplay: 'IMPLEMENTED',
  catalogVerification: 'IMPLEMENTED',
  fixtureProvision: 'IMPLEMENTED',
  appLaunch: 'IMPLEMENTED',
  serverRpcObservation: 'IMPLEMENTED',
  browserSessionFactory: 'REVIEW_FIX_F3',
  frozenContext: 'IMPLEMENTED',
  orchestration: 'REVIEW_FIX_E1_E2',
  browserFlows: 'SIBLING_OWNED',
  realStackExecution: 'NOT_RUN',
  codeCompleteClaim: false,
  note:
    'E1/E2 from review 5294965628. Consumer export validates contractVersion, current-run identity, expected product head, exact G6–G19, permitted results and metadata; refuses access_token/refresh_token/JWT/otpauth/fill material; requires nonempty bounded structurally valid PNGs; publishes only after the whole set validates. writeEvidence and consumer copies use exclusive wx creation and refuse overwrite. Failed/NOT RUN receipts stay truthful. C1 names/mapping, C2 explicit/default routing and F1–F3 stay. Official binaries, Docker and the real stack were not executed in this correction.',
})

export function notACompletedExecution(kind, reason) {
  return Object.assign(new Error(`${kind} is not a completed execution path: ${reason}`), {
    code: 'NOT_COMPLETED_EXECUTION',
    kind,
  })
}
