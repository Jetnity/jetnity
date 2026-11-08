import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createServerComponentClient,getServerSupabaseUrl } from '@/lib/supabase/server'
import type { AcceptedStoreLifetime } from './lifetime-server'
import type { AcceptedStoreBinding } from './binding-server'
import { bindingCurrent } from './binding-server'
import { reserveSchema } from './wire'

type AuthenticatedRpc={rpc(name:'official_truth_trip_store_reserve_v1'|'official_truth_trip_store_finalize_v1',args:{payload:Record<string,unknown>}):{
  abortSignal(signal:AbortSignal):PromiseLike<{data:unknown;error:unknown}>
}}

/** Every call is its own POST/RPC transaction. No connection or transaction is
 * held across requests. A returned Finalize value is provisional until Confirm
 * observes the actual committed operation in a distinct request. */
export class AcceptedStoreDatabase {
  private user: Awaited<ReturnType<typeof createServerComponentClient>> | null = null
  private service: SupabaseClient | null = null
  private reservationToken: string | null = null
  private readonly serviceUrl: string
  private readonly serviceKey: string
  constructor(private readonly lifetime: AcceptedStoreLifetime, private readonly binding: AcceptedStoreBinding) {
    this.current()
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),key=process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
    if (!url||!key||key.length>8192) throw Error('store_binding_closed')
    const normalize=(value:string)=>{
      const parsed=new URL(value)
      if(parsed.username||parsed.password||parsed.search||parsed.hash||parsed.pathname!=='/'
        ||parsed.protocol!=='https:'&&!(parsed.protocol==='http:'&&parsed.hostname==='127.0.0.1'&&/^\d{1,5}$/.test(parsed.port)))throw Error('store_target_invalid')
      return parsed.toString()
    }
    const target=normalize(binding.targetUrl),captured=getServerSupabaseUrl()
    if(!captured||normalize(captured)!==target||normalize(url)!==target)throw Error('store_target_invalid')
    const endpoint=new URL(target)
    this.serviceUrl=endpoint.toString().replace(/\/$/,'');this.serviceKey=key
  }
  private current() { this.lifetime.assertCurrent(); if (!bindingCurrent(this.binding)) throw Error('store_binding_closed') }
  async authenticated() {
    this.current()
    if (!this.user) this.user = await this.lifetime.run(() => createServerComponentClient(this.lifetime.signal))
    this.current()
    return this.user
  }
  private async privileged() {
    this.current()
    if (!this.service) {
      const observed = this.lifetime.observeAuthConstruction()
      try {
        this.service = createClient(this.serviceUrl,this.serviceKey,{ auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, debug: observed.debug },
          global: { fetch: (input,init) => this.lifetime.fetch(input,init) } })
      } finally { observed.constructionComplete() }
      await this.lifetime.run(() => this.service!.auth.initialize())
    }
    this.current()
    return this.service
  }
  async userIdentity(): Promise<string> {
    const client = await this.authenticated()
    this.current()
    const auth = await this.lifetime.run(() => client.auth.getUser())
    this.current()
    if (auth.error || !auth.data.user) throw Error('store_auth_unavailable')
    return auth.data.user.id
  }
  async reserve(payload: Record<string, unknown>): Promise<unknown> {
    const client = await this.authenticated(); this.current()
    const reply = await this.lifetime.run(() => Promise.resolve((client as unknown as AuthenticatedRpc).rpc('official_truth_trip_store_reserve_v1',{payload}).abortSignal(this.lifetime.signal)))
    this.current(); if (reply.error) throw Error('store_reserve_unavailable')
    const checked=reserveSchema.parse(reply.data);this.reservationToken=checked.token;return checked
  }
  async prepare(payload: Record<string, unknown>): Promise<unknown> {
    const client = await this.privileged(); this.current()
    const reply = await this.lifetime.run(() => Promise.resolve(client.rpc('official_truth_trip_store_prepare_v1',{payload}).abortSignal(this.lifetime.signal)))
    this.current(); if (reply.error) throw Error('store_prepare_unavailable'); return reply.data
  }
  async snapshot(payload: Record<string, unknown>): Promise<unknown> {
    const client = await this.privileged(); this.current()
    const reply = await this.lifetime.run(() => Promise.resolve(client.rpc('official_truth_trip_store_snapshot_v1',{payload}).abortSignal(this.lifetime.signal)))
    this.current(); if (reply.error) throw Error('store_snapshot_unavailable'); return reply.data
  }
  async finalize(payload: Record<string, unknown>): Promise<unknown> {
    const client = await this.authenticated(); this.current()
    const reply = await this.lifetime.run(() => Promise.resolve((client as unknown as AuthenticatedRpc).rpc('official_truth_trip_store_finalize_v1',{payload}).abortSignal(this.lifetime.signal)))
    this.current(); if (reply.error) throw Error('store_finalize_unavailable'); return reply.data
  }
  async confirm(payload: Record<string, unknown>): Promise<unknown> {
    const client = await this.privileged(); this.current()
    const reply = await this.lifetime.run(() => Promise.resolve(client.rpc('official_truth_trip_store_confirm_v1',{payload}).abortSignal(this.lifetime.signal)))
    this.current(); if (reply.error) throw Error('store_confirm_unavailable'); return reply.data
  }
  async cleanup(payload: Record<string, unknown>): Promise<unknown> {
    const client = await this.privileged(); this.current()
    const reply = await this.lifetime.run(() => Promise.resolve(client.rpc('official_truth_trip_store_cleanup_v1',{payload}).abortSignal(this.lifetime.signal)))
    this.current(); if (reply.error) throw Error('store_cleanup_unavailable'); return reply.data
  }
  /** R4's one disposal exception. The target/token/credentials were acquired by
   * this operation; no SDK/Auth call and no business lifetime is reopened. */
  async dispose(): Promise<{status:'acknowledged';removed:number}|{status:'not_started'|'unknown'}> {
    const token=this.reservationToken;this.reservationToken=null
    if (!token) return {status:'not_started'}
    const controller=new AbortController(),stop=performance.now()+5_000
    const timer=setTimeout(()=>controller.abort(new DOMException('Disposal deadline','TimeoutError')),5_000)
    timer.unref?.()
    let reader:ReadableStreamDefaultReader<Uint8Array>|null=null,complete=false
    try {
      const response=await globalThis.fetch(`${this.serviceUrl}/rest/v1/rpc/official_truth_trip_store_cleanup_v1`,{
        method:'POST',headers:{apikey:this.serviceKey,Authorization:`Bearer ${this.serviceKey}`,'content-type':'application/json'},
        body:JSON.stringify({payload:{token}}),signal:controller.signal,redirect:'error',cache:'no-store',
      })
      controller.signal.throwIfAborted()
      if (!response.body) throw Error('disposal_unconfirmed')
      reader=response.body.getReader();const chunks:Uint8Array[]=[];let size=0
      for (;;) {
        const part=await reader.read();controller.signal.throwIfAborted()
        if (part.done) {complete=true;break}
        size+=part.value.byteLength;if(size>2048)throw Error('disposal_bound');chunks.push(part.value)
      }
      if(!response.ok||performance.now()>=stop)throw Error('disposal_unconfirmed')
      const data=JSON.parse(Buffer.concat(chunks).toString('utf8')) as {removed?:unknown}
      if(Object.keys(data).length!==1||!Number.isInteger(data.removed)||Number(data.removed)<0||Number(data.removed)>32)throw Error('disposal_unconfirmed')
      return {status:'acknowledged',removed:Number(data.removed)}
    } catch {return {status:'unknown'}}
    finally {
      controller.abort();if(reader){if(!complete)await reader.cancel().catch(()=>undefined);reader.releaseLock()}
      clearTimeout(timer)
    }
  }
}
