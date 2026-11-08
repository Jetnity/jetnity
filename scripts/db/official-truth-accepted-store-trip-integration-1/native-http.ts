/** Actual signed synthetic Auth/POST-RPC protocol over loopback, backed by real
 * PostgreSQL transactions/RLS. This is NOT a hosted PostgREST/managed-Auth proof. */
import assert from 'node:assert/strict'
import { createServer,type IncomingMessage,type ServerResponse } from 'node:http'
import { createHmac,timingSafeEqual,randomBytes } from 'node:crypto'
import type { LocalProofCluster } from '../official-truth-integrated-pilot-1/local-cluster'
import { LocalPgConnection,LocalPgError,pgText } from '../official-truth-integrated-pilot-1/pg-wire'
import { TRIP_GRAPH_SELECT_KANONISCH } from '@/lib/trips/foundation-e-select'
import { ownTripQuery } from './native-schema'
import type { NativeSuiteOwnership } from './native-suite'

export const nativeUser='11111111-1111-4111-8111-111111111111',nativeSession='22222222-2222-4222-8222-222222222222'
export const nativeTrip='33333333-3333-4333-8333-333333333333'
const rpcNames=['official_truth_trip_store_reserve_v1','official_truth_trip_store_prepare_v1','official_truth_trip_store_snapshot_v1',
  'official_truth_trip_store_finalize_v1','official_truth_trip_store_confirm_v1','official_truth_trip_store_cleanup_v1'] as const
