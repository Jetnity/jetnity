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
  orchestration: 'REVIEW_FIX_O1',
  browserFlows: 'SIBLING_OWNED',
  realStackExecution: 'NOT_RUN',
  codeCompleteClaim: false,
  note:
    'O1 from review 5296288833. Container and volume identity are classified from each resource\'s own inspect metadata. Container labels do not authorize mounted volumes; network membership does not override an explicit foreign container label; a stale owned record cannot suppress live foreign identity. Exact-project CLI stop is skipped when foreign, unresolved or conflicting identity is present. Official CLI objects are recognized from inspected com.supabase.cli.project, not by inventing or applying labels. Genuinely owned teardown and already-absent idempotence remain. N01–N03 image/result controls and earlier evidence fixes stay unchanged. Official binaries, Docker and the real stack were not executed in this correction.',
})

export function notACompletedExecution(kind, reason) {
  return Object.assign(new Error(`${kind} is not a completed execution path: ${reason}`), {
    code: 'NOT_COMPLETED_EXECUTION',
    kind,
  })
}
