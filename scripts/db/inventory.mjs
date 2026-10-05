#!/usr/bin/env node
// Vollständige Inventur eines Postgres-Schemas über die Supabase-Management-API.
//
// Erzeugt eine normalisierte JSON-Momentaufnahme (Tabellen, Spalten, Constraints,
// Indizes, Policies, Trigger, Funktionen, Typen, Views, Sequenzen, Grants,
// Extensions, Kommentare). Die Momentaufnahme dient drei Zwecken:
//
//   1. Bestandsaufnahme des real existierenden Development-Schemas
//   2. Drift-Vergleich gegen die versionierten Migrationen
//   3. Reproduzierbarkeitsnachweis: Baseline in ein leeres Schema einspielen und
//      die Momentaufnahmen vergleichen (siehe scripts/db/reproduzierbarkeit.mjs)
//
// Aufruf:
//   node scripts/db/inventory.mjs [schema] > datei.json

import { runSql } from './sql.mjs'

const QUERIES = {
  tables: (s) => `
    select c.relname as name,
           c.relkind as kind,
           c.relrowsecurity as rls_enabled,
           c.relforcerowsecurity as rls_forced,
           coalesce(c.reloptions::text, '') as options
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = '${s}' and c.relkind in ('r','p','v','m','f')
    order by c.relname`,

  columns: (s) => `
    select c.relname as "table",
           a.attname as name,
           a.attnum as ord,
           format_type(a.atttypid, a.atttypmod) as type,
           a.attnotnull as not_null,
           pg_get_expr(d.adbin, d.adrelid) as "default",
           a.attidentity as identity,
           a.attgenerated as generated,
           coalesce(col.collname, '') as collation
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
    left join pg_collation col on col.oid = a.attcollation and col.collname <> 'default'
    where n.nspname = '${s}' and c.relkind in ('r','p','v','m','f')
      and a.attnum > 0 and not a.attisdropped
    order by c.relname, a.attnum`,

  constraints: (s) => `
    select c.relname as "table",
           con.conname as name,
           con.contype as type,
           pg_get_constraintdef(con.oid) as definition,
           con.condeferrable as deferrable,
           con.convalidated as validated
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = '${s}'
    order by c.relname, con.conname`,

  indexes: (s) => `
    select tablename as "table", indexname as name, indexdef as definition
    from pg_indexes where schemaname = '${s}'
    order by tablename, indexname`,

  policies: (s) => `
    select tablename as "table",
           policyname as name,
           permissive,
           roles::text as roles,
           cmd,
           coalesce(qual, '') as "using",
           coalesce(with_check, '') as with_check
    from pg_policies where schemaname = '${s}'
    order by tablename, policyname`,

  triggers: (s) => `
    select c.relname as "table",
           t.tgname as name,
           pg_get_triggerdef(t.oid) as definition
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = '${s}' and not t.tgisinternal
    order by c.relname, t.tgname`,

  functions: (s) => `
    select p.proname as name,
           pg_get_function_identity_arguments(p.oid) as args,
           pg_get_function_result(p.oid) as returns,
           p.prosecdef as security_definer,
           p.provolatile as volatility,
           coalesce(array_to_string(p.proconfig, ','), '') as config,
           l.lanname as language,
           md5(pg_get_functiondef(p.oid)) as body_hash,
           pg_get_functiondef(p.oid) as definition
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    join pg_language l on l.oid = p.prolang
    where n.nspname = '${s}' and p.prokind in ('f','p')
    order by p.proname, pg_get_function_identity_arguments(p.oid)`,

  types: (s) => `
    select t.typname as name,
           t.typtype as kind,
           coalesce((
             select string_agg(e.enumlabel, ',' order by e.enumsortorder)
             from pg_enum e where e.enumtypid = t.oid
           ), '') as labels
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = '${s}' and t.typtype in ('e','d','c')
      and not exists (select 1 from pg_class c where c.oid = t.typrelid and c.relkind <> 'c')
    order by t.typname`,

  views: (s) => `
    select c.relname as name,
           c.relkind as kind,
           pg_get_viewdef(c.oid, true) as definition
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = '${s}' and c.relkind in ('v','m')
    order by c.relname`,

  sequences: (s) => `
    select c.relname as name,
           coalesce(dc.relname || '.' || da.attname, '') as owned_by
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_depend d on d.objid = c.oid and d.deptype = 'a' and d.classid = 'pg_class'::regclass
    left join pg_class dc on dc.oid = d.refobjid
    left join pg_attribute da on da.attrelid = d.refobjid and da.attnum = d.refobjsubid
    where n.nspname = '${s}' and c.relkind = 'S'
    order by c.relname`,

  grants: (s) => `
    select c.relname as "table", g.grantee, g.privilege_type as privilege
    from information_schema.role_table_grants g
    join pg_class c on c.relname = g.table_name
    join pg_namespace n on n.oid = c.relnamespace and n.nspname = g.table_schema
    where g.table_schema = '${s}'
    order by c.relname, g.grantee, g.privilege_type`,

  function_grants: (s) => `
    select p.proname as "function",
           pg_get_function_identity_arguments(p.oid) as args,
           coalesce(pg_get_userbyid(acl.grantee), 'PUBLIC') as grantee,
           acl.privilege_type as privilege
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) as acl
    where n.nspname = '${s}' and p.prokind in ('f','p')
    order by p.proname, grantee, acl.privilege_type`,

  sequence_grants: (s) => `
    select c.relname as sequence,
           coalesce(pg_get_userbyid(acl.grantee), 'PUBLIC') as grantee,
           acl.privilege_type as privilege
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    cross join lateral aclexplode(coalesce(c.relacl, acldefault('S', c.relowner))) as acl
    where n.nspname = '${s}' and c.relkind = 'S'
    order by c.relname, grantee, acl.privilege_type`,

  column_grants: (s) => `
    select c.relname as "table", a.attname as column,
           coalesce(pg_get_userbyid(acl.grantee), 'PUBLIC') as grantee,
           acl.privilege_type as privilege
    from pg_attribute a
    join pg_class c on c.oid = a.attrelid
    join pg_namespace n on n.oid = c.relnamespace
    cross join lateral aclexplode(a.attacl) as acl
    where n.nspname = '${s}' and a.attacl is not null
    order by c.relname, a.attname, grantee, acl.privilege_type`,

  default_grants: (s) => `
    select d.defaclobjtype as object_type,
           pg_get_userbyid(d.defaclrole) as grantor,
           coalesce(pg_get_userbyid(acl.grantee), 'PUBLIC') as grantee,
           acl.privilege_type as privilege
    from pg_default_acl d
    join pg_namespace n on n.oid = d.defaclnamespace
    cross join lateral aclexplode(d.defaclacl) as acl
    where n.nspname = '${s}'
    order by d.defaclobjtype, grantor, grantee, acl.privilege_type`,

  comments: (s) => `
    select c.relname as "object",
           coalesce(a.attname, '') as column,
           coalesce(col_description(c.oid, a.attnum), obj_description(c.oid, 'pg_class')) as comment
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
    where n.nspname = '${s}' and c.relkind in ('r','p','v','m')
      and coalesce(col_description(c.oid, a.attnum), obj_description(c.oid, 'pg_class')) is not null
    order by c.relname, a.attnum`,

  extensions: () => `
    select e.extname as name, n.nspname as schema, e.extversion as version
    from pg_extension e join pg_namespace n on n.oid = e.extnamespace
    order by e.extname`,

  publications: (s) => `
    select p.pubname as publication, c.relname as "table"
    from pg_publication p
    join pg_publication_rel pr on pr.prpubid = p.oid
    join pg_class c on c.oid = pr.prrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = '${s}'
    order by p.pubname, c.relname`,
}

