// Einmal-Apply-Pfad nur für P1-AAL2-PROD-01.
//
// Genau eine Datei: 20260827170000_admin_aal2_data_plane_alignment.sql.
// Default = lokale Probe, kein Write.
// Production-Write nur mit --schreiben --produktion --projekt-ref qscbgcdmivbbnzrcyegn.
// SQL + schema_migrations-History in EINER Transaktion. Kein MCP-Timestamp.
// db:anwenden bleibt auf der Phase-3.1-Grenze; dieser Runner lockert sie nicht.

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { PRODUCTION_GRENZE_VERSION } from '@/lib/rollout/anwenden-grenze'
import { refsStimmenUeberein } from '@/lib/rollout/schreibauftrag'
import { sqlLiteral } from '@/lib/rollout/sql-literal'

export const AAL2_ALIGN_DATEI = '20260827170000_admin_aal2_data_plane_alignment.sql'
export const AAL2_ALIGN_VERSION = '20260827170000'
export const AAL2_ALIGN_NAME = 'admin_aal2_data_plane_alignment'
export const AAL2_ALIGN_SHA256 =
  'ac4faa87bf994a1fcbad2212384cb2308695820b63a57dc41ee9a763515ad934'
export const AAL2_ALIGN_GIT_BLOB = '4d24d28ff5789a253d0abc6ebd8aa0d6e22a2375'
export const AAL2_PROD_HEAD_VERSION = '20260827010000'
export const AAL2_PROD_HEAD_NAME = 'reise_anlegen_zero_stage_fail_closed'
export const AAL2_PROD_PROJEKT_REF = 'qscbgcdmivbbnzrcyegn'

export const AAL2_MINDESTROLLEN = {
  darf_betrieb_lesen: 'moderator',
  darf_betrieb_eingreifen: 'operator',
  darf_konten_verwalten: 'moderator',
  darf_inhalte_moderieren: 'moderator',
  darf_konfiguration_verwalten: 'admin',
} as const

export type Aal2Datei = {
  datei: string
  version: string
  name: string
  sha256: string
  gitBlob: string
  sql: string
}

export type Aal2Auftrag =
  | { modus: 'probe' }
  | { modus: 'preflight'; bestaetigterRef: string }
  | { modus: 'apply'; bestaetigterRef: string }
  | { modus: 'entwicklung-probe' }

export type RlsSnapshotZeile = {
  nspname: string
  relname: string
  polname: string
  qual: string | null
  with_check: string | null
  cmd: string
}

export const AAL2_FAIL_PATH_VERSION = '29990101000000'
export const AAL2_FAIL_PATH_NAME = 'aal2_fail_path_probe'
export const AAL2_FAIL_PATH_FUNKTION = 'darf_betrieb_lesen'

export type Aal2PreflightStand = {
  head_version: string | null
  head_name: string | null
  align_count: number
  aal2_fn_exists: boolean
}

type Umgebung = { SUPABASE_PROJECT_REF?: string | undefined }

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

export function sha256Hex(inhalt: string | Buffer): string {
  return createHash('sha256').update(inhalt).digest('hex')
}

export function gitBlobSha1(inhalt: Buffer): string {
  return createHash('sha1')
    .update(Buffer.from(`blob ${inhalt.length}\0`))
    .update(inhalt)
    .digest('hex')
}

function migrationenVerzeichnis(wurzel = process.cwd()): string {
  return join(wurzel, 'supabase/migrations')
}

export function aal2DateiLesenUndPruefen(wurzel = process.cwd()): Aal2Datei {
  const raw = readFileSync(join(migrationenVerzeichnis(wurzel), AAL2_ALIGN_DATEI))
  const sha256 = sha256Hex(raw)
  const gitBlob = gitBlobSha1(raw)
  if (sha256 !== AAL2_ALIGN_SHA256) {
    throw new Error(
      `${AAL2_ALIGN_DATEI} ist nicht hash-identisch mit dem reviewten Vertrag. ` +
        `erwartet SHA-256 ${AAL2_ALIGN_SHA256}, gefunden ${sha256}. Abgebrochen.`,
    )
  }
  if (gitBlob !== AAL2_ALIGN_GIT_BLOB) {
    throw new Error(
      `${AAL2_ALIGN_DATEI} ist nicht blob-identisch mit dem reviewten Vertrag. ` +
        `erwartet Git-Blob ${AAL2_ALIGN_GIT_BLOB}, gefunden ${gitBlob}. Abgebrochen.`,
    )
  }
  return {
    datei: AAL2_ALIGN_DATEI,
    version: AAL2_ALIGN_VERSION,
    name: AAL2_ALIGN_NAME,
    sha256,
    gitBlob,
    sql: raw.toString('utf8'),
  }
}

