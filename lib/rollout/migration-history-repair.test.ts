import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { sqlLiteral } from '@/lib/rollout/sql-literal'
import {
  REPAIR_DATEI,
  REPAIR_DO_TAG,
  REPAIR_ERSTES_SQL,
  REPAIR_FUNCTION_ACL,
  REPAIR_FUNCTION_CONFIG,
  REPAIR_FUNCTION_IDENTITY,
  REPAIR_FUNCTION_MD5,
  REPAIR_FUNCTION_NAME,
  REPAIR_FUNCTION_SCHEMA,
  REPAIR_GATE_NOTE,
  REPAIR_GIT_BLOB,
  REPAIR_MEMBERSHIP_COUNT,
  REPAIR_ROLE_CONNLIMIT,
  REPAIR_ROLE_MEMBERSHIPS,
  REPAIR_MARKER_MD5,
  REPAIR_MARKER_SHA256,
  REPAIR_MARKER_TEXT,
  REPAIR_NAME,
  REPAIR_POLICY,
  REPAIR_POLICY_QUAL_FINGERPRINT,
  REPAIR_POLICY_ROLES,
  REPAIR_PROD_PROJEKT_REF,
  REPAIR_RUNTIME_MEMBERS,
  REPAIR_RUNTIME_ROLE,
  REPAIR_SQL_MD5,
  REPAIR_SQL_SHA256,
  REPAIR_TABLE,
  REPAIR_TABLE_ACL,
  REPAIR_TABLE_OID,
  REPAIR_VERSION,
  REPAIR_WRITER_MEMBERS,
  REPAIR_WRITER_ROLE,
  afterProbeSql,
  auftragLesen,
  dateiLesenUndPruefen,
  erstesAusfuehrbaresSql,
  erwartetesMarkerPreflight,
  fuehrendeSqlKommentareEntfernen,
  gitBlobSha1,
  historyBodyRepariert,
  historyStatements,
  historyStatementsArraySql,
  istProsaMarker,
  katalogUnveraendert,
  keineSecrets,
  md5Hex,
  mengenFingerprint,
  policyQualFingerprint,
  preflightAusZeilen,
  preflightPasst,
  preflightSql,
  sha256Hex,
  sqlStatement,
  writeSqlIstFailClosed,
  writeSqlOhneHistoryLiteral,
  writeTransactionSql,
  type HistoryRepairPreflight,
} from '@/lib/rollout/migration-history-repair'

const env = { SUPABASE_PROJECT_REF: REPAIR_PROD_PROJEKT_REF }

function mitAbweichung(
  stand: HistoryRepairPreflight,
  feld: keyof HistoryRepairPreflight,
  wert: HistoryRepairPreflight[keyof HistoryRepairPreflight],
): HistoryRepairPreflight {
  return { ...stand, [feld]: wert }
}

describe('Kanonische S5-B-Migration bleibt blob-identisch', () => {
  test('Git-Blob, SHA-256 und MD5 treffen das Before-Image', () => {
    const datei = dateiLesenUndPruefen()
    const raw = readFileSync(`supabase/migrations/${REPAIR_DATEI}`)
    assert.equal(datei.version, REPAIR_VERSION)
    assert.equal(datei.name, REPAIR_NAME)
    assert.equal(datei.gitBlob, REPAIR_GIT_BLOB)
    assert.equal(datei.sha256, REPAIR_SQL_SHA256)
    assert.equal(datei.md5, REPAIR_SQL_MD5)
    assert.equal(gitBlobSha1(raw), REPAIR_GIT_BLOB)
    assert.equal(sha256Hex(raw), REPAIR_SQL_SHA256)
    assert.equal(md5Hex(raw), REPAIR_SQL_MD5)
    assert.equal(createHash('sha1').update(Buffer.from(`blob ${raw.length}\0`)).update(raw).digest('hex'), REPAIR_GIT_BLOB)
    assert.equal(datei.sql, raw.toString('utf8'))
    assert.equal(datei.sql.includes('create table if not exists public.trip_item_commercial_provenance'), false)
    assert.match(datei.sql, /create table public\.trip_item_commercial_provenance/)
    assert.equal(REPAIR_TABLE, 'trip_item_commercial_provenance')
    assert.equal(REPAIR_POLICY, 'trip_item_commercial_provenance_lesen')
    assert.equal(REPAIR_FUNCTION_SCHEMA, 'jetnity_internal')
    assert.equal(REPAIR_FUNCTION_NAME, 'trip_item_commercial_provenance_schreiben')
    assert.equal(REPAIR_FUNCTION_IDENTITY, 'jetnity_internal.trip_item_commercial_provenance_schreiben(jsonb)')
    assert.equal(REPAIR_WRITER_ROLE, 'jetnity_commercial_writer')
    assert.equal(REPAIR_RUNTIME_ROLE, 'jetnity_commercial_runtime')
    assert.equal(datei.sql.includes(`$${REPAIR_DO_TAG}$`), false)
  })

  test('Marker-MD5 bleibt das Before-Image und ist kein SQL', () => {
    assert.equal(REPAIR_MARKER_TEXT.length, 234)
    assert.equal(md5Hex(REPAIR_MARKER_TEXT), REPAIR_MARKER_MD5)
    assert.equal(sha256Hex(REPAIR_MARKER_TEXT), REPAIR_MARKER_SHA256)
    assert.equal(istProsaMarker(REPAIR_MARKER_TEXT), true)
    assert.equal(istProsaMarker(`${REPAIR_MARKER_TEXT} `), false)
    assert.match(REPAIR_MARKER_TEXT, /S5-B Commercial Provenance persistence applied/)
    assert.doesNotMatch(REPAIR_MARKER_TEXT, /create\s+table/i)
  })
})

