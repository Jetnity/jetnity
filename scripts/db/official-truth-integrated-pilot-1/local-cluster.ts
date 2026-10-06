// Developer proof only: owns a newly created cluster, never accepts a connection URL.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const ownedClusters = new WeakSet<object>()
const binaries = ['initdb', 'pg_ctl', 'postgres', 'psql'] as const
export type LocalPgBins = Record<(typeof binaries)[number], string>
const forbidden = /^(PG|DATABASE_URL$|DIRECT_URL$|POSTGRES|SUPABASE_.*(URL|CONNECTION|REF|PASSWORD)|JETNITY_.*(DB|REMOTE))/i
export function assertLocalProofEnvironment(env: Readonly<Record<string, string | undefined>> = process.env, argv: readonly string[] = process.argv): void {
  if (Object.entries(env).some(([key, value]) => value && forbidden.test(key))) throw new Error('local_proof_connection_override_forbidden')
  if (argv.some(arg => /postgres(?:ql)?:\/\/|supabase\.(co|com)|--(?:dsn|host|database|port|connection)/i.test(arg))) throw new Error('local_proof_connection_argument_forbidden')
}
export function findLocalPgBins(): LocalPgBins | null {
  const roots = [resolve(repository, '../postgresql-toolchain/install/bin'), '/usr/lib/postgresql/17/bin', '/usr/lib/postgresql/16/bin', '/usr/lib/postgresql/15/bin', '/opt/homebrew/opt/postgresql@17/bin', '/opt/homebrew/opt/postgresql@16/bin', '/Applications/Postgres.app/Contents/Versions/17/bin']
  for (const root of roots) if (binaries.every(name => existsSync(join(root, name)))) return Object.fromEntries(binaries.map(name => [name, join(root, name)])) as LocalPgBins
  return null
}
export function assertOwnedLocalProofCluster(cluster: object): void {
  if (!ownedClusters.has(cluster)) throw new Error('local_proof_foreign_cluster')
}
export type LocalProofCluster = Readonly<{ socket: string; port: number; user: string; database: string; root: string; version: string; stop(): void }>
export function startLocalProofCluster(): LocalProofCluster {
  assertLocalProofEnvironment()
  const bins = findLocalPgBins()
  if (!bins) throw new Error('local_postgresql_not_available')
  const root = mkdtempSync(join(tmpdir(), 'ot-pilot-1-'))
  const data = join(root, 'data'), socket = join(root, 'socket')
  mkdirSync(socket, { mode: 0o700 })
  const env = { ...process.env }
  for (const key of Object.keys(env)) if (/^(PG|PSQL)/.test(key)) delete env[key]
  const user = 'ot_pilot_owner', port = 5432
  let started = false, stopped = false
  let owned: LocalProofCluster | null = null
  const run = (path: string, args: string[], timeout = 45_000) => execFileSync(path, args, { env, encoding: 'utf8', stdio: 'pipe', timeout, maxBuffer: 1_048_576 })
  const alive = () => {
    const path = join(data, 'postmaster.pid')
    if (!existsSync(path)) return false
    const pid = Number(readFileSync(path, 'utf8').split('\n')[0])
    if (!Number.isInteger(pid) || pid <= 1) return false
    try { process.kill(pid, 0); return true } catch { return false }
  }
  function stop() {
    if (stopped) return
    if (started || alive()) {
      try { run(bins!.pg_ctl, ['-D', data, '-m', 'fast', '-w', '-t', '20', 'stop']) } catch { if (alive()) throw new Error('local_postgresql_cleanup_failed') }
    }
    if (alive()) throw new Error('local_postgresql_cleanup_failed')
    rmSync(root, { recursive: true, force: true }); stopped = true
    if (owned) ownedClusters.delete(owned)
  }
  try {
    run(bins.initdb, ['-D', data, '--no-locale', '--encoding=UTF8', '--auth-local=trust', '--auth-host=reject', '--username', user, '--no-sync'], 60_000)
    writeFileSync(join(data, 'postgresql.auto.conf'), ["listen_addresses = ''", `unix_socket_directories = '${socket.replaceAll("'", "''")}'`, 'unix_socket_permissions = 0700', `port = ${port}`, "timezone = 'UTC'", 'log_statement = none', 'log_min_error_statement = panic', 'log_parameter_max_length = 0', 'log_parameter_max_length_on_error = 0'].join('\n'))
    run(bins.pg_ctl, ['-D', data, '-l', join(root, 'postgres.log'), '-w', '-t', '30', 'start']); started = true
    const version = run(bins.postgres, ['--version']).trim()
    owned = Object.freeze({ socket, port, user, database: 'postgres', root, version, stop })
    ownedClusters.add(owned)
    return owned
  } catch { stop(); throw new Error('local_postgresql_start_failed') }
}
