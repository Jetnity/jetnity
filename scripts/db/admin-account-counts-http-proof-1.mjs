#!/usr/bin/env node
// Isolated local HTTP proof of the unchanged public.admin_account_counts_v1()
// wrapper through real PostgREST JWT verification.
//
// Examines only the accepted producer/bootstrap plus the frozen #553 snapshot
// wrapper/parser/contract. Never imports scripts/db/sql.mjs, never uses remote
// defaults, never starts a hosted service, and never writes product runtime.
//
//   node --import tsx scripts/db/admin-account-counts-http-proof-1.mjs

import { execFileSync, spawn } from 'node:child_process'
import { createHash, createHmac, randomBytes, randomUUID } from 'node:crypto'
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  appendFileSync,
  writeFileSync,
} from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import {
  FORBIDDEN_CONNECTION_KEYS,
  CHILD_ENV_STRIP_KEYS,
  PSQL_NO_STARTUP,
  assertIsolatedConnectionEnvironment,
} from './admin-account-counts-1-local-proof.mjs'

const ROOT = new URL('../..', import.meta.url).pathname
const BOOTSTRAP = join(ROOT, 'scripts/db/admin-account-counts-1-bootstrap.sql')
const CANDIDATE = join(ROOT, 'scripts/db/admin-account-counts-1-candidate.sql')
const FIXTURE = join(ROOT, 'scripts/db/admin-account-counts-http-proof-1-fixture.sql')
const DB_NAME = 'jetnity_admin_account_counts_http_1'
const CLUSTER_USER = 'jetnity_http_proof'
const AUTHENTICATOR = 'jetnity_http_authenticator'
const SNAPSHOT = 'dcf7bfee497ba3aa2038a43fe4bc2a09e541625f'
const EXPECTED = Object.freeze({
  producer: 'dcf4d35d894975b3c36860454ca8b0714af11c243fdcef900159a9929ccd4420',
  bootstrap: '0413821d7c75c76908dd437527d623fcbed59c524135adbf5e5974730e6f6ea2',
  wrapper: '13fa3fe280d76d42ca6b2a1dff12077edc3d44a599a22300e89dd5578d63a6fb',
  parserBlob: '6205ecbba621b048fff479856c5523fab5ec4f6d',
  contractBlob: '6826eeea70aecc0507d05624daaeac47af0be9b8',
})
const POSTGREST_VERSION = '16.3'
const POSTGREST_ASSET = `postgrest-v${POSTGREST_VERSION}-linux-static-x86-64.tar.xz`
const POSTGREST_URL = `https://github.com/PostgREST/postgrest/releases/download/v${POSTGREST_VERSION}/${POSTGREST_ASSET}`
const POSTGREST_TAR_SHA256 = '4eb414eb948c8800863cc8c9896a17b611b2dccf9ff581f4d57f42ec9ccee40d'
const SUBPROCESS_TIMEOUT_MS = Object.freeze({
  initdb: 60_000,
  pgctl: 45_000,
  psql: 30_000,
  download: 90_000,
  http: 8_000,
})
const MAX_HTTP_REQUESTS = 80
const TCP_LISTEN_STATE = '0A'
const CHILD_TERM_TIMEOUT_MS = 1_500
const CHILD_KILL_TIMEOUT_MS = 800
const SCHEMA_CACHE_DEADLINE_MS = 4_000
const SCHEMA_CACHE_PROBE_BUDGET = 8

export const POSTGREST_V16_DENY = Object.freeze({
  privilege: Object.freeze({ status: 403, code: '42501' }),
  anon: Object.freeze({ status: 401, code: '42501' }),
  invalidJwt: Object.freeze({ status: 401, code: 'PGRST301' }),
  expiredJwt: Object.freeze({ status: 401, code: 'PGRST303' }),
  missingFunction: Object.freeze({ status: 404, code: 'PGRST202' }),
  excludedSchema: Object.freeze({ status: 406, code: 'PGRST106' }),
  invalidPath: Object.freeze({ status: 404, code: 'PGRST125' }),
  missingTable: Object.freeze({ status: 404, code: 'PGRST205' }),
})
const EXPECTED_PRESENT = '10'
const EXPECTED_WINDOW_ZERO = '0'
const EXPECTED_PRESENT_AFTER_RECENT = '11'
const EXPECTED_WINDOW_AFTER_RECENT = '1'

export const IDS = Object.freeze({
  owner: '10000000-0000-4000-8000-000000000001',
  admin: '10000000-0000-4000-8000-000000000002',
  operator: '10000000-0000-4000-8000-000000000003',
  moderator: '10000000-0000-4000-8000-000000000004',
  user: '10000000-0000-4000-8000-000000000005',
  creator: '10000000-0000-4000-8000-000000000006',
  noProfile: '10000000-0000-4000-8000-000000000007',
  nullTs: '10000000-0000-4000-8000-00000000000a',
  old: '10000000-0000-4000-8000-00000000000b',
  banned: '10000000-0000-4000-8000-00000000000e',
  anonUser: '10000000-0000-4000-8000-00000000000f',
  softDel: '10000000-0000-4000-8000-000000000010',
  absent: '10000000-0000-4000-8000-000000000011',
  recent: '10000000-0000-4000-8000-000000000012',
  anonPriv: '10000000-0000-4000-8000-000000000014',
})

const HTTP_FORBIDDEN_KEYS = Object.freeze([
  ...FORBIDDEN_CONNECTION_KEYS,
  'PGRST_DB_URI',
  'PGRST_JWT_SECRET',
  'PGRST_DB_ANON_ROLE',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ACCESS_TOKEN',
  'SUPABASE_PROJECT_REF',
  'SUPABASE_DB_PASSWORD',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
])

const ergebnisse = []
const beobachtungen = []
let cluster = null
let httpState = null
let parseAdminAccountCountsPayload = null
let httpRequestCount = 0
let catalogBeforeSetup = null
let catalogAfterSetup = null

export function sha256Datei(pfad) {
  return createHash('sha256').update(readFileSync(pfad)).digest('hex')
}

export function assertIsolatedHttpEnvironment(env = process.env, argv = process.argv) {
  assertIsolatedConnectionEnvironment(env, argv)
  const gesetzt = HTTP_FORBIDDEN_KEYS.filter((schluessel) => {
    const wert = env[schluessel]
    return wert != null && wert !== ''
  })
  if (gesetzt.length) {
    throw new Error(`Verbotene HTTP/DB-Umgebung: ${gesetzt.join(', ')}`)
  }
  if (argv.some((arg) => /0\.0\.0\.0|\[::\]|supabase\.(co|com)/i.test(String(arg)))) {
    throw new Error('Öffentliches Bind-Ziel oder Remote-Host in den Argumenten ist verboten.')
  }
}

export function findPgBinsPrefer17() {
  const dirs = ['/usr/lib/postgresql/17/bin', '/usr/lib/postgresql/16/bin', '/usr/bin']
  const pick = (name) => {
    for (const dir of dirs) {
      const pfad = join(dir, name)
      if (existsSync(pfad)) return pfad
    }
    return null
  }
  return {
    initdb: pick('initdb'),
    pgCtl: pick('pg_ctl'),
    postgres: pick('postgres'),
    psql: pick('psql'),
  }
}

export function requirePgBinsPrefer17() {
  const bins = findPgBinsPrefer17()
  const missing = Object.entries(bins)
    .filter(([, pfad]) => !pfad)
    .map(([name]) => name)
  if (missing.length) {
    const error = new Error(
      `BLOCKED: lokale PostgreSQL-Binaries fehlen (${missing.join(', ')}). Kein Cloud-Fallback.`,
    )
    error.code = 'JETNITY_LOCAL_PG_MISSING'
    throw error
  }
  return bins
}

export function cleanProofEnv(base = process.env) {
  const env = { ...base }
  for (const schluessel of Object.keys(env)) {
    if (
      schluessel.startsWith('PG') ||
      schluessel.startsWith('PGRST_') ||
      HTTP_FORBIDDEN_KEYS.includes(schluessel) ||
      CHILD_ENV_STRIP_KEYS.includes(schluessel)
    ) {
      delete env[schluessel]
    }
  }
  if (cluster?.homeDir) env.HOME = cluster.homeDir
  return env
}

function bewerte(name, gruppe, ok, detail) {
  ergebnisse.push({ name, gruppe, ok, detail: String(detail ?? '') })
  console.log(`${ok ? '  ok  ' : ' FEHL '} [${gruppe}] ${name}  ${sanitized(detail)}`)
}

function beobachte(name, gruppe, detail) {
  beobachtungen.push({ name, gruppe, detail: String(detail ?? ''), assertion: false })
  console.log(`  obs  [${gruppe}] ${name}  ${sanitized(detail)}`)
}

