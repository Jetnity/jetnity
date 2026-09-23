#!/usr/bin/env node
// Truthful capability map. Code-completeness and actual execution stay distinct.
// Review 5291528414 found default-path defects beyond missing Docker.
// Those R1–R5 corrections are in this head. Real stack execution remains NOT RUN.

export const IMPLEMENTATION = Object.freeze({
  preflight: 'IMPLEMENTED',
  sourcePins: 'IMPLEMENTED',
  ownedLifecycle: 'REVIEW_FIX_R2',
  envGuard: 'REUSED_AND_EXTENDED',
  cliIdentity: 'REVIEW_FIX_R3',
  dockerCapability: 'IMPLEMENTED',
  stackStart: 'REVIEW_FIX_R2',
  migrationReplay: 'REVIEW_FIX_R5',
  catalogVerification: 'REVIEW_FIX_R5',
  fixtureProvision: 'IMPLEMENTED',
  appLaunch: 'REVIEW_FIX_R1',
  serverRpcObservation: 'REVIEW_FIX_R4',
  browserSessionFactory: 'REVIEW_FIX_R4',
  frozenContext: 'IMPLEMENTED',
  orchestration: 'REVIEW_FIX_R1_R2',
  browserFlows: 'SIBLING_OWNED',
  realStackExecution: 'NOT_RUN',
  codeCompleteClaim: false,
  note:
    'R1–R5 review corrections are implemented in owned runtime files. Helper/contract/subprocess/loopback-stand-in tests are not full local execution. Missing Docker remains an execution blocker; it was not the only prior defect. Default invocation is no-start. Full acceptance still requires the sibling browser module and a later TL-gated real integrated run.',
})

export function notACompletedExecution(kind, reason) {
  return Object.assign(new Error(`${kind} is not a completed execution path: ${reason}`), {
    code: 'NOT_COMPLETED_EXECUTION',
    kind,
  })
}
