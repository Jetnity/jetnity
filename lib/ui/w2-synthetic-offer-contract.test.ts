import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
test('synthetic offer scene cannot be used in production or seed Supabase', () => {
  const route = readFileSync('app/account/ui-audit/w2-angebot/page.tsx', 'utf8')
  const scene = readFileSync('components/trips/W2TestangebotDev.tsx', 'utf8')
  assert.match(route, /VERCEL_ENV !== 'preview'/)
  assert.match(route, /VERCEL_GIT_COMMIT_REF/)
  assert.match(route, /notFound\(\)/)
  assert.match(scene, /localStorage\.setItem/)
  assert.match(scene, /localStorage\.removeItem/)
  assert.match(scene, /testpaar/)
  assert.match(scene, /ReiseAenderungBuchungshinweise/)
  assert.match(scene, /bookingStatus = 'unconfirmed'/)
  assert.match(scene, /bookingStatus = 'booked'/)
  assert.doesNotMatch(scene, /fetch\(|supabase\.rpc|service_role|bookingUrl = 'https/)
})
