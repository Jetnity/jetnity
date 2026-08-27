// Gate-B-Playbook für das TW6-B Day→Stage-Mode-Bundle.
//
// Vertrag (Gate 0B / P1-TW6-B-ROLLOUT-08):
// 1. Write-Gate committed setzen und verifizieren, bevor die Migrationstransaktion startet.
// 2. Vier geprüfte Migrationen + schema_migrations-History in EINER Transaktion.
// 3. Keine öffentlich sichtbare 26220000-/26230000-/26240000-Zwischenwahrheit.
// 4. Finalen Mode-Vertrag inkl. 0-Stage fail-closed prüfen, bevor Grants wieder geöffnet werden.
// 5. Bei Fehler ROLLBACK; Write-Gate bleibt geschlossen.
// 6. History entspricht exakt dem ausgeführten SQL. Kein vortäuschen.
// 7. Production-Apply bleibt in diesem Slice hart blockiert.

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { sqlLiteral } from '@/lib/rollout/sql-literal'

export const GATE_B_VERSIONEN = new Set([
  '20260826220000',
  '20260826230000',
  '20260826240000',
  '20260827010000',
])

export const GATE_B_REIHENFOLGE = [
  '20260826220000',
  '20260826230000',
  '20260826240000',
  '20260827010000',
] as const

export const GATE_B_DATEIEN = [
  {
    datei: '20260826220000_trip_day_stage_assignment_source.sql',
    version: '20260826220000',
    name: 'trip_day_stage_assignment_source',
    sha256: 'ab06e875e88f69b009837e1c8873e5322199da812b62f4ac1065a028f73cf883',
  },
  {
    datei: '20260826230000_trip_day_stage_assignment_source_fail_closed.sql',
    version: '20260826230000',
    name: 'trip_day_stage_assignment_source_fail_closed',
    sha256: '7e2e30246f1d9976b868751a6cc79087e537bbd36fb8f0dabf829b98258117a9',
  },
  {
    datei: '20260826240000_trip_day_stage_assignment_mode.sql',
    version: '20260826240000',
    name: 'trip_day_stage_assignment_mode',
    sha256: '7a9626d8ac53ea3458bf7d622ea695cce26360962c02430d8d1a0094129a1edb',
  },
  {
    datei: '20260827010000_reise_anlegen_zero_stage_fail_closed.sql',
    version: '20260827010000',
    name: 'reise_anlegen_zero_stage_fail_closed',
    sha256: 'b516bfff24e9e6f5dd909a9cfd4e76aa1a54708b067d1a5d3e935b8482c6adf1',
  },
] as const

export const VERBOTENE_VERSIONEN = [
  '20260826052735',
  '20260826090000',
] as const

export const PRODUCTION_APPLY_FREIGEGEBEN = false
export const PRODUCTION_APPLY_BLOCK_TEXT =
  'PRODUCTION EXECUTION BLOCKED. Gate-B Production-Apply ist in diesem Slice nicht freigegeben.'

const PROPORTIONALER_CTE =
  'greatest(1, ceil(t.nr::numeric * e.anzahl / greatest(t.anzahl, 1)))'

export type GateBDatei = {
  datei: string
  version: string
  name: string
  sha256: string
  sql: string
}

export type GrantSnapshot = {
  auth_trips_insert: boolean
  auth_rpc: boolean
  anon_trips_insert: boolean
  anon_rpc: boolean
}

export type GateBAuftrag =
  | { modus: 'probe'; ziel: 'lokal' | 'entwicklung' }
  | { modus: 'write-gate-roundtrip' }
  | { modus: 'fail-path' }
  | { modus: 'apply'; ziel: 'entwicklung' }
  | { modus: 'produktion-blockiert' }

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

function sha256HexDatei(inhalt: string | Buffer): string {
  return createHash('sha256').update(inhalt).digest('hex')
}

function migrationenVerzeichnis(wurzel = process.cwd()): string {
  return join(wurzel, 'supabase/migrations')
}

