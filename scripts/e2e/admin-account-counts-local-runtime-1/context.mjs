#!/usr/bin/env node
// Frozen §4 context. Constructed only from completed runtime stages.
// Never serialized. Service-role / DB credentials never enter context.

import { CONTRACT_VERSION } from './constants.mjs'
import { contextAccounts, expectedCounts, prepareCountScenario, setzeRolle, setzeStatus } from './fixtures.mjs'
import { wrapperDropSql, wrapperRestoreSql } from './schema.mjs'
import { newBrowserSession, closeBrowserSession } from './browser-session.mjs'
import { restartOwnedApp } from './app.mjs'

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

  return {
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
      })
      appController.current = next
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
}
