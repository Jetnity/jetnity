// lib/readiness/official-truth-source-catalog-server.test.ts
//
// Kanonische Registry plus ein lokaler PostgreSQL-Nachweis für das Katalog-Gateway.
// Synthetische *.example-Quellen. Die Wegwerf-Datenbank wird danach gelöscht.
// Kein Development, kein Production, kein Provider.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { requirementsProviderAus } from '@/lib/readiness/provider'
import {
  leereQuellenRegistry,
  quellenRegistryErstellen,
  type QuellenEingabe,
} from '@/lib/readiness/source-registry'
import { LOCAL_UNAPPLIED_RPCS } from '../../scripts/db/verwendung.mjs'
import {
  OFFICIAL_TRUTH_SOURCE_CATALOG_V1,
  quelleRegistrieren,
  quellenKatalogLesen,
  type OfficialTruthSourceCatalogTransport,
} from '@/lib/readiness/official-truth-source-catalog-server'

const ROOT = process.cwd()
const MIGRATION_DIR = join(ROOT, 'supabase/migrations')
const SCHEMA_MIGRATION = '20261001121258_official_truth_private_evidence_store_schema_1.sql'
const CATALOG_SUFFIX = '_official_truth_source_catalog_gateway_1.sql'
const PG_BIN = '/usr/lib/postgresql/16/bin'
const SERVER = 'lib/readiness/official-truth-source-catalog-server.ts'

type Aufruf = Record<string, unknown>

function datei(relativ: string): string {
  return readFileSync(join(ROOT, relativ), 'utf8')
}

function ohneKommentare(sql: string): string {
  return sql.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/--[^\n]*/g, ' ')
}

function migrationSql(): { name: string; sql: string } {
  const names = readdirSync(MIGRATION_DIR).filter((name) => name.endsWith(CATALOG_SUFFIX))
  assert.equal(names.length, 1)
  assert.match(names[0], /^\d{14}_official_truth_source_catalog_gateway_1\.sql$/)
  return { name: names[0], sql: readFileSync(join(MIGRATION_DIR, names[0]), 'utf8') }
}

function behoerde(teil?: Partial<QuellenEingabe>): QuellenEingabe {
  return {
    sourceId: 'example-border-authority',
    sourceClass: 'official_authority',
    publisherName: 'Example Border Authority',
    authorityName: 'Example Border Authority',
    domains: ['gov.example'],
    ...teil,
  }
}

function gelesen(sources: Aufruf[]): Aufruf {
  return { ok: true, operation: 'read_registry', sources }
}

function quelleAntwort(sourceId: string, domains: string[]): Aufruf {
  return {
    source_id: sourceId,
    source_class: 'official_authority',
    publisher_name: 'Example Border Authority',
    authority_name: 'Example Border Authority',
    domains,
  }
}

function transportAufzeichnen(antwort: (payload: Aufruf) => unknown): {
  transport: OfficialTruthSourceCatalogTransport
  aufrufe: Aufruf[]
} {
  const aufrufe: Aufruf[] = []
  return {
    aufrufe,
    transport: {
      async aufrufen(payload) {
        aufrufe.push(payload)
        return { ok: true, antwort: antwort(payload) }
      },
    },
  }
}