describe('Statement-Repräsentation ist deterministisch und replay-fähig', () => {
  test('eine Datei bleibt genau ein History-Statement', () => {
    const datei = dateiLesenUndPruefen()
    const statements = historyStatements(datei.sql)
    assert.deepEqual(statements, [datei.sql])
    assert.equal(statements.length, 1)
    assert.equal(historyStatementsArraySql(datei.sql), `array[${sqlLiteral(datei.sql)}]`)
    assert.equal(historyStatementsArraySql(datei.sql), historyStatementsArraySql(datei.sql))
    assert.equal(erstesAusfuehrbaresSql(datei.sql), REPAIR_ERSTES_SQL)
    assert.match(erstesAusfuehrbaresSql(datei.sql), /^create schema /)
    assert.equal(istProsaMarker(datei.sql), false)
    assert.equal(sqlStatement('select 1'), 'select 1;')
    assert.equal(fuehrendeSqlKommentareEntfernen(datei.sql).startsWith('create schema'), true)
  })

  test('anwenden.ts-Konvention: Datei = array[sqlLiteral(sql)]', () => {
    const anwenden = readFileSync('scripts/db/anwenden.ts', 'utf8')
    const literal = readFileSync('lib/rollout/sql-literal.ts', 'utf8')
    assert.match(anwenden, /array\[\$\{sqlLiteral\(sql\)\}\]/)
    assert.match(literal, /eine Datei = ein Statement/)
    const datei = dateiLesenUndPruefen()
    assert.equal(historyStatementsArraySql(datei.sql).startsWith('array['), true)
    assert.equal(historyStatementsArraySql(datei.sql).endsWith(']'), true)
  })

  test('Prosa oder leerer Body ist nicht replay-fähig', () => {
    assert.throws(() => erstesAusfuehrbaresSql(REPAIR_MARKER_TEXT), /kein SQL|ausführbares SQL/)
    assert.throws(() => historyStatements(''), /Leerer Migrations-Body/)
    assert.throws(() => erstesAusfuehrbaresSql('-- nur kommentar\n'), /kein ausführbares SQL/)
  })
})

