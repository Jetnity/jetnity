#!/usr/bin/env node
// Bounded Gate-B-Playbook für 20260826220000/230000/240000/27010000.
// Default: lokale Hash-/SQL-Probe. Development-Schreiben nur explizit.
// Production-Apply ist in diesem Slice hart blockiert.

import { ziel } from '../auth/ziel'
import { runSql } from './sql.mjs'
import {
  failPathSql,
  gateBAuftragLesen,
  gateBDateienLesenUndPruefen,
  grantSnapshotSql,
  grantsStimmenMitSnapshot,
  historyStimmtMitDateien,
  migrationTransactionSql,
  productionApplyAblehnen,
  restoreGrantsSql,
  snapshotAusZeilen,
  verifyFinalContractSql,
  writeGateIstGeschlossen,
  writeGateSql,
  writeGateVerifySql,
  type GrantSnapshot,
} from '@/lib/rollout/gate-b-tw6-bundle'

async function grantsLesen(): Promise<GrantSnapshot> {
  return snapshotAusZeilen((await runSql(grantSnapshotSql())) as GrantSnapshot[])
}

async function writeGateSetzenUndPruefen(): Promise<void> {
  await runSql(writeGateSql())
  const stand = await grantsLesen()
  if (!writeGateIstGeschlossen(stand)) {
    throw new Error(
      `Write-Gate nicht geschlossen: auth_insert=${stand.auth_trips_insert} auth_rpc=${stand.auth_rpc}`,
    )
  }
}

async function grantsWiederherstellen(snapshot: GrantSnapshot): Promise<void> {
  await runSql(restoreGrantsSql(snapshot))
  const stand = await grantsLesen()
  if (!grantsStimmenMitSnapshot(stand, snapshot)) {
    throw new Error(
      `Grants nach Restore nicht identisch. ` +
        `jetzt insert=${stand.auth_trips_insert} rpc=${stand.auth_rpc}; ` +
        `erwartet insert=${snapshot.auth_trips_insert} rpc=${snapshot.auth_rpc}`,
    )
  }
}

async function probeEntwicklung(): Promise<void> {
  await ziel()
  const dateien = gateBDateienLesenUndPruefen()
  const history = (await runSql(
    `select version, name, statements
       from supabase_migrations.schema_migrations
      where version in ('20260826220000','20260826230000','20260826240000','20260827010000')
      order by version`,
  )) as { version: string; name: string; statements: string[] }[]

  console.log(`Development-History: ${history.length} Gate-B-Versionen`)
  for (const datei of dateien) {
    const row = history.find((eintrag) => eintrag.version === datei.version)
    if (!row) {
      console.log(`  ${datei.version}: fehlt auf Development`)
      continue
    }
    const ok = historyStimmtMitDateien(row, datei)
    console.log(`  ${datei.version}: ${ok ? 'hash-identisch mit Datei' : 'WEICHT VON DATEI AB'}`)
    if (!ok) {
      throw new Error(`${datei.datei}: gespeicherte History ist nicht byte-identisch.`)
    }
  }

  const grants = await grantsLesen()
  console.log(
    `Grants: authenticated INSERT=${grants.auth_trips_insert} EXECUTE=${grants.auth_rpc}; ` +
      `anon INSERT=${grants.anon_trips_insert} EXECUTE=${grants.anon_rpc}`,
  )
  await runSql(verifyFinalContractSql())
  console.log('Finaler Vier-Datei-Mode-Vertrag auf Development: PASS')
}

async function writeGateRoundtrip(): Promise<void> {
  await ziel()
  const snapshot = await grantsLesen()
  console.log(
    `Snapshot: authenticated INSERT=${snapshot.auth_trips_insert} EXECUTE=${snapshot.auth_rpc}`,
  )
  try {
    await writeGateSetzenUndPruefen()
    console.log('Write-Gate committed und verifiziert (geschlossen).')
  } finally {
    await grantsWiederherstellen(snapshot)
    console.log('Grants exakt wiederhergestellt.')
  }
}

async function failPath(): Promise<void> {
  await ziel()
  const snapshot = await grantsLesen()
  try {
    await writeGateSetzenUndPruefen()
    console.log('Write-Gate committed und verifiziert.')
    try {
      await runSql(failPathSql())
      throw new Error('Fail-Path hat unerwartet committed.')
    } catch (err) {
      const text = err instanceof Error ? err.message : String(err)
      if (text.includes('Fail-Path hat unerwartet committed')) throw err
      console.log('Migrationstransaktion fehlgeschlagen wie erwartet.')
    }
    const nachFehler = await grantsLesen()
    if (!writeGateIstGeschlossen(nachFehler)) {
      throw new Error('Write-Gate war nach ROLLBACK nicht mehr geschlossen.')
    }
    console.log('Write-Gate blieb nach ROLLBACK geschlossen.')
  } finally {
    await grantsWiederherstellen(snapshot)
    console.log('Testhinweis: Playbook würde Grants nach FAIL nicht öffnen. Test stellt sie wieder her.')
  }
}

async function applyEntwicklung(): Promise<void> {
  await ziel()
  const dateien = gateBDateienLesenUndPruefen()
  const vorhanden = (await runSql(
    `select version from supabase_migrations.schema_migrations
      where version in ('20260826220000','20260826230000','20260826240000','20260827010000')`,
  )) as { version: string }[]
  if (vorhanden.length > 0) {
    throw new Error(
      `Development hat Gate-B bereits (${vorhanden.map((row) => row.version).join(', ')}). ` +
        'Kein erneutes Apply. Kein Write-Gate gesetzt.',
    )
  }
  const snapshot = await grantsLesen()
  await writeGateSetzenUndPruefen()
  try {
    await runSql(migrationTransactionSql(dateien))
    await runSql(verifyFinalContractSql())
    await grantsWiederherstellen(snapshot)
    console.log('Development-Apply PASS. Grants wiederhergestellt.')
  } catch (err) {
    console.error('Development-Apply FAIL. Write-Gate bleibt geschlossen.')
    throw err
  }
}

async function main() {
  const auftrag = gateBAuftragLesen(process.argv)
  const dateien = gateBDateienLesenUndPruefen()
  console.log('Gate-B-Dateien hash-identisch mit dem Gate-0B-Vier-Datei-Vertrag:')
  for (const datei of dateien) {
    console.log(`  ${datei.sha256}  ${datei.datei}`)
  }

  if (auftrag.modus === 'produktion-blockiert') {
    productionApplyAblehnen()
  }
  if (auftrag.modus === 'probe' && auftrag.ziel === 'lokal') {
    console.log('Lokale Probe fertig. Kein Datenbank-Write.')
    return
  }
  if (auftrag.modus === 'probe') {
    await probeEntwicklung()
    return
  }
  if (auftrag.modus === 'write-gate-roundtrip') {
    await writeGateRoundtrip()
    return
  }
  if (auftrag.modus === 'fail-path') {
    await failPath()
    return
  }
  await applyEntwicklung()
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
