#!/usr/bin/env node
// Disclosed temporary overlay over the accepted config.toml.
// Password, confirmation, TOTP/MFA, anonymous-sign-in and security semantics
// stay unchanged. Seed is disabled only here, and that is disclosed.

import { execFileSync } from 'node:child_process'
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { baueConfigOverlay, DISCLOSED_OVERLAY as ACCEPTED_OVERLAY } from '../admin-account-counts-browser-acceptance-1/stack.mjs'
import { SOURCE_PATHS } from '../admin-account-counts-browser-acceptance-1/constants.mjs'
import { ROOT } from './constants.mjs'

export const DISCLOSED_OVERLAY = Object.freeze({
  ...ACCEPTED_OVERLAY,
  projectIdPrefix: 'aaclr1',
  bind: '127.0.0.1',
  numericLoopbackOnly: true,
  seedEnabled: false,
  studioEnabled: false,
  whyNumericLoopback: 'A localhost URL is not proof of loopback-only publication. Bindings use 127.0.0.1.',
})

export function assertNoPublicBindPlan(plan) {
  const hosts = [plan.bind, ...(plan.services || []).map((item) => item.host)]
  for (const host of hosts) {
    if (host == null) continue
    if (host === '0.0.0.0' || host === '::' || host === '[::]' || host === '*') {
      throw new Error(`Public bind refused: ${host}`)
    }
    if (host !== '127.0.0.1') {
      throw new Error(`Non-numeric or non-loopback bind refused: ${host}`)
    }
  }
  return true
}

export function planeLoopbackDienste({ apiPort, dbPort, appPort, observerPort, smtpPort } = {}) {
  const services = [
    { name: 'api-gateway', host: '127.0.0.1', port: apiPort },
    { name: 'postgres', host: '127.0.0.1', port: dbPort },
    { name: 'app', host: '127.0.0.1', port: appPort },
    { name: 'rpc-observer', host: '127.0.0.1', port: observerPort },
  ]
  if (smtpPort) services.push({ name: 'local-smtp', host: '127.0.0.1', port: smtpPort })
  const plan = {
    bind: '127.0.0.1',
    dockerNetworkOption: "com.docker.network.bridge.host_binding_ipv4=127.0.0.1",
    officialDocs: 'https://supabase.com/docs/guides/local-development',
    dockerPortDocs: 'https://docs.docker.com/engine/network/port-publishing/',
    services,
  }
  assertNoPublicBindPlan(plan)
  return plan
}

export function bereiteOwnedWorkdir({ runId, overlayPorts, privateDir, migrations }) {
  const workdir = join(privateDir, `${runId}-supabase`)
  mkdirSync(workdir, { recursive: true, mode: 0o700 })
  chmodSync(workdir, 0o700)
  const configDir = join(workdir, 'supabase')
  mkdirSync(configDir, { recursive: true, mode: 0o700 })
  const accepted = readFileSync(join(ROOT, SOURCE_PATHS.config), 'utf8')
  const projectId = `${DISCLOSED_OVERLAY.projectIdPrefix}-${runId}`.replace(/[^a-z0-9-]/gi, '').slice(0, 40)
  let overlay = baueConfigOverlay(accepted, {
    projectId,
    apiPort: overlayPorts.apiPort,
    dbPort: overlayPorts.dbPort,
    siteUrl: overlayPorts.siteUrl,
    inbucketPort: overlayPorts.inbucketPort,
  })
  overlay = overlay.replace(/site_url = "http:\/\/localhost:3000"/, `site_url = "${overlayPorts.siteUrl}"`)
  if (!/\[studio\]\nenabled = false/.test(overlay) && /\[studio\]/.test(overlay)) {
    overlay = overlay.replace(/\[studio\]\nenabled = true/, '[studio]\nenabled = false')
  }
  if (!/\[db\.seed\]\nenabled = false/.test(overlay)) {
    overlay = overlay.replace(/\[db\.seed\]\nenabled = true/, '[db.seed]\nenabled = false')
  }
  writeFileSync(join(configDir, 'config.toml'), overlay, { mode: 0o600 })
  const migrationsDir = join(configDir, 'migrations')
  mkdirSync(migrationsDir, { recursive: true, mode: 0o700 })
  const copiedMigrations = []
  for (const file of migrations?.files || []) {
    const bytes = readFileSync(join(ROOT, file.path))
    const dest = join(migrationsDir, file.path.split('/').pop())
    writeFileSync(dest, bytes, { mode: 0o600 })
    const copiedBlob = execFileSync('git', ['hash-object', dest], { encoding: 'utf8' }).trim()
    if (file.baselineBlob && copiedBlob !== file.baselineBlob) {
      throw new Error(`Copied overlay migration ${file.path} ${copiedBlob} != baseline ${file.baselineBlob}`)
    }
    copiedMigrations.push({
      path: file.path,
      copiedBlob,
      baselineBlob: file.baselineBlob || null,
    })
  }
  return {
    workdir,
    configPath: join(configDir, 'config.toml'),
    migrationsDir,
    projectId,
    overlayDifferences: DISCLOSED_OVERLAY,
    migrationsLinked: true,
    migrationReplay: 'IMPLEMENTED',
    seedEnabled: false,
    copiedMigrations,
  }
}

export function assertOverlayKeepsAuthSemantics(overlayText) {
  const required = [
    'minimum_password_length = 12',
    'password_requirements = "lower_upper_letters_digits_symbols"',
    'enable_anonymous_sign_ins = false',
    'enable_confirmations = true',
    'enroll_enabled = true',
    'verify_enabled = true',
    'major_version = 17',
  ]
  const missing = required.filter((item) => !overlayText.includes(item))
  if (missing.length) {
    throw new Error(`Overlay would change accepted auth/db semantics: ${missing.join(', ')}`)
  }
  if (/enable_anonymous_sign_ins = true/.test(overlayText)) {
    throw new Error('Overlay must not enable anonymous sign-in.')
  }
  return true
}
