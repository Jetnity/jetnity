#!/usr/bin/env node
// Controlled-context unit tests. These prove consumer code behavior only.
// They are NOT real UI / Auth / MFA / Admin execution and must not be
// reported as fullLocalExecution or a browser PASS.

import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { COPY, SELECTORS, SOURCE_PATHS } from '../admin-account-counts-browser-acceptance-1/constants.mjs'
import { generateTotp, looksLikeTotpCode } from '../admin-account-counts-browser-acceptance-1/totp.mjs'
import {
  CONTRACT_VERSION,
  FLOW_GATE_IDS,
  PRODUCT_BASELINE,
  ROOT,
  UI_COPY,
  VIEWPORTS,
  WRAPPER_RPC,
} from './constants.mjs'
import {
  ContextContractError,
  assertGateSetComplete,
  emptyGates,
  isNumericLoopbackOrigin,
  rejectRemoteRedirect,
  rejectUnsafeRedirect,
  sameExactOrigin,
  validateContext,
} from './contract.mjs'
import { assertNoCountDisclosure, classifyDenialUi } from './counts.mjs'
import { containedEvidencePath, runScopedName, writeSanitizedReceipt } from './evidence.mjs'
import {
  IMPLEMENTATION,
  runBrowserFlows,
  runG10ExistingFactor,
  runG12ZeroAndDelta,
} from './flows.mjs'
import {
  assertDeniedWrapper,
  assertPermittedWrapper,
  callLocalWrapper,
  isDeniedCallerResponse,
  isPermittedSuccessShape,
  isUnavailableWrapperResponse,
} from './http.mjs'
import { assertNoWrapperCalls, assertObservedWrapper } from './observer.mjs'
import { parseAdminAccountCountsPayload } from './payload.mjs'
import {
  assertSanitized,
  looksSecretBearing,
  redactFreeForm,
  sanitizeReturnedGates,
} from './privacy.mjs'
import {
  beginBrowserSession,
  extractTotpSecret,
  isIntendedAuthResponse,
  isLocalAuthResponse,
  withBrowserSession,
  withFixtureRestore,
} from './session.mjs'
import { detectProductDrift } from './source-pins.mjs'

const BASELINE = PRODUCT_BASELINE
const OWNER = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'owner@aacbf1.invalid',
  password: 'local-fixture-password-owner',
}
const ACCOUNTS = {
  owner: OWNER,
  moderator: {
    id: '22222222-2222-4222-8222-222222222222',
    email: 'moderator@aacbf1.invalid',
    password: 'local-fixture-password-moderator',
  },
  ordinary: {
    id: '33333333-3333-4333-8333-333333333333',
    email: 'ordinary@aacbf1.invalid',
    password: 'local-fixture-password-ordinary',
  },
  creator: {
    id: '44444444-4444-4444-8444-444444444444',
    email: 'creator@aacbf1.invalid',
    password: 'local-fixture-password-creator',
  },
}

const VALID_MEASURED_AT = '2026-09-23T12:00:00Z'
const VALID_WINDOW_START = '2026-08-24T12:00:00Z'

function lese(rel) {
  return readFileSync(join(ROOT, rel), 'utf8')
}

function permittedRow(overrides = {}) {
  return {
    present_registered_accounts: '4',
    created_in_prior_30_days: '0',
    measured_at: VALID_MEASURED_AT,
    window_start: VALID_WINDOW_START,
    definition_version: 'jetnity.admin-account-counts.v1',
    ...overrides,
  }
}

function createLocator(getText, actions = {}, attrs = {}) {
  const locator = {
    waitFor: async () => {
      if (!getText()) throw new Error('locator not visible')
    },
    fill: async (value) => actions.fill?.(value),
    click: async () => actions.click?.(),
    textContent: async () => getText(),
    innerText: async () => getText(),
    count: async () => (getText() ? 1 : 0),
    first: () => createLocator(getText, actions, attrs),
    nth: (index) => createLocator(getText, actions, attrs),
    isVisible: async () => Boolean(getText()),
    getAttribute: async (name) => attrs[name] ?? null,
    screenshot: async ({ path }) => {
      if (path) writeFileSync(path, 'clip')
    },
    locator: () => createLocator(getText, actions, attrs),
  }
  return locator
}

