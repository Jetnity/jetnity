#!/usr/bin/env node
// Browser-flow consumer for G6–G19. Runtime #558 owns stack, observer and verdict.

import {
  CONTRACT_VERSION,
  FLOW_GATE_IDS,
  PATHS,
  PRIVILEGED_ACTOR,
  RESTRICTED_STATUSES,
  ROLE_DOWNGRADE,
  SELECTORS,
  VIEWPORTS,
} from './constants.mjs'
import {
  ContextContractError,
  OwnershipUncertaintyError,
  assertGateSetComplete,
  createRunBudget,
  emptyGates,
  makeGate,
  passed,
  validateContext,
} from './contract.mjs'
import {
  assertCountsMatchExpected,
  assertDefinitionAndWindow,
  assertNoCountDisclosure,
  assertNoHorizontalOverflow,
  assertUnavailableNotZero,
  normalizeCount,
  parseCountDelta,
  screenshotCountSection,
  sectionPresent,
} from './counts.mjs'
import {
  reserveExclusiveArtifact,
  runScopedName,
  staticImplementationMetadata,
  writeSanitizedReceipt,
} from './evidence.mjs'
import {
  SYNTHETIC_INVALID_JWT,
  assertDeniedWrapper,
  assertPermittedWrapper,
  callLocalWrapper,
} from './http.mjs'
import {
  assertNoWrapperCalls,
  assertObservedWrapper,
  waitForRequestsToSettle,
} from './observer.mjs'
import { collectRunSecrets, safeFailureMessage, sanitizeReturnedGates } from './privacy.mjs'
import {
  attachAuthCapture,
  enrollTotpViaUi,
  expectOrdinaryDenial,
  expectPrivilegedAal1,
  loginViaUi,
  openPage,
  stepUpViaExistingFactor,
  withBrowserSession,
  withFixtureRestore,
} from './session.mjs'

export const IMPLEMENTATION = Object.freeze({
  implementation: 'delivered',
  realExecution: 'NOT RUN',
  runtimeIntegration: 'pending',
  note:
    'Awaited Playwright G6–G19 scenario code is implemented against the frozen §4 context. Real browser execution stays NOT RUN until reviewed #558 exists and TL authorizes the exact sync/run. Helper/double PASS is not a full local execution PASS.',
})

function failClosed(error) {
  if (error instanceof ContextContractError) {
    return {
      contractVersion: CONTRACT_VERSION,
      gates: emptyGates('FAIL', error.message),
    }
  }
  throw error
}

function skipAfter(gates, id, dependencies) {
  const missed = dependencies.filter((dep) => !passed(gates, dep))
  if (missed.length === 0) return null
  return makeGate(id, {
    result: 'NOT RUN',
    notes: `prerequisite ${missed.join(', ')} did not PASS`,
  })
}

async function runNamedGate(id, fn, { evidence = null, secrets = [] } = {}) {
  try {
    const notes = await fn()
    return makeGate(id, {
      result: 'PASS',
      evidence,
      notes: typeof notes === 'string' ? notes : notes?.notes ?? null,
    })
  } catch (error) {
    const gate = makeGate(id, {
      result: 'FAIL',
      evidence: null,
      notes: safeFailureMessage(error, secrets),
    })
    if (error instanceof OwnershipUncertaintyError) {
      gate.ownershipUncertain = true
    }
    return gate
  }
}

function withPageCapture(page, store, fn) {
  const detach = attachAuthCapture(page, store, {
    localApiOrigin: store.localApiOrigin,
    expectedActor: store.expectedActor,
  })
  return Promise.resolve()
    .then(() => fn())
    .finally(() => detach())
}

async function privilegedLoginAndMaybeStepUp(page, origin, account, store, timing, { stepUp = false } = {}) {
  return withPageCapture(page, store, async () => {
    await loginViaUi(page, origin, account, { ...timing, store, localApiOrigin: store.localApiOrigin })
    if (stepUp) {
      await stepUpViaExistingFactor(page, origin, store, timing)
    } else {
      await expectPrivilegedAal1(page, timing)
    }
  })
}

export async function runG6Login(page, origin, account, store, timing) {
  return withPageCapture(page, store, async () => {
    await loginViaUi(page, origin, account, { ...timing, store, localApiOrigin: store.localApiOrigin })
    await expectPrivilegedAal1(page, timing)
    return 'UI password login reached the real AAL1 step-up route'
  })
}