describe('Repair-Auftrag ist fail-closed', () => {
  test('ohne Flags bleibt die lokale Probe', () => {
    assert.deepEqual(auftragLesen([]), { modus: 'probe' })
    assert.deepEqual(auftragLesen(['--probe'], env), { modus: 'probe' })
  })

  test('Production-Preflight braucht exakten Ref und kein --schreiben', () => {
    assert.deepEqual(auftragLesen(['--produktion', '--projekt-ref', REPAIR_PROD_PROJEKT_REF], env), {
      modus: 'preflight',
      bestaetigterRef: REPAIR_PROD_PROJEKT_REF,
    })
    assert.throws(() => auftragLesen(['--produktion'], env), /exakt/)
    assert.throws(
      () => auftragLesen(['--produktion', '--projekt-ref', 'anderesprojekt1234'], env),
      /qscbgcdmivbbnzrcyegn/,
    )
    assert.throws(
      () =>
        auftragLesen(['--produktion', '--projekt-ref', REPAIR_PROD_PROJEKT_REF], {
          SUPABASE_PROJECT_REF: 'anderesprojekt1234',
        }),
      /stimmt nicht/,
    )
  })

  test('Write-Mode ohne explizite Production-Bestätigung ist unmöglich', () => {
    assert.throws(() => auftragLesen(['--schreiben'], env), /--schreiben --produktion/)
    assert.throws(() => auftragLesen(['--schreiben', '--produktion'], env), /exakt/)
    assert.throws(
      () => auftragLesen(['--schreiben', '--produktion', '--projekt-ref', REPAIR_PROD_PROJEKT_REF], env),
      /history-body-ersetzen/,
    )
    assert.throws(
      () => auftragLesen(['--history-body-ersetzen'], env),
      /nur zusammen mit --schreiben/,
    )
    assert.deepEqual(
      auftragLesen(
        [
          '--schreiben',
          '--produktion',
          '--projekt-ref',
          REPAIR_PROD_PROJEKT_REF,
          '--history-body-ersetzen',
        ],
        env,
      ),
      { modus: 'apply', bestaetigterRef: REPAIR_PROD_PROJEKT_REF },
    )
  })

  test('Development ist kein zulässiges Ziel', () => {
    assert.throws(() => auftragLesen(['--entwicklung']), /kein --entwicklung/i)
    assert.throws(() => auftragLesen(['--entwicklung-probe']), /kein --entwicklung/i)
    assert.throws(
      () => auftragLesen(['--schreiben', '--entwicklung']),
      /kein --entwicklung/i,
    )
    assert.throws(
      () => auftragLesen(['--projekt-ref', REPAIR_PROD_PROJEKT_REF], env),
      /nur mit --produktion/,
    )
    assert.throws(
      () =>
        auftragLesen(['--produktion', '--projekt-ref', REPAIR_PROD_PROJEKT_REF], {
          SUPABASE_PROJECT_REF: undefined,
        }),
      /SUPABASE_PROJECT_REF fehlt/,
    )
  })
})

