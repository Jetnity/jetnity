#!/usr/bin/env node
// Reject remote/default connection variables before any DB or Auth command.
// Classify hosted markers by name only. Never persist secret values.
// Subprocess environments are rebuilt from an allowlist; they never inherit
// the parent object and never accept security-sensitive passthrough.

import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  FORBIDDEN_CONNECTION_KEYS,
  HOSTED_MARKER_KEYS,
  LOCAL_FLAG,
  OUTBOUND_PREVENT_KEYS,
  PREFLIGHT_PARENT_ALLOWLIST,
} from './constants.mjs'

const LOOPBACK_URL = /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?(?:\/|$)/

function istGesetzt(env, key) {
  const value = env?.[key]
  return value != null && String(value) !== ''
}

export function istLoopbackUrl(value) {
  return LOOPBACK_URL.test(String(value || ''))
}

export function klassifiziereUmgebung(env = {}) {
  const gesetzteVerbotene = FORBIDDEN_CONNECTION_KEYS.filter((key) => istGesetzt(env, key))
  const hostedMarkers = HOSTED_MARKER_KEYS.filter((key) => istGesetzt(env, key))
  const outbound = OUTBOUND_PREVENT_KEYS.filter((key) => istGesetzt(env, key))
  return {
    forbiddenConnectionKeysPresent: gesetzteVerbotene,
    hostedMarkersPresent: hostedMarkers,
    outboundProviderKeysPresent: outbound,
    parentHasHostedSupabaseNames: gesetzteVerbotene.some(
      (key) => key.startsWith('SUPABASE_') || key.startsWith('NEXT_PUBLIC_SUPABASE_'),
    ),
  }
}

export function assertIsolatedConnectionEnvironment(env = {}, argv = process.argv) {
  const gesetzte = FORBIDDEN_CONNECTION_KEYS.filter((key) => istGesetzt(env, key))
  if (gesetzte.length) {
    throw new Error(`Verbotene Verbindungs-Umgebung: ${gesetzte.join(', ')}`)
  }
  if (argv.some((arg) => /0\.0\.0\.0|\[::\]|supabase\.(co|com)|qscbgcdmivbbnzrcyegn/i.test(String(arg)))) {
    throw new Error('Öffentliches Bind-Ziel oder Remote-Host in den Argumenten ist verboten.')
  }
}

function leereErlaubteBasis(parentEnv = {}, privateHome) {
  const kind = Object.create(null)
  for (const key of PREFLIGHT_PARENT_ALLOWLIST) {
    if (istGesetzt(parentEnv, key)) kind[key] = parentEnv[key]
  }
  kind.LANG = kind.LANG || 'C.UTF-8'
  kind.LC_ALL = kind.LC_ALL || 'C'
  if (privateHome) {
    mkdirSync(privateHome, { recursive: true, mode: 0o700 })
    mkdirSync(join(privateHome, 'config'), { recursive: true, mode: 0o700 })
    mkdirSync(join(privateHome, 'cache'), { recursive: true, mode: 0o700 })
    mkdirSync(join(privateHome, 'tmp'), { recursive: true, mode: 0o700 })
    kind.HOME = privateHome
    kind.XDG_CONFIG_HOME = join(privateHome, 'config')
    kind.XDG_CACHE_HOME = join(privateHome, 'cache')
    kind.XDG_DATA_HOME = join(privateHome, 'data')
    kind.TMPDIR = join(privateHome, 'tmp')
    kind.NPM_CONFIG_CACHE = join(privateHome, 'cache', 'npm')
    kind.npm_config_offline = 'true'
    kind.npm_config_ignore_scripts = 'true'
  }
  return kind
}

function assertKeineVerbotenenReste(kind, { erlaubteLoopbackKeys = [] } = {}) {
  const verboten = [
    ...FORBIDDEN_CONNECTION_KEYS,
    ...HOSTED_MARKER_KEYS,
    ...OUTBOUND_PREVENT_KEYS,
  ].filter((key) => !erlaubteLoopbackKeys.includes(key) && istGesetzt(kind, key))
  if (verboten.length) {
    throw new Error(`Effektive Kind-Umgebung enthält verbotene Schlüssel: ${verboten.join(', ')}`)
  }
}

export function bauePreflightUmgebung({ parentEnv = {}, privateHome } = {}) {
  if (!privateHome) {
    throw new Error('Preflight-Umgebung verlangt ein run-owned privates HOME.')
  }
  const kind = leereErlaubteBasis(parentEnv, privateHome)
  kind.NODE_ENV = 'test'
  assertKeineVerbotenenReste(kind)
  return kind
}

export function baueKindUmgebung({
  parentEnv = {},
  loopbackUrl,
  syntheticAnonKey,
  extra = {},
  privateHome,
} = {}) {
  if (!istLoopbackUrl(loopbackUrl)) {
    throw new Error('Kind-Umgebung verlangt eine numerische Loopback-Supabase-URL.')
  }
  if (extra.passthrough) {
    throw new Error('Security-sensitive passthrough is not accepted.')
  }
  const kind = leereErlaubteBasis(parentEnv, privateHome || extra.privateHome)
  kind.NODE_ENV = 'development'
  kind[LOCAL_FLAG] = 'true'
  kind.NEXT_PUBLIC_SUPABASE_URL = loopbackUrl
  kind.NEXT_PUBLIC_SUPABASE_ANON_KEY = syntheticAnonKey
  if (extra.siteUrl) {
    if (!istLoopbackUrl(extra.siteUrl)) {
      throw new Error('NEXT_PUBLIC_SITE_URL muss Loopback sein.')
    }
    kind.NEXT_PUBLIC_SITE_URL = extra.siteUrl
  }
  assertKeineVerbotenenReste(kind, {
    erlaubteLoopbackKeys: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
  })
  if (!istLoopbackUrl(kind.NEXT_PUBLIC_SUPABASE_URL)) {
    throw new Error('Effektive NEXT_PUBLIC_SUPABASE_URL ist nach Zusammensetzung kein Loopback.')
  }
  if (istGesetzt(kind, 'SUPABASE_ACCESS_TOKEN') || istGesetzt(kind, 'OPENAI_API_KEY')) {
    throw new Error('Effektive Kind-Umgebung darf Verbindungs- oder Provider-Schlüssel nicht reintroduzieren.')
  }
  return kind
}

export function umgebungsgrenzeOhneGeheimnisse(kindEnv) {
  return {
    NODE_ENV: kindEnv.NODE_ENV ?? null,
    LOCAL_FLAG: kindEnv[LOCAL_FLAG] === 'true' ? 'true' : 'absent-or-not-true',
    supabaseUrlIsLoopback: istLoopbackUrl(kindEnv.NEXT_PUBLIC_SUPABASE_URL),
    anonKeyPresent: Boolean(kindEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    homeIsPrivate: Boolean(kindEnv.HOME) && String(kindEnv.HOME).includes('aacba1'),
    hostedMarkers: HOSTED_MARKER_KEYS.filter((key) => istGesetzt(kindEnv, key)),
    forbiddenKeys: FORBIDDEN_CONNECTION_KEYS.filter(
      (key) => key !== 'NEXT_PUBLIC_SUPABASE_URL' && key !== 'NEXT_PUBLIC_SUPABASE_ANON_KEY' && istGesetzt(kindEnv, key),
    ),
    outboundKeys: OUTBOUND_PREVENT_KEYS.filter((key) => istGesetzt(kindEnv, key)),
  }
}
