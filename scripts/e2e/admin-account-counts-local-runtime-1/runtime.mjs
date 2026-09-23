#!/usr/bin/env node
// Default real-runtime wiring. Invoked only from explicit --runtime-only or
// --full after isolated preflight passed. Registers ownership before fallible
// work. Missing tooling remains BLOCKED, not a fake PASS.

import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { CONTRACT_VERSION, PRODUCT_BASELINE, TIMEOUTS, WRAPPER_PATH } from './constants.mjs'
import { notACompletedExecution } from './implementation.mjs'
import { starteOwnedStack, parseStatusEnv, sanitizeStatus } from './stack.mjs'
import { replayMigrations, installProducerAndWrapper, INDEPENDENT_COUNT_SQL } from './schema.mjs'
import { provisioniereUeberGoTrue, profileMutationSql, createdAtMutationSql, emailFor, generateFixturePassword } from './fixtures.mjs'
import { createRpcObserver } from './observer.mjs'
import { starteOwnedApp } from './app.mjs'
import { baueAcceptanceContext } from './context.mjs'
import { materialisiereAppCheckout } from './source.mjs'
import { leseUnveraenderteSql } from './schema.mjs'
import { readFileSync } from 'node:fs'
import { ROOT } from './constants.mjs'

function quoteIdent(value) {
  return `'${String(value).replace(/'/g, "''")}'`
}

