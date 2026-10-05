#!/usr/bin/env node
// Read-only Prüfung eines Airport-/Places-Rollouts.
// Nur SELECT gegen Metadaten und Bestand. Kein mutierender HTTP- oder SQL-Pfad.
//
//   npm run production:pruefen -- --entwicklung
//   npm run production:pruefen -- --produktion --projekt-ref <Ref>
//   npm run production:pruefen -- --produktion --projekt-ref <Ref> --vorab

import { AIRPORT_PFLICHT, AIRPORT_PFLICHT_ODER, ORT_FANTASIE, ORT_PFLICHT, ORT_PFLICHT_KEYWORD, rolloutBefund, vorabBefund, type RolloutBeobachtung } from '@/lib/rollout/befund'
import { rechteAusMetadaten } from '@/lib/rollout/rechte'
import { pruefenAuftragLesen } from '@/lib/rollout/schreibauftrag'
import { zielFuerAuftrag } from '../auth/ziel'
import { runSql } from './sql.mjs'

function sqlText(wert: string): string {
  return `'${wert.replaceAll("'", "''")}'`
}

async function spalteDa(tabelle: string, spalte: string): Promise<boolean> {
  const zeilen = (await runSql(
    `select 1 as da
       from information_schema.columns
      where table_schema = 'public'
        and table_name = ${sqlText(tabelle)}
        and column_name = ${sqlText(spalte)}
      limit 1`,
  )) as { da: number }[]
  return zeilen.length > 0
}

async function tabelleDa(tabelle: string): Promise<boolean> {
  const zeilen = (await runSql(
    `select 1 as da
       from information_schema.tables
      where table_schema = 'public'
        and table_name = ${sqlText(tabelle)}
      limit 1`,
  )) as { da: number }[]
  return zeilen.length > 0
}

async function anzahl(tabelle: string): Promise<number | null> {
  if (!(await tabelleDa(tabelle))) return null
  const zeilen = (await runSql(`select count(*)::int as n from public.${tabelle}`)) as { n: number }[]
  return zeilen[0]?.n ?? 0
}

async function placesRechte(): Promise<{ lesen: boolean | null; schreiben: boolean | null }> {
  if (!(await tabelleDa('places'))) return { lesen: null, schreiben: null }

  const rls = (await runSql(
    `select c.relrowsecurity as aktiv
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = 'places'
        and c.relkind = 'r'`,
  )) as { aktiv: boolean }[]

  const rechte = (await runSql(
    `select grantee as rolle, privilege_type as privileg
       from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name = 'places'
        and grantee in ('anon', 'authenticated', 'PUBLIC')`,
  )) as { rolle: string; privileg: string }[]

  const policies = (await runSql(
    `select policyname as name, cmd, roles
       from pg_policies
      where schemaname = 'public'
        and tablename = 'places'`,
  )) as { name: string; cmd: string; roles: string[] | string }[]

  const rollenAus = (wert: string[] | string | null | undefined): string[] => {
    if (Array.isArray(wert)) return wert.map(String)
    if (typeof wert === 'string') {
      return wert
        .replace(/[{}]/g, '')
        .split(',')
        .map((teil) => teil.trim())
        .filter(Boolean)
    }
    return []
  }

  const befund = rechteAusMetadaten({
    rlsAktiv: rls[0]?.aktiv === true,
    rechte,
    policies: policies.map((zeile) => ({
      name: zeile.name,
      cmd: zeile.cmd,
      rollen: rollenAus(zeile.roles),
    })),
  })
  return { lesen: befund.lesen, schreiben: befund.schreiben }
}

