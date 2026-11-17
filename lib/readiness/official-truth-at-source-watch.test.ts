import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createHash } from 'node:crypto'
import { checkAtSourcePin, checkAtOfficialSourceSet } from '../../scripts/official-truth-at-source-watch.mjs'

const body=new Uint8Array(new TextEncoder().encode('<html>unchanged</html>'))
const sha=createHash('sha256').update(body).digest('hex')
const pin={url:'https://www.bmi.gv.at/test-only',bytes:body.byteLength,sha,edition:null}
function mock(text:Uint8Array,opts:{url?:string,status?:number,contentType?:string,contentLength?:string}={}){
 return (async ()=>({url:opts.url??pin.url,status:opts.status??200,
  headers:new Headers({'content-type':opts.contentType??'text/html',
   'content-length':opts.contentLength??String(text.byteLength)}),
  body:new ReadableStream<Uint8Array>({start(stream){stream.enqueue(text);stream.close()}})})) as unknown as typeof fetch
}
test('AT source watch verifies bytes, HTTPS origin, media, completeness and never grants method authority',async()=>{
 assert.equal(await checkAtSourcePin(pin,mock(body)),'unchanged')
 assert.equal(await checkAtSourcePin(pin,mock(new TextEncoder().encode('changed'))),'changed')
 assert.equal(await checkAtSourcePin(pin,mock(body,{url:'https://untrusted.invalid/test'})),'unavailable')
 assert.equal(await checkAtSourcePin(pin,mock(body,{status:302})),'unavailable')
 assert.equal(await checkAtSourcePin(pin,mock(body,{contentType:'application/json'})),'unavailable')
 assert.equal(await checkAtSourcePin(pin,mock(body,{contentLength:'100000000'})),'unavailable')
 assert.equal(await checkAtSourcePin({...pin,edition:'missing release'},mock(body)),'unavailable')
})
test('watch outputs no positive rules even if three official pages match their pins',async()=>{
 const unavailable=await checkAtOfficialSourceSet(async()=>{throw Error('network unavailable')})
 assert.equal(unavailable.sources,3)
 assert.equal(unavailable.unavailable,3)
 assert.equal(unavailable.accepted,0)
 assert.equal(unavailable.published,0)
 assert.equal(unavailable.status,'SOURCE_UNAVAILABLE')
})