export function bauePsqlArgs({ container, sql }) {
  return ['exec', '-i', container, 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', sql]
}

export async function defaultStartRuntime({
  owned,
  plan,
  prepared,
  source,
  cli,
  docker,
  childEnv,
  signal,
  execFile = execFileSync,
  fetchImpl = fetch,
  spawnFn,
  waitUntilReady,
} = {}) {
  if (!docker?.usable) {
    throw notACompletedExecution('runtime rehearsal', 'usable local Docker daemon is absent')
  }
  if (!cli?.identityVerified || !cli.resolved) {
    throw notACompletedExecution('runtime rehearsal', 'official CLI 2.117.0 identity is not verified')
  }

  const networkName = `aaclr1-${prepared.projectId}`.slice(0, 60)
  owned.network = { name: networkName }
  owned.dockerBin = docker.selected.path
  owned.cliBin = cli.resolved
  owned.workdir = prepared.workdir

  const stack = await starteOwnedStack({
    cliBin: cli.resolved,
    dockerBin: docker.selected.path,
    workdir: prepared.workdir,
    env: childEnv,
    plan,
    networkName,
    excludeNames: cli.excludeNames || [],
    execFile,
    spawnFn,
    signal,
    timeoutMs: TIMEOUTS.stackStartMs,
  })
  owned.stack = stack

  const statusText = execFile(cli.resolved, ['status', '-o', 'env'], {
    encoding: 'utf8',
    env: childEnv,
    cwd: prepared.workdir,
    timeout: 20_000,
  })
  const statusEnv = parseStatusEnv(statusText)
  const sanitized = sanitizeStatus(statusEnv)
  if (!sanitized.apiUrlIsNumericLoopback) {
    throw notACompletedExecution('runtime rehearsal', 'status API URL is not numeric loopback')
  }

  const dbContainer = findOwnedDbContainer({
    dockerBin: docker.selected.path,
    networkName,
    env: childEnv,
    execFile,
  })
  const applySql = async ({ sql, path, kind }) => {
    const text = sql || (path ? readFileSync(join(ROOT, path), 'utf8') : '')
    try {
      execFile(docker.selected.path, bauePsqlArgs({ container: dbContainer, sql: text }), {
        encoding: 'utf8',
        env: childEnv,
        timeout: 60_000,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw Object.assign(new Error(`${kind || 'sql'} failed${path ? ` for ${path}` : ''}: ${message}`), { file: path })
    }
  }
  const querySql = async (sql) => {
    const out = execFile(docker.selected.path, [
      'exec', '-i', dbContainer, 'psql', '-U', 'postgres', '-d', 'postgres', '-A', '-t', '-c', sql,
    ], { encoding: 'utf8', env: childEnv, timeout: 20_000 })
    return String(out).trim()
  }

  const applied = String(await querySql('select version from supabase_migrations.schema_migrations order by version')).split('\n').filter(Boolean)
  await replayMigrations({
    files: source.migrations.files,
    applySql: async ({ path }) => {
      const version = path.split('/').pop().replace(/\.sql$/, '').split('_')[0]
      if (applied.some((row) => row.startsWith(version))) return
      await applySql({ path, kind: 'migration' })
    },
  })
  const sqlFiles = leseUnveraenderteSql()
  const catalog = await installProducerAndWrapper({
    applySql,
    verify: async () => {
      const producer = await querySql("select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='jetnity_reporting' and p.proname='account_counts_v1'")
      const wrapper = await querySql("select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='admin_account_counts_v1'")
      return {
        producer: { proname: producer || null },
        wrapper: { proname: wrapper || null },
      }
    },
  })

  const apiOrigin = sanitized.observedApiUrl
  const serviceRole = statusEnv.SERVICE_ROLE_KEY || statusEnv.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = statusEnv.ANON_KEY || statusEnv.SUPABASE_ANON_KEY
  if (!serviceRole || !anonKey) {
    throw notACompletedExecution('runtime rehearsal', 'local status did not expose local keys')
  }

  const adminFetch = async ({ method, path, body, signal: inner }) => {
    const response = await fetchImpl(`${apiOrigin}${path}`, {
      method,
      headers: {
        apikey: serviceRole,
        authorization: `Bearer ${serviceRole}`,
        'content-type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: inner || signal,
    })
    if (!response.ok) {
      throw new Error(`GoTrue Admin API ${method} ${path} failed: ${response.status}`)
    }
    return response.json()
  }
  const assignProfile = async ({ userId, email, role, status }) => {
    const mutation = profileMutationSql({ userId, role, status })
    await applySql({
      sql: mutation.text
        .replaceAll('$1::uuid', quoteIdent(userId))
        .replaceAll('$2::text', quoteIdent(role))
        .replaceAll('$3::text', quoteIdent(status)),
      kind: 'profile',
    })
    void email
  }
  const accounts = await provisioniereUeberGoTrue({
    runId: prepared.projectId,
    adminFetch,
    assignProfile,
    signal,
  })

  const observer = createRpcObserver({
    listenHost: '127.0.0.1',
    listenPort: plan.services.find((item) => item.name === 'rpc-observer').port,
    upstreamOrigin: apiOrigin,
    fetchImpl,
  })
  const observed = await observer.listen()
  owned.observer = observer

  const checkoutDir = mkdtempSync(join(owned.privateHome, 'app-'))
  materialisiereAppCheckout({ destDir: checkoutDir })
  owned.checkoutDir = checkoutDir
  const appPort = plan.services.find((item) => item.name === 'app').port
  const app = await starteOwnedApp({
    checkoutDir,
    parentEnv: {},
    privateHome: owned.privateHome,
    loopbackUrl: observed.origin,
    syntheticAnonKey: anonKey,
    siteUrl: `http://127.0.0.1:${appPort}`,
    countsEnabled: true,
    port: appPort,
    spawnFn,
    waitUntilReady,
    signal,
  })
  owned.appChild = app.child

  const fixtureDb = {
    extra: null,
    async mutateProfile({ userId, role, status }) {
      await assignProfile({ userId, role, status })
    },
    async verifyProfile({ userId }) {
      const row = await querySql(`select role||','||status from public.profiles where user_id = ${quoteIdent(userId)}::uuid`)
      const [role, status] = String(row).split(',')
      return { role, status }
    },
    async createExtra() {
      const created = await adminFetch({
        method: 'POST',
        path: '/auth/v1/admin/users',
        body: {
          email: emailFor('extra', prepared.projectId),
          password: generateFixturePassword(),
          email_confirm: true,
        },
        signal,
      })
      return { id: created.id }
    },
    async adjustCreatedAt({ userId, createdAt }) {
      const mutation = createdAtMutationSql({ userId, createdAt })
      await applySql({
        sql: mutation.text
          .replaceAll('$1::uuid', quoteIdent(userId))
          .replaceAll('$2::timestamptz', quoteIdent(createdAt)),
        kind: 'created_at',
      })
    },
    async independentCount() {
      const row = await querySql(INDEPENDENT_COUNT_SQL.replace(/\s+/g, ' '))
      const [present, recent] = String(row).split('|')
      return { present, recent }
    },
    async applySql(sql) {
      await applySql({ sql, kind: 'wrapper-toggle' })
    },
  }

  const context = baueAcceptanceContext({
    runId: prepared.projectId,
    productHead: PRODUCT_BASELINE,
    signal,
    timeoutMs: TIMEOUTS.runtimeBudgetMs,
    accounts,
    localApi: { origin: observed.origin, anonKey },
    appController: {
      current: app,
      options: {
        checkoutDir,
        parentEnv: {},
        privateHome: owned.privateHome,
        loopbackUrl: observed.origin,
        syntheticAnonKey: anonKey,
        siteUrl: `http://127.0.0.1:${appPort}`,
        port: appPort,
        spawnFn,
        waitUntilReady,
        signal,
      },
    },
    observer,
    fixtureDb,
    evidenceDir: owned.evidenceDir,
    browserRegistry: owned.browserRegistry,
    privateHome: owned.privateHome,
    childEnv,
  })

  const positive = await fetchImpl(`${observed.origin}${WRAPPER_PATH}`, {
    method: 'POST',
    headers: { apikey: anonKey, authorization: `Bearer ${anonKey}`, 'content-type': 'application/json' },
    body: '{}',
    signal,
  }).catch((error) => ({ ok: false, status: null, error }))

  return {
    owned: {
      stack,
      observer,
      appChild: app.child,
      checkoutDir,
      dockerBin: docker.selected.path,
      cliBin: cli.resolved,
      workdir: prepared.workdir,
      network: stack.network,
    },
    context,
    gates: {
      G2_owned_stack: {
        result: stack.dockerServicesConfirmed ? 'PASS' : 'FAIL',
        notes: `Owned CLI stack on network ${networkName}; bindings verified loopback-only.`,
      },
      G3_auth_schema_not_bootstrap: {
        result: catalog.producerSha && catalog.wrapperSha ? 'PASS' : 'FAIL',
        notes: 'Committed migrations replayed; #557 producer/wrapper installed; #550 bootstrap refused.',
      },
      G4_fixtures_via_gotrue: {
        result: accounts.owner?.id ? 'PASS' : 'FAIL',
        notes: 'Synthetic actors provisioned through local GoTrue Admin API.',
      },
      G5_app_boot_loopback: {
        result: app.origin.startsWith('http://127.0.0.1:') ? 'PASS' : 'FAIL',
        notes: `Unchanged app on ${app.origin} using observer origin ${observed.origin}.`,
      },
    },
    observerPositiveControl: {
      attempted: true,
      status: positive.status ?? null,
      complete: observer.since(0).complete,
      contractVersion: CONTRACT_VERSION,
      sqlFilesPresent: Boolean(sqlFiles.producerSha),
    },
  }
}

function findOwnedDbContainer({ dockerBin, networkName, env, execFile }) {
  const names = String(execFile(dockerBin, ['ps', '--filter', `network=${networkName}`, '--format', '{{.Names}}'], {
    encoding: 'utf8',
    env,
    timeout: 15_000,
  })).trim().split(/\n/).filter(Boolean)
  const db = names.find((name) => /db|postgres/i.test(name))
  if (!db) throw notACompletedExecution('runtime rehearsal', `no owned Postgres container on ${networkName}`)
  return db
}
