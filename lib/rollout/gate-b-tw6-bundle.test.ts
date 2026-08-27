import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  GATE_B_DATEIEN,
  GATE_B_REIHENFOLGE,
  GATE_B_VERSIONEN,
  PRODUCTION_APPLY_BLOCK_TEXT,
  PRODUCTION_APPLY_FREIGEGEBEN,
  VERBOTENE_VERSIONEN,
  anwendenDarfGateBNichtEnthalten,
  failPathSql,
  gateBAuftragLesen,
  gateBDateienLesenUndPruefen,
  grantsStimmenMitSnapshot,
  historyInsertSql,
  historyStimmtMitDateien,
  migrationTransactionSql,
  productionApplyAblehnen,
  restoreGrantsSql,
  snapshotAusZeilen,
  verifyFinalContractSql,
  writeGateIstGeschlossen,
  writeGateSql,
  writeGateVerifySql,
} from '@/lib/rollout/gate-b-tw6-bundle'
import { sqlLiteral } from '@/lib/rollout/sql-literal'

const GATE_0B_HASHES = {
  '20260826220000_trip_day_stage_assignment_source.sql':
    'ab06e875e88f69b009837e1c8873e5322199da812b62f4ac1065a028f73cf883',
  '20260826230000_trip_day_stage_assignment_source_fail_closed.sql':
    '7e2e30246f1d9976b868751a6cc79087e537bbd36fb8f0dabf829b98258117a9',
  '20260826240000_trip_day_stage_assignment_mode.sql':
    '7a9626d8ac53ea3458bf7d622ea695cce26360962c02430d8d1a0094129a1edb',
  '20260827010000_reise_anlegen_zero_stage_fail_closed.sql':
    'b516bfff24e9e6f5dd909a9cfd4e76aa1a54708b067d1a5d3e935b8482c6adf1',
} as const

describe('Gate-B-Dateien bleiben byte-identisch mit dem Gate-0B-Vertrag', () => {
  test('SHA-256 der vier Dateien trifft den geprüften Stand', () => {
    const dateien = gateBDateienLesenUndPruefen()
    assert.equal(dateien.length, 4)
    assert.deepEqual([...GATE_B_REIHENFOLGE], [
      '20260826220000',
      '20260826230000',
      '20260826240000',
      '20260827010000',
    ])
    for (const datei of dateien) {
      const raw = readFileSync(`supabase/migrations/${datei.datei}`)
      const sha = createHash('sha256').update(raw).digest('hex')
      assert.equal(sha, datei.sha256)
      assert.equal(sha, GATE_0B_HASHES[datei.datei as keyof typeof GATE_0B_HASHES])
      assert.equal(datei.sql, raw.toString('utf8'))
    }
  })

  test('AAL2 bleibt ausgeschlossen', () => {
    assert.deepEqual([...VERBOTENE_VERSIONEN], ['20260826052735', '20260826090000'])
    assert.equal(GATE_B_VERSIONEN.has('20260826090000'), false)
    assert.equal(GATE_B_VERSIONEN.has('20260827010000'), true)
    assert.equal(GATE_B_DATEIEN.some((datei) => datei.datei.includes('aal2')), false)
  })
})

