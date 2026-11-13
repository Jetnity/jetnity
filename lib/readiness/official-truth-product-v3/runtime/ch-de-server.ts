// Fixed server composition only. Target, source and method authority remain separate.
import 'server-only'
import { randomBytes } from 'node:crypto'
import { createV3PostgresResultJobs } from '../method/authority-postgres'
import type { Hrs1Facade } from '../result/composition'
import { hrs1Clock } from '../result/contract'
import { selectedAaChDeQualification } from '../source/aa-ch-de-definition'
import { AA_CH_DE_DELIVERY_PRODUCER } from '../source/aa-ch-de-delivery-producer'
import { AA_BERN_CH_DE_REVIEWED_PROGRAM } from '../source/aa-ch-de-reviewed-program'
import { V3_NODE_POSTGRES_EXECUTORS } from '../transport/node-postgres-executors'
import { selectedV3PgTarget } from '../transport/node-postgres-selection'

let bound: Hrs1Facade | null = null

/** Both existing code-owned selectors must select the reviewed installation.
 * The one retained facade owns its existing lanes, deadlines and permanent
 * transport block. No request, retry or health check can recreate that facade. */
export function officialTruthV3ChDeRuntime(): Hrs1Facade | null {
  const selected = selectedAaChDeQualification()
  if (selected !== AA_BERN_CH_DE_REVIEWED_PROGRAM || selectedV3PgTarget() === null) return null
  if (bound) return bound
  const program = AA_BERN_CH_DE_REVIEWED_PROGRAM
  const binding = program.binding
  bound = createV3PostgresResultJobs({
    binding: { methodId: binding.methodId, revision: binding.revision,
      methodDigest: binding.methodDigest, packageDigest: binding.packageDigest },
    registry: program.registry,
    clock() {
      const clock = hrs1Clock(new Date().toISOString(), program.legalTimeZone)
      if (!clock) throw Error('ch_de_runtime_clock_unavailable')
      return clock
    },
    methodExecutor: V3_NODE_POSTGRES_EXECUTORS.method,
    intakeExecutor: V3_NODE_POSTGRES_EXECUTORS.intake,
    jobsExecutor: V3_NODE_POSTGRES_EXECUTORS.jobs,
    producer: AA_CH_DE_DELIVERY_PRODUCER,
    result: {
      binding,
      writerExecutor: V3_NODE_POSTGRES_EXECUTORS.writer,
      readerExecutor: V3_NODE_POSTGRES_EXECUTORS.reader,
      verifierExecutor: V3_NODE_POSTGRES_EXECUTORS.verifier,
      // Called only at the existing idempotent HRS/queue operation entrances.
      ids: () => Object.freeze({ jobId: 'job3_' + randomBytes(16).toString('hex'),
        operationId: 'op3_' + randomBytes(16).toString('hex') }),
    },
  })
  return bound
}
