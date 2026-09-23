#!/usr/bin/env node
// Isolated child environments for this runtime lane.
// Reuses the accepted #556 allowlist/rebuild helpers. Does not inherit
// remote Docker context, connector/provider/model/SMTP keys, NODE_OPTIONS,
// preload, .env files or authenticated cloud configuration.

import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  FORBIDDEN_CONNECTION_KEYS,
  HOSTED_MARKER_KEYS,
  OUTBOUND_PREVENT_KEYS,
} from '../admin-account-counts-browser-acceptance-1/constants.mjs'
import {
  assertIsolatedConnectionEnvironment,
  bauePreflightUmgebung,
  istLoopbackUrl,
  klassifiziereUmgebung,
} from '../admin-account-counts-browser-acceptance-1/env-guard.mjs'
import { LOCAL_FLAG, PRIVATE_STATE_DIR_NAME } from './constants.mjs'

const EXTRA_DENIED = Object.freeze([
  'NODE_OPTIONS',
  'NODE_PATH',
  'NODE_PRELOAD',
  'NODE_EXTRA_CA_CERTS',
  'DOCKER_HOST',
  'DOCKER_CONTEXT',
  'DOCKER_CERT_PATH',
  'DOCKER_TLS_VERIFY',
  'SUPABASE_ACCESS_TOKEN',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_DB_URL',
])

function istGesetzt(env, key) {
  const value = env?.[key]
  return value != null && String(value) !== ''
}

export function klassifiziereRuntimeUmgebung(env = {}) {
  const base = klassifiziereUmgebung(env)
  return {
    ...base,
    extraDeniedPresent: EXTRA_DENIED.filter((key) => istGesetzt(env, key)),
    nodeOptionsPresent: istGesetzt(env, 'NODE_OPTIONS'),
    remoteDockerHint: /tcp:|ssh:|https?:|cloud/i.test(String(env.DOCKER_HOST || env.DOCKER_CONTEXT || '')),
  }
}

export function assertKeineGeerbteLaufzeit(env = {}, argv = process.argv) {
  assertIsolatedConnectionEnvironment(env, argv)
  const extra = EXTRA_DENIED.filter((key) => istGesetzt(env, key))
  if (extra.length) {
    throw new Error(`Verbotene geerbte Laufzeit-Umgebung: ${extra.join(', ')}`)
  }
}

export function isDotenvName(name) {
  return name === '.env' || String(name).startsWith('.env.')
}

export function assertKeinDotenv(paths = []) {
  for (const path of paths) {
    if (path && existsSync(path)) {
      throw new Error(`Inherited .env file is forbidden in the dedicated checkout: ${path}`)
    }
  }
}

export function refuseDotenvInCheckout(checkoutDir) {
  if (!checkoutDir || !existsSync(checkoutDir)) return []
  const found = readdirSync(checkoutDir).filter((name) => isDotenvName(name)).map((name) => join(checkoutDir, name))
  if (found.length) {
    throw new Error(`Inherited .env file is forbidden in the dedicated checkout: ${found.join(', ')}`)
  }
  return found
}

export function baueRuntimePreflightUmgebung({ parentEnv = {}, privateHome } = {}) {
  if (!privateHome) throw new Error('Runtime preflight requires a run-owned private HOME.')
  const kind = bauePreflightUmgebung({ parentEnv, privateHome })
  delete kind.NODE_OPTIONS
  delete kind.DOCKER_HOST
  delete kind.DOCKER_CONTEXT
  kind.DOCKER_HOST = `unix:///var/run/docker.sock`
  kind.HOME = privateHome
  return kind
}

