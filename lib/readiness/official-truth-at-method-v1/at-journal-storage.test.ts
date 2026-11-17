import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readHumanJournal,persistHumanJournal,HUMAN_METHOD_STORAGE_KEY } from
  '../official-truth-product-v3/method/human-contract'
import { scopedMethodJournalStorage,AT_HUMAN_METHOD_STORAGE_KEY } from './at-journal-storage'

test('Dev AT journal roundtrip is isolated from existing CH→DE Owner operations',()=>{
 const map=new Map<string,string>()
 const underlying={getItem:(key:string)=>map.get(key)??null,setItem:(key:string,value:string)=>{map.set(key,value)}}
 const at=scopedMethodJournalStorage(underlying,AT_HUMAN_METHOD_STORAGE_KEY)
 const ch=scopedMethodJournalStorage(underlying,HUMAN_METHOD_STORAGE_KEY)
 const atJournal=readHumanJournal(null,'hmr1_7b99e62adbb78c89b4e45e8772c1fc09')
 const chJournal=readHumanJournal(null,'hmr1_fad09ef526aeea7eeeb3fb1f22c894f1')
 assert.ok(atJournal&&chJournal)
 assert.ok(persistHumanJournal(at,atJournal))
 assert.equal(at.getItem(HUMAN_METHOD_STORAGE_KEY),JSON.stringify(atJournal))
 assert.equal(underlying.getItem(HUMAN_METHOD_STORAGE_KEY),null)
 assert.equal(ch.getItem(HUMAN_METHOD_STORAGE_KEY),null)
 assert.ok(persistHumanJournal(ch,chJournal))
 assert.equal(ch.getItem(HUMAN_METHOD_STORAGE_KEY),JSON.stringify(chJournal))
 assert.equal(at.getItem(HUMAN_METHOD_STORAGE_KEY),JSON.stringify(atJournal))
 assert.notEqual(map.get(AT_HUMAN_METHOD_STORAGE_KEY),map.get(HUMAN_METHOD_STORAGE_KEY))
 assert.equal(readHumanJournal(at.getItem(HUMAN_METHOD_STORAGE_KEY),atJournal.selectionId)?.selectionId,atJournal.selectionId)
 assert.equal(readHumanJournal(ch.getItem(HUMAN_METHOD_STORAGE_KEY),chJournal.selectionId)?.selectionId,chJournal.selectionId)
 assert.equal(readHumanJournal(at.getItem(HUMAN_METHOD_STORAGE_KEY),chJournal.selectionId),null)
})