function createScriptedPage(world) {
  const responseListeners = []
  let email = ''
  let password = ''
  let enrollCode = ''
  let stepUpCode = ''

  const makeAuthResponse = (url, payload, method = 'POST', status = 200) => ({
    url: () => url,
    json: async () => payload,
    request: () => ({ method: () => method }),
    status: () => status,
  })

  const emitJson = (url, payload) => {
    const response = makeAuthResponse(url, payload)
    for (const listener of responseListeners) listener(response)
    return response
  }

  const bodyText = () => {
    if (world.url.includes('/admin/login')) {
      if (world.loginError) return `${UI_COPY.login}\n${world.loginError}`
      return UI_COPY.login
    }
    if (world.url.includes('/admin/mfa')) {
      return world.enrolled
        ? `${UI_COPY.stepUp}\n${UI_COPY.stepUpDialogTitle}`
        : `${UI_COPY.stepUp}\n${UI_COPY.noFactor}`
    }
    if (world.url.includes('/account/security')) {
      if (world.enrollSucceeded) return UI_COPY.enrollSuccess
      return world.enrollOpen
        ? 'Authenticator-App (TOTP)\nSchritt 2'
        : 'Authenticator-App einrichten'
    }
    if (world.url.includes('/unauthorized')) return 'unauthorized'
    if (world.url.includes('/admin') && !world.countsEnabled) return 'Operative Lage'
    if (world.url.includes('/admin') && world.status !== 'active') return UI_COPY.forbidden
    if (world.url.includes('/admin') && world.role === 'user') return UI_COPY.forbidden
    if (world.url.includes('/admin') && !world.wrapperPresent) return UI_COPY.unavailable
    if (world.url.includes('/admin') && world.aal >= 2 && world.countsEnabled) {
      return [
        UI_COPY.countsTitle,
        UI_COPY.windowHours,
        UI_COPY.windowExact,
        UI_COPY.measuredLabel,
        UI_COPY.windowStartLabel,
        world.expected.present,
        world.expected.recent,
        world.expected.measuredAt,
        world.expected.windowStart,
      ].join('\n')
    }
    if (world.url.includes('/admin') && world.failedCounts) return UI_COPY.failed
    return ''
  }

  const showCounts = () =>
    world.url.includes('/admin') &&
    !world.url.includes('/login') &&
    !world.url.includes('/mfa') &&
    world.countsEnabled &&
    world.wrapperPresent &&
    world.aal >= 2 &&
    world.role !== 'user' &&
    world.status === 'active' &&
    !world.failedCounts

  const page = {
    goto: async (url) => {
      const next = new URL(url, 'http://127.0.0.1:3000')
      if (next.pathname.startsWith('/admin') && next.pathname !== '/admin/login') {
        if (!world.loggedIn) {
          world.url = 'http://127.0.0.1:3000/admin/login'
          return
        }
        if (world.aal < 2 && next.pathname === '/admin') {
          world.url = 'http://127.0.0.1:3000/admin/mfa'
          return
        }
      }
      world.url = String(url)
      if (showCounts() && world.observeOnAdmin) {
        world.observerCalls.push({
          method: 'POST',
          path: `/rest/v1/rpc/${WRAPPER_RPC}`,
          status: 200,
        })
      }
    },
    reload: async () => page.goto(world.url),
    url: () => world.url,
    waitForURL: async (predicate) => {
      if (typeof predicate === 'function' && !predicate(world.url)) {
        throw new Error(`waitForURL missed ${world.url}`)
      }
    },
    waitForLoadState: async () => {},
    waitForResponse: async (predicate) => {
      const candidates = [
        makeAuthResponse(`${world.localApi}/auth/v1/token`, { access_token: world.accessToken }),
        makeAuthResponse(`${world.localApi}/auth/v1/factors`, { totp: { secret: world.enrollSecret } }),
        makeAuthResponse(`${world.localApi}/auth/v1/factors/1/verify`, { access_token: world.accessToken }),
      ]
      for (const response of candidates) {
        if (typeof predicate !== 'function' || predicate(response)) return response
      }
      throw new Error('auth response predicate rejected')
    },
    on: (event, listener) => {
      if (event === 'response') responseListeners.push(listener)
    },
    off: (event, listener) => {
      if (event === 'response') {
        const index = responseListeners.indexOf(listener)
        if (index >= 0) responseListeners.splice(index, 1)
      }
    },
    setViewportSize: async (viewport) => {
      world.viewport = viewport
    },
    evaluate: async () => ({
      scrollWidth: world.viewport?.width ?? 1280,
      clientWidth: world.viewport?.width ?? 1280,
    }),
    locator: (selector) => {
      if (selector === 'body') return createLocator(bodyText)
      if (selector === SELECTORS.loginForm || selector === SELECTORS.loginEmail) {
        return createLocator(() => 'email', { fill: (value) => { email = value } })
      }
      if (selector === SELECTORS.loginPassword) {
        return createLocator(() => 'password', { fill: (value) => { password = value } })
      }
      if (selector === SELECTORS.loginSubmit) {
        return createLocator(() => 'Anmelden', {
          click: () => {
            const match = Object.values(ACCOUNTS).find((account) => account.email === email && account.password === password)
            if (!match) {
              world.loginError = 'invalid'
              return
            }
            world.loggedIn = match.email
            if (match.email === ACCOUNTS.ordinary.email || match.email === ACCOUNTS.creator.email) {
              world.loginError = UI_COPY.ordinaryDenied
              world.loggedIn = null
              world.url = 'http://127.0.0.1:3000/admin/login'
              return
            }
            world.aal = 1
            world.loginError = null
            world.url = 'http://127.0.0.1:3000/admin/mfa'
            emitJson(`${world.localApi}/auth/v1/token`, { access_token: world.accessToken })
          },
        })
      }
      if (selector === SELECTORS.stepUpTitle) {
        return createLocator(() => (world.url.includes('/admin/mfa') ? UI_COPY.stepUp : UI_COPY.login))
      }
      if (selector === SELECTORS.enrollCode) {
        return createLocator(() => (world.enrollOpen ? 'code' : ''), {
          fill: (value) => { enrollCode = value },
        })
      }
      if (selector === SELECTORS.stepUpCode) {
        return createLocator(() => (world.url.includes('/admin/mfa') && world.enrolled ? 'code' : ''), {
          fill: (value) => { stepUpCode = value },
        })
      }
      if (selector === SELECTORS.countsTitle) {
        return createLocator(() => (showCounts() ? UI_COPY.countsTitle : ''))
      }
      if (selector === '[aria-labelledby="admin-account-counts-present"]') {
        return createLocator(() => (showCounts() ? world.expected.present : ''))
      }
      if (selector === '[aria-labelledby="admin-account-counts-window"]') {
        return createLocator(() => (showCounts() ? world.expected.recent : ''))
      }
      if (selector === '[aria-labelledby="admin-account-counts-titel"]') {
        return createLocator(() => (showCounts() ? bodyText() : ''))
      }
      if (selector === '[aria-labelledby="admin-account-counts-titel"] time') {
        const measured = () => (showCounts() ? world.expected.measuredAt : '')
        const windowStart = () => (showCounts() ? world.expected.windowStart : '')
        const loc = createLocator(measured, {}, { dateTime: world.expected.measuredAt })
        loc.count = async () => (showCounts() ? 2 : 0)
        loc.nth = (index) =>
          createLocator(
            index === 0 ? measured : windowStart,
            {},
            { dateTime: index === 0 ? world.expected.measuredAt : world.expected.windowStart },
          )
        loc.first = () => createLocator(measured, {}, { dateTime: world.expected.measuredAt })
        return loc
      }
      return createLocator(() => '')
    },
    getByRole: (role, options) => {
      if (options?.name === SELECTORS.enrollButtonText) {
        return createLocator(() => 'Authenticator-App einrichten', {
          click: () => {
            world.enrollClicked = true
            world.enrollOpen = true
            emitJson(`${world.localApi}/auth/v1/factors`, { totp: { secret: world.enrollSecret } })
          },
        })
      }
      if (options?.name === UI_COPY.enrollConfirm) {
        return createLocator(() => 'Bestätigen', {
          click: () => {
            if (world.enrollOpen) {
              world.enrolled = true
              world.enrollOpen = false
              world.enrollSucceeded = true
              emitJson(`${world.localApi}/auth/v1/factors/1/verify`, { access_token: world.accessToken })
              return
            }
            if (world.url.includes('/admin/mfa')) {
              world.aal = 2
              world.url = 'http://127.0.0.1:3000/admin'
              emitJson(`${world.localApi}/auth/v1/factors/1/verify`, { access_token: world.accessToken })
            }
            void enrollCode
            void stepUpCode
          },
        })
      }
      if (options?.name === UI_COPY.enrollRetry) {
        return createLocator(() => '')
      }
      return createLocator(() => options?.name ?? role)
    },
    getByText: (text) => createLocator(() => (bodyText().includes(text) ? text : '')),
  }

  return page
}

