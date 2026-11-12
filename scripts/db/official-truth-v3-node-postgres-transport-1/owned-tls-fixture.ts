// TEST ONLY. A new TCP/TLS fixture; the original Unix-socket proof wire is untouched.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash, randomBytes } from 'node:crypto'
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer, connect as tcpConnect, type Socket } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { performance } from 'node:perf_hooks'
import type { TestContext } from 'node:test'
import { connect as tlsConnect, createSecureContext, TLSSocket } from 'node:tls'
import { Client, Query } from 'pg'
import { V3_PG_LOGINS, type V3PgLogin, type V3PgTarget } from '../../../lib/readiness/official-truth-product-v3/transport/node-postgres-selection'

const owned = new WeakSet<object>(), ADMIN = 'ot_pg_transport_fixture_admin'
const pause = (n: number) => new Promise<void>(r => setTimeout(r, n))
/** Observers call the pinned real methods and never fabricate a wire reply.
 * Only otv3 clients are counted; the independent fixture inspector is excluded. */
function observeLocalCallbacks(t: TestContext) {
  type PinnedClient = Client & {
    connectionParameters: { application_name?: string };
    connection: NodeJS.EventEmitter & { stream: Socket | TLSSocket };
    _handleAuthSASLContinue(message: unknown): Promise<void>;
  }
  type Pending = 'connect' | 'auth' | 'query' | 'socket'
  const active: Record<Pending, number> = { connect: 0, auth: 0, query: 0, socket: 0 }
  const calls: Record<Pending, number> = { connect: 0, auth: 0, query: 0, socket: 0 }
  let callbacks = 0, lastCallbackAt = 0
  const touch = () => { callbacks++; lastCallbackAt = performance.now() }
  function begin(kind: Pending) {
    active[kind]++; calls[kind]++; touch(); let finished = false
    return () => { touch(); if (!finished) { finished = true; active[kind]-- } }
  }
  const selected = (client: PinnedClient) => /^otv3:(method|intake|jobs|writer|reader|verifier):[wc]:[a-f0-9]{24}$/.test(client.connectionParameters.application_name ?? '')
  const originalConnect = Client.prototype.connect, originalQuery = Client.prototype.query
  const prototype = Client.prototype as PinnedClient, originalAuth = prototype._handleAuthSASLContinue
  const connectSpy = t.mock.method(Client.prototype, 'connect', function (this: Client, ...args: unknown[]) {
    const client = this as PinnedClient
    if (!selected(client)) return Reflect.apply(originalConnect, this, args)
    assert.equal(args.length, 0, 'real production adapter uses its owned connect promise')
    const finish = begin('connect'), seen = new Set<Socket>()
    const track = (socket: Socket) => { if (!seen.has(socket)) { seen.add(socket); socket.once('close', begin('socket')) } }
    track(client.connection.stream)
    client.connection.once('sslconnect', () => track(client.connection.stream))
    client.once('end', touch)
    return Promise.resolve(Reflect.apply(originalConnect, this, args)).finally(finish)
  } as typeof Client.prototype.connect)
  const authSpy = t.mock.method(prototype, '_handleAuthSASLContinue', function (this: PinnedClient, message: unknown) {
    if (!selected(this)) return Reflect.apply(originalAuth, this, [message])
    const finish = begin('auth')
    return Promise.resolve(Reflect.apply(originalAuth, this, [message])).finally(finish)
  })
  const querySpy = t.mock.method(Client.prototype, 'query', function (this: Client, ...args: unknown[]) {
    if (selected(this as PinnedClient)) {
      const query = args[0]; assert.ok(query instanceof Query, 'real production adapter owns a concrete Query')
      const finish = begin('query')
      query.on('row', touch); query.once('error', finish); query.once('end', finish)
    }
    return Reflect.apply(originalQuery, this, args)
  } as typeof Client.prototype.query)
  return { snapshot: () => ({ active: { ...active }, calls: { ...calls }, callbacks, lastCallbackAt }),
    restore() { querySpy.mock.restore(); authSpy.mock.restore(); connectSpy.mock.restore() } }
}
function command(binary: string, args: readonly string[], timeout = 15000): string {
  const result = spawnSync(binary, [...args], { encoding: 'utf8', timeout, maxBuffer: 1_048_576,
    env: { PATH: process.env.PATH, LANG: 'C', LC_ALL: 'C', TZ: 'UTC' } })
  assert.equal(result.status, 0, 'owned fixture command failed')
  return result.stdout.trim()
}
async function vacantPort(): Promise<number> {
  const server = createServer()
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve) })
  const address = server.address(); assert.ok(address && typeof address !== 'string')
  const port = address.port
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  return port
}
type ProxyMode = 'pass' | 'lose_commit' | 'lose_both'
async function ownedProxy(port: number, certificate: string, key: string) {
  const context = createSecureContext({ key, cert: certificate, minVersion: 'TLSv1.2' })
  const sockets = new Set<Socket>(), closing = new Set<Promise<void>>()
  const sessions = new Set<{ front: TLSSocket; back: TLSSocket; application: string }>()
  let mode: ProxyMode = 'pass', lost = 0, lastLossAt = 0, unexpected = false
  function track<T extends Socket>(socket: T): T {
    sockets.add(socket)
    let settled!: () => void
    const pending = new Promise<void>(r => { settled = r }); closing.add(pending)
    socket.once('close', () => { sockets.delete(socket); closing.delete(pending); settled() })
    socket.on('error', () => {})
    return socket
  }
  const server = createServer(raw => {
    track(raw)
    raw.once('data', negotiation => {
      if (negotiation.length !== 8 || negotiation.readInt32BE(0) !== 8 || negotiation.readInt32BE(4) !== 80877103) {
        unexpected = true; raw.destroy(); return
      }
      raw.write('S')
      const front = track(new TLSSocket(raw, { isServer: true, secureContext: context }))
      const backRaw = track(tcpConnect({ host: '127.0.0.1', port }))
      front.once('close', () => backRaw.destroy())
      backRaw.once('close', () => front.destroy())
      backRaw.once('connect', () => { const frame = Buffer.alloc(8); frame.writeInt32BE(8); frame.writeInt32BE(80877103, 4); backRaw.write(frame) })
      backRaw.once('data', support => {
        if (support.length !== 1 || support[0] !== 83) { unexpected = true; front.destroy(); backRaw.destroy(); return }
        const back = track(tlsConnect({ socket: backRaw, servername: 'localhost', ca: certificate, rejectUnauthorized: true, minVersion: 'TLSv1.2' }))
        const state = { front, back, application: '' }; sessions.add(state)
        let startup = Buffer.alloc(0), started = false, inbound = Buffer.alloc(0)
        front.on('data', chunk => {
          if (!started) {
            startup = Buffer.concat([startup, chunk])
            if (startup.length > 8192) { unexpected = true; front.destroy(); back.destroy(); return }
            if (startup.length < 4 || startup.length < startup.readInt32BE(0)) return
            const length = startup.readInt32BE(0)
            if (length < 8 || startup.readInt32BE(4) !== 196608) { unexpected = true; front.destroy(); back.destroy(); return }
            const items = startup.subarray(8, length - 1).toString('utf8').split('\u0000')
            for (let i = 0; i < items.length - 1; i += 2) if (items[i] === 'application_name') state.application = items[i + 1]!
            assert.match(state.application, /^otv3:(method|intake|jobs|writer|reader|verifier):[wc]:[a-f0-9]{24}$/)
            started = true; back.write(startup); startup = Buffer.alloc(0)
          } else back.write(chunk)
        })
        back.on('data', chunk => {
          inbound = Buffer.concat([inbound, chunk])
          if (inbound.length > 4_194_304) { unexpected = true; front.destroy(); back.destroy(); return }
          let offset = 0
          while (inbound.length - offset >= 5) {
            const length = inbound.readInt32BE(offset + 1)
            if (length < 4 || length > 4_194_304) { unexpected = true; front.destroy(); back.destroy(); return }
            if (inbound.length - offset < length + 1) break
            const frame = inbound.subarray(offset, offset + length + 1)
            const commit = frame[0] === 67 && frame.subarray(5).toString('utf8') === 'COMMIT\u0000'
            if (commit && state.application.includes(':w:') && mode !== 'pass') {
              // Drop the actual backend CommandComplete(COMMIT), not a synthesized
              // client flag. The inspector independently reads the committed row.
              lost++; lastLossAt = performance.now()
              if (mode === 'lose_both') {
                const kind = state.application.split(':')[1]
                for (const other of sessions) if (other.application.startsWith(`otv3:${kind}:`)) other.front.destroy()
              } else front.destroy()
              mode = 'pass'; back.destroy(); break
            }
            front.write(frame); offset += length + 1
          }
          inbound = offset === inbound.length ? Buffer.alloc(0) : Buffer.from(inbound.subarray(offset))
        })
        front.once('close', () => { sessions.delete(state); back.destroy() })
        back.once('close', () => { sessions.delete(state); front.destroy() })
      })
    })
  })
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve) })
  const address = server.address(); assert.ok(address && typeof address !== 'string')
  return { port: address.port,
    loseNextCommit(both = false) { assert.equal(mode, 'pass'); mode = both ? 'lose_both' : 'lose_commit' },
    snapshot: () => ({ sockets: sockets.size, sessions: sessions.size, lost, lastLossAt, unexpected }),
    async close() {
      const stopped = new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
      for (const socket of sockets) socket.destroy()
      await Promise.all([...closing]); await stopped
      assert.equal(sockets.size, 0); assert.equal(sessions.size, 0)
    },
  }
}

