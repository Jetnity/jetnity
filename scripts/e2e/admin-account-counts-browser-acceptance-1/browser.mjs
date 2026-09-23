#!/usr/bin/env node
// Real application path. Login UI, request cookies, unchanged guard/reader.
// No mocked Auth, no injected session cookie, no response substitution.

import { COPY, SELECTORS, WRAPPER_RPC } from './constants.mjs'

export function beobachteRpcOhneSubstitution(page, observer) {
  page.on('request', (request) => {
    const url = request.url()
    if (url.includes(`/rest/v1/rpc/${WRAPPER_RPC}`) || url.includes(WRAPPER_RPC)) {
      observer.rpcRequests += 1
      observer.methods.push(request.method())
    }
  })
  page.on('response', (response) => {
    const url = response.url()
    if (url.includes(`/rest/v1/rpc/${WRAPPER_RPC}`) || url.includes(WRAPPER_RPC)) {
      observer.rpcStatuses.push(response.status())
    }
  })
  return observer
}

export function neuerObserver() {
  return { rpcRequests: 0, methods: [], rpcStatuses: [] }
}

export const VIEWPORTS = Object.freeze({
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
})

export function screenshotPolicy() {
  return {
    allowed: 'final non-secret Admin UI after AAL2, and scoped desktop/mobile count section',
    forbidden: [
      'QR codes',
      'otpauth strings',
      'TOTP secrets',
      'cookies',
      'raw JWT',
      'passwords',
      'email+code together',
    ],
    redact: 'clip to the counts section when possible; never capture #totp-code or QR img',
  }
}

export const FLOW = Object.freeze({
  login: {
    path: '/admin/login',
    selectors: SELECTORS,
    expectedHeading: COPY.login,
  },
  stepUp: {
    path: '/admin/mfa',
    expectedHeading: COPY.stepUp,
    codeSelector: SELECTORS.stepUpCode,
  },
  enroll: {
    path: '/account/security',
    buttonText: SELECTORS.enrollButtonText,
    codeSelector: SELECTORS.enrollCode,
    captureSecretFromEnrollResponseReadOnly: true,
    noQrScreenshot: true,
  },
  adminHome: {
    path: '/admin',
    countsTitle: COPY.countsTitle,
    present: SELECTORS.countsPresent,
    window: SELECTORS.countsWindow,
    forbiddenCopy: COPY.forbidden,
    unavailableCopy: COPY.unavailable,
    failedCopy: COPY.failed,
  },
})

export async function fuehreBrowserAkzeptanz() {
  throw new Error(
    'Browser acceptance is not invoked without the owned local application and Auth stack. A Playwright about:blank preflight is not browser acceptance.',
  )
}
