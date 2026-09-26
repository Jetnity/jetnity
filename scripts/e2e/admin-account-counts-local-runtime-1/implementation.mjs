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
  dockerCapability: 'MACOS_ENDPOINT_FIX_1',
  stackStart: 'IMPLEMENTED',
  migrationReplay: 'IMPLEMENTED',
  catalogVerification: 'IMPLEMENTED',
  fixtureProvision: 'IMPLEMENTED',
  appLaunch: 'IMPLEMENTED',
  serverRpcObservation: 'IMPLEMENTED',
  browserSessionFactory: 'REVIEW_FIX_F3',
  frozenContext: 'IMPLEMENTED',
  orchestration: 'REVIEW_FIX_O2',
  browserFlows: 'SIBLING_OWNED',
  realStackExecution: 'NOT_RUN',
  codeCompleteClaim: false,
  note:
    'macOS Docker runtime fix 1: isolated child env no longer invents unix:///var/run/docker.sock. A parent-only read of the active Docker CLI/context may select one verified local Unix endpoint; remote/tcp/ssh/cloud fail closed; private HOME is not given copied Docker credentials/config. Linux default sockets remain supported. Docker Desktop macOS local Unix endpoints are supported without a hard-coded username. Official CLI 2.117.0 archive identity and version/help/start-help checks are unchanged. Official binaries, Docker and the real stack were not executed in this correction. O1/O2 and N01–N03/E1/E2/C1/C2/F1–F3 stay.',
})

export function notACompletedExecution(kind, reason) {
  return Object.assign(new Error(`${kind} is not a completed execution path: ${reason}`), {
    code: 'NOT_COMPLETED_EXECUTION',
    kind,
  })
}
