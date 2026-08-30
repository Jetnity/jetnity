// Fail-closed Repair-Pfad für Production-History 20260829140000.
//
// Eine Datei = ein schema_migrations.statements-Element, identisch zu
// scripts/db/anwenden.ts / sqlLiteral(). Keine semantische Neuinterpretation,
// kein Statement-Splitter, kein Prosa-Marker.
//
// Default = lokale Probe. Production-Write nur mit
// --schreiben --produktion --projekt-ref qscbgcdmivbbnzrcyegn --history-body-ersetzen.
// Der Runner führt die Repo-Migration niemals als DDL aus.
// Development ist kein zulässiges Ziel.

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { refsStimmenUeberein } from '@/lib/rollout/schreibauftrag'
import { sqlLiteral } from '@/lib/rollout/sql-literal'

export const REPAIR_DATEI = '20260829140000_trip_item_commercial_provenance.sql'
export const REPAIR_VERSION = '20260829140000'
export const REPAIR_NAME = 'trip_item_commercial_provenance'
export const REPAIR_GIT_BLOB = 'e25ab1b7efb48157828968993749a25fa30cc660'
export const REPAIR_SQL_SHA256 =
  'e85ded3f0fdbdc5a97bca8af796fa4ce9b0283cb27d06f83ab26f0cd16f11404'
export const REPAIR_SQL_MD5 = 'bd4b613da5037b3c7535d17451dd8e67'
export const REPAIR_MARKER_MD5 = '414f7318235ac388e97fd74f97536ca1'
export const REPAIR_MARKER_SHA256 =
  'bef6912d9cf1a9444c1da571b1aa6c246b6280019e38a9031984117994b6e996'
export const REPAIR_MARKER_TEXT =
  'S5-B Commercial Provenance persistence applied by Technical Lead from canonical repository migration at main merge 3b684f64f28bc4a2732e34cd642837aab5ea70ec; semantics verified on isolated Supabase Postgres 17 branch before Production.'
export const REPAIR_PROD_PROJEKT_REF = 'qscbgcdmivbbnzrcyegn'
export const REPAIR_TABLE = 'trip_item_commercial_provenance'
export const REPAIR_TABLE_OID = 282263
export const REPAIR_POLICY = 'trip_item_commercial_provenance_lesen'
export const REPAIR_FUNCTION_SCHEMA = 'jetnity_internal'
export const REPAIR_FUNCTION_NAME = 'trip_item_commercial_provenance_schreiben'
export const REPAIR_FUNCTION_IDENTITY = 'jetnity_internal.trip_item_commercial_provenance_schreiben(jsonb)'
export const REPAIR_FUNCTION_MD5 = '7e7bfe10d20c2f13274d1eb04a75150e'
export const REPAIR_WRITER_ROLE = 'jetnity_commercial_writer'
export const REPAIR_RUNTIME_ROLE = 'jetnity_commercial_runtime'
export const REPAIR_DO_TAG = 'jetnity_mh_repair_20260829140000'
export const REPAIR_ERSTES_SQL = 'create schema if not exists jetnity_internal;'
export const REPAIR_TABLE_ACL = 'authenticated=r/postgres,postgres=arwdDxtm/postgres'
export const REPAIR_FUNCTION_ACL = 'jetnity_commercial_writer=X/postgres,postgres=X/postgres'
export const REPAIR_FUNCTION_CONFIG = 'search_path=""'
export const REPAIR_POLICY_ROLES = 'authenticated'
export const REPAIR_WRITER_MEMBERS = 'jetnity_commercial_runtime,postgres'
export const REPAIR_RUNTIME_MEMBERS = 'postgres'
export const REPAIR_GATE_NOTE =
  'S5-B definiert den Invocation-Vertrag. GRANT jetnity_commercial_runtime an eine Anwendungs-Login-Rolle ist ein späteres Gate. Die Funktion ist kein Production-Write-Pfad.'
export const REPAIR_POLICY_QUAL_FINGERPRINT =
  'user_id = select auth.uid and exists select 1 from trip_items i where i.id = trip_item_id and i.user_id = select auth.uid and i.trip_id = trip_item_commercial_provenance.trip_id'

export type HistoryRepairDatei = {
  datei: string
  version: string
  name: string
  gitBlob: string
  sha256: string
  md5: string
  sql: string
}

export type HistoryRepairAuftrag =
  | { modus: 'probe' }
  | { modus: 'preflight'; bestaetigterRef: string }
  | { modus: 'apply'; bestaetigterRef: string }

export type HistoryRepairPreflight = {
  version: string | null
  name: string | null
  version_count: number
  statement_count: number
  statements_md5: string | null
  statement_0: string | null
  table_exists: boolean
  table_oid: number | null
  rls_enabled: boolean
  rls_forced: boolean
  row_count: number
  table_acl: string | null
  policy_count: number
  policy_name: string | null
  policy_cmd: string | null
  policy_roles: string | null
  policy_permissive: boolean | null
  policy_qual: string | null
  policy_with_check: string | null
  gate_row_count: number
  gate_singleton: boolean | null
  gate_allocated: boolean | null
  gate_invoker: string | null
  gate_note: string | null
  writer_nologin: boolean | null
  writer_inherit: boolean | null
  writer_bypassrls: boolean | null
  writer_super: boolean | null
  runtime_nologin: boolean | null
  runtime_inherit: boolean | null
  runtime_bypassrls: boolean | null
  runtime_super: boolean | null
  writer_members: string | null
  runtime_members: string | null
  function_md5: string | null
  function_security_definer: boolean | null
  function_config: string | null
  function_acl: string | null
}