describe('Gate-B-Playbook-SQL', () => {
  test('Write-Gate sperrt EXECUTE und INSERT für authenticated', () => {
    const sql = writeGateSql()
    assert.match(sql, /revoke execute on function public\.reise_anlegen\(jsonb\) from authenticated/)
    assert.match(sql, /revoke insert on table public\.trips from authenticated/)
    assert.match(writeGateVerifySql(), /has_table_privilege\('authenticated', 'public\.trips', 'INSERT'\)/)
  })

  test('History-Insert speichert genau den Dateibody', () => {
    const [erste] = gateBDateienLesenUndPruefen()
    const insert = historyInsertSql(erste!)
    assert.match(insert, /insert into supabase_migrations\.schema_migrations \(version, name, statements\)/)
    assert.equal(insert.includes(sqlLiteral(erste!.sql)), true)
    assert.equal(insert.includes(sqlLiteral(erste!.version)), true)
    assert.equal(
      historyStimmtMitDateien({ version: erste!.version, statements: [erste!.sql] }, erste!),
      true,
    )
    assert.equal(
      historyStimmtMitDateien({ version: erste!.version, statements: [`${erste!.sql} `] }, erste!),
      false,
    )
  })

  test('eine Transaktion enthält alle vier Bodies, History, Re-REVOKE und Verify vor COMMIT', () => {
    const dateien = gateBDateienLesenUndPruefen()
    const sql = migrationTransactionSql(dateien)
    assert.equal(sql.startsWith('begin;'), true)
    assert.equal(sql.endsWith('commit;'), true)
    assert.ok(sql.indexOf(dateien[0]!.sql) < sql.indexOf(dateien[1]!.sql))
    assert.ok(sql.indexOf(dateien[1]!.sql) < sql.indexOf(dateien[2]!.sql))
    assert.ok(sql.indexOf(dateien[2]!.sql) < sql.indexOf(dateien[3]!.sql))
    assert.ok(sql.indexOf('20260826220000') < sql.indexOf('20260826230000'))
    assert.ok(sql.indexOf('20260826230000') < sql.indexOf('20260826240000'))
    assert.ok(sql.indexOf('20260826240000') < sql.indexOf('20260827010000'))
    const reRevoke = sql.lastIndexOf(writeGateSql())
    const verify = sql.indexOf(verifyFinalContractSql())
    const commit = sql.lastIndexOf('commit;')
    assert.ok(reRevoke > sql.indexOf(dateien[3]!.sql))
    assert.ok(verify > reRevoke)
    assert.ok(commit > verify)
    assert.match(verifyFinalContractSql(), /day_stage_assignment_mode/)
    assert.match(verifyFinalContractSql(), /trips_day_stage_assignment_mode_check/)
    assert.match(verifyFinalContractSql(), /proportionaler CTE/)
    assert.match(verifyFinalContractSql(), /legacy_fallback neu minten/)
    assert.match(verifyFinalContractSql(), /0-Stage fail-closed/)
    assert.match(verifyFinalContractSql(), /alter <=1-Pfad/)
    assert.match(verifyFinalContractSql(), /vier Gate-B-Versionen/)
    assert.match(verifyFinalContractSql(), /Commercial-Gate-A-Nullung/)
    assert.match(verifyFinalContractSql(), /trip_items_flug_handelsfelder_schuetzen/)
  })

  test('drei Dateien oder falsche Reihenfolge sind fail-closed', () => {
    const dateien = gateBDateienLesenUndPruefen()
    assert.throws(() => migrationTransactionSql(dateien.slice(0, 3)), /genau die vier/)
    assert.throws(
      () => migrationTransactionSql([dateien[0]!, dateien[1]!, dateien[3]!, dateien[2]!]),
      /26220000 → 26230000 → 26240000 → 27010000/,
    )
  })

  test('26220000 und 26230000 enthalten den proportionalen CTE, 26240000 und 27010000 nicht', () => {
    const dateien = gateBDateienLesenUndPruefen()
    const cte = 'greatest(1, ceil(t.nr::numeric * e.anzahl / greatest(t.anzahl, 1)))'
    assert.equal(dateien[0]!.sql.includes(cte), true)
    assert.equal(dateien[1]!.sql.includes(cte), true)
    assert.equal(dateien[2]!.sql.includes(cte), false)
    assert.equal(dateien[3]!.sql.includes(cte), false)
    assert.match(dateien[2]!.sql, /_assignment_mode := 'single_destination'/)
    assert.equal(dateien[2]!.sql.includes("_assignment_mode := 'legacy_fallback'"), false)
    assert.match(dateien[3]!.sql, /if _stage_count < 1 then/)
    assert.match(dateien[3]!.sql, /elsif _stage_count = 1 then/)
    assert.equal(dateien[3]!.sql.includes('_stage_count <= 1 then'), false)
    assert.equal(dateien[3]!.sql.includes("_assignment_mode := 'legacy_fallback'"), false)
    assert.match(dateien[3]!.sql, /when coalesce\(nullif\(p\.wert ->> 'kind', ''\), 'note'\) = 'flight' then null/)
  })

  test('Grant-Restore wiederholt genau den Snapshot', () => {
    const snapshot = snapshotAusZeilen({
      auth_trips_insert: true,
      auth_rpc: true,
      anon_trips_insert: false,
      anon_rpc: false,
    })
    const sql = restoreGrantsSql(snapshot)
    assert.match(sql, /grant insert on table public\.trips to authenticated/)
    assert.match(sql, /grant execute on function public\.reise_anlegen\(jsonb\) to authenticated/)
    assert.match(sql, /revoke insert on table public\.trips from anon/)
    assert.equal(writeGateIstGeschlossen(snapshot), false)
    assert.equal(
      writeGateIstGeschlossen({
        auth_trips_insert: false,
        auth_rpc: false,
        anon_trips_insert: false,
        anon_rpc: false,
      }),
      true,
    )
    assert.equal(grantsStimmenMitSnapshot(snapshot, snapshot), true)
  })

  test('Fail-Path-SQL würde eine bereits vorhandene Version nicht vortäuschen', () => {
    assert.match(failPathSql(), /begin;/)
    assert.match(failPathSql(), /20260826240000/)
    assert.match(failPathSql(), /should_not_commit/)
  })
})

