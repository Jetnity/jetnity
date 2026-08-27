import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { PRODUCTION_GRENZE_VERSION } from '@/lib/rollout/anwenden-grenze'
import {
  AAL2_ALIGN_DATEI,
  AAL2_ALIGN_GIT_BLOB,
  AAL2_ALIGN_NAME,
  AAL2_ALIGN_SHA256,
  AAL2_ALIGN_VERSION,
  AAL2_MINDESTROLLEN,
  AAL2_PROD_HEAD_NAME,
  AAL2_PROD_HEAD_VERSION,
  AAL2_PROD_PROJEKT_REF,
  aal2AuftragLesen,
  aal2DateiLesenUndPruefen,
  anwendenDarfAal2AlignmentNichtAufProduction,
  failPathSql,
  gitBlobSha1,
  historyInsertSql,
  historyStimmtMitDatei,
  migrationTransactionSql,
  phase31GrenzeUnveraendert,
  preflightPasst,
  preflightSql,
  preflightStandAusZeilen,
  sha256Hex,
  verifyFinalContractSql,
} from '@/lib/rollout/aal2-prod-apply'
import { sqlLiteral } from '@/lib/rollout/sql-literal'

const env = { SUPABASE_PROJECT_REF: AAL2_PROD_PROJEKT_REF }

describe('AAL2-Alignment-Datei bleibt byte-identisch mit dem reviewten Vertrag', () => {
  test('SHA-256 und Git-Blob treffen den Issue-#101-Stand', () => {
    const datei = aal2DateiLesenUndPruefen()
    const raw = readFileSync(`supabase/migrations/${AAL2_ALIGN_DATEI}`)
    assert.equal(datei.version, AAL2_ALIGN_VERSION)
    assert.equal(datei.name, AAL2_ALIGN_NAME)
    assert.equal(datei.sha256, AAL2_ALIGN_SHA256)
    assert.equal(datei.gitBlob, AAL2_ALIGN_GIT_BLOB)
    assert.equal(sha256Hex(raw), AAL2_ALIGN_SHA256)
    assert.equal(gitBlobSha1(raw), AAL2_ALIGN_GIT_BLOB)
    assert.equal(createHash('sha256').update(raw).digest('hex'), AAL2_ALIGN_SHA256)
    assert.equal(datei.sql, raw.toString('utf8'))
  })

  test('keine zweite Alignment-Datei und keine History-Fälschung', () => {
    const sqlDateien = readdirSync('supabase/migrations').filter((name) => name.endsWith('.sql'))
    const aal2Align = sqlDateien.filter((name) => name.includes('admin_aal2_data_plane_alignment'))
    assert.deepEqual(aal2Align, [AAL2_ALIGN_DATEI])
    assert.equal(sqlDateien.includes('20260826090000_admin_aal2_data_plane.sql'), true)
    assert.match(aal2DateiLesenUndPruefen().sql, /create or replace function public\.aktuelles_admin_aal2/)
    assert.equal(aal2DateiLesenUndPruefen().sql.includes('drop function'), false)
    assert.equal(aal2DateiLesenUndPruefen().sql.includes('alter table'), false)
    assert.equal(aal2DateiLesenUndPruefen().sql.includes('create policy'), false)
  })
})

