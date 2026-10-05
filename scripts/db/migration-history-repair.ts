#!/usr/bin/env node
// Enger fail-closed Runner für den History-Body von 20260829140000.
// Default: lokale Blob-/Marker-/SQL-Probe. Kein Datenbank-Write.
// Live-Preflight: --produktion --projekt-ref qscbgcdmivbbnzrcyegn
// Write:          --schreiben --produktion --projekt-ref qscbgcdmivbbnzrcyegn --history-body-ersetzen
//
// Dieser Slice führt den Production-Write nicht selbst aus.
// Die Repo-Migration wird niemals gegen den Katalog ausgeführt.
// Development ist kein zulässiges Ziel.

import { runSql } from './sql.mjs'
import { zielFuerAuftrag } from '../auth/ziel'
import {
  REPAIR_DATEI,
  REPAIR_MARKER_MD5,
  REPAIR_PROD_PROJEKT_REF,
  REPAIR_SQL_MD5,
  afterProbeSql,
  auftragLesen,
  dateiLesenUndPruefen,
  erstesAusfuehrbaresSql,
  historyBodyRepariert,
  historyStatements,
  historyStatementsArraySql,
  katalogUnveraendert,
  keineSecrets,
  preflightAusZeilen,
  preflightPasst,
  preflightSql,
  writeSqlIstFailClosed,
  writeTransactionSql,
  type HistoryRepairPreflight,
} from '@/lib/rollout/migration-history-repair'

function log(zeile: string): void {
  keineSecrets(zeile)
  console.log(zeile)
}

async function preflightLesen(): Promise<HistoryRepairPreflight> {
  const zeilen = (await runSql(preflightSql())) as HistoryRepairPreflight[]
  return preflightAusZeilen(zeilen)
}

async function zielProduction(bestaetigterRef: string): Promise<void> {
  await zielFuerAuftrag({ modus: 'produktion', bestaetigterRef })
}

async function preflightLive(bestaetigterRef: string): Promise<HistoryRepairPreflight> {
  await zielProduction(bestaetigterRef)
  const stand = await preflightLesen()
  preflightPasst(stand)
  log(
    `Preflight PASS. version=${stand.version} name=${stand.name} ` +
      `count=${stand.statement_count} marker_md5=${stand.statements_md5} ` +
      `oid=${stand.table_oid} rows=${stand.row_count} gate=${stand.gate_allocated}`,
  )
  return stand
}

async function applyProduktion(bestaetigterRef: string): Promise<void> {
  const datei = dateiLesenUndPruefen()
  const vorher = await preflightLive(bestaetigterRef)
  const sql = writeTransactionSql(datei)
  writeSqlIstFailClosed(sql, datei)
  try {
    await runSql(sql)
  } catch (err) {
    const text = err instanceof Error ? err.message : String(err)
    keineSecrets(text)
    console.error('History-Repair Production-Write FAIL. Transaktion nicht committed.')
    throw err
  }

  const nachher = preflightAusZeilen((await runSql(afterProbeSql())) as HistoryRepairPreflight[])
  if (!katalogUnveraendert(vorher, nachher)) {
    throw new Error('After-Probe: Production-Katalog weicht vom Before-Image ab. Abgebrochen.')
  }
  if (!historyBodyRepariert(nachher, datei)) {
    throw new Error('After-Probe: History-Body ist nicht der kanonische Replay-Body. Abgebrochen.')
  }
  log(
    `Verify PASS. version=${nachher.version} name=${nachher.name} ` +
      `body_md5=${nachher.statements_md5} erstes=${erstesAusfuehrbaresSql(nachher.statement_0 ?? '')}`,
  )
}

async function main(): Promise<void> {
  const auftrag = auftragLesen(process.argv)
  const datei = dateiLesenUndPruefen()
  const statements = historyStatements(datei.sql)
  log(`Repair-Datei blob-identisch: git-blob=${datei.gitBlob}`)
  log(`Repair-Datei hash-identisch: sha256=${datei.sha256} md5=${datei.md5}`)
  log(`Datei=${REPAIR_DATEI} version=${datei.version} name=${datei.name}`)
  log(`History-Repräsentation: ${statements.length} Statement, array-literal deterministisch.`)
  log(`Erstes ausführbares SQL: ${erstesAusfuehrbaresSql(datei.sql)}`)
  log(`Marker-MD5 bleibt Before-Image: ${REPAIR_MARKER_MD5}`)
  log(`Ziel-Body-MD5 nach Repair: ${REPAIR_SQL_MD5}`)
  log(`array-literal prefix: ${historyStatementsArraySql(datei.sql).slice(0, 12)}`)

  const writeSql = writeTransactionSql(datei)
  writeSqlIstFailClosed(writeSql, datei)

  if (auftrag.modus === 'probe') {
    log('Lokale Probe fertig. Kein Datenbank-Write. Production-Repair nicht ausgeführt.')
    return
  }

  log(`Ziel-Ref bestätigt: ${REPAIR_PROD_PROJEKT_REF}`)
  if (auftrag.modus === 'preflight') {
    await preflightLive(auftrag.bestaetigterRef)
    log('Live-Preflight fertig. Kein Datenbank-Write.')
    return
  }

  await applyProduktion(auftrag.bestaetigterRef)
}

main().catch((err: unknown) => {
  const text = err instanceof Error ? err.message : String(err)
  try {
    keineSecrets(text)
    console.error(text)
  } catch {
    console.error('History-Repair-Gate fehlgeschlagen. Details unterdrückt, weil sie wie ein Secret aussehen.')
  }
  process.exit(1)
})
