#!/usr/bin/env node
// Official local stack only. Never overlay the #550 bootstrap on GoTrue.
// Test-only workdir + disclosed overlay. Product supabase/config.toml stays read-only.

import { spawn } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, SOURCE_PATHS } from './constants.mjs'
import { refuseBootstrapOverlay } from './source-manifest.mjs'
import { stoppeOwnedChild } from './owned-lifecycle.mjs'

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
  const migrationsLink = join(configDir, 'migrations')
  if (!existsSync(migrationsLink)) {
    symlinkSync(join(ROOT, 'supabase/migrations'), migrationsLink)
  }
  return { workdir, configPath: join(configDir, 'config.toml'), overlayDifferences: DISCLOSED_OVERLAY }
}

export function geplanteSqlAnwendung() {
  const planned = [SOURCE_PATHS.producer, SOURCE_PATHS.wrapper]
  refuseBootstrapOverlay({ plannedSqlPaths: planned, target: 'gotrue' })
  return planned
}

export async function starteOwnedStack() {
  throw new Error(
    'Owned supabase start is not invoked while preflight reports no Docker-compatible runtime. Calling this would either no-op-fail or require a forbidden privileged daemon / hosted fallback.',
  )
}

export async function stoppeOwnedStack(state) {
  if (!state) return { neverStarted: true, reaped: true }
  const childReport = await stoppeOwnedChild(state.child)
  return { ...childReport, workdir: state.workdir || null }
}

export function entferneOwnedWorkdir(workdir, { processesStopped, reaped, neverStarted }) {
  if (!workdir || !existsSync(workdir)) return { removed: false, reason: 'absent' }
  if (!((processesStopped && reaped) || neverStarted)) {
    return { removed: false, reason: 'owned process still active' }
  }
  rmSync(workdir, { recursive: true, force: true })
  return { removed: true }
}

// Keep spawn imported so a later exact-head execution can start the official CLI
// without adding a new dependency in the same change. The current environment
// must not reach this branch.
export const OFFICIAL_START = Object.freeze({
  bin: 'npx',
  args: ['--yes', 'supabase', 'start', '--yes'],
  spawn,
})