export type NativeRpcName=typeof rpcNames[number]
export type NativeHttpFaults={
  beforeRpc?:(name:NativeRpcName,payload:Record<string,unknown>)=>Promise<void>;
  afterRpcDispatch?:(name:NativeRpcName,payload:Record<string,unknown>,backendPid:number)=>void;
  afterCommit?:(name:NativeRpcName,payload:Record<string,unknown>,result:unknown)=>Promise<'drop'|void>;
  graph?:(raw:Record<string,unknown>)=>Record<string,unknown>;
  graphHold?:{phase:'headers'|'body';released:Promise<void>;entered:()=>void};
  onRefresh?:()=>void;
  refresh:'normal'|'pending';
}
export type NativeHttpRequestEvidence={
  path:string;method:string;authenticated:boolean;bodyParsed:boolean;beforeRpc:boolean;rpcCommitted:boolean;
  status:number|null;headersSent:boolean;finished:boolean;closed:boolean;
  // Server end/afterCommit observations, never a claim of client receipt.
  acknowledgement:'not_sent'|'response_end_called'|'dropped_after_commit';
}
export async function startNativeHttp(cluster:LocalProofCluster,owner?:NativeSuiteOwnership) {
  owner?.check()
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
  const evidence:{rpc:string;committed:boolean;sqlState:string|null}[]=[],requests:NativeHttpRequestEvidence[]=[]
  const responseEvidence=new WeakMap<ServerResponse,NativeHttpRequestEvidence>()
  const observeResponse=(res:ServerResponse)=>{
    const entry=responseEvidence.get(res)
    if(entry){entry.headersSent=res.headersSent;entry.status=res.headersSent?res.statusCode:null}
    return entry
  }
  let authRequests=0,refreshRequests=0,stopped=false
  let closing:Promise<void>|null=null,serverClosing:Promise<void>|null=null
  const closeConnection=(connection:LocalPgConnection)=>{if(connections.delete(connection))connection.close()}
  const send=(res:ServerResponse,status:number,data:unknown)=>{if(!res.destroyed){
    res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(data))
    const entry=observeResponse(res);if(entry)entry.acknowledgement='response_end_called'
  }}
  async function transaction(role:'authenticated'|'service_role',jwt:Record<string,unknown>,run:(c:LocalPgConnection)=>Promise<unknown>,timeout=20_000) {
    owner?.check()
    const connection=await LocalPgConnection.connect(cluster,'accepted_fixture_authenticator');connections.add(connection)
    // The shared owner registers this acquisition (including late arrivals)
    // before its post-await check. Ordinary callers preserve their old path.
    try {
      if(stopped){closeConnection(connection);throw Error('native_http_stopped_during_connect')}
      owner?.check()
      await connection.query('begin isolation level read committed')
      await connection.query(`set local role ${role}`)
      await connection.query("select set_config('request.jwt.claims',$1,true) as jwt_settings,set_config('statement_timeout',$2,true) as statement_bound,set_config('lock_timeout','2s',true) as lock_bound",
        [pgText(JSON.stringify(jwt)),pgText(`${timeout}ms`)])
      const result=await run(connection)
      await connection.query('commit')
      return result
    } catch(error){await connection.query('rollback').catch(()=>[]);throw error}
    finally{closeConnection(connection)}
  }
  async function handle(req:IncomingMessage,res:ServerResponse) {
    owner?.check()
    const url=new URL(req.url??'/','http://127.0.0.1')
    const observation:NativeHttpRequestEvidence={path:url.pathname,method:req.method??'',authenticated:false,bodyParsed:false,
      beforeRpc:false,rpcCommitted:false,status:null,headersSent:false,finished:false,closed:false,acknowledgement:'not_sent'}
    requests.push(observation);responseEvidence.set(res,observation)
    res.once('finish',()=>{observation.finished=true;observeResponse(res)})
    res.once('close',()=>{observation.closed=true;observeResponse(res)})
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
      observation.authenticated=true
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
          if(hold.phase==='body'){res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});res.write(text.slice(0,1));observeResponse(res)}
          hold.entered();await hold.released
          if(!res.destroyed){if(hold.phase==='headers')send(res,200,graph);else{res.end(text.slice(1));observation.acknowledgement='response_end_called';observeResponse(res)}}
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
      observation.bodyParsed=true
      owner?.check()
      observation.beforeRpc=true
      if(faults.beforeRpc){const hook=faults.beforeRpc(name,body.payload);await(owner?owner.track(hook):hook)}
      owner?.check()
      let result:unknown
      try {
        result=await transaction(role,jwt,async c=>{
          const onDispatch=faults.afterRpcDispatch
          const backendPid=onDispatch?Number((await c.query('select pg_backend_pid()::text as pid'))[0]!.pid):null
          // Non-COMMIT query() writes its actual native frame before its first
          // await. Observe that dispatch, after role/JWT/timeout setup, without
          // changing the SQL, transaction, result or acknowledgement ordering.
          const pending=c.query(`select public.${name}($1::jsonb) as result`,[pgText(JSON.stringify(body.payload))])
          try {if(onDispatch){assert(Number.isInteger(backendPid)&&backendPid!>0);onDispatch(name,body.payload,backendPid!)}}
          catch(error){await pending.catch(()=>undefined);throw error}
          const rows=await pending
          return JSON.parse(rows[0]!.result!)
        },name==='official_truth_trip_store_finalize_v1'?30_000:name==='official_truth_trip_store_cleanup_v1'?5_000:20_000)
        evidence.push({rpc:name,committed:true,sqlState:null});observation.rpcCommitted=true
      } catch(error) {
        const code=error instanceof LocalPgError?error.code:'fixture_protocol_error'
        evidence.push({rpc:name,committed:false,sqlState:code});send(res,400,{message:'synthetic SQL refusal',code});return
      }
      owner?.check()
      const acknowledgement=faults.afterCommit?.(name,body.payload,result)
      if(acknowledgement&&await(owner?owner.track(acknowledgement):acknowledgement)==='drop'){observation.acknowledgement='dropped_after_commit';res.destroy();return}
      send(res,200,result)
    } catch {send(res,401,{message:'synthetic protocol unavailable'})}
  }
  const server=createServer((req,res)=>{
    if(stopped||owner?.signal.aborted){res.destroy();return}
    // Local transactions need no idle connection reuse. Close only after the
    // actual response completes; held headers/bodies and EOF remain genuine.
    res.setHeader('connection','close')
    const promise=handle(req,res).finally(()=>active.delete(promise));active.add(promise)
    if(owner)owner.track(promise)
    else void promise.catch(()=>undefined)
  })
  const listening=new Promise<void>((resolve,reject)=>{
    server.once('error',reject);server.listen(0,'127.0.0.1',()=>{server.removeListener('error',reject);resolve()})
  })
  const closeServer=()=>{
    if(!serverClosing)serverClosing=new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve()))
    return serverClosing
  }
  const stop=()=>{
    if(stopped)return
    stopped=true;server.closeAllConnections()
    // Release real transports before awaiting handlers. Shared ownership also
    // closes any COMMIT guard/control peers and the owned cluster itself.
    for(const connection of [...connections])closeConnection(connection)
    if(server.listening){const pending=closeServer();if(owner)owner.cleanupTask(()=>pending);else void pending.catch(()=>undefined)}
  }
  const removeStop=owner?.onStop(stop)
  const settle=async()=>{
    while(active.size){if(owner)await owner.drain([...active]);else await Promise.allSettled([...active])}
  }
  const close=()=>{
    if(closing)return closing
    stop()
    closing=(async()=>{
      const errors:unknown[]=[]
      try{await listening}catch(error){errors.push(error)}
      // A listen acquisition that finishes after stop is immediately closed;
      // its handler cannot accept business work while stopped is true.
      try{if(server.listening)await closeServer();else if(serverClosing)await serverClosing}catch(error){errors.push(error)}
      try{await settle()}catch(error){errors.push(error)}
      for(const connection of [...connections]){try{closeConnection(connection)}catch(error){errors.push(error)}}
      connections.clear();secret.fill(0);removeStop?.()
      if(errors.length)throw new AggregateError(errors,'native_http_cleanup_failed')
    })()
    return closing
  }
  try {
    if(owner)await owner.track(listening);else await listening
    if(stopped){await close();owner?.check();throw Error('native_http_stopped_during_start')}
    owner?.check()
    const address=server.address();assert(address&&typeof address==='object')
    return {url:`http://127.0.0.1:${address.port}`,accessToken,serviceToken,anonToken,claims,cookie,faults,evidence,requests,
      counts:()=>({authRequests,refreshRequests,active:active.size,connections:connections.size}),transaction,settle,stop,close}
  } catch(error) {
    try{await close()}catch(cleanup){throw new AggregateError([error,cleanup],'native_http_setup_failed')}
    throw error
  }
}
