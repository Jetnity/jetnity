// Opt-in developer entry point. Synthetic conformance never activates a live root.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { PILOT_FAULTS, runSyntheticIntegratedPilot } from './engine'
import { runLocalStorageProof } from '../db/official-truth-integrated-pilot-1/proof'
import { runOfficialSourceQualification } from './official-source'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const stage = z.object({ mode: z.enum(['primary', 'composed']), fault: z.enum(PILOT_FAULTS),
  status: z.literal('blocked'), reason: z.string().regex(/^[a-z_]+$/),
  closureBound: z.object({ limit: z.literal('depth'), observed: z.number().int(), maximum: z.literal(8) }).strict().nullable(),
  stages: z.array(z.string()), trace: z.object({ catalogReads: z.number().int(), originalHttp: z.number().int(), freshHttp: z.number().int(),
    evidenceAcceptances: z.number().int(), proof: z.boolean(), extracted: z.boolean(), actualFactIdentity: z.boolean(),
    receiptProjected: z.boolean(), publicationCount: z.literal(0), storageCalls: z.literal(0) }).strict() }).strict()
const reportSchema = z.object({
  schema: z.literal('official-truth-integrated-pilot-report-v1'),
  classification: z.literal('OFFICIAL_TRUTH_INTEGRATED_DEVELOPMENT_PILOT_1_PARTIAL'),
  implementation: z.literal('PARTIAL'),
  synthetic: z.object({ primary: stage, composed: stage, failurePaths: z.array(stage),
    positiveIntegratedConformance: z.literal('BLOCKED'), privateReceiptProjection: z.literal('VERIFIED'),
    fullReceiptCustodyVerification: z.literal('BLOCKED'), publicationCount: z.literal(0) }).strict(),
  postgres: z.union([z.object({ status: z.literal('PASS'), scope: z.literal('synthetic_storage_structure_only'),
    postgresVersion: z.string(), checks: z.array(z.string()), integratedReceiptRoundtrip: z.literal('NOT_VERIFIED'),
    fullSemanticPublication: z.literal('BLOCKED'), productionActivation: z.literal(false), hostedApply: z.literal(false) }).strict(),
  z.object({ status: z.literal('NOT_VERIFIED'), reason: z.literal('local_postgresql_proof_failed'),
    integratedReceiptRoundtrip: z.literal('NOT_VERIFIED'), fullSemanticPublication: z.literal('BLOCKED') }).strict()]),
  realOfficialSourcePilot: z.enum(['BLOCKED', 'NOT_RUN']), officialSourceEvidence: z.string().nullable(),
  historicalAuditGrantsCurrentAuthority: z.literal(false), sourceCapsuleIsLoadedCodeAttestation: z.literal(false),
  f8: z.literal('CLOSED'), visitorEvaluation: z.literal('NOT_ACTIVATED'), hostedDevelopmentApply: z.literal(false), productionActivation: z.literal(false),
}).strict()

export async function runIntegratedDeveloperProof(runOfficialSource = false) {
  const primary = await runSyntheticIntegratedPilot('primary')
  const composed = await runSyntheticIntegratedPilot('composed')
  const failurePaths = []
  for (const mode of ['primary', 'composed'] as const) {
    for (const fault of PILOT_FAULTS.filter(f => f !== 'none')) failurePaths.push(await runSyntheticIntegratedPilot(mode, fault))
  }
  // A repaired contract must update this expectation; never silently call the old partial report complete.
  for (const result of [primary, composed]) {
    if (result.status !== 'blocked' || result.reason !== 'closure_bound_exceeded'
      || result.closureBound?.observed !== 11 || !result.trace.actualFactIdentity || !result.trace.receiptProjected) throw Error('synthetic_path_regression')
  }
  if (failurePaths.some(result => result.status !== 'blocked' || result.trace.receiptProjected)) throw Error('negative_path_regression')
  let postgres
  try { postgres = await runLocalStorageProof() } catch {
    postgres = { status: 'NOT_VERIFIED', reason: 'local_postgresql_proof_failed', integratedReceiptRoundtrip: 'NOT_VERIFIED', fullSemanticPublication: 'BLOCKED' }
  }
  const official = runOfficialSource ? await runOfficialSourceQualification() : null
  const report = reportSchema.parse({ schema: 'official-truth-integrated-pilot-report-v1',
    classification: 'OFFICIAL_TRUTH_INTEGRATED_DEVELOPMENT_PILOT_1_PARTIAL', implementation: 'PARTIAL',
    synthetic: { primary, composed, failurePaths, positiveIntegratedConformance: 'BLOCKED', privateReceiptProjection: 'VERIFIED',
      fullReceiptCustodyVerification: 'BLOCKED', publicationCount: 0 }, postgres,
    realOfficialSourcePilot: official?.realOfficialSourcePilot ?? 'NOT_RUN',
    officialSourceEvidence: official ? 'docs/evidence/official-truth-integrated-pilot-1/official-source.json' : null,
    historicalAuditGrantsCurrentAuthority: false, sourceCapsuleIsLoadedCodeAttestation: false,
    f8: 'CLOSED', visitorEvaluation: 'NOT_ACTIVATED', hostedDevelopmentApply: false, productionActivation: false })
  const reportText = [report.classification, '',
    'Primary and composed: real canonical extraction and private receipt projection executed.',
    'Full receipt/custody publication: BLOCKED (required graph depth 11; unchanged maximum 8).',
    `Failure paths: ${failurePaths.length} fail closed; publication/storage calls: 0.`,
    `PostgreSQL: ${report.postgres.status}; scope is synthetic structural storage only.`,
    'Integrated semantic receipt PostgreSQL roundtrip: NOT_VERIFIED.',
    `Real official source: ${report.realOfficialSourcePilot}${report.officialSourceEvidence ? `; see ${report.officialSourceEvidence}` : ' (use --run-official-source for the fixed GOV.UK attempt)'}.`,
    'Source capsules archive disk sources; they do not attest the loaded executable.',
    'Historical audit is not current authority. F8 closed; no hosted apply or production activation.',
    '', 'Exit code 2 denotes the expected PARTIAL outcome; 1 denotes an unexpected conformance failure.', ''].join('\n')
  const output = resolve(root, 'docs/evidence/official-truth-integrated-pilot-1')
  mkdirSync(output, { recursive: true })
  writeFileSync(resolve(output, 'developer-report.json'), JSON.stringify(report, null, 2) + '\n')
  writeFileSync(resolve(output, 'developer-report.txt'), reportText)
  return { report, reportText }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.slice(2).some(arg => arg !== '--run-official-source') || process.argv.length > 3) throw Error('unsupported_pilot_argument')
  runIntegratedDeveloperProof(process.argv.includes('--run-official-source')).then(({ reportText }) => {
    process.stdout.write(reportText); process.exitCode = 2
  }).catch(() => { process.stderr.write('integrated_pilot_conformance_failed\n'); process.exitCode = 1 })
}
