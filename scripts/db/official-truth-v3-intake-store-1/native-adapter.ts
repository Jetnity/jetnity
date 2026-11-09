// TEST-ONLY owned native transport. Runtime has no import of this file.
import assert from 'node:assert/strict'
import type { LocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection, LocalPgError, pgText, type PgRows } from '../official-truth-integrated-pilot-1/pg-wire'
import type { V3IntakeSqlExecutor } from '../../../lib/readiness/official-truth-product-v3/storage/quarantine-postgres'

type Hook = (statement: string, connection: LocalPgConnection, rows: PgRows) => Promise<void> | void
export type NativeAdapterOptions = Readonly<{
  beforeQuery?: Hook; afterQuery?: Hook; beforeCommit?: Hook; loseAcknowledgement?: (statement: string) => boolean;
}>
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

/** Every call owns a fresh transaction and control connection. No detached race. */
export function nativeExecutor(cluster: LocalProofCluster, options: NativeAdapterOptions = {}) {
  const evidence = { dispatched: 0, acknowledged: 0, rolledBack: 0, aborted: 0, drained: 0, pids: [] as string[], sqlCodes: [] as string[] }
  const executor: V3IntakeSqlExecutor = {
    async execute(statement, parameters, signal) {
      if (signal.aborted) return { status: 'unavailable' }
      let connection: LocalPgConnection | undefined, control: LocalPgConnection | undefined
      let identity: Readonly<Record<string, string | null>> | undefined, cancellation: Promise<void> | undefined
      let began = false, dispatched = false, committed = false
      const abort = () => {
        if (!identity?.pid || !identity.birth || !control || cancellation) return
        evidence.aborted++
        cancellation = control.query(
          'SELECT pg_catalog.pg_terminate_backend(a.pid,1000)::text AS terminated FROM pg_catalog.pg_stat_get_activity($1::integer) a WHERE a.backend_start=$2::timestamptz',
          [pgText(identity.pid, 23), pgText(identity.birth)]).then(rows => {
          assert.ok(rows.every(row => row.terminated === 'true'), 'owned abort must terminate its exact backend')
        })
        // Handle immediately; finally joins and propagates cleanup failures.
        void cancellation.catch(() => {})
      }
      try {
        control = await LocalPgConnection.connect(cluster)
        connection = await LocalPgConnection.connect(cluster, 'ot_s1_test_runner')
        identity = (await connection.query('SELECT pg_backend_pid()::text AS pid,backend_start::text AS birth FROM pg_stat_activity WHERE pid=pg_backend_pid()'))[0]
        assert.ok(identity?.pid && identity.birth); evidence.pids.push(identity.pid)
        signal.addEventListener('abort', abort, { once: true })
        if (signal.aborted) { abort(); return { status: 'unavailable' } }
        await connection.query('BEGIN ISOLATION LEVEL READ COMMITTED'); began = true
        await options.beforeQuery?.(statement, connection, [])
        if (signal.aborted) return { status: 'unconfirmed' }
        dispatched = true; evidence.dispatched++
        const rows = await connection.query(statement, parameters.map(value => pgText(String(value), typeof value === 'number' ? 23 : 25)))
        await options.afterQuery?.(statement, connection, rows)
        if (signal.aborted) return { status: 'unconfirmed' }
        await options.beforeCommit?.(statement, connection, rows)
        if (signal.aborted) return { status: 'unconfirmed' }
        await connection.query('COMMIT')
        committed = connection.operationDiagnostics.some(item => item.phase === 'commit' && item.commitAcknowledged === true)
        assert.equal(committed, true, 'query rows are not a COMMIT acknowledgement')
        evidence.acknowledged++
        if (signal.aborted || options.loseAcknowledgement?.(statement)) return { status: 'unconfirmed' }
        return { status: 'acknowledged', rows }
      } catch (error) {
        if (error instanceof LocalPgError && /^[0-9A-Z]{5}$/.test(error.code)) evidence.sqlCodes.push(error.code)
        return { status: dispatched ? 'unconfirmed' : 'unavailable' }
      } finally {
        signal.removeEventListener('abort', abort)
        try {
          await cancellation
          if (connection && began && !committed && !cancellation) {
            try { await connection.query('ROLLBACK'); evidence.rolledBack++ } catch { /* disconnect is not rollback proof */ }
          }
        } finally {
          connection?.close()
          try {
            if (control && identity?.pid && identity.birth) {
              let absent = false
              for (let attempt = 0; attempt < 100; attempt++) {
                const active = await control.query('SELECT count(*)::text AS n FROM pg_stat_activity WHERE pid=$1::integer AND backend_start=$2::timestamptz',
                  [pgText(identity.pid, 23), pgText(identity.birth)])
                if (active[0]?.n === '0') { absent = true; break }
                await delay(20)
              }
              assert.equal(absent, true, 'no owned target may outlive its executor call')
              evidence.drained++
            }
          } finally { control?.close() }
        }
      }
    },
  }
  return { executor, evidence }
}
