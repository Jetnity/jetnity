#!/usr/bin/env node
// Planned real application path. Login UI, request cookies, unchanged guard/reader.
// Page request events cannot prove server-side RPC absence. Server-boundary
// observation is NOT IMPLEMENTED. No mocked Auth, no injected session cookie.

import { COPY, SELECTORS, WRAPPER_RPC } from './constants.mjs'
import { IMPLEMENTATION, notImplementedError } from './implementation.mjs'

export const SERVER_RPC_OBSERVATION = Object.freeze({
  status: IMPLEMENTATION.serverRpcObservation,
  reason:
    'Admin counts are produced by a server-side reader. Playwright page request events cannot establish server-side OFF/no-RPC. A future claim needs an observer at the actual server/HTTP boundary, a positive observed-call control, and no response substitution.',
})

export function kannServerSeitigesRpcSchweigenBeweisen() {
  return false
}

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
  observer.canProveServerSideAbsence = false
  observer.limitation = SERVER_RPC_OBSERVATION
  return observer
}

export function neuerObserver() {
  return {
    rpcRequests: 0,
    methods: [],
    rpcStatuses: [],
    canProveServerSideAbsence: false,
    limitation: SERVER_RPC_OBSERVATION,
  }
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
    execution: IMPLEMENTATION.browserAcceptance,
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
  throw notImplementedError('Browser acceptance')
}