export function gateBDateienLesenUndPruefen(wurzel = process.cwd()): GateBDatei[] {
  return GATE_B_DATEIEN.map((meta) => {
    const sql = readFileSync(join(migrationenVerzeichnis(wurzel), meta.datei))
    const sha256 = sha256HexDatei(sql)
    if (sha256 !== meta.sha256) {
      throw new Error(
        `${meta.datei} ist nicht hash-identisch mit dem geprüften Gate-0B-Stand. ` +
          `erwartet ${meta.sha256}, gefunden ${sha256}. Abgebrochen.`,
      )
    }
    return { ...meta, sql: sql.toString('utf8') }
  })
}

export function historyInsertSql(datei: GateBDatei): string {
  return `insert into supabase_migrations.schema_migrations (version, name, statements)
values (${sqlLiteral(datei.version)}, ${sqlLiteral(datei.name)}, array[${sqlLiteral(datei.sql)}])`
}

export function writeGateSql(): string {
  return [
    'revoke execute on function public.reise_anlegen(jsonb) from authenticated, public, anon;',
    'revoke insert on table public.trips from authenticated;',
  ].join('\n')
}

export function writeGateVerifySql(): string {
  return `
select
  has_table_privilege('authenticated', 'public.trips', 'INSERT') as auth_trips_insert,
  has_table_privilege('anon', 'public.trips', 'INSERT') as anon_trips_insert,
  has_function_privilege('authenticated', 'public.reise_anlegen(jsonb)', 'EXECUTE') as auth_rpc,
  has_function_privilege('anon', 'public.reise_anlegen(jsonb)', 'EXECUTE') as anon_rpc
`.trim()
}

export function grantSnapshotSql(): string {
  return writeGateVerifySql()
}

export function snapshotAusZeilen(zeilen: GrantSnapshot[] | GrantSnapshot): GrantSnapshot {
  const zeile = Array.isArray(zeilen) ? zeilen[0] : zeilen
  if (!zeile) {
    throw new Error('Grant-Snapshot leer. Abgebrochen.')
  }
  return {
    auth_trips_insert: Boolean(zeile.auth_trips_insert),
    auth_rpc: Boolean(zeile.auth_rpc),
    anon_trips_insert: Boolean(zeile.anon_trips_insert),
    anon_rpc: Boolean(zeile.anon_rpc),
  }
}

export function writeGateIstGeschlossen(stand: GrantSnapshot): boolean {
  return (
    stand.auth_trips_insert === false &&
    stand.auth_rpc === false &&
    stand.anon_trips_insert === false &&
    stand.anon_rpc === false
  )
}

export function grantsStimmenMitSnapshot(stand: GrantSnapshot, snapshot: GrantSnapshot): boolean {
  return (
    stand.auth_trips_insert === snapshot.auth_trips_insert &&
    stand.auth_rpc === snapshot.auth_rpc &&
    stand.anon_trips_insert === snapshot.anon_trips_insert &&
    stand.anon_rpc === snapshot.anon_rpc
  )
}

export function restoreGrantsSql(snapshot: GrantSnapshot): string {
  const teile: string[] = [
    'revoke execute on function public.reise_anlegen(jsonb) from public, anon;',
    snapshot.anon_rpc
      ? 'grant execute on function public.reise_anlegen(jsonb) to anon;'
      : 'revoke execute on function public.reise_anlegen(jsonb) from anon;',
    snapshot.auth_rpc
      ? 'grant execute on function public.reise_anlegen(jsonb) to authenticated;'
      : 'revoke execute on function public.reise_anlegen(jsonb) from authenticated;',
    snapshot.anon_trips_insert
      ? 'grant insert on table public.trips to anon;'
      : 'revoke insert on table public.trips from anon;',
    snapshot.auth_trips_insert
      ? 'grant insert on table public.trips to authenticated;'
      : 'revoke insert on table public.trips from authenticated;',
  ]
  return teile.join('\n')
}

