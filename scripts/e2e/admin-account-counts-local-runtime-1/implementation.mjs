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
  orchestration: 'REVIEW_FIX_E1A_E1B_E1C',
  browserFlows: 'SIBLING_OWNED',
  realStackExecution: 'NOT_RUN',
  codeCompleteClaim: false,
  note:
    'E1a–E1c from review 5295504615. Consumer export accepts the actual producer-shaped receipt (agent/generation/implementationMetadata/thisInvocation/implementation/realExecution/runtimeIntegration plus G6–G19) and still rejects unknown/secret/drift. PNG verification requires nonzero dimensions, CRC-valid chunks, IDAT and an inflated payload that matches IHDR; the TL-supplied 2x2 RGB fixture is the positive inert image. fill/otpauth/JWT/token values are redacted or refused as whole strings. E2 exclusive writes stay. Official binaries, Docker and the real stack were not executed in this correction.',
})

export function notACompletedExecution(kind, reason) {
  return Object.assign(new Error(`${kind} is not a completed execution path: ${reason}`), {
    code: 'NOT_COMPLETED_EXECUTION',
    kind,
  })
}