export function sqlStatement(sql: string): string {
  const getrimmt = sql.trim()
  if (!getrimmt) {
    throw new Error('Leeres SQL-Statement.')
  }
  return getrimmt.endsWith(';') ? getrimmt : `${getrimmt};`
}

export function historyInsertSql(datei: Aal2Datei): string {
  return sqlStatement(`insert into supabase_migrations.schema_migrations (version, name, statements)
values (${sqlLiteral(datei.version)}, ${sqlLiteral(datei.name)}, array[${sqlLiteral(datei.sql)}])`)
}

export function migrationTransactionSql(
  datei: Aal2Datei,
  snapshot: readonly RlsSnapshotZeile[],
): string {
  if (datei.version !== AAL2_ALIGN_VERSION || datei.name !== AAL2_ALIGN_NAME) {
    throw new Error('AAL2-Transaktion akzeptiert nur 20260827170000 / admin_aal2_data_plane_alignment.')
  }
  if (datei.datei !== AAL2_ALIGN_DATEI) {
    throw new Error('AAL2-Transaktion liest keine andere Datei.')
  }
  return [
    'begin;',
    sqlStatement(datei.sql),
    historyInsertSql(datei),
    sqlStatement(verifyFinalContractSql(snapshot)),
    'commit;',
  ].join('\n\n')
}

export function migrationRollbackProbeSql(
  datei: Aal2Datei,
  snapshot: readonly RlsSnapshotZeile[],
): string {
  const transaktion = migrationTransactionSql(datei, snapshot)
  if (!transaktion.endsWith('\n\ncommit;')) {
    throw new Error('Rollback-Probe erwartet terminierte Transaktion mit \\n\\ncommit;')
  }
  return `${transaktion.slice(0, -'\n\ncommit;'.length)}\n\nrollback;`
}

export function failPathSql(): string {
  return [
    'begin;',
    sqlStatement(`create or replace function public.${AAL2_FAIL_PATH_FUNKTION}()
returns boolean
language sql
stable
parallel safe
security invoker
set search_path = pg_catalog
as $$
  select true
$$`),
    sqlStatement(`insert into supabase_migrations.schema_migrations (version, name, statements)
values (${sqlLiteral(AAL2_FAIL_PATH_VERSION)}, ${sqlLiteral(AAL2_FAIL_PATH_NAME)}, array['should_not_commit'])`),
    sqlStatement(`do $aal2_fail$
begin
  raise exception 'AAL2 fail-path probe'
    using errcode = 'P0001';
end
$aal2_fail$`),
    'commit;',
  ].join('\n\n')
}

export function rlsSnapshotSql(): string {
  return `
select
  n.nspname,
  c.relname,
  p.polname,
  pg_get_expr(p.polqual, p.polrelid) as qual,
  pg_get_expr(p.polwithcheck, p.polrelid) as with_check,
  p.polcmd::text as cmd
from pg_policy p
join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and (
    (c.relname = 'profiles' and p.polname in ('profiles_lesen', 'profiles_aendern', 'profiles_loeschen'))
    or c.relname like 'trip%'
    or c.relname like 'traveller%'
  )
order by n.nspname, c.relname, p.polname, p.polcmd
`.trim()
}

function rlsText(wert: unknown): string | null {
  if (wert === null || wert === undefined) return null
  return String(wert)
}

export function rlsSnapshotAusZeilen(
  zeilen: RlsSnapshotZeile[] | RlsSnapshotZeile | null | undefined,
): RlsSnapshotZeile[] {
  const liste = Array.isArray(zeilen) ? zeilen : zeilen ? [zeilen] : []
  return liste
    .map((zeile) => ({
      nspname: String(zeile.nspname),
      relname: String(zeile.relname),
      polname: String(zeile.polname),
      qual: rlsText(zeile.qual),
      with_check: rlsText(zeile.with_check),
      cmd: String(zeile.cmd),
    }))
    .sort((a, b) =>
      `${a.nspname}.${a.relname}.${a.polname}.${a.cmd}`.localeCompare(
        `${b.nspname}.${b.relname}.${b.polname}.${b.cmd}`,
      ),
    )
}