export function verifyFinalContractSql(): string {
  return `
do $gate_b_verify$
declare
  _mode_col boolean;
  _source_col boolean;
  _constraint text;
  _fn text;
  _history integer;
begin
  select exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name = 'trips'
       and column_name = 'day_stage_assignment_mode'
       and is_nullable = 'NO'
       and column_default = '''legacy_fallback''::text'
  ) into _mode_col;
  if not _mode_col then
    raise exception 'Gate-B-Verify: day_stage_assignment_mode fehlt oder ist nicht NOT NULL DEFAULT legacy_fallback'
      using errcode = 'P0001';
  end if;

  select exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name = 'trips'
       and column_name = 'day_stage_assignment_source'
  ) into _source_col;
  if _source_col then
    raise exception 'Gate-B-Verify: day_stage_assignment_source darf nach 26240000 nicht mehr existieren'
      using errcode = 'P0001';
  end if;

  select pg_get_constraintdef(con.oid) into _constraint
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
   where nsp.nspname = 'public'
     and rel.relname = 'trips'
     and con.conname = 'trips_day_stage_assignment_mode_check';
  if _constraint is null
     or _constraint not like '%legacy_fallback%'
     or _constraint not like '%unassigned%'
     or _constraint not like '%single_destination%'
     or _constraint not like '%explicit%'
     or _constraint like '%''user''%' then
    raise exception 'Gate-B-Verify: finale Mode-Constraint fehlt oder ist falsch: %', _constraint
      using errcode = 'P0001';
  end if;

  _fn := pg_get_functiondef('public.reise_anlegen(jsonb)'::regprocedure);
  if _fn not like '%day_stage_assignment_mode%' then
    raise exception 'Gate-B-Verify: RPC schreibt day_stage_assignment_mode nicht'
      using errcode = 'P0001';
  end if;
  if _fn like '%${PROPORTIONALER_CTE}%' then
    raise exception 'Gate-B-Verify: proportionaler CTE ist noch in reise_anlegen'
      using errcode = 'P0001';
  end if;
  if _fn like '%_assignment_mode := ''legacy_fallback''%' then
    raise exception 'Gate-B-Verify: RPC kann legacy_fallback neu minten'
      using errcode = 'P0001';
  end if;
  if _fn not like '%_assignment_mode := ''single_destination''%'
     or _fn not like '%_assignment_mode := ''explicit''%'
     or _fn not like '%_assignment_mode := ''unassigned''%' then
    raise exception 'Gate-B-Verify: Mode-aware Ableitung unvollständig'
      using errcode = 'P0001';
  end if;
  if _fn not like '%if _stage_count < 1 then%'
     or _fn not like '%elsif _stage_count = 1 then%' then
    raise exception 'Gate-B-Verify: 0-Stage fail-closed / single_destination=genau-eine-Stage fehlt'
      using errcode = 'P0001';
  end if;
  if _fn like '%_stage_count <= 1 then%' then
    raise exception 'Gate-B-Verify: alter <=1-Pfad würde 0 Stages als single_destination minten'
      using errcode = 'P0001';
  end if;
  if _fn not like '%when coalesce(nullif(p.wert ->> ''kind'', ''''), ''note'') = ''flight'' then null%' then
    raise exception 'Gate-B-Verify: Commercial-Gate-A-Nullung der Flug-Handelsfelder fehlt'
      using errcode = 'P0001';
  end if;
  if not exists (
    select 1
      from pg_trigger trg
      join pg_class rel on rel.oid = trg.tgrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
     where nsp.nspname = 'public'
       and rel.relname = 'trip_items'
       and trg.tgname = 'trip_items_flug_handelsfelder_schuetzen'
       and not trg.tgisinternal
       and trg.tgenabled <> 'D'
  ) then
    raise exception 'Gate-B-Verify: Commercial-Gate-A-Trigger trip_items_flug_handelsfelder_schuetzen fehlt'
      using errcode = 'P0001';
  end if;

  select count(*)::int into _history
    from supabase_migrations.schema_migrations
   where version in (
     '20260826220000', '20260826230000', '20260826240000', '20260827010000'
   );
  if _history <> 4 then
    raise exception 'Gate-B-Verify: schema_migrations enthält nicht genau die vier Gate-B-Versionen (%).', _history
      using errcode = 'P0001';
  end if;
end
$gate_b_verify$;
`.trim()
}

