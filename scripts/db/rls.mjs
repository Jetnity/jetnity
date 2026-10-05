#!/usr/bin/env node
// Empirische RLS-Inventur: Was darf welche Rolle auf welcher Tabelle wirklich?
//
// Eine Policy zu lesen sagt nicht, was sie bewirkt. Vier Dinge entscheiden
// gemeinsam über den Zugriff: das Tabellenrecht (GRANT), der RLS-Schalter, die
// Policies und ihre Rollenbindung. Dieses Modul misst das Ergebnis, statt es
// abzuleiten.
//
// Ablauf – alles in EINER Transaktion, die am Ende zurückgerollt wird:
//
//   1. drei echte Konten in auth.users anlegen (Eigentümerin, Fremde, Admin)
//   2. je Tabelle eine Zeile anlegen, die der Eigentümerin gehört
//   3. jede Kombination aus Rolle, Tabelle und Operation ausprobieren
//   4. zurückrollen
//
// Die Datenbank bleibt unverändert. Ohne Zurückrollen wäre der Test auf einem
// Branch mit Daten nicht wiederholbar.

import { runSql } from './sql.mjs'
import { inventory } from './inventory.mjs'

export const ALICE = '11111111-1111-1111-1111-111111111111' // Eigentümerin
export const BOB = '22222222-2222-2222-2222-222222222222' // fremdes Konto
export const CAROL = '33333333-3333-3333-3333-333333333333' // Konto mit Rolle admin

const INSTANCE = '00000000-0000-0000-0000-000000000000'

/** Werte je Datentyp, wenn die Spalte keinen eigenen Zwang mitbringt. */
function valueForType(type) {
  const t = type.toLowerCase()
  if (t.endsWith('[]')) return `'{}'::${t}`
  if (t === 'uuid') return `'44444444-4444-4444-4444-444444444444'::uuid`
  if (t.startsWith('timestamp')) return 'now()'
  if (t === 'date') return 'current_date'
  if (t === 'time' || t.startsWith('time ')) return `'12:00'::time`
  if (t === 'interval') return `'1 day'::interval`
  if (t === 'boolean') return 'false'
  if (t === 'jsonb') return `'{}'::jsonb`
  if (t === 'json') return `'{}'::json`
  if (t === 'inet' || t === 'cidr') return `'203.0.113.10'::${t}`
  if (t === 'bytea') return `'\\x00'::bytea`
  // 2 statt 1: mehrere CHECKs verlangen Werte oberhalb von 1 (etwa `odds >= 1.01`).
  if (['smallint', 'integer', 'bigint'].includes(t)) return '2'
  if (t.startsWith('numeric') || ['real', 'double precision'].includes(t)) return '2'
  return `'test'`
}

/** Spalten, die die Zugehörigkeit zu einem Konto ausdrücken. */
const OWNER_COLUMNS = new Set(['user_id', 'created_by', 'owner_id'])

/**
 * Werte, die sich aus Typ und CHECK nicht ableiten lassen.
 *
 * `model_usage.kennung_hash` verlangt genau 64 Hexzeichen. Ein Ersatzwert wie
 * `'test'` scheitert daran, und eine Saat, die nicht entsteht, macht jede
 * Messung auf dieser Tabelle blind – eine 0 wäre dann nicht mehr von einer
 * dichten Policy zu unterscheiden.
 */
const FESTE_WERTE = new Map([['model_usage.kennung_hash', `'${'0'.repeat(64)}'`]])

/**
 * Liest die zulässigen Werte aus einem CHECK, sofern er eine einfache Liste ist.
 * Ohne diesen Schritt scheitert das Anlegen an Spalten wie `metric` oder
 * `comparator`, die nur wenige Werte erlauben.
 */
function allowedFromCheck(definition, column) {
  const patterns = [
    new RegExp(`${column}\\s*=\\s*ANY\\s*\\(\\s*ARRAY\\[([^\\]]+)\\]`, 'i'),
    new RegExp(`${column}\\s*=\\s*ANY\\s*\\(\\s*\\(\\s*ARRAY\\[([^\\]]+)\\]`, 'i'),
    new RegExp(`${column}\\s+IN\\s*\\(([^)]+)\\)`, 'i'),
    // Eine Liste mit genau einem Wert schreibt PostgreSQL als Gleichheit
    // zurück: `funktion in ('reisevorschlag')` wird zu `funktion = 'reisevorschlag'`.
    // Ohne diesen Fall bekäme die Spalte den Ersatzwert und die Zeile entstünde nicht.
    new RegExp(`${column}\\s*=\\s*('[^']*')`, 'i'),
  ]
  for (const re of patterns) {
    const m = definition.match(re)
    if (m) {
      const first = m[1].split(',')[0].trim()
      const lit = first.match(/'([^']*)'/)
      if (lit) return `'${lit[1]}'`
    }
  }
  return null
}

