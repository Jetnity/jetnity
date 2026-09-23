#!/usr/bin/env node
// Owned-process lifecycle. Pattern reviewed on the accepted HTTP proof:
// wait for the exact child, SIGTERM then SIGKILL, never shell-wide pkill.

import { createServer } from 'node:net'

const CHILD_TERM_TIMEOUT_MS = 1_500
const CHILD_KILL_TIMEOUT_MS = 800

export function waitForOwnedChildExit(child, { timeoutMs = CHILD_TERM_TIMEOUT_MS } = {}) {
  return new Promise((resolve) => {
    let settled = false
    let timer = null
    let onExit = null
    let onError = null

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

    const ended = () => ({
      started: Boolean(child.pid),
      exited: true,
      neverStarted: !child.pid && child.exitCode == null && child.signalCode == null,
      timedOut: false,
      exitCode: child.exitCode,
      signal: child.signalCode,
      pid: child.pid ?? null,
    })

    if (child.killed || child.exitCode != null || child.signalCode != null) {
      finish(ended())
      return
    }

    onExit = () => finish(ended())
    onError = () => finish({ ...ended(), error: true })
    child.once('exit', onExit)
    child.once('error', onError)
    timer = setTimeout(() => {
      finish({
        started: Boolean(child.pid),
        exited: false,
        neverStarted: false,
        timedOut: true,
        exitCode: child.exitCode,
        signal: child.signalCode,
        pid: child.pid ?? null,
      })
    }, timeoutMs)
  })
}

export async function stoppeOwnedChild(child, { termTimeoutMs = CHILD_TERM_TIMEOUT_MS, killTimeoutMs = CHILD_KILL_TIMEOUT_MS } = {}) {
  const report = {
    started: Boolean(child?.pid),
    pid: child?.pid ?? null,
    termSent: false,
    killSent: false,
    reaped: false,
    neverStarted: !child,
  }
  if (!child) {
    report.reaped = true
    report.neverStarted = true
    return report
  }
  if (child.exitCode != null || child.signalCode != null) {
    report.reaped = true
    return report
  }
  const first = await waitForOwnedChildExit(child, { timeoutMs: 20 })
  if (first.exited) {
    report.reaped = true
    return report
  }
  try {
    child.kill('SIGTERM')
    report.termSent = true
  } catch {
    report.reaped = true
    return report
  }
  const afterTerm = await waitForOwnedChildExit(child, { timeoutMs: termTimeoutMs })
  if (afterTerm.exited) {
    report.reaped = true
    return report
  }
  try {
    child.kill('SIGKILL')
    report.killSent = true
  } catch {
    report.reaped = true
    return report
  }
  const afterKill = await waitForOwnedChildExit(child, { timeoutMs: killTimeoutMs })
  report.reaped = afterKill.exited === true
  return report
}

export function darfOwnedVerzeichnisEntfernen({ processesStopped, reaped, neverStarted }) {
  return (processesStopped === true && reaped === true) || neverStarted === true
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