function createWorld(overrides = {}) {
  return {
    url: 'http://127.0.0.1:3000/admin/login',
    countsEnabled: true,
    wrapperPresent: true,
    role: 'owner',
    status: 'active',
    loggedIn: null,
    aal: 0,
    enrolled: false,
    enrollOpen: false,
    enrollSucceeded: false,
    enrollClicked: false,
    enrollSecret: 'JBSWY3DPEHPK3PXP',
    accessToken: 'local-memory-access-token',
    expected: {
      present: '4',
      recent: '0',
      measuredAt: VALID_MEASURED_AT,
      windowStart: VALID_WINDOW_START,
    },
    observerCalls: [],
    observerComplete: true,
    observeOnAdmin: true,
    viewport: VIEWPORTS.desktop,
    localApi: 'http://127.0.0.1:54321',
    loginError: null,
    failedCounts: false,
    ...overrides,
  }
}

function createContextDouble(t, world = createWorld()) {
  const evidenceDir = mkdtempSync(join(tmpdir(), 'aacbf1-'))
  t.after(() => rmSync(evidenceDir, { recursive: true, force: true }))
  let mark = 0
  const marks = new Map()
  return {
    world,
    evidenceDir,
    context: {
      contractVersion: CONTRACT_VERSION,
      runId: 'unit-double',
      productHead: BASELINE,
      signal: new AbortController().signal,
      timeoutMs: 8_000,
      accounts: ACCOUNTS,
      localApi: { origin: 'http://127.0.0.1:54321', anonKey: 'local-public-anon' },
      evidenceDir,
      async useApp({ countsEnabled }) {
        world.countsEnabled = countsEnabled
        return { origin: 'http://127.0.0.1:3000' }
      },
      async newBrowserSession({ viewport }) {
        world.viewport = viewport
        world.loggedIn = null
        world.aal = 0
        world.loginError = null
        world.url = 'http://127.0.0.1:3000/admin/login'
        const page = createScriptedPage(world)
        return {
          viewport,
          newPage: async () => page,
        }
      },
      async closeBrowserSession() {},
      fixture: {
        async setStatus(actor, status) {
          if (actor === 'owner') world.status = status
        },
        async setRole(actor, role) {
          if (actor === 'owner') world.role = role
        },
        async prepareCountScenario(name) {
          if (name === 'zero-window') {
            world.expected = {
              present: '4',
              recent: '0',
              measuredAt: VALID_MEASURED_AT,
              windowStart: VALID_WINDOW_START,
            }
          }
          if (name === 'one-recent') {
            world.expected = {
              present: '5',
              recent: '1',
              measuredAt: VALID_MEASURED_AT,
              windowStart: VALID_WINDOW_START,
            }
          }
        },
        async expectedCounts() {
          return { ...world.expected }
        },
        async setWrapperPresent(present) {
          world.wrapperPresent = present
        },
      },
      rpcObserver: {
        mark() {
          mark += 1
          marks.set(mark, world.observerCalls.length)
          return mark
        },
        since(id) {
          const start = marks.get(id) ?? 0
          return {
            complete: world.observerComplete,
            calls: world.observerCalls.slice(start),
          }
        },
      },
    },
  }
}

