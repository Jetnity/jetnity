#!/usr/bin/env node
// Synthetic actors through the local GoTrue Admin API. Profile role/status
// mutations use a narrowly scoped fixture administrator against the owned DB
// only. Fixture secrets never enter reports.

import { randomBytes } from 'node:crypto'
import {
  ACTOR_KEYS,
  COUNT_SCENARIOS,
  DEFAULT_ROLES,
  FIXTURE_DOMAIN,
  ROLE_ALLOWLIST,
  STATUS_ALLOWLIST,
  WINDOW_HOURS,
} from './constants.mjs'
import { INDEPENDENT_COUNT_SQL } from './schema.mjs'

export function generateFixturePassword() {
  const raw = randomBytes(18).toString('base64url')
  return `Aa1!${raw}`.slice(0, 24)
}

export function emailFor(actorKey, runId) {
  return `${actorKey}.${runId}@${FIXTURE_DOMAIN}`
}

export function assertActorKey(actorKey) {
  if (!ACTOR_KEYS.includes(actorKey)) throw new Error(`Unknown fixture actor ${actorKey}`)
  return actorKey
}

export function assertStatus(status) {
  if (!STATUS_ALLOWLIST.includes(status)) throw new Error(`Status ${status} is not allowlisted`)
  return status
}

export function assertRole(role) {
  if (!ROLE_ALLOWLIST.includes(role)) throw new Error(`Role ${role} is not allowlisted`)
  return role
}

export function sanitizeFixtureManifest(accounts, { runId, expected = null } = {}) {
  return {
    runId,
    domain: FIXTURE_DOMAIN,
    accounts: Object.entries(accounts || {}).map(([key, value]) => ({
      key,
      id: value.id || null,
      emailPattern: `${key}.<runId>@${FIXTURE_DOMAIN}`,
      role: value.role || DEFAULT_ROLES[key] || null,
      status: value.status || 'active',
    })),
    expectedCounts: expected,
    secretsPresent: false,
  }
}

export async function provisioniereUeberGoTrue({
  runId,
  adminFetch,
  assignProfile,
  signal,
} = {}) {
  if (typeof adminFetch !== 'function') {
    throw new Error('GoTrue Admin API client is required; direct auth.users inserts are forbidden.')
  }
  const accounts = {}
  for (const key of ACTOR_KEYS) {
    const email = emailFor(key, runId)
    const password = generateFixturePassword()
    const created = await adminFetch({
      method: 'POST',
      path: '/auth/v1/admin/users',
      body: {
        email,
        password,
        email_confirm: true,
        user_metadata: { fixture: true, actor: key, runId },
      },
      signal,
    })
    if (!created?.id) throw new Error(`GoTrue Admin API did not return an id for ${key}`)
    const role = DEFAULT_ROLES[key]
    const status = 'active'
    await assignProfile({ userId: created.id, email, role, status })
    accounts[key] = { id: created.id, email, password, role, status }
  }
  return accounts
}

export function profileMutationSql({ userId, role, status }) {
  assertRole(role)
  assertStatus(status)
  return {
    text: `
insert into public.profiles (user_id, email, role, status)
select $1::uuid, u.email, $2::text, $3::text
from auth.users u
where u.id = $1::uuid
on conflict (user_id) do update
set role = excluded.role,
    status = excluded.status
returning user_id::text, role, status
`,
    values: [userId, role, status],
  }
}

export function createdAtMutationSql({ userId, createdAt }) {
  return {
    text: `
update auth.users
set created_at = $2::timestamptz
where id = $1::uuid
  and email like '%@${FIXTURE_DOMAIN}'
returning id::text, created_at
`,
    values: [userId, createdAt],
    note: 'Fixture-only created_at adjustment. Identity, password and session claims stay unchanged.',
  }
}

export async function setzeStatus(accounts, actorKey, status, { mutateProfile, verify }) {
  assertActorKey(actorKey)
  assertStatus(status)
  const actor = accounts[actorKey]
  if (!actor) throw new Error(`Actor ${actorKey} is not owned by this run`)
  await mutateProfile({ userId: actor.id, role: actor.role, status })
  const seen = await verify({ userId: actor.id })
  if (seen.status !== status) throw new Error(`Profile status verify failed for ${actorKey}`)
  actor.status = status
}

export async function setzeRolle(accounts, actorKey, role, { mutateProfile, verify }) {
  assertActorKey(actorKey)
  assertRole(role)
  const actor = accounts[actorKey]
  if (!actor) throw new Error(`Actor ${actorKey} is not owned by this run`)
  await mutateProfile({ userId: actor.id, role, status: actor.status })
  const seen = await verify({ userId: actor.id })
  if (seen.role !== role) throw new Error(`Profile role verify failed for ${actorKey}`)
  actor.role = role
}

export async function prepareCountScenario(name, {
  accounts,
  extra,
  createExtra,
  adjustCreatedAt,
  now = new Date(),
} = {}) {
  if (!COUNT_SCENARIOS.includes(name)) throw new Error(`Unknown count scenario ${name}`)
  const old = new Date(now.getTime() - (WINDOW_HOURS + 1) * 3600 * 1000).toISOString()
  const recent = new Date(now.getTime() - 60 * 1000).toISOString()
  for (const key of ACTOR_KEYS) {
    await adjustCreatedAt({ userId: accounts[key].id, createdAt: old })
  }
  if (name === 'zero-window') {
    if (extra?.id) await adjustCreatedAt({ userId: extra.id, createdAt: old })
    return { scenario: name, extraCreated: false }
  }
  let current = extra
  if (!current?.id) current = await createExtra()
  await adjustCreatedAt({ userId: current.id, createdAt: recent })
  return { scenario: name, extraCreated: true, extraId: current.id }
}

export async function expectedCounts({ query }) {
  const row = await query(INDEPENDENT_COUNT_SQL)
  return {
    present: String(row.present),
    recent: String(row.recent),
    source: 'independent-select-not-producer',
  }
}

export function contextAccounts(accounts) {
  return Object.fromEntries(
    ACTOR_KEYS.map((key) => ([
      key,
      { id: accounts[key].id, email: accounts[key].email, password: accounts[key].password },
    ])),
  )
}
