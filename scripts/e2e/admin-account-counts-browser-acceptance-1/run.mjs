#!/usr/bin/env node
// Browser-acceptance orchestrator. Implemented preflight/source/cleanup only.
// This command does not start a stack, provision Auth, or drive the application.
// Historical receipt aacba1-20260923T020045Z is never overwritten.

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  AGENT,
  BRANCH,
  EVIDENCE_DIR,
  EXIT,
  GENERATION,
  HISTORICAL_RECEIPT_ID,
  INTEGRATION_BASELINE,
  PRODUCT_BASELINE,
  RUN_LABEL_PREFIX,
  TASK,
  TASK_SEED,
} from './constants.mjs'
import { screenshotPolicy } from './browser.mjs'
import { raeumeOwnedAuf, cleanupDryRunKontrolle } from './cleanup.mjs'
import { klassifiziereUmgebung } from './env-guard.mjs'
import { leereMatrix, setzeGate, zusammenfassung } from './gates.mjs'
import { IMPLEMENTATION } from './implementation.mjs'
import { FIXTURE_PLAN, sanitizeFixtureManifest } from './fixtures.mjs'
import { runPreflight } from './preflight.mjs'
import { assertPinnedSources, leseSourceManifest } from './source-manifest.mjs'
import { geplanteSqlAnwendung } from './stack.mjs'

const HISTORICAL_BASENAMES = new Set([
  'preflight.json',
  'source-manifest.json',
  'not-run-matrix.json',
  'cleanup.json',
  'run-receipt.json',
  'authorized-main-sync.json',
  'README.md',
])

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o644 })
}

function sanitizePreflight(preflight) {
  return {
    at: preflight.at,
    selectedRoute: preflight.selectedRoute,
    implementation: preflight.implementation,
    canRunFullStack: preflight.canRunFullStack,
    toolingReadyForLaterImplementation: preflight.toolingReadyForLaterImplementation,
    blockers: preflight.blockers,
    container: {
      present: preflight.container.present,
      usable: preflight.container.usable,
      commands: preflight.container.commands,
      sockets: preflight.container.sockets,
      note: preflight.container.note,
      severity: preflight.container.severity,
      notAProductionIncident: preflight.container.notAProductionIncident,
    },
    supabase: {
      available: preflight.supabase.available,
      via: preflight.supabase.via,
      pinned: preflight.supabase.pinned,
      identityVerified: preflight.supabase.identityVerified,
      identity: preflight.supabase.identity,
      resolved: preflight.supabase.resolved,
      version: preflight.supabase.version,
      helpVerified: preflight.supabase.helpVerified,
      startRequiresContainerRuntime: preflight.supabase.startRequiresContainerRuntime,
      officialRoute: preflight.supabase.officialRoute,
      totpDocs: preflight.supabase.totpDocs,
      note: preflight.supabase.note,
    },
    browser: {
      available: preflight.browser.available,
      launched: preflight.browser.launched,
      chromeVersion: preflight.browser.chromeVersion,
      playwrightIsolated: preflight.browser.playwrightIsolated,
      closeProved: preflight.browser.closeReport?.closed ?? null,
      closeTimedOut: preflight.browser.closeReport?.timedOut ?? null,
      note: preflight.browser.note,
    },
    node: preflight.node,
    environment: preflight.environment,
    limitations: preflight.limitations,
  }
}

