import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const server = readFileSync(new URL('./server.ts', import.meta.url), 'utf8')
const rsc = server.slice(server.indexOf('function rscCookiesAdapter'), server.indexOf('/** Mutierbarer Cookies-Adapter'))
const mutable = server.slice(server.indexOf('function mutableCookiesAdapter'), server.indexOf('/** Für Server Components'))

test('Supabase SSR auth cookie chunks persist in the mutable Server Action adapter', () => {
  assert.match(mutable, /getAll\(\)/)
  assert.match(mutable, /setAll\(cookiesToSet:/)
  assert.match(mutable, /for \(const \{ name, value, options \} of cookiesToSet\)/)
  assert.match(mutable, /store\.set\(\{ name, value, \.\.\.options \}\)/)
  assert.match(mutable, /store\.set\(\{ name, value: '', \.\.\.options, maxAge: 0 \}\)/)
  assert.equal(mutable.includes("signOut({ scope: 'local' })"), false)
})

test('Server Component auth-cookie writer remains read-only', () => {
  assert.match(rsc, /setAll\(_cookiesToSet:/)
  assert.doesNotMatch(rsc, /store\.set\(/)
  assert.doesNotMatch(rsc, /store\.delete\(/)
})