async function beobachten(): Promise<RolloutBeobachtung> {
  const placesExistiert = await tabelleDa('places')
  const originPlaceIdExistiert = await spalteDa('trips', 'origin_place_id')
  const stagePlaceIdExistiert = await spalteDa('trip_stages', 'place_id')
  const airportAnzahl = await anzahl('airports')
  const placeAnzahl = placesExistiert ? await anzahl('places') : null

  const pflichtCodes = [...AIRPORT_PFLICHT, ...AIRPORT_PFLICHT_ODER.flat()]
  const airportZeilen = (await runSql(
    `select iata from public.airports where iata in (${pflichtCodes.map(sqlText).join(', ')})`,
  )) as { iata: string }[]
  const airportDa = new Set(airportZeilen.map((zeile) => zeile.iata))

  const ortPflicht = placesExistiert
    ? ((await runSql(
        `select distinct name from public.places where name in (${ORT_PFLICHT.map(sqlText).join(', ')})`,
      )) as { name: string }[]).map((zeile) => zeile.name)
    : []

  const ortKeyword = placesExistiert
    ? ((await runSql(
        `select distinct 'Südtirol' as name from public.places
          where keywords ilike '%Südtirol%' or name ilike '%South Tyrol%'
          limit 1`,
      )) as { name: string }[]).map((zeile) => zeile.name)
    : []

  const fantasieTreffer: string[] = []
  if (placesExistiert) {
    for (const name of ORT_FANTASIE) {
      const treffer = (await runSql(
        `select name from public.places
          where lower(name) = lower(${sqlText(name)})
          limit 1`,
      )) as { name: string }[]
      if (treffer.length > 0) fantasieTreffer.push(name)
    }
  }

  const constraint = (await runSql(
    `select count(*)::int as n from public.airports
      where (iata is not null and iata !~ '^[A-Z]{3}$')
         or (icao is not null and icao !~ '^[A-Z0-9]{4}$')
         or (lat is not null and (lat < -90 or lat > 90))
         or (lon is not null and (lon < -180 or lon > 180))`,
  )) as { n: number }[]

  let reisenOhnePlaceId: number | null = null
  let reisenLesbar: boolean | null = null
  if (originPlaceIdExistiert) {
    try {
      const zeilen = (await runSql(
        `select id, origin, origin_place_id from public.trips limit 20`,
      )) as { id: string; origin: string | null; origin_place_id: string | null }[]
      reisenLesbar = true
      reisenOhnePlaceId = zeilen.filter((zeile) => zeile.origin_place_id == null).length
    } catch {
      reisenLesbar = false
    }
  }

  const rechte = await placesRechte()

  return {
    placesExistiert,
    originPlaceIdExistiert,
    stagePlaceIdExistiert,
    airportAnzahl,
    placeAnzahl,
    airportPflicht: AIRPORT_PFLICHT.filter((code) => airportDa.has(code)),
    airportOder: AIRPORT_PFLICHT_ODER.flat().filter((code) => airportDa.has(code)),
    ortPflicht,
    ortKeyword,
    fantasieTreffer,
    airportConstraintVerletzungen: constraint[0]?.n ?? 0,
    anonKannLesen: rechte.lesen,
    anonKannSchreiben: rechte.schreiben,
    reisenOhnePlaceId,
    reisenLesbar,
  }
}

async function main() {
  const auftrag = pruefenAuftragLesen(process.argv)
  await zielFuerAuftrag(auftrag)
  console.log(`Ziel: ${auftrag.modus}`)
  console.log('Read-only – nur Metadaten und Bestand, kein Schreibversuch.')

  const beobachtung = await beobachten()
  const vorab = process.argv.includes('--vorab')
  const befund = vorab ? vorabBefund(beobachtung) : rolloutBefund(beobachtung)
  if (vorab) console.log('Modus: Vorab (Constraints und Kill Switches, Places dürfen fehlen).')

  for (const punkt of befund.punkte) {
    console.log(`${punkt.ok ? 'ok' : 'FEHLER'}  ${punkt.name} – ${punkt.detail}`)
  }

  if (!befund.ok) {
    console.error(vorab ? 'Vorab-Check nicht erfüllt.' : 'Production-Check nicht erfüllt.')
    process.exit(1)
  }
  console.log(vorab ? 'Vorab-Check erfüllt.' : 'Production-Check erfüllt.')
}

main().catch((err: unknown) => {
  const meldung = err instanceof Error ? err.message : 'Prüfung fehlgeschlagen.'
  console.error(meldung)
  process.exit(1)
})
