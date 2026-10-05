import { readFileSync } from 'node:fs'

import './effective-target-ssr-stub.mjs'
import './effective-target-cookies-stub.mjs'
import './effective-target-guard-stub.mjs'

const SSR = new URL('./effective-target-ssr-stub.mjs', import.meta.url)
const COOKIES = new URL('./effective-target-cookies-stub.mjs', import.meta.url)
const GUARD = new URL('./effective-target-guard-stub.mjs', import.meta.url)

function rewrite(specifier, url) {
  if (specifier === '@supabase/ssr' || url.includes('/node_modules/@supabase/ssr/')) {
    return SSR.href
  }
  if (
    specifier === 'next/headers' ||
    url.includes('/node_modules/next/headers') ||
    url.includes('/node_modules/next/dist/api/headers') ||
    url.includes('/node_modules/next/dist/server/request/headers')
  ) {
    return COOKIES.href
  }
  if (
    specifier === '@/lib/auth/admin-guard' ||
    specifier === '@/lib/auth/admin-guard.ts' ||
    /\/lib\/auth\/admin-guard(?:\.ts)?$/.test(url)
  ) {
    return GUARD.href
  }
  return null
}

export async function resolve(specifier, context, nextResolve) {
  const rewritten = rewrite(specifier, specifier)
  if (rewritten) {
    return { shortCircuit: true, url: rewritten }
  }
  const resolved = await nextResolve(specifier, context)
  const after = rewrite(specifier, resolved.url)
  return after ? { shortCircuit: true, url: after } : resolved
}

export async function load(url, context, nextLoad) {
  const rewritten = rewrite(url, url)
  if (rewritten && rewritten !== url) {
    return {
      shortCircuit: true,
      format: 'module',
      source: readFileSync(new URL(rewritten), 'utf8'),
    }
  }
  return nextLoad(url, context)
}
