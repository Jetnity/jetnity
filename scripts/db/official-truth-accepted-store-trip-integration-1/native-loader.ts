/** Test-only compiled infrastructure selection. Product modules stay real;
 * no evaluate callback or positive result DTO is substituted. */
import assert from 'node:assert/strict'
import { readFileSync,existsSync,statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname,resolve } from 'node:path'
import ts from 'typescript'
import * as extractors from '@/lib/readiness/official-truth-trusted-fact-extractor-registry'
import * as catalog from '@/lib/readiness/official-truth-source-catalog-server'
import * as retrieval from '@/lib/readiness/official-truth-server-owned-retrieval'
import { fixtureExtractor,fixtureProfile,fixtureBody,fixtureUrl } from './fixtures'
import type { AcceptedStoreBinding } from '@/lib/readiness/official-truth-accepted-store-trip-integration-1/binding-server'

const require=createRequire(import.meta.url)
export type NativeRuntimeState={binding:AcceptedStoreBinding|null;cookie:string;successor:boolean;sourceStarts:number;authCookieReads:number}
export function nativeProductRuntime(state:NativeRuntimeState) {
  // These are the ACTUAL packages in CI. Absence is failure, never a skip or a
  // replacement Auth response. Native Node22/SSR0.6.1 is independently asserted.
  assert.equal(JSON.parse(readFileSync('node_modules/@supabase/ssr/package.json','utf8')).version,'0.6.1')
  assert.equal(JSON.parse(readFileSync('node_modules/@supabase/supabase-js/package.json','utf8')).version,'2.57.2')
  const cache=new Map<string,{exports:unknown}>()
  const fixtureExtractors={...extractors,OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY:Object.freeze([fixtureExtractor]),
    officialTruthTrustedFactExtrahieren:(input:unknown)=>extractors.officialTruthTrustedFactExtrahierenMitDefinitionen(input,[fixtureExtractor])}
  const sourcePort={...retrieval,loadOfficialTruthServerOwnedRetrievalWithCatalogTransport:async(input:unknown,transport:catalog.OfficialTruthSourceCatalogTransport)=>{
    state.sourceStarts++
    const body=Buffer.from(fixtureBody(state.successor),'utf8')
    return retrieval.decideOfficialTruthServerOwnedRetrieval(input,{now:()=>new Date(),
      catalog:{transport,identityProfiles:[fixtureProfile]},resolve:async()=>[{address:'93.184.216.34',family:4}],
      http:async request=>{
        assert.equal(request.url,fixtureUrl)
        await new Promise<void>((yes,no)=>request.lookup('accepted-trip.example',{all:true},error=>error?no(error):yes()))
        return {ok:true,status:200,headers:new Headers({'content-type':'application/json','content-length':String(body.byteLength)}),
          body:(async function*(){yield body})()}
      }})
  }}
  function load(path:string):unknown {
    path=resolve(path);if(existsSync(path)&&statSync(path).isDirectory())path=resolve(path,'index.ts');else if(!existsSync(path))path+='.ts'
    if(cache.has(path))return cache.get(path)!.exports
    const module={exports:{} as unknown};cache.set(path,module)
    const code=ts.transpileModule(readFileSync(path,'utf8'),{fileName:path,
      compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText
    new Function('require','module','exports',code)((name:string)=>{
      if(name==='server-only')return {}
      if(name==='next/headers')return {cookies:async()=>{state.authCookieReads++;return {
        get:(key:string)=>key==='sb-127-auth-token'?{value:state.cookie}:undefined,
        getAll:()=>state.cookie?[{name:'sb-127-auth-token',value:state.cookie}]:[],set:()=>{throw Error('RSC cookie mutation')},delete:()=>{throw Error('RSC cookie mutation')},
      }}}
      const target=name.startsWith('@/')?resolve(name.slice(2)):name.startsWith('.')?resolve(dirname(path),name):null
      if(target===resolve('lib/readiness/official-truth-trusted-fact-extractor-registry'))return fixtureExtractors
      if(target===resolve('lib/readiness/official-truth-source-catalog-server'))return {...catalog,
        quellenKatalogLesen:(options:catalog.OfficialTruthSourceCatalogAbhaengigkeiten={})=>catalog.quellenKatalogLesen({...options,identityProfiles:[fixtureProfile]})}
      if(target===resolve('lib/readiness/official-truth-server-owned-retrieval'))return sourcePort
      if(target===resolve('lib/readiness/official-truth-accepted-store-trip-integration-1/binding-server'))return {
        acceptedStoreBinding:()=>state.binding?.current()?state.binding:null,
        bindingCurrent:(binding:AcceptedStoreBinding)=>state.binding===binding&&binding.current(),acceptedStoreAvailable:()=>!!state.binding?.current(),
      }
      return target?load(target):require(name)
    },module,module.exports)
    return module.exports
  }
  const root='lib/readiness/official-truth-accepted-store-trip-integration-1/'
  return {
    producer:load(root+'producer-server.ts') as typeof import('@/lib/readiness/official-truth-accepted-store-trip-integration-1/producer-server'),
    reader:load(root+'reader-server.ts') as typeof import('@/lib/readiness/official-truth-accepted-store-trip-integration-1/reader-server'),
    request:load(root+'request-server.ts') as typeof import('@/lib/readiness/official-truth-accepted-store-trip-integration-1/request-server'),
    database:load(root+'database-server.ts') as typeof import('@/lib/readiness/official-truth-accepted-store-trip-integration-1/database-server'),
    lifetime:load(root+'lifetime-server.ts') as typeof import('@/lib/readiness/official-truth-accepted-store-trip-integration-1/lifetime-server'),
    trips:load('lib/trips/daten.ts') as typeof import('@/lib/trips/daten'),
    factory:load('lib/supabase/server.ts') as typeof import('@/lib/supabase/server'),
    context:load('lib/readiness/official-truth-ch-de-application-pilot-1/context.ts') as typeof import('@/lib/readiness/official-truth-ch-de-application-pilot-1/context'),
    tripBinding:load(root+'trip-binding-server.ts') as typeof import('@/lib/readiness/official-truth-accepted-store-trip-integration-1/trip-binding-server'),
    rate:load('lib/readiness/rate-limit.ts') as typeof import('@/lib/readiness/rate-limit'),
  }
}
