#!/usr/bin/env node
// Spielt noch nicht angewendete Migrationen auf das bestätigte Ziel.
//
// Default: Development-Branch (`ziel()`). Production nur mit
// --produktion --projekt-ref <exakter Ref> --bis 20260820130000,
// nachdem die Management API bestätigt hat, dass das Ziel ein
// eigenständiges Projekt ist. Spätere Migrationen laufen nicht mit.

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { anwendenDarfAal2AlignmentNichtAufProduction } from '@/lib/rollout/aal2-prod-apply'
import { produktionsPlan } from '@/lib/rollout/anwenden-grenze'
import { GATE_B_VERSIONEN } from '@/lib/rollout/gate-b-tw6-bundle'
import { anwendenAuftragLesen } from '@/lib/rollout/schreibauftrag'
import { sqlLiteral } from '@/lib/rollout/sql-literal'
import { zielFuerAuftrag } from '../auth/ziel'
import { runSql } from './sql.mjs'

const MIGRATIONS_DIR = new URL('../../supabase/migrations/', import.meta.url).pathname

function alleMigrationen() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((datei) => {
      const [version, ...rest] = datei.replace(/\.sql$/, '').split('_')
      return { datei, version, name: rest.join('_') || 'migration' }
    })
}

async function angewendeteVersionen() {
  const rows = (await runSql('select version from supabase_migrations.schema_migrations')) as {
    version: string
  }[]
  return new Set(rows.map((r) => r.version))
}

async function main() {
  const auftrag = anwendenAuftragLesen(process.argv)
  await zielFuerAuftrag(auftrag)
  console.log(`Ziel: ${auftrag.modus}`)

  const nurProbe = process.argv.includes('--probe')
  const angewendet = await angewendeteVersionen()
  const alle = alleMigrationen()
  const offen =
    auftrag.modus === 'produktion'
      ? (() => {
          const plan = produktionsPlan({
            angewendet: [...angewendet],
            alle,
            bis: auftrag.bis,
          })
          if (plan.spaeterAusgeschlossen.length > 0) {
            console.log(
              `Ausserhalb der Phase-3.1-Grenze, nicht angewendet: ${plan.spaeterAusgeschlossen
                .map((m) => m.datei)
                .join(', ')}`,
            )
          }
          return plan.offen
        })()
      : alle.filter((m) => !angewendet.has(m.version))

  const gateBOffen = offen.filter((m) => GATE_B_VERSIONEN.has(m.version))
  if (gateBOffen.length > 0) {
    throw new Error(
      `Gate-B-Bundle (${gateBOffen.map((m) => m.datei).join(', ')}) darf nicht dateiweise über db:anwenden laufen. ` +
        'Die Dateien 26220000/26230000/26240000/27010000 dürfen nicht dateiweise öffentlich executable werden. ' +
        'Nutze npm run db:gate-b-tw6-bundle. Abgebrochen.',
    )
  }
  anwendenDarfAal2AlignmentNichtAufProduction(auftrag.modus, offen)

  if (offen.length === 0) {
    console.log(
      auftrag.modus === 'produktion'
        ? 'Nichts offen innerhalb der Phase-3.1-Grenze.'
        : 'Nichts offen – der Branch entspricht den Migrationen im Repository.',
    )
    return
  }

  console.log(`Offen: ${offen.map((m) => m.datei).join(', ')}`)
  if (nurProbe) return

  for (const m of offen) {
    const sql = readFileSync(join(MIGRATIONS_DIR, m.datei), 'utf8')
    const eintrag = `insert into supabase_migrations.schema_migrations (version, name, statements)
                     values (${sqlLiteral(m.version)}, ${sqlLiteral(m.name)}, array[${sqlLiteral(sql)}])`

    process.stdout.write(`  ${m.datei} … `)
    try {
      await runSql(['begin;', sql, ';', eintrag, ';', 'commit;'].join('\n'))
      console.log('angewendet')
    } catch (err) {
      console.log('FEHLGESCHLAGEN')
      console.error(err instanceof Error ? err.message : err)
      process.exit(1)
    }
  }

  console.log('Fertig.')
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
