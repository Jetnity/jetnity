// One opt-in engineering command: actual captured execution -> actual local SQL -> fresh semantic read.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { PILOT_FAULTS } from './engine'
import { runControlledSyntheticPilot } from './controlled-runtime'
import { verifyIntegratedPilotBundle } from '@/lib/readiness/official-truth-integrated-pilot-bundle'
import { runLocalStorageProof } from '../db/official-truth-integrated-pilot-1/proof'
import { runIntegratedLocalStorageProof } from '../db/official-truth-integrated-pilot-1/integrated-proof'
import { runR3NativeProof } from '../db/official-truth-integrated-pilot-1/r3-proof'
import { runOfficialSourceQualification } from './official-source'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const trace = z.object({ catalogReads: z.number().int(), originalHttp: z.number().int(), freshHttp: z.number().int(),
  evidenceAcceptances: z.number().int(), proof: z.boolean(), extracted: z.boolean(), actualFactIdentity: z.boolean(),
  receiptProjected: z.boolean(), publicationCount: z.number().int(), storageCalls: z.number().int() }).strict()
const positive = z.object({ mode: z.enum(['primary','composed']), profile: z.literal('ot-integrated-pilot-local-closure-v2'),
  status: z.literal('COMMITTED_AND_READBACK_VERIFIED'), stages: z.array(z.string()), trace,
  recordFingerprint: z.string(), storedReadbackRows: z.number().int().positive(), legacyV1: z.literal('REJECTED_DEPTH_11') }).strict()
const negative = z.object({ mode: z.enum(['primary','composed']), fault: z.enum(PILOT_FAULTS),
  status: z.literal('blocked'), reason: z.string().regex(/^[a-z_]+$/),
  closureBound: z.object({ limit: z.literal('depth'), observed: z.number().int(), maximum: z.union([z.literal(8),z.literal(16)]) }).strict().nullable(),
  stages: z.array(z.string()), trace }).strict()
const persisted = z.object({ outcome: z.literal('inserted'), repeat: z.literal('idempotent'), readback: z.literal('VERIFIED'), rowCount: z.number().int().positive() }).strict()
const postgresSchema = z.object({ status: z.literal('PASS'), profile: z.literal('ot-integrated-pilot-local-closure-v2'),
  postgresVersion: z.string(), checks: z.array(z.string()).min(1), primary: persisted, composed: persisted,
  integratedReceiptRoundtrip: z.literal('VERIFIED'), fullSemanticPublication: z.literal('VERIFIED'),
  productionActivation: z.literal(false), hostedApply: z.literal(false) }).strict()
const structuralSchema = z.object({ status: z.literal('PASS'), scope: z.literal('synthetic_storage_structure_only'),
  postgresVersion: z.string(), checks: z.array(z.string()), integratedReceiptRoundtrip: z.literal('NOT_VERIFIED'),
  fullSemanticPublication: z.literal('BLOCKED'), productionActivation: z.literal(false), hostedApply: z.literal(false) }).strict()
const r3Schema = z.object({ status: z.literal('PASS'), postgresVersion: z.string(), checks: z.array(z.string()).length(18),
  codecComparisons: z.number().int().min(800), guardLoss: z.array(z.object({
    scenario: z.enum(['cancel','terminate','ack_race']), elapsedAfterLossMs: z.number().int().nonnegative(),
    outcome: z.enum(['commit_outcome_unknown','acknowledged_verified_commit']), diagnostic: z.object({
      phase: z.literal('commit'), elapsedMs: z.number().int().nonnegative(), outcome: z.enum(['complete','timeout','sql_error','transport_error']),
      code: z.string().nullable(), commitAcknowledged: z.boolean(), protectionFailure: z.literal('commit_guard_lost'),
    }).strict(),
  }).strict()).length(3),
}).strict()
const reportSchema = z.object({ schema: z.literal('official-truth-integrated-pilot-report-v3'),
  engineeringAcceptance: z.literal('PASS'),
  implementation: z.literal('LOCAL_ENGINEERING_VERIFIED'), synthetic: z.object({ primary: positive, composed: positive,
    failurePaths: z.array(negative), positiveIntegratedConformance: z.literal('VERIFIED'),
    fullReceiptCustodyVerification: z.literal('VERIFIED'), publicationCount: z.literal(2) }).strict(),
  postgres: postgresSchema, r3: r3Schema, historicalStructuralProof: structuralSchema,
  realOfficialSourcePilot: z.enum(['BLOCKED','NOT_RUN']), officialSourceEvidence: z.string().nullable(),
  loadedApplicationBytes: z.literal('CAPTURED_BUILD_EXECUTED'),
  trustedComputingBase: z.literal('host_loader_esbuild_node_interpreter_and_finite_builtins'),
  historicalAuditGrantsCurrentAuthority: z.literal(false), f8: z.literal('CLOSED'), visitorEvaluation: z.literal('NOT_ACTIVATED'),
  hostedDevelopmentApply: z.literal(false), productionActivation: z.literal(false), independentTLPass: z.literal(false),
}).strict()

