// Opt-in native Linux contention diagnosis, never an application import.
import assert from 'node:assert/strict'
import {availableParallelism} from 'node:os'
import {spawn, type ChildProcess} from 'node:child_process'
import {runControlledSyntheticPilot} from '../../official-truth-integrated-pilot-1/controlled-runtime'
import {startLocalProofCluster} from './local-cluster'
import {LocalPgConnection,pgText} from './pg-wire'
import {installLocalProofSchema,localArtifactTypeOids,persistVerifiedIntegratedBundleLocally,readVerifiedIntegratedBundleLocally} from './storage'

async function main(){
 assert.equal(process.argv[2],'--run-native-commit-contention');assert.equal(process.platform,'linux');assert.equal(availableParallelism(),1,'use a disposable container constrained to one CPU')
 const primary=await runControlledSyntheticPilot('primary');assert.equal(primary.status,'synthetic_bundle_verified');if(primary.status!=='synthetic_bundle_verified')throw Error('baseline')
 const cluster=startLocalProofCluster(),owner=await LocalPgConnection.connect(cluster),connect=LocalPgConnection.connect
 const connections:LocalPgConnection[]=[],workers:ChildProcess[]=[];let inject=true,writerPid=''
 async function stopLoad(){for(const child of workers)child.kill('SIGKILL');await Promise.all(workers.map(child=>child.exitCode!==null||child.signalCode!==null?Promise.resolve():new Promise<void>(resolve=>child.once('exit',()=>resolve()))))}
 try{
  await installLocalProofSchema(owner);const oids=await localArtifactTypeOids(owner)
  LocalPgConnection.connect=async(...args)=>{
   const c=await connect(...args);connections.push(c)
   if(args[1]==='ot_provenance_writer'&&inject){
    const query=c.query.bind(c)
    writerPid=(await query('SELECT pg_backend_pid()::text AS pid'))[0]!.pid!
    c.query=async(sql,parameters)=>{
     if(sql!=='COMMIT')return query(sql,parameters)
     // Five real CPU competitors, owned and terminated in finally. No sleep or
     // extra SQL work in the target transaction; all adapter limits stay fixed.
     await Promise.all(Array.from({length:5},()=>new Promise<void>((resolve,reject)=>{
      const child=spawn(process.execPath,['-e',"process.send('ready');process.once('message',()=>{let x=1;for(;;)x=Math.imul(x,1664525)+1013904223})"],{stdio:['ignore','ignore','ignore','ipc']});workers.push(child)
      const startup=setTimeout(()=>reject(Error('contention_worker_start_timeout')),5000)
      child.once('message',()=>{clearTimeout(startup);resolve()});child.once('error',error=>{clearTimeout(startup);reject(error)});child.once('exit',()=>{clearTimeout(startup);reject(Error('contention_worker_exited'))})
     })))
     for(const child of workers)child.send('start')
     const fallback=setTimeout(()=>{void stopLoad()},35_000)
     try{return await query(sql,parameters)}finally{clearTimeout(fallback);await stopLoad()}
    }
   }
   return c
  }
  const started=performance.now(),result=await persistVerifiedIntegratedBundleLocally(cluster,oids,primary.envelope)
  inject=false
  assert.equal((await owner.query("SELECT count(*)::text AS n FROM pg_catalog.pg_locks WHERE pid=$1::integer AND locktype='advisory' AND granted",[pgText(writerPid,23)]))[0]?.n,'0')
  const readback=await readVerifiedIntegratedBundleLocally(cluster,primary.envelope.bundle.recordFingerprint)
  if(!result.ok){
   assert.equal(result.reason,'commit_outcome_unknown');assert.equal(readback.status,'receipt_absent')
   for(const table of ['artifact_names','artifact_blobs','artifacts','receipts','receipt_dependencies','artifact_dependencies','custody_bindings','custody_dependencies'])assert.equal((await owner.query(`SELECT count(*)::text AS n FROM official_provenance_private.${table}`))[0]?.n,'0')
  }
  console.log(JSON.stringify({phase:'bounded_native_commit_cpu_contention',writeLockReleased:true,allTablesEmpty:!result.ok,competitors:5,result:result.ok?result.outcome:result.reason,elapsedMs:Math.ceil(performance.now()-started),readback:readback.status,rows:readback.status==='verified'?readback.rowCount:null,operations:connections.map(c=>c.operationDiagnostics)}))
  const successor=await persistVerifiedIntegratedBundleLocally(cluster,oids,primary.envelope)
  assert.ok(successor.ok);assert.equal(successor.outcome,result.ok?'idempotent':'inserted')
  console.log(JSON.stringify({phase:'independent_successor_after_contention',result:successor.outcome,readback:successor.readback.status,rows:successor.readback.rowCount}))
  assert.ok(result.ok,'normal publication must complete under the same bounded native contention regression')
 }finally{LocalPgConnection.connect=connect;await stopLoad();for(const c of connections)c.close();owner.close();cluster.stop()}
}
main().catch(error=>{console.error(error);process.exitCode=1})