type Umgebung = { SUPABASE_PROJECT_REF?: string | undefined }

const DDL_IM_REPAIR_PFAD = [
  /\bcreate\s+(or\s+replace\s+)?(table|schema|role|policy|function|trigger|index)\b/i,
  /\balter\s+(table|role|schema|function|policy)\b/i,
  /\bdrop\s+(table|schema|role|policy|function|trigger|index)\b/i,
  /\bgrant\s+(select|insert|update|delete|all|execute|usage|option|privileges)\b/i,
  /\brevoke\s+(select|insert|update|delete|all|execute|usage|option|privileges)\b/i,
  /\btruncate\b/i,
  /\binsert\s+into\b/i,
  /\bdelete\s+from\b/i,
  /\bupdate\s+(public\.|jetnity_internal\.)/i,
]

function hatFlag(argv: readonly string[], name: string): boolean {
  return argv.includes(`--${name}`)
}

function argument(argv: readonly string[], name: string): string | undefined {
  const i = argv.indexOf(`--${name}`)
  if (i < 0) return undefined
  const wert = argv[i + 1]
  if (!wert || wert.startsWith('--')) return undefined
  return wert
}

function migrationenVerzeichnis(wurzel = process.cwd()): string {
  return join(wurzel, 'supabase/migrations')
}

export function sha256Hex(inhalt: string | Buffer): string {
  return createHash('sha256').update(inhalt).digest('hex')
}

export function md5Hex(inhalt: string | Buffer): string {
  return createHash('md5').update(inhalt).digest('hex')
}

export function gitBlobSha1(inhalt: Buffer): string {
  return createHash('sha1')
    .update(Buffer.from(`blob ${inhalt.length}\0`))
    .update(inhalt)
    .digest('hex')
}

export function sqlStatement(sql: string): string {
  const getrimmt = sql.trim()
  if (!getrimmt) {
    throw new Error('Leeres SQL-Statement.')
  }
  return getrimmt.endsWith(';') ? getrimmt : `${getrimmt};`
}

export function historyStatements(sql: string): string[] {
  if (!sql) {
    throw new Error('Leerer Migrations-Body ist nicht replay-fähig.')
  }
  return [sql]
}

export function historyStatementsArraySql(sql: string): string {
  return `array[${sqlLiteral(sql)}]`
}

export function fuehrendeSqlKommentareEntfernen(sql: string): string {
  let rest = sql
  for (;;) {
    const getrimmt = rest.replace(/^\s+/, '')
    if (getrimmt.startsWith('--')) {
      const nl = getrimmt.indexOf('\n')
      rest = nl < 0 ? '' : getrimmt.slice(nl + 1)
      continue
    }
    if (getrimmt.startsWith('/*')) {
      const ende = getrimmt.indexOf('*/')
      if (ende < 0) {
        throw new Error('Unbeendeter Blockkommentar im Migrations-Body.')
      }
      rest = getrimmt.slice(ende + 2)
      continue
    }
    return getrimmt
  }
}

const SQL_START =
  /^(create|alter|drop|comment|do|revoke|grant|insert|update|delete|select|with|begin|set|reset|truncate|security)\b/i

export function erstesAusfuehrbaresSql(sql: string): string {
  const rest = fuehrendeSqlKommentareEntfernen(sql)
  if (!rest) {
    throw new Error('Migrations-Body enthält kein ausführbares SQL.')
  }
  if (!SQL_START.test(rest)) {
    throw new Error('Erstes ausführbares Token ist kein SQL.')
  }
  const semi = rest.indexOf(';')
  return (semi < 0 ? rest : rest.slice(0, semi + 1)).replace(/\s+/g, ' ').trim()
}

export function istProsaMarker(statement: string): boolean {
  return md5Hex(statement) === REPAIR_MARKER_MD5
}

export function mengenFingerprint(wert: string | null | undefined): string {
  return (wert ?? '')
    .split(',')
    .map((teil) => teil.trim())
    .filter(Boolean)
    .sort()
    .join(',')
}