export function rlsSnapshotsGleich(
  vorher: readonly RlsSnapshotZeile[],
  nachher: readonly RlsSnapshotZeile[],
): boolean {
  return JSON.stringify(rlsSnapshotAusZeilen([...vorher])) === JSON.stringify(rlsSnapshotAusZeilen([...nachher]))
}

function rlsLiteral(wert: string | null): string {
  return wert === null ? 'null::text' : sqlLiteral(wert)
}

export function rlsSnapshotValuesSql(snapshot: readonly RlsSnapshotZeile[]): string {
  const zeilen = rlsSnapshotAusZeilen([...snapshot])
  if (zeilen.length === 0) {
    throw new Error('RLS-Snapshot leer. Abgebrochen.')
  }
  const values = zeilen
    .map(
      (zeile) =>
        `(${sqlLiteral(zeile.nspname)}, ${sqlLiteral(zeile.relname)}, ${sqlLiteral(zeile.polname)}, ${rlsLiteral(zeile.qual)}, ${rlsLiteral(zeile.with_check)}, ${sqlLiteral(zeile.cmd)})`,
    )
    .join(',\n    ')
  return `select * from (values
    ${values}
  ) as t(nspname, relname, polname, qual, with_check, cmd)`
}

export function capabilityDefinitionSql(name: string): string {
  return `
select pg_get_functiondef(format('public.%I()', ${sqlLiteral(name)})::regprocedure) as definition
`.trim()
}

export function failPathHistorySql(): string {
  return `
select version, name, statements
  from supabase_migrations.schema_migrations
 where version = ${sqlLiteral(AAL2_FAIL_PATH_VERSION)}
    or name = ${sqlLiteral(AAL2_FAIL_PATH_NAME)}
`.trim()
}

export function historyStimmtMitDatei(
  gespeichert: { version: string; name?: string | null; statements: string[] | null },
  datei: Aal2Datei,
): boolean {
  const statement = gespeichert.statements?.[0]
  return (
    gespeichert.version === datei.version &&
    gespeichert.name === datei.name &&
    typeof statement === 'string' &&
    sha256Hex(statement) === datei.sha256 &&
    statement === datei.sql
  )
}

export function preflightSql(): string {
  return `
select
  (select version from supabase_migrations.schema_migrations order by version desc limit 1)
    as head_version,
  (select name from supabase_migrations.schema_migrations order by version desc limit 1)
    as head_name,
  (select count(*)::int from supabase_migrations.schema_migrations
    where version = ${sqlLiteral(AAL2_ALIGN_VERSION)})
    as align_count,
  exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'aktuelles_admin_aal2'
       and pg_get_function_identity_arguments(p.oid) = ''
  ) as aal2_fn_exists
`.trim()
}

export function preflightStandAusZeilen(
  zeilen: Aal2PreflightStand[] | Aal2PreflightStand,
): Aal2PreflightStand {
  const zeile = Array.isArray(zeilen) ? zeilen[0] : zeilen
  if (!zeile) {
    throw new Error('AAL2-Preflight leer. Abgebrochen.')
  }
  return {
    head_version: zeile.head_version ?? null,
    head_name: zeile.head_name ?? null,
    align_count: Number(zeile.align_count),
    aal2_fn_exists: Boolean(zeile.aal2_fn_exists),
  }
}

export function preflightPasst(stand: Aal2PreflightStand): void {
  if (stand.head_version !== AAL2_PROD_HEAD_VERSION) {
    throw new Error(
      `Production-Head ist nicht ${AAL2_PROD_HEAD_VERSION}. ` +
        `Gefunden: ${stand.head_version ?? 'keiner'}. Abgebrochen.`,
    )
  }
  if (stand.head_name !== AAL2_PROD_HEAD_NAME) {
    throw new Error(
      `Production-Head-Name ist nicht ${AAL2_PROD_HEAD_NAME}. ` +
        `Gefunden: ${stand.head_name ?? 'keiner'}. Abgebrochen.`,
    )
  }
  if (stand.align_count !== 0) {
    throw new Error(
      `${AAL2_ALIGN_VERSION} existiert bereits (${stand.align_count}). Kein erneutes Apply. Abgebrochen.`,
    )
  }
  if (stand.aal2_fn_exists) {
    throw new Error('public.aktuelles_admin_aal2() existiert bereits unerwartet. Abgebrochen.')
  }
}