function sanitized(wert) {
  return String(wert ?? '')
    .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[jwt-redacted]')
    .replace(/postgres(?:ql)?:\/\/[^/\s]+/gi, '[db-uri-redacted]')
    .replace(/jwt-secret\s*=\s*.+/gi, 'jwt-secret=[redacted]')
}

function base64urlJson(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

export function signLocalJwt(payload, secret) {
  const header = base64urlJson({ alg: 'HS256', typ: 'JWT' })
  const body = base64urlJson(payload)
  const sig = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}

function claims({ uid, role = 'authenticated', aal, extra = {}, expOffsetSec = 300 }) {
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    role,
    iat: now,
    exp: now + expOffsetSec,
    ...extra,
  }
  if (uid) payload.sub = uid
  if (aal) payload.aal = aal
  return payload
}

export function buildPostgrestConfig({ host, port, dbUri, jwtFile, extraSearchPath = '' }) {
  if (host !== '127.0.0.1') {
    throw new Error('fail-closed: PostgREST host must be numeric loopback 127.0.0.1')
  }
  if (!/^postgres:\/\/jetnity_http_authenticator@\//.test(dbUri)) {
    throw new Error('fail-closed: db-uri must use the local authenticator and a socket host')
  }
  return [
    `server-host = "${host}"`,
    `server-port = ${port}`,
    'server-reuseport = false',
    `db-uri = "${dbUri}"`,
    'db-schemas = "public"',
    `db-extra-search-path = "${extraSearchPath}"`,
    'db-anon-role = "anon"',
    'db-config = false',
    'db-channel-enabled = true',
    'db-channel = "pgrst"',
    'db-pool = 4',
    'db-tx-end = "rollback"',
    'openapi-mode = "disabled"',
    'log-level = "error"',
    'log-query = false',
    `jwt-secret = "@${jwtFile}"`,
    'jwt-secret-is-base64 = false',
    'jwt-role-claim-key = ".role"',
    '',
  ].join('\n')
}

export function assertConfigIsLoopbackOnly(configText) {
  if (!/server-host\s*=\s*"127\.0\.0\.1"/.test(configText)) {
    throw new Error('fail-closed: server-host is not 127.0.0.1')
  }
  if (/0\.0\.0\.0|!4|::/.test(configText)) {
    throw new Error('fail-closed: public or wildcard bind is forbidden')
  }
}

export function schemaProfileHeaders(method, schema) {
  if (method === 'GET') return { 'Accept-Profile': schema }
  return { 'Content-Profile': schema }
}

export function tamperJwtSignature(token) {
  const teile = String(token).split('.')
  if (teile.length !== 3 || !teile[2]) {
    throw new Error('fail-closed: tamper target is not a compact JWT')
  }
  const sig = Buffer.from(teile[2], 'base64url')
  if (!sig.length) {
    throw new Error('fail-closed: JWT signature is empty')
  }
  const mutated = Buffer.from(sig)
  mutated[0] = mutated[0] ^ 0xff
  const next = `${teile[0]}.${teile[1]}.${mutated.toString('base64url')}`
  if (next === token) {
    throw new Error('fail-closed: JWT tamper did not change signed bytes')
  }
  return next
}

export function ipv4HexIsLoopback(hex) {
  return String(hex).toUpperCase() === '0100007F'
}

export function ipv4HexIsWildcard(hex) {
  return String(hex).toUpperCase() === '00000000'
}

export function ipv6HexIsLoopback(hex) {
  return String(hex).toUpperCase().replace(/[^0-9A-F]/g, '') === '00000000000000000000000001000000'
}

export function ipv6HexIsWildcard(hex) {
  return String(hex).toUpperCase().replace(/[^0-9A-F]/g, '') === '00000000000000000000000000000000'
}

export function parseProcNetListenRows(text, family = 'ipv4') {
  const rows = []
  for (const zeile of String(text ?? '').split('\n')) {
    const cols = zeile.trim().split(/\s+/)
    if (cols.length < 10 || !/^[0-9A-Fa-f]+:[0-9A-Fa-f]+$/.test(cols[1])) continue
    if (cols[3] !== TCP_LISTEN_STATE) continue
    const [localHex, portHex] = cols[1].split(':')
    rows.push({
      family,
      localHex: localHex.toUpperCase(),
      port: Number.parseInt(portHex, 16),
      portHex: portHex.toLowerCase(),
      inode: String(cols[9]),
      state: cols[3],
      isLoopback: family === 'ipv4' ? ipv4HexIsLoopback(localHex) : ipv6HexIsLoopback(localHex),
      isWildcard: family === 'ipv4' ? ipv4HexIsWildcard(localHex) : ipv6HexIsWildcard(localHex),
    })
  }
  return rows
}

export function readProcessSocketInodes(pid) {
  if (!Number.isInteger(pid) || pid <= 1) {
    throw new Error('fail-closed: owned pid is not a live process')
  }
  const fdDir = `/proc/${pid}/fd`
  if (!existsSync(fdDir)) {
    throw new Error(`fail-closed: owned pid ${pid} has no /proc fd table`)
  }
  const inodes = []
  for (const name of readdirSync(fdDir)) {
    try {
      const target = readlinkSync(join(fdDir, name))
      const treffer = /^socket:\[(\d+)\]$/.exec(target)
      if (treffer) inodes.push(treffer[1])
    } catch {
      /* fd disappeared */
    }
  }
  return inodes
}

export function assertOwnedListenLoopbackOnly({ pid, port, tcpText, tcp6Text, socketInodes }) {
  if (!Number.isInteger(pid) || pid <= 1) {
    throw new Error('fail-closed: listener evidence requires the owned process pid')
  }
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('fail-closed: listener evidence requires a concrete TCP port')
  }
  const owned = new Set((socketInodes ?? []).map(String))
  if (!owned.size) {
    throw new Error(`fail-closed: owned pid ${pid} has no sockets`)
  }
  const listenRows = [
    ...parseProcNetListenRows(tcpText ?? '', 'ipv4'),
    ...parseProcNetListenRows(tcp6Text ?? '', 'ipv6'),
  ].filter((row) => row.port === port)
  const ownedListen = listenRows.filter((row) => owned.has(row.inode))
  if (!ownedListen.length) {
    throw new Error(
      `fail-closed: pid ${pid} does not own a LISTEN socket on port ${port} (wrong-PID or unrelated socket)`,
    )
  }
  if (ownedListen.some((row) => row.isWildcard)) {
    throw new Error('fail-closed: owned LISTEN socket is a public/wildcard bind')
  }
  if (!ownedListen.every((row) => row.isLoopback)) {
    throw new Error('fail-closed: owned LISTEN socket is not numeric loopback')
  }
  return {
    pid,
    port,
    loopback: true,
    listenState: TCP_LISTEN_STATE,
    sockets: ownedListen.length,
    families: [...new Set(ownedListen.map((row) => row.family))],
    inodes: ownedListen.map((row) => row.inode),
  }
}

export function assertProcessListensLoopbackOnly(pid, port, injected = {}) {
  const tcpText =
    injected.tcpText ?? (existsSync('/proc/net/tcp') ? readFileSync('/proc/net/tcp', 'utf8') : '')
  const tcp6Text =
    injected.tcp6Text ?? (existsSync('/proc/net/tcp6') ? readFileSync('/proc/net/tcp6', 'utf8') : '')
  const socketInodes = injected.socketInodes ?? readProcessSocketInodes(pid)
  return assertOwnedListenLoopbackOnly({ pid, port, tcpText, tcp6Text, socketInodes })
}

export function discloseCounts(body) {
  const blob = typeof body === 'string' ? body : JSON.stringify(body ?? {})
  return /present_registered_accounts|created_in_prior_30_days/.test(blob)
}

export function evaluateDeniedResponse(antwort, expected) {
  const reasons = []
  const text = String(antwort?.text ?? '')
  const json = antwort?.json
  if (antwort?.status === 200) reasons.push('unexpected-success')
  if (antwort?.status === 500 || antwort?.status === 503) reasons.push('server-failure')
  if (/<!DOCTYPE|<html[\s>]|<\/html>/i.test(text)) reasons.push('malformed-html')
  if (json == null && text) reasons.push('malformed-body')
  if (expected && antwort?.status !== expected.status) reasons.push('wrong-status')
  if (expected && (json == null || json.code !== expected.code)) reasons.push('wrong-code')
  if (discloseCounts(json) || discloseCounts(text)) reasons.push('leaked-counts')
  if (antwort?.leakedIdentity === true) reasons.push('leaked-identity')
  return {
    ok: reasons.length === 0,
    reasons,
    status: antwort?.status ?? null,
    code: json?.code ?? null,
  }
}

