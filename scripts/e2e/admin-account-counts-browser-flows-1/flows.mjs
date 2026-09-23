#!/usr/bin/env node
// Browser-flow consumer for G6–G19. Runtime #558 owns stack, observer and verdict.

import { join } from 'node:path'

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
  assertGateSetComplete,
  budgets,
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
  parseCountDelta,
  screenshotCountSection,
  sectionPresent,
} from './counts.mjs'
import { writeSanitizedReceipt } from './evidence.mjs'
import {
  assertDeniedWrapper,
  assertPermittedWrapper,
  callLocalWrapper,
} from './http.mjs'
import {
  assertNoWrapperCalls,
  assertObservedWrapper,
  waitForRequestsToSettle,
} from './observer.mjs'
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

async function runNamedGate(id, fn, { evidence = null } = {}) {
  try {
    const notes = await fn()
    return makeGate(id, {
      result: 'PASS',
      evidence,
      notes: typeof notes === 'string' ? notes : notes?.notes ?? null,
    })
  } catch (error) {
    return makeGate(id, {
      result: 'FAIL',
      evidence: null,
      notes: error instanceof Error ? error.message : String(error),
    })
  }
}

async function privilegedLoginAndMaybeStepUp(page, origin, account, store, timing, { stepUp = false } = {}) {
  attachAuthCapture(page, store, { localApiOrigin: store.localApiOrigin })
  await loginViaUi(page, origin, account, timing)
  if (stepUp) {
    await stepUpViaExistingFactor(page, origin, store, timing)
  } else {
    await expectPrivilegedAal1(page, timing)
  }
}

export async function runG6Login(page, origin, account, store, timing) {
  attachAuthCapture(page, store, { localApiOrigin: store.localApiOrigin })
  await loginViaUi(page, origin, account, timing)
  await expectPrivilegedAal1(page, timing)
  return 'UI password login reached the real AAL1 step-up route'
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
  await assertNoCountDisclosure(page)
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
  await assertDefinitionAndWindow(page)
  assertObservedWrapper(context.rpcObserver.since(mark))
  store.positiveRpcControl = true
  store.lastExpected = expected
  return 'AAL2 Admin counts matched independent fixture counts and an observed RPC'
}

export async function runG10ExistingFactor(page, origin, account, store, timing) {
  if (!store.totpSecret) throw new Error('existing factor secret missing')
  attachAuthCapture(page, store, { localApiOrigin: store.localApiOrigin })
  await loginViaUi(page, origin, account, timing)
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
  await assertNoCountDisclosure(page)
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
  await assertCountsMatchExpected(page, one)
  const present = parseCountDelta(zero.present, one.present)
  const recent = parseCountDelta(zero.recent, one.recent)
  if (present.presentDelta !== 1n || recent.presentDelta !== 1n) {
    throw new Error(
      `expected +1/+1 present/recent, got ${present.presentDelta}/${recent.presentDelta}`,
    )
  }
  store.lastExpected = one
  return 'zero-window then one-recent produced an independent +1/+1 against the 720h metric'
}

export async function runG13Ordinary(page, origin, account, timing) {
  await loginViaUi(page, origin, account, timing)
  await expectOrdinaryDenial(page, timing)
  await page.goto(`${origin}${PATHS.admin}`, {
    waitUntil: 'domcontentloaded',
    timeout: timing.timeoutMs,
  })
  await assertNoCountDisclosure(page, { allowForbidden: true })
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
  await assertNoCountDisclosure(page)
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
      await assertNoCountDisclosure(page, { allowForbidden: true })
      return 'same privileged session was denied after fixture role downgrade'
    },
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
        const denial = await assertNoCountDisclosure(page, { allowForbidden: true })
        if (denial.kind === 'failed') {
          throw new Error(`${status} produced a generic failed state, not a status denial`)
        }
      }
      await context.fixture.setStatus(PRIVILEGED_ACTOR, 'active')
      return 'banned/disabled/pending privileged status denied counts; active restored'
    },
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
      await assertUnavailableNotZero(page)
      return 'missing wrapper rendered unavailable, not 0 accounts'
    },
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
  await assertDefinitionAndWindow(page)
  await assertNoHorizontalOverflow(page, viewport)
  await screenshotCountSection(page, evidencePath)
  return `${viewport.width}x${viewport.height} count section visible without overflow`
}