export function migrationTransactionSql(dateien: readonly GateBDatei[]): string {
  if (dateien.length !== GATE_B_REIHENFOLGE.length) {
    throw new Error('Gate-B-Transaktion braucht genau die vier geprüften Dateien.')
  }
  const versions = dateien.map((datei) => datei.version)
  if (
    versions[0] !== GATE_B_REIHENFOLGE[0] ||
    versions[1] !== GATE_B_REIHENFOLGE[1] ||
    versions[2] !== GATE_B_REIHENFOLGE[2] ||
    versions[3] !== GATE_B_REIHENFOLGE[3]
  ) {
    throw new Error('Gate-B-Reihenfolge muss 26220000 → 26230000 → 26240000 → 27010000 sein.')
  }

  return [
    'begin;',
    dateien[0]!.sql,
    historyInsertSql(dateien[0]!),
    dateien[1]!.sql,
    historyInsertSql(dateien[1]!),
    dateien[2]!.sql,
    historyInsertSql(dateien[2]!),
    dateien[3]!.sql,
    historyInsertSql(dateien[3]!),
    writeGateSql(),
    verifyFinalContractSql(),
    'commit;',
  ].join('\n\n')
}

export function failPathSql(): string {
  return `
begin;
insert into supabase_migrations.schema_migrations (version, name, statements)
values ('20260826240000', 'gate_b_fail_path_probe', array['should_not_commit']);
commit;
`.trim()
}

export function historyStimmtMitDateien(
  gespeichert: { version: string; statements: string[] | null },
  datei: GateBDatei,
): boolean {
  const statement = gespeichert.statements?.[0]
  return (
    gespeichert.version === datei.version &&
    typeof statement === 'string' &&
    sha256HexDatei(statement) === datei.sha256 &&
    statement === datei.sql
  )
}

export function gateBAuftragLesen(argv: readonly string[]): GateBAuftrag {
  const entwicklung = hatFlag(argv, 'entwicklung')
  const produktion = hatFlag(argv, 'produktion')
  const schreiben = hatFlag(argv, 'schreiben')
  const writeGate = hatFlag(argv, 'write-gate-roundtrip')
  const failPath = hatFlag(argv, 'fail-path')
  const apply = hatFlag(argv, 'apply')

  if (entwicklung && produktion) {
    throw new Error('--entwicklung und --produktion schliessen einander aus.')
  }
  if (produktion) {
    const ref = argument(argv, 'projekt-ref')
    if (!schreiben || !ref) {
      throw new Error(
        'Production-Pfad braucht --schreiben --produktion --projekt-ref. Dieser Slice bleibt trotzdem blockiert.',
      )
    }
    return { modus: 'produktion-blockiert' }
  }
  if (!schreiben) {
    return { modus: 'probe', ziel: entwicklung ? 'entwicklung' : 'lokal' }
  }
  if (!entwicklung) {
    throw new Error('Schreiben braucht --schreiben --entwicklung. Production bleibt blockiert.')
  }
  if ([writeGate, failPath, apply].filter(Boolean).length !== 1) {
    throw new Error(
      'Development-Schreiben braucht genau eines von --write-gate-roundtrip, --fail-path oder --apply.',
    )
  }
  if (writeGate) return { modus: 'write-gate-roundtrip' }
  if (failPath) return { modus: 'fail-path' }
  return { modus: 'apply', ziel: 'entwicklung' }
}

export function productionApplyAblehnen(): never {
  if (PRODUCTION_APPLY_FREIGEGEBEN) {
    throw new Error(
      'PRODUCTION_APPLY_FREIGEGEBEN ist true, aber dieser Slice darf Production trotzdem nicht schreiben.',
    )
  }
  throw new Error(PRODUCTION_APPLY_BLOCK_TEXT)
}

export function anwendenDarfGateBNichtEnthalten(offen: readonly { version: string; datei: string }[]): void {
  const betroffen = offen.filter((m) => GATE_B_VERSIONEN.has(m.version))
  if (betroffen.length > 0) {
    throw new Error(
      `Gate-B-Bundle (${betroffen.map((m) => m.datei).join(', ')}) darf nicht dateiweise über db:anwenden laufen.`,
    )
  }
}