export function evaluateCleanupAcceptance(report) {
  const httpStopped = report?.httpStopped === true
  const reaped = report?.httpReaped === true || report?.httpNeverStarted === true
  const clusterStopped = report?.running === false
  const noError = report?.error == null
  const mayRemove = httpStopped && reaped && clusterStopped && noError
  return {
    ok: mayRemove && report?.cleaned === true && report?.removed === true,
    mayRemove,
    httpStopped,
    reaped,
    clusterStopped,
  }
}

export function waitForOwnedChildExit(child, { timeoutMs = CHILD_TERM_TIMEOUT_MS } = {}) {
  return new Promise((resolve) => {
    let settled = false
    let timer = null
    let onExit = null
    let onError = null
    let recordedError = null

    const detach = () => {
      if (child && onExit) child.off('exit', onExit)
      if (child && onError) child.off('error', onError)
      if (timer != null) {
        clearTimeout(timer)
        timer = null
      }
    }

    const finish = (result) => {
      if (settled) return
      settled = true
      detach()
      resolve(result)
    }

    if (!child) {
      finish({
        started: false,
        exited: true,
        neverStarted: true,
        timedOut: false,
        exitCode: null,
        signal: null,
        pid: null,
      })
      return
    }

    const endedResult = () => ({
      started: Boolean(child.pid),
      exited: true,
      neverStarted: !child.pid,
      spawnFailed: !child.pid,
      timedOut: false,
      exitCode: child.exitCode,
      signal: child.signalCode,
      pid: child.pid ?? null,
      ...(recordedError ? { error: recordedError } : {}),
    })

    if (child.exitCode != null || child.signalCode != null) {
      finish(endedResult())
      return
    }

    onExit = (code, signal) => {
      finish({
        started: Boolean(child.pid),
        exited: true,
        neverStarted: !child.pid,
        spawnFailed: !child.pid,
        timedOut: false,
        exitCode: code,
        signal,
        pid: child.pid ?? null,
        ...(recordedError ? { error: recordedError } : {}),
      })
    }
    onError = (fehler) => {
      recordedError = fehler instanceof Error ? fehler.message : String(fehler)
      if (child.exitCode != null || child.signalCode != null) {
        finish(endedResult())
        return
      }
      if (!child.pid) {
        finish({
          started: false,
          exited: true,
          neverStarted: true,
          spawnFailed: true,
          timedOut: false,
          error: recordedError,
          exitCode: null,
          signal: null,
          pid: null,
        })
      }
      // After-spawn error is not termination. Keep waiting for exit or timeout.
    }
    child.once('exit', onExit)
    child.once('error', onError)
    if (child.exitCode != null || child.signalCode != null) {
      finish(endedResult())
      return
    }
    timer = setTimeout(() => {
      finish({
        started: Boolean(child.pid),
        exited: false,
        neverStarted: !child.pid,
        timedOut: true,
        exitCode: child.exitCode,
        signal: child.signalCode,
        pid: child.pid ?? null,
        ...(recordedError ? { error: recordedError } : {}),
      })
    }, timeoutMs)
  })
}

function detachOwnedStdio(child) {
  child?.stdout?.removeAllListeners()
  child?.stderr?.removeAllListeners()
  child?.stdout?.destroy?.()
  child?.stderr?.destroy?.()
}

function applyOwnedStopOutcome(report, child, wait) {
  const exited = wait?.exited === true && (wait.exitCode != null || wait.signal != null || wait.neverStarted === true)
  report.neverStarted = wait?.neverStarted === true
  report.spawnFailed = wait?.spawnFailed === true || report.spawnFailed
  report.timedOut = wait?.timedOut === true
  report.exitCode = wait?.exitCode ?? child?.exitCode ?? null
  report.signal = wait?.signal ?? child?.signalCode ?? null
  if (wait?.error) report.error = wait.error
  report.reaped = exited
  report.httpStopped = exited
  report.ownershipRetained = !exited && Boolean(child)
  if (!exited) {
    report.error = report.error || 'owned HTTP child still running after stop wait'
  }
  return exited
}

export async function stoppeOwnedHttp(state, { termTimeoutMs = CHILD_TERM_TIMEOUT_MS, killTimeoutMs = CHILD_KILL_TIMEOUT_MS } = {}) {
  const child = state?.child
  const report = {
    started: Boolean(child),
    neverStarted: !child,
    spawnFailed: Boolean(state?.spawnError),
    pid: child?.pid ?? null,
    signaled: null,
    reaped: false,
    httpStopped: false,
    ownershipRetained: Boolean(child),
    timedOut: false,
    exitCode: child?.exitCode ?? null,
    signal: child?.signalCode ?? null,
    error: state?.spawnError ? String(state.spawnError.message ?? state.spawnError) : null,
  }
  if (!child) {
    report.httpStopped = true
    report.reaped = true
    report.ownershipRetained = false
    return report
  }

  const alreadyGone = child.exitCode != null || child.signalCode != null
  if (alreadyGone) {
    report.httpStopped = true
    report.reaped = true
    report.ownershipRetained = false
    report.exitCode = child.exitCode
    report.signal = child.signalCode
    detachOwnedStdio(child)
    return report
  }

  if (!child.pid) {
    const wait = await waitForOwnedChildExit(child, { timeoutMs: termTimeoutMs })
    if (applyOwnedStopOutcome(report, child, wait)) detachOwnedStdio(child)
    return report
  }

  const termWait = waitForOwnedChildExit(child, { timeoutMs: termTimeoutMs })
  try {
    child.kill('SIGTERM')
    report.signaled = 'SIGTERM'
  } catch (fehler) {
    report.error = fehler instanceof Error ? fehler.message : String(fehler)
  }
  let wait = await termWait
  if (!wait.exited) {
    const killWait = waitForOwnedChildExit(child, { timeoutMs: killTimeoutMs })
    try {
      child.kill('SIGKILL')
      report.signaled = 'SIGKILL'
    } catch (fehler) {
      report.error = report.error || (fehler instanceof Error ? fehler.message : String(fehler))
    }
    wait = await killWait
  }
  if (applyOwnedStopOutcome(report, child, wait)) detachOwnedStdio(child)
  return report
}

export function sameCatalogIdentity(left, right) {
  if (!left || !right) return false
  return (
    left.owner === right.owner &&
    left.definition === right.definition &&
    JSON.stringify(left.acls ?? null) === JSON.stringify(right.acls ?? null) &&
    left.security_definer === right.security_definer
  )
}

export function sameUsersProtection(left, right) {
  if (!left || !right) return false
  return (
    left.owner === right.owner &&
    left.rls === right.rls &&
    left.force_rls === right.force_rls &&
    JSON.stringify(left.policies ?? null) === JSON.stringify(right.policies ?? null) &&
    JSON.stringify(left.acls ?? null) === JSON.stringify(right.acls ?? null)
  )
}