export async function runG19HttpBoundary(store, context, signal) {
  if (!store.accessToken) {
    throw new Error('G19 requires an in-memory GoTrue access token from the real browser flow')
  }
  const permitted = await callLocalWrapper({
    localApi: context.localApi,
    accessToken: store.accessToken,
    signal,
  })
  assertPermittedWrapper(permitted)
  const unauthenticated = await callLocalWrapper({
    localApi: context.localApi,
    accessToken: null,
    signal,
  })
  assertDeniedWrapper(unauthenticated)
  await withFixtureRestore(
    () => context.fixture.setStatus(PRIVILEGED_ACTOR, 'active'),
    async () => {
      await context.fixture.setStatus(PRIVILEGED_ACTOR, 'banned')
      const banned = await callLocalWrapper({
        localApi: context.localApi,
        accessToken: store.accessToken,
        signal,
      })
      assertDeniedWrapper(banned)
    },
  )
  return 'same-session local wrapper permitted the actor and denied unauthenticated/banned callers'
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
  }
  const timingFor = () => {
    const budget = budgets(validated)
    return { timeoutMs: budget.actionMs, signal: validated.signal, settleMs: budget.settleMs }
  }
  const actor = validated.accounts[PRIVILEGED_ACTOR]
  const gates = []

  const push = (gate) => {
    gates.push(gate)
    return gate
  }

  let app = await validated.useApp({ countsEnabled: true })

  push(
    await runNamedGate('G6_login_ui_password', async () =>
      withBrowserSession(validated, VIEWPORTS.desktop, async (browserContext) => {
        const page = await openPage(browserContext)
        return runG6Login(page, app.origin, actor, store, timingFor())
      }),
    ),
  )

  const sequential = [
    ['G7_aal1_denied_step_up', ['G6_login_ui_password'], async () => {
      return withBrowserSession(validated, VIEWPORTS.desktop, async (browserContext) => {
        const page = await openPage(browserContext)
        await runG6Login(page, app.origin, actor, store, timingFor())
        return runG7Aal1Denial(page, app.origin, timingFor())
      })
    }],
    ['G8_totp_enroll_via_ui', ['G6_login_ui_password'], async () => {
      return withBrowserSession(validated, VIEWPORTS.desktop, async (browserContext) => {
        const page = await openPage(browserContext)
        await runG6Login(page, app.origin, actor, store, timingFor())
        return runG8Enroll(page, app.origin, store, timingFor())
      })
    }],
    ['G9_aal2_admin_counts_on', ['G8_totp_enroll_via_ui'], async () => {
      return withBrowserSession(validated, VIEWPORTS.desktop, async (browserContext) => {
        const page = await openPage(browserContext)
        await privilegedLoginAndMaybeStepUp(page, app.origin, actor, store, timingFor(), { stepUp: false })
        return runG9Aal2CountsOn(page, app.origin, store, validated, timingFor())
      })
    }],
    ['G10_existing_factor_fresh_session', ['G8_totp_enroll_via_ui'], async () => {
      return withBrowserSession(validated, VIEWPORTS.desktop, async (browserContext) => {
        const page = await openPage(browserContext)
        store.clickedEnrollOnThisPage = false
        return runG10ExistingFactor(page, app.origin, actor, store, timingFor())
      })
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
          })
        },
      )
    }],
    ['G12_zero_window_and_delta', ['G9_aal2_admin_counts_on'], async () => {
      app = await validated.useApp({ countsEnabled: true })
      return withBrowserSession(validated, VIEWPORTS.desktop, async (browserContext) => {
        const page = await openPage(browserContext)
        await privilegedLoginAndMaybeStepUp(page, app.origin, actor, store, timingFor(), { stepUp: true })
        return runG12ZeroAndDelta(page, app.origin, store, validated, timingFor())
      })
    }],
    ['G13_ordinary_user_no_disclosure', [], async () => {
      return withBrowserSession(validated, VIEWPORTS.desktop, async (browserContext) => {
        const page = await openPage(browserContext)
        await runG13Ordinary(page, app.origin, validated.accounts.ordinary, timingFor())
        await runG13Ordinary(page, app.origin, validated.accounts.creator, timingFor())
        return 'ordinary and creator logins did not disclose aggregates'
      })
    }],
    ['G14_unauthenticated_no_disclosure', [], async () => {
      return withBrowserSession(validated, VIEWPORTS.desktop, async (browserContext) => {
        const page = await openPage(browserContext)
        return runG14Unauthenticated(page, app.origin, timingFor())
      })
    }],
    ['G15_role_downgrade_no_disclosure', ['G10_existing_factor_fresh_session'], async () => {
      return withBrowserSession(validated, VIEWPORTS.desktop, async (browserContext) => {
        const page = await openPage(browserContext)
        await privilegedLoginAndMaybeStepUp(page, app.origin, actor, store, timingFor(), { stepUp: true })
        return runG15Downgrade(page, app.origin, validated, timingFor())
      })
    }],
    ['G16_restricted_privileged_status', ['G10_existing_factor_fresh_session'], async () => {
      return withBrowserSession(validated, VIEWPORTS.desktop, async (browserContext) => {
        const page = await openPage(browserContext)
        await privilegedLoginAndMaybeStepUp(page, app.origin, actor, store, timingFor(), { stepUp: true })
        return runG16RestrictedStatus(page, app.origin, validated, timingFor())
      })
    }],
    ['G17_missing_wrapper_unavailable', ['G10_existing_factor_fresh_session'], async () => {
      return withBrowserSession(validated, VIEWPORTS.desktop, async (browserContext) => {
        const page = await openPage(browserContext)
        await privilegedLoginAndMaybeStepUp(page, app.origin, actor, store, timingFor(), { stepUp: true })
        return runG17MissingWrapper(page, app.origin, validated, timingFor())
      })
    }],
    ['G18_desktop_mobile_ui', ['G9_aal2_admin_counts_on'], async () => {
      const desktopPath = join(validated.evidenceDir, 'counts-desktop.png')
      const mobilePath = join(validated.evidenceDir, 'counts-mobile.png')
      await withBrowserSession(validated, VIEWPORTS.desktop, async (browserContext) => {
        const page = await openPage(browserContext)
        await privilegedLoginAndMaybeStepUp(page, app.origin, actor, store, timingFor(), { stepUp: true })
        await runG18Viewport(page, app.origin, store, VIEWPORTS.desktop, desktopPath, timingFor())
      })
      await withBrowserSession(validated, VIEWPORTS.mobile, async (browserContext) => {
        const page = await openPage(browserContext)
        await privilegedLoginAndMaybeStepUp(page, app.origin, actor, store, timingFor(), { stepUp: true })
        await runG18Viewport(page, app.origin, store, VIEWPORTS.mobile, mobilePath, timingFor())
      })
      return 'desktop 1280x800 and mobile 390x844 count-section clips only'
    }],
    ['G19_http_boundary_same_session', ['G9_aal2_admin_counts_on'], async () => {
      return runG19HttpBoundary(store, validated, validated.signal)
    }],
  ]

  for (const [id, deps, fn] of sequential) {
    if (validated.signal.aborted) {
      push(makeGate(id, { result: 'NOT RUN', notes: 'context.signal aborted' }))
      continue
    }
    const skipped = skipAfter(gates, id, deps)
    if (skipped) {
      push(skipped)
      continue
    }
    push(await runNamedGate(id, fn))
  }

  assertGateSetComplete(gates)
  try {
    writeSanitizedReceipt(validated.evidenceDir, 'browser-flows-gates.json', {
      contractVersion: CONTRACT_VERSION,
      agent: 'Jetnity admin account counts browser flows 1',
      generation: 1,
      runId: validated.runId,
      productHead: validated.productHead,
      implementation: IMPLEMENTATION.implementation,
      realExecution: IMPLEMENTATION.realExecution,
      runtimeIntegration: IMPLEMENTATION.runtimeIntegration,
      gates: gates.map(({ id, result, notes }) => ({ id, result, notes })),
      notes: IMPLEMENTATION.note,
    })
  } catch (error) {
    const last = gates[gates.length - 1]
    if (last) last.notes = `${last.notes ?? ''} receipt: ${error.message}`.trim()
  }

  return { contractVersion: CONTRACT_VERSION, gates }
}

export { FLOW_GATE_IDS }