describe('Preflight erkennt das Marker-Before-Image und stoppt bei Drift', () => {
  test('exaktes Before-Image passiert', () => {
    const stand = preflightAusZeilen(erwartetesMarkerPreflight())
    preflightPasst(stand)
    assert.equal(istProsaMarker(stand.statement_0 ?? ''), true)
    assert.match(preflightSql(), /schema_migrations/)
    assert.match(preflightSql(), new RegExp(REPAIR_VERSION))
    assert.match(preflightSql(), /commercial_write_runtime_gate/)
    assert.match(preflightSql(), /trip_item_commercial_provenance_schreiben/)
    assert.equal(afterProbeSql(), preflightSql())
  })

  test('falsche Version, Name, Count oder Marker-Hash stoppen', () => {
    const basis = erwartetesMarkerPreflight()
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'version', '20260829210052')), /Version/)
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'version_count', 2)), /nicht eindeutig/)
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'name', 'andere')), /Name ist nicht/)
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'statement_count', 2)), /statement_count/)
    assert.throws(
      () => preflightPasst(mitAbweichung(basis, 'statements_md5', REPAIR_SQL_MD5)),
      /Marker-MD5/,
    )
    assert.throws(
      () => preflightPasst(mitAbweichung(basis, 'statement_0', 'create table x (id int);')),
      /Prosa-Marker/,
    )
    assert.throws(() => preflightAusZeilen([]), /Preflight leer/)
  })

  test('Katalog-/Gate-/Rollen-/Funktions-Drift stoppt', () => {
    const basis = erwartetesMarkerPreflight()
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'table_exists', false)), /Tabelle\/OID/)
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'table_oid', 1)), /Tabelle\/OID/)
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'rls_enabled', false)), /RLS/)
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'rls_forced', true)), /RLS/)
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'row_count', 1)), /Rowcount/)
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'gate_allocated', true)), /Gate/)
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'gate_invoker', 'authenticated')), /Gate/)
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'writer_nologin', false)), /Rollen/)
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'runtime_inherit', true)), /Rollen/)
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'function_md5', 'deadbeef')), /Writer-Funktion/)
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'policy_name', 'andere')), /Policy/)
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'policy_qual', 'true')), /Policy/)
    assert.equal(basis.table_oid, REPAIR_TABLE_OID)
    assert.equal(basis.function_md5, REPAIR_FUNCTION_MD5)
    assert.equal(basis.table_acl, REPAIR_TABLE_ACL)
    assert.equal(basis.policy_count, 1)
    assert.equal(basis.policy_roles, REPAIR_POLICY_ROLES)
    assert.equal(basis.policy_qual, REPAIR_POLICY_QUAL_FINGERPRINT)
    assert.equal(basis.policy_with_check, null)
    assert.equal(basis.function_acl, REPAIR_FUNCTION_ACL)
    assert.equal(basis.function_config, REPAIR_FUNCTION_CONFIG)
    assert.equal(basis.writer_members, REPAIR_WRITER_MEMBERS)
    assert.equal(basis.runtime_members, REPAIR_RUNTIME_MEMBERS)
    assert.equal(basis.membership_count, REPAIR_MEMBERSHIP_COUNT)
    assert.equal(basis.role_memberships, REPAIR_ROLE_MEMBERSHIPS)
    assert.equal(basis.writer_createdb, false)
    assert.equal(basis.writer_createrole, false)
    assert.equal(basis.writer_replication, false)
    assert.equal(basis.writer_connlimit, REPAIR_ROLE_CONNLIMIT)
    assert.equal(basis.runtime_createdb, false)
    assert.equal(basis.runtime_createrole, false)
    assert.equal(basis.runtime_replication, false)
    assert.equal(basis.runtime_connlimit, REPAIR_ROLE_CONNLIMIT)
    assert.equal(basis.gate_note, REPAIR_GATE_NOTE)
  })

  test('zusätzliche Policy, Rollen, ACLs oder Funktions-Config stoppen', () => {
    const basis = erwartetesMarkerPreflight()
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'policy_count', 2)), /Policy-Count/)
    assert.throws(
      () => preflightPasst(mitAbweichung(basis, 'policy_roles', 'authenticated,service_role')),
      /Policy/,
    )
    assert.throws(
      () => preflightPasst(mitAbweichung(basis, 'policy_with_check', 'true')),
      /Policy/,
    )
    assert.throws(
      () =>
        preflightPasst(
          mitAbweichung(
            basis,
            'table_acl',
            'anon=r/postgres,authenticated=r/postgres,postgres=arwdDxtm/postgres',
          ),
        ),
      /Table-ACL/,
    )
    assert.throws(
      () =>
        preflightPasst(
          mitAbweichung(
            basis,
            'table_acl',
            'authenticated=r/postgres,postgres=arwdDxtm/postgres,service_role=arwdDxtm/postgres',
          ),
        ),
      /Table-ACL/,
    )
    assert.throws(
      () =>
        preflightPasst(
          mitAbweichung(
            basis,
            'function_acl',
            'jetnity_commercial_writer=X/postgres,postgres=X/postgres,service_role=X/postgres',
          ),
        ),
      /Writer-Funktion/,
    )
    assert.throws(
      () => preflightPasst(mitAbweichung(basis, 'function_config', 'search_path=public')),
      /Writer-Funktion/,
    )
    assert.throws(
      () =>
        preflightPasst(
          mitAbweichung(basis, 'writer_members', 'authenticated,jetnity_commercial_runtime,postgres'),
        ),
      /Rollen/,
    )
    assert.throws(
      () => preflightPasst(mitAbweichung(basis, 'runtime_members', 'authenticated,postgres')),
      /Rollen/,
    )
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'writer_super', true)), /Rollen/)
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'runtime_super', true)), /Rollen/)
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'writer_createdb', true)), /Rollen/)
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'writer_createrole', true)), /Rollen/)
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'writer_replication', true)), /Rollen/)
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'writer_connlimit', 1)), /Rollen/)
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'runtime_createdb', true)), /Rollen/)
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'runtime_createrole', true)), /Rollen/)
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'runtime_replication', true)), /Rollen/)
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'runtime_connlimit', 0)), /Rollen/)
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'membership_count', 4)), /Rollen/)
    assert.throws(
      () =>
        preflightPasst(
          mitAbweichung(
            basis,
            'role_memberships',
            'jetnity_commercial_runtime<-postgres/postgres/t/f/f,jetnity_commercial_writer<-jetnity_commercial_runtime/postgres/f/f/t,jetnity_commercial_writer<-postgres/supabase_admin/t/f/f',
          ),
        ),
      /Rollen/,
    )
    assert.throws(
      () =>
        preflightPasst(
          mitAbweichung(
            basis,
            'role_memberships',
            'jetnity_commercial_runtime<-postgres/supabase_admin/f/f/f,jetnity_commercial_writer<-jetnity_commercial_runtime/postgres/f/f/t,jetnity_commercial_writer<-postgres/supabase_admin/t/f/f',
          ),
        ),
      /Rollen/,
    )
    assert.throws(
      () =>
        preflightPasst(
          mitAbweichung(
            basis,
            'role_memberships',
            'jetnity_commercial_runtime<-postgres/supabase_admin/t/t/f,jetnity_commercial_writer<-jetnity_commercial_runtime/postgres/f/f/t,jetnity_commercial_writer<-postgres/supabase_admin/t/f/f',
          ),
        ),
      /Rollen/,
    )
    assert.throws(
      () =>
        preflightPasst(
          mitAbweichung(
            basis,
            'role_memberships',
            'jetnity_commercial_runtime<-postgres/supabase_admin/t/f/f,jetnity_commercial_writer<-jetnity_commercial_runtime/postgres/f/f/f,jetnity_commercial_writer<-postgres/supabase_admin/t/f/f',
          ),
        ),
      /Rollen/,
    )
    assert.throws(
      () =>
        preflightPasst(
          mitAbweichung(
            basis,
            'role_memberships',
            `${REPAIR_ROLE_MEMBERSHIPS},authenticated<-jetnity_commercial_runtime/postgres/f/f/t`,
          ),
        ),
      /Rollen/,
    )
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'gate_row_count', 2)), /Gate/)
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'gate_singleton', false)), /Gate/)
    assert.throws(() => preflightPasst(mitAbweichung(basis, 'gate_note', 'andere note')), /Gate/)
    assert.doesNotThrow(() =>
      preflightPasst(
        preflightAusZeilen({
          ...basis,
          table_acl: 'postgres=arwdDxtm/postgres,authenticated=r/postgres',
          writer_members: 'postgres,jetnity_commercial_runtime',
          policy_qual:
            'user_id = (select auth.uid()) and exists (select 1 from public.trip_items i where i.id = trip_item_commercial_provenance.trip_item_id and i.user_id = (select auth.uid()) and i.trip_id = trip_item_commercial_provenance.trip_id)',
        }),
      ),
    )
  })

  test('Policy- und Mengen-Fingerprints sind exakt und deterministisch', () => {
    const using = `
      user_id = (select auth.uid())
      and exists (
        select 1
        from public.trip_items i
        where i.id = trip_item_id
          and i.user_id = (select auth.uid())
          and i.trip_id = trip_item_commercial_provenance.trip_id
      )
    `
    assert.equal(policyQualFingerprint(using), REPAIR_POLICY_QUAL_FINGERPRINT)
    assert.equal(policyQualFingerprint(REPAIR_POLICY_QUAL_FINGERPRINT), REPAIR_POLICY_QUAL_FINGERPRINT)
    assert.equal(
      mengenFingerprint('postgres=arwdDxtm/postgres,authenticated=r/postgres'),
      REPAIR_TABLE_ACL,
    )
    assert.equal(
      mengenFingerprint('postgres,jetnity_commercial_runtime'),
      REPAIR_WRITER_MEMBERS,
    )
    assert.notEqual(policyQualFingerprint('true'), REPAIR_POLICY_QUAL_FINGERPRINT)
    assert.notEqual(mengenFingerprint('authenticated,service_role'), REPAIR_POLICY_ROLES)
  })
})