export function verifyFinalContractSql(snapshot: readonly RlsSnapshotZeile[]): string {
  return `
do $aal2_verify$
declare
  _fn text;
  _def text;
  _prosecdef boolean;
  _config text[];
  _history integer;
  _history_name text;
  _history_stmt text;
  _exec_public boolean;
  _exec_anon boolean;
  _exec_auth boolean;
  _exec_service boolean;
  _rls_diff integer;
  _rolle text;
begin
  if to_regprocedure('public.aktuelles_admin_aal2()') is null then
    raise exception 'AAL2-Verify: aktuelles_admin_aal2() fehlt'
      using errcode = 'P0001';
  end if;

  _def := pg_get_functiondef('public.aktuelles_admin_aal2()'::regprocedure);
  if _def not like '%auth.jwt() ->> ''aal''%' then
    raise exception 'AAL2-Verify: AAL-Truth ist nicht auth.jwt() ->> aal'
      using errcode = 'P0001';
  end if;
  if _def not like '%coalesce(%' then
    raise exception 'AAL2-Verify: fail-closed coalesce fehlt'
      using errcode = 'P0001';
  end if;
  if _def like '%nextLevel%'
     or _def like '%factor%'
     or _def like '%user_metadata%'
     or _def like '%amr%' then
    raise exception 'AAL2-Verify: unerlaubte AAL-Quelle'
      using errcode = 'P0001';
  end if;

  foreach _fn in array array[
    'aktuelles_admin_aal2',
    'darf_betrieb_lesen',
    'darf_betrieb_eingreifen',
    'darf_konten_verwalten',
    'darf_inhalte_moderieren',
    'darf_konfiguration_verwalten'
  ] loop
    if to_regprocedure(format('public.%I()', _fn)) is null then
      raise exception 'AAL2-Verify: Funktion % fehlt', _fn
        using errcode = 'P0001';
    end if;

    select p.prosecdef, p.proconfig
      into _prosecdef, _config
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = _fn
       and pg_get_function_identity_arguments(p.oid) = '';
    if _prosecdef then
      raise exception 'AAL2-Verify: % ist nicht SECURITY INVOKER', _fn
        using errcode = 'P0001';
    end if;
    if _config is null or not ('search_path=pg_catalog' = any (_config)) then
      raise exception 'AAL2-Verify: % hat nicht search_path=pg_catalog', _fn
        using errcode = 'P0001';
    end if;

    _exec_public := has_function_privilege('public', format('public.%I()', _fn), 'EXECUTE');
    _exec_anon := has_function_privilege('anon', format('public.%I()', _fn), 'EXECUTE');
    _exec_auth := has_function_privilege('authenticated', format('public.%I()', _fn), 'EXECUTE');
    _exec_service := has_function_privilege('service_role', format('public.%I()', _fn), 'EXECUTE');
    if _exec_public or _exec_anon or not _exec_auth or not _exec_service then
      raise exception
        'AAL2-Verify: EXECUTE für % unerwartet (public=% anon=% auth=% service=%)',
        _fn, _exec_public, _exec_anon, _exec_auth, _exec_service
        using errcode = 'P0001';
    end if;
  end loop;

  for _fn, _rolle in
    select * from (values
      ('darf_betrieb_lesen', 'moderator'),
      ('darf_betrieb_eingreifen', 'operator'),
      ('darf_konten_verwalten', 'moderator'),
      ('darf_inhalte_moderieren', 'moderator'),
      ('darf_konfiguration_verwalten', 'admin')
    ) as t(fn, rolle)
  loop
    _def := pg_get_functiondef(format('public.%I()', _fn)::regprocedure);
    if _def not like '%hat_rolle_mindestens(''' || _rolle || ''')%' then
      raise exception 'AAL2-Verify: % hat nicht Mindestrolle %', _fn, _rolle
        using errcode = 'P0001';
    end if;
    if _def not like '%aktuelles_admin_aal2()%' then
      raise exception 'AAL2-Verify: % verlangt nicht aktuelles_admin_aal2()', _fn
        using errcode = 'P0001';
    end if;
  end loop;

  select count(*)::int, min(name), min(statements[1])
    into _history, _history_name, _history_stmt
    from supabase_migrations.schema_migrations
   where version = ${sqlLiteral(AAL2_ALIGN_VERSION)};
  if _history <> 1 then
    raise exception 'AAL2-Verify: History-Count für ${AAL2_ALIGN_VERSION} ist % statt 1', _history
      using errcode = 'P0001';
  end if;
  if _history_name is distinct from ${sqlLiteral(AAL2_ALIGN_NAME)} then
    raise exception 'AAL2-Verify: History-Name ist %', _history_name
      using errcode = 'P0001';
  end if;
  if _history_stmt is null or length(_history_stmt) = 0 then
    raise exception 'AAL2-Verify: History-Statement fehlt'
      using errcode = 'P0001';
  end if;

  select count(*)::int into _rls_diff
    from (
      (select * from (${rlsSnapshotValuesSql(snapshot)}) e
       except
       select * from (${rlsSnapshotSql()}) a)
      union all
      (select * from (${rlsSnapshotSql()}) a
       except
       select * from (${rlsSnapshotValuesSql(snapshot)}) e)
    ) d;
  if _rls_diff <> 0 then
    raise exception 'AAL2-Verify: profiles_/Trip/Traveller-RLS weicht vom Preflight-Snapshot ab (%)', _rls_diff
      using errcode = 'P0001';
  end if;
end
$aal2_verify$;
`.trim()
}