describe('AAL2-Auftrag ist fail-closed', () => {
  test('ohne Flags bleibt die lokale Probe', () => {
    assert.deepEqual(aal2AuftragLesen([]), { modus: 'probe' })
    assert.deepEqual(aal2AuftragLesen(['--probe'], env), { modus: 'probe' })
  })

  test('Production-Preflight braucht exakten Ref und kein --schreiben', () => {
    assert.deepEqual(aal2AuftragLesen(['--produktion', '--projekt-ref', AAL2_PROD_PROJEKT_REF], env), {
      modus: 'preflight',
      bestaetigterRef: AAL2_PROD_PROJEKT_REF,
    })
    assert.throws(() => aal2AuftragLesen(['--produktion'], env), /exakt/)
    assert.throws(
      () => aal2AuftragLesen(['--produktion', '--projekt-ref', 'anderesprojekt1234'], env),
      /qscbgcdmivbbnzrcyegn/,
    )
    assert.throws(
      () =>
        aal2AuftragLesen(['--produktion', '--projekt-ref', AAL2_PROD_PROJEKT_REF], {
          SUPABASE_PROJECT_REF: 'anderesprojekt1234',
        }),
      /stimmt nicht/,
    )
  })

  test('Production-Write braucht --schreiben --produktion --projekt-ref', () => {
    assert.deepEqual(
      aal2AuftragLesen(
        ['--schreiben', '--produktion', '--projekt-ref', AAL2_PROD_PROJEKT_REF],
        env,
      ),
      { modus: 'apply', bestaetigterRef: AAL2_PROD_PROJEKT_REF },
    )
    assert.throws(() => aal2AuftragLesen(['--schreiben'], env), /--schreiben --produktion/)
    assert.throws(
      () => aal2AuftragLesen(['--schreiben', '--produktion'], env),
      /exakt/,
    )
  })

  test('Development und stilles Default-Ziel sind abgelehnt', () => {
    assert.throws(() => aal2AuftragLesen(['--entwicklung']), /kein --entwicklung/)
    assert.throws(
      () => aal2AuftragLesen(['--schreiben', '--entwicklung']),
      /kein --entwicklung/,
    )
    assert.throws(
      () => aal2AuftragLesen(['--projekt-ref', AAL2_PROD_PROJEKT_REF], env),
      /nur mit --produktion/,
    )
    assert.throws(
      () =>
        aal2AuftragLesen(['--produktion', '--projekt-ref', AAL2_PROD_PROJEKT_REF], {
          SUPABASE_PROJECT_REF: undefined,
        }),
      /SUPABASE_PROJECT_REF fehlt/,
    )
  })
})

describe('AAL2-Preflight ist fail-closed', () => {
  test('erwartet Head 20260827010000, Count 0 und fehlende Funktion', () => {
    const stand = preflightStandAusZeilen({
      head_version: AAL2_PROD_HEAD_VERSION,
      head_name: AAL2_PROD_HEAD_NAME,
      align_count: 0,
      aal2_fn_exists: false,
    })
    preflightPasst(stand)
    assert.match(preflightSql(), /schema_migrations/)
    assert.match(preflightSql(), /aktuelles_admin_aal2/)
    assert.match(preflightSql(), new RegExp(AAL2_ALIGN_VERSION))
  })

  test('abweichender Head, vorhandene Version oder vorhandene Funktion bricht ab', () => {
    assert.throws(
      () =>
        preflightPasst({
          head_version: '20260824180000',
          head_name: AAL2_PROD_HEAD_NAME,
          align_count: 0,
          aal2_fn_exists: false,
        }),
      /Production-Head ist nicht/,
    )
    assert.throws(
      () =>
        preflightPasst({
          head_version: AAL2_PROD_HEAD_VERSION,
          head_name: 'andere_migration',
          align_count: 0,
          aal2_fn_exists: false,
        }),
      /Head-Name/,
    )
    assert.throws(
      () =>
        preflightPasst({
          head_version: AAL2_PROD_HEAD_VERSION,
          head_name: AAL2_PROD_HEAD_NAME,
          align_count: 1,
          aal2_fn_exists: false,
        }),
      /existiert bereits/,
    )
    assert.throws(
      () =>
        preflightPasst({
          head_version: AAL2_PROD_HEAD_VERSION,
          head_name: AAL2_PROD_HEAD_NAME,
          align_count: 0,
          aal2_fn_exists: true,
        }),
      /existiert bereits unerwartet/,
    )
    assert.throws(() => preflightStandAusZeilen([]), /Preflight leer/)
  })
})