describe('Write-SQL ersetzt nur den History-Body', () => {
  test('UPDATE trifft nur supabase_migrations.schema_migrations.statements', () => {
    const datei = dateiLesenUndPruefen()
    const sql = writeTransactionSql(datei)
    writeSqlIstFailClosed(sql, datei)
    assert.equal(sql.startsWith('begin;'), true)
    assert.equal(sql.endsWith(';\n\ncommit;'), true)
    const rest = writeSqlOhneHistoryLiteral(sql, datei)
    assert.match(rest, /update\s+supabase_migrations\.schema_migrations\s+set\s+statements\s*=/i)
    assert.equal((rest.match(/\bupdate\s+supabase_migrations\.schema_migrations\b/gi) ?? []).length, 1)
    assert.doesNotMatch(
      rest,
      /update\s+supabase_migrations\.schema_migrations\s+set\s+name\b/i,
    )
    assert.match(rest, /if\s+_updated\s*<>\s*1/i)
    assert.match(rest, /get diagnostics/i)
    assert.match(rest, /Rollback/)
    assert.equal(sql.includes(historyStatementsArraySql(datei.sql)), true)
    assert.equal(sql.includes(sqlLiteral(REPAIR_VERSION)), true)
    assert.equal(sql.includes(sqlLiteral(REPAIR_NAME)), true)
    assert.equal(sql.includes(sqlLiteral(REPAIR_MARKER_MD5)), true)
  })

  test('ausführbarer Repair-Pfad enthält kein DDL und nicht die Repo-Migration', () => {
    const datei = dateiLesenUndPruefen()
    const rest = writeSqlOhneHistoryLiteral(writeTransactionSql(datei), datei)
    assert.doesNotMatch(rest, /\bcreate\s+table\b/i)
    assert.doesNotMatch(rest, /\bcreate\s+schema\b/i)
    assert.doesNotMatch(rest, /\bcreate\s+role\b/i)
    assert.doesNotMatch(rest, /\bcreate\s+policy\b/i)
    assert.doesNotMatch(rest, /\bcreate\s+(or\s+replace\s+)?function\b/i)
    assert.doesNotMatch(rest, /\balter\s+table\b/i)
    assert.doesNotMatch(rest, /\bgrant\s+(select|insert|update|delete|all|execute|usage|option|privileges)\b/i)
    assert.doesNotMatch(rest, /\brevoke\s+(select|insert|update|delete|all|execute|usage|option|privileges)\b/i)
    assert.doesNotMatch(rest, /has_table_privilege/)
    assert.doesNotMatch(rest, /has_function_privilege/)
    assert.match(rest, /Policy-Count ist nicht 1/)
    assert.match(rest, /Table-ACL weicht ab/)
    assert.match(rest, /polwithcheck is null/)
    assert.equal(rest.includes(sqlLiteral(REPAIR_TABLE_ACL)), true)
    assert.equal(rest.includes(sqlLiteral(REPAIR_FUNCTION_ACL)), true)
    assert.equal(rest.includes(sqlLiteral(REPAIR_FUNCTION_CONFIG)), true)
    assert.equal(rest.includes(sqlLiteral(REPAIR_POLICY_ROLES)), true)
    assert.equal(rest.includes(sqlLiteral(REPAIR_WRITER_MEMBERS)), true)
    assert.equal(rest.includes(sqlLiteral(REPAIR_RUNTIME_MEMBERS)), true)
    assert.equal(rest.includes(sqlLiteral(REPAIR_ROLE_MEMBERSHIPS)), true)
    assert.match(rest, /rolcreatedb/)
    assert.match(rest, /rolcreaterole/)
    assert.match(rest, /rolreplication/)
    assert.match(rest, /rolconnlimit/)
    assert.match(rest, /admin_option/)
    assert.match(rest, /inherit_option/)
    assert.match(rest, /set_option/)
    assert.equal(rest.includes(sqlLiteral(REPAIR_POLICY_QUAL_FINGERPRINT)), true)
    assert.equal(rest.includes(sqlLiteral(md5Hex(REPAIR_GATE_NOTE))), true)
    assert.equal((rest.match(/Repair preflight: Owner-SELECT-Policy weicht ab/g) ?? []).length, 1)
    assert.equal((rest.match(/Repair after-probe: Owner-SELECT-Policy weicht ab/g) ?? []).length, 1)
    assert.doesNotMatch(rest, /\binsert\s+into\b/i)
    assert.doesNotMatch(rest, /\bdelete\s+from\b/i)
    assert.doesNotMatch(rest, /migration repair/i)
    assert.equal(rest.includes(datei.sql.slice(0, 60)), false)
    assert.match(rest, /for update/)
  })

  test('fremde Version, Datei oder Blob ist fail-closed', () => {
    const datei = dateiLesenUndPruefen()
    assert.throws(
      () => writeTransactionSql({ ...datei, version: '20260829210052' }),
      /nur 20260829140000/,
    )
    assert.throws(() => writeTransactionSql({ ...datei, name: 'andere' }), /nur 20260829140000/)
    assert.throws(() => writeTransactionSql({ ...datei, datei: 'andere.sql' }), /nur 20260829140000/)
    assert.throws(() => writeTransactionSql({ ...datei, gitBlob: '0'.repeat(40) }), /kanonischen Blob/)
  })
})

