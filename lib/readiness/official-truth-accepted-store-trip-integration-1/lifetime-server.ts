import 'server-only'

/** Pinned auth-js 2.71.1 public debug events. Never retain or print arguments:
 * refresh marker strings themselves contain token prefixes. Only fixed
 * categories/counters survive this synchronous nonthrowing observer. */
class AuthWorkObservation {
  private readonly counts = { lock: 0, use: 0, load: 0, refresh: 0, callRefresh: 0, recover: 0, notify: 0 }
  private registered = 0
  private initialCompleted = 0
  private constructorCompleted = false
  private initializationCompleted = false
  private observed = false
  private invalid = false
  private readonly waiters = new Set<() => void>()

  readonly debug = (...args: unknown[]): void => {
    try {
      this.observed = true
      const marker = typeof args[1] === 'string' ? args[1] : ''
      const phase = typeof args[2] === 'string' ? args[2] : ''
      if (marker === '#onAuthStateChange()' && phase === 'registered callback with id') this.registered++
      else if (marker === 'INITIAL_SESSION' && phase === 'callback id') this.initialCompleted++
      else if (marker === '#_initialize()' && phase === 'end') this.initializationCompleted = true
      else {
        const category = marker === '#_acquireLock' ? 'lock' : marker === '#_useSession' ? 'use'
          : marker === '#__loadSession()' ? 'load' : marker.startsWith('#_refreshAccessToken(') ? 'refresh'
          : marker.startsWith('#_callRefreshToken(') ? 'callRefresh' : marker === '#_recoverAndRefresh()' ? 'recover'
          : marker.startsWith('#_notifyAllSubscribers(') ? 'notify' : null
        if (category && (phase === 'begin' || phase === 'end')) {
          this.counts[category] += phase === 'begin' ? 1 : -1
          if (this.counts[category] < 0) this.invalid = true
        }
      }
      if (this.initialCompleted > this.registered) this.invalid = true
      this.wake()
    } catch { this.invalid = true }
  }

  constructionComplete(): void { this.constructorCompleted = true; this.wake() }
  private quiet(): boolean {
    return this.constructorCompleted && (!this.observed || this.initializationCompleted)
      && this.initialCompleted === this.registered && Object.values(this.counts).every(n => n === 0)
  }
  private wake(): void {
    if (!this.quiet()) return
    queueMicrotask(() => {
      if (this.quiet()) { for (const waiter of this.waiters) waiter(); this.waiters.clear() }
    })
  }
  async settled(): Promise<void> {
    if (!this.quiet()) await new Promise<void>(resolve => this.waiters.add(resolve))
    if (this.invalid) throw Error('auth_observation_invalid')
  }
}

/** Own the entire awaited operation, including SDK initialization/retry work.
 * An abort closes starts and positive results; it does not assert rollback or
 * synchronous SDK cancellation. A caller must await settle() in its finally. */
export class AcceptedStoreLifetime {
  readonly signal: AbortSignal
  readonly started = performance.now()
  private readonly controller = new AbortController()
  private readonly pending = new Set<Promise<unknown>>()
  private readonly authWork: AuthWorkObservation[] = []
  private deadline: number
  private timer: ReturnType<typeof setTimeout> | null
  private readonly parent: AbortSignal
  private readonly parentAbort: () => void
  private closed = false

  constructor(parent: AbortSignal, budgetMs: number) {
    if (!Number.isSafeInteger(budgetMs) || budgetMs < 1 || budgetMs > 45_000) throw Error('lifetime_budget_invalid')
    this.parent = parent
    this.deadline = this.started + budgetMs
    this.signal = this.controller.signal
    this.parentAbort = () => this.controller.abort(parent.reason ?? new DOMException('Aborted', 'AbortError'))
    if (parent.aborted) this.parentAbort()
    else parent.addEventListener('abort', this.parentAbort, { once: true })
    this.timer = setTimeout(() => this.controller.abort(new DOMException('Deadline exceeded', 'TimeoutError')), budgetMs)
    this.timer.unref?.()
    scopes.set(this.signal, this)
  }

  remaining(): number { return Math.max(0, this.deadline - performance.now()) }

