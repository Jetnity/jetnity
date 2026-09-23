#!/usr/bin/env node
// Truthful capability map. Code-completeness and actual execution stay distinct.
// Review 5293516993 found remaining CLI provenance, cleanup inventory and
// exact-SQL-identity defects. Those R1/R2/R5 corrections are in this head.
// Real stack execution remains NOT RUN.

export const IMPLEMENTATION = Object.freeze({
  preflight: 'IMPLEMENTED',
  sourcePins: 'IMPLEMENTED',
  ownedLifecycle: 'REVIEW_FIX_R2',
  envGuard: 'REUSED_AND_EXTENDED',
  cliIdentity: 'REVIEW_FIX_R1_R3',
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
    'Focused remaining R1/R3/R2/R5 corrections from review 5293516993. Explicit --cli-archive/--cli-checksums hash official input bytes and extract into newly owned tooling; sidecar/archiveVerified is never a trust root. Default remains no-start/no-download. Docker cleanup uses resource-specific ABSENT vs tool/context UNKNOWN, classifies every mount as owned/foreign/unresolved, and treats already-removed resources as idempotent ABSENT. Catalog PASS compares exact accepted prosrc and proconfig, not token heuristics. Helper tests are not full local execution. Official binaries, Docker and the real stack were not executed in this correction.',
})

export function notACompletedExecution(kind, reason) {
  return Object.assign(new Error(`${kind} is not a completed execution path: ${reason}`), {
    code: 'NOT_COMPLETED_EXECUTION',
    kind,
  })
}
