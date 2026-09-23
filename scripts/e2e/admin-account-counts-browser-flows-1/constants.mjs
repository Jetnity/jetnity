#!/usr/bin/env node
// Own labels plus accepted #556 selectors/copy/pins. Product/Auth stay read-only.

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  BLOB_PINS,
  COPY,
  PINS,
  SELECTORS,
  SOURCE_PATHS,
  WRAPPER_RPC,
} from '../admin-account-counts-browser-acceptance-1/constants.mjs'
import { GATE_IDS } from '../admin-account-counts-browser-acceptance-1/gates.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
export const FLOWS_DIR = HERE
export const ROOT = join(HERE, '../../..')

export const AGENT = 'Jetnity admin account counts browser flows 1'
export const GENERATION = 1
export const TASK = 'docs/ADMIN_ACCOUNT_COUNTS_BROWSER_FLOWS_1_TASK_2026-09-23.md'
export const TASK_SEED = '58afaa15d15dce87c180f4f0eb73b8dc248e896e'
export const PRODUCT_BASELINE = 'fa7f651c023eb361fb142cbb931bc702f3a3d213'
export const BRANCH = 'test/admin-account-counts-browser-flows-1'
export const CONTRACT_VERSION = 'jetnity.account-counts.local-acceptance.v1'
export const DEFINITION_VERSION = 'jetnity.admin-account-counts.v1'
export const WINDOW_HOURS = 720

export const FLOW_GATE_IDS = Object.freeze(
  GATE_IDS.filter((id) => {
    const match = /^G(\d+)_/.exec(id)
    if (!match) return false
    const n = Number(match[1])
    return n >= 6 && n <= 19
  }),
)

export const GATE_RESULTS = Object.freeze(['PASS', 'FAIL', 'BLOCKED', 'NOT RUN'])

export const ACTOR_KEYS = Object.freeze(['owner', 'moderator', 'ordinary', 'creator'])
export const PRIVILEGED_ACTOR = 'owner'
export const ROLE_DOWNGRADE = 'user'
export const RESTRICTED_STATUSES = Object.freeze(['banned', 'disabled', 'pending'])
export const ACTIVE_STATUS = 'active'

export const VIEWPORTS = Object.freeze({
  desktop: { width: 1280, height: 800 },
  mobile: { width: 390, height: 844 },
})

export const PATHS = Object.freeze({
  login: '/admin/login',
  stepUp: '/admin/mfa',
  admin: '/admin',
  security: '/account/security',
  unauthorized: '/unauthorized',
})

export {
  BLOB_PINS,
  COPY,
  PINS,
  SELECTORS,
  SOURCE_PATHS,
  WRAPPER_RPC,
}

export const COUNT_VALUE_SELECTORS = Object.freeze({
  present: '[aria-labelledby="admin-account-counts-present"]',
  window: '[aria-labelledby="admin-account-counts-window"]',
  section: '[aria-labelledby="admin-account-counts-titel"]',
})

export const UI_COPY = Object.freeze({
  ...COPY,
  enrollSuccess: 'Authenticator-App erfolgreich aktiviert.',
  stepUpDialogTitle: 'Bestätige deinen TOTP-Code',
  noFactor: 'Für diesen Zugang fehlt ein bestätigter Authenticator',
  ordinaryDenied: 'Dieses Konto hat keinen Zugang zur Administration.',
  enrollConfirm: 'Bestätigen',
  enrollRetry: 'Code erneut anfordern',
  windowHours: `Neu in den letzten ${WINDOW_HOURS} Stunden`,
  windowExact: `genau ${WINDOW_HOURS} Stunden, halboffen`,
  measuredLabel: 'Stand der Datenbankuhr',
  windowStartLabel: 'Fensterbeginn',
  adminShellTitle: 'Operative Lage',
  adminShellKicker: 'Steuerzentrale',
  adminShellAria: 'Jetnity Admin',
})

export const FORBIDDEN_CONTEXT_KEYS = Object.freeze([
  'injectCookies',
  'injectStorageState',
  'storageState',
  'forgeAal2',
  'fakeAal2',
  'fakeMode',
  'mockAuth',
  'fulfillAuth',
  'addCookies',
  'setCookies',
  'routeFulfillment',
  'serviceRoleKey',
  'service_role',
  'databaseUrl',
  'DATABASE_URL',
])

export const SECRET_FIELD_NAMES = Object.freeze([
  'password',
  'secret',
  'totpSecret',
  'accessToken',
  'refreshToken',
  'otpauth',
  'qr_code',
  'qrCode',
  'cookie',
  'cookies',
  'authorization',
  'storageState',
  'har',
  'trace',
])

export const RPC_PATH_MARKERS = Object.freeze([
  `/rest/v1/rpc/${WRAPPER_RPC}`,
  `/rpc/${WRAPPER_RPC}`,
  WRAPPER_RPC,
])
