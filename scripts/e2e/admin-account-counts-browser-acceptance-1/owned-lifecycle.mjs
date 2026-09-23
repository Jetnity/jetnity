#!/usr/bin/env node
// Owned-process lifecycle. Reviewed HTTP-proof pattern: wait for the exact
// child, bounded SIGTERM then SIGKILL, never treat child.killed as exit,
// never treat a thrown signal as reaped. No shell-wide pkill.

import { existsSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { BROWSER_CLOSE_TIMEOUT_MS } from './constants.mjs'

function withTimeout(promise, timeoutMs, label) {
  let timer = null
  return Promise.race([
    Promise.resolve(promise).finally(() => {
      if (timer != null) clearTimeout(timer)
    }),
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(Object.assign(new Error(label), { code: 'CLOSE_TIMEOUT' }))
      }, timeoutMs)
    }),
  ])
}

const CHILD_TERM_TIMEOUT_MS = 1_500
const CHILD_KILL_TIMEOUT_MS = 800

export function istPidLebendig(pid) {
  if (pid == null || pid === 0) return false
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function hatExitbeweis(child, wait) {
  if (wait?.neverStarted === true) return true
  if (child && (child.exitCode != null || child.signalCode != null)) return true
  if (wait?.exited === true && (wait.exitCode != null || wait.signal != null || wait.neverStarted === true)) {
    return true
  }
  return false
}

export function waitForOwnedChildExit(child, { timeoutMs = CHILD_TERM_TIMEOUT_MS } = {}) {
  return new Promise((resolve) => {
    let settled = false
    let timer = null
    let onExit = null
    let onError = null
    let recordedError = null

    const detach = () => {
      if (child && onExit) child.off('exit', onExit)
      if (child && onError) child.off('error', onError)
      if (timer != null) {
        clearTimeout(timer)
        timer = null
      }
    }

    const finish = (result) => {
      if (settled) return
      settled = true
      detach()
      resolve(result)
    }

    if (!child) {
      finish({
        started: false,
        exited: true,
        neverStarted: true,
        timedOut: false,
        exitCode: null,
        signal: null,
        pid: null,
      })
      return
    }

    const endedResult = () => ({
      started: Boolean(child.pid),
      exited: true,
      neverStarted: !child.pid && child.exitCode == null && child.signalCode == null,
      timedOut: false,
      exitCode: child.exitCode,
      signal: child.signalCode,
      pid: child.pid ?? null,
      ...(recordedError ? { error: recordedError } : {}),
    })

    // child.killed means a signal was sent, not that the process terminated.
    if (child.exitCode != null || child.signalCode != null) {
      finish(endedResult())
      return
    }

    onExit = (code, signal) => {
      finish({
        started: Boolean(child.pid),
        exited: true,
        neverStarted: !child.pid,
        timedOut: false,
        exitCode: code,
        signal,
        pid: child.pid ?? null,
        ...(recordedError ? { error: recordedError } : {}),
      })
    }
    onError = (fehler) => {
      recordedError = fehler instanceof Error ? fehler.message : String(fehler)
      if (child.exitCode != null || child.signalCode != null) {
        finish(endedResult())
        return
      }
      if (!child.pid) {
        finish({
          started: false,
          exited: true,
          neverStarted: true,
          timedOut: false,
          error: recordedError,
          exitCode: null,
          signal: null,
          pid: null,
        })
      }
      // After-spawn error is not termination.
    }
    child.once('exit', onExit)
    child.once('error', onError)
    if (child.exitCode != null || child.signalCode != null) {
      finish(endedResult())
      return
    }
    timer = setTimeout(() => {
      finish({
        started: Boolean(child.pid),
        exited: false,
        neverStarted: false,
        timedOut: true,
        exitCode: child.exitCode,
        signal: child.signalCode,
        pid: child.pid ?? null,
        ...(recordedError ? { error: recordedError } : {}),
      })
    }, timeoutMs)
  })
}

function applyOwnedStopOutcome(report, child, wait) {
  const confirmed = hatExitbeweis(child, wait)
  const stillAlive = Boolean(child?.pid) && istPidLebendig(child.pid)
  report.neverStarted = wait?.neverStarted === true || report.neverStarted
  report.timedOut = wait?.timedOut === true
  report.exitCode = wait?.exitCode ?? child?.exitCode ?? null
  report.signal = wait?.signal ?? child?.signalCode ?? null
  if (wait?.error) report.signalError = wait.error
  report.reaped = confirmed && !stillAlive
  report.ownershipRetained = !report.reaped && Boolean(child)
  report.unknown = !report.reaped && !report.neverStarted && !stillAlive && !confirmed
  if (stillAlive) {
    report.error = report.error || 'owned child still running after stop wait'
  } else if (!report.reaped && !report.neverStarted) {
    report.error = report.error || 'owned child termination unconfirmed'
  }
  return report.reaped
}

export async function stoppeOwnedChild(child, { termTimeoutMs = CHILD_TERM_TIMEOUT_MS, killTimeoutMs = CHILD_KILL_TIMEOUT_MS } = {}) {
  const report = {
    started: Boolean(child?.pid),
    pid: child?.pid ?? null,
    termSent: false,
    killSent: false,
    reaped: false,
    neverStarted: !child,
    ownershipRetained: Boolean(child),
    unknown: false,
    exitCode: child?.exitCode ?? null,
    signal: child?.signalCode ?? null,
    error: null,
  }
  if (!child) {
    report.reaped = true
    report.neverStarted = true
    report.ownershipRetained = false
    return report
  }
  if (child.exitCode != null || child.signalCode != null) {
    report.reaped = true
    report.ownershipRetained = false
    report.exitCode = child.exitCode
    report.signal = child.signalCode
    return report
  }
  if (!child.pid) {
    const wait = await waitForOwnedChildExit(child, { timeoutMs: termTimeoutMs })
    applyOwnedStopOutcome(report, child, wait)
    return report
  }

  const termWait = waitForOwnedChildExit(child, { timeoutMs: termTimeoutMs })
  try {
    child.kill('SIGTERM')
    report.termSent = true
  } catch (fehler) {
    report.error = fehler instanceof Error ? fehler.message : String(fehler)
    report.signalError = report.error
  }
  let wait = await termWait
  if (!hatExitbeweis(child, wait) && istPidLebendig(child.pid)) {
    const killWait = waitForOwnedChildExit(child, { timeoutMs: killTimeoutMs })
    try {
      child.kill('SIGKILL')
      report.killSent = true
    } catch (fehler) {
      report.error = report.error || (fehler instanceof Error ? fehler.message : String(fehler))
      report.signalError = report.error
    }
    wait = await killWait
  }
  applyOwnedStopOutcome(report, child, wait)
  return report
}

export function darfOwnedVerzeichnisEntfernen({
  processesStopped,
  reaped,
  neverStarted,
  unknown,
  ownershipRetained,
  dockerServicesUnverified,
} = {}) {
  if (unknown === true || ownershipRetained === true || dockerServicesUnverified === true) return false
  if (neverStarted === true) return true
  return processesStopped === true && reaped === true
}

export async function schliesseOwnedBrowser(handle = {}, { closeTimeoutMs = BROWSER_CLOSE_TIMEOUT_MS } = {}) {
  const report = {
    closeCalled: false,
    closed: false,
    profileRemoved: false,
    timedOut: false,
    unknown: false,
    ownershipRetained: false,
    error: null,
  }
  try {
    if (handle.context && typeof handle.context.close === 'function') {
      report.closeCalled = true
      await withTimeout(handle.context.close(), closeTimeoutMs, 'browser close timed out')
      report.closed = true
    } else if (handle.context) {
      report.error = 'browser context has no close()'
      report.unknown = true
      report.ownershipRetained = true
    } else {
      report.closed = true
    }
  } catch (fehler) {
    report.error = fehler instanceof Error ? fehler.message : String(fehler)
    report.closed = false
    report.timedOut = Boolean(fehler && fehler.code === 'CLOSE_TIMEOUT')
    report.unknown = report.timedOut
    report.ownershipRetained = true
  }
  if (report.closed && handle.profileDir && existsSync(handle.profileDir)) {
    rmSync(handle.profileDir, { recursive: true, force: true })
    report.profileRemoved = !existsSync(handle.profileDir)
  } else if (handle.profileDir && existsSync(handle.profileDir) && !report.closed) {
    report.profileRemoved = false
    report.ownershipRetained = true
    report.error = report.error || 'browser context close not proved; profile retained'
  }
  return report
}

export function findeFreienLoopbackPort() {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.unref()
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : null
      server.close((error) => {
        if (error) reject(error)
        else if (!port) reject(new Error('Kein Loopback-Port'))
        else resolve(port)
      })
    })
  })
}

export function istLoopbackBind(host) {
  return host === '127.0.0.1' || host === 'localhost' || host === '::1' || host === '[::1]'
}
