#!/usr/bin/env node
// Reject remote/default connection variables before any DB or Auth command.
// Classify hosted markers by name only. Never persist secret values.

import {
  FORBIDDEN_CONNECTION_KEYS,
  HOSTED_MARKER_KEYS,
  LOCAL_FLAG,
  OUTBOUND_PREVENT_KEYS,
} from './constants.mjs'

function istGesetzt(env, key) {
  const value = env[key]
  return value != null && String(value) !== ''
}

export function klassifiziereUmgebung(env = process.env) {
  const gesetzteVerbotene = FORBIDDEN_CONNECTION_KEYS.filter((key) => istGesetzt(env, key))
  const hostedMarkers = HOSTED_MARKER_KEYS.filter((key) => istGesetzt(env, key))
  const outbound = OUTBOUND_PREVENT_KEYS.filter((key) => istGesetzt(env, key))
  return {
    forbiddenConnectionKeysPresent: gesetzteVerbotene,
    hostedMarkersPresent: hostedMarkers,
    outboundProviderKeysPresent: outbound,
    parentHasHostedSupabaseNames: gesetzteVerbotene.some((key) => key.startsWith('SUPABASE_') || key.startsWith('NEXT_PUBLIC_SUPABASE_')),
  }
}

export function assertIsolatedConnectionEnvironment(env = process.env, argv = process.argv) {
  const gesetzte = FORBIDDEN_CONNECTION_KEYS.filter((key) => istGesetzt(env, key))
  if (gesetzte.length) {
    throw new Error(`Verbotene Verbindungs-Umgebung: ${gesetzte.join(', ')}`)
  }
  if (argv.some((arg) => /0\.0\.0\.0|\[::\]|supabase\.(co|com)|qscbgcdmivbbnzrcyegn/i.test(String(arg)))) {
    throw new Error('Öffentliches Bind-Ziel oder Remote-Host in den Argumenten ist verboten.')
  }
}

export function baueKindUmgebung({
  parentEnv = process.env,
  loopbackUrl,
  syntheticAnonKey,
  extra = {},
} = {}) {
  if (!loopbackUrl || !/^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?(?:\/|$)/.test(loopbackUrl)) {
    throw new Error('Kind-Umgebung verlangt eine numerische Loopback-Supabase-URL.')
  }
  const kind = { PATH: parentEnv.PATH, HOME: parentEnv.HOME, LANG: parentEnv.LANG || 'C.UTF-8' }
  for (const key of [
    ...FORBIDDEN_CONNECTION_KEYS,
    ...HOSTED_MARKER_KEYS,
    ...OUTBOUND_PREVENT_KEYS,
    LOCAL_FLAG,
  ]) {
    delete kind[key]
  }
  kind.NODE_ENV = 'development'
  kind[LOCAL_FLAG] = 'true'
  kind.NEXT_PUBLIC_SUPABASE_URL = loopbackUrl
  kind.NEXT_PUBLIC_SUPABASE_ANON_KEY = syntheticAnonKey
  kind.NEXT_PUBLIC_SITE_URL = extra.siteUrl
  Object.assign(kind, extra.passthrough || {})
  return kind
}

export function umgebungsgrenzeOhneGeheimnisse(kindEnv) {
  return {
    NODE_ENV: kindEnv.NODE_ENV ?? null,
    LOCAL_FLAG: kindEnv[LOCAL_FLAG] === 'true' ? 'true' : 'absent-or-not-true',
    supabaseUrlIsLoopback: /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])/.test(
      String(kindEnv.NEXT_PUBLIC_SUPABASE_URL || ''),
    ),
    anonKeyPresent: Boolean(kindEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hostedMarkers: HOSTED_MARKER_KEYS.filter((key) => istGesetzt(kindEnv, key)),
    forbiddenKeys: FORBIDDEN_CONNECTION_KEYS.filter(
      (key) => key !== 'NEXT_PUBLIC_SUPABASE_URL' && key !== 'NEXT_PUBLIC_SUPABASE_ANON_KEY' && istGesetzt(kindEnv, key),
    ),
    outboundKeys: OUTBOUND_PREVENT_KEYS.filter((key) => istGesetzt(kindEnv, key)),
  }
}
