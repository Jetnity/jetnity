#!/usr/bin/env node
// Run-owned Playwright sessions. The browser consumer must not launch
// browsers or inject storageState. Unknown/rejected close stays owned.

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

export async function newBrowserSession({
  viewport,
  privateHome,
  env,
  launchPersistentContext,
  registry,
} = {}) {
  if (!viewport?.width || !viewport?.height) throw new Error('Browser session requires a viewport.')
  if (!privateHome) throw new Error('Browser session requires a run-owned HOME.')
  const profileDir = mkdtempSync(join(privateHome, 'browser-'))
  const factory = launchPersistentContext || defaultLaunch
  const context = await factory({
    profileDir,
    viewport,
    env,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
  const handle = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, context, profileDir }
  registry.set(handle.id, handle)
  return Object.assign(context, { __runtimeSessionId: handle.id })
}

export async function closeBrowserSession(browserContext, { registry, closeTimeoutMs = TIMEOUTS.browserCloseMs } = {}) {
  const id = browserContext?.__runtimeSessionId
  const handle = id ? registry.get(id) : null
  if (!handle) {
    throw Object.assign(new Error('Rejected close of unknown browser session'), { code: 'UNKNOWN_BROWSER_SESSION' })
  }
  const report = await schliesseOwnedBrowser(handle, { closeTimeoutMs })
  if (!report.closed) {
    handle.closeReport = report
    throw Object.assign(new Error(report.error || 'browser close not proved'), { code: 'BROWSER_CLOSE_UNCONFIRMED', report, handle })
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
