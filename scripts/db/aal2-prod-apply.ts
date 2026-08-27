#!/usr/bin/env node
// Enger Einmal-Runner für 20260827170000_admin_aal2_data_plane_alignment.sql.
// Default: lokale Hash-/Blob-/SQL-Probe. Kein Datenbank-Write.
// Live-Preflight: --produktion --projekt-ref qscbgcdmivbbnzrcyegn
// Write:          --schreiben --produktion --projekt-ref qscbgcdmivbbnzrcyegn
// Development rollback-safe Probe: --entwicklung-probe
// Dieser Slice führt den Production-Apply nicht selbst aus.

import { advisors } from './advisors.mjs'
import { runSql } from './sql.mjs'
import { zielFuerAuftrag } from '../auth/ziel'
import {
  AAL2_ALIGN_DATEI,
  AAL2_ALIGN_VERSION,
  AAL2_FAIL_PATH_FUNKTION,
  AAL2_FAIL_PATH_NAME,
  AAL2_FAIL_PATH_VERSION,
  AAL2_PROD_PROJEKT_REF,
  aal2AuftragLesen,
  aal2DateiLesenUndPruefen,
  capabilityDefinitionSql,
  failPathHistorySql,
  failPathSql,
  historyStimmtMitDatei,
  migrationRollbackProbeSql,
  migrationTransactionSql,
  phase31GrenzeUnveraendert,
  preflightPasst,
  preflightSql,
  preflightStandAusZeilen,
  rlsSnapshotAusZeilen,
  rlsSnapshotSql,
  rlsSnapshotsGleich,
  verifyFinalContractSql,
  type Aal2PreflightStand,
  type RlsSnapshotZeile,
} from '@/lib/rollout/aal2-prod-apply'

function keineSecrets(text: string): void {
  if (/eyJ[A-Za-z0-9_-]{20,}/.test(text) || /sbp_[A-Za-z0-9]+/.test(text)) {
    throw new Error('Ausgabe würde ein Secret enthalten. Abgebrochen.')
  }
}

function log(zeile: string): void {
  keineSecrets(zeile)
  console.log(zeile)
}

async function preflightLesen(): Promise<Aal2PreflightStand> {
  const zeilen = (await runSql(preflightSql())) as Aal2PreflightStand[]
  return preflightStandAusZeilen(zeilen)
}

async function rlsSnapshotLesen(): Promise<RlsSnapshotZeile[]> {
  const zeilen = await runSql(rlsSnapshotSql())
  const snapshot = rlsSnapshotAusZeilen(zeilen as RlsSnapshotZeile[])
  if (snapshot.length === 0) {
    throw new Error('RLS-Preflight-Snapshot leer. Abgebrochen.')
  }
  return snapshot
}

async function capabilityDefinitionLesen(name: string): Promise<string> {
  const zeilen = (await runSql(capabilityDefinitionSql(name))) as { definition: string }[]
  const definition = zeilen[0]?.definition
  if (!definition) {
    throw new Error(`Capability-Definition ${name} nicht lesbar.`)
  }
  return definition
}

async function failPathHistoryLesen(): Promise<unknown> {
  return runSql(failPathHistorySql())
}

async function zielProduction(bestaetigterRef: string): Promise<void> {
  await zielFuerAuftrag({ modus: 'produktion', bestaetigterRef })
}

async function advisorsLesen(): Promise<void> {
  for (const typ of ['security', 'performance'] as const) {
    const roh = (await advisors(typ)) as { lints?: { level?: string; name?: string }[] }
    const lints = roh.lints ?? []
    const namen = [...new Set(lints.map((eintrag) => `${eintrag.level ?? '?'} ${eintrag.name ?? '?'}`))]
    log(`Advisors ${typ}: ${lints.length} Befunde (${namen.slice(0, 8).join('; ') || 'keine'})`)
  }
}

async function preflightLive(bestaetigterRef: string): Promise<Aal2PreflightStand> {
  await zielProduction(bestaetigterRef)
  const stand = await preflightLesen()
  preflightPasst(stand)
  log(
    `Preflight PASS. Head=${stand.head_version}_${stand.head_name}; ` +
      `${AAL2_ALIGN_VERSION} count=${stand.align_count}; ` +
      `aktuelles_admin_aal2=${stand.aal2_fn_exists}`,
  )
  return stand
}

async function applyProduktion(bestaetigterRef: string): Promise<void> {
  const datei = aal2DateiLesenUndPruefen()
  await preflightLive(bestaetigterRef)
  const snapshot = await rlsSnapshotLesen()
  try {
    await runSql(migrationTransactionSql(datei, snapshot))
  } catch (err) {
    const text = err instanceof Error ? err.message : String(err)
    keineSecrets(text)
    console.error('AAL2 Production-Apply FAIL. Transaktion nicht committed.')
    throw err
  }

  await runSql(verifyFinalContractSql(snapshot))
  const nachher = await rlsSnapshotLesen()
  if (!rlsSnapshotsGleich(snapshot, nachher)) {
    throw new Error('RLS-Snapshot nach Apply weicht vom Preflight ab. Abgebrochen.')
  }
  const history = (await runSql(
    `select version, name, statements
       from supabase_migrations.schema_migrations
      where version = '${AAL2_ALIGN_VERSION}'`,
  )) as { version: string; name: string; statements: string[] }[]
  const zeile = history[0]
  if (!zeile || !historyStimmtMitDatei(zeile, datei)) {
    throw new Error('History nach Apply ist nicht byte-identisch mit der Datei. Abgebrochen.')
  }
  log(`Verify PASS. History ${zeile.version}/${zeile.name} byte-identisch.`)
  await advisorsLesen()
  log('Advisors read-only erhoben. Keine weitere Migration nachgezogen.')
}