describe('official truth source catalog gateway', () => {
  test('die kanonische Registry blockiert ungültige Quellen vor dem RPC', async () => {
    const text = datei(SERVER)
    assert.equal(text.includes("import 'server-only'"), true)
    assert.equal((text.match(/quellenRegistryErstellen\(/g) ?? []).length, 3)
    assert.equal((text.match(/\.rpc\(\s*'official_truth_source_catalog_v1'/g) ?? []).length, 1)
    assert.equal(text.includes('.from('), false)
    assert.equal(text.includes('requirementsProviderAus'), false)
    assert.equal(text.includes('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY'), false)
    assert.equal(OFFICIAL_TRUTH_SOURCE_CATALOG_V1, 'official_truth_source_catalog_v1')
    assert.equal(requirementsProviderAus(), null)

    const verboten = transportAufzeichnen(() => {
      throw new Error('darf das RPC nicht erreichen')
    })
    const ungueltig = await quelleRegistrieren(
      behoerde({ sourceId: 'A' }),
      { transport: verboten.transport },
    )
    assert.deepEqual(ungueltig, { ok: false, reason: 'invalid_source_id' })
    assert.equal(verboten.aufrufe.length, 0)

    const ohneAuthority = await quelleRegistrieren(
      behoerde({ authorityName: '   ' }),
      { transport: verboten.transport },
    )
    assert.deepEqual(ohneAuthority, { ok: false, reason: 'authority_required' })

    const provider = await quelleRegistrieren(
      {
        sourceId: 'example-licensed-provider',
        sourceClass: 'licensed_evidence_provider',
        publisherName: 'Example Licensed Publisher',
        authorityName: 'Example State',
        domains: ['provider.example'],
      },
      { transport: verboten.transport },
    )
    assert.deepEqual(provider, { ok: false, reason: 'provider_is_not_authority' })
    assert.equal(verboten.aufrufe.length, 0)

    const sentinel = 'service-role-secret-sentinel'
    const ohneZugang = await quellenKatalogLesen({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: '   ',
        SUPABASE_SERVICE_ROLE_KEY: sentinel,
        NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: sentinel,
      },
    })
    assert.deepEqual(ohneZugang, { ok: false, reason: 'catalog_not_configured' })
    assert.equal(JSON.stringify(ohneZugang).includes(sentinel), false)

    const geworfen = await quellenKatalogLesen({
      transport: {
        async aufrufen() {
          throw new Error(sentinel)
        },
      },
    })
    assert.deepEqual(geworfen, { ok: false, reason: 'catalog_failed' })
    assert.equal(JSON.stringify(geworfen).includes(sentinel), false)
  })

  test('Überlappung, exaktes Duplikat und der normalisierte Schreibwunsch bleiben an der Registry', async () => {
    const katalog = transportAufzeichnen((payload) => {
      if (payload.operation === 'read_registry') {
        return gelesen([quelleAntwort('example-border-authority', ['leaf.gov.example'])])
      }
      return {
        ok: true,
        operation: 'register_source',
        outcome: 'idempotent',
        source_id: 'example-border-authority',
      }
    })

    const kind = await quelleRegistrieren(
      behoerde({ sourceId: 'example-child-authority', publisherName: 'Example Child Authority', authorityName: 'Example Child Authority', domains: ['child.leaf.gov.example'] }),
      { transport: katalog.transport },
    )
    assert.deepEqual(kind, { ok: false, reason: 'overlapping_domains' })
    assert.deepEqual(katalog.aufrufe.map((aufruf) => aufruf.operation), ['read_registry'])

    const eltern = await quelleRegistrieren(
      behoerde({ sourceId: 'example-parent-authority', publisherName: 'Example Parent Authority', authorityName: 'Example Parent Authority', domains: ['gov.example'] }),
      { transport: katalog.transport },
    )
    assert.deepEqual(eltern, { ok: false, reason: 'overlapping_domains' })
    const einzelLabel = await quelleRegistrieren(
      behoerde({ sourceId: 'example-label-authority', publisherName: 'Example Label Authority', authorityName: 'Example Label Authority', domains: ['example'] }),
      { transport: katalog.transport },
    )
    assert.deepEqual(einzelLabel, { ok: false, reason: 'invalid_domain' })

    const konflikt = await quelleRegistrieren(
      behoerde({ publisherName: 'Example Other Publisher' }),
      { transport: katalog.transport },
    )
    assert.deepEqual(konflikt, { ok: false, reason: 'conflicting_duplicate' })
    assert.equal(katalog.aufrufe.every((aufruf) => aufruf.operation === 'read_registry'), true)

    const gleich = await quelleRegistrieren(
      behoerde({ domains: ['Leaf.Gov.Example'] }),
      { transport: katalog.transport },
    )
    assert.deepEqual(gleich, { ok: true, outcome: 'idempotent', sourceId: 'example-border-authority' })
    const register = katalog.aufrufe[katalog.aufrufe.length - 1]
    assert.equal(register?.operation, 'register_source')
    const source = register?.source as Aufruf
    assert.deepEqual(source.domains, ['leaf.gov.example'])
    assert.equal(source.publisher_name, 'Example Border Authority')

    const lizenziert = transportAufzeichnen((payload) => {
      if (payload.operation === 'read_registry') return gelesen([])
      const body = payload.source as Aufruf
      assert.equal(body.authority_name, null)
      assert.deepEqual(body.domains, ['provider.example'])
      return {
        ok: true,
        operation: 'register_source',
        outcome: 'inserted',
        source_id: body.source_id,
      }
    })
    const anbieter = await quelleRegistrieren(
      {
        sourceId: 'example-licensed-provider',
        sourceClass: 'licensed_evidence_provider',
        publisherName: '  Example Licensed Publisher  ',
        authorityName: '   ',
        domains: ['Provider.Example'],
      },
      { transport: lizenziert.transport },
    )
    assert.deepEqual(anbieter, {
      ok: true,
      outcome: 'inserted',
      sourceId: 'example-licensed-provider',
    })

    const sortiert = transportAufzeichnen(() => gelesen([
      {
        source_id: 'example-licensed-provider',
        source_class: 'licensed_evidence_provider',
        publisher_name: 'Example Licensed Publisher',
        authority_name: null,
        domains: ['b.provider.example', 'a.provider.example'],
      },
      {
        source_id: 'example-border-authority',
        source_class: 'official_authority',
        publisher_name: 'Example Border Authority',
        authority_name: 'Example Border Authority',
        domains: ['gov.example', 'border.gov.example'],
      },
    ]))
    const registry = await quellenKatalogLesen({ transport: sortiert.transport })
    assert.equal(registry.ok, true)
    if (!registry.ok) return
    const kanonisch = quellenRegistryErstellen([
      {
        sourceId: 'example-border-authority',
        sourceClass: 'official_authority',
        publisherName: 'Example Border Authority',
        authorityName: 'Example Border Authority',
        domains: ['gov.example', 'border.gov.example'],
      },
      {
        sourceId: 'example-licensed-provider',
        sourceClass: 'licensed_evidence_provider',
        publisherName: 'Example Licensed Publisher',
        domains: ['b.provider.example', 'a.provider.example'],
      },
    ])
    assert.equal(kanonisch.ok, true)
    if (!kanonisch.ok) return
    assert.deepEqual(registry.registry, kanonisch.registry)
    assert.deepEqual(registry.registry.blockedDomains, [])
    assert.equal(registry.registry.sources[1]?.authorityName, null)
    const nochmal = await quellenKatalogLesen({ transport: sortiert.transport })
    assert.deepEqual(nochmal, registry)
    assert.deepEqual(leereQuellenRegistry().blockedDomains, registry.registry.blockedDomains)
  })

  test('die Migration ist genau ein Gateway ohne Katalog-Seed', () => {
    const dateiMigration = migrationSql()
    const sql = ohneKommentare(dateiMigration.sql)
    const koerper = sql.match(/as \$fn\$([\s\S]*)\$fn\$/i)
    assert.ok(koerper)
    const ohneKoerper = sql.replace(/as \$fn\$[\s\S]*\$fn\$/i, ' ')
    assert.equal((sql.match(/\bsecurity\s+definer\b/gi) ?? []).length, 1)
    assert.equal((sql.match(/\bcreate\s+function\b/gi) ?? []).length, 1)
    assert.match(sql, /create function public\.official_truth_source_catalog_v1\(payload jsonb\)/i)
    assert.match(sql, /set search_path = ''/i)
    assert.doesNotMatch(sql, /\bcreate\s+or\s+replace\s+function\b/i)
    assert.doesNotMatch(ohneKoerper, /\binsert\s+into\b/i)
    assert.match(koerper[1], /insert\s+into\s+private\.official_sources\b/i)
    assert.match(koerper[1], /insert\s+into\s+private\.official_source_domains\b/i)
    assert.doesNotMatch(sql, /\b(update|delete)\s+/i)
    assert.doesNotMatch(koerper[1], /\bexecute\b/i)
    assert.doesNotMatch(sql, /\bcreate\s+policy\b/i)
    assert.doesNotMatch(sql, /\bgrant\s+(select|insert|update|delete|all)\b/i)
    assert.doesNotMatch(sql, /\.gov\b/i)
    assert.match(sql, /grant execute on function public\.official_truth_source_catalog_v1\(jsonb\) to service_role/i)
    for (const role of ['public', 'anon', 'authenticated', 'service_role']) {
      assert.match(
        sql,
        new RegExp(`revoke all on function public\\.official_truth_source_catalog_v1\\(jsonb\\) from ${role}\\b`, 'i'),
      )
    }
    const config = datei('supabase/config.toml')
    assert.match(config, /schemas = \["public", "graphql_public"\]/)
    const regel = LOCAL_UNAPPLIED_RPCS.find((eintrag) => eintrag.name === OFFICIAL_TRUTH_SOURCE_CATALOG_V1)
    assert.deepEqual(regel, {
      name: 'official_truth_source_catalog_v1',
      sourcePath: SERVER,
      sqlPath: `supabase/migrations/${dateiMigration.name}`,
    })
  })
})

type Cluster = {
  aufruf(sql: string, rolle?: string): string
  scheitert(sql: string, rolle?: string): string
  stop(): void
}

function kindlicheUmgebung(home: string): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, HOME: home }
  for (const schluessel of Object.keys(env)) {
    if (
      schluessel.startsWith('PG') ||
      schluessel.startsWith('SUPABASE') ||
      schluessel === 'DATABASE_URL' ||
      schluessel === 'NEXT_PUBLIC_SUPABASE_URL'
    ) {
      delete env[schluessel]
    }
  }
  return env
}