export async function runIntegratedDeveloperProof(runOfficialSource = false) {
  const primary = await runControlledSyntheticPilot('primary'), composed = await runControlledSyntheticPilot('composed')
  if (primary.status !== 'synthetic_bundle_verified' || composed.status !== 'synthetic_bundle_verified') throw Error('synthetic_positive_missing')
  for (const result of [primary, composed]) {
    if (!result.trace.actualFactIdentity || !result.trace.proof || !result.trace.receiptProjected) throw Error('synthetic_path_regression')
    const legacy = verifyIntegratedPilotBundle(result.envelope.bundle)
    if (legacy.ok || legacy.reason !== 'closure_bound_exceeded' || legacy.bound?.observed !== 11 || legacy.bound.maximum !== 8) throw Error('legacy_profile_regression')
  }
  // These exact producer envelopes are the arguments to real SQL publication;
  // the SQL proof must return acknowledged commit + fresh fully verified rows.
  const postgres = postgresSchema.parse(await runIntegratedLocalStorageProof(primary.envelope, composed.envelope))
  const failurePaths = []
  for (const mode of ['primary','composed'] as const) for (const fault of PILOT_FAULTS.filter(f => f !== 'none')) {
    const result = await runControlledSyntheticPilot(mode, fault)
    if (result.status !== 'blocked' || result.reason === 'closure_bound_exceeded' || result.trace.publicationCount || result.trace.storageCalls) throw Error('negative_path_regression')
    failurePaths.push(result)
  }
  const r3 = r3Schema.parse(await runR3NativeProof(primary.envelope))
  const structural = structuralSchema.parse(await runLocalStorageProof())
  const official = runOfficialSource ? await runOfficialSourceQualification() : null
  const summary = (result: typeof primary, sql: z.infer<typeof persisted>) => ({ mode: result.mode,
    profile: result.envelope.profile, status: 'COMMITTED_AND_READBACK_VERIFIED',
    stages: [...result.stages, 'atomic_sql_commit_acknowledged', 'fresh_full_semantic_readback'],
    trace: { ...result.trace, publicationCount: 1, storageCalls: 1 }, recordFingerprint: result.envelope.bundle.recordFingerprint,
    storedReadbackRows: sql.rowCount, legacyV1: 'REJECTED_DEPTH_11' })
  const report = reportSchema.parse({ schema: 'official-truth-integrated-pilot-report-v3',
    engineeringAcceptance: 'PASS', implementation: 'LOCAL_ENGINEERING_VERIFIED',
    synthetic: { primary: summary(primary, postgres.primary), composed: summary(composed, postgres.composed), failurePaths,
      positiveIntegratedConformance: 'VERIFIED', fullReceiptCustodyVerification: 'VERIFIED', publicationCount: 2 },
    postgres, r3, historicalStructuralProof: structural, realOfficialSourcePilot: official?.realOfficialSourcePilot ?? 'NOT_RUN',
    officialSourceEvidence: official ? 'docs/evidence/official-truth-integrated-pilot-1/official-source.json' : null,
    loadedApplicationBytes: 'CAPTURED_BUILD_EXECUTED', trustedComputingBase: 'host_loader_esbuild_node_interpreter_and_finite_builtins',
    historicalAuditGrantsCurrentAuthority: false, f8: 'CLOSED', visitorEvaluation: 'NOT_ACTIVATED', hostedDevelopmentApply: false,
    productionActivation: false, independentTLPass: false })
  const reportText = ['LOCAL_ENGINEERING_COMMAND_PASS', '',
    'Primary and Composition: captured application build executed; complete receipt/K/dependencies verified.',
    'Both actual bundles: atomic PostgreSQL commit acknowledged; fresh full semantic readback verified.',
    'Exact idempotent repeats add no data. Legacy v1 separately refuses both depth11 bundles at8.',
    `Controlled failure paths: ${failurePaths.length}; semantic PostgreSQL checks: ${postgres.checks.length}.`,
    `R3 native URL/guard-loss proof: ${r3.checks.length} checks; ${r3.codecComparisons} frozen-reader comparisons.`,
    `Historical structural proof: ${structural.checks.length} checks; separate from semantic publication.`,
    `Real official source: ${report.realOfficialSourcePilot}${report.officialSourceEvidence ? `; see ${report.officialSourceEvidence}` : ''}.`,
    'Guarantee: controlled local application execution; host loader/compiler/Node remain the trusted computing base.',
    'Historical audit grants no current authority. F8 closed; no hosted apply or production activation.',
    'Author engineering evidence only. Draft retained; independent exact-head TL review required.', '',
    'Exit0 means engineering conformance passed; exit1 means an unexpected or missing mandatory proof.', ''].join('\n')
  const output = resolve(root, 'docs/evidence/official-truth-integrated-pilot-1'); mkdirSync(output, { recursive: true })
  writeFileSync(resolve(output, 'developer-report.json'), JSON.stringify(report, null, 2) + '\n')
  writeFileSync(resolve(output, 'developer-report.txt'), reportText)
  return { report, reportText }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.slice(2).some(arg => arg !== '--run-official-source') || process.argv.length > 3) throw Error('unsupported_pilot_argument')
  runIntegratedDeveloperProof(process.argv.includes('--run-official-source')).then(({ reportText }) => process.stdout.write(reportText))
    .catch((error: unknown) => {
      const reason = error instanceof Error && /^[a-z][a-z0-9_]{1,80}$/.test(error.message)
        ? error.message : 'integrated_pilot_conformance_failed'
      const output = resolve(root, 'docs/evidence/official-truth-integrated-pilot-1'); mkdirSync(output, { recursive: true })
      const failed = z.object({ schema: z.literal('official-truth-integrated-pilot-failure-v1'), engineeringAcceptance: z.literal('FAIL'),
        reason: z.string().regex(/^[a-z][a-z0-9_]{1,80}$/), productionActivation: z.literal(false) }).strict()
        .parse({ schema: 'official-truth-integrated-pilot-failure-v1', engineeringAcceptance: 'FAIL', reason, productionActivation: false })
      writeFileSync(resolve(output, 'developer-report.json'), JSON.stringify(failed, null, 2) + '\n')
      writeFileSync(resolve(output, 'developer-report.txt'), `LOCAL_ENGINEERING_COMMAND_FAIL: ${reason}\n`)
      process.stderr.write(`integrated_pilot_conformance_failed: ${reason}\n`); process.exitCode = 1
    })
}
