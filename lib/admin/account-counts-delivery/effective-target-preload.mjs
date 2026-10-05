import Module from 'node:module'
import { fileURLToPath } from 'node:url'
import { register } from 'node:module'

import './effective-target-hooks.mjs'

register(new URL('./effective-target-hooks.mjs', import.meta.url))

const sep = '/'
const ssr = fileURLToPath(new URL('./effective-target-ssr-stub.mjs', import.meta.url))
const cookies = fileURLToPath(new URL('./effective-target-cookies-stub.mjs', import.meta.url))
const guard = fileURLToPath(new URL('./effective-target-guard-stub.mjs', import.meta.url))

const original = Module._resolveFilename
Module._resolveFilename = function resolveEffectiveTarget(request, parent, isMain, options) {
  if (request === '@supabase/ssr') return ssr
  if (request === 'next/headers') return cookies
  if (
    request === '@/lib/auth/admin-guard' ||
    request === '@/lib/auth/admin-guard.ts' ||
    request.endsWith('/lib/auth/admin-guard') ||
    request.endsWith('/lib/auth/admin-guard.ts')
  ) {
    return guard
  }
  const resolved = original.call(this, request, parent, isMain, options)
  if (typeof resolved !== 'string') return resolved
  if (resolved === ssr || resolved === cookies || resolved === guard) return resolved
  if (resolved.includes(`${sep}node_modules${sep}@supabase${sep}ssr${sep}`)) return ssr
  if (
    resolved.includes(`${sep}node_modules${sep}next${sep}headers`) ||
    resolved.includes(`${sep}node_modules${sep}next${sep}dist${sep}api${sep}headers`) ||
    resolved.includes(`${sep}node_modules${sep}next${sep}dist${sep}server${sep}request${sep}headers`)
  ) {
    return cookies
  }
  if (/[/\\]lib[/\\]auth[/\\]admin-guard(?:\.ts)?$/.test(resolved)) return guard
  return resolved
}
