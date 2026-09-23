#!/usr/bin/env node
// Run-owned Playwright sessions. Ownership is registered BEFORE launch.
// The acquired Context is recorded BEFORE fallible policy setup.
// Request-event violations are contained on the handle, never thrown.

import { mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { schliesseOwnedBrowser } from '../admin-account-counts-browser-acceptance-1/owned-lifecycle.mjs'
import { TIMEOUTS } from './constants.mjs'

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]'])

export function assertLocalBrowserTraffic(url) {
  const parsed = new URL(url)
  if (!LOCAL_HOSTS.has(parsed.hostname) && parsed.hostname !== '::1') {
    throw new Error(`Browser traffic to ${parsed.hostname} is not local-only`)
  }
  return true
}

export function recordTrafficViolation(handle, error) {
  const message = error instanceof Error ? error.message : String(error)
  if (handle) {
    handle.trafficViolation = message
    handle.unknown = true
    handle.ownershipRetained = true
  }
  return message
}

export async function attachLocalTrafficPolicy(context, handle = null) {
  if (!context || typeof context.route !== 'function') {
    throw new Error('Browser context cannot enforce local-only traffic')
  }
  await context.route('**/*', async (route) => {
    try {
      assertLocalBrowserTraffic(route.request().url())
      await route.continue()
    } catch (error) {
      recordTrafficViolation(handle, error)
      await route.abort('blockedbyclient')
    }
  })
  if (typeof context.on === 'function') {
    context.on('request', (request) => {
      try {
        assertLocalBrowserTraffic(request.url())
      } catch (error) {
        recordTrafficViolation(handle, error)
      }
    })
  }
  return true
}

export function pendingBrowserCloseReport(handle, reason) {
  return {
    closeCalled: false,
    closed: false,
    profileRemoved: false,
    timedOut: false,
    unknown: true,
    ownershipRetained: true,
    error: reason,
    launchPending: handle?.launchPending === true,
  }
}

export async function closeOwnedBrowserHandle(handle, { closeTimeoutMs = TIMEOUTS.browserCloseMs } = {}) {
  if (!handle) {
    return pendingBrowserCloseReport(null, 'missing browser handle')
  }
  if (handle.unknown || handle.trafficViolation) {
    if (handle.context && typeof handle.context.close === 'function') {
      const report = await schliesseOwnedBrowser(handle, { closeTimeoutMs })
      return {
        ...report,
        unknown: true,
        ownershipRetained: true,
        trafficViolation: handle.trafficViolation || null,
      }
    }
    return pendingBrowserCloseReport(handle, handle.trafficViolation || 'browser session is unknown')
  }
  if (handle.launchPending && !handle.context) {
    return pendingBrowserCloseReport(handle, 'pending launch is not harmless absence')
  }
  if (!handle.context) {
    return pendingBrowserCloseReport(handle, 'acquired Context is missing; refuse delete-authorizing close')
  }
  return schliesseOwnedBrowser(handle, { closeTimeoutMs })
}

export async function newBrowserSession({
  viewport,
  privateHome,
  env,
  launchPersistentContext,
  registry,
} = {}) {
  if (!viewport?.width || !viewport?.height) throw new Error('Browser session requires a viewport.')
  if (!privateHome) throw new Error('Browser session requires a run-owned HOME.')
  if (!registry || typeof registry.set !== 'function') {
    throw new Error('Browser session requires the live ownership registry before launch.')
  }
  const profileDir = mkdtempSync(join(privateHome, 'browser-'))
  const handle = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    context: null,
    profileDir,
    launchPending: true,
    acquired: false,
    policyPending: false,
  }
  registry.set(handle.id, handle)
  try {
    const factory = launchPersistentContext || defaultLaunch
    const context = await factory({
      profileDir,
      viewport,
      env,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    })
    handle.context = context
    handle.acquired = true
    handle.launchPending = false
    handle.policyPending = true
    await attachLocalTrafficPolicy(context, handle)
    handle.policyPending = false
    return Object.assign(context, { __runtimeSessionId: handle.id })
  } catch (error) {
    handle.launchError = error instanceof Error ? error.message : String(error)
    throw error
  }
}

export async function closeBrowserSession(browserContext, { registry, closeTimeoutMs = TIMEOUTS.browserCloseMs } = {}) {
  const id = browserContext?.__runtimeSessionId
  const handle = id ? registry.get(id) : null
  if (!handle) {
    throw Object.assign(new Error('Rejected close of unknown browser session'), { code: 'UNKNOWN_BROWSER_SESSION' })
  }
  const report = await closeOwnedBrowserHandle(handle, { closeTimeoutMs })
  handle.closeReport = report
  if (!report.closed || report.unknown === true) {
    throw Object.assign(new Error(report.error || 'browser close not proved'), {
      code: 'BROWSER_CLOSE_UNCONFIRMED',
      report,
      handle,
    })
  }
  registry.delete(id)
  return report
}

async function defaultLaunch({ profileDir, viewport, env, args }) {
  const { chromium } = await import('playwright')
  return chromium.launchPersistentContext(profileDir, {
    channel: 'chrome',
    headless: true,
    viewport,
    args,
    timeout: 15_000,
    env,
  })
}
