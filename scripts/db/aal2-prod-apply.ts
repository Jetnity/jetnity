#!/usr/bin/env node
// Enger Einmal-Runner für 20260827170000_admin_aal2_data_plane_alignment.sql.
// Default: lokale Hash-/Blob-/SQL-Probe. Kein Datenbank-Write.
// Live-Preflight: --produktion --projekt-ref qscbgcdmivbbnzrcyegn
// Write:          --schreiben --produktion --projekt-ref qscbgcdmivbbnzrcyegn
// Dieser Slice führt den Production-Apply nicht selbst aus.

import { advisors } from './advisors.mjs'
import { runSql } from './sql.mjs'
import { zielFuerAuftrag } from '../auth/ziel'
import {
  AAL2_ALIGN_DATEI,
  AAL2_ALIGN_VERSION,
  AAL2_PROD_PROJEKT_REF,
  aal2AuftragLesen,
  aal2DateiLesenUndPruefen,
  failPathSql,
  historyStimmtMitDatei,
  migrationTransactionSql,
  phase31GrenzeUnveraendert,
  preflightPasst,
  preflightSql,
  preflightStandAusZeilen,
  verifyFinalContractSql,
  type Aal2PreflightStand,
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
  try {
    await runSql(migrationTransactionSql(datei))
  } catch (err) {
    const text = err instanceof Error ? err.message : String(err)
    keineSecrets(text)
    console.error('AAL2 Production-Apply FAIL. Transaktion nicht committed.')
    throw err
  }

  await runSql(verifyFinalContractSql())
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

async function main() {
  phase31GrenzeUnveraendert()
  const auftrag = aal2AuftragLesen(process.argv)
  const datei = aal2DateiLesenUndPruefen()
  log(`AAL2-Datei hash-identisch: sha256=${datei.sha256}`)
  log(`AAL2-Datei blob-identisch: git-blob=${datei.gitBlob}`)
  log(`Datei=${AAL2_ALIGN_DATEI} version=${datei.version} name=${datei.name}`)

  if (auftrag.modus === 'probe') {
    const transaktion = migrationTransactionSql(datei)
    if (!transaktion.startsWith('begin;') || !transaktion.endsWith('commit;')) {
      throw new Error('Lokale Transaktionsprobe ist nicht atomar.')
    }
    if (!failPathSql().includes('should_not_commit')) {
      throw new Error('Fail-Path-SQL fehlt.')
    }
    log('Lokale Probe fertig. Kein Datenbank-Write. Production-Apply nicht ausgeführt.')
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
