#!/usr/bin/env node
// Stimmen Tabellenrechte und Policies überein?
//
// Seit Phase 1.4 gilt für das Schema `public` eine einzige Regel:
//
//   `anon` oder `authenticated` hat ein Recht auf einer Tabelle genau dann,
//   wenn für dieselbe Rolle und dieselbe Operation eine Policy existiert.
//
// Beide Richtungen sind Fehler, und zwar verschiedene:
//
//   · Recht ohne Policy – RLS lässt nichts durch, die Tabelle taucht aber im
//     GraphQL-Schema auf und ist über die Schnittstelle sichtbar. Die
//     Advisors melden das als `pg_graphql_anon_table_exposed`.
//   · Policy ohne Recht – die Policy sieht aus, als erlaube sie etwas, und
//     wirkt nie. Wer sie liest, zieht den falschen Schluss.
//
// Zusätzlich geprüft: kein TRUNCATE, kein REFERENCES, kein TRIGGER. Diese
// Rechte kennt RLS nicht; TRUNCATE leert eine Tabelle unabhängig von jeder
// Policy.
//
// Aufruf:
//   npm run db:rechte

import { runSql } from './sql.mjs'

const ROLLEN = ['anon', 'authenticated']
const OPERATIONEN = ['SELECT', 'INSERT', 'UPDATE', 'DELETE']
const VERBOTEN = ['TRUNCATE', 'REFERENCES', 'TRIGGER']

async function erhebe() {
  const [rechte, policies, ohneRls] = await Promise.all([
    runSql(`
      select table_name as tabelle, grantee as rolle, privilege_type as recht
      from information_schema.role_table_grants
      where table_schema = 'public' and grantee in ('anon', 'authenticated')`),
    runSql(`
      select tablename as tabelle, unnest(roles)::text as rolle, cmd
      from pg_policies where schemaname = 'public'`),
    runSql(`
      select relname as tabelle
      from pg_class
      where relnamespace = 'public'::regnamespace and relkind = 'r' and not relrowsecurity`),
  ])
  return { rechte, policies, ohneRls }
}

/** Welche Operationen deckt eine Policy ab? */
function operationenVon(cmd) {
  return cmd === 'ALL' ? OPERATIONEN : [cmd]
}

export async function pruefe() {
  const { rechte, policies, ohneRls } = await erhebe()

  const erlaubtLautPolicy = new Set()
  for (const p of policies) {
    if (!ROLLEN.includes(p.rolle)) continue
    for (const op of operationenVon(p.cmd)) erlaubtLautPolicy.add(`${p.tabelle}|${p.rolle}|${op}`)
  }

  const vergeben = new Set()
  const befunde = []

  for (const r of rechte) {
    if (VERBOTEN.includes(r.recht)) {
      befunde.push({
        art: 'verbotenes Recht',
        text: `${r.rolle} hat ${r.recht} auf ${r.tabelle}`,
      })
      continue
    }
    if (!OPERATIONEN.includes(r.recht)) continue
    vergeben.add(`${r.tabelle}|${r.rolle}|${r.recht}`)
  }

  for (const schluessel of vergeben) {
    if (!erlaubtLautPolicy.has(schluessel)) {
      const [tabelle, rolle, op] = schluessel.split('|')
      befunde.push({
        art: 'Recht ohne Policy',
        text: `${rolle} darf ${op} auf ${tabelle}, aber keine Policy erlaubt es`,
      })
    }
  }

  for (const schluessel of erlaubtLautPolicy) {
    if (!vergeben.has(schluessel)) {
      const [tabelle, rolle, op] = schluessel.split('|')
      befunde.push({
        art: 'Policy ohne Recht',
        text: `eine Policy erlaubt ${rolle} ${op} auf ${tabelle}, das Tabellenrecht fehlt`,
      })
    }
  }

  for (const t of ohneRls) {
    befunde.push({ art: 'RLS aus', text: `${t.tabelle} hat kein Row Level Security` })
  }

  return { befunde, vergebene: vergeben.size }
}

async function main() {
  const { befunde, vergebene } = await pruefe()

  if (befunde.length === 0) {
    console.log(`OK – ${vergebene} Tabellenrechte, jedes durch eine Policy gedeckt.`)
    console.log('Kein TRUNCATE, kein REFERENCES, kein TRIGGER für anon oder authenticated.')
    console.log('Row Level Security auf allen Tabellen aktiv.')
    return
  }

  const gruppen = new Map()
  for (const b of befunde) {
    if (!gruppen.has(b.art)) gruppen.set(b.art, [])
    gruppen.get(b.art).push(b.text)
  }
  for (const [art, texte] of gruppen) {
    console.log(`\n${art} (${texte.length}):`)
    for (const t of texte) console.log(`  · ${t}`)
  }
  console.log(`\n${befunde.length} Befunde.`)
  process.exit(1)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
}
