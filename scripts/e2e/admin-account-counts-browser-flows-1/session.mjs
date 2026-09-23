#!/usr/bin/env node
// Actual Playwright UI login, enroll and step-up. Secrets stay in memory.

import { generateTotp, looksLikeTotpCode } from '../admin-account-counts-browser-acceptance-1/totp.mjs'
import { PATHS, SELECTORS, UI_COPY } from './constants.mjs'
import { OwnershipUncertaintyError, sameExactOrigin } from './contract.mjs'
import { requireReadyNavigation } from './navigation.mjs'

export function secretFromOtpauth(uri) {
  if (typeof uri !== 'string' || !uri.startsWith('otpauth://')) return null
  try {
    return new URL(uri).searchParams.get('secret')
  } catch {
    return null
  }
}

export function extractTotpSecret(payload) {
  if (!payload || typeof payload !== 'object') return null
  const direct = payload.totp?.secret ?? payload.secret
  if (typeof direct === 'string' && direct.trim()) return direct.trim()
  return secretFromOtpauth(payload.totp?.uri ?? payload.uri)
}

export function extractAccessToken(payload) {
  if (!payload || typeof payload !== 'object') return null
  const token = payload.access_token ?? payload.accessToken
  return typeof token === 'string' && token.trim() ? token : null
}

export function isLocalAuthResponse(url, localApiOrigin) {
  if (!sameExactOrigin(url, localApiOrigin)) return false
  try {
    const parsed = new URL(url)
    return parsed.pathname.includes('/auth/v1/')
  } catch {
    return false
  }
}

export function authCaptureKind(url) {
  try {
    const path = new URL(url).pathname
    if (path.includes('/auth/v1/token')) return 'token'
    if (path.includes('/auth/v1/factors') && path.includes('/verify')) return 'verify'
    if (path.includes('/auth/v1/factors') && !path.includes('/challenge') && !path.includes('/verify')) {
      return 'enroll'
    }
    return null
  } catch {
    return null
  }
}

export function isIntendedAuthResponse(response, localApiOrigin, {
  pathIncludes,
  method = 'POST',
  statuses = [200, 201],
  kinds = null,
} = {}) {
  if (!response || typeof response.url !== 'function') return false
  const url = response.url()
  if (!isLocalAuthResponse(url, localApiOrigin)) return false
  if (pathIncludes && !new URL(url).pathname.includes(pathIncludes)) return false
  if (kinds) {
    const kind = authCaptureKind(url)
    const allowed = Array.isArray(kinds) ? kinds : [kinds]
    if (!kind || !allowed.includes(kind)) return false
  }
  const observedMethod = response.request?.()?.method?.()
  if (method && observedMethod && observedMethod !== method) return false
  if (Array.isArray(statuses) && statuses.length > 0) {
    const status = typeof response.status === 'function' ? response.status() : response.status
    if (typeof status === 'number' && !statuses.includes(status)) return false
  }
  return true
}

export function payloadActorId(payload) {
  if (!payload || typeof payload !== 'object') return null
  const user = payload.user ?? payload.session?.user ?? null
  if (user && typeof user === 'object') {
    if (typeof user.id === 'string' && user.id.trim()) return user.id.trim()
  }
  if (typeof payload.user_id === 'string' && payload.user_id.trim()) return payload.user_id.trim()
  return null
}

export function payloadMatchesExpectedActor(payload, expectedActor) {
  if (!expectedActor) return false
  const actorId = payloadActorId(payload)
  if (actorId) return actorId === expectedActor.id
  const email = payload?.user?.email ?? payload?.session?.user?.email
  if (typeof email === 'string' && email.trim()) return email === expectedActor.email
  return false
}

export function isSuccessfulAuthPayload(payload, { requireToken = false, requireSecret = false } = {}) {
  if (!payload || typeof payload !== 'object') return false
  if (payload.error || payload.error_code || payload.msg === 'invalid') return false
  if (requireToken && !extractAccessToken(payload)) return false
  if (requireSecret && !extractTotpSecret(payload)) return false
  return true
}