function stubFetch(world, t) {
  const previous = globalThis.fetch
  globalThis.fetch = async (url, init) => {
    const href = String(url)
    if (!href.startsWith('http://127.0.0.1:54321/rest/v1/rpc/')) {
      throw new Error(`unexpected fetch ${href}`)
    }
    const authorized = Boolean(init?.headers?.Authorization)
    if (!authorized) {
      return {
        status: 401,
        headers: { get: () => null },
        text: async () => JSON.stringify({ code: 'PGRST301' }),
      }
    }
    if (world.status !== 'active' || world.role === 'user') {
      return {
        status: 401,
        headers: { get: () => null },
        text: async () => JSON.stringify({ code: '42501' }),
      }
    }
    return {
      status: 200,
      headers: { get: () => null },
      text: async () => JSON.stringify([permittedRow({
        present_registered_accounts: String(world.expected.present),
        created_in_prior_30_days: String(world.expected.recent),
        measured_at: world.expected.measuredAt,
        window_start: world.expected.windowStart,
      })]),
    }
  }
  t.after(() => {
    globalThis.fetch = previous
  })
}

function pageFromBody(text, url = 'http://127.0.0.1:3000/admin') {
  return {
    url: () => url,
    locator: (selector) => ({
      count: async () => 0,
      first: () => ({ innerText: async () => '' }),
      innerText: async () => (selector === 'body' ? text : ''),
    }),
  }
}

test('implementation is delivered and real execution stays NOT RUN', () => {
  assert.equal(IMPLEMENTATION.implementation, 'delivered')
  assert.equal(IMPLEMENTATION.realExecution, 'NOT RUN')
  assert.equal(IMPLEMENTATION.runtimeIntegration, 'pending')
  assert.equal(FLOW_GATE_IDS.length, 14)
  assert.equal(FLOW_GATE_IDS[0], 'G6_login_ui_password')
  assert.equal(FLOW_GATE_IDS.at(-1), 'G19_http_boundary_same_session')
})

test('accepted product selectors and copy still match the baseline UI', () => {
  const login = lese('app/(public)/admin/login/page.tsx')
  const stepUp = lese('app/(public)/admin/mfa/AdminMfaStepUp.tsx')
  const dialog = lese('components/auth/MFATotpDialog.tsx')
  const security = lese('components/account/SecurityMFA.tsx')
  const counts = lese('components/admin/home/AdminAccountCounts.tsx')
  const contract = lese('lib/admin/account-counts-delivery/contract.ts')
  assert.match(login, /aria-label="Passwort Anmeldung"/)
  assert.match(login, /Jetnity Admin – Anmeldung/)
  assert.match(stepUp, /Zwei-Faktor-Bestätigung/)
  assert.match(dialog, /id="mfa-totp"|htmlFor="mfa-totp"/)
  assert.match(security, /Authenticator-App einrichten/)
  assert.match(security, /id="totp-code"/)
  assert.match(counts, /admin-account-counts-titel/)
  assert.match(counts, /ADMIN_ACCOUNT_COUNTS_WINDOW_HOURS/)
  assert.match(contract, /ADMIN_ACCOUNT_COUNTS_WINDOW_HOURS = 720/)
  assert.equal(SELECTORS.loginForm, 'form[aria-label="Passwort Anmeldung"]')
  assert.doesNotMatch(COPY.unavailable, /\b0\b/)
  assert.doesNotMatch(COPY.failed, /\b0\b/)
})

test('read-only source pins still include caller-status and the #557 producer', () => {
  const pins = detectProductDrift()
  assert.equal(SOURCE_PATHS.callerStatus, 'lib/admin/account-counts-delivery/caller-status.ts')
  assert.equal(typeof pins.callerStatus, 'string')
  assert.equal(pins.callerStatus.length, 40)
})

test('real-mode API cannot enable fake or session injection', () => {
  const signal = new AbortController().signal
  const base = {
    contractVersion: CONTRACT_VERSION,
    runId: 'x',
    productHead: BASELINE,
    signal,
    timeoutMs: 1000,
    accounts: ACCOUNTS,
    localApi: { origin: 'http://127.0.0.1:54321', anonKey: 'anon' },
    evidenceDir: '/tmp',
    useApp: async () => ({ origin: 'http://127.0.0.1:3000' }),
    newBrowserSession: async () => ({ newPage: async () => ({}) }),
    closeBrowserSession: async () => {},
    fixture: {
      setStatus: async () => {},
      setRole: async () => {},
      prepareCountScenario: async () => {},
      expectedCounts: async () => ({ present: '1', recent: '0' }),
      setWrapperPresent: async () => {},
    },
    rpcObserver: { mark: () => 1, since: () => ({ complete: true, calls: [] }) },
  }
  assert.throws(() => validateContext({ ...base, injectCookies: [] }), ContextContractError)
  assert.throws(() => validateContext({ ...base, storageState: 'auth.json' }), ContextContractError)
  assert.throws(() => validateContext({ ...base, forgeAal2: true }), ContextContractError)
  assert.throws(() => validateContext({ ...base, fakeMode: true }), ContextContractError)
  assert.throws(() => validateContext({ ...base, injectSession: () => {} }), /fake\/session injection/)
  assert.throws(
    () => validateContext({ ...base, localApi: { origin: 'https://example.supabase.co', anonKey: 'anon' } }),
    /numeric-loopback/,
  )
})

