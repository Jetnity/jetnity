import { govukNationalListFixture, r2CatalogRows, r2Profiles, r2Registry } from './official-truth-content-identity-r2.test'
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
  createContentIdentityGraph,
  OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY,
  type ContentItemDescriptor,
  type RepresentationDescriptor,
} from '@/lib/readiness/official-truth-content-identity'
import {
  leereQuellenRegistry,
  quellenRegistryErstellen,
  type QuellenEingabe,
} from '@/lib/readiness/source-registry'
import { LOCAL_UNAPPLIED_RPCS } from '../../scripts/db/verwendung.mjs'
import {
  OFFICIAL_TRUTH_SOURCE_CATALOG_V2,
  contentItemRegistrieren,
  quelleRegistrieren,
  quellenKatalogLesen,
  quellenKatalogSnapshotAntwort,
  type ContentItemRegistrierenEingabe,
  type OfficialTruthSourceCatalogAbhaengigkeiten,
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
  return { ...r2CatalogRows(sources, R2_PUBLICATIONS), ok: true, operation: 'read_registry', sources }
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
    assert.equal((text.match(/\.rpc\(\s*'official_truth_source_catalog_v2'/g) ?? []).length, 1)
    assert.equal(text.includes('.from('), false)
    assert.equal(text.includes('requirementsProviderAus'), false)
    assert.equal(text.includes('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY'), false)
    assert.equal(OFFICIAL_TRUTH_SOURCE_CATALOG_V2, 'official_truth_source_catalog_v2')
    assert.equal(requirementsProviderAus(), null)

    const verboten = transportAufzeichnen(() => {
      throw new Error('darf das RPC nicht erreichen')
    })
    const ungueltig = await quelleRegistrieren(
      behoerde({ sourceId: 'A' }),
      { identityProfiles: r2Profiles, transport: verboten.transport },
    )
    assert.deepEqual(ungueltig, { ok: false, reason: 'invalid_source_id' })
    assert.equal(verboten.aufrufe.length, 0)

    const ohneAuthority = await quelleRegistrieren(
      behoerde({ authorityName: '   ' }),
      { identityProfiles: r2Profiles, transport: verboten.transport },
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
      { identityProfiles: r2Profiles, transport: verboten.transport },
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

    const geworfen = await quellenKatalogLesen({ identityProfiles: r2Profiles,
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
        identity_schema: 2,
        outcome: 'idempotent',
        source_id: 'example-border-authority',
      }
    })

    const kind = await quelleRegistrieren(
      behoerde({ sourceId: 'example-child-authority', publisherName: 'Example Child Authority', authorityName: 'Example Child Authority', domains: ['child.leaf.gov.example'] }),
      { identityProfiles: r2Profiles, transport: katalog.transport },
    )
    assert.deepEqual(kind, { ok: false, reason: 'overlapping_domains' })
    assert.deepEqual(katalog.aufrufe.map((aufruf) => aufruf.operation), ['read_registry'])

    const eltern = await quelleRegistrieren(
      behoerde({ sourceId: 'example-parent-authority', publisherName: 'Example Parent Authority', authorityName: 'Example Parent Authority', domains: ['gov.example'] }),
      { identityProfiles: r2Profiles, transport: katalog.transport },
    )
    assert.deepEqual(eltern, { ok: false, reason: 'overlapping_domains' })
    const einzelLabel = await quelleRegistrieren(
      behoerde({ sourceId: 'example-label-authority', publisherName: 'Example Label Authority', authorityName: 'Example Label Authority', domains: ['example'] }),
      { identityProfiles: r2Profiles, transport: katalog.transport },
    )
    assert.deepEqual(einzelLabel, { ok: false, reason: 'invalid_domain' })

    const konflikt = await quelleRegistrieren(
      behoerde({ publisherName: 'Example Other Publisher' }),
      { identityProfiles: r2Profiles, transport: katalog.transport },
    )
    assert.deepEqual(konflikt, { ok: false, reason: 'conflicting_duplicate' })
    assert.equal(katalog.aufrufe.every((aufruf) => aufruf.operation === 'read_registry'), true)

    const gleich = await quelleRegistrieren(
      behoerde({ domains: ['Leaf.Gov.Example'] }),
      { identityProfiles: r2Profiles, transport: katalog.transport },
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
        identity_schema: 2,
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
      { identityProfiles: r2Profiles, transport: lizenziert.transport },
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
    const registry = await quellenKatalogLesen({ identityProfiles: r2Profiles, transport: sortiert.transport })
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
    assert.deepEqual(registry.registry, r2Registry(kanonisch.registry, []))
    assert.deepEqual(registry.registry.blockedDomains, [])
    assert.equal(registry.registry.sources[1]?.authorityName, null)
    const nochmal = await quellenKatalogLesen({ identityProfiles: r2Profiles, transport: sortiert.transport })
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
    const regel = LOCAL_UNAPPLIED_RPCS.find((eintrag) => eintrag.name === OFFICIAL_TRUTH_SOURCE_CATALOG_V2)
    assert.deepEqual(regel, {
      name: 'official_truth_source_catalog_v2',
      sourcePath: SERVER,
      sqlPath: 'supabase/migrations/20261004010705_official_truth_content_identity_2.sql',
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
    for (const name of [SCHEMA_MIGRATION,
      '20261001151048_official_truth_accepted_rule_claim_persistence_schema_1.sql',
      '20261001180549_official_truth_trusted_store_writer_1.sql', migrationSql().name,
      '20261004010705_official_truth_content_identity_2.sql']) {
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
  return `public.official_truth_source_catalog_v2(${tag}${json}${tag}::jsonb)`
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
        'public.official_truth_source_catalog_v1,public.official_truth_source_catalog_v2,public.official_truth_store_accepted_v1,public.official_truth_store_accepted_v2',
      )
      const proconfig = cluster.aufruf(`select proconfig::text from pg_proc where proname = 'official_truth_source_catalog_v2'`)
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
        where routine_schema = 'public' and routine_name = 'official_truth_source_catalog_v2'
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
      const leer = await quellenKatalogLesen({ identityProfiles: r2Profiles, transport })
      assert.deepEqual(leer, { ok: true, registry: r2Registry(leereQuellenRegistry(), []) })

      const erste = await quelleRegistrieren(behoerde({ domains: ['Gov.Example'] }), { identityProfiles: r2Profiles, transport })
      assert.deepEqual(erste, { ok: true, outcome: 'inserted', sourceId: 'example-border-authority' })
      const stempel = cluster.aufruf(`select registered_at::text from private.official_sources where source_id = 'example-border-authority'`)
      const nochmal = await quelleRegistrieren(behoerde({ domains: ['gov.example'] }), { identityProfiles: r2Profiles, transport })
      assert.deepEqual(nochmal, { ok: true, outcome: 'idempotent', sourceId: 'example-border-authority' })
      assert.equal(cluster.aufruf('select count(*) from private.official_sources'), '1')
      assert.equal(cluster.aufruf('select count(*) from private.official_source_domains'), '1')
      assert.equal(
        cluster.aufruf(`select registered_at::text from private.official_sources where source_id = 'example-border-authority'`),
        stempel,
      )

      const konflikt = await quelleRegistrieren(behoerde({ publisherName: 'Example Replacement Publisher' }), { identityProfiles: r2Profiles, transport })
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
        { identityProfiles: r2Profiles, transport },
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
        { identityProfiles: r2Profiles, transport },
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
        { identityProfiles: r2Profiles, transport },
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
        { identityProfiles: r2Profiles, transport },
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
        { identityProfiles: r2Profiles, transport },
      )
      assert.deepEqual(anbieter, { ok: true, outcome: 'inserted', sourceId: 'example-licensed-provider' })
      assert.equal(
        cluster.aufruf(`select authority_name is null from private.official_sources where source_id = 'example-licensed-provider'`),
        't',
      )

      const registry = await quellenKatalogLesen({ identityProfiles: r2Profiles, transport })
      assert.equal(registry.ok, true)
      if (!registry.ok) return
      const nochmalGelesen = await quellenKatalogLesen({ identityProfiles: r2Profiles, transport })
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
      const kaputt = await quellenKatalogLesen({ identityProfiles: r2Profiles, transport })
      assert.deepEqual(kaputt, { ok: false, reason: 'catalog_failed' })
      const davor = cluster.aufruf(`select ${summe}`)
      const abgelehnt = await quelleRegistrieren(
        behoerde({
          sourceId: 'example-later-authority',
          publisherName: 'Example Later Authority',
          authorityName: 'Example Later Authority',
          domains: ['later.example'],
        }),
        { identityProfiles: r2Profiles, transport },
      )
      assert.deepEqual(abgelehnt, { ok: false, reason: 'catalog_failed' })
      assert.equal(cluster.aufruf(`select ${summe}`), davor)
      assert.equal(cluster.aufruf(`select count(*) from private.official_source_domains where domain = 'later.example'`), '0')
    } finally {
      cluster.stop()
    }
  })
})