export function beginBrowserSession(store, expectedActor = store?.expectedActor ?? null) {
  if (!store || typeof store !== 'object') return store
  store.sessionEpoch = (store.sessionEpoch ?? 0) + 1
  store.accessToken = null
  store.clickedEnrollOnThisPage = false
  if (expectedActor) store.expectedActor = expectedActor
  store.captureGeneration = store.sessionEpoch
  return store
}

export function attachAuthCapture(page, store, { localApiOrigin, expectedActor = store.expectedActor } = {}) {
  const generation = store.sessionEpoch ?? 0
  let invalidated = false
  const pending = new Set()

  const onResponse = (response) => {
    const work = (async () => {
      if (invalidated || store.sessionEpoch !== generation) return
      if (!isIntendedAuthResponse(response, localApiOrigin, {
        method: 'POST',
        kinds: ['token', 'enroll', 'verify'],
      })) {
        return
      }
      const kind = authCaptureKind(response.url())
      const payload = await response.json().catch(() => null)
      if (invalidated || store.sessionEpoch !== generation) return
      if (kind === 'enroll') {
        if (!isSuccessfulAuthPayload(payload, { requireSecret: true })) return
        const secret = extractTotpSecret(payload)
        if (secret) store.totpSecret = secret
        return
      }
      if (!isSuccessfulAuthPayload(payload, { requireToken: true })) return
      if (!payloadMatchesExpectedActor(payload, expectedActor ?? store.expectedActor)) return
      const token = extractAccessToken(payload)
      if (token) store.accessToken = token
    })().catch(() => {})
    pending.add(work)
    work.finally(() => pending.delete(work))
  }

  page.on('response', onResponse)

  const detach = async () => {
    invalidated = true
    if (typeof page.off === 'function') page.off('response', onResponse)
    else if (typeof page.removeListener === 'function') page.removeListener('response', onResponse)
    pending.clear()
  }
  return detach
}

async function visibleText(page) {
  if (typeof page.locator === 'function') {
    return page.locator('body').innerText()
  }
  return ''
}

async function boundAction(timing, label, fn) {
  if (timing?.budget?.action) {
    return timing.budget.action(label, fn)
  }
  if (timing?.signal?.aborted) {
    throw new Error(`aborted during ${label}`)
  }
  return fn(timing?.timeoutMs)
}

export async function openPage(browserContext) {
  if (typeof browserContext.newPage !== 'function') {
    throw new Error('browser context must provide newPage()')
  }
  return browserContext.newPage()
}

export async function loginViaUi(page, origin, account, timing = {}) {
  if (timing.signal?.aborted) throw new Error('aborted before login')
  const loginNav = await boundAction(timing, 'login.goto', (timeoutMs) =>
    page.goto(`${origin}${PATHS.login}`, {
      waitUntil: 'domcontentloaded',
      timeout: timeoutMs,
    }),
  )
  requireReadyNavigation(loginNav, {
    expectedOrigin: origin,
    pageUrl: typeof page.url === 'function' ? page.url() : undefined,
  })
  await boundAction(timing, 'login.form', (timeoutMs) =>
    page.locator(SELECTORS.loginForm).waitFor({ timeout: timeoutMs }),
  )
  const heading = await page.locator(SELECTORS.stepUpTitle).first().textContent()
  if (!String(heading ?? '').includes(UI_COPY.login)) {
    throw new Error(`login heading mismatch: ${String(heading)}`)
  }
  const expectedActor = timing.expectedActor ?? timing.store?.expectedActor ?? account
  const tokenWait = typeof page.waitForResponse === 'function'
    ? page.waitForResponse((response) => (
      isIntendedAuthResponse(response, timing.localApiOrigin ?? origin, {
        pathIncludes: '/auth/v1/token',
        method: 'POST',
      })
    ), { timeout: timing.timeoutMs }).catch(() => null)
    : null
  await boundAction(timing, 'login.email', (timeoutMs) =>
    page.locator(SELECTORS.loginEmail).fill(account.email, { timeout: timeoutMs }),
  )
  await boundAction(timing, 'login.password', (timeoutMs) =>
    page.locator(SELECTORS.loginPassword).fill(account.password, { timeout: timeoutMs }),
  )
  await boundAction(timing, 'login.submit', (timeoutMs) =>
    page.locator(SELECTORS.loginSubmit).click({ timeout: timeoutMs }),
  )
  if (tokenWait) {
    const response = await tokenWait
    if (!response) {
      if (timing.store) timing.store.accessToken = null
    } else {
      const payload = await response.json().catch(() => null)
      if (
        isSuccessfulAuthPayload(payload, { requireToken: true })
        && payloadMatchesExpectedActor(payload, expectedActor)
        && timing.store
      ) {
        timing.store.accessToken = extractAccessToken(payload)
      } else if (timing.store) {
        timing.store.accessToken = null
      }
    }
  }
  await page.waitForLoadState?.('domcontentloaded', { timeout: timing.timeoutMs }).catch(() => {})
}

