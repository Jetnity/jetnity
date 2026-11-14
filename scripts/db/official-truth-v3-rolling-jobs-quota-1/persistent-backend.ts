// Owned, socket-free PG17 proof backend. Only the process is reused: every call
// retains its original SQL and ends with the old backend-exit's transaction and
// session cleanup. No runtime SQL, method deadline or admission limit changes.
import assert from 'node:assert/strict'
import { execFileSync, spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { assertLocalProofEnvironment, findLocalPgBins } from '../official-truth-integrated-pilot-1/local-cluster'
import { wire } from './local-proof'

const outputLimit = 6 * 1024 * 1024
const callMilliseconds = 90000
const errorLines = (text: string) => text.split('\n').filter(line => /\b(?:ERROR|FATAL|PANIC):/.test(line))
type ActiveCall = {
  marker: string
  context: string
  expected?: RegExp
  stdout: string
  stderr: string
  timer: ReturnType<typeof setTimeout>
  resolve(value: string): void
  reject(error: Error): void
}

export class OwnedPersistentProof {
  private readonly root: string
  private readonly backend: ChildProcessWithoutNullStreams
  private readonly closed: Promise<void>
  private readonly signal?: AbortSignal
  private active: ActiveCall | undefined
  private queue: Promise<void> = Promise.resolve()
  private idle = { stdout: '', stderr: '' }
  private stopping = false
  private exited = false
  private stopReason: Error | undefined
  private cleanupError: Error | undefined
  private killTimer: ReturnType<typeof setTimeout> | undefined
  private readonly abort = () => this.stop(new Error('owned PG17 proof aborted'))
  private readonly parentExit = () => { if (!this.exited) this.backend.kill('SIGKILL') }

  constructor(signal?: AbortSignal) {
    assertLocalProofEnvironment()
    if (signal?.aborted) throw new Error('owned PG17 proof aborted before initialization')
    const bins = findLocalPgBins()
    assert.ok(bins, 'PostgreSQL 17 is required, never a fake pass')
    const env = { ...process.env }
    for (const key of Object.keys(env)) if (/^(PG|PSQL)/.test(key)) delete env[key]
    assert.match(execFileSync(bins.postgres, ['--version'], { encoding: 'utf8', env, timeout: 5000 }), /PostgreSQL\) 17\./)
    this.root = mkdtempSync(join(tmpdir(), 'jetnity-rolling-persistent-'))
    const data = join(this.root, 'data')
    try {
      execFileSync(bins.initdb, ['-D', data, '--no-locale', '--encoding=UTF8', '--auth-local=reject', '--auth-host=reject',
        '--username', 'ot_pilot_owner', '--no-sync'], { encoding: 'utf8', env, stdio: 'pipe', timeout: 60000 })
      this.backend = spawn(bins.postgres, ['--single', '-D', data, '-j', '-c', 'exit_on_error=off',
        '-c', 'log_min_error_statement=panic', '-c', 'statement_timeout=25000', '-c', 'timezone=UTC', 'postgres'],
      { env, stdio: 'pipe' })
    } catch (error) {
      rmSync(this.root, { recursive: true, force: true })
      throw error
    }
    this.signal = signal
    this.closed = new Promise(resolve => {
      this.backend.once('close', (code, exitSignal) => {
        const requestedStop = this.stopping
        this.exited = true
        this.stopping = true
        if (!this.stopReason && (!requestedStop || code !== 0 || exitSignal)) {
          this.stopReason = new Error(`owned PG17 backend exited unexpectedly (code=${code}, signal=${exitSignal})`)
        }
        if (this.killTimer) clearTimeout(this.killTimer)
        this.signal?.removeEventListener('abort', this.abort)
        process.removeListener('exit', this.parentExit)
        // ChildProcess close follows exit and closure of all three stdio pipes.
        // Do not remove a live backend's data directory, even after a timeout.
        try { rmSync(this.root, { recursive: true, force: true }) }
        catch (error) { this.cleanupError = error instanceof Error ? error : new Error(String(error)) }
        const pending = this.active
        this.active = undefined
        if (pending) {
          clearTimeout(pending.timer)
          pending.reject(this.failure(pending, this.stopReason?.message
            ?? `backend closed before both completion markers (code=${code}, signal=${exitSignal})`))
        }
        resolve()
      })
    })
    this.backend.stdout.setEncoding('utf8')
    this.backend.stderr.setEncoding('utf8')
    this.backend.stdout.on('data', (chunk: string) => this.receive('stdout', chunk))
    this.backend.stderr.on('data', (chunk: string) => this.receive('stderr', chunk))
    this.backend.once('error', error => this.stop(error))
    for (const stream of [this.backend.stdin, this.backend.stdout, this.backend.stderr]) {
      stream.on('error', error => { if (!this.stopping) this.stop(error) })
    }
    process.once('exit', this.parentExit)
    signal?.addEventListener('abort', this.abort, { once: true })
    if (signal?.aborted) this.abort()
  }

  run(sql: string, context = 'native rolling proof', expected?: RegExp): Promise<string> {
    const result = this.queue.then(() => this.execute(sql, context, expected))
    this.queue = result.then(() => undefined, () => undefined)
    return result
  }

  async value<T>(expression: string, prefix = '', suffix = ''): Promise<T> {
    const out = await this.run(prefix + '\nDO $value$ BEGIN RAISE WARNING \'ROLLING_VALUE %\',('
      + expression + ')::jsonb; END $value$;\n' + suffix)
    const matches = [...out.matchAll(/WARNING:\s+ROLLING_VALUE ([^\r\n]+)/g)]
    assert.equal(matches.length, 1, 'one actual native value')
    return JSON.parse(matches[0][1]) as T
  }

  async close(): Promise<void> {
    if (!this.stopping && !this.exited) {
      if (this.active) this.stop(new Error('owned PG17 proof closed during a call'))
      else {
        this.stopping = true
        this.backend.stdin.end()
        this.armKill()
      }
    }
    await this.closed
    if (this.cleanupError) throw this.cleanupError
    if (this.stopReason) throw this.stopReason
    const unassigned = errorLines(this.idle.stdout + '\n' + this.idle.stderr)
    if (unassigned.length) throw new Error('unassigned native PG17 errors at close:\n' + unassigned.join('\n'))
  }

  private execute(sql: string, context: string, expected?: RegExp): Promise<string> {
    if (this.stopping || this.exited) return Promise.reject(this.stopReason ?? new Error('owned PG17 proof is closed'))
    assert.equal(this.active, undefined, 'native calls are serialized')
    const original = wire(sql)
    const marker = 'ROLLING_COMPLETE_' + randomBytes(24).toString('hex')
    // An error inside BEGIN prevents every ordinary DO/SELECT until ROLLBACK.
    // Single-user mode starts with an empty session_authorization GUC; RESET
    // alone leaves its last role active. Restore the explicit initdb identity,
    // then role/GUCs, without DISCARD PLANS.
    // These two output barriers carry one per-call nonce. Waiting for both
    // pipes avoids treating a fast stdout chunk as proof that stderr drained.
    const finish = 'ROLLBACK;\n\nSET SESSION AUTHORIZATION ot_pilot_owner;\n\nRESET ROLE;\n\nRESET ALL;\n\n'
      + "DO $completion$ BEGIN RAISE WARNING '" + marker + "'; END $completion$;\n\n"
      + "SELECT '" + marker + "'::text AS proof_completion;\n\n"
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => this.stop(new Error(context + ': native call timed out')), callMilliseconds)
      this.active = { marker, context, expected, ...this.idle, timer, resolve, reject }
      this.idle = { stdout: '', stderr: '' }
      this.backend.stdin.write(original + finish, error => { if (error && !this.stopping) this.stop(error) })
    })
  }

  private receive(channel: 'stdout' | 'stderr', chunk: string): void {
    const target = this.active ?? this.idle
    target[channel] += chunk
    if (Buffer.byteLength(target.stdout) + Buffer.byteLength(target.stderr) > outputLimit) {
      this.stop(new Error('owned PG17 output exceeded the existing 6 MiB cap'))
      return
    }
    const pending = this.active
    if (!pending || this.stopping) return
    if (!pending.stdout.includes(pending.marker)
      || !new RegExp('WARNING:\\s+' + pending.marker + '(?:\\r?\\n|$)').test(pending.stderr)) return
    clearTimeout(pending.timer)
    this.active = undefined
    const output = pending.stdout + '\n' + pending.stderr
    const errors = errorLines(output)
    if (errors.some(line => /\b(?:FATAL|PANIC):/.test(line))) {
      const error = this.failure(pending, 'fatal native error')
      pending.reject(error)
      this.stop(error)
      return
    }
    if (pending.expected) {
      const expected = new RegExp(pending.expected.source, pending.expected.flags.replace(/[gy]/g, ''))
      if (errors.length === 0 || errors.some(line => !expected.test(line))) {
        pending.reject(this.failure(pending, 'expected native error was missing or an additional error occurred'))
        return
      }
    } else if (errors.length > 0) {
      pending.reject(this.failure(pending, 'native SQL error'))
      return
    }
    pending.resolve(output)
  }

  private failure(pending: ActiveCall, reason: string): Error {
    const output = pending.stdout + '\n' + pending.stderr
    return new Error(pending.context + ': ' + reason + '\n' + errorLines(output).join('\n')
      + '\n' + pending.stderr.slice(0, 2500))
  }

  private stop(reason: Error): void {
    if (!this.stopReason) this.stopReason = reason
    if (this.exited || this.stopping) return
    this.stopping = true
    if (this.active) clearTimeout(this.active.timer)
    this.backend.stdin.destroy()
    this.backend.kill('SIGTERM')
    this.armKill()
  }

  private armKill(): void {
    this.killTimer = setTimeout(() => { if (!this.exited) this.backend.kill('SIGKILL') }, 2000)
    this.killTimer.unref()
  }
}