const R2_PUBLICATIONS = [] as const

function contentEingabe(): ContentItemRegistrierenEingabe {
  return {
    sourceId: 'example-border-authority', contentItemId: 'publication-a',
    externalIdNamespace: 'synthetic_namespace', externalContentId: 'external-a',
    contentItemVersion: 1, current: true,
    expectedPublisherIds: ['publisher-b', 'publisher-a'], expectedAuthorityIds: ['authority-b', 'authority-a'],
    representations: [{
      representationId: 'api-en', representationVersion: 1, current: true,
      requestUrls: ['https://gov.example/api-a?version=1', 'https://gov.example/api-a'],
      expectedFinalUrl: 'https://gov.example/api-a', expectedMediaType: 'application/json',
      identityProfileId: 'synthetic_identity', identityProfileVersion: 1, expectedLocale: 'en', expectedSchema: 'publication',
    }, {
      representationId: 'html-en', representationVersion: 1, current: true,
      requestUrls: ['https://gov.example/a'], expectedFinalUrl: 'https://gov.example/a/final', expectedMediaType: 'text/html',
      identityProfileId: 'synthetic_identity', identityProfileVersion: 1, expectedLocale: null, expectedSchema: null,
    }],
  }
}

function contentSnapshot(inputs: readonly ContentItemRegistrierenEingabe[] = []): Aufruf {
  const authority = quellenRegistryErstellen([behoerde(), behoerde({ sourceId: 'other-authority', domains: ['other.example'] })])
  assert.ok(authority.ok)
  const items: ContentItemDescriptor[] = [], reps: RepresentationDescriptor[] = []
  for (const { representations, ...item } of inputs) {
    items.push(item)
    reps.push(...representations.map((rep) => ({ ...rep, sourceId: item.sourceId,
      contentItemId: item.contentItemId, contentItemVersion: item.contentItemVersion })))
  }
  const graph = createContentIdentityGraph(authority.registry, items, reps, r2Profiles)
  assert.ok(graph.ok)
  const snapshot = quellenKatalogSnapshotAntwort({ ...graph.value.authorityRegistry, contentIdentity: graph.value })
  assert.ok(snapshot)
  return structuredClone(snapshot)
}