export async function startOwnedTlsPgFixture(t: TestContext) {
  assert.notEqual(process.getuid?.(), 0, 'initdb must run as the unprivileged CI owner')
  const bin = command('pg_config', ['--bindir']), version = command(join(bin, 'postgres'), ['--version'])
  assert.match(version, /^postgres \(PostgreSQL\) 17\./)
  const root = mkdtempSync(join(tmpdir(), 'jetnity-v3-pg-tls-')), data = join(root, 'data')
  const adminPassword = randomBytes(32).toString('hex'), loginPassword = randomBytes(32).toString('hex')
  const pw = join(root, 'synthetic-password'), certPath = join(root, 'fixture.crt'), keyPath = join(root, 'fixture.key')
  writeFileSync(pw, adminPassword + '\n', { mode: 0o600 })
  let running = false, proxy: Awaited<ReturnType<typeof ownedProxy>> | null = null, inspector: Client | null = null
  const clientClosures = new Set<Promise<unknown>>(), callbacks = observeLocalCallbacks(t)
  try {
    command(join(bin, 'initdb'), ['-D', data, '-U', ADMIN, '--pwfile', pw, '-A', 'scram-sha-256', '--encoding=UTF8', '--locale=C'])
    command('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', '/CN=localhost',
      '-addext', 'subjectAltName=DNS:localhost', '-keyout', keyPath, '-out', certPath])
    chmodSync(keyPath, 0o600)
    const port = await vacantPort(), certificate = readFileSync(certPath, 'utf8'), key = readFileSync(keyPath, 'utf8')
    writeFileSync(join(data, 'postgresql.auto.conf'), `listen_addresses='127.0.0.1'\nport=${port}\nssl=on\nssl_cert_file='${certPath}'\nssl_key_file='${keyPath}'\npassword_encryption='scram-sha-256'\nmax_connections=32\ntrack_activity_query_size=8192\n`, { mode: 0o600 })
    command(join(bin, 'pg_ctl'), ['-D', data, '-l', join(root, 'server.log'), '-w', '-t', '10', 'start'])
    running = true
    function client(user: string, password: string): Client {
      const c = new Client({ host: '127.0.0.1', port, user, password, database: 'postgres',
        ssl: { ca: certificate, servername: 'localhost', rejectUnauthorized: true }, sslnegotiation: 'postgres',
        connectionTimeoutMillis: 1000, statement_timeout: 5000, query_timeout: 0, application_name: 'owned_transport_fixture',
        options: '-c search_path=pg_catalog -c timezone=UTC', enableChannelBinding: true })
      c.on('error', () => {})
      return c
    }
    inspector = client(ADMIN, adminPassword); await inspector.connect()
    const guard = await inspector.query(`SELECT current_user AS owner,current_setting('data_directory') AS directory,
      pg_catalog.inet_server_addr()::text AS address,pg_catalog.inet_server_port() AS port,
      (SELECT ssl FROM pg_catalog.pg_stat_ssl WHERE pid=pg_catalog.pg_backend_pid()) AS tls`)
    assert.deepEqual(guard.rows, [{ owner: ADMIN, directory: data, address: '127.0.0.1', port, tls: true }])
    for (const entry of Object.values(V3_PG_LOGINS)) {
      await inspector.query(`CREATE ROLE ${entry.login} LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 2 PASSWORD '${loginPassword}'`)
    }
    for (const kind of ['method','intake','jobs'] as const) {
      const spec = V3_PG_LOGINS[kind]
      await inspector.query(`CREATE ROLE ${spec.role} NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`)
      await inspector.query(`GRANT ${spec.role} TO ${spec.login} WITH ADMIN FALSE, INHERIT FALSE, SET TRUE`)
    }
    await inspector.query(`CREATE SCHEMA transport_fixture;
      REVOKE ALL ON SCHEMA transport_fixture FROM PUBLIC;
      CREATE TABLE transport_fixture.effects(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,login text NOT NULL,role text NOT NULL,original text NOT NULL,epoch integer);
      CREATE FUNCTION transport_fixture.commit_gate() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $f$
      BEGIN IF NEW.original LIKE '%"commit_block":true%' THEN PERFORM pg_catalog.pg_sleep(10); END IF; RETURN NEW; END $f$;
      REVOKE ALL ON FUNCTION transport_fixture.commit_gate() FROM PUBLIC;
      CREATE CONSTRAINT TRIGGER owned_commit_gate AFTER INSERT ON transport_fixture.effects
      DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION transport_fixture.commit_gate();
      CREATE FUNCTION transport_fixture.effect(p_original text,p_epoch integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
      SET search_path=pg_catalog AS $f$ BEGIN
        INSERT INTO transport_fixture.effects(login,role,original,epoch) VALUES(session_user,current_setting('role'),p_original,p_epoch);
        IF p_original LIKE '%"block":true%' THEN PERFORM pg_catalog.pg_sleep(10); END IF;
        RETURN '{"status":"recorded","big":9007199254740993,"null":null,"original":"  text stays text  "}'::jsonb;
      END $f$;
      REVOKE ALL ON FUNCTION transport_fixture.effect(text,integer) FROM PUBLIC;
      CREATE SCHEMA official_v3_method_api; CREATE SCHEMA official_v3_intake_api; CREATE SCHEMA official_v3_jobs_api; CREATE SCHEMA official_v3_result_api;
      REVOKE ALL ON SCHEMA official_v3_method_api,official_v3_intake_api,official_v3_jobs_api,official_v3_result_api FROM PUBLIC`)
    await inspector.query(`CREATE FUNCTION official_v3_method_api.read_current_v1(text,integer,text,text,text)
      RETURNS TABLE(status text,method_id text,revision integer,method_digest text,package_digest text,epoch bigint,approval_mode text,approval_until timestamptz,observed_at timestamptz,remaining_ms bigint)
      LANGUAGE plpgsql SET search_path=pg_catalog AS $f$ BEGIN
      IF $1='pg_transport_fixture_block' THEN PERFORM pg_catalog.pg_sleep(10); END IF;
      RETURN QUERY SELECT 'absent'::text,$1,NULL::integer,NULL::text,NULL::text,0::bigint,NULL::text,NULL::timestamptz,'2026-11-12 10:00:00.123456+00'::timestamptz,0::bigint; END $f$;
      CREATE FUNCTION official_v3_intake_api.read_v1(jsonb,text,integer) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $f$ SELECT transport_fixture.effect($1::text,NULL) $f$;
      CREATE FUNCTION official_v3_intake_api.capture_v1(jsonb,text,text) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $f$ SELECT transport_fixture.effect($2,NULL) $f$;
      CREATE FUNCTION official_v3_intake_api.reserve_v1(jsonb,text,integer,integer) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $f$ SELECT transport_fixture.effect($1::text,NULL) $f$;
      CREATE FUNCTION official_v3_intake_api.finish_v1(jsonb,text,integer,integer,uuid,jsonb,jsonb) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $f$ SELECT transport_fixture.effect($6::text,NULL) $f$;
      CREATE FUNCTION official_v3_jobs_api.execute_v1(text,text,integer,text,text,integer,integer,text) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $f$ SELECT transport_fixture.effect($1,$6) $f$;
      CREATE FUNCTION official_v3_result_api.attest_v1(jsonb,text,text,integer,text,text,integer,integer,text,text) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $f$ SELECT transport_fixture.effect($1::text,$7) $f$;
      CREATE FUNCTION official_v3_result_api.execute_v1(jsonb,text,text,integer,text,text,integer,integer,text,text) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $f$ SELECT transport_fixture.effect($1::text,$7) $f$;
      CREATE FUNCTION official_v3_result_api.read_v1(jsonb,text,text,integer,text,text,integer,integer,text,text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $f$
      BEGIN IF session_user='ot_v3_result_reader' AND ($1->>'operation') NOT IN ('coverage','projection','projection_current','projection_batch') THEN RAISE EXCEPTION USING ERRCODE='42501',MESSAGE='synthetic private read refused'; END IF;
      RETURN transport_fixture.effect($1::text,$7); END $f$;
      REVOKE ALL ON ALL FUNCTIONS IN SCHEMA official_v3_method_api,official_v3_intake_api,official_v3_jobs_api,official_v3_result_api FROM PUBLIC;
      GRANT USAGE ON SCHEMA official_v3_method_api TO ot_v3_method_reader;
      GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA official_v3_method_api TO ot_v3_method_reader;
      GRANT USAGE ON SCHEMA official_v3_intake_api TO ot_v3_intake_caller;
      GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA official_v3_intake_api TO ot_v3_intake_caller;
      GRANT USAGE ON SCHEMA official_v3_jobs_api TO ot_v3_jobs_caller;
      GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA official_v3_jobs_api TO ot_v3_jobs_caller;
      GRANT USAGE ON SCHEMA official_v3_result_api TO ot_v3_result_writer,ot_v3_result_reader,ot_v3_result_verifier;
      GRANT EXECUTE ON FUNCTION official_v3_result_api.attest_v1(jsonb,text,text,integer,text,text,integer,integer,text,text) TO ot_v3_result_verifier;
      GRANT EXECUTE ON FUNCTION official_v3_result_api.execute_v1(jsonb,text,text,integer,text,text,integer,integer,text,text) TO ot_v3_result_writer;
      GRANT EXECUTE ON FUNCTION official_v3_result_api.read_v1(jsonb,text,text,integer,text,text,integer,integer,text,text) TO ot_v3_result_writer,ot_v3_result_reader`)
    proxy = await ownedProxy(port, certificate, key)
    const target: V3PgTarget = Object.freeze({ connectHost: '127.0.0.1', tlsHostname: 'localhost', port: proxy.port,
      database: 'postgres', usernameSuffix: '', certificateAuthorityPem: certificate,
      certificateAuthoritySha256: createHash('sha256').update(certificate).digest('hex'), expectedServerMajor: 17, requireBackendTls: true })
    let disposed = false
    const fixture = Object.freeze({ target,
      password(kind: V3PgLogin) { assert.ok(owned.has(fixture) && !disposed && Object.hasOwn(V3_PG_LOGINS, kind)); return loginPassword },
      async query(sql: string, values: unknown[] = []) { assert.ok(owned.has(fixture) && !disposed); return inspector!.query(sql, values) },
      async direct(kind: V3PgLogin, sql: string, values: unknown[] = []) {
        assert.ok(owned.has(fixture) && !disposed && Object.hasOwn(V3_PG_LOGINS, kind))
        const c = client(V3_PG_LOGINS[kind].login, loginPassword)
        try { await c.connect(); return await c.query(sql, values) } finally {
          const ending = c.end(); clientClosures.add(ending); await ending; clientClosures.delete(ending)
        }
      },
      loseNextCommit(both = false) { assert.ok(owned.has(fixture) && !disposed); proxy!.loseNextCommit(both) },
      async absent() {
        assert.ok(owned.has(fixture) && !disposed)
        const names = Object.values(V3_PG_LOGINS).map(x => x.login)
        for (let attempt = 0; attempt < 200; attempt++) {
          const r = await inspector!.query('SELECT count(*)::text AS n FROM pg_catalog.pg_stat_activity WHERE usename=ANY($1::text[])', [names])
          if (r.rows[0]?.n === '0') return
          await pause(5)
        }
        assert.fail('owned native backends did not disappear')
      },
      async waitBlocked(kind: V3PgLogin = 'jobs', atCommit = false) {
        assert.ok(owned.has(fixture) && !disposed && Object.hasOwn(V3_PG_LOGINS, kind))
        const until = performance.now() + 1500
        while (performance.now() < until) {
          const r = await inspector!.query("SELECT count(*)::text AS n FROM pg_catalog.pg_stat_activity WHERE application_name LIKE $1::text AND wait_event='PgSleep' AND (NOT $2::boolean OR query='COMMIT')", [`otv3:${kind}:w:%`, atCommit])
          if (r.rows[0]?.n === '1') return
          await pause(5)
        }
        assert.fail('synthetic operation did not enter actual PgSleep')
      },
      snapshot: () => ({ ...proxy!.snapshot(), local: callbacks.snapshot() }),
      async dispose() {
        if (disposed) return; disposed = true
        await proxy!.close(); await Promise.allSettled([...clientClosures]); await inspector!.end(); inspector = null
        command(join(bin, 'pg_ctl'), ['-D', data, '-m', 'immediate', '-w', '-t', '10', 'stop']); running = false
        const active = callbacks.snapshot().active
        callbacks.restore(); owned.delete(fixture); rmSync(root, { recursive: true, force: true })
        assert.deepEqual(active, { connect: 0, auth: 0, query: 0, socket: 0 })
      },
    })
    owned.add(fixture)
    return fixture
  } catch (error) {
    await proxy?.close().catch(() => {}); await inspector?.end().catch(() => {})
    if (running) { command(join(bin, 'pg_ctl'), ['-D', data, '-m', 'immediate', '-w', '-t', '10', 'stop']); running = false }
    callbacks.restore(); rmSync(root, { recursive: true, force: true }); throw error
  }
}