export async function run({
  env = process.env,
  now = new Date(),
  evidenceDir = EVIDENCE_DIR,
  preflightOptions = {},
} = {}) {
  const runId = `${RUN_LABEL_PREFIX}-review-fix-${now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')}`
  mkdirSync(evidenceDir, { recursive: true })

  const matrix = leereMatrix('NOT IMPLEMENTED')
  const manifest = leseSourceManifest({ rev: 'HEAD' })
  assertPinnedSources(manifest)
  setzeGate(matrix, 'G1_source_pins', {
    result: 'PASS',
    evidence: `${runId}-source-manifest.json`,
    notes: 'Working-tree hash-object identity for the full applicable Auth/shared/client/UI/config/SQL set. Migration replay remains NOT IMPLEMENTED.',
  })

  geplanteSqlAnwendung()
  const preflight = await runPreflight({ env, ...preflightOptions })
  setzeGate(matrix, 'G0_preflight', {
    result: preflight.toolingReadyForLaterImplementation ? 'PASS' : 'BLOCKED',
    evidence: `${runId}-preflight.json`,
    notes: preflight.toolingReadyForLaterImplementation
      ? 'Implemented preflight checks passed. Stack/provision/browser execution remains NOT IMPLEMENTED.'
      : `${preflight.blockers.map((item) => item.id).join(', ')}. Missing Docker is an execution blocker, not a Production P0 incident. This command still does not implement stack/provision/browser execution.`,
  })

  for (const id of Object.keys(matrix)) {
    if (id === 'G0_preflight' || id === 'G1_source_pins' || id === 'G20_owned_cleanup') continue
    setzeGate(matrix, id, {
      result: 'NOT IMPLEMENTED',
      notes: IMPLEMENTATION.note,
    })
  }

  const cleanupProbe = cleanupDryRunKontrolle()
  const cleanup = await raeumeOwnedAuf({
    preflightOwned: preflight.owned,
    browserHandle: preflight.owned.closeReport?.closed ? null : preflight.owned.browserHandle,
    privateDir: preflight.owned.privateHome,
    browserCloseReport: preflight.owned.closeReport,
  }, { closeTimeoutMs: preflightOptions.closeTimeoutMs })
  const cleanupOk = cleanupProbe.blocked === false
    && cleanupProbe.allowed === true
    && cleanupProbe.signalFailureBlocked === true
    && cleanupProbe.dockerUnverifiedBlocked === true
    && cleanup.unknown !== true
    && cleanup.ownershipRetained !== true
    && cleanup.browserClosed === true
    && cleanup.privateHomeRemoved === true
  setzeGate(matrix, 'G20_owned_cleanup', {
    result: cleanupOk ? 'PASS' : 'FAIL',
    evidence: `${runId}-cleanup.json`,
    notes: cleanupOk
      ? 'Preflight owned HOME/browser were confirmed stopped and then removed. Dry-run still refuses unsafe delete.'
      : 'Preflight ownership was retained, close was unconfirmed, or private HOME was not removed.',
  })

  const summary = zusammenfassung(matrix)
  const verdict = !cleanupOk
    ? 'CLEANUP_FAIL'
    : summary.fullLocalExecution
      ? 'LOCAL_FULL_STACK_PASS'
      : summary.preflightBlocked
        ? 'BLOCKED_ENVIRONMENT'
        : 'NOT_IMPLEMENTED_CONTINUATION'

  const receipt = {
    agent: AGENT,
    generation: GENERATION,
    task: TASK,
    taskSeed: TASK_SEED,
    branch: BRANCH,
    productBaseline: PRODUCT_BASELINE,
    integrationBaseline: INTEGRATION_BASELINE,
    historicalReceiptId: HISTORICAL_RECEIPT_ID,
    historicalReceiptPreserved: true,
    runId,
    verdict,
    implementation: IMPLEMENTATION,
    summary,
    plannedSql: geplanteSqlAnwendung(),
    fixtureManifest: sanitizeFixtureManifest(FIXTURE_PLAN, { runId }),
    screenshotPolicy: screenshotPolicy(),
    parentEnvClassification: klassifiziereUmgebung(env),
    notDone: [
      'No hosted Production or Development access.',
      'No Ready/merge.',
      'No sibling #555 import as the browser path.',
      'No #550 bootstrap overlay.',
      'No forged AAL2.',
      'Login → TOTP/AAL2 → Admin render remains NOT IMPLEMENTED / NOT RUN.',
    ],
  }

  const writes = {
    [`${runId}-preflight.json`]: sanitizePreflight(preflight),
    [`${runId}-source-manifest.json`]: {
      identityKind: manifest.identityKind,
      pins: Object.fromEntries(
        Object.entries(manifest.files).map(([key, value]) => [key, value.workingTreeBlob]),
      ),
      files: Object.fromEntries(
        Object.entries(manifest.files).map(([key, value]) => [
          key,
          {
            path: value.path,
            workingTreeBlob: value.workingTreeBlob,
            committedBlob: value.committedBlob,
            dirtyWorktree: value.dirtyWorktree,
            sha256: value.sha256 || null,
            note: value.note || null,
          },
        ]),
      ),
      migrations: {
        replay: manifest.migrations.replay,
        count: manifest.migrations.files.length,
        note: manifest.migrations.note,
      },
    },
    [`${runId}-matrix.json`]: { verdict, summary, matrix },
    [`${runId}-cleanup.json`]: { cleanup, cleanupProbe },
    [`${runId}-run-receipt.json`]: receipt,
  }

  for (const [name, value] of Object.entries(writes)) {
    if (HISTORICAL_BASENAMES.has(name) || name === `${HISTORICAL_RECEIPT_ID}.json`) {
      throw new Error(`Refusing to overwrite historical evidence basename ${name}`)
    }
    writeJson(join(evidenceDir, name), value)
  }

  return { verdict, preflight, matrix, summary, runId, receipt, cleanup }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await run()
  console.log(JSON.stringify({
    verdict: result.verdict,
    runId: result.runId,
    blockers: result.preflight.blockers.map((item) => item.id),
    summary: result.summary,
    cleanupUnknown: result.cleanup.unknown,
    implementation: IMPLEMENTATION,
  }, null, 2))
  const code = result.verdict === 'LOCAL_FULL_STACK_PASS'
    ? EXIT.pass
    : result.verdict === 'CLEANUP_FAIL'
      ? EXIT.failed
      : EXIT.blocked
  process.exit(code)
}
