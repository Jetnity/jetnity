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
  orchestration: 'REVIEW_FIX_N01_N02_N03',
  browserFlows: 'SIBLING_OWNED',
  realStackExecution: 'NOT_RUN',
  codeCompleteClaim: false,
  note:
    'N01–N03 from review 5295892822. Screenshot publication is limited to RGB/RGBA bit depths 8/16 with IHDR/IDAT/IEND only; CRC-valid type2/depth1 and tEXt/eXIf/unknown ancillary images are refused before durable write. thisInvocation.observedResults must match the G6–G19 gate results in order. Producer-shaped safe metadata, truthful FAIL/BLOCKED/NOT RUN, exclusive writes, whole-string fill/otpauth redaction, C1/C2 and F1–F3 stay. Official binaries, Docker and the real stack were not executed in this correction.',
})

export function notACompletedExecution(kind, reason) {
  return Object.assign(new Error(`${kind} is not a completed execution path: ${reason}`), {
    code: 'NOT_COMPLETED_EXECUTION',
    kind,
  })
}