describe('AAL2-Transaktion ist atomar', () => {
  test('eine Transaktion enthält genau Datei-SQL und History vor COMMIT', () => {
    const datei = aal2DateiLesenUndPruefen()
    const sql = migrationTransactionSql(datei)
    assert.equal(sql.startsWith('begin;'), true)
    assert.equal(sql.endsWith('commit;'), true)
    assert.equal(sql.indexOf('begin;'), 0)
    assert.ok(sql.indexOf(datei.sql) > sql.indexOf('begin;'))
    const insert = historyInsertSql(datei)
    assert.ok(sql.indexOf(insert) > sql.indexOf(datei.sql))
    assert.ok(sql.lastIndexOf('commit;') > sql.indexOf(insert))
    assert.equal((sql.match(/^begin;/gm) ?? []).length, 1)
    assert.equal((sql.match(/^commit;/gm) ?? []).length, 1)
    assert.match(insert, /insert into supabase_migrations\.schema_migrations \(version, name, statements\)/)
    assert.equal(insert.includes(sqlLiteral(datei.sql)), true)
    assert.equal(insert.includes(sqlLiteral(AAL2_ALIGN_VERSION)), true)
    assert.equal(insert.includes(sqlLiteral(AAL2_ALIGN_NAME)), true)
  })

  test('History-Vergleich ist byte-identisch und namensgenau', () => {
    const datei = aal2DateiLesenUndPruefen()
    assert.equal(
      historyStimmtMitDatei(
        { version: datei.version, name: datei.name, statements: [datei.sql] },
        datei,
      ),
      true,
    )
    assert.equal(
      historyStimmtMitDatei(
        { version: datei.version, name: datei.name, statements: [`${datei.sql} `] },
        datei,
      ),
      false,
    )
    assert.equal(
      historyStimmtMitDatei(
        { version: datei.version, name: 'andere', statements: [datei.sql] },
        datei,
      ),
      false,
    )
  })

  test('fremde Version oder Datei ist fail-closed', () => {
    const datei = aal2DateiLesenUndPruefen()
    assert.throws(
      () => migrationTransactionSql({ ...datei, version: '20260826090000' }),
      /nur 20260827170000/,
    )
    assert.throws(
      () => migrationTransactionSql({ ...datei, name: 'admin_aal2_data_plane' }),
      /nur 20260827170000/,
    )
    assert.throws(
      () => migrationTransactionSql({ ...datei, datei: 'andere.sql' }),
      /keine andere Datei/,
    )
  })

  test('Fail-Path würde bei SQL-Fehler keinen History-Eintrag vortäuschen', () => {
    const sql = failPathSql()
    assert.match(sql, /^begin;/)
    assert.match(sql, /20260827170000/)
    assert.match(sql, /aal2_fail_path_probe/)
    assert.match(sql, /should_not_commit/)
    assert.match(sql, /AAL2 fail-path probe/)
    assert.ok(sql.indexOf('insert into supabase_migrations.schema_migrations') < sql.indexOf('raise exception'))
    assert.ok(sql.indexOf('raise exception') < sql.lastIndexOf('commit;'))
  })
})

describe('AAL2-Verify prüft den engen Vertrag', () => {
  test('Verify verlangt Helper, Mindestrollen, INVOKER, Grants, History und unveränderte RLS', () => {
    const sql = verifyFinalContractSql()
    assert.match(sql, /aktuelles_admin_aal2\(\)/)
    assert.match(sql, /auth\.jwt\(\) ->> ''aal''/)
    assert.match(sql, /unerlaubte AAL-Quelle/)
    assert.match(sql, /SECURITY INVOKER/)
    assert.match(sql, /search_path=pg_catalog/)
    assert.match(sql, /has_function_privilege\('public'/)
    assert.match(sql, /has_function_privilege\('anon'/)
    for (const [fn, rolle] of Object.entries(AAL2_MINDESTROLLEN)) {
      assert.match(sql, new RegExp(`'${fn}'`))
      assert.match(sql, new RegExp(`'${rolle}'`))
    }
    assert.match(sql, /profiles_lesen/)
    assert.match(sql, /user_id = auth\.uid\(\)/)
    assert.match(sql, /Trip\/Traveller-RLS/)
    assert.match(sql, /schema_migrations/)
    assert.match(sql, /admin_aal2_data_plane_alignment/)
  })
})

describe('db:anwenden bleibt geschlossen', () => {
  test('Phase-3.1-Grenze bleibt 20260820130000', () => {
    phase31GrenzeUnveraendert()
    assert.equal(PRODUCTION_GRENZE_VERSION, '20260820130000')
    assert.ok(AAL2_ALIGN_VERSION > PRODUCTION_GRENZE_VERSION)
  })

  test('Production-Anwenden darf die Alignment-Datei nicht nachziehen', () => {
    anwendenDarfAal2AlignmentNichtAufProduction('entwicklung', [
      { version: AAL2_ALIGN_VERSION, datei: AAL2_ALIGN_DATEI },
    ])
    assert.throws(
      () =>
        anwendenDarfAal2AlignmentNichtAufProduction('produktion', [
          { version: AAL2_ALIGN_VERSION, datei: AAL2_ALIGN_DATEI },
        ]),
      /nicht über db:anwenden/,
    )
    anwendenDarfAal2AlignmentNichtAufProduction('produktion', [
      { version: '20260820130000', datei: '20260820130000_phase31.sql' },
    ])
  })
})
