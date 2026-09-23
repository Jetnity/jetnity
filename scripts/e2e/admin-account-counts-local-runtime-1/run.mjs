#!/usr/bin/env node
// Local-runtime orchestrator. Default is a safe no-start preflight.
// --runtime-only may validate setup and cannot report full acceptance.
// --full must load the sibling browser module; absence is NOT_IMPLEMENTED.

import { mkdirSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { findeFreienLoopbackPort } from '../admin-account-counts-browser-acceptance-1/owned-lifecycle.mjs'
import {
  AGENT,
  BRANCH,
  CONTRACT_VERSION,
  EVIDENCE_DIR,
  EXIT,
  GENERATION,
  PRODUCT_BASELINE,
  RUN_LABEL_PREFIX,
  TASK,
  TASK_SEED,
  TIMEOUTS,
} from './constants.mjs'
import { IMPLEMENTATION } from './implementation.mjs'
import { baueDockerCliUmgebung, baueRuntimePreflightUmgebung, klassifiziereRuntimeUmgebung } from './env.mjs'
import { pruefeDockerFaehigkeit } from './docker-capability.mjs'
import { prepareOfficialCliIdentity, defaultReadOfficialArtifacts, parseCliArtifactArgs, platformKey, shouldInvokeOfficialCli } from './cli-identity.mjs'
import { assertRuntimeSources, leseRuntimeSourceManifest, assertCleanProductHead } from './source.mjs'
import { planeLoopbackDienste, bereiteOwnedWorkdir, assertOverlayKeepsAuthSemantics } from './overlay.mjs'
import { plannedSql } from './schema.mjs'
import { leereMatrix, setzeGate, loadBrowserModule, mergeBrowserGates, markBrowserNotImplemented, decideVerdict } from './gates.mjs'
import { raeumeOwnedAuf, cleanupDryRunKontrolle, bewerteCleanup } from './cleanup.mjs'
import { writeEvidence, redactSecrets, exportSanitizedRunArtifacts, createRunIdentity } from './evidence.mjs'
import { leseOverlayConfig } from './stack.mjs'
import { defaultStartRuntime } from './runtime.mjs'
import { findeAusfuehrbare } from '../admin-account-counts-browser-acceptance-1/resolve-executable.mjs'
import { createOwnershipRegistry } from './ownership.mjs'

export function parseMode(argv = process.argv.slice(2)) {
  if (argv.includes('--full')) return 'full'
  if (argv.includes('--runtime-only')) return 'runtime-only'
  return 'preflight'
}

export { shouldInvokeOfficialCli }

function nowId(now) {
  return `${RUN_LABEL_PREFIX}-${now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')}`
}

export async function run({
  env = process.env,
  argv = process.argv.slice(2),
  now = new Date(),
  evidenceDir = EVIDENCE_DIR,
  execFile = execFileSync,
  resolve = findeAusfuehrbare,
  importer,
  startRuntime = defaultStartRuntime,
  privateHome: providedHome,
  readOfficialArtifacts = defaultReadOfficialArtifacts,
  cliPins,
} = {}) {
  const mode = parseMode(argv)
  const invokeBinary = shouldInvokeOfficialCli(mode)
  const runId = nowId(now)
  const runIdentity = createRunIdentity({ runId })
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), TIMEOUTS.runtimeBudgetMs)
  const matrix = leereMatrix('NOT RUN')
  const privateHome = providedHome || mkdtempSync(join(tmpdir(), `${RUN_LABEL_PREFIX}-home-`))
  const toolingDir = join(privateHome, 'tooling')
  mkdirSync(toolingDir, { recursive: true, mode: 0o700 })
  const privateEvidence = mkdtempSync(join(privateHome, 'evidence-'))
  const registry = createOwnershipRegistry({
    runId,
    privateHome,
    evidenceDir: privateEvidence,
  })
  registry.execFile = execFile
  registry.runIdentity = runIdentity
  const owned = {
    privateHome,
    toolingDir,
    evidenceDir: privateEvidence,
    preflightOwned: { privateHome, homeCreated: true },
    browserRegistry: registry.browsers,
    execFile,
    registry,
    runId,
    runIdentity,
  }
  let verdict = 'NOT_IMPLEMENTED'
  let summary = null
  let browserPresent = false
  let consumerAttempted = false
  let consumerCompleted = false
  let cleanup = null
  try {
    const parentClass = klassifiziereRuntimeUmgebung(env)
    const childEnv = baueRuntimePreflightUmgebung({ parentEnv: env, privateHome })
    owned.childEnv = childEnv
    const dockerEnv = baueDockerCliUmgebung({ parentEnv: env, privateHome })
    const docker = pruefeDockerFaehigkeit({ env: dockerEnv, execFile, resolve })
    const artifactArgs = parseCliArtifactArgs(argv)
    const cli = prepareOfficialCliIdentity({
      toolingDir,
      env: childEnv,
      execFile,
      archivePath: artifactArgs.archivePath,
      checksumsPath: artifactArgs.checksumsPath,
      invokeBinary,
      readOfficialArtifacts,
      pins: cliPins,
    })
    const platform = platformKey()
    const source = leseRuntimeSourceManifest()
    try {
      assertRuntimeSources(source)
      assertCleanProductHead()
      setzeGate(matrix, 'G1_source_pins', {
        result: 'PASS',
        evidence: `${runId}-source-manifest.json`,
        notes: 'Working-tree identity for the accepted #557 source set plus package/lock/proxy/next config and the committed migration inventory.',
      })
    } catch (error) {
      setzeGate(matrix, 'G1_source_pins', {
        result: 'FAIL',
        notes: error instanceof Error ? error.message : String(error),
      })
    }

    const blockers = []
    if (!docker.usable) {
      blockers.push({
        id: 'container-runtime',
        exact: docker.note,
        severity: 'execution-blocker',
        notAProductionIncident: true,
      })
    }
    if (!cli.identityVerified) {
      blockers.push({
        id: 'supabase-cli',
        exact: cli.note,
        severity: 'execution-blocker',
        notAProductionIncident: true,
      })
    }
    const preflightPass = blockers.length === 0
    setzeGate(matrix, 'G0_preflight', {
      result: preflightPass ? 'PASS' : 'BLOCKED',
      evidence: `${runId}-preflight.json`,
      notes: preflightPass
        ? 'Isolated Docker daemon and official CLI 2.117.0 identity verified.'
        : blockers.map((item) => item.id).join(', '),
    })

    if (mode === 'preflight' || !preflightPass || matrix.G1_source_pins.result !== 'PASS') {
      setzeGate(matrix, 'G2_owned_stack', { result: 'NOT RUN', notes: 'Default no-start, or preflight/source blocked.' })
      setzeGate(matrix, 'G3_auth_schema_not_bootstrap', { result: 'NOT RUN', notes: 'Schema replay not started.' })
      setzeGate(matrix, 'G4_fixtures_via_gotrue', { result: 'NOT RUN', notes: 'GoTrue provisioning not started.' })
      setzeGate(matrix, 'G5_app_boot_loopback', { result: 'NOT RUN', notes: 'App launch not started.' })
      markBrowserNotImplemented(matrix, mode === 'full'
        ? 'Full mode requested but runtime stages did not start.'
        : 'Browser module is a sibling lane; default/runtime-only does not execute UI gates.')
    } else if (typeof startRuntime === 'function') {
      const ports = {
        apiPort: await findeFreienLoopbackPort(),
        dbPort: await findeFreienLoopbackPort(),
        appPort: await findeFreienLoopbackPort(),
        observerPort: await findeFreienLoopbackPort(),
      }
      const plan = planeLoopbackDienste(ports)
      const prepared = bereiteOwnedWorkdir({
        runId,
        overlayPorts: {
          ...ports,
          siteUrl: `http://127.0.0.1:${ports.appPort}`,
        },
        privateDir: privateHome,
        migrations: source.migrations,
      })
      owned.workdir = prepared.workdir
      owned.runIdentity = createRunIdentity({ runId, projectId: prepared.projectId })
      registry.runIdentity = owned.runIdentity
      assertOverlayKeepsAuthSemantics(leseOverlayConfig(prepared.configPath))
      const runtime = await startRuntime({
        owned,
        plan,
        prepared,
        source,
        cli,
        docker,
        childEnv: dockerEnv,
        signal: abort.signal,
      })
      Object.assign(owned, runtime.owned || {})
      for (const [id, gate] of Object.entries(runtime.gates || {})) {
        if (['G2_owned_stack', 'G3_auth_schema_not_bootstrap', 'G4_fixtures_via_gotrue', 'G5_app_boot_loopback'].includes(id)) {
          setzeGate(matrix, id, gate)
        }
      }
      if (mode === 'full') {
        const loaded = await loadBrowserModule({ importer })
        browserPresent = loaded.present
        if (!loaded.present) {
          markBrowserNotImplemented(matrix, 'Sibling browser module is absent. Full mode cannot PASS.')
        } else {
          consumerAttempted = true
          const flows = await loaded.module.runBrowserFlows(runtime.context)
          mergeBrowserGates(matrix, flows)
          consumerCompleted = true
        }
      } else {
        markBrowserNotImplemented(matrix, '--runtime-only cannot claim full acceptance.')
      }
    } else {
      setzeGate(matrix, 'G2_owned_stack', {
        result: 'NOT RUN',
        notes: 'Real stack start is implemented and injectable; this invocation did not request a rehearsal hook.',
      })
      setzeGate(matrix, 'G3_auth_schema_not_bootstrap', { result: 'NOT RUN', notes: 'Replay implemented; not started in this invocation.' })
      setzeGate(matrix, 'G4_fixtures_via_gotrue', { result: 'NOT RUN', notes: 'GoTrue provisioning implemented; not started in this invocation.' })
      setzeGate(matrix, 'G5_app_boot_loopback', { result: 'NOT RUN', notes: 'App launch implemented; not started in this invocation.' })
      if (mode === 'full') {
        const loaded = await loadBrowserModule({ importer })
        browserPresent = loaded.present
        markBrowserNotImplemented(matrix, loaded.present
          ? 'Browser module present, but runtime stages were not started in this invocation.'
          : 'Sibling browser module is absent. Full mode cannot PASS.')
      } else {
        markBrowserNotImplemented(matrix, 'Browser UI gates belong to the sibling lane.')
      }
    }

    const probe = cleanupDryRunKontrolle()
    cleanup = await raeumeOwnedAuf(owned, {
      exportArtifacts: () => exportSanitizedRunArtifacts({
        sourceDir: owned.evidenceDir,
        destDir: evidenceDir,
        runId,
        runIdentity: owned.runIdentity,
        ownedRoots: [privateHome],
        mode,
        consumerCompleted,
        consumerAttempted,
        productHead: PRODUCT_BASELINE,
      }),
    })
    const cleanupOk = probe.blocked === false
      && probe.allowed === true
      && probe.signalFailureBlocked === true
      && probe.dockerUnverifiedBlocked === true
      && probe.traversalBlocked === true
      && bewerteCleanup(cleanup, { registry: owned.registry, mode })
    setzeGate(matrix, 'G20_owned_cleanup', {
      result: cleanupOk ? 'PASS' : 'FAIL',
      evidence: `${runId}-cleanup.json`,
      notes: cleanupOk
        ? 'Owned preflight HOME/resources were confirmed stopped and then removed. Dry-run still refuses unsafe delete.'
        : 'Ownership was retained, teardown was unconfirmed, the registry was incomplete after fallible work, or a foreign resource was at risk.',
    })

    const decided = decideVerdict({ mode, matrix, cleanupOk, browserPresent })
    verdict = decided.verdict
    summary = decided.summary

    writeEvidence(evidenceDir, `${runId}-preflight.json`, {
      at: now.toISOString(),
      mode,
      platform,
      supportedPlatforms: ['linux-x64', 'darwin-arm64'],
      executedPlatform: platform,
      docker: {
        present: docker.present,
        usable: docker.usable,
        sockets: docker.sockets,
        commands: docker.commands,
        note: docker.note,
        installAttempted: false,
        notAProductionIncident: true,
      },
      cli: {
        selected: '2.117.0',
        identityVerified: cli.identityVerified,
        archiveBound: cli.archiveBound === true,
        version: cli.version,
        helpVerified: cli.helpVerified,
        startHelpVerified: cli.startHelpVerified,
        resolved: cli.resolved || null,
        binarySha256: cli.binarySha256 || null,
        note: cli.note,
      },
      environment: {
        parentHasHostedSupabaseNames: parentClass.parentHasHostedSupabaseNames,
        extraDeniedPresent: parentClass.extraDeniedPresent,
        usedAllowlistedChildEnv: true,
      },
      officialDocs: {
        localDevelopment: 'https://supabase.com/docs/guides/local-development',
        changelog: 'https://supabase.com/changelog',
        dockerPorts: 'https://docs.docker.com/engine/network/port-publishing/',
      },
      limitations: [
        'Default command is no-start.',
        'Missing Docker is an execution blocker, not a Production P0 incident.',
        'Full acceptance requires the sibling browser module and a later TL-gated integrated run.',
        'No hosted Production/Development query or activation.',
      ],
    })
    writeEvidence(evidenceDir, `${runId}-source-manifest.json`, {
      identityKind: source.identityKind,
      productBaseline: PRODUCT_BASELINE,
      files: Object.fromEntries(Object.entries(source.files).map(([key, value]) => [key, {
        path: value.path,
        workingTreeBlob: value.workingTreeBlob,
        committedBlob: value.committedBlob,
        dirtyWorktree: value.dirtyWorktree,
        sha256: value.sha256 || null,
      }])),
      extra: source.extra,
      migrations: {
        replay: source.migrations.replay,
        count: source.migrations.files.length,
      },
    })
    writeEvidence(evidenceDir, `${runId}-matrix.json`, { verdict, summary, matrix, mode, contractVersion: CONTRACT_VERSION })
    writeEvidence(evidenceDir, `${runId}-cleanup.json`, { cleanup, cleanupProbe: probe })
    writeEvidence(evidenceDir, `${runId}-run-receipt.json`, {
      agent: AGENT,
      generation: GENERATION,
      task: TASK,
      taskSeed: TASK_SEED,
      branch: BRANCH,
      productBaseline: PRODUCT_BASELINE,
      runId,
      mode,
      verdict,
      contractVersion: CONTRACT_VERSION,
      implementation: IMPLEMENTATION,
      summary,
      plannedSql: plannedSql(),
      browserPresent,
      fullLocalExecution: decided.fullLocalExecution,
      notDone: [
        'No hosted Production or Development access.',
        'No Ready/merge.',
        'No sibling-code import.',
        'No #550 bootstrap overlay.',
        'Integrated full-browser PASS remains a later TL gate.',
      ],
    })

    return {
      verdict,
      mode,
      runId,
      runIdentity: owned.runIdentity,
      invokeBinary,
      matrix,
      summary,
      cleanup,
      docker,
      cli,
      source,
      browserPresent,
      consumerCompleted,
      consumerAttempted,
    }
  } catch (error) {
    try {
      cleanup = await raeumeOwnedAuf(owned, {
        exportArtifacts: () => exportSanitizedRunArtifacts({
          sourceDir: owned.evidenceDir,
          destDir: evidenceDir,
          runId,
          runIdentity: owned.runIdentity,
          ownedRoots: [privateHome],
          mode,
          consumerCompleted,
          consumerAttempted,
          productHead: PRODUCT_BASELINE,
        }),
      })
    } catch (cleanupError) {
      cleanup = {
        unknown: true,
        ownershipRetained: true,
        error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
      }
    }
    const cleanupOk = bewerteCleanup(cleanup, { registry: owned.registry, mode })
    setzeGate(matrix, 'G20_owned_cleanup', {
      result: cleanupOk ? 'PASS' : 'FAIL',
      notes: error instanceof Error ? error.message : String(error),
    })
    const failureReceipt = persistFailureReceipt({
      evidenceDir,
      runId,
      error,
      cleanup,
      matrix,
    })
    if (error && typeof error === 'object') {
      error.failureReceipt = failureReceipt
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

export function persistFailureReceipt({ evidenceDir, runId, error, cleanup, matrix }) {
  const payload = {
    at: new Date().toISOString(),
    runId,
    error: error instanceof Error ? error.message : String(error),
    cleanup: redactSecrets(cleanup || {}),
    gates: Object.fromEntries(Object.entries(matrix || {}).map(([id, gate]) => [id, { result: gate.result }])),
  }
  if (!evidenceDir) return { ok: false, error: 'no durable evidence directory' }
  try {
    return {
      ok: true,
      path: writeEvidence(evidenceDir, `${runId}-failure.json`, payload),
    }
  } catch (persistError) {
    const message = persistError instanceof Error ? persistError.message : String(persistError)
    return {
      ok: false,
      collision: /overwrite existing durable evidence/.test(message),
      error: message,
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await run()
  console.log(JSON.stringify({
    verdict: result.verdict,
    mode: result.mode,
    runId: result.runId,
    fullLocalExecution: result.summary?.fullLocalExecution === true,
    dockerUsable: result.docker.usable,
    cliVerified: result.cli.identityVerified,
    implementation: IMPLEMENTATION,
  }, null, 2))
  const code = result.verdict === 'LOCAL_FULL_STACK_PASS'
    ? EXIT.pass
    : result.verdict === 'CLEANUP_FAIL' || result.verdict === 'FAIL'
      ? EXIT.failed
      : EXIT.blocked
  process.exit(code)
}