export async function runG7Aal1Denial(page, origin, timing) {
  await page.goto(`${origin}${PATHS.admin}`, {
    waitUntil: 'domcontentloaded',
    timeout: timing.timeoutMs,
  })
  const url = typeof page.url === 'function' ? page.url() : ''
  if (!String(url).includes(PATHS.stepUp)) {
    throw new Error(`AAL1 /admin must stay on step-up, landed on ${url}`)
  }
  await assertNoCountDisclosure(page, { expectKind: 'step-up', expectedOrigin: origin })
  return 'role alone did not disclose counts before AAL2'
}

export async function runG8Enroll(page, origin, store, timing) {
  await enrollTotpViaUi(page, origin, store, timing)
  return 'local enroll/challenge/verify completed; secret retained in memory only'
}

export async function runG9Aal2CountsOn(page, origin, store, context, timing) {
  await stepUpViaExistingFactor(page, origin, store, { ...timing, allowEnroll: true })
  const mark = context.rpcObserver.mark()
  await page.goto(`${origin}${PATHS.admin}`, {
    waitUntil: 'domcontentloaded',
    timeout: timing.timeoutMs,
  })
  await waitForRequestsToSettle(page, timing)
  const expected = await context.fixture.expectedCounts()
  await assertCountsMatchExpected(page, expected)
  await assertDefinitionAndWindow(page, expected)
  assertObservedWrapper(context.rpcObserver.since(mark))
  store.positiveRpcControl = true
  store.lastExpected = expected
  return 'AAL2 Admin counts matched independent fixture counts and an observed RPC'
}

export async function runG10ExistingFactor(page, origin, account, store, timing) {
  if (!store.totpSecret) throw new Error('existing factor secret missing')
  return withPageCapture(page, store, async () => {
    await loginViaUi(page, origin, account, { ...timing, store, localApiOrigin: store.localApiOrigin })
    const clickedEnroll = { value: false }
    const originalGetByRole = page.getByRole?.bind(page)
    if (originalGetByRole) {
      page.getByRole = (role, options) => {
        const locator = originalGetByRole(role, options)
        if (options?.name === SELECTORS.enrollButtonText) {
          const click = locator.click?.bind(locator)
          if (click) {
            locator.click = async (...args) => {
              clickedEnroll.value = true
              store.clickedEnrollOnThisPage = true
              return click(...args)
            }
          }
        }
        return locator
      }
    }
    await stepUpViaExistingFactor(page, origin, store, timing)
    if (clickedEnroll.value) {
      throw new Error('fresh session reused enrollment instead of the existing factor')
    }
    return 'fresh isolated session reused the existing factor via challenge/verify'
  })
}

export async function runG11DefaultOff(page, origin, store, context, timing) {
  if (!store.positiveRpcControl) {
    throw new Error('OFF/no-call requires a prior real positive observed-call control')
  }
  const mark = context.rpcObserver.mark()
  await page.goto(`${origin}${PATHS.admin}`, {
    waitUntil: 'domcontentloaded',
    timeout: timing.timeoutMs,
  })
  await waitForRequestsToSettle(page, timing)
  if (await sectionPresent(page)) {
    throw new Error('counts section rendered while the OFF application instance is active')
  }
  await assertNoCountDisclosure(page, { expectKind: 'disabled', expectedOrigin: origin })
  assertNoWrapperCalls(context.rpcObserver.since(mark), {
    priorPositiveControl: store.positiveRpcControl,
  })
  return 'OFF instance hid the section and the complete observer interval saw no wrapper RPC'
}

export async function runG12ZeroAndDelta(page, origin, store, context, timing) {
  await context.fixture.prepareCountScenario('zero-window')
  await page.goto(`${origin}${PATHS.admin}`, {
    waitUntil: 'networkidle',
    timeout: timing.timeoutMs,
  })
  const zero = await context.fixture.expectedCounts()
  if (normalizeCount(zero.recent) !== '0') {
    throw new Error(`zero-window recent must be 0, got ${zero.recent}`)
  }
  await assertCountsMatchExpected(page, zero)
  await context.fixture.prepareCountScenario('one-recent')
  await page.reload?.({ waitUntil: 'networkidle', timeout: timing.timeoutMs })
  if (!page.reload) {
    await page.goto(`${origin}${PATHS.admin}`, {
      waitUntil: 'networkidle',
      timeout: timing.timeoutMs,
    })
  }
  const one = await context.fixture.expectedCounts()
  if (normalizeCount(one.recent) !== '1') {
    throw new Error(`one-recent recent must be 1, got ${one.recent}`)
  }
  await assertCountsMatchExpected(page, one)
  const present = parseCountDelta(zero.present, one.present)
  if (present.presentDelta !== 1n) {
    throw new Error(`expected +1 present, got ${present.presentDelta}`)
  }
  store.lastExpected = one
  return 'zero-window recent=0 then one-recent recent=1 with exact +1 present'
}

