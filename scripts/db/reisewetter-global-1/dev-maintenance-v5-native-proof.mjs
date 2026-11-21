// Socket-free PostgreSQL 17 tests using the actual maintenance installer SQL.
// Run with repository dependencies installed and local PostgreSQL 17 binaries:
//   node --import tsx <this-file.mjs> [report.json] [installer-relative-to-repo.sql]
// Defaults: a new temporary report directory and the committed Dev v5 installer.
// The existing OwnedSingleProof owns/cleans an isolated single-user cluster. It
// refuses remote database environment variables. No hosted URL, live identity,
// clock override or historical full-catalog assertion is used by this fixture.
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const require = createRequire(import.meta.url)
const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const stateRelative = 'scripts/db/official-truth-v3-background-guard-1/parts/state.sql'
function findRepo(start) {
  for (let dir = resolve(start); ; dir = dirname(dir)) {
    if (existsSync(join(dir, stateRelative))) return dir
    if (dirname(dir) === dir) return null
  }
}
const repo = findRepo(scriptDirectory) ?? findRepo(process.cwd())
assert.ok(repo, 'Run inside the Jetnity repository or place this file inside it')
assert.ok(process.argv.length <= 4, 'Usage: node --import tsx <proof.mjs> [report.json] [installer-relative-to-repo.sql]')
const installerPath = resolve(repo, process.argv[3] ?? 'scripts/db/reisewetter-global-1/dev-maintenance-successor-v5-20261121.sql')
const reportPath = process.argv[2] ? resolve(process.argv[2]) : join(mkdtempSync(join(tmpdir(), 'jetnity-maintenance-receipt-report-')), 'report.json')
const { OwnedSingleProof, literal, splitSql } = require(join(repo, 'scripts/db/official-truth-v3-rolling-jobs-quota-1/local-proof.ts'))
const source = readFileSync(installerPath, 'utf8')
const tableStart = source.indexOf('CREATE TABLE official_v3_guard_private.bg1_dev_maintenance_baseline_v5 (')
const tableEnd = source.indexOf('CREATE OR REPLACE FUNCTION official_v3_guard_private.assert_catalog_v1()')
assert.ok(tableStart >= 0 && tableEnd > tableStart, 'Actual installer must contain the expected bounded table DDL')
const tables = source.slice(tableStart, tableEnd)
const createdTables = [...tables.matchAll(/^CREATE TABLE ([a-z_][a-z_0-9]*\.[a-z_][a-z_0-9]*)/gm)].map(m => m[1])
assert.deepEqual(createdTables, ['official_v3_guard_private.bg1_dev_maintenance_baseline_v5', 'official_v3_guard_private.bg1_dev_maintenance_receipts_v1'])
const controls = splitSql(source).filter(sql => /^CREATE OR REPLACE FUNCTION official_v3_guard_private\.check_control_v1\(\)/m.test(sql))
assert.equal(controls.length, 1, 'Exactly one actual check_control_v1 definition')
const control = controls[0]
const original = readFileSync(join(repo, stateRelative), 'utf8')
const sha256 = value => createHash('sha256').update(value).digest('hex')
const hashes = {installer:sha256(source), receiptTables:sha256(tables), checkControl:sha256(control), originalState:sha256(original)}
const guard = 'official_v3_guard_private.'
const owner = 'SET SESSION AUTHORIZATION postgres;SET search_path=pg_catalog;'
const roles = ['anon','authenticated','service_role','supabase_read_only_user','ot_v3_jobs_owner','ot_v3_result_owner','ot_v3_intake_owner']
const p = new OwnedSingleProof()
const results = []
const j = v => literal(JSON.stringify(v)) + '::jsonb'

