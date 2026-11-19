import assert from 'node:assert/strict'
import { test } from 'node:test'
import { HUMAN_METHOD_DEV_URL, HUMAN_METHOD_PRODUCTION_URL, HUMAN_METHOD_STORAGE_KEY } from '../official-truth-product-v3/method/human-contract'
import { eligibleAustria50Dev, getAt50HumanRelease } from './at-50-human-release'
import { scopedMethodJournalStorage, AT50_HUMAN_METHOD_STORAGE_KEY, AT_HUMAN_METHOD_STORAGE_KEY }
  from './at-journal-storage'

const valid=Object.freeze({
 deploymentEnv:'preview',projectId:'prj_wTTVawPItEO7a4HihEmaU3PsuaXM',
 repoOwner:'Jetnity',repoSlug:'jetnity',
 branch:'feat/official-truth-universal-source-registry-dev-20261119',
 getSupabaseUrl:()=>HUMAN_METHOD_DEV_URL,
})

test('AT50 method selection is only the exact verified Dev Preview',()=>{
 assert.equal(eligibleAustria50Dev(valid),true)
 for(const change of [
  {deploymentEnv:'production'},
  {deploymentEnv:'development'},
  {deploymentEnv:undefined},
  {projectId:'prj_mismatch'},
  {repoOwner:'Other'},
  {repoSlug:'another'},
  {branch:'main'},
  {branch:'feat/official-truth-at-owned-20261116'},
  {branch:undefined},
  {getSupabaseUrl:()=>HUMAN_METHOD_PRODUCTION_URL},
  {getSupabaseUrl:()=> 'https://example.invalid'},
 ]) assert.equal(eligibleAustria50Dev({...valid,...change}),false)
})

test('foreign or Production deployments must never even resolve database target',()=>{
 for(const altered of [{deploymentEnv:'production'},{repoOwner:'Other'},{branch:'main'}]){
  let called=0
  const actual=eligibleAustria50Dev({
   ...valid,...altered,getSupabaseUrl:()=>{called++;throw Error('db_lookup_must_not_run')}
  })
  assert.equal(actual,false)
  assert.equal(called,0)
 }
})

test('AT50, prior CH-only AT, and CH-DE Owner journals use distinct session keys',()=>{
 const contents=new Map<string,string>()
 const fakeStorage={
  getItem:(key:string)=>contents.get(key)??null,
  setItem:(key:string,value:string)=>{contents.set(key,value)},
 }
 const fifty=scopedMethodJournalStorage(fakeStorage,AT50_HUMAN_METHOD_STORAGE_KEY)
 const one=scopedMethodJournalStorage(fakeStorage,AT_HUMAN_METHOD_STORAGE_KEY)
 const de=scopedMethodJournalStorage(fakeStorage,HUMAN_METHOD_STORAGE_KEY)
 fifty.setItem(HUMAN_METHOD_STORAGE_KEY,'at50-review-pending')
 one.setItem(HUMAN_METHOD_STORAGE_KEY,'at-ch-review')
 de.setItem(HUMAN_METHOD_STORAGE_KEY,'ch-de-review')
 assert.equal(contents.size,3)
 assert.equal(fifty.getItem(HUMAN_METHOD_STORAGE_KEY),'at50-review-pending')
 assert.equal(one.getItem(HUMAN_METHOD_STORAGE_KEY),'at-ch-review')
 assert.equal(de.getItem(HUMAN_METHOD_STORAGE_KEY),'ch-de-review')
 fifty.setItem(HUMAN_METHOD_STORAGE_KEY,'at50-review-confirmed')
 assert.equal(one.getItem(HUMAN_METHOD_STORAGE_KEY),'at-ch-review')
 assert.equal(de.getItem(HUMAN_METHOD_STORAGE_KEY),'ch-de-review')
})

test('non-Vercel test process never exposes AT50 Owner release',()=>{
 // No server environment mutation or fake credentials in this test.
 if(process.env.VERCEL_ENV!=='preview'){
  assert.equal(getAt50HumanRelease(),null)
 }
})