test('wrong context version or missing methods fail closed before steps', async () => {
  const missing = await runBrowserFlows({ contractVersion: 'nope' })
  assert.equal(missing.contractVersion, CONTRACT_VERSION)
  assert.equal(missing.gates.length, 14)
  assert.equal(missing.gates.every((gate) => gate.result === 'FAIL'), true)
  assert.match(missing.gates[0].notes, /contractVersion/)
  assert.equal(Object.hasOwn(missing, 'fullLocalExecution'), false)

  const incomplete = await runBrowserFlows({
    contractVersion: CONTRACT_VERSION,
    runId: 'x',
    productHead: BASELINE,
    signal: new AbortController().signal,
    timeoutMs: 1000,
    accounts: ACCOUNTS,
    localApi: { origin: 'http://127.0.0.1:54321', anonKey: 'anon' },
    evidenceDir: '/tmp',
  })
  assert.equal(incomplete.gates.every((gate) => gate.result === 'FAIL'), true)
  assert.match(incomplete.gates[0].notes, /useApp/)
})

test('mandatory gate completeness rejects missing or extra IDs', () => {
  assert.throws(() => assertGateSetComplete([]), /incomplete/)
  assert.throws(
    () => assertGateSetComplete(FLOW_GATE_IDS.map((id) => ({ id, result: 'PASS' })).slice(1)),
    /missing=G6/,
  )
  const extra = emptyGates('NOT RUN', 'x')
  extra.push({ id: 'G20_owned_cleanup', result: 'PASS', evidence: null, notes: null })
  assert.throws(() => assertGateSetComplete(extra), /extra=G20/)
})

test('new context second-factor path refuses a forced enroll click', async () => {
  const world = createWorld({ enrolled: true, totpReady: true })
  const page = createScriptedPage(world)
  world.url = 'http://127.0.0.1:3000/admin/login'
  const store = {
    totpSecret: world.enrollSecret,
    localApiOrigin: world.localApi,
    clickedEnrollOnThisPage: false,
  }
  world.enrolled = true
  await runG10ExistingFactor(
    page,
    'http://127.0.0.1:3000',
    OWNER,
    store,
    { timeoutMs: 2000 },
  )
  assert.equal(world.enrollClicked, false)
  assert.equal(world.aal, 2)
})

test('complete observer can assert no wrapper calls while OFF; incomplete cannot', () => {
  const prior = true
  assert.equal(
    assertNoWrapperCalls({ complete: true, calls: [{ method: 'GET', path: '/admin' }] }, {
      priorPositiveControl: prior,
    }),
    true,
  )
  assert.throws(
    () => assertNoWrapperCalls({ complete: false, calls: [] }, { priorPositiveControl: prior }),
    /incomplete observer/,
  )
  assert.throws(
    () => assertNoWrapperCalls({ complete: true, calls: [] }, { priorPositiveControl: false }),
    /prior real positive/,
  )
  assert.throws(
    () =>
      assertObservedWrapper({
        complete: true,
        calls: [{ method: 'GET', path: '/admin' }],
      }),
    /page request events are not a substitute/,
  )
})

test('B1 denied-caller counterexamples cannot become authorization PASS', () => {
  assert.equal(isUnavailableWrapperResponse({ status: 404, json: { code: 'PGRST202' } }), true)
  assert.equal(isDeniedCallerResponse({ status: 404, json: { code: 'PGRST202' } }, 'forbidden'), false)
  assert.equal(isDeniedCallerResponse({ status: 500, json: { code: '42501' } }, 'forbidden'), false)
  assert.equal(isDeniedCallerResponse({ status: 403, json: null }, 'forbidden'), false)
  assert.equal(isDeniedCallerResponse({ status: 403, json: {} }, 'forbidden'), false)
  assert.equal(isDeniedCallerResponse({ status: 401, json: { code: 'PGRST202' } }, 'unauthenticated'), false)
  assert.throws(
    () => assertDeniedWrapper({ status: 404, json: { code: 'PGRST202' } }, 'forbidden'),
    /missing wrapper|authorization/,
  )
  assert.throws(
    () => assertDeniedWrapper({ status: 500, json: { code: '42501' } }, 'forbidden'),
    /server failure/,
  )
  assert.throws(
    () => assertDeniedWrapper({ status: 403, json: null }, 'forbidden'),
    /denied forbidden semantics/,
  )
  assert.equal(isDeniedCallerResponse({ status: 403, json: { code: '42501' } }, 'forbidden'), true)
  assert.equal(isDeniedCallerResponse({ status: 401, json: { code: 'PGRST301' } }, 'unauthenticated'), true)
  assertDeniedWrapper({ status: 403, json: { code: '42501' } }, 'forbidden')
  assertDeniedWrapper({ status: 401, json: { code: 'PGRST301' } }, 'unauthenticated')
})