export async function expectPrivilegedAal1(page, { timeoutMs } = {}) {
  if (typeof page.waitForURL === 'function') {
    await page.waitForURL((url) => String(url).includes(PATHS.stepUp), { timeout: timeoutMs })
  }
  const url = typeof page.url === 'function' ? page.url() : ''
  if (!String(url).includes(PATHS.stepUp)) {
    const text = await visibleText(page)
    if (text.includes(UI_COPY.ordinaryDenied)) {
      throw new Error('privileged login was treated as an ordinary denial')
    }
    throw new Error(`expected AAL1 step-up at ${PATHS.stepUp}, landed on ${url}`)
  }
  const heading = await page.locator(SELECTORS.stepUpTitle).first().textContent()
  if (!String(heading ?? '').includes(UI_COPY.stepUp)) {
    throw new Error(`step-up heading mismatch: ${String(heading)}`)
  }
}

export async function expectOrdinaryDenial(page, { timeoutMs, signal } = {}) {
  const deadline = Date.now() + (timeoutMs ?? 8_000)
  while (Date.now() < deadline) {
    if (signal?.aborted) throw new Error('aborted while waiting for ordinary denial')
    const url = typeof page.url === 'function' ? page.url() : ''
    const text = await visibleText(page)
    if (text.includes(UI_COPY.ordinaryDenied)) return { kind: 'login-denied' }
    if (String(url).includes(PATHS.unauthorized)) return { kind: 'unauthorized' }
    if (String(url).includes(PATHS.login) && text.includes(UI_COPY.ordinaryDenied)) {
      return { kind: 'login-denied' }
    }
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  throw new Error('ordinary/creator login did not produce an honest denial')
}

export async function enrollTotpViaUi(page, origin, store, timing = {}) {
  if (store.totpSecret && store.forceNewEnrollment) {
    throw new Error('G10/existing-factor path must not force a new enrollment')
  }
  const enrollNav = await boundAction(timing, 'enroll.goto', (timeoutMs) =>
    page.goto(`${origin}${PATHS.security}`, {
      waitUntil: 'domcontentloaded',
      timeout: timeoutMs,
    }),
  )
  requireReadyNavigation(enrollNav, {
    expectedOrigin: origin,
    pageUrl: typeof page.url === 'function' ? page.url() : undefined,
  })
  const enroll = page.getByRole
    ? page.getByRole('button', { name: SELECTORS.enrollButtonText })
    : page.locator(`text=${SELECTORS.enrollButtonText}`)
  await boundAction(timing, 'enroll.button', (timeoutMs) => enroll.waitFor({ timeout: timeoutMs }))
  const enrollResponse = typeof page.waitForResponse === 'function'
    ? page.waitForResponse((response) => (
      isIntendedAuthResponse(response, store.localApiOrigin, {
        pathIncludes: '/auth/v1/factors',
        method: 'POST',
      })
      && !new URL(response.url()).pathname.includes('/challenge')
      && !new URL(response.url()).pathname.includes('/verify')
    ), { timeout: timing.timeoutMs })
    : null
  await boundAction(timing, 'enroll.click', (timeoutMs) => enroll.click({ timeout: timeoutMs }))
  if (enrollResponse) {
    const response = await enrollResponse
    const payload = await response.json().catch(() => null)
    const secret = extractTotpSecret(payload)
    if (secret) store.totpSecret = secret
  }
  if (!store.totpSecret) {
    throw new Error('enrollment response did not yield an in-memory TOTP secret')
  }
  const code = generateTotp(store.totpSecret)
  if (!looksLikeTotpCode(code)) throw new Error('generated TOTP code is not 6 digits')
  await boundAction(timing, 'enroll.code', (timeoutMs) =>
    page.locator(SELECTORS.enrollCode).fill(code, { timeout: timeoutMs }),
  )
  const confirm = page.getByRole
    ? page.getByRole('button', { name: UI_COPY.enrollConfirm })
    : page.locator(`text=${UI_COPY.enrollConfirm}`)
  const verifyResponse = typeof page.waitForResponse === 'function'
    ? page.waitForResponse((response) => (
      isIntendedAuthResponse(response, store.localApiOrigin, {
        pathIncludes: '/verify',
        method: 'POST',
      })
    ), { timeout: timing.timeoutMs }).catch(() => null)
    : null
  await boundAction(timing, 'enroll.confirm', (timeoutMs) => confirm.click({ timeout: timeoutMs }))
  if (verifyResponse) {
    const response = await verifyResponse
    if (!response) {
      store.accessToken = null
    } else {
      const payload = await response.json().catch(() => null)
      const expectedActor = timing.expectedActor ?? store.expectedActor
      if (isSuccessfulAuthPayload(payload, { requireToken: true }) && payloadMatchesExpectedActor(payload, expectedActor)) {
        store.accessToken = extractAccessToken(payload)
      } else {
        store.accessToken = null
      }
    }
  }
  if (page.getByText) {
    await boundAction(timing, 'enroll.success', (timeoutMs) =>
      page.getByText(UI_COPY.enrollSuccess).waitFor({ timeout: timeoutMs }),
    )
  }
  store.enrolled = true
}

export async function stepUpViaExistingFactor(page, origin, store, timing = {}) {
  const { allowEnroll = false } = timing
  if (!store.totpSecret) throw new Error('existing-factor step-up requires the in-memory secret')
  if (!allowEnroll && store.clickedEnrollOnThisPage) {
    throw new Error('fresh session must reuse the existing factor, not enroll again')
  }
  const stepUpNav = await boundAction(timing, 'stepUp.goto', (timeoutMs) =>
    page.goto(`${origin}${PATHS.stepUp}`, {
      waitUntil: 'domcontentloaded',
      timeout: timeoutMs,
    }),
  )
  requireReadyNavigation(stepUpNav, {
    expectedOrigin: origin,
    pageUrl: typeof page.url === 'function' ? page.url() : undefined,
  })
  const codeInput = page.locator(SELECTORS.stepUpCode)
  const visible = await codeInput.isVisible?.({ timeout: Math.min(3_000, timing.timeoutMs ?? 3_000) }).catch(() => false)
  if (!visible) {
    const retry = page.getByRole
      ? page.getByRole('button', { name: UI_COPY.enrollRetry })
      : null
    if (retry && (await retry.isVisible?.().catch(() => false))) {
      await boundAction(timing, 'stepUp.retry', (timeoutMs) => retry.click({ timeout: timeoutMs }))
    }
  }
  await boundAction(timing, 'stepUp.codeWait', (timeoutMs) => codeInput.waitFor({ timeout: timeoutMs }))
  const code = generateTotp(store.totpSecret)
  if (!looksLikeTotpCode(code)) throw new Error('generated TOTP code is not 6 digits')
  await boundAction(timing, 'stepUp.code', (timeoutMs) =>
    codeInput.fill(code, { timeout: timeoutMs }),
  )
  const confirm = page.getByRole
    ? page.getByRole('button', { name: UI_COPY.enrollConfirm })
    : page.locator(`text=${UI_COPY.enrollConfirm}`)
  const verifyResponse = typeof page.waitForResponse === 'function'
    ? page.waitForResponse((response) => (
      isIntendedAuthResponse(response, store.localApiOrigin, {
        pathIncludes: '/verify',
        method: 'POST',
      })
    ), { timeout: timing.timeoutMs })
    : null
  await boundAction(timing, 'stepUp.confirm', (timeoutMs) => confirm.click({ timeout: timeoutMs }))
  if (verifyResponse) {
    const response = await verifyResponse
    if (!response) {
      store.accessToken = null
    } else {
      const payload = await response.json().catch(() => null)
      const expectedActor = timing.expectedActor ?? store.expectedActor
      if (isSuccessfulAuthPayload(payload, { requireToken: true }) && payloadMatchesExpectedActor(payload, expectedActor)) {
        store.accessToken = extractAccessToken(payload)
      } else {
        store.accessToken = null
      }
    }
  }
  if (typeof page.waitForURL === 'function') {
    await boundAction(timing, 'stepUp.admin', (timeoutMs) =>
      page.waitForURL((url) => {
        const text = String(url)
        return text.includes(PATHS.admin) && !text.includes(PATHS.stepUp) && !text.includes(PATHS.login)
      }, { timeout: timeoutMs }),
    )
  }
}

export async function withCapturedPage(browserContext, store, fn) {
  const page = await openPage(browserContext)
  const detach = attachAuthCapture(page, store, { localApiOrigin: store.localApiOrigin })
  try {
    return await fn(page)
  } finally {
    detach()
  }
}

export async function withBrowserSession(context, viewport, fn, { store, budget, expectedActor } = {}) {
  if (store) beginBrowserSession(store, expectedActor ?? store.expectedActor)
  const created = Promise.resolve().then(() => context.newBrowserSession({ viewport }))
  let browserContext
  try {
    browserContext = budget
      ? await budget.action('newBrowserSession', () => created)
      : await created
  } catch (error) {
    created.then((handle) => {
      if (!handle) return
      budget?.trackLateHandle?.(handle)
      return Promise.resolve(context.closeBrowserSession(handle)).catch(() => {})
    }).catch(() => {})
    throw error instanceof OwnershipUncertaintyError
      ? error
      : new OwnershipUncertaintyError('newBrowserSession failed; later resource-using scenarios must stop', error)
  }
  budget?.trackLateHandle?.(browserContext)
  let fnError = null
  let result
  try {
    result = await fn(browserContext)
  } catch (error) {
    fnError = error
  }
  try {
    if (budget) {
      await budget.cleanup('closeBrowserSession', () => context.closeBrowserSession(browserContext))
    } else {
      await context.closeBrowserSession(browserContext)
    }
    budget?.forgetLateHandle?.(browserContext)
  } catch (closeError) {
    budget?.markTerminal?.('closeBrowserSession failed')
    const wrapped = new OwnershipUncertaintyError(
      'closeBrowserSession failed; later resource-using scenarios must stop',
      closeError,
    )
    if (fnError) wrapped.cause = closeError
    throw wrapped
  }
  if (fnError) throw fnError
  return result
}

export async function withFixtureRestore(restore, fn, { budget } = {}) {
  let fnError = null
  let result
  try {
    result = await fn()
  } catch (error) {
    fnError = error
  }
  try {
    if (budget) {
      await budget.cleanup('fixture.restore', () => restore())
    } else {
      await restore()
    }
  } catch (restoreError) {
    budget?.markTerminal?.('fixture restore failed')
    throw new OwnershipUncertaintyError(
      'fixture restore failed; later resource-using scenarios must stop',
      restoreError,
    )
  }
  if (fnError) throw fnError
  return result
}
