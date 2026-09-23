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
  validateContext,
} from './contract.mjs'
import { assertNoCountDisclosure } from './counts.mjs'
import { writeSanitizedReceipt } from './evidence.mjs'
import {
  IMPLEMENTATION,
  runBrowserFlows,
  runG10ExistingFactor,
} from './flows.mjs'
import {
  assertDeniedWrapper,
  assertPermittedWrapper,
  callLocalWrapper,
  isPermittedSuccessShape,
} from './http.mjs'
import { assertNoWrapperCalls, assertObservedWrapper } from './observer.mjs'
import { assertSanitized, looksSecretBearing } from './privacy.mjs'
import {
  extractTotpSecret,
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

function lese(rel) {
  return readFileSync(join(ROOT, rel), 'utf8')
}

function permittedRow() {
  return {
    present_registered_accounts: '4',
    created_in_prior_30_days: '0',
    measured_at: '2026-09-23T12:00:00Z',
    window_start: '2026-08-24T12:00:00Z',
    definition_version: 'jetnity.admin-account-counts.v1',
  }
}

function createLocator(getText, actions = {}) {
  const locator = {
    waitFor: async () => {
      if (!getText()) throw new Error('locator not visible')
    },
    fill: async (value) => actions.fill?.(value),
    click: async () => actions.click?.(),
    textContent: async () => getText(),
    innerText: async () => getText(),
    count: async () => (getText() ? 1 : 0),
    first: () => createLocator(getText, actions),
    isVisible: async () => Boolean(getText()),
    screenshot: async ({ path }) => {
      if (path) writeFileSync(path, 'clip')
    },
    locator: () => createLocator(getText, actions),
  }
  return locator
}

function createScriptedPage(world) {
  const responseListeners = []
  let email = ''
  let password = ''
  let enrollCode = ''
  let stepUpCode = ''

  const emitJson = (url, payload) => {
    const response = {
      url: () => url,
      json: async () => payload,
      request: () => ({ method: () => 'POST' }),
    }
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
      const response = {
        url: () => `${world.localApi}/auth/v1/factors`,
        json: async () => ({ totp: { secret: world.enrollSecret } }),
        request: () => ({ method: () => 'POST' }),
      }
      if (typeof predicate === 'function' && !predicate(response)) {
        throw new Error('enroll response predicate rejected')
      }
      return response
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
            world.aal = world.enrolled ? 1 : 1
            world.loginError = null
            world.url = 'http://127.0.0.1:3000/admin/mfa'
            emitJson(`${world.localApi}/auth/v1/token`, {})
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
        return createLocator(() => (showCounts() ? 'time' : ''), {
          // count() uses getText truthiness; provide two via custom count below
        })
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

  page.locator = new Proxy(page.locator, {
    apply(target, thisArg, [selector]) {
      const located = target.call(thisArg, selector)
      if (selector === '[aria-labelledby="admin-account-counts-titel"] time') {
        located.count = async () => (showCounts() ? 2 : 0)
      }
      return located
    },
  })

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
    expected: { present: '4', recent: '0' },
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
          if (name === 'zero-window') world.expected = { present: '4', recent: '0' }
          if (name === 'one-recent') world.expected = { present: '5', recent: '1' }
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
      text: async () => JSON.stringify([permittedRow()]),
    }
  }
  t.after(() => {
    globalThis.fetch = previous
  })
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
  const security = lese('components/account/SecurityMFA.tsx')
  const counts = lese('components/admin/home/AdminAccountCounts.tsx')
  assert.match(login, /aria-label="Passwort Anmeldung"/)
  assert.match(login, /Jetnity Admin – Anmeldung/)
  assert.match(stepUp, /Zwei-Faktor-Bestätigung/)
  assert.match(stepUp, /id="mfa-totp"|htmlFor="mfa-totp"/)
  assert.match(security, /Authenticator-App einrichten/)
  assert.match(security, /id="totp-code"/)
  assert.match(counts, /admin-account-counts-titel/)
  assert.match(counts, /720/)
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

test('banned or generic server error cannot become a status PASS', async () => {
  const failedPage = {
    locator: (selector) => ({
      count: async () => (selector.includes('present') ? 0 : 1),
      first: () => ({ innerText: async () => '0' }),
      innerText: async () => UI_COPY.failed,
    }),
  }
  await assert.rejects(() => assertNoCountDisclosure(failedPage, { allowForbidden: true }), /generic failed/)

  const forbiddenPage = {
    locator: (selector) => ({
      count: async () => 0,
      first: () => ({ innerText: async () => '' }),
      innerText: async () => (selector === 'body' ? UI_COPY.forbidden : ''),
    }),
  }
  const denied = await assertNoCountDisclosure(forbiddenPage, { allowForbidden: true })
  assert.equal(denied.kind, 'forbidden')
})

test('direct wrapper rejects remote URL and remote redirect with credentials', async () => {
  await assert.rejects(
    () =>
      callLocalWrapper({
        localApi: { origin: 'https://example.supabase.co', anonKey: 'anon' },
        accessToken: 'token',
      }),
    /remote|loopback/,
  )
  assert.throws(() => rejectRemoteRedirect('https://example.supabase.co/auth', true), /remote redirect/)
  assert.equal(isNumericLoopbackOrigin('http://127.0.0.1:54321'), true)
  assert.equal(isNumericLoopbackOrigin('http://localhost:54321'), false)
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
    /restore failed/,
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
    /close failed/,
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

test('receipt writer refuses secret-bearing and trace artifacts', () => {
  assert.equal(looksSecretBearing({ password: 'x' }), true)
  assert.equal(looksSecretBearing({ totpSecret: 'JBSWY3DPEHPK3PXP' }), true)
  assert.equal(looksSecretBearing({ notes: 'aal2 counts compared' }), false)
  assert.throws(() => assertSanitized({ accessToken: 'eyJhbGciOiJI.eyJzdWIiOiIx.sig' }), /secret-bearing/)
  const dir = mkdtempSync(join(tmpdir(), 'aacbf1-receipt-'))
  try {
    assert.throws(
      () => writeSanitizedReceipt(dir, 'trace.har', { contractVersion: CONTRACT_VERSION }),
      /secret-bearing artifact/,
    )
    writeSanitizedReceipt(dir, 'ok.json', {
      contractVersion: CONTRACT_VERSION,
      gates: [{ id: 'G6_login_ui_password', result: 'NOT RUN', notes: 'unit' }],
      implementation: 'delivered',
      realExecution: 'NOT RUN',
    })
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
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
  const receipt = JSON.parse(readFileSync(join(evidenceDir, 'browser-flows-gates.json'), 'utf8'))
  assert.equal(receipt.realExecution, 'NOT RUN')
  assert.equal(receipt.implementation, 'delivered')
  assert.equal(looksSecretBearing(receipt), false)
  assert.equal(isPermittedSuccessShape([permittedRow()]), true)
  assertPermittedWrapper({ status: 200, json: [permittedRow()] })
  assertDeniedWrapper({ status: 401, json: { code: '42501' } })
})