export async function runG13Ordinary(page, origin, account, timing) {
  await loginViaUi(page, origin, account, timing)
  await expectOrdinaryDenial(page, timing)
  await page.goto(`${origin}${PATHS.admin}`, {
    waitUntil: 'domcontentloaded',
    timeout: timing.timeoutMs,
  })
  await assertNoCountDisclosure(page, {
    expectKind: ['forbidden', 'login-denied', 'login', 'unauthorized'],
    expectedOrigin: origin,
  })
  return 'insufficient role did not disclose protected aggregates'
}

export async function runG14Unauthenticated(page, origin, timing) {
  await page.goto(`${origin}${PATHS.admin}`, {
    waitUntil: 'domcontentloaded',
    timeout: timing.timeoutMs,
  })
  const url = typeof page.url === 'function' ? page.url() : ''
  if (!String(url).includes(PATHS.login)) {
    throw new Error(`unauthenticated /admin must redirect to login, landed on ${url}`)
  }
  await assertNoCountDisclosure(page, { expectKind: 'login', expectedOrigin: origin })
  return 'fresh unauthenticated context did not obtain protected counts'
}

export async function runG15Downgrade(page, origin, context, timing) {
  return withFixtureRestore(
    () => context.fixture.setRole(PRIVILEGED_ACTOR, 'owner'),
    async () => {
      await context.fixture.setRole(PRIVILEGED_ACTOR, ROLE_DOWNGRADE)
      await page.goto(`${origin}${PATHS.admin}`, {
        waitUntil: 'domcontentloaded',
        timeout: timing.timeoutMs,
      })
      await assertNoCountDisclosure(page, {
        expectKind: ['forbidden', 'login-denied', 'unauthorized'],
        expectedOrigin: origin,
      })
      return 'same privileged session was denied after fixture role downgrade'
    },
    { budget: timing.budget },
  )
}

export async function runG16RestrictedStatus(page, origin, context, timing) {
  return withFixtureRestore(
    () => context.fixture.setStatus(PRIVILEGED_ACTOR, 'active'),
    async () => {
      for (const status of RESTRICTED_STATUSES) {
        await context.fixture.setStatus(PRIVILEGED_ACTOR, status)
        await page.goto(`${origin}${PATHS.admin}`, {
          waitUntil: 'domcontentloaded',
          timeout: timing.timeoutMs,
        })
        await assertNoCountDisclosure(page, {
          expectKind: ['forbidden', 'login-denied', 'unauthorized'],
          expectedOrigin: origin,
        })
      }
      await context.fixture.setStatus(PRIVILEGED_ACTOR, 'active')
      await page.goto(`${origin}${PATHS.admin}`, {
        waitUntil: 'domcontentloaded',
        timeout: timing.timeoutMs,
      })
      const expected = await context.fixture.expectedCounts()
      await assertCountsMatchExpected(page, expected)
      return 'banned/disabled/pending denied counts; active restoration re-read permitted counts'
    },
    { budget: timing.budget },
  )
}

export async function runG17MissingWrapper(page, origin, context, timing) {
  return withFixtureRestore(
    () => context.fixture.setWrapperPresent(true),
    async () => {
      await context.fixture.setWrapperPresent(false)
      await page.goto(`${origin}${PATHS.admin}`, {
        waitUntil: 'domcontentloaded',
        timeout: timing.timeoutMs,
      })
      await assertUnavailableNotZero(page, { expectedOrigin: origin })
      return 'missing wrapper rendered unavailable, not 0 accounts'
    },
    { budget: timing.budget },
  )
}

export async function runG18Viewport(page, origin, store, viewport, evidencePath, timing) {
  if (typeof page.setViewportSize === 'function') {
    await page.setViewportSize(viewport)
  }
  await page.goto(`${origin}${PATHS.admin}`, {
    waitUntil: 'domcontentloaded',
    timeout: timing.timeoutMs,
  })
  await page.locator(SELECTORS.countsTitle).waitFor({ state: 'visible', timeout: timing.timeoutMs })
  const expected = store.lastExpected ?? null
  await assertDefinitionAndWindow(page, expected)
  await assertNoHorizontalOverflow(page, viewport)
  await screenshotCountSection(page, evidencePath, timing)
  return `${viewport.width}x${viewport.height} count section visible without overflow`
}