/** Baut das Anlege-SQL je Tabelle in einer Reihenfolge, die FKs respektiert. */
export function buildSeedPlan(inv) {
  const columns = inv.sections.columns
  const constraints = inv.sections.constraints
  const types = new Map(inv.sections.types.map((t) => [t.name, t]))

  const byTable = new Map()
  for (const c of columns) {
    if (!byTable.has(c.table)) byTable.set(c.table, [])
    byTable.get(c.table).push(c)
  }

  // Primärschlüssel je Tabelle, für die Auflösung zusammengesetzter Fremdschlüssel.
  const pkByTable = new Map()
  for (const con of constraints) {
    if (con.type !== 'p') continue
    const m = con.definition.match(/\(([^)]+)\)/)
    if (m) pkByTable.set(con.table, m[1].split(',').map((s) => s.trim().replace(/"/g, '')))
  }

  // Fremdschlüssel: Spalte -> Zieltabelle
  const fks = new Map() // "tabelle.spalte" -> zieltabelle
  const deps = new Map() // tabelle -> Set(zieltabellen im selben Schema)
  for (const con of constraints) {
    if (con.type !== 'f') continue
    const m = con.definition.match(/FOREIGN KEY \(([^)]+)\) REFERENCES ([\w.]+)\(([^)]+)\)/)
    if (!m) continue
    const cols = m[1].split(',').map((s) => s.trim().replace(/"/g, ''))
    const target = m[2].replace(/^public\./, '')
    const refCols = m[3].split(',').map((s) => s.trim().replace(/"/g, ''))

    // Bei einem zusammengesetzten Fremdschlüssel zeigt nur eine Spalte auf den
    // Schlüssel der Zieltabelle; die übrigen binden ihn an einen gemeinsamen
    // Wert. `trip_items (day_id, trip_id) → trip_days (id, trip_id)` heisst:
    // `day_id` ist der Verweis, `trip_id` gehört zur Reise. Ohne diese
    // Unterscheidung bekäme `trip_id` die Kennung eines Reisetages und der
    // Fremdschlüssel auf `trips` würde scheitern.
    const pk = pkByTable.get(target) ?? []
    for (const [i, col] of cols.entries()) {
      const zeigtAufSchluessel = cols.length === 1 || pk.includes(refCols[i])
      if (zeigtAufSchluessel) fks.set(`${con.table}.${col}`, target)
    }

    if (!target.startsWith('auth.') && target !== con.table) {
      if (!deps.has(con.table)) deps.set(con.table, new Set())
      deps.get(con.table).add(target)
    }
  }

  // CHECKs je Tabelle sammeln
  const checks = new Map()
  for (const con of constraints) {
    if (con.type !== 'c') continue
    if (!checks.has(con.table)) checks.set(con.table, [])
    checks.get(con.table).push(con.definition)
  }

  const tables = inv.sections.tables.filter((t) => t.kind === 'r').map((t) => t.name)

  // Topologische Reihenfolge, damit referenzierte Zeilen zuerst entstehen.
  const ordered = []
  const seen = new Set()
  const visit = (t, stack = new Set()) => {
    if (seen.has(t) || stack.has(t)) return
    stack.add(t)
    for (const d of deps.get(t) ?? []) if (tables.includes(d)) visit(d, stack)
    stack.delete(t)
    if (!seen.has(t)) {
      seen.add(t)
      ordered.push(t)
    }
  }
  for (const t of tables) visit(t)

  // Vergebene Schlüssel je Tabelle, damit spätere FKs darauf zeigen können.
  const seededId = new Map()
  let counter = 0
  const plan = []

  for (const table of ordered) {
    const cols = byTable.get(table) ?? []
    const names = []
    const values = []

    for (const col of cols) {
      const key = `${table}.${col.name}`
      const target = fks.get(key)
      const required = col.not_null && !col.default
      const isOwner = OWNER_COLUMNS.has(col.name) && col.type === 'uuid'

      // Alles, was einem Konto gehört, gehört Alice – das ist der positive Fall.
      // Auch dann, wenn die Spalte einen Default trägt: `default auth.uid()`
      // ergibt ohne Anmeldung NULL und verletzt dann die NOT-NULL-Bedingung.
      if (target === 'auth.users' || isOwner) {
        if (required || isOwner) {
          names.push(col.name)
          values.push(`'${ALICE}'::uuid`)
        }
        continue
      }
      if (target && target !== table) {
        const ref = seededId.get(target)
        if (ref && (required || true)) {
          names.push(col.name)
          values.push(ref)
        }
        continue
      }
      if (target === table) continue // Selbstbezug bleibt leer

      if (!required) continue

      // Primärschlüssel ohne Default bekommen einen merkbaren Wert.
      let value
      const fromCheck = (checks.get(table) ?? [])
        .map((d) => allowedFromCheck(d, col.name))
        .find(Boolean)

      if (FESTE_WERTE.has(key)) value = FESTE_WERTE.get(key)
      else if (fromCheck) value = fromCheck
      else if (types.has(col.type)) value = `'${types.get(col.type).labels.split(',')[0]}'::${col.type}`
      else if (col.type === 'uuid') value = `'${uuidFor(++counter)}'::uuid`
      else if (col.name === 'username') value = `'nutzer${counter}'`
      else value = valueForType(col.type)

      names.push(col.name)
      values.push(value)
    }

    // Schlüssel merken, auf den andere Tabellen zeigen dürfen.
    const pk = constraints.find((c) => c.table === table && c.type === 'p')
    const pkCols = pk ? pk.definition.match(/\(([^)]+)\)/)[1].split(',').map((s) => s.trim()) : []
    if (pkCols.length === 1) {
      const idx = names.indexOf(pkCols[0])
      if (idx >= 0) seededId.set(table, values[idx])
      else {
        const pkCol = cols.find((c) => c.name === pkCols[0])
        if (pkCol && pkCol.default) {
          // Wert entsteht per Default – nachträglich lesen. `order by ctid desc`
          // und, wo es die Spalte gibt, die Einschränkung auf Alice: Auf einem
          // Branch mit Daten würde ein blankes `limit 1` eine fremde Zeile
          // treffen, und ein zusammengesetzter Fremdschlüssel
          // `(trip_id, user_id)` scheiterte dann an einer Zeile, die es gibt.
          const hatEigentuemer = cols.some(
            (c) => OWNER_COLUMNS.has(c.name) && c.type === 'uuid',
          )
          const eigentuemer = cols.find((c) => OWNER_COLUMNS.has(c.name) && c.type === 'uuid')
          seededId.set(
            table,
            `(select ${pkCols[0]} from public.${table}` +
              (hatEigentuemer ? ` where ${eigentuemer.name} = '${ALICE}'::uuid` : '') +
              ` order by ctid desc limit 1)`,
          )
        }
      }
    }

    plan.push({
      table,
      sql: names.length
        ? `insert into public.${table} (${names.join(', ')}) values (${values.join(', ')})`
        : `insert into public.${table} default values`,
    })
  }

  return plan
}

function uuidFor(n) {
  const hex = n.toString(16).padStart(12, '0')
  return `00000000-0000-4000-8000-${hex}`
}

/**
 * Zwei Hilfsfunktionen, beide mit eigenem Unterabschnitt der Transaktion.
 *
 * `probe` setzt Rolle und JWT-Anspruch so, wie PostgREST es zur Laufzeit tut,
 * führt die Anweisung aus – und wirft danach absichtlich einen Fehler. Dadurch
 * rollt der Unterabschnitt zurück, und zwar auch bei Erfolg. Ohne diesen Kniff
 * würde ein erfolgreiches `delete from trips` die Zeilen aller abhängigen
 * Tabellen mitnehmen und jede spätere Messung verfälschen.
 *
 * `saee` legt die Testdaten an und muss deshalb bestehen bleiben.
 */
const PROBE_FUNCTIONS = `
create or replace function pg_temp.probe(_sql text, _role text, _uid text)
returns text language plpgsql as $fn$
declare n bigint;
begin
  begin
    perform set_config('role', _role, true);
    perform set_config(
      'request.jwt.claims',
      case when _uid is null then '' else json_build_object('sub', _uid, 'role', _role)::text end,
      true);
    execute _sql;
    get diagnostics n = row_count;
    raise exception using errcode = 'ZZ000', message = 'ok:' || n;
  exception when others then
    if sqlstate = 'ZZ000' then return sqlerrm; end if;
    return 'fehler:' || sqlstate;
  end;
end
$fn$;

create or replace function pg_temp.saee(_sql text)
returns text language plpgsql as $fn$
begin
  begin
    execute _sql;
    return 'ok';
  exception when others then
    return 'fehler:' || sqlstate || ':' || sqlerrm;
  end;
end
$fn$;`

export const AKTEURE = [
  { name: 'anon', role: 'anon', uid: null },
  { name: 'eigentuemerin', role: 'authenticated', uid: ALICE },
  { name: 'fremde', role: 'authenticated', uid: BOB },
  { name: 'admin', role: 'authenticated', uid: CAROL },
]

/**
 * `update … set spalte = spalte` ändert nichts und misst trotzdem, wie viele
 * Zeilen die Policy zum Schreiben freigibt. Eine Systemspalte wie `ctid` geht
 * dafür nicht, sie ist nicht schreibbar.
 */
function probesFor(table, column, insertSql, actor) {
  const probes = [
    { op: 'select', sql: `select * from public.${table}` },
    { op: 'delete', sql: `delete from public.${table} where true` },
    // Zeile im fremden Namen anlegen: Darf jemand Eigentum vortäuschen?
    { op: 'insert_fremd', sql: insertSql },
  ]
  if (column) {
    probes.splice(1, 0, {
      op: 'update',
      sql: `update public.${table} set ${column} = ${column} where true`,
    })
  }
  if (actor.uid && actor.uid !== ALICE) {
    // Dieselbe Zeile auf das eigene Konto ausgestellt: der positive Schreibfall.
    probes.push({ op: 'insert_eigen', sql: insertSql.split(ALICE).join(actor.uid) })
  }
  return probes
}

/**
 * Führt die Inventur aus und liefert die Matrix.
 *
 * `withSeed = false` misst dieselben Operationen auf leeren Tabellen. Der
 * Unterschied zwischen beiden Läufen zeigt, ob eine 0 „durch RLS gefiltert"
 * oder nur „keine Daten vorhanden" bedeutet.
 */
export async function rlsMatrix(inv) {
  const plan = buildSeedPlan(inv)

  const seedUsers = [ALICE, BOB, CAROL]
    .map(
      (id, i) => `insert into auth.users
        (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
        values ('${id}', '${INSTANCE}', 'authenticated', 'authenticated',
                'rls-test-${i}@example.invalid', 'x', now(), now(), now());`,
    )
    .join('\n')

  const seedStatements = plan
    .map(
      (p) =>
        `insert into pg_temp.saat (tabelle, ergebnis) select '${p.table}', pg_temp.saee($seed$${p.sql}$seed$);`,
    )
    .join('\n')

  // Spalte, die sich gefahrlos auf sich selbst setzen lässt.
  const updatableColumn = new Map()
  for (const c of inv.sections.columns) {
    if (updatableColumn.has(c.table)) continue
    if (c.generated || c.identity) continue
    updatableColumn.set(c.table, c.name)
  }

  const probeStatements = []
  for (const { table, sql: insertSql } of plan) {
    for (const actor of AKTEURE) {
      for (const probe of probesFor(table, updatableColumn.get(table), insertSql, actor)) {
        const uid = actor.uid ? `'${actor.uid}'` : 'null'
        probeStatements.push(
          `insert into pg_temp.matrix (tabelle, akteur, operation, ergebnis)
           select '${table}', '${actor.name}', '${probe.op}',
                  pg_temp.probe($p$${probe.sql}$p$, '${actor.role}', ${uid});`,
        )
      }
    }
  }

  const sql = `
begin;
set local search_path = public, extensions;
${PROBE_FUNCTIONS}
create temporary table saat (tabelle text, ergebnis text) on commit drop;
create temporary table matrix (tabelle text, akteur text, operation text, ergebnis text) on commit drop;
${seedUsers}
${seedStatements}
-- Jedes Testkonto braucht ein Profil, sonst laufen die rollenbasierten Policies
-- ins Leere und ein fehlender Admin-Zugriff sähe aus wie eine dichte Policy.
insert into public.profiles (user_id, display_name, role, status)
values ('${BOB}', 'Bob', 'user', 'active'),
       ('${CAROL}', 'Carol', 'admin', 'active');
update public.profiles set role = 'user' where user_id = '${ALICE}';
${probeStatements.join('\n')}
select jsonb_build_object(
  'saat', (select coalesce(jsonb_agg(to_jsonb(s)), '[]'::jsonb) from saat s),
  'matrix', (select coalesce(jsonb_agg(to_jsonb(m)), '[]'::jsonb) from matrix m)
) as ergebnis;
rollback;`

  const rows = await runSql(sql)
  return rows[0].ergebnis
}

async function main() {
  const inv = await inventory('public')
  const result = await rlsMatrix(inv)
  process.stdout.write(JSON.stringify(result, null, 2) + '\n')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
}
