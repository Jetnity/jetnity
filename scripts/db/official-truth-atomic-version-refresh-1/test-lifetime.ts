// Native-test ownership only. No runtime/application importer or proof authority.
import { performance } from 'node:perf_hooks'
import { LocalPgConnection } from '../official-truth-integrated-pilot-1/pg-wire'
import type { LocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'

// Teardown only: startup's existing transport fallback is 30s. Closing actual
// transports and stopping owned clusters precede this finite settlement window.
// This never extends a query, authority, scenario or the 1200s parent.
const DRAIN_MS = 35_000
type Stop = () => void

export class OwnedTestLifetime {
  private readonly cancellation = new AbortController()
  readonly signal = this.cancellation.signal
  private readonly clusters = new Set<LocalProofCluster>()
  private readonly knownClusters = new WeakSet<LocalProofCluster>()
  private readonly connections = new Map<LocalPgConnection, { cluster: LocalProofCluster; closed: boolean }>()
  private readonly pending = new Set<Promise<unknown>>()
  private readonly stops: Stop[] = []
  private readonly cleanupErrors: unknown[] = []
  private stopping = false
  private drainUntil: number | undefined
  private teardown: Promise<void> | undefined
  private started = 0
  private settled = 0
  private stoppedClusters = 0
  private readonly parentAbort = () => { this.beginStop() }

  constructor(private readonly parent: AbortSignal) {
    parent.addEventListener('abort', this.parentAbort, { once: true })
    if (parent.aborted) this.beginStop()
  }

  check(): void {
    if (this.parent.aborted) throw this.parent.reason
    if (this.stopping) throw this.signal.reason
    if (this.cleanupErrors.length) throw new AggregateError([...this.cleanupErrors], 'owned_cleanup_prevents_later_work')
  }

  /** Handles rejection immediately without converting it into successful work. */
  track<T>(promise: Promise<T>): Promise<T> {
    this.pending.add(promise); this.started++
    void promise.then(() => { this.pending.delete(promise); this.settled++ }, () => { this.pending.delete(promise); this.settled++ })
    return promise
  }

  run<T>(operation: () => Promise<T>): Promise<T> {
    const pending = (async () => {
      this.check()
      try { const value = await operation(); this.check(); return value }
      catch (error) { this.check(); throw error }
    })()
    return this.track(pending)
  }

  /** Synchronous callbacks release gates/restore hooks before any async drain. */
  onStop(stop: Stop): Stop {
    if (this.stopping) { this.capture(stop); return () => {} }
    this.stops.push(stop)
    return () => { const at = this.stops.indexOf(stop); if (at >= 0) this.stops.splice(at, 1) }
  }

  restore(stop: Stop): Stop {
    let active = true
    let remove: Stop = () => {}
    const restore = () => { if (active) { active = false; remove(); stop() } }
    remove = this.onStop(restore)
    return restore
  }

  startCluster(start: () => LocalProofCluster): LocalProofCluster {
    this.check()
    const cluster = start()
    // startLocalProofCluster is synchronous and already cleans its own failed
    // startup. Registration precedes the first connection/setup await.
    this.clusters.add(cluster)
    this.knownClusters.add(cluster)
    this.check()
    return cluster
  }

  stopCluster(cluster: LocalProofCluster): void {
    if (!this.clusters.delete(cluster)) return
    const errors: unknown[] = []
    for (const [connection, owned] of this.connections) if (owned.cluster === cluster && !owned.closed) {
      try { connection.close() } catch (error) { errors.push(error) }
    }
    try { cluster.stop(); this.stoppedClusters++ } catch (error) { errors.push(error) }
    // Preserve any in-flight primary assertion; dispose() reports these errors
    // together with it, and check() prevents starting a later scenario.
    this.cleanupErrors.push(...errors)
  }

  /** The sole transport wrapper is test-local. It delegates every actual call
   * unchanged; only a stopped parent can prevent a call or its continuation. */
  installConnectOwnership(): Stop {
    const original = LocalPgConnection.connect
    const wrapped: typeof original = (...args) => {
      if (!this.knownClusters.has(args[0])) return original.call(LocalPgConnection, ...args)
      return this.run(async () => {
        // run() registers this acquisition promise before startup can settle.
        const connection = await original.call(LocalPgConnection, ...args)
        const owned = { cluster: args[0], closed: false }
        this.connections.set(connection, owned)
        const close = connection.close.bind(connection)
        connection.close = () => { owned.closed = true; close() }
        if (this.stopping || this.parent.aborted) { connection.close(); this.check() }
        const query = connection.query.bind(connection), commit = connection.commitBefore.bind(connection)
        connection.query = (...parameters) => this.run(() => query(...parameters))
        connection.commitBefore = (...parameters) => this.run(() => commit(...parameters))
        return connection
      })
    }
    LocalPgConnection.connect = wrapped
    return this.restore(() => { LocalPgConnection.connect = original })
  }

  patchConnect(hook: typeof LocalPgConnection.connect): Stop {
    this.check()
    const original = LocalPgConnection.connect
    LocalPgConnection.connect = (...args) => this.run(() => hook.call(LocalPgConnection, ...args))
    return this.restore(() => { LocalPgConnection.connect = original })
  }

  wait(ms: number): Promise<void> {
    return this.run(() => new Promise<void>((resolve, reject) => {
      const abort = () => { clearTimeout(timer); this.signal.removeEventListener('abort', abort); reject(this.signal.reason) }
      const timer = setTimeout(() => { this.signal.removeEventListener('abort', abort); resolve() }, ms)
      this.signal.addEventListener('abort', abort, { once: true })
      if (this.signal.aborted) abort()
    }))
  }

  /** Scenario drains are finite too. The caller first releases its gates and
   * closes its own transports; parent abort independently stops the cluster. */
  async drain<T>(promises: readonly Promise<T>[]): Promise<PromiseSettledResult<T>[]> {
    for (const promise of promises) if (!this.pending.has(promise)) this.track(promise)
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      return await Promise.race([Promise.allSettled(promises), new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => { this.beginStop(); reject(Error('owned_actor_drain_timeout')) },
          this.drainUntil === undefined ? DRAIN_MS : Math.max(0, this.drainUntil - performance.now()))
      })])
    } finally { clearTimeout(timer) }
  }

  private capture(stop: Stop): void { try { stop() } catch (error) { this.cleanupErrors.push(error) } }

  private beginStop(): void {
    if (this.stopping) return
    this.stopping = true
    // Listener must never throw or publish an unhandled async rejection.
    this.capture(() => this.cancellation.abort(this.parent.aborted ? this.parent.reason : Error('owned_test_lifetime_stopped')))
    for (const stop of [...this.stops].reverse()) this.capture(stop)
    this.stops.length = 0
    for (const [connection, owned] of this.connections) if (!owned.closed) this.capture(() => connection.close())
    for (const cluster of [...this.clusters]) this.capture(() => this.stopCluster(cluster))
    this.drainUntil = performance.now() + DRAIN_MS
    this.teardown = this.drainAll()
    void this.teardown.catch(error => { this.cleanupErrors.push(error) })
  }

  private async drainAll(): Promise<void> {
    const until = this.drainUntil!
    while (this.pending.size) {
      let timer: ReturnType<typeof setTimeout> | undefined
      try {
        await Promise.race([Promise.allSettled([...this.pending]), new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => reject(Error('owned_lifetime_drain_timeout')), Math.max(0, until - performance.now()))
        })])
      } finally { clearTimeout(timer) }
      if (this.pending.size && performance.now() >= until) throw Error('owned_lifetime_drain_timeout')
    }
  }

  async dispose(): Promise<Readonly<{ started: number; settled: number; pending: number; connections: number; closed: number; stoppedClusters: number }>> {
    this.beginStop()
    // The listener attached an immediate rejection handler. Await its actual
    // completion here, retaining every cleanup error for the parent finally.
    try { await this.teardown } catch { /* already retained by beginStop */ }
    this.parent.removeEventListener('abort', this.parentAbort)
    if (this.cleanupErrors.length) throw new AggregateError([...this.cleanupErrors], 'owned_lifetime_cleanup_failed')
    return Object.freeze({ started: this.started, settled: this.settled, pending: this.pending.size,
      connections: this.connections.size, closed: [...this.connections.values()].filter(owned => owned.closed).length,
      stoppedClusters: this.stoppedClusters })
  }
}