function gitShow(revPath) {
  return execFileSync('git', ['show', revPath], {
    encoding: 'buffer',
    cwd: ROOT,
    timeout: 15_000,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function gitBlob(revPath) {
  return execFileSync('git', ['rev-parse', revPath], {
    encoding: 'utf8',
    cwd: ROOT,
    timeout: 15_000,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

export function exportFrozenSources(targetDir) {
  mkdirSync(targetDir, { recursive: true, mode: 0o700 })
  chmodSync(targetDir, 0o700)
  const wrapper = gitShow(`${SNAPSHOT}:scripts/db/admin-account-counts-delivery-1-rpc.sql`)
  const parser = gitShow(`${SNAPSHOT}:lib/admin/account-counts-delivery/parser.ts`)
  const contract = gitShow(`${SNAPSHOT}:lib/admin/account-counts-delivery/contract.ts`)
  writeFileSync(join(targetDir, 'admin-account-counts-delivery-1-rpc.sql'), wrapper, { mode: 0o600 })
  writeFileSync(join(targetDir, 'parser.ts'), parser, { mode: 0o600 })
  writeFileSync(join(targetDir, 'contract.ts'), contract, { mode: 0o600 })
  const rewritten = parser
    .toString('utf8')
    .replace(
      "from '@/lib/admin/account-counts-delivery/contract'",
      "from './contract.ts'",
    )
  writeFileSync(join(targetDir, 'parser.local.ts'), rewritten, { mode: 0o600 })
  return {
    wrapper: join(targetDir, 'admin-account-counts-delivery-1-rpc.sql'),
    parser: join(targetDir, 'parser.ts'),
    contract: join(targetDir, 'contract.ts'),
    parserLocal: join(targetDir, 'parser.local.ts'),
    hashes: {
      producer: sha256Datei(CANDIDATE),
      bootstrap: sha256Datei(BOOTSTRAP),
      wrapper: sha256Datei(join(targetDir, 'admin-account-counts-delivery-1-rpc.sql')),
      parserBlob: gitBlob(`${SNAPSHOT}:lib/admin/account-counts-delivery/parser.ts`),
      contractBlob: gitBlob(`${SNAPSHOT}:lib/admin/account-counts-delivery/contract.ts`),
    },
  }
}

export function assertExactSourceHashes(hashes) {
  const mismatch = Object.entries(EXPECTED)
    .filter(([key, expected]) => hashes[key] !== expected)
    .map(([key]) => key)
  if (mismatch.length) {
    const error = new Error(`BLOCKED: source hash mismatch (${mismatch.join(', ')}). Newer #553 heads are not a silent target.`)
    error.code = 'JETNITY_SOURCE_HASH_MISMATCH'
    throw error
  }
}

async function loadFrozenParser(parserLocal) {
  const modul = await import(pathToFileURL(parserLocal).href)
  if (typeof modul.parseAdminAccountCountsPayload !== 'function') {
    throw new Error('Frozen parser export missing')
  }
  return modul.parseAdminAccountCountsPayload
}

function locatePostgrest(binDir) {
  const envBin = process.env.JETNITY_HTTP_PROOF_POSTGREST
  if (envBin && existsSync(envBin)) return envBin
  const local = join(binDir, 'postgrest')
  if (existsSync(local)) return local
  return null
}

function downloadPostgrest(binDir) {
  mkdirSync(binDir, { recursive: true, mode: 0o700 })
  chmodSync(binDir, 0o700)
  const archive = join(binDir, POSTGREST_ASSET)
  execFileSync('curl', ['-fL', '--max-time', '90', '-o', archive, POSTGREST_URL], {
    stdio: 'pipe',
    timeout: SUBPROCESS_TIMEOUT_MS.download,
    env: cleanProofEnv(),
  })
  const actual = sha256Datei(archive)
  if (actual !== POSTGREST_TAR_SHA256) {
    throw new Error(`BLOCKED: PostgREST archive hash mismatch (got ${actual})`)
  }
  execFileSync('tar', ['-xJf', archive, '-C', binDir], {
    stdio: 'pipe',
    timeout: 15_000,
  })
  const binary = join(binDir, 'postgrest')
  if (!existsSync(binary)) {
    throw new Error('BLOCKED: PostgREST binary missing after extract')
  }
  chmodSync(binary, 0o700)
  return binary
}

function requirePostgrest(binDir) {
  const existing = locatePostgrest(binDir)
  if (existing) return existing
  return downloadPostgrest(binDir)
}

function postmasterLebt(state = cluster) {
  if (!state?.dataDir) return false
  const pidDatei = join(state.dataDir, 'postmaster.pid')
  if (!existsSync(pidDatei)) return false
  const pid = Number(readFileSync(pidDatei, 'utf8').split('\n')[0])
  if (!Number.isInteger(pid) || pid <= 1) return false
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function registriereCluster(bins) {
  const runId = randomUUID()
  const rootDir = join(tmpdir(), `jetnity-admin-account-counts-http-1-${runId}`)
  const state = {
    ...bins,
    rootDir,
    dataDir: join(rootDir, 'data'),
    socketDir: join(rootDir, 'socket'),
    homeDir: join(rootDir, 'home'),
    logFile: join(rootDir, 'postgres.log'),
    sourceDir: join(rootDir, 'sources'),
    binDir: join(rootDir, 'bin'),
    user: CLUSTER_USER,
    lifecycle: 'registered',
  }
  cluster = state
  mkdirSync(rootDir, { recursive: true, mode: 0o700 })
  mkdirSync(state.socketDir, { recursive: true, mode: 0o700 })
  mkdirSync(state.homeDir, { recursive: true, mode: 0o700 })
  chmodSync(rootDir, 0o700)
  return state
}

function starteCluster() {
  const bins = requirePgBinsPrefer17()
  const state = cluster?.lifecycle ? cluster : registriereCluster(bins)
  const initArgs = [
    '-D',
    state.dataDir,
    '--auth-local=trust',
    '--auth-host=reject',
    '--no-sync',
    '--encoding=UTF8',
    '--username',
    CLUSTER_USER,
  ]
  try {
    execFileSync(bins.initdb, [...initArgs, '--locale=C.UTF-8'], {
      stdio: 'pipe',
      env: cleanProofEnv(),
      timeout: SUBPROCESS_TIMEOUT_MS.initdb,
    })
  } catch {
    execFileSync(bins.initdb, [...initArgs, '--no-locale'], {
      stdio: 'pipe',
      env: cleanProofEnv(),
      timeout: SUBPROCESS_TIMEOUT_MS.initdb,
    })
  }
  state.lifecycle = 'initialized'
  appendFileSync(
    join(state.dataDir, 'postgresql.conf'),
    [
      '',
      "listen_addresses = ''",
      `unix_socket_directories = '${state.socketDir}'`,
      'unix_socket_permissions = 0700',
      "timezone = 'UTC'",
      'logging_collector = off',
      '',
    ].join('\n'),
  )
  execFileSync(bins.pgCtl, ['-D', state.dataDir, '-l', state.logFile, '-w', '-t', '30', 'start'], {
    stdio: 'pipe',
    env: cleanProofEnv(),
    timeout: SUBPROCESS_TIMEOUT_MS.pgctl,
  })
  state.lifecycle = 'started'
  return state
}

async function stoppeCluster() {
  const report = {
    cleaned: false,
    removed: false,
    stopped: false,
    running: postmasterLebt(cluster),
    httpStopped: false,
    httpReaped: false,
    httpNeverStarted: httpState?.child ? false : true,
    httpTimedOut: false,
    httpSignaled: null,
    error: null,
    lifecycle: cluster?.lifecycle ?? null,
    rootDir: cluster?.rootDir ?? null,
  }
  const http = await stoppeOwnedHttp(httpState)
  report.httpStopped = http.httpStopped
  report.httpReaped = http.reaped
  report.httpNeverStarted = http.neverStarted
  report.httpTimedOut = http.timedOut
  report.httpSignaled = http.signaled
  if (http.error) report.error = http.error
  if (!http.httpStopped || http.ownershipRetained === true) {
    report.error = report.error || 'owned HTTP child not confirmed stopped; preserving data tree'
    return report
  }
  if (httpState) httpState.child = null
  if (!cluster) {
    report.cleaned = true
    report.removed = true
    report.running = false
    httpState = null
    return report
  }
  if (report.running || cluster.lifecycle === 'started') {
    try {
      execFileSync(cluster.pgCtl, ['-D', cluster.dataDir, '-m', 'fast', '-w', '-t', '20', 'stop'], {
        stdio: 'pipe',
        env: cleanProofEnv(),
        timeout: SUBPROCESS_TIMEOUT_MS.pgctl,
      })
    } catch (fehler) {
      report.error = fehler instanceof Error ? fehler.message : String(fehler)
    }
    report.running = postmasterLebt(cluster)
    if (report.running) {
      report.error = report.error || 'cluster still running after stop; preserving data tree'
      return report
    }
    cluster.lifecycle = 'stopped'
    report.stopped = true
  }
  if (!evaluateCleanupAcceptance({ ...report, cleaned: true, removed: true }).mayRemove) {
    report.error = report.error || 'cleanup acceptance refused directory removal'
    return report
  }
  try {
    rmSync(cluster.rootDir, { recursive: true, force: true })
    report.removed = true
    report.cleaned = true
  } catch (fehler) {
    report.error = fehler instanceof Error ? fehler.message : String(fehler)
    return report
  }
  cluster = null
  httpState = null
  return report
}

function psqlSafeArgs(datenbank, extra = []) {
  if (!cluster) throw new Error('fail-closed: psql without a private cluster is forbidden')
  const args = [
    ...PSQL_NO_STARTUP,
    '-h',
    cluster.socketDir,
    '-U',
    cluster.user,
    '-d',
    datenbank,
    '-v',
    'ON_ERROR_STOP=1',
    ...extra,
  ]
  if (args.includes('-h') && args[args.indexOf('-h') + 1] !== cluster.socketDir) {
    throw new Error('fail-closed: psql host is not the owned private socket')
  }
  return args
}

function psqlFile(sql, datenbank = DB_NAME) {
  return execFileSync(cluster.psql, psqlSafeArgs(datenbank, ['-At', '-q', '-f', '-']), {
    encoding: 'utf8',
    input: sql,
    env: cleanProofEnv(),
    timeout: SUBPROCESS_TIMEOUT_MS.psql,
    stdio: ['pipe', 'pipe', 'pipe'],
  }).trim()
}

function psqlSql(sql, datenbank = DB_NAME) {
  execFileSync(cluster.psql, psqlSafeArgs(datenbank, ['-f', '-']), {
    input: sql,
    env: cleanProofEnv(),
    timeout: SUBPROCESS_TIMEOUT_MS.psql,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
}

function jsonRow(sql) {
  const roh = psqlFile(`select to_jsonb(q) from (${sql}) q;`)
  const zeile = roh
    .split('\n')
    .map((teil) => teil.trim())
    .reverse()
    .find((teil) => teil.startsWith('{') || teil.startsWith('['))
  if (!zeile) throw new Error('no JSON row from catalog query')
  return JSON.parse(zeile)
}

async function freeLoopbackPort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer()
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : 0
      server.close((fehler) => {
        if (fehler) reject(fehler)
        else resolvePort(port)
      })
    })
    server.on('error', reject)
  })
}

function wait(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

async function startePostgrest(sources) {
  const port = await freeLoopbackPort()
  const secret = randomBytes(48).toString('hex')
  const jwtFile = join(cluster.rootDir, 'jwt.secret')
  const uriFile = join(cluster.rootDir, 'db.uri')
  const configFile = join(cluster.rootDir, 'postgrest.conf')
  const dbUri = `postgres://${AUTHENTICATOR}@/${DB_NAME}?host=${cluster.socketDir}`
  writeFileSync(jwtFile, secret, { mode: 0o600 })
  writeFileSync(uriFile, dbUri, { mode: 0o600 })
  const config = buildPostgrestConfig({
    host: '127.0.0.1',
    port,
    dbUri,
    jwtFile,
  })
  assertConfigIsLoopbackOnly(config)
  writeFileSync(configFile, config, { mode: 0o600 })
  const binary = requirePostgrest(cluster.binDir)
  const child = spawn(binary, [configFile], {
    env: cleanProofEnv(),
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  httpState = {
    child,
    port,
    host: '127.0.0.1',
    origin: `http://127.0.0.1:${port}`,
    secret,
    binary,
    configFile,
    log: '',
    spawnError: null,
  }
  child.once('error', (fehler) => {
    if (httpState) httpState.spawnError = fehler
  })
  const appendLog = (chunk) => {
    if (httpState) httpState.log += sanitized(chunk.toString())
  }
  child.stdout.on('data', appendLog)
  child.stderr.on('data', appendLog)
  child.stdout.on('error', () => {})
  child.stderr.on('error', () => {})
  const deadline = Date.now() + 8_000
  let ready = false
  while (Date.now() < deadline) {
    if (httpState.spawnError) {
      throw new Error(`PostgREST spawn failed: ${sanitized(httpState.spawnError.message)}`)
    }
    if (child.exitCode != null) {
      throw new Error(`PostgREST exited early: ${sanitized(httpState.log)}`)
    }
    try {
      const antwort = await fetch(`${httpState.origin}/`, {
        signal: AbortSignal.timeout(500),
      })
      if (antwort.status > 0) {
        ready = true
        break
      }
    } catch {
      wait(80)
    }
  }
  if (!ready) {
    throw new Error(`PostgREST did not become ready on loopback: ${sanitized(httpState.log)}`)
  }
  httpState.loopbackOnly = assertProcessListensLoopbackOnly(child.pid, port)
  return { ...httpState, sources, version: postgrestVersion(binary), pgVersion: psqlFile('select version()') }
}

function postgrestVersion(binary) {
  return execFileSync(binary, ['--version'], { encoding: 'utf8', timeout: 5_000 }).trim()
}

function tokenFor(opts) {
  if (!httpState?.secret) throw new Error('no local signing material')
  return signLocalJwt(claims(opts), httpState.secret)
}

async function httpRpc(opts) {
  if (!httpState) throw new Error('PostgREST is not running')
  if (httpRequestCount >= MAX_HTTP_REQUESTS) {
    throw new Error('fail-closed: HTTP request budget exhausted')
  }
  httpRequestCount += 1
  const method = opts.method ?? 'POST'
  const path = opts.path ?? '/rpc/admin_account_counts_v1'
  const headers = { Accept: 'application/json', ...(opts.headers ?? {}) }
  if (opts.token !== undefined && opts.token !== null) {
    headers.Authorization = `Bearer ${opts.token}`
  }
  if (method !== 'GET' && opts.body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  const antwort = await fetch(`${httpState.origin}${path}`, {
    method,
    headers,
    body: method === 'GET' ? undefined : opts.body ?? '{}',
    signal: AbortSignal.timeout(SUBPROCESS_TIMEOUT_MS.http),
  })
  const text = await antwort.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  return {
    status: antwort.status,
    contentType: antwort.headers.get('content-type') ?? '',
    json,
    text: sanitized(text).slice(0, 800),
    leakedIdentity: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(text) || /user_id|display_name/.test(text),
  }
}

function functionCatalog(schema, name) {
  return jsonRow(`
    select
      n.nspname as schema,
      p.proname as name,
      pg_get_userbyid(p.proowner) as owner,
      p.prosecdef as security_definer,
      p.pronargs as nargs,
      pg_get_function_identity_arguments(p.oid) as args,
      pg_get_functiondef(p.oid) as definition,
      (
        select coalesce(jsonb_agg(acl::text order by acl::text), '[]'::jsonb)
        from unnest(coalesce(p.proacl, acldefault('f', p.proowner))) as acl
      ) as acls
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = '${schema}' and p.proname = '${name}' and p.pronargs = 0
  `)
}

function usersProtectionCatalog() {
  return jsonRow(`
    select
      pg_get_userbyid(c.relowner) as owner,
      c.relrowsecurity as rls,
      c.relforcerowsecurity as force_rls,
      (
        select coalesce(jsonb_agg(pol.polname order by pol.polname), '[]'::jsonb)
        from pg_policy pol
        where pol.polrelid = c.oid
      ) as policies,
      (
        select coalesce(jsonb_agg(acl::text order by acl::text), '[]'::jsonb)
        from unnest(coalesce(c.relacl, acldefault('r', c.relowner))) as acl
      ) as acls
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'auth' and c.relname = 'users'
  `)
}

function wrapperPresent() {
  return jsonRow(`
    select exists (
      select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'admin_account_counts_v1' and p.pronargs = 0
    ) as present
  `).present
}

function catalogSnapshot() {
  const authenticatorExists = jsonRow(`
    select exists (select 1 from pg_roles where rolname = 'jetnity_http_authenticator') as present
  `).present
  const grants = jsonRow(`
    select
      has_function_privilege('anon', 'jetnity_reporting.account_counts_v1()', 'EXECUTE') as anon_prod,
      has_function_privilege('authenticated', 'jetnity_reporting.account_counts_v1()', 'EXECUTE') as auth_prod,
      has_function_privilege('service_role', 'jetnity_reporting.account_counts_v1()', 'EXECUTE') as svc_prod,
      has_table_privilege('anon', 'auth.users', 'SELECT') as anon_users,
      has_table_privilege('authenticated', 'auth.users', 'SELECT') as auth_users,
      has_table_privilege('service_role', 'auth.users', 'SELECT') as svc_users,
      has_schema_privilege('anon', 'jetnity_reporting', 'USAGE') as anon_reporting,
      has_schema_privilege('authenticated', 'jetnity_reporting', 'USAGE') as auth_reporting,
      has_schema_privilege('anon', 'jetnity_internal', 'USAGE') as anon_internal,
      has_schema_privilege('authenticated', 'auth', 'USAGE') as auth_schema
  `)
  const wrapperGrants = wrapperPresent()
    ? jsonRow(`
        select
          has_function_privilege('anon', 'public.admin_account_counts_v1()', 'EXECUTE') as anon_wrap,
          has_function_privilege('authenticated', 'public.admin_account_counts_v1()', 'EXECUTE') as auth_wrap,
          has_function_privilege('service_role', 'public.admin_account_counts_v1()', 'EXECUTE') as svc_wrap
      `)
    : { anon_wrap: false, auth_wrap: false, svc_wrap: false }
  const authenticator = authenticatorExists
    ? jsonRow(`
        select
          has_table_privilege('jetnity_http_authenticator', 'auth.users', 'SELECT') as authenticator_users,
          pg_has_role('jetnity_http_authenticator', 'authenticated', 'MEMBER') as authenticator_member,
          pg_has_role('authenticated', 'jetnity_http_authenticator', 'MEMBER') as reverse_member
      `)
    : { authenticator_users: false, authenticator_member: false, reverse_member: false }
  return {
    producer: functionCatalog('jetnity_reporting', 'account_counts_v1'),
    users: usersProtectionCatalog(),
    wrapper: wrapperPresent(),
    authenticator_exists: authenticatorExists,
    ...grants,
    ...wrapperGrants,
    ...authenticator,
  }
}

function grantsNotWidened(snapshot) {
  return (
    snapshot.anon_users === false &&
    snapshot.auth_users === false &&
    snapshot.svc_users === false &&
    snapshot.authenticator_users === false &&
    snapshot.anon_prod === false &&
    snapshot.svc_prod === false &&
    snapshot.auth_prod === true &&
    snapshot.users.rls === true &&
    snapshot.users.force_rls === false &&
    snapshot.users.owner === 'supabase_auth_admin' &&
    Array.isArray(snapshot.users.policies) &&
    snapshot.users.policies.length === 0 &&
    snapshot.anon_internal === false &&
    snapshot.reverse_member === false
  )
}

function legeDatenbankAn(sources) {
  psqlSql(`create database ${DB_NAME}`, 'postgres')
  psqlSql([readFileSync(BOOTSTRAP, 'utf8'), readFileSync(CANDIDATE, 'utf8')].join('\n\n'))
  catalogBeforeSetup = catalogSnapshot()
  psqlSql(
    [
      readFileSync(sources.wrapper, 'utf8'),
      readFileSync(FIXTURE, 'utf8'),
      `grant connect on database ${DB_NAME} to ${AUTHENTICATOR};`,
    ].join('\n\n'),
  )
  catalogAfterSetup = catalogSnapshot()
  return { before: catalogBeforeSetup, after: catalogAfterSetup }
}

function insertRecentAccount() {
  psqlSql(`
    insert into auth.users (id, created_at, deleted_at, confirmed_at, is_anonymous)
    values ('${IDS.recent}', now() - interval '2 days', null, now() - interval '2 days', false);
    insert into public.profiles (user_id, role, status)
    values ('${IDS.recent}', 'user', 'active');
  `)
}

async function waitForSchemaCacheMissingWrapper() {
  psqlSql(`notify pgrst, 'reload schema';`)
  const deadline = Date.now() + SCHEMA_CACHE_DEADLINE_MS
  let last = null
  let probes = 0
  while (Date.now() < deadline && probes < SCHEMA_CACHE_PROBE_BUDGET) {
    last = await httpRpc({
      method: 'POST',
      token: tokenFor({ uid: IDS.moderator, aal: 'aal2' }),
      body: '{}',
    })
    probes += 1
    if (evaluateDeniedResponse(last, POSTGREST_V16_DENY.missingFunction).ok) {
      return last
    }
    wait(80)
  }
  throw new Error(
    `schema cache did not converge to 404/PGRST202 after wrapper drop: ${JSON.stringify({
      status: last?.status ?? null,
      code: last?.json?.code ?? null,
      probes,
    })}`,
  )
}

async function pruefeErfolg() {
  const gruppe = 'http-auth'
  const caller = [
    ['moderator AAL2 POST', IDS.moderator],
    ['admin AAL2 POST', IDS.admin],
    ['operator AAL2 POST', IDS.operator],
    ['owner AAL2 POST', IDS.owner],
  ]
  let firstMeasuredAt = null
  for (const [name, uid] of caller) {
    const antwort = await httpRpc({
      method: 'POST',
      token: tokenFor({ uid, aal: 'aal2' }),
      body: '{}',
    })
    const parsed = parseAdminAccountCountsPayload(antwort.json)
    const row = Array.isArray(antwort.json) ? antwort.json[0] : antwort.json
    const ok =
      antwort.status === 200 &&
      parsed.ok === true &&
      row?.present_registered_accounts === EXPECTED_PRESENT &&
      row?.created_in_prior_30_days === EXPECTED_WINDOW_ZERO &&
      row?.definition_version === 'jetnity.admin-account-counts.v1' &&
      typeof row?.present_registered_accounts === 'string' &&
      typeof row?.created_in_prior_30_days === 'string' &&
      Number(row.present_registered_accounts) >= 1 &&
      row.created_in_prior_30_days === '0'
    if (parsed.ok) {
      if (!firstMeasuredAt) firstMeasuredAt = parsed.measures.measuredAt
    }
    bewerte(
      `${name} returns deterministic TEXT counts and parser PASS`,
      gruppe,
      ok,
      JSON.stringify({
        status: antwort.status,
        present: row?.present_registered_accounts,
        window: row?.created_in_prior_30_days,
        parser: parsed.ok,
        measured_at: parsed.ok ? parsed.measures.measuredAt : null,
      }),
    )
  }

  const getAntwort = await httpRpc({
    method: 'GET',
    path: '/rpc/admin_account_counts_v1',
    token: tokenFor({ uid: IDS.moderator, aal: 'aal2' }),
  })
  const getParsed = parseAdminAccountCountsPayload(getAntwort.json)
  const getRow = Array.isArray(getAntwort.json) ? getAntwort.json[0] : getAntwort.json
  bewerte(
    'GET zero-argument RPC matches fixture counts and parser',
    'http-shape',
    getAntwort.status === 200 &&
      getParsed.ok === true &&
      getRow?.present_registered_accounts === EXPECTED_PRESENT &&
      getRow?.created_in_prior_30_days === EXPECTED_WINDOW_ZERO,
    JSON.stringify({ status: getAntwort.status, parser: getParsed.ok, present: getRow?.present_registered_accounts }),
  )
  if (getParsed.ok && firstMeasuredAt) {
    beobachte(
      'separate HTTP clocks are not required to share measured_at',
      'http-observation',
      JSON.stringify({
        first: firstMeasuredAt,
        get: getParsed.measures.measuredAt,
        identical: firstMeasuredAt === getParsed.measures.measuredAt,
      }),
    )
  }
}

async function pruefeNegativ() {
  const gruppe = 'http-deny'
  const faelle = [
    ['ordinary user AAL2', { uid: IDS.user, aal: 'aal2' }],
    ['ordinary creator AAL2', { uid: IDS.creator, aal: 'aal2' }],
    ['moderator AAL1', { uid: IDS.moderator, aal: 'aal1' }],
    ['moderator missing AAL', { uid: IDS.moderator }],
    ['no-profile AAL2', { uid: IDS.noProfile, aal: 'aal2' }],
    ['missing subject AAL2', { uid: IDS.absent, aal: 'aal2' }],
    ['soft-deleted privileged profile', { uid: IDS.softDel, aal: 'aal2' }],
    ['anonymous privileged profile', { uid: IDS.anonPriv, aal: 'aal2' }],
    [
      'top-level metadata-only privileged claim on ordinary user',
      { uid: IDS.user, aal: 'aal2', extra: { profile_role: 'owner', app_role: 'admin' } },
    ],
    [
      'user_metadata/app_metadata privileged claim on ordinary user',
      {
        uid: IDS.user,
        aal: 'aal2',
        extra: {
          user_metadata: { role: 'owner', profile_role: 'admin' },
          app_metadata: { role: 'admin' },
        },
      },
    ],
  ]
  for (const [name, opts] of faelle) {
    const antwort = await httpRpc({
      method: 'POST',
      token: tokenFor(opts),
      body: '{}',
    })
    const verdict = evaluateDeniedResponse(antwort, POSTGREST_V16_DENY.privilege)
    bewerte(
      `${name} discloses no counts`,
      gruppe,
      verdict.ok,
      JSON.stringify({
        status: antwort.status,
        code: antwort.json?.code,
        message: antwort.json?.message,
        reasons: verdict.reasons,
      }),
    )
  }

  const anon = await httpRpc({ method: 'POST', token: null, body: '{}' })
  const anonVerdict = evaluateDeniedResponse(anon, POSTGREST_V16_DENY.anon)
  bewerte(
    'anonymous HTTP caller discloses no counts',
    gruppe,
    anonVerdict.ok,
    JSON.stringify({ status: anon.status, code: anon.json?.code, reasons: anonVerdict.reasons }),
  )

  const service = await httpRpc({
    method: 'POST',
    token: tokenFor({ uid: IDS.owner, role: 'service_role', aal: 'aal2' }),
    body: '{}',
  })
  const serviceVerdict = evaluateDeniedResponse(service, POSTGREST_V16_DENY.privilege)
  bewerte(
    'synthetic service_role JWT discloses no counts',
    gruppe,
    serviceVerdict.ok,
    JSON.stringify({ status: service.status, code: service.json?.code, reasons: serviceVerdict.reasons }),
  )

  const invalid = await httpRpc({ method: 'POST', token: 'not-a-jwt', body: '{}' })
  const invalidVerdict = evaluateDeniedResponse(invalid, POSTGREST_V16_DENY.invalidJwt)
  bewerte(
    'invalid local token is rejected without counts',
    gruppe,
    invalidVerdict.ok,
    JSON.stringify({ status: invalid.status, code: invalid.json?.code, reasons: invalidVerdict.reasons }),
  )

  const expired = await httpRpc({
    method: 'POST',
    token: tokenFor({ uid: IDS.moderator, aal: 'aal2', expOffsetSec: -90 }),
    body: '{}',
  })
  const expiredVerdict = evaluateDeniedResponse(expired, POSTGREST_V16_DENY.expiredJwt)
  bewerte(
    'expired local token is rejected without counts',
    gruppe,
    expiredVerdict.ok,
    JSON.stringify({ status: expired.status, code: expired.json?.code, reasons: expiredVerdict.reasons }),
  )

  const good = tokenFor({ uid: IDS.moderator, aal: 'aal2' })
  const tampered = tamperJwtSignature(good)
  const changed = await httpRpc({ method: 'POST', token: tampered, body: '{}' })
  const tamperVerdict = evaluateDeniedResponse(changed, POSTGREST_V16_DENY.invalidJwt)
  bewerte(
    'tampered local token is rejected without counts',
    gruppe,
    tamperVerdict.ok && tampered !== good,
    JSON.stringify({
      status: changed.status,
      code: changed.json?.code,
      reasons: tamperVerdict.reasons,
      signatureChanged: tampered.split('.')[2] !== good.split('.')[2],
    }),
  )

  bewerte(
    'negative paths keep distinct PostgREST v16 status/code classes',
    gruppe,
    anonVerdict.ok &&
      serviceVerdict.ok &&
      invalidVerdict.ok &&
      expiredVerdict.ok &&
      tamperVerdict.ok &&
      anon.status === 401 &&
      anon.json?.code === '42501' &&
      service.status === 403 &&
      service.json?.code === '42501' &&
      invalid.status === 401 &&
      invalid.json?.code === 'PGRST301' &&
      expired.status === 401 &&
      expired.json?.code === 'PGRST303',
    JSON.stringify({
      anon: { status: anon.status, code: anon.json?.code },
      service: { status: service.status, code: service.json?.code },
      invalid: { status: invalid.status, code: invalid.json?.code },
      expired: { status: expired.status, code: expired.json?.code },
      tampered: { status: changed.status, code: changed.json?.code },
    }),
  )
}

async function pruefeSchemaHttp() {
  const token = tokenFor({ uid: IDS.moderator, aal: 'aal2' })
  const profileProbes = [
    ['GET', '/users', 'auth', 'Accept-Profile auth.users is an excluded schema'],
    ['POST', '/rpc/account_counts_v1', 'jetnity_reporting', 'Content-Profile jetnity_reporting is an excluded schema'],
    ['GET', '/rpc/account_counts_v1', 'jetnity_internal', 'Accept-Profile jetnity_internal is an excluded schema'],
  ]
  for (const [method, path, schema, name] of profileProbes) {
    const antwort = await httpRpc({
      method,
      path,
      token,
      headers: schemaProfileHeaders(method, schema),
      body: method === 'GET' ? undefined : '{}',
    })
    const verdict = evaluateDeniedResponse(antwort, POSTGREST_V16_DENY.excludedSchema)
    bewerte(
      name,
      'http-schema-profile',
      verdict.ok && !/email|@/.test(antwort.text),
      JSON.stringify({
        method,
        path,
        schema,
        header: schemaProfileHeaders(method, schema),
        status: antwort.status,
        code: antwort.json?.code,
        reasons: verdict.reasons,
      }),
    )
  }

  const publicProfile = await httpRpc({
    method: 'GET',
    path: '/rpc/admin_account_counts_v1',
    token,
    headers: schemaProfileHeaders('GET', 'public'),
  })
  const publicParsed = parseAdminAccountCountsPayload(publicProfile.json)
  const publicRow = Array.isArray(publicProfile.json) ? publicProfile.json[0] : publicProfile.json
  bewerte(
    'Accept-Profile public remains the successful exposed schema',
    'http-schema-profile',
    publicProfile.status === 200 &&
      publicParsed.ok === true &&
      publicRow?.present_registered_accounts === EXPECTED_PRESENT &&
      publicRow?.created_in_prior_30_days === EXPECTED_WINDOW_ZERO,
    JSON.stringify({ status: publicProfile.status, parser: publicParsed.ok, present: publicRow?.present_registered_accounts }),
  )

  const routeShapes = [
    ['/rpc/account_counts_v1', POSTGREST_V16_DENY.missingFunction, 'public-schema producer name is a missing-function route shape'],
    ['/auth/users', POSTGREST_V16_DENY.invalidPath, 'slash-auth path is an invalid-route shape, not schema selection'],
    ['/jetnity_reporting', POSTGREST_V16_DENY.missingTable, 'slash-schema path is a missing-public-table route shape'],
    ['/jetnity_internal', POSTGREST_V16_DENY.missingTable, 'slash-internal path is a missing-public-table route shape'],
  ]
  for (const [path, expected, name] of routeShapes) {
    const antwort = await httpRpc({ method: 'GET', path, token })
    const verdict = evaluateDeniedResponse(antwort, expected)
    bewerte(
      name,
      'http-route-shape',
      verdict.ok && !discloseCounts(antwort.json) && !/email|@/.test(antwort.text),
      JSON.stringify({ path, status: antwort.status, code: antwort.json?.code, reasons: verdict.reasons }),
    )
  }

  const extra = await httpRpc({
    method: 'POST',
    token,
    body: JSON.stringify({ unexpected: 1 }),
  })
  const extraVerdict = evaluateDeniedResponse(extra, POSTGREST_V16_DENY.missingFunction)
  bewerte(
    'extra POST arguments do not return a successful count row',
    'http-shape',
    extraVerdict.ok,
    JSON.stringify({
      status: extra.status,
      code: extra.json?.code,
      parser: parseAdminAccountCountsPayload(extra.json),
      reasons: extraVerdict.reasons,
    }),
  )

  const projection = await httpRpc({
    method: 'GET',
    path: '/rpc/admin_account_counts_v1?select=present_registered_accounts',
    token,
  })
  const projectedParse = parseAdminAccountCountsPayload(projection.json)
  bewerte(
    'projection/empty shapes are parser-invalid, not a successful zero',
    'parser',
    projectedParse.ok === false,
    JSON.stringify({ status: projection.status, parser: projectedParse, body: projection.json }),
  )

  const emptyParse = parseAdminAccountCountsPayload([])
  const zeroObject = parseAdminAccountCountsPayload({
    present_registered_accounts: '0',
    created_in_prior_30_days: '0',
    measured_at: '2026-01-01T00:00:00Z',
    window_start: '2025-12-02T00:00:00Z',
    definition_version: 'jetnity.admin-account-counts.v1',
  })
  bewerte(
    'frozen parser rejects empty array and a synthetic zero present row',
    'parser',
    emptyParse.ok === false && zeroObject.ok === false,
    JSON.stringify({ empty: emptyParse, zero: zeroObject }),
  )
}

async function pruefeRecentWindow() {
  insertRecentAccount()
  const antwort = await httpRpc({
    method: 'POST',
    token: tokenFor({ uid: IDS.moderator, aal: 'aal2' }),
    body: '{}',
  })
  const parsed = parseAdminAccountCountsPayload(antwort.json)
  const row = Array.isArray(antwort.json) ? antwort.json[0] : antwort.json
  bewerte(
    'labelled recent-account fixture yields present=11 window=1 through HTTP',
    'http-auth',
    antwort.status === 200 &&
      parsed.ok === true &&
      row?.present_registered_accounts === EXPECTED_PRESENT_AFTER_RECENT &&
      row?.created_in_prior_30_days === EXPECTED_WINDOW_AFTER_RECENT,
    JSON.stringify({
      status: antwort.status,
      present: row?.present_registered_accounts,
      window: row?.created_in_prior_30_days,
      parser: parsed.ok,
    }),
  )
}

async function pruefeLargeTransport() {
  const antwort = await httpRpc({
    method: 'POST',
    path: '/rpc/jetnity_http_proof_1_large_text',
    token: tokenFor({ uid: IDS.moderator, aal: 'aal2' }),
    body: '{}',
  })
  const row = Array.isArray(antwort.json) ? antwort.json[0] : antwort.json
  bewerte(
    'synthetic large-value TEXT transport keeps exact 9007199254740993 and signed bigint max',
    'http-large-transport',
    antwort.status === 200 &&
      row?.js_safe_overflow === '9007199254740993' &&
      row?.signed_bigint_max === '9223372036854775807' &&
      typeof row?.js_safe_overflow === 'string',
    JSON.stringify({ status: antwort.status, row }),
  )
}

function pruefeCatalogBeforeAfterSetup() {
  const before = catalogBeforeSetup
  const after = catalogAfterSetup
  bewerte(
    'producer definition/owner/ACL unchanged by wrapper and authenticator setup',
    'sql-catalog',
    sameCatalogIdentity(before.producer, after.producer) &&
      after.producer.owner === 'postgres' &&
      after.producer.security_definer === true,
    JSON.stringify({
      ownerBefore: before.producer.owner,
      ownerAfter: after.producer.owner,
      definitionUnchanged: before.producer.definition === after.producer.definition,
      aclsUnchanged: JSON.stringify(before.producer.acls) === JSON.stringify(after.producer.acls),
    }),
  )
  bewerte(
    'auth.users owner/RLS/policies unchanged by wrapper and authenticator setup',
    'sql-catalog',
    sameUsersProtection(before.users, after.users) &&
      after.users.owner === 'supabase_auth_admin' &&
      after.users.rls === true &&
      after.users.force_rls === false &&
      Array.isArray(after.users.policies) &&
      after.users.policies.length === 0,
    JSON.stringify({ before: before.users, after: after.users }),
  )
  bewerte(
    'setup added only the allowed wrapper and authenticator membership',
    'sql-catalog',
    before.wrapper === false &&
      after.wrapper === true &&
      before.authenticator_exists === false &&
      after.authenticator_exists === true &&
      after.authenticator_member === true &&
      after.auth_wrap === true &&
      after.anon_wrap === false &&
      after.svc_wrap === false &&
      grantsNotWidened(after),
    JSON.stringify({
      wrapperBefore: before.wrapper,
      wrapperAfter: after.wrapper,
      authenticatorBefore: before.authenticator_exists,
      authenticatorMemberAfter: after.authenticator_member,
      authenticatorUsers: after.authenticator_users,
    }),
  )
}

async function pruefeMissingWrapper() {
  psqlSql('drop function public.admin_account_counts_v1();')
  const antwort = await waitForSchemaCacheMissingWrapper()
  const verdict = evaluateDeniedResponse(antwort, POSTGREST_V16_DENY.missingFunction)
  bewerte(
    'missing wrapper converges to 404/PGRST202, not a successful zero',
    'http-schema-cache',
    verdict.ok && parseAdminAccountCountsPayload(antwort.json).ok === false,
    JSON.stringify({
      status: antwort.status,
      code: antwort.json?.code,
      message: antwort.json?.message,
      reasons: verdict.reasons,
    }),
  )
  const afterDrop = catalogSnapshot()
  bewerte(
    'producer definition/owner/ACL unchanged after wrapper-only drop',
    'sql-catalog',
    sameCatalogIdentity(catalogBeforeSetup.producer, afterDrop.producer) &&
      sameCatalogIdentity(catalogAfterSetup.producer, afterDrop.producer),
    JSON.stringify({
      present: Boolean(afterDrop.producer?.definition),
      owner: afterDrop.producer.owner,
      definitionUnchanged: catalogBeforeSetup.producer.definition === afterDrop.producer.definition,
    }),
  )
  bewerte(
    'auth.users owner/RLS/policies unchanged after wrapper-only drop',
    'sql-catalog',
    sameUsersProtection(catalogBeforeSetup.users, afterDrop.users) &&
      sameUsersProtection(catalogAfterSetup.users, afterDrop.users),
    JSON.stringify(afterDrop.users),
  )
  bewerte(
    'wrapper-only drop removes the wrapper and keeps the separately allowed authenticator membership',
    'sql-catalog',
    afterDrop.wrapper === false &&
      afterDrop.authenticator_exists === true &&
      afterDrop.authenticator_member === true &&
      grantsNotWidened(afterDrop),
    JSON.stringify({
      wrapper: afterDrop.wrapper,
      authenticator_member: afterDrop.authenticator_member,
      auth_prod: afterDrop.auth_prod,
      authenticator_users: afterDrop.authenticator_users,
    }),
  )
}

function pruefeStatischeQuelle() {
  const gruppe = 'static-source'
  const wrapper = readFileSync(join(cluster.sourceDir, 'admin-account-counts-delivery-1-rpc.sql'), 'utf8')
  const fixture = readFileSync(FIXTURE, 'utf8')
  const runner = readFileSync(fileURLToPath(import.meta.url), 'utf8')
  bewerte(
    'runner never imports sql.mjs or app env connectors',
    gruppe,
    !/from\s+['"][^'"]*sql\.mjs['"]/.test(runner) &&
      !/\bloadEnvConfig\b/.test(runner) &&
      !/['"]sudo['"]/.test(runner),
    'source scan',
  )
  bewerte(
    'wrapper remains zero-argument SECURITY INVOKER TEXT transport',
    gruppe,
    /security invoker/i.test(wrapper) && /btrim\(inner_row\.present_registered_accounts::text\)/.test(wrapper),
    'source scan',
  )
  bewerte(
    'large-value fixture is labelled disposable and is not the producer',
    gruppe,
    /DISPOSABLE LARGE-VALUE TRANSPORT FIXTURE/.test(fixture) &&
      /Not the guarded producer/.test(fixture) &&
      /jetnity_http_proof_1_large_text/.test(fixture),
    'source scan',
  )
}

async function main() {
  assertIsolatedHttpEnvironment()
  const bins = requirePgBinsPrefer17()
  const pgVersionText = execFileSync(bins.postgres, ['-V'], { encoding: 'utf8' }).trim()
  const uses17 = /17\./.test(pgVersionText)
  console.log(`preflight postgresql ${pgVersionText}`)
  if (!uses17) {
    console.log('LIMITATION: PostgreSQL 17 binaries were preferred but this run would qualify PostgreSQL 16.')
  }

  let cleanupReport = null
  try {
    const state = starteCluster()
    const sources = exportFrozenSources(state.sourceDir)
    assertExactSourceHashes(sources.hashes)
    parseAdminAccountCountsPayload = await loadFrozenParser(sources.parserLocal)
    console.log(`source hashes match ${SNAPSHOT}`)
    legeDatenbankAn(sources)
    const started = await startePostgrest(sources)
    console.log(`postgrest ${started.version} loopback ${started.origin}`)
    console.log(`postgresql ${started.pgVersion}`)
    bewerte(
      'PostgREST listens on 127.0.0.1 only with owned LISTEN sockets',
      'http-isolation',
      started.loopbackOnly?.loopback === true &&
        started.loopbackOnly?.listenState === TCP_LISTEN_STATE &&
        Number.isInteger(started.loopbackOnly?.pid) &&
        started.loopbackOnly.pid === started.child.pid,
      JSON.stringify(started.loopbackOnly),
    )

    pruefeStatischeQuelle()
    pruefeCatalogBeforeAfterSetup()
    await pruefeErfolg()
    await pruefeNegativ()
    await pruefeSchemaHttp()
    await pruefeRecentWindow()
    await pruefeLargeTransport()
    await pruefeMissingWrapper()
  } catch (fehler) {
    console.error(sanitized(fehler instanceof Error ? fehler.stack ?? fehler.message : String(fehler)))
    cleanupReport = await stoppeCluster()
    if (cleanupReport.error) console.error('CLEANUP FAILED:', cleanupReport)
    process.exit(1)
  }

  cleanupReport = await stoppeCluster()
  if (cleanupReport.error) {
    console.error('CLEANUP FAILED:', cleanupReport)
    process.exit(1)
  }
  const cleanupVerdict = evaluateCleanupAcceptance(cleanupReport)
  bewerte(
    'owned cluster and PostgREST stopped before data removal',
    'cleanup-node',
    cleanupVerdict.ok && cleanupReport.httpStopped === true && cleanupReport.httpReaped === true,
    JSON.stringify(cleanupReport),
  )
  console.log(`cleanup ${JSON.stringify(cleanupReport)}`)
  console.log(`http_requests=${httpRequestCount}`)

  const byGruppe = ergebnisse.reduce((acc, eintrag) => {
    acc[eintrag.gruppe] = (acc[eintrag.gruppe] ?? 0) + 1
    return acc
  }, {})
  const fehler = ergebnisse.filter((eintrag) => !eintrag.ok)
  console.log(`\n${ergebnisse.length - fehler.length}/${ergebnisse.length} HTTP-proof assertions satisfied.`)
  console.log(`${beobachtungen.length} observations (not counted as assertions).`)
  console.log(`assertion categories: ${JSON.stringify(byGruppe)}`)
  console.log('Target: private PostgreSQL + numeric-loopback PostgREST. Hosted Supabase untouched.')
  if (fehler.length) {
    console.error('Failed:')
    for (const eintrag of fehler) {
      console.error(`- [${eintrag.gruppe}] ${eintrag.name}: ${sanitized(eintrag.detail)}`)
    }
    process.exit(1)
  }
}

function invokedAsMain() {
  const entry = process.argv[1]
  if (!entry) return false
  return fileURLToPath(import.meta.url) === resolve(entry)
}

export {
  HTTP_FORBIDDEN_KEYS,
  EXPECTED,
  SNAPSHOT,
  POSTGREST_TAR_SHA256,
  POSTGREST_URL,
  TCP_LISTEN_STATE,
}

if (invokedAsMain()) {
  main().catch((fehler) => {
    console.error(sanitized(fehler instanceof Error ? fehler.stack ?? fehler.message : String(fehler)))
    stoppeCluster().then((report) => {
      if (report.error) console.error('CLEANUP FAILED:', report)
      process.exit(1)
    })
  })
}
