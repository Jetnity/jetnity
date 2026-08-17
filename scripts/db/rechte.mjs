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
// Und seit dem Nachtrag zu Phase 1.4 eine dritte Regel: Eine Policy nennt
// keine Rolle, sondern eine Fähigkeit. `hat_rolle_mindestens('admin')` direkt
// in einer Policy ist der Weg, auf dem Anwendung und Datenbank
// auseinandergelaufen sind – die Anwendung liess ab `moderator` herein, die
// Policy verlangte `admin`, und niemand sah den Widerspruch. Über die
// `darf_…()`-Funktionen steht die Mindestrolle an einer Stelle, die
// lib/auth/faehigkeiten-datenbank.test.ts mit lib/auth/roles.ts vergleicht.
//
// Und seit Phase 1.4b eine vierte Regel: Keine Funktion nennt eine Struktur,
// die es nicht gibt. PostgreSQL verfolgt Tabellenbezüge im Rumpf einer
// Funktion nicht – ein `drop table` nimmt sie nicht mit. Die Funktion bleibt
// bestehen und scheitert erst beim Aufruf. Genau dieser Fall lag vor der
// Entfernung der Legacy-Tabellen vor: 18 Signaturen lasen `blog_posts` oder
// `creator_session_metrics` und hätten den `drop table` unbemerkt überlebt.
//
// Aufruf:
//   npm run db:rechte

import { runSql } from './sql.mjs'

const ROLLEN = ['anon', 'authenticated']
const OPERATIONEN = ['SELECT', 'INSERT', 'UPDATE', 'DELETE']
const VERBOTEN = ['TRUNCATE', 'REFERENCES', 'TRIGGER']

async function erhebe() {
  const [rechte, policies, ohneRls, toteBezuege] = await Promise.all([
    runSql(`
      select table_name as tabelle, grantee as rolle, privilege_type as recht
      from information_schema.role_table_grants
      where table_schema = 'public' and grantee in ('anon', 'authenticated')`),
    runSql(`
      select tablename as tabelle, policyname, unnest(roles)::text as rolle, cmd,
             coalesce(qual, '') || ' ' || coalesce(with_check, '') as ausdruck
      from pg_policies where schemaname = 'public'`),
    runSql(`
      select relname as tabelle
      from pg_class
      where relnamespace = 'public'::regnamespace and relkind = 'r' and not relrowsecurity`),
    // Jedes `public.<name>` im Funktionsrumpf muss sich auflösen lassen – als
    // Relation, als Funktion oder als Typ. Löst es sich zu keinem der drei auf,
    // greift die Funktion ins Leere.
    runSql(`
      with fn as (
        select p.oid, p.proname,
               pg_get_function_identity_arguments(p.oid) as args,
               pg_get_functiondef(p.oid) as def
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        join pg_language l on l.oid = p.prolang
        where n.nspname = 'public' and l.lanname in ('sql', 'plpgsql')
      ),
      bezug as (
        select fn.proname, fn.args, treffer[1] as name
        from fn, regexp_matches(fn.def, '\\mpublic\\.([a-z_][a-z0-9_]*)', 'g') as treffer
      )
      select distinct proname, args, name
      from bezug
      where to_regclass('public.' || name) is null
        and to_regtype('public.' || name) is null
        and not exists (
          select 1 from pg_proc p2
          join pg_namespace n2 on n2.oid = p2.pronamespace
          where n2.nspname = 'public' and p2.proname = bezug.name)
      order by proname, args, name`),
  ])
  return { rechte, policies, ohneRls, toteBezuege }
}

/** Welche Operationen deckt eine Policy ab? */
function operationenVon(cmd) {
  return cmd === 'ALL' ? OPERATIONEN : [cmd]
}

export async function pruefe() {
  const { rechte, policies, ohneRls, toteBezuege } = await erhebe()

  const erlaubtLautPolicy = new Set()
  const befunde = []
  const gesehenePolicies = new Set()

  for (const p of policies) {
    if (!ROLLEN.includes(p.rolle)) continue
    for (const op of operationenVon(p.cmd)) erlaubtLautPolicy.add(`${p.tabelle}|${p.rolle}|${op}`)

    // `unnest(roles)` liefert eine Zeile je Zielrolle; die Bedingung ist
    // dieselbe. Ohne diese Sperre stünde derselbe Befund mehrfach da.
    const kennung = `${p.tabelle}.${p.policyname}`
    if (gesehenePolicies.has(kennung)) continue
    gesehenePolicies.add(kennung)

    if (/hat_rolle_mindestens\(/.test(p.ausdruck)) {
      befunde.push({
        art: 'Rolle statt Fähigkeit',
        text: `${kennung} nennt eine Rolle direkt; erwartet wird eine der darf_…()-Funktionen`,
      })
    }
  }

  const vergeben = new Set()

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

  for (const b of toteBezuege) {
    befunde.push({
      art: 'toter Bezug in einer Funktion',
      text: `public.${b.proname}(${b.args}) nennt public.${b.name} – die Struktur existiert nicht`,
    })
  }

  return { befunde, vergebene: vergeben.size }
}

async function main() {
  const { befunde, vergebene } = await pruefe()

  if (befunde.length === 0) {
    console.log(`OK – ${vergebene} Tabellenrechte, jedes durch eine Policy gedeckt.`)
    console.log('Kein TRUNCATE, kein REFERENCES, kein TRIGGER für anon oder authenticated.')
    console.log('Row Level Security auf allen Tabellen aktiv.')
    console.log('Jede rollengebundene Policy nennt eine Fähigkeit, keine Rolle.')
    console.log('Keine Funktion greift auf eine Struktur zu, die es nicht gibt.')
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
