#!/usr/bin/env node
// Actual Playwright UI login, enroll and step-up. Secrets stay in memory.

import { generateTotp, looksLikeTotpCode } from '../admin-account-counts-browser-acceptance-1/totp.mjs'
import { PATHS, SELECTORS, UI_COPY } from './constants.mjs'
import { isNumericLoopbackOrigin } from './contract.mjs'

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
  if (!isNumericLoopbackOrigin(url) && !String(url).startsWith(localApiOrigin)) return false
  return String(url).includes('/auth/v1/')
}

export function attachAuthCapture(page, store, { localApiOrigin }) {
  const onResponse = async (response) => {
    try {
      const url = response.url()
      if (!isLocalAuthResponse(url, localApiOrigin)) return
      const payload = await response.json().catch(() => null)
      const secret = extractTotpSecret(payload)
      if (secret) store.totpSecret = secret
      const token = extractAccessToken(payload)
      if (token) store.accessToken = token
    } catch {
      // Capture must never convert a later assertion into PASS.
    }
  }
  page.on('response', onResponse)
  return () => {
    if (typeof page.off === 'function') page.off('response', onResponse)
  }
}

async function visibleText(page) {
  if (typeof page.locator === 'function') {
    return page.locator('body').innerText()
  }
  return ''
}

export async function openPage(browserContext) {
  if (typeof browserContext.newPage !== 'function') {
    throw new Error('browser context must provide newPage()')
  }
  return browserContext.newPage()
}

export async function loginViaUi(page, origin, account, { timeoutMs, signal } = {}) {
  if (signal?.aborted) throw new Error('aborted before login')
  await page.goto(`${origin}${PATHS.login}`, {
    waitUntil: 'domcontentloaded',
    timeout: timeoutMs,
  })
  await page.locator(SELECTORS.loginForm).waitFor({ timeout: timeoutMs })
  const heading = await page.locator(SELECTORS.stepUpTitle).first().textContent()
  if (!String(heading ?? '').includes(UI_COPY.login)) {
    throw new Error(`login heading mismatch: ${String(heading)}`)
  }
  await page.locator(SELECTORS.loginEmail).fill(account.email)
  await page.locator(SELECTORS.loginPassword).fill(account.password)
  await page.locator(SELECTORS.loginSubmit).click()
  await page.waitForLoadState?.('domcontentloaded', { timeout: timeoutMs }).catch(() => {})
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

export async function expectOrdinaryDenial(page, { timeoutMs } = {}) {
  const deadline = Date.now() + (timeoutMs ?? 8_000)
  while (Date.now() < deadline) {
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

export async function enrollTotpViaUi(page, origin, store, { timeoutMs } = {}) {
  if (store.totpSecret && store.forceNewEnrollment) {
    throw new Error('G10/existing-factor path must not force a new enrollment')
  }
  await page.goto(`${origin}${PATHS.security}`, {
    waitUntil: 'domcontentloaded',
    timeout: timeoutMs,
  })
  const enroll = page.getByRole
    ? page.getByRole('button', { name: SELECTORS.enrollButtonText })
    : page.locator(`text=${SELECTORS.enrollButtonText}`)
  await enroll.waitFor({ timeout: timeoutMs })
  const enrollResponse = page.waitForResponse
    ? page.waitForResponse((response) => {
        const url = response.url()
        return (
          url.includes('/auth/v1/factors') &&
          !url.includes('/challenge') &&
          !url.includes('/verify') &&
          response.request().method() === 'POST'
        )
      }, { timeout: timeoutMs })
    : null
  await enroll.click()
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
  await page.locator(SELECTORS.enrollCode).fill(code)
  const confirm = page.getByRole
    ? page.getByRole('button', { name: UI_COPY.enrollConfirm })
    : page.locator(`text=${UI_COPY.enrollConfirm}`)
  await confirm.click()
  if (page.getByText) {
    await page.getByText(UI_COPY.enrollSuccess).waitFor({ timeout: timeoutMs })
  }
  store.enrolled = true
}

export async function stepUpViaExistingFactor(page, origin, store, { timeoutMs, allowEnroll = false } = {}) {
  if (!store.totpSecret) throw new Error('existing-factor step-up requires the in-memory secret')
  if (!allowEnroll && store.clickedEnrollOnThisPage) {
    throw new Error('fresh session must reuse the existing factor, not enroll again')
  }
  await page.goto(`${origin}${PATHS.stepUp}`, {
    waitUntil: 'domcontentloaded',
    timeout: timeoutMs,
  })
  const codeInput = page.locator(SELECTORS.stepUpCode)
  const visible = await codeInput.isVisible?.({ timeout: Math.min(3_000, timeoutMs ?? 3_000) }).catch(() => false)
  if (!visible) {
    const retry = page.getByRole
      ? page.getByRole('button', { name: UI_COPY.enrollRetry })
      : null
    if (retry && (await retry.isVisible?.().catch(() => false))) {
      await retry.click()
    }
  }
  await codeInput.waitFor({ timeout: timeoutMs })
  const code = generateTotp(store.totpSecret)
  if (!looksLikeTotpCode(code)) throw new Error('generated TOTP code is not 6 digits')
  await codeInput.fill(code)
  const confirm = page.getByRole
    ? page.getByRole('button', { name: UI_COPY.enrollConfirm })
    : page.locator(`text=${UI_COPY.enrollConfirm}`)
  await confirm.click()
  if (typeof page.waitForURL === 'function') {
    await page.waitForURL((url) => {
      const text = String(url)
      return text.includes(PATHS.admin) && !text.includes(PATHS.stepUp) && !text.includes(PATHS.login)
    }, { timeout: timeoutMs })
  }
}

export async function withBrowserSession(context, viewport, fn) {
  const browserContext = await context.newBrowserSession({ viewport })
  let fnError = null
  let result
  try {
    result = await fn(browserContext)
  } catch (error) {
    fnError = error
  }
  try {
    await context.closeBrowserSession(browserContext)
  } catch (closeError) {
    if (fnError) closeError.cause = fnError
    throw closeError
  }
  if (fnError) throw fnError
  return result
}

export async function withFixtureRestore(restore, fn) {
  let fnError = null
  let result
  try {
    result = await fn()
  } catch (error) {
    fnError = error
  }
  try {
    await restore()
  } catch (restoreError) {
    if (fnError) restoreError.cause = fnError
    throw restoreError
  }
  if (fnError) throw fnError
  return result
}