/**
 * Baut aus allen Inventur-Abfragen eine einzige Abfrage, die das gesamte Schema
 * als ein JSON-Objekt zurückgibt.
 *
 * Nötig für den Reproduzierbarkeitsnachweis: Dort läuft der Wiederaufbau des
 * Schemas in einer Transaktion, die anschließend zurückgerollt wird. Die
 * Momentaufnahme muss deshalb innerhalb derselben Transaktion entstehen, und die
 * Management-API liefert nur das Ergebnis der letzten Anweisung.
 */
export function fingerprintSql(schema = 'public') {
  const parts = Object.entries(QUERIES)
    .filter(([name]) => name !== 'functions')
    .map(([name, build]) => `'${name}', coalesce((select jsonb_agg(to_jsonb(q)) from (${build(schema)}) q), '[]'::jsonb)`)

  // Funktionen ohne den vollständigen Text: `pg_get_functiondef` bringt bei
  // identischer Definition Formatierungsunterschiede mit, die keine
  // Schemaabweichung sind. Der Hash über den Text bleibt als Vergleich.
  const fn = QUERIES.functions(schema).replace(
    'pg_get_functiondef(p.oid) as definition',
    "'' as definition",
  )
  parts.push(`'functions', coalesce((select jsonb_agg(to_jsonb(q)) from (${fn}) q), '[]'::jsonb)`)

  return `select jsonb_build_object(${parts.join(',\n')}) as fingerprint`
}

export async function inventory(schema = 'public') {
  const out = { schema, generated_at: null, sections: {} }
  for (const [name, build] of Object.entries(QUERIES)) {
    out.sections[name] = await runSql(build(schema))
  }
  return out
}

async function main() {
  const schema = process.argv[2] || 'public'
  const data = await inventory(schema)
  process.stdout.write(JSON.stringify(data, null, 2) + '\n')
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err.message)
    process.exit(1)
  })
}