export function baueRuntimeAppUmgebung({
  parentEnv = {},
  privateHome,
  loopbackUrl,
  syntheticAnonKey,
  siteUrl,
  countsEnabled,
} = {}) {
  if (!privateHome) throw new Error('App environment requires a run-owned private HOME.')
  if (!istLoopbackUrl(loopbackUrl) || !/127\.0\.0\.1/.test(String(loopbackUrl))) {
    throw new Error('App environment requires a numeric 127.0.0.1 loopback URL.')
  }
  if (!syntheticAnonKey) throw new Error('App environment requires the local public anon key.')
  const kind = bauePreflightUmgebung({ parentEnv, privateHome })
  delete kind.NODE_OPTIONS
  delete kind.DOCKER_HOST
  delete kind.DOCKER_CONTEXT
  kind.NODE_ENV = 'development'
  kind[LOCAL_FLAG] = countsEnabled === true ? 'true' : 'false'
  kind.NEXT_PUBLIC_SUPABASE_URL = loopbackUrl
  kind.NEXT_PUBLIC_SUPABASE_ANON_KEY = syntheticAnonKey
  if (siteUrl) {
    if (!istLoopbackUrl(siteUrl)) throw new Error('NEXT_PUBLIC_SITE_URL must be loopback.')
    kind.NEXT_PUBLIC_SITE_URL = siteUrl
  }
  const forbidden = [
    ...FORBIDDEN_CONNECTION_KEYS,
    ...HOSTED_MARKER_KEYS,
    ...OUTBOUND_PREVENT_KEYS,
    ...EXTRA_DENIED,
  ].filter((key) => !['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'].includes(key) && istGesetzt(kind, key))
  if (forbidden.length) {
    throw new Error(`Effective app environment contains forbidden keys: ${forbidden.join(', ')}`)
  }
  if (kind[LOCAL_FLAG] === 'true' && countsEnabled !== true) {
    throw new Error('LOCAL_FLAG must stay truthful for OFF runs.')
  }
  if (kind[LOCAL_FLAG] !== 'true' && countsEnabled === true) {
    throw new Error('LOCAL_FLAG must stay truthful for ON runs.')
  }
  return kind
}

export function baueDockerCliUmgebung({ parentEnv = {}, privateHome, dockerHost = 'unix:///var/run/docker.sock' } = {}) {
  const kind = baueRuntimePreflightUmgebung({ parentEnv, privateHome })
  if (!/^unix:\/\//.test(dockerHost) && dockerHost !== '') {
    throw new Error('Only an explicit local Unix Docker socket is accepted.')
  }
  kind.DOCKER_HOST = dockerHost
  delete kind.DOCKER_CONTEXT
  delete kind.DOCKER_CERT_PATH
  delete kind.DOCKER_TLS_VERIFY
  return kind
}

export function umgebungsgrenze(kindEnv) {
  return {
    NODE_ENV: kindEnv.NODE_ENV ?? null,
    LOCAL_FLAG: kindEnv[LOCAL_FLAG] === 'true' ? 'true' : kindEnv[LOCAL_FLAG] === 'false' ? 'false' : 'absent',
    supabaseUrlIsNumericLoopback: /^https?:\/\/127\.0\.0\.1(?::\d+)?(?:\/|$)/.test(String(kindEnv.NEXT_PUBLIC_SUPABASE_URL || '')),
    anonKeyPresent: Boolean(kindEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    homeIsPrivate: Boolean(kindEnv.HOME) && String(kindEnv.HOME).includes(PRIVATE_STATE_DIR_NAME.slice(0, 6)),
    hostedMarkers: HOSTED_MARKER_KEYS.filter((key) => istGesetzt(kindEnv, key)),
    forbiddenKeys: FORBIDDEN_CONNECTION_KEYS.filter(
      (key) => key !== 'NEXT_PUBLIC_SUPABASE_URL' && key !== 'NEXT_PUBLIC_SUPABASE_ANON_KEY' && istGesetzt(kindEnv, key),
    ),
    extraDenied: EXTRA_DENIED.filter((key) => key !== 'DOCKER_HOST' && istGesetzt(kindEnv, key)),
  }
}

export { istLoopbackUrl, klassifiziereUmgebung, assertIsolatedConnectionEnvironment }
export { join }