describe('After-Probe prüft Body-Ersatz und unveränderten Katalog', () => {
  test('Katalogvergleich ignoriert den History-Body', () => {
    const datei = dateiLesenUndPruefen()
    const vorher = erwartetesMarkerPreflight()
    const nachher: HistoryRepairPreflight = {
      ...vorher,
      statements_md5: datei.md5,
      statement_0: datei.sql,
    }
    assert.equal(katalogUnveraendert(vorher, nachher), true)
    assert.equal(historyBodyRepariert(nachher, datei), true)
    assert.equal(katalogUnveraendert(vorher, { ...nachher, row_count: 1 }), false)
    assert.equal(katalogUnveraendert(vorher, { ...nachher, gate_allocated: true }), false)
    assert.equal(katalogUnveraendert(vorher, { ...nachher, function_md5: 'x' }), false)
    assert.equal(katalogUnveraendert(vorher, { ...nachher, policy_count: 2 }), false)
    assert.equal(
      katalogUnveraendert(vorher, { ...nachher, policy_roles: 'authenticated,service_role' }),
      false,
    )
    assert.equal(
      katalogUnveraendert(vorher, {
        ...nachher,
        table_acl: `${REPAIR_TABLE_ACL},anon=r/postgres`,
      }),
      false,
    )
    assert.equal(
      katalogUnveraendert(vorher, {
        ...nachher,
        function_acl: `${REPAIR_FUNCTION_ACL},service_role=X/postgres`,
      }),
      false,
    )
    assert.equal(
      katalogUnveraendert(vorher, {
        ...nachher,
        writer_members: `${REPAIR_WRITER_MEMBERS},authenticated`,
      }),
      false,
    )
    assert.equal(
      katalogUnveraendert(vorher, { ...nachher, function_config: 'search_path=public' }),
      false,
    )
    assert.equal(katalogUnveraendert(vorher, { ...nachher, writer_createrole: true }), false)
    assert.equal(katalogUnveraendert(vorher, { ...nachher, writer_connlimit: 10 }), false)
    assert.equal(katalogUnveraendert(vorher, { ...nachher, runtime_replication: true }), false)
    assert.equal(
      katalogUnveraendert(vorher, {
        ...nachher,
        role_memberships: REPAIR_ROLE_MEMBERSHIPS.replace('/t/f/f', '/f/f/f'),
      }),
      false,
    )
    assert.equal(historyBodyRepariert(vorher, datei), false)
    assert.equal(erstesAusfuehrbaresSql(nachher.statement_0 ?? ''), REPAIR_ERSTES_SQL)
  })
})

