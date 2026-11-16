// Synthetic IO for the mounted display proof only. Not imported by any product
// entry point. No cookies, tokens, hosted users or network clients are created.
import type { UiSprache } from '@/lib/localization/ui-sprache'

type Factor = { id: string; factor_type: 'totp'; status: 'verified' | 'unverified'; friendly_name: string; created_at: string }
export type SecurityScenario = 'ready' | 'signedOut' | 'retry' | 'empty' | 'logoutFailure' | 'stepUp' | 'unsupported'
export type SecurityFixtureBoot = { sprache: UiSprache; scenario: SecurityScenario }
export type SecurityFixtureCall = { operation: string; input?: unknown }
export type SecurityFixtureControl = { calls: SecurityFixtureCall[]; holdVerify: boolean; releaseVerify: (() => void) | null }

declare global {
  interface Window {
    __securityFixtureBoot: SecurityFixtureBoot
    __securityDisplay: SecurityFixtureControl
    __securityIsolationViolations: string[]
  }
}

const boot = window.__securityFixtureBoot
if (!boot || !['de', 'en'].includes(boot.sprache)) throw new Error('Missing synthetic security display fixture')
const control: SecurityFixtureControl = { calls: [], holdVerify: false, releaseVerify: null }
window.__securityDisplay = control
let signedIn = boot.scenario !== 'signedOut'
let level: 'aal1' | 'aal2' = 'aal1'
let listReads = 0
let factors: Factor[] = ['ready', 'stepUp', 'logoutFailure'].includes(boot.scenario)
  ? [{ id: 'fixture-factor', factor_type: 'totp', status: 'verified', friendly_name: 'Authenticator-App', created_at: '2026-11-01T12:00:00.000Z' }]
  : []
const user = { id: 'fixture-user', email: 'fixture@example.invalid' }
const rawFailure = 'network error: secret=FIXTURE-DIAGNOSTIC-MUST-NOT-RENDER'
const record = (operation: string, input?: unknown) => { control.calls.push({ operation, ...(input === undefined ? {} : { input }) }) }
const client = {
  auth: {
    async getUser() {
      record('getUser')
      return { data: { user: signedIn ? user : null }, error: null }
    },
    async getSession() {
      record('getSession')
      return { data: { session: signedIn ? { expires_at: Math.floor(Date.now() / 1000) + 1800 } : null }, error: null }
    },
    async reauthenticate() { record('reauthenticate'); return { error: null } },
    async updateUser(input: { password: string; nonce: string }) { record('updateUser', input); return { data: { user }, error: null } },
    async signOut(input: { scope: 'local' | 'others' | 'global' }) {
      record('signOut', input)
      if (boot.scenario === 'logoutFailure') return { error: { message: rawFailure } }
      if (input.scope !== 'others') signedIn = false
      return { error: null }
    },
    async refreshSession() {
      record('refreshSession')
      level = factors.some((factor) => factor.status === 'verified') ? level : 'aal1'
      return { data: { session: {}, user }, error: null }
    },
    mfa: {
      listFactors: boot.scenario === 'unsupported' ? undefined : async () => {
        record('listFactors')
        listReads += 1
        if (!signedIn || (boot.scenario === 'retry' && listReads === 1)) return { data: null, error: { message: rawFailure } }
        return { data: { all: factors.map((factor) => ({ ...factor })) }, error: null }
      },
      async getAuthenticatorAssuranceLevel() {
        record('getAuthenticatorAssuranceLevel')
        return { data: { currentLevel: level, nextLevel: factors.some((factor) => factor.status === 'verified') ? 'aal2' : 'aal1' }, error: null }
      },
      async enroll(input: { factorType: 'totp' }) {
        record('enroll', input)
        factors.push({ id: 'fixture-enrolled', factor_type: 'totp', status: 'unverified', friendly_name: '', created_at: '2026-11-15T12:00:00.000Z' })
        return { data: { id: 'fixture-enrolled', totp: { qr_code: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22160%22%3E%3Crect width=%22160%22 height=%22160%22 fill=%22white%22/%3E%3Ctext x=%2210%22 y=%2280%22%3ESYNTHETIC%3C/text%3E%3C/svg%3E' } }, error: null }
      },
      async challenge(input: { factorId: string }) {
        record('challenge', input)
        return { data: { id: 'fixture-challenge' }, error: null }
      },
      async verify(input: { factorId: string; challengeId: string; code: string }) {
        record('verify', input)
        if (control.holdVerify) await new Promise<void>((resolve) => { control.releaseVerify = resolve })
        control.releaseVerify = null
        if (input.code === '000000') return { error: { message: 'invalid code: secret=FIXTURE-DIAGNOSTIC-MUST-NOT-RENDER' } }
        level = 'aal2'
        factors = factors.map((factor) => factor.id === input.factorId ? { ...factor, status: 'verified' } : factor)
        return { error: null }
      },
      async unenroll(input: { factorId: string }) {
        record('unenroll', input)
        factors = factors.filter((factor) => factor.id !== input.factorId)
        return { error: null }
      },
    },
  },
}

// Bundler-only aliases target these existing IO boundaries. Actual Server action,
// UI, reducers and Auth operations remain the production implementations.
export function createBrowserClient() { return client }
export async function createServerActionClient() { return client }