function clusterStarten(): Cluster {
  const wurzel = mkdtempSync(join(tmpdir(), 'jetnity-official-truth-catalog-'))
  const dataDir = join(wurzel, 'data')
  const socketDir = join(wurzel, 'sock')
  const home = join(wurzel, 'home')
  const user = process.env.USER || 'ubuntu'
  const env = kindlicheUmgebung(home)
  execFileSync('mkdir', ['-p', socketDir, home])
  const initArgs = ['-D', dataDir, '--username', user, '--auth-local=trust', '--encoding=UTF8']
  try {
    execFileSync(join(PG_BIN, 'initdb'), [...initArgs, '--locale=C.UTF-8'], { env, stdio: 'ignore' })
  } catch {
    execFileSync(join(PG_BIN, 'initdb'), [...initArgs, '--no-locale'], { env, stdio: 'ignore' })
  }
  execFileSync(
    join(PG_BIN, 'pg_ctl'),
    [
      '-D', dataDir,
      '-l', join(wurzel, 'log'),
      '-w',
      'start',
      '-o',
      `-c listen_addresses= -c unix_socket_directories=${socketDir} -c shared_buffers=16MB`,
    ],
    { env, stdio: 'ignore' },
  )

  const basis = [
    join(PG_BIN, 'psql'),
    '-X',
    '--no-psqlrc',
    '-h', socketDir,
    '-U', user,
    '-d', 'postgres',
    '-v', 'ON_ERROR_STOP=1',
  ]

  const lauf = (args: string[], sql?: string) => {
    return execFileSync(basis[0], [...basis.slice(1), ...args], {
      env,
      encoding: 'utf8',
      input: sql,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
  }

  const stop = () => {
    try {
      execFileSync(join(PG_BIN, 'pg_ctl'), ['-D', dataDir, '-m', 'immediate', 'stop'], { env, stdio: 'ignore' })
    } finally {
      rmSync(wurzel, { recursive: true, force: true })
    }
  }

  try {
    lauf(['-c', 'create database official_truth_catalog_proof'])
    lauf(
      ['-d', 'official_truth_catalog_proof'],
      `
        create role anon nologin noinherit;
        create role authenticated nologin noinherit;
        create role service_role nologin noinherit bypassrls;
        grant usage on schema public to anon, authenticated, service_role;
      `,
    )
    for (const name of [SCHEMA_MIGRATION, migrationSql().name]) {
      lauf(['-d', 'official_truth_catalog_proof', '-f', join(MIGRATION_DIR, name)])
    }
  } catch (error) {
    stop()
    throw error
  }

  const aufruf = (sql: string, rolle?: string) => {
    const args = ['-d', 'official_truth_catalog_proof', '-t', '-A']
    if (rolle) args.push('-c', `set role ${rolle}`)
    args.push('-c', sql)
    return lauf(args)
      .split('\n')
      .map((zeile) => zeile.trim())
      .filter((zeile) => zeile.length > 0 && zeile !== 'SET')
      .join('\n')
  }

  const scheitert = (sql: string, rolle?: string) => {
    const args = ['-d', 'official_truth_catalog_proof']
    if (rolle) args.push('-c', `set role ${rolle}`)
    args.push('-c', sql)
    try {
      lauf(args)
    } catch (error) {
      const fehler = error as { stderr?: string; stdout?: string; message?: string }
      return `${fehler.stderr ?? ''}\n${fehler.stdout ?? ''}\n${fehler.message ?? ''}`
    }
    throw new Error(`erwartet eine Ablehnung: ${sql}`)
  }

  return { aufruf, scheitert, stop }
}

function payloadTag(payload: unknown): string {
  const json = JSON.stringify(payload)
  const tag = '$jetnity_payload$'
  if (json.includes(tag)) throw new Error('payload tag')
  return `public.official_truth_source_catalog_v1(${tag}${json}${tag}::jsonb)`
}

function clusterTransport(cluster: Cluster): OfficialTruthSourceCatalogTransport {
  return {
    async aufrufen(payload) {
      try {
        const text = cluster.aufruf(`select ${payloadTag(payload)}`, 'service_role')
        return { ok: true, antwort: JSON.parse(text) as unknown }
      } catch {
        return { ok: false }
      }
    },
  }
}

describe('throwaway PostgreSQL proof for the source catalog gateway', () => {
  test('Rollen, Atome und genaue Duplikate', { timeout: 120_000 }, async () => {
    const cluster = clusterStarten()
    try {
      const summe = '(select count(*) from private.official_sources) + (select count(*) from private.official_source_domains)'
      assert.equal(cluster.aufruf(`select ${summe}`), '0')
      assert.equal(
        cluster.aufruf(`
          select string_agg(n.nspname || '.' || p.proname, ',' order by n.nspname, p.proname)
          from pg_proc p
          join pg_namespace n on n.oid = p.pronamespace
          where p.prosecdef
        `),
        'public.official_truth_source_catalog_v1',
      )
      const proconfig = cluster.aufruf(`select proconfig::text from pg_proc where proname = 'official_truth_source_catalog_v1'`)
      assert.match(proconfig, /search_path=/)
      assert.equal(proconfig.includes('public'), false)
      assert.equal(
        cluster.aufruf(`
          select count(*) from information_schema.role_table_grants
          where table_schema = 'private'
            and table_name in ('official_sources', 'official_source_domains')
            and grantee in ('anon', 'authenticated', 'service_role', 'public')
        `),
        '0',
      )
      const funktionRechte = cluster.aufruf(`
        select string_agg(grantee || ':' || privilege_type, ',' order by grantee, privilege_type)
        from information_schema.routine_privileges
        where routine_schema = 'public' and routine_name = 'official_truth_source_catalog_v1'
      `)
      const rechte = funktionRechte.split(',').filter((eintrag) => eintrag.length > 0)
      assert.equal(rechte.includes('service_role:EXECUTE'), true)
      assert.equal(rechte.some((eintrag) => /^(anon|authenticated|public|PUBLIC):/.test(eintrag)), false)
      const owner = cluster.aufruf('select current_user')
      assert.deepEqual(
        rechte.filter((eintrag) => eintrag !== 'service_role:EXECUTE'),
        [`${owner}:EXECUTE`],
      )

      const anon = cluster.scheitert(`select ${payloadTag({ operation: 'read_registry' })}`, 'anon')
      assert.match(anon, /permission denied/i)
      const authenticated = cluster.scheitert(`select ${payloadTag({ operation: 'register_source' })}`, 'authenticated')
      assert.match(authenticated, /permission denied/i)
      const schreiben = cluster.scheitert(
        `insert into private.official_sources (source_id, source_class, publisher_name, authority_name) values ('example-border-authority', 'official_authority', 'Example Border Authority', 'Example Border Authority')`,
        'service_role',
      )
      assert.match(schreiben, /permission denied/i)
      const lesen = cluster.scheitert('select count(*) from private.official_source_domains', 'service_role')
      assert.match(lesen, /permission denied/i)
      assert.equal(cluster.aufruf(`select ${summe}`), '0')

      const ohneAuthority = cluster.scheitert(
        `select ${payloadTag({
          operation: 'register_source',
          source: {
            source_id: 'example-border-authority',
            source_class: 'official_authority',
            publisher_name: 'Example Border Authority',
            authority_name: null,
            domains: ['gov.example'],
          },
        })}`,
        'service_role',
      )
      assert.match(ohneAuthority, /authority is required/i)
      const mitAuthority = cluster.scheitert(
        `select ${payloadTag({
          operation: 'register_source',
          source: {
            source_id: 'example-licensed-provider',
            source_class: 'licensed_evidence_provider',
            publisher_name: 'Example Licensed Publisher',
            authority_name: 'Example State',
            domains: ['provider.example'],
          },
        })}`,
        'service_role',
      )
      assert.match(mitAuthority, /not an authority/i)
      assert.equal(cluster.aufruf(`select ${summe}`), '0')

      const transport = clusterTransport(cluster)
      const leer = await quellenKatalogLesen({ transport })
      assert.deepEqual(leer, { ok: true, registry: leereQuellenRegistry() })

      const erste = await quelleRegistrieren(behoerde({ domains: ['Gov.Example'] }), { transport })
      assert.deepEqual(erste, { ok: true, outcome: 'inserted', sourceId: 'example-border-authority' })
      const stempel = cluster.aufruf(`select registered_at::text from private.official_sources where source_id = 'example-border-authority'`)
      const nochmal = await quelleRegistrieren(behoerde({ domains: ['gov.example'] }), { transport })
      assert.deepEqual(nochmal, { ok: true, outcome: 'idempotent', sourceId: 'example-border-authority' })
      assert.equal(cluster.aufruf('select count(*) from private.official_sources'), '1')
      assert.equal(cluster.aufruf('select count(*) from private.official_source_domains'), '1')
      assert.equal(
        cluster.aufruf(`select registered_at::text from private.official_sources where source_id = 'example-border-authority'`),
        stempel,
      )

      const konflikt = await quelleRegistrieren(behoerde({ publisherName: 'Example Replacement Publisher' }), { transport })
      assert.deepEqual(konflikt, { ok: false, reason: 'conflicting_duplicate' })
      const direktKonflikt = cluster.scheitert(
        `select ${payloadTag({
          operation: 'register_source',
          source: {
            source_id: 'example-border-authority',
            source_class: 'official_authority',
            publisher_name: 'Example Replacement Publisher',
            authority_name: 'Example Border Authority',
            domains: ['gov.example'],
          },
        })}`,
        'service_role',
      )
      assert.match(direktKonflikt, /conflicting official source/i)
      assert.equal(
        cluster.aufruf(`select publisher_name from private.official_sources where source_id = 'example-border-authority'`),
        'Example Border Authority',
      )

      const portal = await quelleRegistrieren(
        behoerde({
          sourceId: 'example-portal-authority',
          publisherName: 'Example Portal Authority',
          authorityName: 'Example Portal Authority',
          domains: ['border.portal.example', 'portal.example'],
        }),
        { transport },
      )
      assert.deepEqual(portal, { ok: true, outcome: 'inserted', sourceId: 'example-portal-authority' })
      assert.equal(
        cluster.aufruf(`select string_agg(domain, ',' order by domain) from private.official_source_domains where source_id = 'example-portal-authority'`),
        'border.portal.example,portal.example',
      )

      const blatt = await quelleRegistrieren(
        behoerde({
          sourceId: 'example-leaf-authority',
          publisherName: 'Example Leaf Authority',
          authorityName: 'Example Leaf Authority',
          domains: ['leaf.wide.example'],
        }),
        { transport },
      )
      assert.deepEqual(blatt, { ok: true, outcome: 'inserted', sourceId: 'example-leaf-authority' })
      const vorOverlap = cluster.aufruf(`select ${summe}`)
      const kind = await quelleRegistrieren(
        behoerde({
          sourceId: 'example-child-authority',
          publisherName: 'Example Child Authority',
          authorityName: 'Example Child Authority',
          domains: ['child.portal.example'],
        }),
        { transport },
      )
      assert.deepEqual(kind, { ok: false, reason: 'overlapping_domains' })
      const eltern = cluster.scheitert(
        `select ${payloadTag({
          operation: 'register_source',
          source: {
            source_id: 'example-parent-authority',
            source_class: 'official_authority',
            publisher_name: 'Example Parent Authority',
            authority_name: 'Example Parent Authority',
            domains: ['wide.example'],
          },
        })}`,
        'service_role',
      )
      assert.match(eltern, /overlapping official source domain/i)
      const genau = cluster.scheitert(
        `select ${payloadTag({
          operation: 'register_source',
          source: {
            source_id: 'example-copy-authority',
            source_class: 'official_authority',
            publisher_name: 'Example Copy Authority',
            authority_name: 'Example Copy Authority',
            domains: ['gov.example'],
          },
        })}`,
        'service_role',
      )
      assert.match(genau, /overlapping official source domain/i)
      assert.equal(cluster.aufruf(`select ${summe}`), vorOverlap)

      const teilweise = cluster.scheitert(
        `select ${payloadTag({
          operation: 'register_source',
          source: {
            source_id: 'example-split-authority',
            source_class: 'official_authority',
            publisher_name: 'Example Split Authority',
            authority_name: 'Example Split Authority',
            domains: ['ok.example', 'border.gov.example'],
          },
        })}`,
        'service_role',
      )
      assert.match(teilweise, /overlapping official source domain/i)
      assert.equal(cluster.aufruf(`select ${summe}`), vorOverlap)
      assert.equal(cluster.aufruf(`select count(*) from private.official_sources where source_id = 'example-split-authority'`), '0')
      assert.equal(cluster.aufruf(`select count(*) from private.official_source_domains where domain = 'ok.example'`), '0')

      const geschwister = await quelleRegistrieren(
        behoerde({
          sourceId: 'example-sibling-authority',
          publisherName: 'Example Sibling Authority',
          authorityName: 'Example Sibling Authority',
          domains: ['other.example'],
        }),
        { transport },
      )
      assert.deepEqual(geschwister, { ok: true, outcome: 'inserted', sourceId: 'example-sibling-authority' })
      const anbieter = await quelleRegistrieren(
        {
          sourceId: 'example-licensed-provider',
          sourceClass: 'licensed_evidence_provider',
          publisherName: 'Example Licensed Publisher',
          authorityName: null,
          domains: ['provider.example'],
        },
        { transport },
      )
      assert.deepEqual(anbieter, { ok: true, outcome: 'inserted', sourceId: 'example-licensed-provider' })
      assert.equal(
        cluster.aufruf(`select authority_name is null from private.official_sources where source_id = 'example-licensed-provider'`),
        't',
      )

      const registry = await quellenKatalogLesen({ transport })
      assert.equal(registry.ok, true)
      if (!registry.ok) return
      const nochmalGelesen = await quellenKatalogLesen({ transport })
      assert.deepEqual(nochmalGelesen, registry)
      assert.deepEqual(
        registry.registry.sources.map((quelle) => quelle.sourceId),
        [
          'example-border-authority',
          'example-leaf-authority',
          'example-licensed-provider',
          'example-portal-authority',
          'example-sibling-authority',
        ],
      )
      assert.deepEqual(registry.registry.blockedDomains, [])

      cluster.aufruf(`
        insert into private.official_sources (source_id, source_class, publisher_name, authority_name)
        values ('example-corrupt-authority', 'official_authority', 'Example Corrupt Authority', 'Example Corrupt Authority');
        insert into private.official_source_domains (source_id, domain)
        values ('example-corrupt-authority', 'border.gov.example');
      `)
      const kaputt = await quellenKatalogLesen({ transport })
      assert.deepEqual(kaputt, { ok: false, reason: 'catalog_failed' })
      const davor = cluster.aufruf(`select ${summe}`)
      const abgelehnt = await quelleRegistrieren(
        behoerde({
          sourceId: 'example-later-authority',
          publisherName: 'Example Later Authority',
          authorityName: 'Example Later Authority',
          domains: ['later.example'],
        }),
        { transport },
      )
      assert.deepEqual(abgelehnt, { ok: false, reason: 'catalog_failed' })
      assert.equal(cluster.aufruf(`select ${summe}`), davor)
      assert.equal(cluster.aufruf(`select count(*) from private.official_source_domains where domain = 'later.example'`), '0')
    } finally {
      cluster.stop()
    }
  })
})