test('B1 success parser rejects multirow, invalid time and recent>present', () => {
  const invalid = [
    {
      present_registered_accounts: '1',
      created_in_prior_30_days: '999',
      measured_at: 'not-a-date',
      window_start: null,
      definition_version: 'jetnity.admin-account-counts.v1',
    },
    {
      present_registered_accounts: '1',
      created_in_prior_30_days: '999',
      measured_at: 'not-a-date',
      window_start: null,
      definition_version: 'jetnity.admin-account-counts.v1',
    },
  ]
  assert.equal(isPermittedSuccessShape(invalid), false)
  assert.equal(isPermittedSuccessShape([invalid[0]]), false)
  assert.equal(parseAdminAccountCountsPayload(invalid).ok, false)
  assert.equal(isPermittedSuccessShape([permittedRow(), permittedRow()]), false)
  assert.equal(isPermittedSuccessShape([permittedRow({ created_in_prior_30_days: '9' })]), false)
  assert.equal(isPermittedSuccessShape([permittedRow({ measured_at: 'not-a-date' })]), false)
  assert.equal(isPermittedSuccessShape([permittedRow({ window_start: null })]), false)
  assert.equal(isPermittedSuccessShape([permittedRow()]), true)
  assertPermittedWrapper({ status: 200, json: [permittedRow()] }, { expected: { present: '4', recent: '0' } })
  assert.throws(
    () => assertPermittedWrapper({ status: 200, json: invalid }, { expected: { present: '1', recent: '999' } }),
    /count\/time contract/,
  )
})

test('B1 UI denial rejects blank, ISE, unavailable-as-forbidden and checks both aggregates', async () => {
  await assert.rejects(
    () => assertNoCountDisclosure(pageFromBody(''), { allowForbidden: true }),
    /blank|denial/,
  )
  await assert.rejects(
    () => assertNoCountDisclosure(pageFromBody('Internal Server Error'), { allowForbidden: true }),
    /failed|generic/,
  )
  await assert.rejects(
    () => assertNoCountDisclosure(pageFromBody(UI_COPY.unavailable), { allowForbidden: true }),
    /unavailable|expected denial/,
  )
  await assert.rejects(
    () => assertNoCountDisclosure(pageFromBody(UI_COPY.failed), { allowForbidden: true }),
    /generic failed/,
  )
  const leaked = {
    url: () => 'http://127.0.0.1:3000/admin',
    locator: (selector) => ({
      count: async () => (selector.includes('window') || selector.includes('present') ? 1 : 0),
      first: () => ({ innerText: async () => '4' }),
      innerText: async () => UI_COPY.forbidden,
    }),
  }
  await assert.rejects(() => assertNoCountDisclosure(leaked, { allowForbidden: true }), /aggregate/)
  const forbidden = pageFromBody(UI_COPY.forbidden)
  const denied = await assertNoCountDisclosure(forbidden, { allowForbidden: true })
  assert.equal(denied.kind, 'forbidden')
  const classified = await classifyDenialUi(pageFromBody(UI_COPY.unavailable))
  assert.equal(classified.kind, 'unavailable')
})

test('B2 Auth capture requires exact local project origin', () => {
  const origin = 'http://127.0.0.1:54321'
  assert.equal(sameExactOrigin('http://127.0.0.1:54321/auth/v1/token', origin), true)
  assert.equal(isLocalAuthResponse('http://127.0.0.1:54321/auth/v1/token', origin), true)
  assert.equal(isLocalAuthResponse('http://127.0.0.1:54321.outside.invalid/auth/v1/token', origin), false)
  assert.equal(isLocalAuthResponse('http://127.0.0.1:54322/auth/v1/token', origin), false)
  assert.equal(isLocalAuthResponse('//127.0.0.1:54321/auth/v1/token', origin), false)
  assert.equal(isLocalAuthResponse('https://example.supabase.co/auth/v1/token', origin), false)
  const foreign = {
    url: () => 'http://127.0.0.1:54322/auth/v1/factors',
    request: () => ({ method: () => 'POST' }),
    status: () => 200,
  }
  assert.equal(isIntendedAuthResponse(foreign, origin, { pathIncludes: '/auth/v1/factors' }), false)
  const local = {
    url: () => 'http://127.0.0.1:54321/auth/v1/factors',
    request: () => ({ method: () => 'POST' }),
    status: () => 200,
  }
  assert.equal(isIntendedAuthResponse(local, origin, { pathIncludes: '/auth/v1/factors', method: 'POST' }), true)
})

test('direct wrapper rejects remote URL, protocol-relative and foreign redirect', async () => {
  await assert.rejects(
    () =>
      callLocalWrapper({
        localApi: { origin: 'https://example.supabase.co', anonKey: 'anon' },
        accessToken: 'token',
      }),
    /remote|loopback/,
  )
  assert.throws(() => rejectRemoteRedirect('https://example.supabase.co/auth', true), /remote redirect/)
  assert.throws(() => rejectUnsafeRedirect('//evil.example/auth', true, 'http://127.0.0.1:54321'), /protocol-relative/)
  assert.throws(
    () => rejectUnsafeRedirect('http://127.0.0.1:54322/auth', true, 'http://127.0.0.1:54321'),
    /foreign|remote/,
  )
  assert.equal(isNumericLoopbackOrigin('http://127.0.0.1:54321'), true)
  assert.equal(isNumericLoopbackOrigin('http://localhost:54321'), false)
  assert.equal(sameExactOrigin('http://127.0.0.1:54321', 'http://127.0.0.1:54321/'), true)
})