describe('Repair-Ausgabe darf keine Secrets enthalten', () => {
  test('JWT, sbp-Token, Connection-String und Access-Token sind verboten', () => {
    assert.doesNotThrow(() => keineSecrets('Lokale Probe fertig. Kein Datenbank-Write.'))
    assert.throws(() => keineSecrets('token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9xx'), /Secret/)
    assert.throws(() => keineSecrets('sbp_abcdefghijklmnopqrstuvwxyz012345'), /Secret/)
    assert.throws(() => keineSecrets('postgres://user:pass@host/db'), /Secret/)
    assert.throws(() => keineSecrets('SUPABASE_ACCESS_TOKEN=abc'), /Secret/)
  })

  test('CLI-Runner loggt Token nicht und bleibt default Probe', () => {
    const runner = readFileSync('scripts/db/migration-history-repair.ts', 'utf8')
    assert.match(runner, /Lokale Probe fertig/)
    assert.match(runner, /Kein Datenbank-Write/)
    assert.match(runner, /--schreiben --produktion --projekt-ref/)
    assert.match(runner, /keineSecrets/)
    assert.match(runner, /history-body-ersetzen/)
    assert.equal(runner.includes('SUPABASE_ACCESS_TOKEN'), false)
    assert.equal(runner.includes('process.env.SUPABASE_ACCESS_TOKEN'), false)
    assert.doesNotMatch(runner, /create table public\.trip_item_commercial_provenance/)
    assert.match(runner, /writeTransactionSql/)
    assert.match(runner, /Dieser Slice führt den Production-Write nicht selbst aus/)
  })
})
