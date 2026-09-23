#!/usr/bin/env node
// Official local stack helpers and overlay contract only.
// Stack start is NOT IMPLEMENTED in this command. Never overlay the #550
// bootstrap on GoTrue. Product supabase/config.toml stays read-only.

import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, SOURCE_PATHS } from './constants.mjs'
import { IMPLEMENTATION, notImplementedError } from './implementation.mjs'
import { darfOwnedVerzeichnisEntfernen, stoppeOwnedChild } from './owned-lifecycle.mjs'
import { refuseBootstrapOverlay } from './source-manifest.mjs'

export const DISCLOSED_OVERLAY = Object.freeze({
  projectIdPrefix: 'aacba1',
  bind: '127.0.0.1',
  studioEnabled: false,
  seedEnabled: false,
  excludeServices: [
    'realtime',
    'storage-api',
    'imgproxy',
    'studio',
    'edge-runtime',
    'logflare',
    'vector',
    'supavisor',
  ],
  keptAuthBehavior: [
    'minimum_password_length=12',
    'password_requirements=lower_upper_letters_digits_symbols',
    'enable_confirmations=true',
    'enable_anonymous_sign_ins=false',
    'auth.captcha.enabled=false',
    'auth.mfa.totp.enroll_enabled=true',
    'auth.mfa.totp.verify_enabled=true',
    'auth.mfa.phone.enroll_enabled=false',
    'auth.mfa.web_authn.enroll_enabled=false',
    'db.major_version=17',
  ],
  whySeedDisabled:
    'Repo seed would add non-manifest accounts and make expected counts non-deterministic. This does not weaken password, MFA, confirmation or anonymous-sign-in behavior.',
  whyStudioDisabled: 'Reduce local surface; Studio is not the acceptance path.',
})

export const STACK_EXECUTION = Object.freeze({
  status: IMPLEMENTATION.stackStart,
  reason: IMPLEMENTATION.note,
})

export function baueConfigOverlay(acceptedToml, { projectId, apiPort, dbPort, siteUrl, inbucketPort }) {
  let next = acceptedToml
  next = next.replace(/^project_id = ".*"$/m, `project_id = "${projectId}"`)
  next = next.replace(/^port = 54321$/m, `port = ${apiPort}`)
  next = next.replace(/^port = 54322$/m, `port = ${dbPort}`)
  next = next.replace(/^site_url = ".*"$/m, `site_url = "${siteUrl}"`)
  next = next.replace(/\[studio\]\nenabled = true/, '[studio]\nenabled = false')
  next = next.replace(/\[db\.seed\]\nenabled = true/, '[db.seed]\nenabled = false')
  if (inbucketPort) {
    next = next.replace(/\[local_smtp\]\nenabled = true\n# Port to use for the email testing server web interface.\nport = 54324/, `[local_smtp]\nenabled = true\nport = ${inbucketPort}`)
  }
  return next
}

export function bereiteOwnedWorkdir({ runId, overlayPorts, privateDir }) {
  const workdir = join(privateDir, `${runId}-supabase`)
  mkdirSync(workdir, { recursive: true, mode: 0o700 })
  chmodSync(workdir, 0o700)
  const configDir = join(workdir, 'supabase')
  mkdirSync(configDir, { recursive: true, mode: 0o700 })
  const accepted = readFileSync(join(ROOT, SOURCE_PATHS.config), 'utf8')
  const overlay = baueConfigOverlay(accepted, {
    projectId: `${DISCLOSED_OVERLAY.projectIdPrefix}-${runId}`.slice(0, 40),
    apiPort: overlayPorts.apiPort,
    dbPort: overlayPorts.dbPort,
    siteUrl: overlayPorts.siteUrl,
    inbucketPort: overlayPorts.inbucketPort,
  })
  writeFileSync(join(configDir, 'config.toml'), overlay, { mode: 0o600 })
  return {
    workdir,
    configPath: join(configDir, 'config.toml'),
    overlayDifferences: DISCLOSED_OVERLAY,
    migrationsLinked: false,
    migrationReplay: IMPLEMENTATION.migrationReplay,
  }
}

export function geplanteSqlAnwendung() {
  const planned = [SOURCE_PATHS.producer, SOURCE_PATHS.wrapper]
  refuseBootstrapOverlay({ plannedSqlPaths: planned, target: 'gotrue' })
  return planned
}

export async function starteOwnedStack() {
  throw notImplementedError('Owned supabase start')
}

export async function stoppeOwnedStack(state) {
  if (!state) return { neverStarted: true, reaped: true, dockerServicesUnverified: false }
  const childReport = await stoppeOwnedChild(state.child)
  return {
    ...childReport,
    workdir: state.workdir || null,
    dockerServicesUnverified: state.dockerServicesConfirmed !== true,
    note: 'CLI child exit is not Docker service/container teardown.',
  }
}

export function entferneOwnedWorkdir(workdir, flags = {}) {
  if (!workdir || !existsSync(workdir)) return { removed: false, reason: 'absent' }
  if (!darfOwnedVerzeichnisEntfernen(flags)) {
    return { removed: false, reason: 'owned process still active, unknown, or Docker services unverified' }
  }
  rmSync(workdir, { recursive: true, force: true })
  return { removed: true }
}