test('restore runs after an assertion failure and close errors propagate', async () => {
  const restored = []
  await assert.rejects(
    () =>
      withFixtureRestore(
        async () => {
          restored.push('yes')
        },
        async () => {
          throw new Error('assertion failed')
        },
      ),
    /assertion failed/,
  )
  assert.deepEqual(restored, ['yes'])

  await assert.rejects(
    () =>
      withFixtureRestore(
        async () => {
          throw new Error('restore failed')
        },
        async () => {
          throw new Error('assertion failed')
        },
      ),
    /ownership uncertain|restore failed/,
  )

  await assert.rejects(
    () =>
      withBrowserSession(
        {
          newBrowserSession: async () => ({ id: 1 }),
          closeBrowserSession: async () => {
            throw new Error('close failed')
          },
        },
        VIEWPORTS.desktop,
        async () => 'ok',
      ),
    /ownership uncertain|close/,
  )
})

test('downstream gates stay NOT RUN after a prerequisite failure', async (t) => {
  const { context } = createContextDouble(t)
  context.newBrowserSession = async () => {
    throw new Error('login browser unavailable')
  }
  const result = await runBrowserFlows(context)
  assertGateSetComplete(result.gates)
  const byId = Object.fromEntries(result.gates.map((gate) => [gate.id, gate]))
  assert.equal(byId.G6_login_ui_password.result, 'FAIL')
  assert.equal(byId.G7_aal1_denied_step_up.result, 'NOT RUN')
  assert.equal(byId.G8_totp_enroll_via_ui.result, 'NOT RUN')
  assert.equal(byId.G9_aal2_admin_counts_on.result, 'NOT RUN')
  assert.equal(byId.G11_default_off_no_section_no_rpc.result, 'NOT RUN')
  assert.equal(byId.G19_http_boundary_same_session.result, 'NOT RUN')
  assert.ok(['FAIL', 'NOT RUN', 'PASS'].includes(byId.G13_ordinary_user_no_disclosure.result))
  assert.ok(['FAIL', 'NOT RUN', 'PASS'].includes(byId.G14_unauthenticated_no_disclosure.result))
})

test('B3 hanging close and failed restore stop later resource-using gates', async (t) => {
  const hanging = createContextDouble(t)
  hanging.context.timeoutMs = 250
  hanging.context.closeBrowserSession = () => new Promise(() => {})
  const hung = await runBrowserFlows(hanging.context)
  assertGateSetComplete(hung.gates)
  assert.equal(hung.gates[0].result, 'FAIL')
  assert.match(hung.gates[0].notes, /exceeded|budget|aborted|ownership|closeBrowserSession|stop/)
  assert.equal(hung.gates.slice(1).every((gate) => gate.result === 'NOT RUN'), true)

  const restoring = createContextDouble(t)
  stubFetch(restoring.world, t)
  const originalSetStatus = restoring.context.fixture.setStatus.bind(restoring.context.fixture)
  restoring.context.fixture.setStatus = async (actor, status) => {
    if (status === 'active' && restoring.world.status !== 'active') {
      throw new Error('restore failed')
    }
    return originalSetStatus(actor, status)
  }
  const restored = await runBrowserFlows(restoring.context)
  const byId = Object.fromEntries(restored.gates.map((gate) => [gate.id, gate]))
  assert.equal(byId.G16_restricted_privileged_status.result, 'FAIL')
  assert.match(byId.G16_restricted_privileged_status.notes, /ownership uncertain|restore/)
  assert.equal(byId.G17_missing_wrapper_unavailable.result, 'NOT RUN')
  assert.equal(byId.G18_desktop_mobile_ui.result, 'NOT RUN')
  assert.equal(byId.G19_http_boundary_same_session.result, 'NOT RUN')
})

test('B3 G12 rejects a 2→3 delta that never started at recent=0', async () => {
  const world = createWorld({
    enrolled: true,
    aal: 2,
    loggedIn: OWNER.email,
    url: 'http://127.0.0.1:3000/admin',
    expected: { present: '2', recent: '2', measuredAt: VALID_MEASURED_AT, windowStart: VALID_WINDOW_START },
  })
  const page = createScriptedPage(world)
  const context = {
    fixture: {
      async prepareCountScenario(name) {
        if (name === 'zero-window') world.expected.recent = '2'
        if (name === 'one-recent') {
          world.expected.present = '3'
          world.expected.recent = '3'
        }
      },
      async expectedCounts() {
        return { ...world.expected }
      },
    },
  }
  await assert.rejects(
    () => runG12ZeroAndDelta(page, 'http://127.0.0.1:3000', {}, context, { timeoutMs: 1000 }),
    /recent must be 0/,
  )
})

