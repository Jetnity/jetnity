/** Actual signed synthetic Auth/POST-RPC protocol over loopback, backed by real
 * PostgreSQL transactions/RLS. This is NOT a hosted PostgREST/managed-Auth proof. */
import assert from 'node:assert/strict'
import { createServer,type IncomingMessage,type ServerResponse } from 'node:http'
import { createHmac,timingSafeEqual,randomBytes } from 'node:crypto'
import type { LocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection,LocalPgError,pgText } from '../official-truth-integrated-pilot-1/pg-wire'
import { TRIP_GRAPH_SELECT_KANONISCH } from '@/lib/trips/foundation-e-select'
import { ownTripQuery } from './native-schema'

export const nativeUser='11111111-1111-4111-8111-111111111111',nativeSession='22222222-2222-4222-8222-222222222222'
export const nativeTrip='33333333-3333-4333-8333-333333333333'
const rpcNames=['official_truth_trip_store_reserve_v1','official_truth_trip_store_prepare_v1','official_truth_trip_store_snapshot_v1',
  'official_truth_trip_store_finalize_v1','official_truth_trip_store_confirm_v1','official_truth_trip_store_cleanup_v1'] as const
export type NativeRpcName=typeof rpcNames[number]
export type NativeHttpFaults={
  beforeRpc?:(name:NativeRpcName,payload:Record<string,unknown>)=>Promise<void>;
  afterCommit?:(name:NativeRpcName,payload:Record<string,unknown>,result:unknown)=>Promise<'drop'|void>;
  graph?:(raw:Record<string,unknown>)=>Record<string,unknown>;
  graphHold?:{phase:'headers'|'body';released:Promise<void>;entered:()=>void};
  onRefresh?:()=>void;
  refresh:'normal'|'pending';
}
export async function startNativeHttp(cluster:LocalProofCluster) {
  const secret=randomBytes(32),claims={sub:nativeUser,role:'authenticated',aal:'aal2',session_id:nativeSession,exp:Math.floor(Date.now()/1000)+3600}
  const sign=(body:Record<string,unknown>)=>{
    const a=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),b=Buffer.from(JSON.stringify(body)).toString('base64url')
    return `${a}.${b}.${createHmac('sha256',secret).update(`${a}.${b}`).digest('base64url')}`
  }
  const verify=(token:string)=>{
    const parts=token.split('.');if(parts.length!==3)throw Error('invalid_token')
    const actual=Buffer.from(parts[2]!,'base64url'),expected=createHmac('sha256',secret).update(`${parts[0]}.${parts[1]}`).digest()
    if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw Error('invalid_token')
    const body=JSON.parse(Buffer.from(parts[1]!,'base64url').toString('utf8')) as Record<string,unknown>
    if(typeof body.exp!=='number'||body.exp<=Date.now()/1000)throw Error('expired_token')
    return body
  }
  const accessToken=sign(claims),serviceToken=sign({role:'service_role',exp:claims.exp}),anonToken=sign({role:'anon',exp:claims.exp})
  const user={id:nativeUser,aud:'authenticated',role:'authenticated',created_at:'2026-11-01T00:00:00.000Z',app_metadata:{provider:'email',providers:['email']},user_metadata:{}}
  const cookie=(expired=false)=>`base64-${Buffer.from(JSON.stringify({access_token:expired?sign({...claims,exp:Math.floor(Date.now()/1000)-1}):accessToken,
    refresh_token:'SYNTHETIC-LOCAL-REFRESH',token_type:'bearer',expires_in:expired?-1:3600,expires_at:expired?Math.floor(Date.now()/1000)-1:claims.exp,user})).toString('base64url')}`
  const faults:NativeHttpFaults={refresh:'normal'},active=new Set<Promise<void>>(),connections=new Set<LocalPgConnection>()
  const evidence:{rpc:string;committed:boolean;sqlState:string|null}[]=[],requests:{path:string;method:string}[]=[]
  let authRequests=0,refreshRequests=0,closed=false
  const send=(res:ServerResponse,status:number,data:unknown)=>{if(!res.destroyed){res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(data))}}
  async function transaction(role:'authenticated'|'service_role',jwt:Record<string,unknown>,run:(c:LocalPgConnection)=>Promise<unknown>,timeout=20_000) {
    const connection=await LocalPgConnection.connect(cluster,'accepted_fixture_authenticator');connections.add(connection)
    try {
      await connection.query('begin isolation level read committed')
      await connection.query(`set local role ${role}`)
      await connection.query("select set_config('request.jwt.claims',$1,true) as jwt_settings,set_config('statement_timeout',$2,true) as statement_bound,set_config('lock_timeout','2s',true) as lock_bound",
        [pgText(JSON.stringify(jwt)),pgText(`${timeout}ms`)])
      const result=await run(connection)
      await connection.query('commit')
      return result
    } catch(error){await connection.query('rollback').catch(()=>[]);throw error}
    finally{connection.close();connections.delete(connection)}
  }
  async function handle(req:IncomingMessage,res:ServerResponse) {
    const url=new URL(req.url??'/','http://127.0.0.1');requests.push({path:url.pathname,method:req.method??''})
    try {
      if(url.pathname==='/auth/v1/token'&&req.method==='POST') {
        refreshRequests++
        faults.onRefresh?.()
        if(faults.refresh==='pending') {await new Promise<void>(done=>res.once('close',done));return}
        // Normal Auth protocol refresh, never a fabricated stop-retry response.
        send(res,200,{access_token:accessToken,refresh_token:'SYNTHETIC-LOCAL-REFRESH',token_type:'bearer',expires_in:3600,user});return
      }
      const token=(req.headers.authorization??'').replace(/^Bearer /,'')
      const jwt=verify(token),role=jwt.role
      if(role!=='authenticated'&&role!=='service_role'){send(res,401,{message:'synthetic authentication required'});return}
      if(url.pathname==='/auth/v1/user'&&req.method==='GET') {
        authRequests++
        assert.equal(role,'authenticated')
        const own=await transaction(role,jwt,async c=>{
          const rows=await c.query('select auth.uid()::text as uid');return rows[0]?.uid===nativeUser
        })
        if(!own){send(res,401,{message:'synthetic account unavailable'});return}
        send(res,200,user);return
      }
      if(url.pathname==='/rest/v1/trips'&&req.method==='GET') {
        assert.equal(role,'authenticated');assert.equal(url.searchParams.get('select'),TRIP_GRAPH_SELECT_KANONISCH.replace(/\s/g,''))
        assert.equal(url.searchParams.get('limit'),'1')
        const id=url.searchParams.get('id')?.replace(/^eq\./,'');assert(id&&/^[a-f0-9-]{36}$/.test(id))
        const data=await transaction(role,jwt,async c=>(await c.query(ownTripQuery,[pgText(id)])).map(row=>JSON.parse(row.graph!)))
        const graph=(data as Record<string,unknown>[]).map(raw=>faults.graph?faults.graph(raw):raw)
        const hold=faults.graphHold
        if(hold) {
          // Preserve the exact real RLS query result and JSON bytes. This local
          // transport fixture delays only delivery, never fabricates an Auth,
          // SQL, or positive evaluation response.
          const text=JSON.stringify(graph)
          if(hold.phase==='body'){res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});res.write(text.slice(0,1))}
          hold.entered();await hold.released
          if(!res.destroyed){if(hold.phase==='headers')send(res,200,graph);else res.end(text.slice(1))}
          return
        }
        send(res,200,graph);return
      }
      const name=url.pathname.replace('/rest/v1/rpc/','') as NativeRpcName
      if(req.method!=='POST'||!rpcNames.includes(name)){send(res,404,{message:'closed fixture endpoint'});return}
      let length=0;const chunks:Buffer[]=[]
      for await(const chunk of req){length+=(chunk as Buffer).length;if(length>16_777_216)throw Error('request_bound');chunks.push(Buffer.from(chunk))}
      const body=JSON.parse(Buffer.concat(chunks).toString('utf8')) as {payload:Record<string,unknown>}
      assert.deepEqual(Object.keys(body),['payload'])
      await faults.beforeRpc?.(name,body.payload)
      let result:unknown
      try {
        result=await transaction(role,jwt,async c=>{
          const rows=await c.query(`select public.${name}($1::jsonb) as result`,[pgText(JSON.stringify(body.payload))])
          return JSON.parse(rows[0]!.result!)
        },name==='official_truth_trip_store_finalize_v1'?30_000:name==='official_truth_trip_store_cleanup_v1'?5_000:20_000)
        evidence.push({rpc:name,committed:true,sqlState:null})
      } catch(error) {
        const code=error instanceof LocalPgError?error.code:'fixture_protocol_error'
        evidence.push({rpc:name,committed:false,sqlState:code});send(res,400,{message:'synthetic SQL refusal',code});return
      }
      if(await faults.afterCommit?.(name,body.payload,result)==='drop'){res.destroy();return}
      send(res,200,result)
    } catch {send(res,401,{message:'synthetic protocol unavailable'})}
  }
  const server=createServer((req,res)=>{
    const promise=handle(req,res).finally(()=>active.delete(promise));active.add(promise)
  })
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve))
  const address=server.address();assert(address&&typeof address==='object')
  return {url:`http://127.0.0.1:${address.port}`,accessToken,serviceToken,anonToken,claims,cookie,faults,evidence,requests,
    counts:()=>({authRequests,refreshRequests,active:active.size,connections:connections.size}),transaction,
    async settle(){while(active.size)await Promise.allSettled([...active])},
    async close(){if(closed)return;closed=true;server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));
      while(active.size)await Promise.allSettled([...active]);for(const c of connections)c.close();connections.clear();secret.fill(0)},
  }
}