async function entwicklungProbe(): Promise<void> {
  await zielFuerAuftrag({ modus: 'entwicklung' })
  const datei = aal2DateiLesenUndPruefen()
  const snapshot = await rlsSnapshotLesen()
  const vorherFn = await capabilityDefinitionLesen(AAL2_FAIL_PATH_FUNKTION)
  const vorherHistory = JSON.stringify(await failPathHistoryLesen())
  const vorherAlign = JSON.stringify(
    await runSql(
      `select version, name from supabase_migrations.schema_migrations
        where version = '${AAL2_ALIGN_VERSION}'`,
    ),
  )

  const parseSql = migrationRollbackProbeSql(datei, snapshot)
  if (!parseSql.endsWith('\n\nrollback;')) {
    throw new Error('Parse-Probe endet nicht mit rollback;')
  }
  await runSql(parseSql)
  const nachParseFn = await capabilityDefinitionLesen(AAL2_FAIL_PATH_FUNKTION)
  const nachParseHistory = JSON.stringify(await failPathHistoryLesen())
  const nachParseAlign = JSON.stringify(
    await runSql(
      `select version, name from supabase_migrations.schema_migrations
        where version = '${AAL2_ALIGN_VERSION}'`,
    ),
  )
  if (nachParseFn !== vorherFn || nachParseHistory !== vorherHistory || nachParseAlign !== vorherAlign) {
    throw new Error('Parse-/Rollback-Probe hat Development-Zustand verändert.')
  }
  if (!rlsSnapshotsGleich(snapshot, await rlsSnapshotLesen())) {
    throw new Error('Parse-/Rollback-Probe hat RLS verändert.')
  }
  log('Development Parse-Probe PASS. Transaktion inkl. History+Verify rollback-safe.')

  try {
    await runSql(failPathSql())
    throw new Error('Fail-Path hätte fehlschlagen müssen.')
  } catch (err) {
    const text = err instanceof Error ? err.message : String(err)
    if (text.includes('hätte fehlschlagen müssen')) throw err
    if (!/AAL2 fail-path probe|P0001/i.test(text)) {
      keineSecrets(text)
      throw new Error(`Fail-Path-Fehler unerwartet: ${text}`)
    }
  }

  const nachherFn = await capabilityDefinitionLesen(AAL2_FAIL_PATH_FUNKTION)
  const nachherHistory = JSON.stringify(await failPathHistoryLesen())
  if (nachherFn !== vorherFn) {
    throw new Error('Fail-Path hat Capability-Definition hinterlassen.')
  }
  if (nachherHistory !== vorherHistory) {
    throw new Error('Fail-Path hat History hinterlassen.')
  }
  log(
    `Development Fail-Path PASS. ${AAL2_FAIL_PATH_FUNKTION} und History ` +
      `${AAL2_FAIL_PATH_VERSION}/${AAL2_FAIL_PATH_NAME} unverändert.`,
  )
}

function lokaleProbeSnapshot(): RlsSnapshotZeile[] {
  return [
    {
      nspname: 'public',
      relname: 'profiles',
      polname: 'profiles_lesen',
      qual: 'probe-only',
      with_check: null,
      cmd: 'r',
    },
  ]
}

async function main() {
  phase31GrenzeUnveraendert()
  const auftrag = aal2AuftragLesen(process.argv)
  const datei = aal2DateiLesenUndPruefen()
  log(`AAL2-Datei hash-identisch: sha256=${datei.sha256}`)
  log(`AAL2-Datei blob-identisch: git-blob=${datei.gitBlob}`)
  log(`Datei=${AAL2_ALIGN_DATEI} version=${datei.version} name=${datei.name}`)

  if (auftrag.modus === 'probe') {
    const transaktion = migrationTransactionSql(datei, lokaleProbeSnapshot())
    if (!transaktion.startsWith('begin;') || !transaktion.endsWith(';\n\ncommit;')) {
      throw new Error('Lokale Transaktionsprobe ist nicht atomar terminiert.')
    }
    if (!failPathSql().includes('create or replace function public.darf_betrieb_lesen()')) {
      throw new Error('Fail-Path-SQL mutiert keine Capability.')
    }
    log('Lokale Probe fertig. Kein Datenbank-Write. Production-Apply nicht ausgeführt.')
    return
  }

  if (auftrag.modus === 'entwicklung-probe') {
    await entwicklungProbe()
    log('Development-Probe fertig. Kein Production-Write.')
    return
  }

  log(`Ziel-Ref bestätigt: ${AAL2_PROD_PROJEKT_REF}`)
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
    console.error('AAL2-Apply-Gate fehlgeschlagen. Details unterdrückt, weil sie wie ein Secret aussehen.')
  }
  process.exit(1)
})