export async function runG19HttpBoundary(store, context, signal) {
  if (!store.accessToken) {
    throw new Error('G19 requires the current session issued access token')
  }
  const expected = await context.fixture.expectedCounts()
  const permitted = await callLocalWrapper({
    localApi: context.localApi,
    accessToken: store.accessToken,
    signal,
  })
  assertPermittedWrapper(permitted, { expected })
  const anonymous = await callLocalWrapper({
    localApi: context.localApi,
    accessToken: null,
    signal,
  })
  assertDeniedWrapper(anonymous, 'anonymous')
  const invalidJwt = await callLocalWrapper({
    localApi: context.localApi,
    accessToken: SYNTHETIC_INVALID_JWT,
    signal,
  })
  assertDeniedWrapper(invalidJwt, 'invalidJwt')
  await withFixtureRestore(
    () => context.fixture.setStatus(PRIVILEGED_ACTOR, 'active'),
    async () => {
      await context.fixture.setStatus(PRIVILEGED_ACTOR, 'banned')
      const banned = await callLocalWrapper({
        localApi: context.localApi,
        accessToken: store.accessToken,
        signal,
      })
      assertDeniedWrapper(banned, 'forbidden')
    },
  )
  const restored = await callLocalWrapper({
    localApi: context.localApi,
    accessToken: store.accessToken,
    signal,
  })
  assertPermittedWrapper(restored, { expected })
  return 'current issued token permitted, then anonymous/invalid-JWT/banned denied, then active restored'
}