test('B4 value-aware redaction, path escape, exclusive write and fail-closed receipt', () => {
  const secrets = ['Aa1!SYNTHETIC-PASSWORD', 'JBSWY3DPEHPK3PXP', OWNER.password]
  const nested = { gates: [{ notes: 'locator.fill("Aa1!SYNTHETIC-PASSWORD")' }] }
  assert.equal(looksSecretBearing(nested, secrets), true)
  const redacted = redactFreeForm(nested.gates[0].notes, secrets)
  assert.doesNotMatch(redacted, /Aa1!SYNTHETIC-PASSWORD/)
  assert.match(redacted, /\[redacted\]/)
  const sanitized = sanitizeReturnedGates(nested.gates, secrets)
  assert.equal(looksSecretBearing(sanitized, secrets), false)
  assert.doesNotMatch(JSON.stringify(sanitized), /Aa1!SYNTHETIC-PASSWORD/)
  assert.equal(looksSecretBearing({ notes: `nested ${OWNER.password} token` }, secrets), true)

  const dir = mkdtempSync(join(tmpdir(), 'aacbf1-receipt-'))
  try {
    assert.throws(() => containedEvidencePath(dir, '../escape.json'), /basename|escaped/)
    assert.throws(() => containedEvidencePath(dir, 'sub/dir.json'), /basename/)
    assert.throws(
      () => writeSanitizedReceipt(dir, 'trace.har', { contractVersion: CONTRACT_VERSION }),
      /secret-bearing artifact/,
    )
    writeSanitizedReceipt(dir, 'ok.json', {
      contractVersion: CONTRACT_VERSION,
      gates: [{ id: 'G6_login_ui_password', result: 'NOT RUN', notes: 'locator.fill("Aa1!SYNTHETIC-PASSWORD")' }],
      implementationMetadata: { scenarioCode: 'delivered' },
      thisInvocation: { kind: 'consumer-gates', realBrowserOrMfaExecution: 'NOT RUN' },
      implementation: 'delivered',
      realExecution: 'NOT RUN',
    }, { secrets })
    const written = JSON.parse(readFileSync(join(dir, 'ok.json'), 'utf8'))
    assert.doesNotMatch(JSON.stringify(written), /Aa1!SYNTHETIC-PASSWORD/)
    assert.throws(
      () => writeSanitizedReceipt(dir, 'ok.json', { contractVersion: CONTRACT_VERSION, gates: [] }, { secrets }),
      /EEXIST|exclusive|exists/,
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('B2 beginBrowserSession clears stale access tokens and keeps the factor secret', () => {
  const store = {
    totpSecret: 'JBSWY3DPEHPK3PXP',
    accessToken: 'stale-previous-session-token',
    clickedEnrollOnThisPage: true,
    enrolled: true,
  }
  beginBrowserSession(store)
  assert.equal(store.accessToken, null)
  assert.equal(store.clickedEnrollOnThisPage, false)
  assert.equal(store.totpSecret, 'JBSWY3DPEHPK3PXP')
  assert.equal(store.enrolled, true)
})

test('B4 duplicate receipt write invalidates consumer PASS', async (t) => {
  const { context, world, evidenceDir } = createContextDouble(t)
  stubFetch(world, t)
  writeFileSync(join(evidenceDir, runScopedName('unit-double', 'browser-flows-gates.json')), 'occupied\n')
  const result = await runBrowserFlows(context)
  assert.equal(result.gates.some((gate) => gate.result === 'PASS'), false)
  assert.ok(result.gates.some((gate) => /receipt write failed/.test(String(gate.notes))))
})

test('TOTP helper and enroll extractor stay in-memory only', () => {
  const code = generateTotp('JBSWY3DPEHPK3PXP', { now: 1_111_111_111_000 })
  assert.equal(looksLikeTotpCode(code), true)
  assert.equal(extractTotpSecret({ totp: { secret: 'JBSWY3DPEHPK3PXP' } }), 'JBSWY3DPEHPK3PXP')
  assert.equal(
    extractTotpSecret({ totp: { uri: 'otpauth://totp/Jetnity?secret=JBSWY3DPEHPK3PXP' } }),
    'JBSWY3DPEHPK3PXP',
  )
})

test('controlled doubles can walk G6–G19 without claiming a real-browser PASS', async (t) => {
  const { context, world, evidenceDir } = createContextDouble(t)
  stubFetch(world, t)
  const result = await runBrowserFlows(context)
  assert.equal(result.contractVersion, CONTRACT_VERSION)
  assert.equal(Object.hasOwn(result, 'fullLocalExecution'), false)
  assertGateSetComplete(result.gates)
  const failed = result.gates.filter((gate) => gate.result !== 'PASS')
  assert.deepEqual(failed, [], failed.map((gate) => `${gate.id}:${gate.notes}`).join('; '))
  const receiptName = runScopedName('unit-double', 'browser-flows-gates.json')
  const receipt = JSON.parse(readFileSync(join(evidenceDir, receiptName), 'utf8'))
  assert.equal(receipt.realExecution, 'NOT RUN')
  assert.equal(receipt.implementation, 'delivered')
  assert.equal(receipt.thisInvocation.realBrowserOrMfaExecution, 'NOT RUN')
  assert.equal(receipt.implementationMetadata.scenarioCode, 'delivered')
  assert.equal(looksSecretBearing(receipt), false)
  assert.equal(looksSecretBearing(result.gates, [OWNER.password, world.accessToken, world.enrollSecret]), false)
  assert.equal(isPermittedSuccessShape([permittedRow()]), true)
  assertPermittedWrapper({ status: 200, json: [permittedRow()] })
  assertDeniedWrapper({ status: 401, json: { code: '42501' } }, 'forbidden')
})
