#!/usr/bin/env node
// Browser-acceptance orchestrator. Preflight first. BLOCKED stays BLOCKED.

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  AGENT,
  BRANCH,
  EVIDENCE_DIR,
  EXIT,
  GENERATION,
  PRODUCT_BASELINE,
  RUN_LABEL_PREFIX,
  TASK,
  TASK_SEED,
} from './constants.mjs'
import { leereMatrix, setzeGate, zusammenfassung } from './gates.mjs'
import { runPreflight } from './preflight.mjs'
import { assertPinnedSources, leseSourceManifest } from './source-manifest.mjs'
import { FIXTURE_PLAN, sanitizeFixtureManifest } from './fixtures.mjs'
import { geplanteSqlAnwendung } from './stack.mjs'
import { raeumeOwnedAuf, cleanupDryRunKontrolle } from './cleanup.mjs'
import { screenshotPolicy } from './browser.mjs'
import { klassifiziereUmgebung } from './env-guard.mjs'

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o644 })
}

function sanitizePreflight(preflight) {
  return {
    at: preflight.at,
    selectedRoute: preflight.selectedRoute,
    canRunFullStack: preflight.canRunFullStack,
    blockers: preflight.blockers,
    container: {
      available: preflight.container.available,
      commands: preflight.container.commands,
      sockets: preflight.container.sockets,
      note: preflight.container.note,
    },
    supabase: {
      available: preflight.supabase.available,
      via: preflight.supabase.via,
      version: preflight.supabase.version,
      helpVerified: preflight.supabase.helpVerified,
      startRequiresContainerRuntime: preflight.supabase.startRequiresContainerRuntime,
      officialRoute: preflight.supabase.officialRoute,
      totpDocs: preflight.supabase.totpDocs,
    },
    browser: {
      available: preflight.browser.available,
      chromeVersion: preflight.browser.chromeVersion,
      playwrightIsolated: preflight.browser.playwrightIsolated,
      note: preflight.browser.note,
    },
    node: preflight.node,
    environment: preflight.environment,
    limitations: preflight.limitations,
  }
}

export async function run({ env = process.env, now = new Date() } = {}) {
  const runId = `${RUN_LABEL_PREFIX}-${now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')}`
  mkdirSync(EVIDENCE_DIR, { recursive: true })

  const matrix = leereMatrix('NOT RUN')
  const manifest = leseSourceManifest({ rev: 'HEAD' })
  assertPinnedSources(manifest)
  setzeGate(matrix, 'G1_source_pins', {
    result: 'PASS',
    evidence: 'source-manifest.json',
    notes: 'Accepted producer/wrapper/contract/parser/activation/reader pins match the task.',
  })

  refuseSilentBootstrap()
  const preflight = await runPreflight({ env })
  setzeGate(matrix, 'G0_preflight', {
    result: preflight.canRunFullStack ? 'PASS' : 'BLOCKED',
    evidence: 'preflight.json',
    notes: preflight.canRunFullStack
      ? 'Official local stack and isolated browser are available.'
      : preflight.blockers.map((item) => item.id).join(', '),
  })

  if (!preflight.canRunFullStack) {
    for (const id of Object.keys(matrix)) {
      if (id === 'G0_preflight' || id === 'G1_source_pins') continue
      if (id === 'G20_owned_cleanup') continue
      setzeGate(matrix, id, {
        result: 'NOT RUN',
        notes: 'Blocked by G0 container-runtime. No forged AAL2, hosted fallback, or mocked UI labelled as acceptance.',
      })
    }
  }

  const cleanupProbe = cleanupDryRunKontrolle()
  const cleanup = await raeumeOwnedAuf({})
  setzeGate(matrix, 'G20_owned_cleanup', {
    result: cleanup.neverStarted && cleanupProbe.blocked === false && cleanupProbe.allowed === true ? 'PASS' : 'PARTIAL',
    evidence: 'cleanup.json',
    notes: 'No owned stack/app was started. Dry-run proves directories are not removed while an owned process remains active.',
  })

  const summary = zusammenfassung(matrix)
  const verdict = summary.fullLocalExecution
    ? 'LOCAL_FULL_STACK_PASS'
    : summary.preflightBlocked
      ? 'BLOCKED_ENVIRONMENT'
      : 'PARTIAL_OR_FAIL'

  const receipt = {
    agent: AGENT,
    generation: GENERATION,
    task: TASK,
    taskSeed: TASK_SEED,
    branch: BRANCH,
    productBaseline: PRODUCT_BASELINE,
    runId,
    verdict,
    summary,
    plannedSql: geplanteSqlAnwendung(),
    fixtureManifest: sanitizeFixtureManifest(FIXTURE_PLAN, { runId }),
    screenshotPolicy: screenshotPolicy(),
    parentEnvClassification: klassifiziereUmgebung(env),
    notDone: [
      'No hosted Production or Development access.',
      'No Ready/merge.',
      'No sibling #555 import.',
      'No #550 bootstrap overlay.',
      'No forged AAL2.',
    ],
  }

  writeJson(join(EVIDENCE_DIR, 'preflight.json'), sanitizePreflight(preflight))
  writeJson(join(EVIDENCE_DIR, 'source-manifest.json'), {
    pins: {
      producerSha256: manifest.files.producer.sha256,
      wrapperSha256: manifest.files.wrapper.sha256,
      contractBlob: manifest.files.contract.blob,
      parserBlob: manifest.files.parser.blob,
      activationBlob: manifest.files.activation.blob,
      readerBlob: manifest.files.reader.blob,
    },
    files: Object.fromEntries(
      Object.entries(manifest.files).map(([key, value]) => [
        key,
        { path: value.path, sha256: value.sha256 || null, blob: value.blob || null, note: value.note || null },
      ]),
    ),
  })
  writeJson(join(EVIDENCE_DIR, 'not-run-matrix.json'), { verdict, summary, matrix })
  writeJson(join(EVIDENCE_DIR, 'cleanup.json'), { cleanup, cleanupProbe })
  writeJson(join(EVIDENCE_DIR, 'run-receipt.json'), receipt)

  return { verdict, preflight, matrix, summary, runId, receipt }
}

function refuseSilentBootstrap() {
  geplanteSqlAnwendung()
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await run()
  console.log(JSON.stringify({
    verdict: result.verdict,
    runId: result.runId,
    blockers: result.preflight.blockers.map((item) => item.id),
    summary: result.summary,
  }, null, 2))
  process.exit(result.verdict === 'LOCAL_FULL_STACK_PASS' ? EXIT.pass : EXIT.blocked)
}