  /** Installed by the factory before client construction. No response/identity
   * behavior changes; the observer records only lifecycle accounting. */
  observeAuthConstruction(): AuthWorkObservation {
    this.assertCurrent()
    const observer = new AuthWorkObservation()
    this.authWork.push(observer)
    return observer
  }

  assertCurrent(requiredMs = 0): void {
    this.signal.throwIfAborted()
    if (this.closed || !Number.isFinite(requiredMs) || requiredMs < 0 || this.remaining() <= requiredMs) {
      this.controller.abort(new DOMException('Deadline exceeded', 'TimeoutError'))
      this.signal.throwIfAborted()
    }
  }

  /** Anchor at the START of the observed RPC, never the delayed response. */
  pinWindow(rpcStarted: number, databaseNow: string, expiresAt: string): void {
    const budget = Date.parse(expiresAt) - Date.parse(databaseNow)
    if (!Number.isFinite(budget) || budget <= 0 || rpcStarted < this.started || rpcStarted > performance.now()) throw Error('deadline_invalid')
    this.deadline = Math.min(this.deadline, rpcStarted + budget)
    if (this.timer !== null) clearTimeout(this.timer)
    this.timer = setTimeout(() => this.controller.abort(new DOMException('Deadline exceeded', 'TimeoutError')), this.remaining())
    this.timer.unref?.()
    this.assertCurrent()
  }

  /** Called before starting, not after constructing a promise with side effects. */
  async run<T>(start: () => PromiseLike<T>): Promise<T> {
    this.assertCurrent()
    let operation: Promise<T>
    try { operation = Promise.resolve(start()) }
    catch (error) { throw error }
    this.pending.add(operation)
    try { return await operation }
    finally { this.pending.delete(operation) }
  }

  /** Only this implementation supplies fetch. No injected targets/headers/keys
   * are accepted by the session factory's optional lifetime invocation. */
  async fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    this.assertCurrent()
    const signals = [this.signal, input instanceof Request ? input.signal : undefined, init?.signal].filter((v): v is AbortSignal => !!v)
    const signal = AbortSignal.any(signals)
    signal.throwIfAborted()
    return this.run(async () => {
      const response = await globalThis.fetch(input, { ...init, signal, redirect:'error' })
      signal.throwIfAborted()
      if (!response.body) return response
      const reader = response.body.getReader(), chunks: Uint8Array[] = []
      let size = 0, completed = false
      try {
        for (;;) {
          signal.throwIfAborted()
          const part = await reader.read()
          signal.throwIfAborted()
          if (part.done) { completed = true; break }
          size += part.value.byteLength
          if (size > 16_777_216) throw Error('database_response_bound')
          chunks.push(part.value)
        }
      } finally {
        if (!completed) await reader.cancel().catch(() => undefined)
        reader.releaseLock()
      }
      const bytes = new Uint8Array(size)
      let offset = 0
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
      return new Response(bytes, { status: response.status, statusText: response.statusText, headers: response.headers })
    })
  }

  /** No Promise.race/abandoned work and no new SDK barrier call. R3 expressly
   * does not claim a fixed monotonic SDK-return ceiling under wall-clock
   * rollback: all already-started observable bookkeeping is actually awaited. */
  async settle(): Promise<void> {
    this.closed = true
    this.controller.abort(new DOMException('Lifetime closed', 'AbortError'))
    try {
      while (this.pending.size) await Promise.allSettled([...this.pending])
      const observed = await Promise.allSettled(this.authWork.map(work => work.settled()))
      while (this.pending.size) await Promise.allSettled([...this.pending])
      if (observed.some(result => result.status === 'rejected')) throw Error('auth_lifetime_observation_invalid')
    } finally {
      if (this.timer !== null) { clearTimeout(this.timer); this.timer = null }
      this.parent.removeEventListener('abort', this.parentAbort)
    }
  }
}

const scopes = new WeakMap<AbortSignal, AcceptedStoreLifetime>()

/** Only package-created opaque registrations opt in. Arbitrary legacy signals
 * do not alter existing session/client construction or authentication. */
export function serverClientLifetime(signal: AbortSignal): AcceptedStoreLifetime | null {
  return scopes.get(signal) ?? null
}