function contentAntwort(outcome: 'inserted' | 'idempotent' = 'inserted'): Aufruf {
  return { ok: true, identity_schema: 2, operation: 'register_content_item', outcome,
    source_id: 'example-border-authority', content_item_id: 'publication-a' }
}

function contentTransport(snapshot: unknown = contentSnapshot(), response: unknown = contentAntwort()) {
  return transportAufzeichnen((payload) => payload.operation === 'read_registry' ? snapshot : response)
}

async function ohneContentWrite(input: unknown, reason: string, snapshot: unknown = contentSnapshot(),
  deps: Omit<OfficialTruthSourceCatalogAbhaengigkeiten, 'transport'> = { identityProfiles: r2Profiles }) {
  const recorder = contentTransport(snapshot)
  assert.deepEqual(await contentItemRegistrieren(input as ContentItemRegistrierenEingabe, { ...deps, transport: recorder.transport }),
    { ok: false, reason })
  assert.deepEqual(recorder.aufrufe, [{ operation: 'read_registry' }])
}

describe('dormant typed content registration gateway', () => {
  for (const outcome of ['inserted', 'idempotent'] as const) test(`canonical S1 payload and exact ${outcome} response`, async () => {
    const input = contentEingabe(), before = structuredClone(input)
    const recorder = contentTransport(contentSnapshot(), contentAntwort(outcome))
    assert.deepEqual(await contentItemRegistrieren(input, { transport: recorder.transport, identityProfiles: r2Profiles }),
      { ok: true, outcome, sourceId: input.sourceId, contentItemId: input.contentItemId })
    assert.deepEqual(input, before)
    assert.equal(Object.isFrozen(input), false)
    assert.deepEqual(recorder.aufrufe, [{ operation: 'read_registry' }, {
      operation: 'register_content_item',
      item: { source_id: input.sourceId, content_item_id: input.contentItemId,
        external_id_namespace: 'synthetic_namespace', external_content_id: 'external-a', content_item_version: 1, current: true,
        expected_publisher_ids: ['publisher-a', 'publisher-b'], expected_authority_ids: ['authority-a', 'authority-b'] },
      representations: [{ representation_id: 'api-en', representation_version: 1, current: true,
        request_urls: ['https://gov.example/api-a', 'https://gov.example/api-a?version=1'],
        expected_final_url: 'https://gov.example/api-a', expected_media_type: 'application/json',
        identity_profile_id: 'synthetic_identity', identity_profile_version: 1, expected_locale: 'en', expected_schema: 'publication' },
      { representation_id: 'html-en', representation_version: 1, current: true,
        request_urls: ['https://gov.example/a'], expected_final_url: 'https://gov.example/a/final', expected_media_type: 'text/html',
        identity_profile_id: 'synthetic_identity', identity_profile_version: 1, expected_locale: null, expected_schema: null }],
    }])
    for (const rep of recorder.aufrufe[1].representations as Aufruf[]) {
      for (const inherited of ['source_id', 'content_item_id', 'content_item_version']) assert.equal(Object.hasOwn(rep, inherited), false)
    }
  })

  for (const field of ['contentItemVersion', 'current'] as const) {
    for (const value of [0, 2, -1, 1.5, '1', null, false, undefined]) {
      test(`reject initial item ${field}=${String(value)} before write`, async () => {
        await ohneContentWrite({ ...contentEingabe(), [field]: value }, 'invalid_descriptor')
      })
    }
  }
  for (const field of ['representationVersion', 'current'] as const) {
    for (const value of [0, 2, -1, 1.5, '1', null, false, undefined]) {
      test(`reject initial representation ${field}=${String(value)} before write`, async () => {
        const input = contentEingabe()
        await ohneContentWrite({ ...input, representations: [{ ...input.representations[0], [field]: value }] }, 'invalid_descriptor')
      })
    }
  }
  for (const field of ['expectedPublisherIds', 'expectedAuthorityIds'] as const) {
    for (const value of [[], ['duplicate', 'duplicate'], [' bad'], [''], [1], null, Array(2), Array(9).fill('too-many')]) {
      test(`reject malformed ${field}: ${JSON.stringify(value)}`, async () => {
        await ohneContentWrite({ ...contentEingabe(), [field]: value }, 'invalid_descriptor')
      })
    }
  }
  test('exact helper envelopes reject missing/extra keys, accessors, symbols, prototypes and malformed arrays', async () => {
    const input = contentEingabe()
    for (const field of Object.keys(input)) {
      const malformed: Aufruf = { ...input }; delete malformed[field]
      await ohneContentWrite(malformed, 'invalid_descriptor')
    }
    for (const field of Object.keys(input.representations[0])) {
      const malformed: Aufruf = { ...input.representations[0] }; delete malformed[field]
      await ohneContentWrite({ ...input, representations: [malformed] }, 'invalid_descriptor')
    }
    const forbiddenGetter = () => { throw new Error('input getter must not execute') }
    for (const malformed of [null, [], {}, { ...input, operation: 'register_content_item' },
      { ...input, identityProfiles: r2Profiles }, { ...input, [Symbol('extra')]: true },
      Object.assign(Object.create(null), input), Object.assign(Object.create({ inherited: true }), input),
      Object.defineProperty({ ...input }, 'sourceId', { get: forbiddenGetter }),
      Object.defineProperty({ ...input }, 'sourceId', { enumerable: false }),
      ...[null, [], Array(2), [...input.representations, ...Array(15).fill(input.representations[0])],
        Object.assign([...input.representations], { extra: true }), Object.setPrototypeOf([...input.representations], {})]
        .map((representations) => ({ ...input, representations }))]) {
      await ohneContentWrite(malformed, 'invalid_descriptor')
    }
    for (const extra of ['sourceId', 'contentItemId', 'contentItemVersion', 'source_id', 'content_item_id', 'content_item_version', 'unknown']) {
      await ohneContentWrite({ ...input, representations: [{ ...input.representations[0], [extra]: 'forged' }] }, 'invalid_descriptor')
    }
    for (const rep of [null, [], Object.assign(Object.create(null), input.representations[0]),
      { ...input.representations[0], [Symbol('extra')]: true },
      Object.defineProperty({ ...input.representations[0] }, 'requestUrls', { get: forbiddenGetter })]) {
      await ohneContentWrite({ ...input, representations: [rep] }, 'invalid_descriptor')
    }
    for (const descriptor of [{ get: forbiddenGetter }, { value: input.representations[0], enumerable: false }]) {
      await ohneContentWrite({ ...input, representations: Object.defineProperty([input.representations[0]], '0', descriptor) }, 'invalid_descriptor')
    }
  })

  for (const url of ['http://gov.example/a', 'https://user:pass@gov.example/a', 'https://gov.example:444/a',
    'https://gov.example/a#fragment', 'https://gov.example/*', ' https://gov.example/a', 'https://localhost/a',
    'https://127.0.0.1/a', 'not-a-url']) {
    for (const field of ['requestUrls', 'expectedFinalUrl']) test(`reject ${field} ${url}`, async () => {
      const input = contentEingabe()
      await ohneContentWrite({ ...input, representations: [{ ...input.representations[0], [field]: field === 'requestUrls' ? [url] : url }] },
        url === 'https://127.0.0.1/a' ? 'url_not_authorized' : 'invalid_url')
    })
  }
  test('canonical R1 handles URL lists, descriptor grammar, profile pins and duplicate streams', async () => {
    const input = contentEingabe(), rep = input.representations[0]
    for (const requestUrls of [[], null, Array(2), ['https://gov.example/a', 'https://gov.example/a'],
      Array.from({ length: 17 }, (_, i) => `https://gov.example/${i}`)]) {
      await ohneContentWrite({ ...input, representations: [{ ...rep, requestUrls }] },
        Array.isArray(requestUrls) && requestUrls[0] === requestUrls[1] && requestUrls[0] !== undefined ? 'url_conflict' : 'invalid_url')
    }
    for (const change of [{ contentItemId: 'x' }, { sourceId: 'UPPER' }, { externalIdNamespace: 'bad namespace' }, { externalContentId: '' }]) {
      await ohneContentWrite({ ...input, ...change }, 'invalid_descriptor')
    }
    for (const change of [{ representationId: 'x' }, { identityProfileId: 'x' }, { identityProfileVersion: 0 },
      { expectedLocale: 'invalid_locale' }, { expectedSchema: 'UPPER' }]) {
      await ohneContentWrite({ ...input, representations: [{ ...rep, ...change }] }, 'invalid_descriptor')
    }
    await ohneContentWrite({ ...input, representations: [{ ...rep, expectedMediaType: 'application/json; charset=utf-8' }] }, 'invalid_media_type')
    await ohneContentWrite({ ...input, representations: [rep, rep] }, 'duplicate_representation_version')
    for (const change of [{ identityProfileId: 'unavailable' }, { identityProfileVersion: 2 }]) {
      await ohneContentWrite({ ...input, representations: [{ ...rep, ...change }] }, 'profile_unavailable')
    }
  })

  test('unknown/nonofficial source, unavailable profiles and source-domain mismatch never write', async () => {
    const input = contentEingabe(), rep = input.representations[0]
    await ohneContentWrite({ ...input, sourceId: 'unknown-source' }, 'unknown_source')
    const provider = contentSnapshot()
    Object.assign((provider.sources as Aufruf[])[0], { source_class: 'licensed_evidence_provider', authority_name: null })
    await ohneContentWrite(input, 'source_not_official', provider)
    for (const change of [{ requestUrls: ['https://unregistered.example/a'] }, { expectedFinalUrl: 'https://unregistered.example/a' }]) {
      await ohneContentWrite({ ...input, representations: [{ ...rep, ...change }] }, 'url_not_authorized')
    }
    for (const change of [{ requestUrls: ['https://other.example/a'] }, { expectedFinalUrl: 'https://other.example/a' }]) {
      await ohneContentWrite({ ...input, representations: [{ ...rep, ...change }] }, 'source_mismatch')
    }
    await ohneContentWrite(input, 'profile_unavailable', contentSnapshot(), { identityProfiles: [] })
    await ohneContentWrite(input, 'profile_unavailable', contentSnapshot(), { identityProfiles: [{ ...r2Profiles[0], current: false }] })
    const blocked = contentSnapshot(); blocked.blocked_domains = ['gov.example']
    await ohneContentWrite(input, 'url_not_authorized', blocked)
  })

  test('external identity and all-version URL ownership conflicts never write', async () => {
    const input = contentEingabe(), stored = contentSnapshot([input])
    await ohneContentWrite({ ...input, contentItemId: 'publication-b' }, 'external_identity_conflict', stored)
    const other = { ...input, contentItemId: 'publication-b', externalContentId: 'external-b' }
    await ohneContentWrite(other, 'url_conflict', stored)
    const historical = structuredClone(stored)
    for (const collection of ['item_versions', 'representations']) {
      for (const row of historical[collection] as Aufruf[]) row.current = false
    }
    await ohneContentWrite(other, 'url_conflict', historical)
    await ohneContentWrite({ ...other, externalContentId: input.externalContentId }, 'external_identity_conflict', historical)
    await ohneContentWrite(input, 'conflicting_duplicate', historical)
    await ohneContentWrite({ ...input, representations: [input.representations[0], { ...input.representations[0], representationId: 'copy-en' }] }, 'url_conflict')
  })

  test('exact replay compares canonical complete sets without adding a duplicate node', async () => {
    const input = contentEingabe(), stored = contentSnapshot([input])
    const reordered = { ...input, expectedPublisherIds: [...input.expectedPublisherIds].reverse(),
      expectedAuthorityIds: [...input.expectedAuthorityIds].reverse(),
      representations: [...input.representations].reverse().map((rep) => ({ ...rep, requestUrls: [...rep.requestUrls].reverse() })) }
    for (const outcome of ['idempotent', 'inserted'] as const) {
      const recorder = contentTransport(stored, contentAntwort(outcome))
      assert.deepEqual(await contentItemRegistrieren(reordered, { transport: recorder.transport, identityProfiles: r2Profiles }),
        { ok: true, outcome, sourceId: input.sourceId, contentItemId: input.contentItemId })
      assert.deepEqual(recorder.aufrufe.map((call) => call.operation), ['read_registry', 'register_content_item'])
    }
  })

  test('changed identity/pins and every representation field or set drift fail before replay write', async () => {
    const input = contentEingabe(), stored = contentSnapshot([input])
    for (const change of [{ externalIdNamespace: 'other-namespace' }, { externalContentId: 'other-id' },
      { expectedPublisherIds: ['publisher-c'] }, { expectedAuthorityIds: ['authority-c'] },
      { representations: [input.representations[0]] },
      { representations: [...input.representations, { ...input.representations[1], representationId: 'extra-en',
        requestUrls: ['https://gov.example/extra'], expectedFinalUrl: 'https://gov.example/extra' }] }]) {
      await ohneContentWrite({ ...input, ...change }, 'conflicting_duplicate', stored)
    }
    const changes = [{ representationId: 'renamed-en' }, { requestUrls: ['https://gov.example/changed'] },
      { requestUrls: [...input.representations[0].requestUrls, 'https://gov.example/additional'] },
      { expectedFinalUrl: 'https://gov.example/changed' }, { expectedMediaType: 'text/plain' },
      { expectedLocale: 'de' }, { expectedSchema: 'changed-schema' }, { identityProfileId: 'other-profile' }, { identityProfileVersion: 2 }]
    for (const change of changes) {
      const identityProfiles = change.identityProfileVersion === 2
        ? [{ ...r2Profiles[0], current: false }, { ...r2Profiles[0], identityProfileVersion: 2 }]
        : [...r2Profiles, { ...r2Profiles[0], identityProfileId: 'other-profile' }]
      // Every catalog descriptor needs a CURRENT profile too. A retired profile
      // invalidates the read itself; a different available id reaches equality.
      await ohneContentWrite({ ...input, representations: [{ ...input.representations[0], ...change }, input.representations[1]] },
        change.identityProfileVersion === 2 ? 'catalog_failed' : 'conflicting_duplicate', stored, { identityProfiles })
    }
    const extraHistory = structuredClone(stored)
    ;(extraHistory.item_versions as Aufruf[]).push({ ...(extraHistory.item_versions as Aufruf[])[0], content_item_version: 2, current: false })
    await ohneContentWrite(input, 'conflicting_duplicate', extraHistory)
    const extraReps = contentSnapshot([{ ...input, representations: [...input.representations,
      { ...input.representations[1], representationId: 'another-en', requestUrls: ['https://gov.example/another'], expectedFinalUrl: 'https://gov.example/another' }] }])
    await ohneContentWrite(input, 'conflicting_duplicate', extraReps)
  })

  test('malformed catalogs, unauthorized stored URLs and unavailable stored profiles never write', async () => {
    for (const response of [null, [], {}, { ...contentSnapshot(), identity_schema: 1 },
      { ...contentSnapshot(), extra: true }, { ...contentSnapshot(), operation: 'register_content_item' }]) {
      await ohneContentWrite(contentEingabe(), 'catalog_failed', response)
    }
    const duplicate = contentSnapshot([contentEingabe()])
    ;(duplicate.item_versions as Aufruf[]).push((duplicate.item_versions as Aufruf[])[0])
    await ohneContentWrite(contentEingabe(), 'catalog_failed', duplicate)
    const profile = contentSnapshot([contentEingabe()])
    ;(profile.representations as Aufruf[])[0].identity_profile_id = 'unavailable'
    await ohneContentWrite(contentEingabe(), 'catalog_failed', profile)
    const domain = contentSnapshot([contentEingabe()])
    ;(domain.sources as Aufruf[])[0].domains = ['changed.example']
    await ohneContentWrite(contentEingabe(), 'catalog_failed', domain)
    const reservations = contentSnapshot([contentEingabe()])
    ;(reservations.url_reservations as Aufruf[])[0].representation_id = 'forged'
    await ohneContentWrite(contentEingabe(), 'catalog_failed', reservations)
  })

  const responseChanges: Aufruf[] = [{ ok: false }, { ok: 'true' }, { identity_schema: 1 }, { identity_schema: '2' },
    { operation: 'register_source' }, { source_id: 'other-authority' }, { content_item_id: 'other-item' },
    { outcome: 'updated' }, { outcome: null }, { extra: 'secret-sentinel' }]
  for (const change of responseChanges) test(`reject response ${JSON.stringify(change)}`, async () => {
    const recorder = contentTransport(contentSnapshot(), { ...contentAntwort(), ...change })
    assert.deepEqual(await contentItemRegistrieren(contentEingabe(), { transport: recorder.transport, identityProfiles: r2Profiles }),
      { ok: false, reason: 'catalog_failed' })
    assert.deepEqual(recorder.aufrufe.map((call) => call.operation), ['read_registry', 'register_content_item'])
  })
  test('reject each missing response key, accessors, symbols, hidden keys and non-plain objects', async () => {
    const response = contentAntwort()
    const missing = Object.keys(response).map((field) => { const copy = { ...response }; delete copy[field]; return copy })
    const malformed = [...missing, null, [], new Date(), Object.assign(Object.create(null), response),
      Object.assign(Object.create({ extra: true }), response), { ...response, [Symbol('extra')]: true },
      Object.defineProperty({ ...response }, 'extra', { value: true }),
      Object.defineProperty({ ...response }, 'ok', { enumerable: false }),
      Object.defineProperty({ ...response }, 'ok', { get: () => { throw new Error('getter must not execute') } })]
    for (const value of malformed) {
      const recorder = contentTransport(contentSnapshot(), value)
      assert.deepEqual(await contentItemRegistrieren(contentEingabe(), { transport: recorder.transport, identityProfiles: r2Profiles }),
        { ok: false, reason: 'catalog_failed' })
    }
  })

  for (const phase of ['read_registry', 'register_content_item']) {
    for (const throws of [false, true]) test(`sanitize ${phase} transport ${throws ? 'exception' : 'failure'}`, async () => {
      const calls: string[] = []
      const transport: OfficialTruthSourceCatalogTransport = { async aufrufen(payload) {
        calls.push(payload.operation as string)
        if (payload.operation === phase) {
          if (throws) throw new Error('database-service-role-secret-sentinel')
          return { ok: false }
        }
        return { ok: true, antwort: contentSnapshot() }
      } }
      assert.deepEqual(await contentItemRegistrieren(contentEingabe(), { transport, identityProfiles: r2Profiles }),
        { ok: false, reason: 'catalog_failed' })
      assert.deepEqual(calls, phase === 'read_registry' ? ['read_registry'] : ['read_registry', 'register_content_item'])
    })
  }
  test('missing/invalid configuration is sanitized and synthetic profiles remain unavailable by default', async () => {
    for (const env of [{}, { NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.example' }, { SUPABASE_SERVICE_ROLE_KEY: 'sentinel' },
      { NEXT_PUBLIC_SUPABASE_URL: ' ', SUPABASE_SERVICE_ROLE_KEY: 'sentinel' }]) {
      assert.deepEqual(await contentItemRegistrieren(contentEingabe(), { env }), { ok: false, reason: 'catalog_not_configured' })
    }
    assert.deepEqual(await contentItemRegistrieren(contentEingabe(), {
      env: { NEXT_PUBLIC_SUPABASE_URL: 'invalid-url', SUPABASE_SERVICE_ROLE_KEY: 'sentinel' },
    }), { ok: false, reason: 'catalog_failed' })
    assert.equal(OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY.length, 1)
    assert.equal(Object.isFrozen(OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY), true)
    await ohneContentWrite(contentEingabe(), 'profile_unavailable', contentSnapshot(), {})
    await ohneContentWrite(contentEingabe(), 'catalog_failed', contentSnapshot([contentEingabe()]), {})
    assert.equal(OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY.length, 1)
  })

  test('fresh module import has no network/DB access even with service configuration', () => {
    const script = `
      import assert from 'node:assert/strict';
      import http from 'node:http'; import https from 'node:https';
      import net from 'node:net'; import dns from 'node:dns';
      let calls = 0;
      const forbidden = () => { calls++; throw new Error('network forbidden during import'); };
      globalThis.fetch = forbidden;
      http.request = https.request = http.get = https.get = forbidden;
      net.connect = net.createConnection = net.Socket.prototype.connect = forbidden;
      dns.lookup = dns.resolve = forbidden;
      const mod = await import('./lib/readiness/official-truth-source-catalog-server.ts');
      assert.equal(typeof (mod.default ?? mod).contentItemRegistrieren, 'function');
      assert.equal(calls, 0);
    `
    execFileSync(process.execPath, ['--import', './scripts/server-only-test-register.mjs', '--import', 'tsx', '--input-type=module', '-e', script], {
      cwd: ROOT, env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.example', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-test-key' },
      stdio: 'pipe', timeout: 15_000,
    })
  })

  test('one through sixteen representations are supported and profile code is never executed', async () => {
    const input = contentEingabe()
    const identityProfiles = [{ ...r2Profiles[0], verify: () => { throw new Error('identity verification is not registration') } }]
    for (const count of [1, 16]) {
      const representations = Array.from({ length: count }, (_, i) => ({ ...input.representations[0],
        representationId: `representation-${i}`, requestUrls: [`https://gov.example/${i}`], expectedFinalUrl: `https://gov.example/${i}` }))
      const recorder = contentTransport()
      assert.equal((await contentItemRegistrieren({ ...input, representations }, { transport: recorder.transport, identityProfiles })).ok, true)
      assert.equal((recorder.aufrufe[1].representations as unknown[]).length, count)
    }
  })

  test('serialization and response binding retain the validated copy during the write await', async () => {
    const input = contentEingabe(), expected = structuredClone(input)
    const recorder = transportAufzeichnen((payload) => {
      if (payload.operation === 'read_registry') return contentSnapshot()
      Object.assign(input, { sourceId: 'mutated-source', contentItemId: 'mutated-item' })
      ;(input.expectedPublisherIds as string[]).push('mutated')
      ;(input.representations[0].requestUrls as string[]).push('https://unregistered.example/mutated')
      return contentAntwort()
    })
    assert.deepEqual(await contentItemRegistrieren(input, { transport: recorder.transport, identityProfiles: r2Profiles }),
      { ok: true, outcome: 'inserted', sourceId: expected.sourceId, contentItemId: expected.contentItemId })
    assert.deepEqual((recorder.aufrufe[1].item as Aufruf).expected_publisher_ids, [...expected.expectedPublisherIds].sort())
    assert.deepEqual((recorder.aufrufe[1].representations as Aufruf[])[0].request_urls, [...expected.representations[0].requestUrls].sort())
  })
})