function seed(o={}) {
  const generation = o.generation ?? 1920
  const resumed = o.resumed ?? 14
  const incident = o.incident ?? 14
  const baseline = {
    singleton:'true', dev_project_ref:literal('yfvbxvijcorffwxbxahl'), incident_generation:'14', previous_resumed_generation:'13',
    incident_at:"timestamptz '2026-11-20 22:55:01.735769+00'",
    predecessor_catalog_digest:literal('fdef57d57b57b0c34184752d8fe347e1d5e84d4909bf71256d64b540ba11fbf9'),
    predecessor_baseline_digest:literal('6246aa0f91b24f1c644a656f13ce5294ed96f9b488993ffbb438f32075cbd83f'),
    required_generation:'1920', proof_not_before:"timestamptz '2026-11-20 23:59:00+00'", catalog:j({fixture:'synthetic local control only'}),
    ...o.baseline,
  }
  const receipt = {
    singleton:'true', dev_project_ref:literal('yfvbxvijcorffwxbxahl'), action:literal('dev_weather_incident14_maintenance'), actor:literal('postgres'),
    incident_generation:'14', previous_resumed_generation:'13', incident_at:"timestamptz '2026-11-20 22:55:01.735769+00'",
    baseline_digest:"encode(sha256(convert_to((to_jsonb(b)||jsonb_build_object('proof_not_before',extract(epoch FROM b.proof_not_before),'incident_at',extract(epoch FROM b.incident_at)))::text,'UTF8')),'hex')",
    method_snapshot:j({status:'approved',syntheticOnly:true}), proof_generation:'1920', proof_due:"timestamptz '2026-11-21 00:00:00+00'",
    started_at:"timestamptz '2026-11-21 00:00:01+00'", proof_started_at:"timestamptz '2026-11-21 00:00:02+00'",
    finished_at:"timestamptz '2026-11-21 00:00:03+00'", valid_until:"timestamptz '2026-11-21 00:05:30+00'",
    recorded_at:"timestamptz '2026-11-21 00:00:05+00'", ...o.receipt,
  }
  let sql = `INSERT INTO ${guard}incidents_v1 SELECT g,timestamptz '2026-11-19 00:00+00'+g*interval '5 minutes','refused',0,timestamptz '2026-11-19 00:00:01+00'+g*interval '5 minutes' FROM generate_series(1,13) g;
    INSERT INTO ${guard}incidents_v1 VALUES(14,'2026-11-20 22:55+00','refused',1918,'2026-11-20 22:55:01.735769+00');
    ${incident===15 ? `INSERT INTO ${guard}incidents_v1 VALUES(15,'2026-11-21 00:05+00','refused',1920,'2026-11-21 00:05:01+00');` : ''}
    INSERT INTO ${guard}runs_v1 SELECT due,due+interval '1 second',due+interval '2 seconds',due+interval '3 seconds','complete',g,0
      FROM (SELECT g,timestamptz '2026-11-20 22:50+00'-(1918-g)*interval '5 minutes' AS due FROM generate_series(1,1918) g) x;
    INSERT INTO ${guard}runs_v1 VALUES('2026-11-20 23:00+00','2026-11-20 23:00:01+00','2026-11-20 23:00:02+00','2026-11-20 23:00:03+00','complete',1919,14);
    ${generation>=1920 && !o.omitRun1920 ? `INSERT INTO ${guard}runs_v1 VALUES('2026-11-21 00:00+00','2026-11-21 00:00:01+00','2026-11-21 00:00:02+00','2026-11-21 00:00:03+00','complete',1920,14);` : ''}
    ${generation>=1921 ? `INSERT INTO ${guard}runs_v1 VALUES('2026-11-21 00:10+00','2026-11-21 00:10:01+00','2026-11-21 00:10:02+00','2026-11-21 00:10:03+00','complete',1921,15);` : ''}
    UPDATE ${guard}state_v1 SET installed_at='2026-11-01 00:00+00',generation=${generation},incident_generation=${incident},
      incident_at=${incident===15 ? "timestamptz '2026-11-21 00:05:01+00'" : "timestamptz '2026-11-20 22:55:01.735769+00'"},
      resumed_generation=${resumed},last_observed='2026-11-21 00:10:05+00',
      last_due=r.due_at,last_started=r.started_at,last_proof_started=r.proof_started_at,last_finished=r.finished_at,valid_until=r.due_at+interval '5 minutes 30 seconds'
      FROM ${guard}runs_v1 r WHERE singleton AND r.generation=${o.omitRun1920 ? 1919 : generation};
    INSERT INTO ${guard}bg1_dev_maintenance_baseline_v5(${Object.keys(baseline).join(',')}) VALUES(${Object.values(baseline).join(',')});`
  for (const gen of [o.owner13===false ? null : 13,o.owner14 ? 14 : null,o.owner15 ? 15 : null].filter(Boolean)) {
    sql += `INSERT INTO ${guard}owner_operations_v1 VALUES(${literal('op3_'+gen.toString(16).padStart(32,'0'))},'resume',repeat('a',64),'00000001-1111-4111-8111-000000000001','2026-11-21 00:10:04+00',${j({schema:1,generation:gen,syntheticOnly:true})});`
  }
  if(o.includeReceipt!==false) sql += `INSERT INTO ${guard}bg1_dev_maintenance_receipts_v1(${Object.keys(receipt).join(',')}) SELECT ${Object.values(receipt).join(',')} FROM ${guard}bg1_dev_maintenance_baseline_v5 b WHERE singleton;`
  return sql
}
function pass(name,sql) {
  p.run(owner+'BEGIN;'+sql+'ROLLBACK;',name)
  results.push({name,status:'PASS'})
}
function rejects(name,sql,pattern) {
  const output=p.run(owner+'BEGIN;'+sql+'ROLLBACK;',name,pattern)
  const lines=output.split('\n').filter(line=>/\b(?:ERROR|FATAL|PANIC):/.test(line) && !/current transaction is aborted/.test(line))
  assert.equal(lines.length,1,name+' must have exactly one expected refusal')
  assert.match(lines[0],pattern)
  results.push({name,status:'PASS',refusal:lines[0].replace(/^.*ERROR:\s*/, '')})
}
const check=`SELECT ${guard}check_control_v1();`
try {
  p.run(`CREATE ROLE postgres NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE BYPASSRLS;
    ${roles.map(role=>`CREATE ROLE ${role} NOLOGIN NOSUPERUSER${role==='service_role'?' BYPASSRLS':''};`).join('\n')}
    GRANT CREATE ON DATABASE postgres TO postgres;${owner}${original}${tables}${control}`, 'actual candidate DDL and check_control compilation')
  pass('valid maintenance 14 with 1920 complete runs',seed()+check)
  pass('installed pending maintenance stays historically consistent at 1919',seed({generation:1919,resumed:13,includeReceipt:false})+check)
  rejects('pending maintenance does not open guard',seed({generation:1919,resumed:13,includeReceipt:false})+`SELECT ${guard}require_open_v1();`,/bg1 integrity unavailable/)
  rejects('missing receipt at resumed 14',seed({includeReceipt:false})+check,/bg1 dev maintenance authority missing/)
  rejects('wrong baseline digest',seed({receipt:{baseline_digest:"repeat('b',64)"}})+check,/bg1 dev maintenance history/)
  rejects('proof precedes captured new baseline',seed({baseline:{proof_not_before:"timestamptz '2026-11-21 00:00:03+00'"}})+check,/bg1 dev maintenance history/)
  rejects('receipt cannot use older proof',seed({receipt:{proof_generation:'1919'}})+check,/violates check constraint/)
  rejects('receipt cannot use a nonexistent future proof',seed({receipt:{proof_generation:'1921'}})+check,/bg1 dev maintenance history/)
  rejects('receipt does not replace missing complete run',seed({omitRun1920:true})+check,/bg1 dev maintenance history/)
  rejects('receipt started time must match complete run',seed({receipt:{started_at:"timestamptz '2026-11-21 00:00:00+00'"}})+check,/bg1 dev maintenance history/)
  rejects('receipt cannot be recorded before proof finishes',seed({receipt:{recorded_at:"timestamptz '2026-11-21 00:00:02+00'"}})+check,/violates check constraint/)
  rejects('receipt cannot be recorded at lease expiry',seed({receipt:{recorded_at:"timestamptz '2026-11-21 00:05:30+00'"}})+check,/violates check constraint/)
  rejects('receipt timestamp cannot be infinite',seed({receipt:{recorded_at:"timestamptz 'infinity'"}})+check,/violates check constraint/)
  rejects('receipt cannot change actor',seed({receipt:{actor:literal('authenticated')}})+check,/violates check constraint/)
  rejects('receipt cannot name another project',seed({receipt:{dev_project_ref:literal('wrong-project')}})+check,/violates check constraint/)
  rejects('receipt method must be approved',seed({receipt:{method_snapshot:j({status:'pending'})}})+check,/violates check constraint/)
  rejects('missing prior Owner resume 13',seed({owner13:false})+check,/bg1 dev maintenance history/)
  rejects('future incident 15 cannot reuse receipt14 as resume15',seed({incident:15,resumed:15})+check,/bg1 proof or resume head/)
  pass('new unresolved incident15 preserves historical control',seed({incident:15,resumed:14})+check)
  rejects('new unresolved incident15 remains closed',seed({incident:15,resumed:14})+`SELECT ${guard}require_open_v1();`,/bg1 integrity unavailable/)
  pass('later Owner resume15 preserves valid historical maintenance14',seed({incident:15,resumed:15,generation:1921,owner15:true})+check)
  rejects('later Owner resume15 cannot hide missing maintenance14',seed({incident:15,resumed:15,generation:1921,owner15:true,includeReceipt:false})+check,/bg1 dev maintenance authority missing/)
  rejects('later Owner resume15 cannot hide forged maintenance14',seed({incident:15,resumed:15,generation:1921,owner15:true,receipt:{baseline_digest:"repeat('c',64)"}})+check,/bg1 dev maintenance history/)
  pass('normal Owner resume14 path remains valid without maintenance',seed({includeReceipt:false,owner14:true})+check)
  pass('normal Owner resumes14 then15 remain valid',seed({incident:15,resumed:15,generation:1921,includeReceipt:false,owner14:true,owner15:true})+check)
  for(const table of ['bg1_dev_maintenance_baseline_v5','bg1_dev_maintenance_receipts_v1']) {
    for(const action of [`UPDATE ${guard}${table} SET singleton=singleton`,`DELETE FROM ${guard}${table}`,`TRUNCATE ${guard}${table}`])
      rejects(table+' immutable '+action.split(' ')[0],seed()+action+';',/bg1 immutable evidence/)
    for(const role of roles) {
      rejects(table+' denies '+role+' SELECT',seed()+`GRANT USAGE ON SCHEMA official_v3_guard_private TO ${role};SET SESSION AUTHORIZATION ${role};SELECT * FROM ${guard}${table};`,/permission denied for table/)
    }
  }
  const metadata=p.value(`(SELECT jsonb_agg(jsonb_build_object('name',c.relname,'owner',c.relowner::regrole::text,'rls',c.relrowsecurity,'force',c.relforcerowsecurity,
    'unexpected_grants',(SELECT count(*) FROM aclexplode(COALESCE(c.relacl,acldefault('r',c.relowner))) a WHERE a.grantee<>'postgres'::regrole),
    'triggers',(SELECT count(*) FROM pg_trigger t WHERE t.tgrelid=c.oid AND NOT t.tgisinternal AND t.tgenabled='O')) ORDER BY c.relname)
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='official_v3_guard_private' AND c.relname IN ('bg1_dev_maintenance_baseline_v5','bg1_dev_maintenance_receipts_v1'))`)
  assert.equal(metadata.length,2)
  for(const row of metadata) assert.deepEqual({...row,name:null},{name:null,owner:'postgres',rls:true,force:true,unexpected_grants:0,triggers:2})
  results.push({name:'real PG catalog ACL/RLS/immutable trigger metadata',status:'PASS'})
  const unchanged = sha256(readFileSync(installerPath, 'utf8')) === hashes.installer
  const report={schema:1,scope:'SYNTHETIC_LOCAL_PG17_SINGLE_USER_ONLY',postgresMajor:17,installer:relative(repo,installerPath),hashes,candidateUnchangedDuringRun:unchanged,total:results.length,results,metadata}
  mkdirSync(dirname(reportPath),{recursive:true})
  writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n')
  assert.ok(unchanged,'candidate changed while running')
  console.log(JSON.stringify({status:'PASS',total:results.length,scope:report.scope,report:reportPath,hashes}))
} catch(error) {
  console.error(JSON.stringify({status:'FAIL',completed:results.length,lastCompleted:results.at(-1)?.name,error:error.message,hashes}))
  process.exitCode=1
} finally {p.close()}