describe('Gate-B-Auftrag und Production-Block', () => {
  test('ohne Flags bleibt die Probe lokal', () => {
    assert.deepEqual(gateBAuftragLesen([]), { modus: 'probe', ziel: 'lokal' })
    assert.deepEqual(gateBAuftragLesen(['--entwicklung']), { modus: 'probe', ziel: 'entwicklung' })
  })

  test('Development-Schreiben braucht genau einen Testpfad', () => {
    assert.deepEqual(gateBAuftragLesen(['--schreiben', '--entwicklung', '--write-gate-roundtrip']), {
      modus: 'write-gate-roundtrip',
    })
    assert.deepEqual(gateBAuftragLesen(['--schreiben', '--entwicklung', '--fail-path']), {
      modus: 'fail-path',
    })
    assert.deepEqual(gateBAuftragLesen(['--schreiben', '--entwicklung', '--apply']), {
      modus: 'apply',
      ziel: 'entwicklung',
    })
    assert.throws(
      () => gateBAuftragLesen(['--schreiben', '--entwicklung']),
      /genau eines/,
    )
  })

  test('Production bleibt unabhängig von Flags blockiert', () => {
    assert.equal(PRODUCTION_APPLY_FREIGEGEBEN, false)
    assert.deepEqual(
      gateBAuftragLesen(['--schreiben', '--produktion', '--projekt-ref', 'qscbgcdmivbbnzrcyegn']),
      { modus: 'produktion-blockiert' },
    )
    assert.throws(() => productionApplyAblehnen(), new RegExp(PRODUCTION_APPLY_BLOCK_TEXT))
    assert.throws(
      () => gateBAuftragLesen(['--produktion']),
      /bleibt trotzdem blockiert/,
    )
  })

  test('db:anwenden darf das Bundle nicht dateiweise anfassen', () => {
    assert.throws(
      () =>
        anwendenDarfGateBNichtEnthalten([
          { version: '20260826220000', datei: '20260826220000_trip_day_stage_assignment_source.sql' },
        ]),
      /nicht dateiweise/,
    )
    assert.throws(
      () =>
        anwendenDarfGateBNichtEnthalten([
          { version: '20260827010000', datei: '20260827010000_reise_anlegen_zero_stage_fail_closed.sql' },
        ]),
      /nicht dateiweise/,
    )
    anwendenDarfGateBNichtEnthalten([
      { version: '20260824180000', datei: '20260824180000_trip_items_flug_handelsfelder_guard.sql' },
    ])
  })
})