export function aal2AuftragLesen(
  argv: readonly string[],
  umgebung: Umgebung | NodeJS.ProcessEnv = process.env,
): Aal2Auftrag {
  if (hatFlag(argv, 'entwicklung-probe')) {
    if (hatFlag(argv, 'schreiben') || hatFlag(argv, 'produktion')) {
      throw new Error('--entwicklung-probe darf nicht mit Production-Write kombiniert werden.')
    }
    return { modus: 'entwicklung-probe' }
  }
  if (hatFlag(argv, 'entwicklung')) {
    throw new Error(
      'Dieser Einmal-Runner akzeptiert kein --entwicklung. Nur lokale Probe, --entwicklung-probe oder Production.',
    )
  }
  const schreiben = hatFlag(argv, 'schreiben')
  const produktion = hatFlag(argv, 'produktion')
  const genannt = argument(argv, 'projekt-ref')

  if (genannt && !produktion) {
    throw new Error('--projekt-ref gilt nur mit --produktion.')
  }
  if (schreiben && !produktion) {
    throw new Error('Schreiben braucht --schreiben --produktion --projekt-ref.')
  }
  if (!produktion) {
    return { modus: 'probe' }
  }
  if (genannt !== AAL2_PROD_PROJEKT_REF) {
    throw new Error(
      `Production-Ziel muss exakt ${AAL2_PROD_PROJEKT_REF} sein. Abgebrochen.`,
    )
  }
  const bestaetigterRef = refsStimmenUeberein(umgebung.SUPABASE_PROJECT_REF, genannt)
  if (!schreiben) {
    return { modus: 'preflight', bestaetigterRef }
  }
  return { modus: 'apply', bestaetigterRef }
}

export function anwendenDarfAal2AlignmentNichtAufProduction(
  modus: 'entwicklung' | 'produktion',
  offen: readonly { version: string; datei: string }[],
): void {
  if (modus !== 'produktion') return
  const betroffen = offen.filter((eintrag) => eintrag.version === AAL2_ALIGN_VERSION)
  if (betroffen.length > 0) {
    throw new Error(
      `AAL2-Alignment (${betroffen.map((eintrag) => eintrag.datei).join(', ')}) ` +
        'darf nicht über db:anwenden auf Production. Nutze npm run db:aal2-prod-apply. Abgebrochen.',
    )
  }
}

export function phase31GrenzeUnveraendert(): void {
  if (PRODUCTION_GRENZE_VERSION !== '20260820130000') {
    throw new Error(
      `Phase-3.1-Production-Grenze wurde verändert (${PRODUCTION_GRENZE_VERSION}). ` +
        'Dieser Runner darf db:anwenden nicht öffnen.',
    )
  }
}
