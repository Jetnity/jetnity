import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { Pool } from 'pg'
import { startLocalProofCluster } from '../../scripts/db/official-truth-integrated-pilot-1/local-cluster'
import { readWeatherQuota } from './quota-contract'

// This is a genuine local SQL/cross-session quota proof. Auth and BG1 below are
// explicit fixtures, NOT a hosted login or the separate full BG1 installation proof.
test('weather quotas are atomic across independent database sessions', {timeout:120000}, async () => {
  const cluster = startLocalProofCluster()
  const pool = new Pool({host:cluster.socket,port:cluster.port,user:cluster.user,database:cluster.database,
    max:16,connectionTimeoutMillis:5000,statement_timeout:15000})
  const uid = (n:number) => n.toString(16).padStart(8,'0')+'-1111-4111-8111-111111111111'
  const claims = (n:number) => ({sub:uid(n),session_id:uid(n+1000),role:'authenticated',is_anonymous:false,
    exp:Math.floor(Date.now()/1000)+600})
  const reserve = async (n:number, overrides:Record<string,unknown> = {}) => {
    const client = await pool.connect()
    try {
      await client.query('BEGIN; SET LOCAL ROLE authenticated;')
      await client.query("SELECT set_config('request.jwt.claims',$1,true)",[JSON.stringify({...claims(n),...overrides})])
      const response = await client.query('SELECT public.reisewetter_reservieren_v1() AS value')
      const result = readWeatherQuota(response.rows[0].value); assert.ok(result)
      await client.query('COMMIT')
      return result
    } catch (error) { await client.query('ROLLBACK'); throw error }
    finally { client.release() }
  }
  try {
    assert.match(cluster.version,/PostgreSQL\) (?:15|16|17)\./)
    await pool.query(`CREATE ROLE postgres SUPERUSER; CREATE ROLE authenticated NOLOGIN; CREATE ROLE anon NOLOGIN;
      CREATE ROLE service_role NOLOGIN; CREATE SCHEMA auth;
      CREATE TABLE auth.users(id uuid PRIMARY KEY,is_anonymous boolean NOT NULL DEFAULT false,banned_until timestamptz,deleted_at timestamptz);
      CREATE TABLE auth.sessions(id uuid PRIMARY KEY,user_id uuid REFERENCES auth.users(id),not_after timestamptz);
      CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql AS $$ SELECT nullif(current_setting('request.jwt.claims',true),'')::jsonb $$;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT (auth.jwt()->>'sub')::uuid $$;
      GRANT USAGE ON SCHEMA auth TO authenticated,anon;
      CREATE SCHEMA official_v3_guard_private; CREATE TABLE official_v3_guard_private.fixture_state(open boolean NOT NULL);
      INSERT INTO official_v3_guard_private.fixture_state VALUES(true);
      CREATE FUNCTION official_v3_guard_private.require_open_v1() RETURNS void LANGUAGE plpgsql AS $$
      BEGIN IF NOT (SELECT open FROM official_v3_guard_private.fixture_state) THEN RAISE EXCEPTION 'synthetic guard closed'; END IF; END $$;`)
    for (let n=1;n<=80;n++) {
      await pool.query('INSERT INTO auth.users(id) VALUES($1)',[uid(n)])
      await pool.query('INSERT INTO auth.sessions(id,user_id) VALUES($1,$2)',[uid(n+1000),uid(n)])
    }
    const sql=readFileSync(new URL('../../scripts/db/reisewetter-global-1/quota-candidate.sql',import.meta.url),'utf8')
    await pool.query('BEGIN; SET LOCAL ROLE postgres;\n'+sql+'\nCOMMIT;')
    for(let n=0;n<10;n++) assert.equal((await reserve(1)).allowed,true)
    assert.deepEqual(await reserve(1),{allowed:false,retryAfterSec:60})
    await pool.query('TRUNCATE jetnity_weather_private.reservations_v1')
    const concurrent=await Promise.all(Array.from({length:60},(_,i)=>reserve(i+2)))
    assert.equal(concurrent.filter(x=>x.allowed).length,45)
    assert.equal(Number((await pool.query('SELECT count(*) AS n FROM jetnity_weather_private.reservations_v1')).rows[0].n),45)
    assert.deepEqual(await reserve(79),{allowed:false,retryAfterSec:60})
    // A different connection/actor cannot reset or evade the shared daily ledger.
    await pool.query(`TRUNCATE jetnity_weather_private.reservations_v1;
      INSERT INTO jetnity_weather_private.reservations_v1(actor,reserved_at)
      SELECT '${uid(1)}'::uuid,clock_timestamp()-interval '2 minutes' FROM generate_series(1,1000)`)
    assert.deepEqual(await reserve(79),{allowed:false,retryAfterSec:86400})
    await pool.query('TRUNCATE jetnity_weather_private.reservations_v1')
    await assert.rejects(reserve(79,{exp:1}),/weather admission unavailable/)
    await assert.rejects(reserve(79,{session_id:uid(2)}),/weather admission unavailable/)
    await pool.query('UPDATE auth.users SET is_anonymous=true WHERE id=$1',[uid(79)])
    await assert.rejects(reserve(79),/weather admission unavailable/)
    await pool.query('UPDATE auth.users SET is_anonymous=false WHERE id=$1',[uid(79)])
    await pool.query('UPDATE official_v3_guard_private.fixture_state SET open=false')
    await assert.rejects(reserve(79),/synthetic guard closed/)
    assert.equal(Number((await pool.query('SELECT count(*) AS n FROM jetnity_weather_private.reservations_v1')).rows[0].n),0)
    const acl=await pool.query(`SELECT has_function_privilege('anon','public.reisewetter_reservieren_v1()','EXECUTE') AS anon,
      has_function_privilege('service_role','public.reisewetter_reservieren_v1()','EXECUTE') AS service,
      has_table_privilege('authenticated','jetnity_weather_private.reservations_v1','SELECT,INSERT,UPDATE,DELETE,TRUNCATE') AS table_access`)
    assert.deepEqual(acl.rows[0],{anon:false,service:false,table_access:false})
  } finally { await pool.end(); cluster.stop() }
})
