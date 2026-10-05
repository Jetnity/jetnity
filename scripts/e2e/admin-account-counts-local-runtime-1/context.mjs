#!/usr/bin/env node
// Frozen §4 context. Constructed only from completed runtime stages.
// Never serialized. Service-role / DB credentials never enter context.
// evidenceDir and every §4 field are validated before the object is returned.

import { existsSync } from 'node:fs'
import { CONTRACT_VERSION } from './constants.mjs'
import { contextAccounts, expectedCounts, prepareCountScenario, setzeRolle, setzeStatus } from './fixtures.mjs'
import { wrapperDropSql, wrapperRestoreSql } from './schema.mjs'
import { newBrowserSession, closeBrowserSession } from './browser-session.mjs'
import { restartOwnedApp } from './app.mjs'
import { syncAppOwnership } from './ownership.mjs'

const ACTORS = ['owner', 'moderator', 'ordinary', 'creator']

export function validateAcceptanceContext(context) {
  if (!context) throw new Error('§4 context is missing')
  if (context.contractVersion !== CONTRACT_VERSION) {
    throw new Error(`§4 contractVersion must be ${CONTRACT_VERSION}`)
  }
  for (const field of ['runId', 'productHead', 'timeoutMs']) {
    if (context[field] == null || context[field] === '') {
      throw new Error(`§4 field ${field} must be initialized`)
    }
  }
  if (!context.signal || typeof context.signal.aborted !== 'boolean') {
    throw new Error('§4 signal must be an AbortSignal')
  }
  if (!context.evidenceDir || !String(context.evidenceDir).trim()) {
    throw new Error('§4 evidenceDir must be a nonempty private directory')
  }
  if (!existsSync(context.evidenceDir)) {
    throw new Error('§4 evidenceDir does not exist')
  }
  if (!context.localApi?.origin || !context.localApi?.anonKey) {
    throw new Error('§4 localApi.origin and localApi.anonKey are required')
  }
  if (!/^https?:\/\/127\.0\.0\.1(?::\d+)?$/.test(context.localApi.origin)) {
    throw new Error('§4 localApi.origin must be a numeric loopback origin')
  }
  if (context.localApi.serviceRole || context.localApi.dbUrl) {
    throw new Error('Context must not receive service-role or database credentials.')
  }
  for (const key of ACTORS) {
    const actor = context.accounts?.[key]
    if (!actor?.id || !actor.email || !actor.password) {
      throw new Error(`§4 accounts.${key} must include id, email and password`)
    }
  }
  for (const fn of ['useApp', 'newBrowserSession', 'closeBrowserSession']) {
    if (typeof context[fn] !== 'function') throw new Error(`§4 ${fn} must be a function`)
  }
  for (const fn of ['setStatus', 'setRole', 'prepareCountScenario', 'expectedCounts', 'setWrapperPresent']) {
    if (typeof context.fixture?.[fn] !== 'function') throw new Error(`§4 fixture.${fn} must be a function`)
  }
  if (typeof context.rpcObserver?.mark !== 'function' || typeof context.rpcObserver?.since !== 'function') {
    throw new Error('§4 rpcObserver.mark/since must be functions')
  }
  return true
}

export function baueAcceptanceContext({
  runId,
  productHead,
  signal,
  timeoutMs,
  accounts,
  localApi,
  appController,
  observer,
  fixtureDb,
  evidenceDir,
  browserRegistry,
  launchPersistentContext,
  privateHome,
  childEnv,
} = {}) {
  if (localApi?.serviceRole || localApi?.dbUrl || localApi?.managementToken) {
    throw new Error('Context must not receive service-role, database or management credentials.')
  }
  if (!/^https?:\/\/127\.0\.0\.1(?::\d+)?$/.test(String(localApi?.origin || ''))) {
    throw new Error('localApi.origin must be a numeric loopback origin.')
  }
  if (!evidenceDir || !String(evidenceDir).trim()) {
    throw new Error('§4 evidenceDir must be a nonempty private directory')
  }
  if (!existsSync(evidenceDir)) {
    throw new Error('§4 evidenceDir does not exist')
  }

  const context = {
    contractVersion: CONTRACT_VERSION,
    runId,
    productHead,
    signal,
    timeoutMs,
    accounts: contextAccounts(accounts),
    localApi: { origin: localApi.origin, anonKey: localApi.anonKey },
    async useApp({ countsEnabled }) {
      const next = await restartOwnedApp(appController.current, {
        ...appController.options,
        countsEnabled: countsEnabled === true,
        clearRuntimeState: true,
        registry: appController.registry,
        owned: appController.owned,
      })
      appController.current = next
      syncAppOwnership(appController.registry, next)
      if (appController.owned) appController.owned.appChild = next.child
      return { origin: next.origin }
    },
    async newBrowserSession({ viewport }) {
      return newBrowserSession({
        viewport,
        privateHome,
        env: childEnv,
        launchPersistentContext,
        registry: browserRegistry,
      })
    },
    async closeBrowserSession(browserContext) {
      return closeBrowserSession(browserContext, { registry: browserRegistry })
    },
    fixture: {
      async setStatus(actorKey, status) {
        await setzeStatus(accounts, actorKey, status, {
          mutateProfile: fixtureDb.mutateProfile,
          verify: fixtureDb.verifyProfile,
        })
      },
      async setRole(actorKey, role) {
        await setzeRolle(accounts, actorKey, role, {
          mutateProfile: fixtureDb.mutateProfile,
          verify: fixtureDb.verifyProfile,
        })
      },
      async prepareCountScenario(name) {
        const result = await prepareCountScenario(name, {
          accounts,
          extra: fixtureDb.extra,
          createExtra: fixtureDb.createExtra,
          adjustCreatedAt: fixtureDb.adjustCreatedAt,
        })
        if (result.extraId) fixtureDb.extra = { id: result.extraId }
        return result
      },
      async expectedCounts() {
        return expectedCounts({ query: fixtureDb.independentCount })
      },
      async setWrapperPresent(present) {
        if (present) await fixtureDb.applySql(wrapperRestoreSql())
        else await fixtureDb.applySql(wrapperDropSql())
      },
    },
    rpcObserver: {
      mark: () => observer.mark(),
      since: (mark) => observer.since(mark),
    },
    evidenceDir,
  }
  validateAcceptanceContext(context)
  return context
}