describe('GOV.UK registration with the normal default registry', () => {
  const answer = (outcome = 'inserted') => ({ ok: true, identity_schema: 2, operation: 'register_content_item', outcome,
    source_id: 'govuk', content_item_id: 'eta-national-list' })

  for (const replay of [false, true]) test(`${replay ? 'exact replay' : 'initial item'} needs only injected catalog transport`, async () => {
    const fixture = govukNationalListFixture(), outcome = replay ? 'idempotent' : 'inserted'
    const recorder = contentTransport(replay ? fixture.catalog : fixture.sourceOnlyCatalog, answer(outcome))
    assert.deepEqual(await contentItemRegistrieren(fixture.registration, { transport: recorder.transport }),
      { ok: true, outcome, sourceId: 'govuk', contentItemId: 'eta-national-list' })
    assert.deepEqual(recorder.aufrufe, [{ operation: 'read_registry' }, {
      operation: 'register_content_item', item: { source_id: 'govuk', content_item_id: 'eta-national-list',
        external_id_namespace: 'govuk-content-id', external_content_id: '2b25b3d4-4eaa-4859-a34e-c7869c114c15',
        content_item_version: 1, current: true,
        expected_publisher_ids: ['06056197-bc69-4147-aa28-070bca132178'],
        expected_authority_ids: ['06056197-bc69-4147-aa28-070bca132178'] },
      representations: [{ representation_id: 'content-api-en', representation_version: 1, current: true,
        request_urls: [fixture.url], expected_final_url: fixture.url, expected_media_type: 'application/json',
        identity_profile_id: 'govuk-eta-national-list-content-api-en', identity_profile_version: 1,
        expected_locale: 'en', expected_schema: 'manual_section' }],
    }])
    const read = await quellenKatalogLesen({ transport: contentTransport(fixture.catalog).transport })
    assert.ok(read.ok)
    assert.deepEqual(read.registry.contentIdentity?.profiles,
      [{ identityProfileId: 'govuk-eta-national-list-content-api-en', identityProfileVersion: 1, current: true }])
  })

  test('wrong profile/id/version, source authority, URL conflicts and changed replay fail before write', async () => {
    const fixture = govukNationalListFixture(), input = fixture.registration
    for (const change of [{ identityProfileId: 'unknown-profile' }, { identityProfileId: 'govuk-appendix-eta' }, { identityProfileVersion: 2 }]) {
      await ohneContentWrite({ ...input, representations: [{ ...input.representations[0], ...change }] },
        'profile_unavailable', fixture.sourceOnlyCatalog, {})
    }
    await ohneContentWrite({ ...input, sourceId: 'unknown-source' }, 'unknown_source', fixture.sourceOnlyCatalog, {})
    const provider = structuredClone(fixture.sourceOnlyCatalog)
    Object.assign((provider.sources as Aufruf[])[0], { source_class: 'licensed_evidence_provider', authority_name: null })
    await ohneContentWrite(input, 'source_not_official', provider, {})
    await ohneContentWrite({ ...input, contentItemId: 'other-item', externalContentId: 'other-external-id' }, 'url_conflict', fixture.catalog, {})
    await ohneContentWrite({ ...input, expectedAuthorityIds: ['other-authority'] }, 'conflicting_duplicate', fixture.catalog, {})
    await ohneContentWrite({ ...input, representations: [{ ...input.representations[0], expectedLocale: 'cy' }] },
      'conflicting_duplicate', fixture.catalog, {})
    await ohneContentWrite({ ...input, identityProfiles: [{ verify: () => true }] }, 'invalid_descriptor', fixture.sourceOnlyCatalog, {})
  })

  test('default registry retains exact response keys and tuple validation', async () => {
    const fixture = govukNationalListFixture()
    const missing = Object.keys(answer()).map(key => { const value: Aufruf = answer(); delete value[key]; return value })
    for (const response of [...missing, { ...answer(), extra: 'secret-sentinel' }, { ...answer(), identity_schema: 1 },
      { ...answer(), source_id: 'other-source' }, { ...answer(), content_item_id: 'other-item' },
      { ...answer(), operation: 'register_source' }, { ...answer(), outcome: 'updated' }]) {
      const recorder = contentTransport(fixture.sourceOnlyCatalog, response)
      assert.deepEqual(await contentItemRegistrieren(fixture.registration, { transport: recorder.transport }),
        { ok: false, reason: 'catalog_failed' })
      assert.deepEqual(recorder.aufrufe.map(call => call.operation), ['read_registry', 'register_content_item'])
    }
  })

  test('real default verifier has zero calls during structural registration (V8 coverage)', () => {
    const script = `
      const assert = require('node:assert/strict');
      const { Session } = require('node:inspector/promises');
      globalThis.fetch = () => { throw new Error('network forbidden'); };
      (async () => {
        const session = new Session(); session.connect();
        await session.post('Profiler.enable');
        await session.post('Profiler.startPreciseCoverage', { callCount: true, detailed: true });
        const { govukNationalListFixture } = require('./lib/readiness/official-truth-content-identity-r2.test.ts');
        const { contentItemRegistrieren } = require('./lib/readiness/official-truth-source-catalog-server.ts');
        const fixture = govukNationalListFixture(), calls = [];
        const result = await contentItemRegistrieren(fixture.registration, { transport: { async aufrufen(payload) {
          calls.push(payload.operation);
          return { ok: true, antwort: payload.operation === 'read_registry' ? fixture.sourceOnlyCatalog : ${JSON.stringify(answer())} };
        } } });
        assert.equal(result.ok, true);
        assert.deepEqual(calls, ['read_registry', 'register_content_item']);
        const coverage = await session.post('Profiler.takePreciseCoverage');
        const verifier = coverage.result.find(entry => entry.url.endsWith('/official-truth-govuk-content-api-identity-profile.ts'))
          ?.functions.find(entry => entry.functionName === 'verify');
        assert.ok(verifier); assert.equal(verifier.ranges[0].count, 0);
        // Positive control: prove this counter sees the same immutable verifier.
        const profile = require('./lib/readiness/official-truth-content-identity.ts').OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY[0];
        assert.equal(profile.verify({ item: fixture.item, representation: fixture.representation,
          responseText: fixture.responseText, finalUrl: fixture.url, mediaType: 'application/json' }).ok, true);
        const after = await session.post('Profiler.takePreciseCoverage');
        const executed = after.result.find(entry => entry.url.endsWith('/official-truth-govuk-content-api-identity-profile.ts'))
          ?.functions.find(entry => entry.functionName === 'verify');
        assert.ok(executed); assert.equal(executed.ranges[0].count, 1);
        await session.post('Profiler.stopPreciseCoverage'); session.disconnect();
      })().catch(error => { console.error(error); process.exitCode = 1; });
    `
    execFileSync(process.execPath, ['--import', './scripts/server-only-test-register.mjs', '--import', 'tsx', '-e', script],
      { cwd: ROOT, stdio: 'pipe', timeout: 15_000 })
  })

  test('missing v2 uses only the literal v2 RPC and never registers, falls back, applies or leaks', () => {
    const script = `
      const assert = require('node:assert/strict');
      const forbidden = () => { throw new Error('real network forbidden'); };
      for (const name of ['node:http', 'node:https']) require(name).request = require(name).get = forbidden;
      require('node:net').Socket.prototype.connect = forbidden;
      require('node:dns').lookup = forbidden;
      const calls = [], sentinel = 'synthetic-service-role-secret';
      let throws = false;
      globalThis.fetch = async (url, options) => {
        calls.push({ url: String(url), method: options.method, body: JSON.parse(options.body) });
        if (throws) throw new Error(sentinel);
        return new Response(JSON.stringify({ code: 'PGRST202', message: sentinel, details: 'missing v2 RPC' }),
          { status: 404, headers: { 'content-type': 'application/json' } });
      };
      (async () => {
        const { govukNationalListFixture } = require('./lib/readiness/official-truth-content-identity-r2.test.ts');
        const { contentItemRegistrieren, quellenKatalogLesen } = require('./lib/readiness/official-truth-source-catalog-server.ts');
        const fixture = govukNationalListFixture();
        const deps = { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.example', SUPABASE_SERVICE_ROLE_KEY: sentinel } };
        assert.equal(calls.length, 0);
        for (const failure of [false, true]) {
          throws = failure;
          for (const run of [() => quellenKatalogLesen(deps), () => contentItemRegistrieren(fixture.registration, deps)]) {
            calls.length = 0;
            const result = await run();
            assert.deepEqual(result, { ok: false, reason: 'catalog_failed' });
            assert.equal(JSON.stringify(result).includes(sentinel), false);
            assert.deepEqual(calls, [{ url: 'https://supabase.example/rest/v1/rpc/official_truth_source_catalog_v2',
              method: 'POST', body: { payload: { operation: 'read_registry' } } }]);
          }
        }
      })().catch(error => { console.error(error); process.exitCode = 1; });
    `
    execFileSync(process.execPath, ['--import', './scripts/server-only-test-register.mjs', '--import', 'tsx', '-e', script],
      { cwd: ROOT, stdio: 'pipe', timeout: 15_000 })
  })
})