export async function runBrowserFlows(context) {
  let validated
  try {
    validated = validateContext(context)
  } catch (error) {
    return failClosed(error)
  }
  if (validated.signal.aborted) {
    return {
      contractVersion: CONTRACT_VERSION,
      gates: emptyGates('NOT RUN', 'context.signal already aborted'),
    }
  }

  const store = {
    totpSecret: null,
    accessToken: null,
    enrolled: false,
    positiveRpcControl: false,
    localApiOrigin: validated.localApi.origin,
    lastExpected: null,
    clickedEnrollOnThisPage: false,
    sessionEpoch: 0,
    expectedActor: validated.accounts[PRIVILEGED_ACTOR],
  }
  const runBudget = createRunBudget(validated)
  const secrets = () => collectRunSecrets(validated, store)
  const timingFor = () => {
    runBudget.assertLive('scenario')
    return {
      timeoutMs: Math.min(runBudget.actionMs, runBudget.remainingMs() || runBudget.actionMs),
      signal: validated.signal,
      settleMs: runBudget.settleMs,
      budget: runBudget,
      localApiOrigin: store.localApiOrigin,
      store,
    }
  }
  const sessionOpts = () => ({ store, budget: runBudget })
  const actor = validated.accounts[PRIVILEGED_ACTOR]
  const gates = []
  let ownershipUncertain = false

  const push = (gate) => {
    if (gate.ownershipUncertain) ownershipUncertain = true
    const { ownershipUncertain: _drop, ...publicGate } = gate
    gates.push(publicGate)
    return publicGate
  }

  let app = await validated.useApp({ countsEnabled: true })

  push(
    await runNamedGate('G6_login_ui_password', async () =>
      runBudget.scenario('G6_login_ui_password', () =>
        withBrowserSession(validated, VIEWPORTS.desktop, async (browserContext) => {
          const page = await openPage(browserContext)
          return runG6Login(page, app.origin, actor, store, timingFor())
        }, sessionOpts()),
      ),
    { secrets: secrets() }),
  )

  const sequential = [
    ['G7_aal1_denied_step_up', ['G6_login_ui_password'], async () => {
      return withBrowserSession(validated, VIEWPORTS.desktop, async (browserContext) => {
        const page = await openPage(browserContext)
        await runG6Login(page, app.origin, actor, store, timingFor())
        return runG7Aal1Denial(page, app.origin, timingFor())
      }, sessionOpts())
    }],
    ['G8_totp_enroll_via_ui', ['G6_login_ui_password'], async () => {
      return withBrowserSession(validated, VIEWPORTS.desktop, async (browserContext) => {
        const page = await openPage(browserContext)
        await runG6Login(page, app.origin, actor, store, timingFor())
        return runG8Enroll(page, app.origin, store, timingFor())
      }, sessionOpts())
    }],
    ['G9_aal2_admin_counts_on', ['G8_totp_enroll_via_ui'], async () => {
      return withBrowserSession(validated, VIEWPORTS.desktop, async (browserContext) => {
        const page = await openPage(browserContext)
        await privilegedLoginAndMaybeStepUp(page, app.origin, actor, store, timingFor(), { stepUp: false })
        return runG9Aal2CountsOn(page, app.origin, store, validated, timingFor())
      }, sessionOpts())
    }],
    ['G10_existing_factor_fresh_session', ['G8_totp_enroll_via_ui'], async () => {
      return withBrowserSession(validated, VIEWPORTS.desktop, async (browserContext) => {
        const page = await openPage(browserContext)
        store.clickedEnrollOnThisPage = false
        return runG10ExistingFactor(page, app.origin, actor, store, timingFor())
      }, sessionOpts())
    }],
    ['G11_default_off_no_section_no_rpc', ['G9_aal2_admin_counts_on'], async () => {
      return withFixtureRestore(
        async () => {
          app = await validated.useApp({ countsEnabled: true })
        },
        async () => {
          app = await validated.useApp({ countsEnabled: false })
          return withBrowserSession(validated, VIEWPORTS.desktop, async (browserContext) => {
            const page = await openPage(browserContext)
            await privilegedLoginAndMaybeStepUp(page, app.origin, actor, store, timingFor(), { stepUp: true })
            return runG11DefaultOff(page, app.origin, store, validated, timingFor())
          }, sessionOpts())
        },
        { budget: runBudget },
      )
    }],
    ['G12_zero_window_and_delta', ['G9_aal2_admin_counts_on'], async () => {
      app = await validated.useApp({ countsEnabled: true })
      return withBrowserSession(validated, VIEWPORTS.desktop, async (browserContext) => {
        const page = await openPage(browserContext)
        await privilegedLoginAndMaybeStepUp(page, app.origin, actor, store, timingFor(), { stepUp: true })
        return runG12ZeroAndDelta(page, app.origin, store, validated, timingFor())
      }, sessionOpts())
    }],
    ['G13_ordinary_user_no_disclosure', [], async () => {
      return withBrowserSession(validated, VIEWPORTS.desktop, async (browserContext) => {
        const page = await openPage(browserContext)
        await runG13Ordinary(page, app.origin, validated.accounts.ordinary, timingFor())
        await runG13Ordinary(page, app.origin, validated.accounts.creator, timingFor())
        return 'ordinary and creator logins did not disclose aggregates'
      }, sessionOpts())
    }],
    ['G14_unauthenticated_no_disclosure', [], async () => {
      return withBrowserSession(validated, VIEWPORTS.desktop, async (browserContext) => {
        const page = await openPage(browserContext)
        return runG14Unauthenticated(page, app.origin, timingFor())
      }, sessionOpts())
    }],
    ['G15_role_downgrade_no_disclosure', ['G10_existing_factor_fresh_session'], async () => {
      return withBrowserSession(validated, VIEWPORTS.desktop, async (browserContext) => {
        const page = await openPage(browserContext)
        await privilegedLoginAndMaybeStepUp(page, app.origin, actor, store, timingFor(), { stepUp: true })
        return runG15Downgrade(page, app.origin, validated, timingFor())
      }, sessionOpts())
    }],
    ['G16_restricted_privileged_status', ['G10_existing_factor_fresh_session'], async () => {
      return withBrowserSession(validated, VIEWPORTS.desktop, async (browserContext) => {
        const page = await openPage(browserContext)
        await privilegedLoginAndMaybeStepUp(page, app.origin, actor, store, timingFor(), { stepUp: true })
        return runG16RestrictedStatus(page, app.origin, validated, timingFor())
      }, sessionOpts())
    }],
    ['G17_missing_wrapper_unavailable', ['G10_existing_factor_fresh_session'], async () => {
      return withBrowserSession(validated, VIEWPORTS.desktop, async (browserContext) => {
        const page = await openPage(browserContext)
        await privilegedLoginAndMaybeStepUp(page, app.origin, actor, store, timingFor(), { stepUp: true })
        return runG17MissingWrapper(page, app.origin, validated, timingFor())
      }, sessionOpts())
    }],
    ['G18_desktop_mobile_ui', ['G9_aal2_admin_counts_on'], async () => {
      const desktopPath = reserveExclusiveArtifact(
        validated.evidenceDir,
        runScopedName(validated.runId, 'counts-desktop.png'),
      )
      const mobilePath = reserveExclusiveArtifact(
        validated.evidenceDir,
        runScopedName(validated.runId, 'counts-mobile.png'),
      )
      await withBrowserSession(validated, VIEWPORTS.desktop, async (browserContext) => {
        const page = await openPage(browserContext)
        await privilegedLoginAndMaybeStepUp(page, app.origin, actor, store, timingFor(), { stepUp: true })
        await runG18Viewport(page, app.origin, store, VIEWPORTS.desktop, desktopPath, timingFor())
      }, sessionOpts())
      await withBrowserSession(validated, VIEWPORTS.mobile, async (browserContext) => {
        const page = await openPage(browserContext)
        await privilegedLoginAndMaybeStepUp(page, app.origin, actor, store, timingFor(), { stepUp: true })
        await runG18Viewport(page, app.origin, store, VIEWPORTS.mobile, mobilePath, timingFor())
      }, sessionOpts())
      return 'desktop 1280x800 and mobile 390x844 count-section clips only'
    }],
    ['G19_http_boundary_same_session', ['G9_aal2_admin_counts_on'], async () => {
      return withBrowserSession(validated, VIEWPORTS.desktop, async (browserContext) => {
        const page = await openPage(browserContext)
        await privilegedLoginAndMaybeStepUp(page, app.origin, actor, store, timingFor(), { stepUp: true })
        if (!store.accessToken) {
          throw new Error('G19 requires the current session issued access token')
        }
        return runG19HttpBoundary(store, validated, validated.signal)
      }, sessionOpts())
    }],
  ]

  for (const [id, deps, fn] of sequential) {
    if (validated.signal.aborted || runBudget.remainingMs() <= 0) {
      push(makeGate(id, { result: 'NOT RUN', notes: 'context.signal aborted or overall budget exhausted' }))
      continue
    }
    if (ownershipUncertain || runBudget.isTerminal()) {
      push(makeGate(id, {
        result: 'NOT RUN',
        notes: 'prior timeout/close/restore left ownership uncertain',
      }))
      continue
    }
    const skipped = skipAfter(gates, id, deps)
    if (skipped) {
      push(skipped)
      continue
    }
    push(await runNamedGate(id, () => runBudget.scenario(id, fn), { secrets: secrets() }))
  }

  for (const handle of [...runBudget.lateHandles]) {
    try {
      await runBudget.cleanup('final.closeBrowserSession', () => validated.closeBrowserSession(handle))
      runBudget.forgetLateHandle(handle)
    } catch {
      runBudget.markTerminal('final close of a late session handle failed')
    }
  }

  assertGateSetComplete(gates)
  const runSecrets = secrets()
  const sanitizedGates = sanitizeReturnedGates(gates, runSecrets)
  let receiptFailed = false
  try {
    writeSanitizedReceipt(
      validated.evidenceDir,
      runScopedName(validated.runId, 'browser-flows-gates.json'),
      {
        contractVersion: CONTRACT_VERSION,
        agent: 'Jetnity admin account counts browser flows 1',
        generation: 1,
        runId: validated.runId,
        productHead: validated.productHead,
        implementationMetadata: staticImplementationMetadata(),
        thisInvocation: {
          kind: 'consumer-gates',
          realBrowserOrMfaExecution: 'NOT RUN',
          observedResults: sanitizedGates.map((gate) => gate.result),
        },
        implementation: IMPLEMENTATION.implementation,
        realExecution: IMPLEMENTATION.realExecution,
        runtimeIntegration: IMPLEMENTATION.runtimeIntegration,
        gates: sanitizedGates.map(({ id, result, notes }) => ({ id, result, notes })),
        notes: IMPLEMENTATION.note,
      },
      { secrets: runSecrets },
    )
  } catch {
    receiptFailed = true
  }

  const returned = receiptFailed
    ? sanitizedGates.map((gate) => ({
      ...gate,
      result: gate.result === 'PASS' ? 'FAIL' : gate.result,
      notes: gate.result === 'PASS'
        ? 'receipt write failed; PASS invalidated'
        : gate.notes,
    }))
    : sanitizedGates

  return { contractVersion: CONTRACT_VERSION, gates: sanitizeReturnedGates(returned, runSecrets) }
}

export { FLOW_GATE_IDS }