export function policyQualFingerprint(qual: string | null | undefined): string {
  if (!qual) return ''
  return qual
    .replace(/\s+/g, ' ')
    .replace(/ as [A-Za-z_][A-Za-z0-9_]*/gi, '')
    .replace(/\bpublic\./gi, '')
    .replace(/\btrip_item_commercial_provenance\.trip_item_id\b/gi, 'trip_item_id')
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function policyQualFingerprintSql(ausdruck: string): string {
  return `lower(btrim(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(${ausdruck},
    '\\s+', ' ', 'g'),
    ' as [A-Za-z_][A-Za-z0-9_]*', '', 'gi'),
    'public\\.', '', 'gi'),
    'trip_item_commercial_provenance\\.trip_item_id', 'trip_item_id', 'gi'),
    '[()]', ' ', 'g'),
    '\\s+', ' ', 'g')))`
}

export function dateiLesenUndPruefen(wurzel = process.cwd()): HistoryRepairDatei {
  const raw = readFileSync(join(migrationenVerzeichnis(wurzel), REPAIR_DATEI))
  const sql = raw.toString('utf8')
  const gitBlob = gitBlobSha1(raw)
  const sha256 = sha256Hex(raw)
  const md5 = md5Hex(raw)
  if (gitBlob !== REPAIR_GIT_BLOB) {
    throw new Error(
      `${REPAIR_DATEI} ist nicht blob-identisch mit dem reviewten Vertrag. ` +
        `erwartet Git-Blob ${REPAIR_GIT_BLOB}, gefunden ${gitBlob}. Abgebrochen.`,
    )
  }
  if (sha256 !== REPAIR_SQL_SHA256) {
    throw new Error(
      `${REPAIR_DATEI} ist nicht hash-identisch mit dem reviewten Vertrag. ` +
        `erwartet SHA-256 ${REPAIR_SQL_SHA256}, gefunden ${sha256}. Abgebrochen.`,
    )
  }
  if (md5 !== REPAIR_SQL_MD5) {
    throw new Error(
      `${REPAIR_DATEI} ist nicht MD5-identisch mit dem reviewten Vertrag. ` +
        `erwartet MD5 ${REPAIR_SQL_MD5}, gefunden ${md5}. Abgebrochen.`,
    )
  }
  if (sql.includes(`$${REPAIR_DO_TAG}$`)) {
    throw new Error('Kanonischer SQL-Body kollidiert mit dem Repair-Dollar-Quote.')
  }
  const erstes = erstesAusfuehrbaresSql(sql)
  if (erstes !== REPAIR_ERSTES_SQL) {
    throw new Error(
      `Erstes ausführbares SQL ist nicht ${REPAIR_ERSTES_SQL}. Gefunden: ${erstes}.`,
    )
  }
  if (istProsaMarker(sql)) {
    throw new Error('Kanonischer SQL-Body darf nicht der Prosa-Marker sein.')
  }
  return {
    datei: REPAIR_DATEI,
    version: REPAIR_VERSION,
    name: REPAIR_NAME,
    gitBlob,
    sha256,
    md5,
    sql,
  }
}

export function auftragLesen(
  argv: readonly string[],
  umgebung: Umgebung | NodeJS.ProcessEnv = process.env,
): HistoryRepairAuftrag {
  if (hatFlag(argv, 'entwicklung') || hatFlag(argv, 'entwicklung-probe')) {
    throw new Error(
      'Dieser Repair-Runner darf Development nicht anfassen. Kein --entwicklung.',
    )
  }
  const schreiben = hatFlag(argv, 'schreiben')
  const produktion = hatFlag(argv, 'produktion')
  const ersetzen = hatFlag(argv, 'history-body-ersetzen')
  const genannt = argument(argv, 'projekt-ref')

  if (genannt && !produktion) {
    throw new Error('--projekt-ref gilt nur mit --produktion.')
  }
  if (schreiben && !produktion) {
    throw new Error(
      'Schreiben braucht --schreiben --produktion --projekt-ref --history-body-ersetzen.',
    )
  }
  if (ersetzen && !schreiben) {
    throw new Error('--history-body-ersetzen gilt nur zusammen mit --schreiben.')
  }
  if (!produktion) {
    return { modus: 'probe' }
  }
  if (genannt !== REPAIR_PROD_PROJEKT_REF) {
    throw new Error(`Production-Ziel muss exakt ${REPAIR_PROD_PROJEKT_REF} sein. Abgebrochen.`)
  }
  const bestaetigterRef = refsStimmenUeberein(umgebung.SUPABASE_PROJECT_REF, genannt)
  if (!schreiben) {
    if (ersetzen) {
      throw new Error('--history-body-ersetzen gilt nur zusammen mit --schreiben.')
    }
    return { modus: 'preflight', bestaetigterRef }
  }
  if (!ersetzen) {
    throw new Error(
      'Production-Write braucht --schreiben --produktion --projekt-ref --history-body-ersetzen.',
    )
  }
  return { modus: 'apply', bestaetigterRef }
}

function alsZahl(wert: unknown): number {
  const n = Number(wert)
  if (!Number.isFinite(n)) {
    throw new Error('Preflight-Zahl ungültig.')
  }
  return n
}

function alsText(wert: unknown): string | null {
  if (wert === null || wert === undefined) return null
  return String(wert)
}

function alsBool(wert: unknown): boolean {
  if (typeof wert === 'boolean') return wert
  if (wert === 't' || wert === 'true') return true
  if (wert === 'f' || wert === 'false' || wert === null || wert === undefined) return false
  return Boolean(wert)
}

function alsOptionalBool(wert: unknown): boolean | null {
  if (wert === null || wert === undefined || wert === '') return null
  return alsBool(wert)
}

function rollenMitgliederSql(rolle: string): string {
  return `coalesce((
    select array_to_string(array(
      select u.rolname
        from pg_auth_members m
        join pg_roles r on r.oid = m.roleid
        join pg_roles u on u.oid = m.member
       where r.rolname = ${sqlLiteral(rolle)}
       order by u.rolname
    ), ',')
  ), '')`
}

export function preflightSql(): string {
  return `
select
  (select version from supabase_migrations.schema_migrations
    where version = ${sqlLiteral(REPAIR_VERSION)}) as version,
  (select name from supabase_migrations.schema_migrations
    where version = ${sqlLiteral(REPAIR_VERSION)}) as name,
  (select count(*)::int from supabase_migrations.schema_migrations
    where version = ${sqlLiteral(REPAIR_VERSION)}) as version_count,
  (select cardinality(statements) from supabase_migrations.schema_migrations
    where version = ${sqlLiteral(REPAIR_VERSION)}) as statement_count,
  (select md5(statements[1]) from supabase_migrations.schema_migrations
    where version = ${sqlLiteral(REPAIR_VERSION)}) as statements_md5,
  (select statements[1] from supabase_migrations.schema_migrations
    where version = ${sqlLiteral(REPAIR_VERSION)}) as statement_0,
  exists (
    select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname = ${sqlLiteral(REPAIR_TABLE)}
       and c.relkind = 'r'
  ) as table_exists,
  (select c.oid
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = ${sqlLiteral(REPAIR_TABLE)}) as table_oid,
  coalesce((
    select c.relrowsecurity
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = ${sqlLiteral(REPAIR_TABLE)}
  ), false) as rls_enabled,
  coalesce((
    select c.relforcerowsecurity
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = ${sqlLiteral(REPAIR_TABLE)}
  ), false) as rls_forced,
  coalesce((
    select count(*)::int from public.trip_item_commercial_provenance
  ), 0) as row_count,
  coalesce((
    select array_to_string(array(select unnest(c.relacl)::text order by 1), ',')
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = ${sqlLiteral(REPAIR_TABLE)}
  ), '') as table_acl,
  coalesce((
    select count(*)::int
      from pg_policy p
      join pg_class c on c.oid = p.polrelid
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = ${sqlLiteral(REPAIR_TABLE)}
  ), 0) as policy_count,
  (select p.polname
     from pg_policy p
     join pg_class c on c.oid = p.polrelid
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = ${sqlLiteral(REPAIR_TABLE)}
      and p.polname = ${sqlLiteral(REPAIR_POLICY)}) as policy_name,
  (select p.polcmd::text
     from pg_policy p
     join pg_class c on c.oid = p.polrelid
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = ${sqlLiteral(REPAIR_TABLE)}
      and p.polname = ${sqlLiteral(REPAIR_POLICY)}) as policy_cmd,
  coalesce((
    select array_to_string(array(
      select r.rolname
        from pg_policy p
        join pg_class c on c.oid = p.polrelid
        join pg_namespace n on n.oid = c.relnamespace
        join unnest(p.polroles) u(oid) on true
        join pg_roles r on r.oid = u.oid
       where n.nspname = 'public'
         and c.relname = ${sqlLiteral(REPAIR_TABLE)}
         and p.polname = ${sqlLiteral(REPAIR_POLICY)}
       order by r.rolname
    ), ',')
  ), '') as policy_roles,
  (select p.polpermissive
     from pg_policy p
     join pg_class c on c.oid = p.polrelid
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = ${sqlLiteral(REPAIR_TABLE)}
      and p.polname = ${sqlLiteral(REPAIR_POLICY)}) as policy_permissive,
  (select ${policyQualFingerprintSql('pg_get_expr(p.polqual, p.polrelid)')}
     from pg_policy p
     join pg_class c on c.oid = p.polrelid
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = ${sqlLiteral(REPAIR_TABLE)}
      and p.polname = ${sqlLiteral(REPAIR_POLICY)}) as policy_qual,
  (select pg_get_expr(p.polwithcheck, p.polrelid)
     from pg_policy p
     join pg_class c on c.oid = p.polrelid
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = ${sqlLiteral(REPAIR_TABLE)}
      and p.polname = ${sqlLiteral(REPAIR_POLICY)}) as policy_with_check,
  coalesce((select count(*)::int from jetnity_internal.commercial_write_runtime_gate), 0)
    as gate_row_count,
  (select singleton from jetnity_internal.commercial_write_runtime_gate where singleton = true)
    as gate_singleton,
  (select production_write_path_allocated
     from jetnity_internal.commercial_write_runtime_gate
    where singleton = true) as gate_allocated,
  (select allocated_invoker_role::text
     from jetnity_internal.commercial_write_runtime_gate
    where singleton = true) as gate_invoker,
  (select note
     from jetnity_internal.commercial_write_runtime_gate
    where singleton = true) as gate_note,
  (select not rolcanlogin from pg_roles where rolname = ${sqlLiteral(REPAIR_WRITER_ROLE)})
    as writer_nologin,
  (select rolinherit from pg_roles where rolname = ${sqlLiteral(REPAIR_WRITER_ROLE)})
    as writer_inherit,
  (select rolbypassrls from pg_roles where rolname = ${sqlLiteral(REPAIR_WRITER_ROLE)})
    as writer_bypassrls,
  (select rolsuper from pg_roles where rolname = ${sqlLiteral(REPAIR_WRITER_ROLE)})
    as writer_super,
  (select not rolcanlogin from pg_roles where rolname = ${sqlLiteral(REPAIR_RUNTIME_ROLE)})
    as runtime_nologin,
  (select rolinherit from pg_roles where rolname = ${sqlLiteral(REPAIR_RUNTIME_ROLE)})
    as runtime_inherit,
  (select rolbypassrls from pg_roles where rolname = ${sqlLiteral(REPAIR_RUNTIME_ROLE)})
    as runtime_bypassrls,
  (select rolsuper from pg_roles where rolname = ${sqlLiteral(REPAIR_RUNTIME_ROLE)})
    as runtime_super,
  ${rollenMitgliederSql(REPAIR_WRITER_ROLE)} as writer_members,
  ${rollenMitgliederSql(REPAIR_RUNTIME_ROLE)} as runtime_members,
  (select md5(pg_get_functiondef(${sqlLiteral(REPAIR_FUNCTION_IDENTITY)}::regprocedure)))
    as function_md5,
  (select p.prosecdef
     from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = ${sqlLiteral(REPAIR_FUNCTION_SCHEMA)}
      and p.proname = ${sqlLiteral(REPAIR_FUNCTION_NAME)}
      and pg_get_function_identity_arguments(p.oid) = '_eingabe jsonb')
    as function_security_definer,
  coalesce((
    select array_to_string(p.proconfig, ',')
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = ${sqlLiteral(REPAIR_FUNCTION_SCHEMA)}
       and p.proname = ${sqlLiteral(REPAIR_FUNCTION_NAME)}
       and pg_get_function_identity_arguments(p.oid) = '_eingabe jsonb'
  ), '') as function_config,
  coalesce((
    select array_to_string(array(select unnest(p.proacl)::text order by 1), ',')
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = ${sqlLiteral(REPAIR_FUNCTION_SCHEMA)}
       and p.proname = ${sqlLiteral(REPAIR_FUNCTION_NAME)}
       and pg_get_function_identity_arguments(p.oid) = '_eingabe jsonb'
  ), '') as function_acl
`.trim()
}

export function preflightAusZeilen(
  zeilen: HistoryRepairPreflight[] | HistoryRepairPreflight | null | undefined,
): HistoryRepairPreflight {
  const zeile = Array.isArray(zeilen) ? zeilen[0] : zeilen
  if (!zeile) {
    throw new Error('History-Repair-Preflight leer. Abgebrochen.')
  }
  const withCheck = alsText(zeile.policy_with_check)
  const invoker = alsText(zeile.gate_invoker)
  return {
    version: alsText(zeile.version),
    name: alsText(zeile.name),
    version_count: alsZahl(zeile.version_count),
    statement_count: alsZahl(zeile.statement_count),
    statements_md5: alsText(zeile.statements_md5),
    statement_0: alsText(zeile.statement_0),
    table_exists: alsBool(zeile.table_exists),
    table_oid: zeile.table_oid === null || zeile.table_oid === undefined ? null : alsZahl(zeile.table_oid),
    table_acl: mengenFingerprint(alsText(zeile.table_acl)),
    rls_enabled: alsBool(zeile.rls_enabled),
    rls_forced: alsBool(zeile.rls_forced),
    row_count: alsZahl(zeile.row_count),
    policy_count: alsZahl(zeile.policy_count),
    policy_name: alsText(zeile.policy_name),
    policy_cmd: alsText(zeile.policy_cmd),
    policy_roles: mengenFingerprint(alsText(zeile.policy_roles)),
    policy_permissive: alsOptionalBool(zeile.policy_permissive),
    policy_qual: policyQualFingerprint(alsText(zeile.policy_qual)),
    policy_with_check: withCheck === '' ? null : withCheck,
    gate_row_count: alsZahl(zeile.gate_row_count),
    gate_singleton: alsOptionalBool(zeile.gate_singleton),
    gate_allocated: alsOptionalBool(zeile.gate_allocated),
    gate_invoker: invoker === '' ? null : invoker,
    gate_note: alsText(zeile.gate_note),
    writer_nologin: alsOptionalBool(zeile.writer_nologin),
    writer_inherit: alsOptionalBool(zeile.writer_inherit),
    writer_bypassrls: alsOptionalBool(zeile.writer_bypassrls),
    writer_super: alsOptionalBool(zeile.writer_super),
    runtime_nologin: alsOptionalBool(zeile.runtime_nologin),
    runtime_inherit: alsOptionalBool(zeile.runtime_inherit),
    runtime_bypassrls: alsOptionalBool(zeile.runtime_bypassrls),
    runtime_super: alsOptionalBool(zeile.runtime_super),
    writer_members: mengenFingerprint(alsText(zeile.writer_members)),
    runtime_members: mengenFingerprint(alsText(zeile.runtime_members)),
    function_md5: alsText(zeile.function_md5),
    function_security_definer: alsOptionalBool(zeile.function_security_definer),
    function_config: alsText(zeile.function_config) ?? '',
    function_acl: mengenFingerprint(alsText(zeile.function_acl)),
  }
}

export function erwartetesMarkerPreflight(): HistoryRepairPreflight {
  return {
    version: REPAIR_VERSION,
    name: REPAIR_NAME,
    version_count: 1,
    statement_count: 1,
    statements_md5: REPAIR_MARKER_MD5,
    statement_0: REPAIR_MARKER_TEXT,
    table_exists: true,
    table_oid: REPAIR_TABLE_OID,
    table_acl: REPAIR_TABLE_ACL,
    rls_enabled: true,
    rls_forced: false,
    row_count: 0,
    policy_count: 1,
    policy_name: REPAIR_POLICY,
    policy_cmd: 'r',
    policy_roles: REPAIR_POLICY_ROLES,
    policy_permissive: true,
    policy_qual: REPAIR_POLICY_QUAL_FINGERPRINT,
    policy_with_check: null,
    gate_row_count: 1,
    gate_singleton: true,
    gate_allocated: false,
    gate_invoker: null,
    gate_note: REPAIR_GATE_NOTE,
    writer_nologin: true,
    writer_inherit: true,
    writer_bypassrls: false,
    writer_super: false,
    runtime_nologin: true,
    runtime_inherit: false,
    runtime_bypassrls: false,
    runtime_super: false,
    writer_members: REPAIR_WRITER_MEMBERS,
    runtime_members: REPAIR_RUNTIME_MEMBERS,
    function_md5: REPAIR_FUNCTION_MD5,
    function_security_definer: true,
    function_config: REPAIR_FUNCTION_CONFIG,
    function_acl: REPAIR_FUNCTION_ACL,
  }
}

const KATALOG_FELDER: (keyof HistoryRepairPreflight)[] = [
  'table_exists',
  'table_oid',
  'table_acl',
  'rls_enabled',
  'rls_forced',
  'row_count',
  'policy_count',
  'policy_name',
  'policy_cmd',
  'policy_roles',
  'policy_permissive',
  'policy_qual',
  'policy_with_check',
  'gate_row_count',
  'gate_singleton',
  'gate_allocated',
  'gate_invoker',
  'gate_note',
  'writer_nologin',
  'writer_inherit',
  'writer_bypassrls',
  'writer_super',
  'runtime_nologin',
  'runtime_inherit',
  'runtime_bypassrls',
  'runtime_super',
  'writer_members',
  'runtime_members',
  'function_md5',
  'function_security_definer',
  'function_config',
  'function_acl',
]

export function preflightPasst(stand: HistoryRepairPreflight): void {
  const erwartet = erwartetesMarkerPreflight()
  if (stand.version_count !== 1 || stand.version !== REPAIR_VERSION) {
    throw new Error(
      `Preflight: Version ${REPAIR_VERSION} fehlt oder ist nicht eindeutig (${stand.version_count}). Abgebrochen.`,
    )
  }
  if (stand.name !== REPAIR_NAME) {
    throw new Error(`Preflight: Name ist nicht ${REPAIR_NAME}. Gefunden: ${stand.name ?? 'keiner'}.`)
  }
  if (stand.statement_count !== 1) {
    throw new Error(`Preflight: statement_count ist nicht 1 (${stand.statement_count}). Abgebrochen.`)
  }
  if (stand.statements_md5 !== REPAIR_MARKER_MD5) {
    throw new Error(
      `Preflight: Marker-MD5 weicht ab. erwartet ${REPAIR_MARKER_MD5}, gefunden ${stand.statements_md5 ?? 'keiner'}.`,
    )
  }
  if (stand.statement_0 !== REPAIR_MARKER_TEXT || !istProsaMarker(stand.statement_0 ?? '')) {
    throw new Error('Preflight: gespeicherter Body ist nicht der exakte Prosa-Marker. Abgebrochen.')
  }
  if (!stand.table_exists || stand.table_oid !== REPAIR_TABLE_OID) {
    throw new Error(
      `Preflight: Provenance-Tabelle/OID weicht ab (oid=${stand.table_oid ?? 'keine'}). Abgebrochen.`,
    )
  }
  if (stand.table_acl !== erwartet.table_acl) {
    throw new Error(`Preflight: Table-ACL weicht ab (${stand.table_acl || 'keine'}). Abgebrochen.`)
  }
  if (!stand.rls_enabled || stand.rls_forced) {
    throw new Error('Preflight: RLS-Fingerprint weicht ab. Abgebrochen.')
  }
  if (stand.row_count !== 0) {
    throw new Error(`Preflight: Provenance-Rowcount ist nicht 0 (${stand.row_count}). Abgebrochen.`)
  }
  if (stand.policy_count !== 1) {
    throw new Error(`Preflight: Policy-Count ist nicht 1 (${stand.policy_count}). Abgebrochen.`)
  }
  if (
    stand.policy_name !== REPAIR_POLICY ||
    stand.policy_cmd !== 'r' ||
    stand.policy_permissive !== true ||
    stand.policy_roles !== REPAIR_POLICY_ROLES ||
    stand.policy_qual !== REPAIR_POLICY_QUAL_FINGERPRINT ||
    stand.policy_with_check !== null
  ) {
    throw new Error('Preflight: Owner-SELECT-Policy weicht ab. Abgebrochen.')
  }
  if (
    stand.gate_row_count !== 1 ||
    stand.gate_singleton !== true ||
    stand.gate_allocated !== false ||
    stand.gate_invoker !== null ||
    stand.gate_note !== REPAIR_GATE_NOTE
  ) {
    throw new Error('Preflight: Commercial Runtime Gate ist nicht geschlossen. Abgebrochen.')
  }
  if (
    stand.writer_nologin !== true ||
    stand.writer_inherit !== true ||
    stand.writer_bypassrls !== false ||
    stand.writer_super !== false ||
    stand.runtime_nologin !== true ||
    stand.runtime_inherit !== false ||
    stand.runtime_bypassrls !== false ||
    stand.runtime_super !== false ||
    stand.writer_members !== REPAIR_WRITER_MEMBERS ||
    stand.runtime_members !== REPAIR_RUNTIME_MEMBERS
  ) {
    throw new Error('Preflight: Rollen-Fingerprint weicht ab. Abgebrochen.')
  }
  if (
    stand.function_md5 !== REPAIR_FUNCTION_MD5 ||
    stand.function_security_definer !== true ||
    stand.function_config !== REPAIR_FUNCTION_CONFIG ||
    stand.function_acl !== REPAIR_FUNCTION_ACL
  ) {
    throw new Error(
      `Preflight: Writer-Funktion weicht ab (md5=${stand.function_md5 ?? 'keine'}). Abgebrochen.`,
    )
  }
}

export function katalogUnveraendert(
  vorher: HistoryRepairPreflight,
  nachher: HistoryRepairPreflight,
): boolean {
  return KATALOG_FELDER.every((feld) => vorher[feld] === nachher[feld])
}

export function historyBodyRepariert(
  stand: HistoryRepairPreflight,
  datei: HistoryRepairDatei,
): boolean {
  return (
    stand.version === REPAIR_VERSION &&
    stand.name === REPAIR_NAME &&
    stand.version_count === 1 &&
    stand.statement_count === 1 &&
    stand.statements_md5 === datei.md5 &&
    stand.statement_0 === datei.sql &&
    stand.statements_md5 !== REPAIR_MARKER_MD5 &&
    erstesAusfuehrbaresSql(stand.statement_0 ?? '') === REPAIR_ERSTES_SQL
  )
}

export function writeSqlOhneHistoryLiteral(writeSql: string, datei: HistoryRepairDatei): string {
  const literal = sqlLiteral(datei.sql)
  if (!writeSql.includes(literal)) {
    throw new Error('Write-SQL enthält den kanonischen Body nicht als Literal.')
  }
  return writeSql.split(literal).join("''")
}

export function writeSqlIstFailClosed(writeSql: string, datei: HistoryRepairDatei): void {
  if (!writeSql.startsWith('begin;') || !writeSql.endsWith(';\n\ncommit;')) {
    throw new Error('Write-SQL ist nicht atomar terminiert.')
  }
  if ((writeSql.match(/^begin;/gm) ?? []).length !== 1) {
    throw new Error('Write-SQL darf nur ein BEGIN enthalten.')
  }
  if ((writeSql.match(/^commit;/gm) ?? []).length !== 1) {
    throw new Error('Write-SQL darf nur ein COMMIT enthalten.')
  }
  const rest = writeSqlOhneHistoryLiteral(writeSql, datei)
  if (!/update\s+supabase_migrations\.schema_migrations\s+set\s+statements\s*=/i.test(rest)) {
    throw new Error('Write-SQL aktualisiert nicht nur schema_migrations.statements.')
  }
  const setKlausel = rest.match(
    /update\s+supabase_migrations\.schema_migrations\s+set\s+([\s\S]+?)\s+where\b/i,
  )?.[1]
  if (!setKlausel || !/^\s*statements\s*=/.test(setKlausel) || /\bname\b/i.test(setKlausel)) {
    throw new Error('Write-SQL darf name nicht ändern.')
  }
  if ((rest.match(/\bupdate\s+supabase_migrations\.schema_migrations\b/gi) ?? []).length !== 1) {
    throw new Error('Write-SQL darf nur ein UPDATE enthalten.')
  }
  if (/\bupdate\s+(public\.|jetnity_internal\.|pg_)/i.test(rest)) {
    throw new Error('Write-SQL aktualisiert eine verbotene Relation.')
  }
  if (!rest.includes('get diagnostics') || !rest.includes('row_count')) {
    throw new Error('Write-SQL prüft Rowcount nicht.')
  }
  if (!/if\s+_updated\s*<>\s*1/i.test(rest)) {
    throw new Error('Write-SQL rollt bei Rowcount != 1 nicht zurück.')
  }
  for (const muster of DDL_IM_REPAIR_PFAD) {
    if (muster.test(rest)) {
      throw new Error(`Write-SQL enthält verbotenes DDL/DML im ausführbaren Pfad: ${muster}`)
    }
  }
  if (rest.includes(datei.sql.trim().slice(0, 80))) {
    throw new Error('Kanonisches SQL darf im Repair-Pfad nicht ausführbar vorkommen.')
  }
}

function katalogExactPruefSql(prefix: string): string {
  return `
  if (
    select c.oid
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname = ${sqlLiteral(REPAIR_TABLE)}
       and c.relkind = 'r'
  ) is distinct from ${REPAIR_TABLE_OID} then
    raise exception ${sqlLiteral(`${prefix}: Provenance-Tabelle/OID weicht ab.`)}
      using errcode = 'P0001';
  end if;

  if not exists (
    select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname = ${sqlLiteral(REPAIR_TABLE)}
       and c.relrowsecurity is true
       and c.relforcerowsecurity is false
  ) then
    raise exception ${sqlLiteral(`${prefix}: RLS-Fingerprint weicht ab.`)}
      using errcode = 'P0001';
  end if;

  if (select count(*) from public.trip_item_commercial_provenance) is distinct from 0 then
    raise exception ${sqlLiteral(`${prefix}: Provenance-Rowcount ist nicht 0.`)}
      using errcode = 'P0001';
  end if;

  if coalesce((
    select array_to_string(array(select unnest(c.relacl)::text order by 1), ',')
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = ${sqlLiteral(REPAIR_TABLE)}
  ), '') is distinct from ${sqlLiteral(REPAIR_TABLE_ACL)} then
    raise exception ${sqlLiteral(`${prefix}: Table-ACL weicht ab.`)}
      using errcode = 'P0001';
  end if;

  if (
    select count(*)
      from pg_policy p
      join pg_class c on c.oid = p.polrelid
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relname = ${sqlLiteral(REPAIR_TABLE)}
  ) is distinct from 1 then
    raise exception ${sqlLiteral(`${prefix}: Policy-Count ist nicht 1.`)}
      using errcode = 'P0001';
  end if;

  if not exists (
    select 1
      from pg_policy p
      join pg_class c on c.oid = p.polrelid
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relname = ${sqlLiteral(REPAIR_TABLE)}
       and p.polname = ${sqlLiteral(REPAIR_POLICY)}
       and p.polcmd = 'r'
       and p.polpermissive is true
       and p.polwithcheck is null
       and ${policyQualFingerprintSql('pg_get_expr(p.polqual, p.polrelid)')}
           = ${sqlLiteral(REPAIR_POLICY_QUAL_FINGERPRINT)}
       and coalesce((
         select array_to_string(array(
           select r.rolname
             from unnest(p.polroles) u(oid)
             join pg_roles r on r.oid = u.oid
            order by r.rolname
         ), ',')
       ), '') = ${sqlLiteral(REPAIR_POLICY_ROLES)}
  ) then
    raise exception ${sqlLiteral(`${prefix}: Owner-SELECT-Policy weicht ab.`)}
      using errcode = 'P0001';
  end if;

  if (select count(*) from jetnity_internal.commercial_write_runtime_gate) is distinct from 1
     or not exists (
       select 1
         from jetnity_internal.commercial_write_runtime_gate
        where singleton is true
          and production_write_path_allocated is false
          and allocated_invoker_role is null
          and md5(note) = ${sqlLiteral(md5Hex(REPAIR_GATE_NOTE))}
     ) then
    raise exception ${sqlLiteral(`${prefix}: Commercial Runtime Gate ist nicht geschlossen.`)}
      using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from pg_roles
     where rolname = ${sqlLiteral(REPAIR_WRITER_ROLE)}
       and not rolcanlogin and rolinherit and not rolbypassrls and not rolsuper
  ) or not exists (
    select 1 from pg_roles
     where rolname = ${sqlLiteral(REPAIR_RUNTIME_ROLE)}
       and not rolcanlogin and not rolinherit and not rolbypassrls and not rolsuper
  ) or ${rollenMitgliederSql(REPAIR_WRITER_ROLE)} is distinct from ${sqlLiteral(REPAIR_WRITER_MEMBERS)}
    or ${rollenMitgliederSql(REPAIR_RUNTIME_ROLE)} is distinct from ${sqlLiteral(REPAIR_RUNTIME_MEMBERS)} then
    raise exception ${sqlLiteral(`${prefix}: Rollen-Fingerprint weicht ab.`)}
      using errcode = 'P0001';
  end if;

  if md5(pg_get_functiondef(${sqlLiteral(REPAIR_FUNCTION_IDENTITY)}::regprocedure))
       is distinct from ${sqlLiteral(REPAIR_FUNCTION_MD5)}
     or not exists (
       select 1
         from pg_proc p
         join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = ${sqlLiteral(REPAIR_FUNCTION_SCHEMA)}
          and p.proname = ${sqlLiteral(REPAIR_FUNCTION_NAME)}
          and p.prosecdef is true
          and pg_get_function_identity_arguments(p.oid) = '_eingabe jsonb'
          and coalesce(array_to_string(p.proconfig, ','), '') = ${sqlLiteral(REPAIR_FUNCTION_CONFIG)}
          and coalesce((
            select array_to_string(array(select unnest(p.proacl)::text order by 1), ',')
          ), '') = ${sqlLiteral(REPAIR_FUNCTION_ACL)}
     ) then
    raise exception ${sqlLiteral(`${prefix}: Writer-Funktion weicht ab.`)}
      using errcode = 'P0001';
  end if;
`
}

export function writeTransactionSql(datei: HistoryRepairDatei): string {
  if (datei.version !== REPAIR_VERSION || datei.name !== REPAIR_NAME || datei.datei !== REPAIR_DATEI) {
    throw new Error('Repair-Transaktion akzeptiert nur 20260829140000 / trip_item_commercial_provenance.')
  }
  if (datei.gitBlob !== REPAIR_GIT_BLOB || datei.md5 !== REPAIR_SQL_MD5) {
    throw new Error('Repair-Transaktion akzeptiert nur den kanonischen Blob/MD5.')
  }
  const block = `
do $${REPAIR_DO_TAG}$
declare
  _updated integer;
  _version text;
  _name text;
  _count integer;
  _md5 text;
  _after_md5 text;
  _after_name text;
  _after_count integer;
begin
  select version, name, cardinality(statements), md5(statements[1])
    into _version, _name, _count, _md5
    from supabase_migrations.schema_migrations
   where version = ${sqlLiteral(REPAIR_VERSION)}
   for update;

  if not found then
    raise exception 'Repair preflight: Version % fehlt.', ${sqlLiteral(REPAIR_VERSION)}
      using errcode = 'P0001';
  end if;
  if _name is distinct from ${sqlLiteral(REPAIR_NAME)} then
    raise exception 'Repair preflight: Name weicht ab (%).', _name
      using errcode = 'P0001';
  end if;
  if _count is distinct from 1 then
    raise exception 'Repair preflight: statement_count ist nicht 1 (%).', _count
      using errcode = 'P0001';
  end if;
  if _md5 is distinct from ${sqlLiteral(REPAIR_MARKER_MD5)} then
    raise exception 'Repair preflight: Marker-MD5 weicht ab (%).', _md5
      using errcode = 'P0001';
  end if;

${katalogExactPruefSql('Repair preflight')}

  update supabase_migrations.schema_migrations
     set statements = ${historyStatementsArraySql(datei.sql)}
   where version = ${sqlLiteral(REPAIR_VERSION)}
     and name = ${sqlLiteral(REPAIR_NAME)}
     and cardinality(statements) = 1
     and md5(statements[1]) = ${sqlLiteral(REPAIR_MARKER_MD5)};

  get diagnostics _updated = row_count;
  if _updated <> 1 then
    raise exception 'Repair rowcount is not 1 (%). Rollback.', _updated
      using errcode = 'P0001';
  end if;

  select name, cardinality(statements), md5(statements[1])
    into _after_name, _after_count, _after_md5
    from supabase_migrations.schema_migrations
   where version = ${sqlLiteral(REPAIR_VERSION)};
  if _after_name is distinct from ${sqlLiteral(REPAIR_NAME)}
     or _after_count is distinct from 1
     or _after_md5 is distinct from ${sqlLiteral(datei.md5)}
     or _after_md5 = ${sqlLiteral(REPAIR_MARKER_MD5)} then
    raise exception 'Repair after-probe: History-Body/Name/Count weicht ab.'
      using errcode = 'P0001';
  end if;

${katalogExactPruefSql('Repair after-probe')}
end
$${REPAIR_DO_TAG}$;
`.trim()

  const sql = ['begin;', sqlStatement(block), 'commit;'].join('\n\n')
  writeSqlIstFailClosed(sql, datei)
  return sql
}

export function afterProbeSql(): string {
  return preflightSql()
}

export function keineSecrets(text: string): void {
  if (
    /eyJ[A-Za-z0-9_-]{20,}/.test(text) ||
    /sbp_[A-Za-z0-9]+/.test(text) ||
    /postgres(ql)?:\/\//i.test(text) ||
    /SUPABASE_ACCESS_TOKEN\s*=/.test(text)
  ) {
    throw new Error('Ausgabe würde ein Secret enthalten. Abgebrochen.')
  }
}
