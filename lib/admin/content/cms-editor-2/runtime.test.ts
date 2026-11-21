import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { before, test } from 'node:test'
import { build } from 'esbuild'
import type { CmsCommand } from '../cms/contract'
import { createCmsHttpPort } from './http'
import { writeCmsIntentLocation } from './location'
import type { CmsPort, CmsPortResult } from './port'
import { CMS_REQUEST_BYTES, cmsDuring, cmsJsonBody, parseCmsHttpRequest, parseCmsRecoveryMarker, type CmsRecoveryMarker } from './request'
import { parseCmsPublished, parseCmsRecoveryConfirmation } from './responses'
import { createCmsEditor } from './state'
import { CMS_TEST_AT, CMS_TEST_COPY, CMS_TEST_ENTRY, CMS_TEST_ID, fixtureRead, fixtureReceipt, fixtureRevision } from '@/scripts/admin-cms-editor-2/fixtures'

const ORIGIN = 'https://cms-runtime-test.example'
const command: CmsCommand = { requestId: CMS_TEST_ID, entryId: CMS_TEST_ENTRY, expectedVersion: '0', action: 'save_draft',
  payload: { ...CMS_TEST_COPY, themen: ['natur'] } }
const marker: CmsRecoveryMarker = { requestId: command.requestId, entryId: command.entryId, expectedVersion: command.expectedVersion }
type RpcResult = { data: unknown; error: { code: string } | null }
type Fixture = {
  enabled: boolean; publicPreview?: boolean; target?: 'development' | 'production'; grant: string; denial: number | null; clients: number; admissions: number; identities: number
  calls: Array<{ name: string; args: Record<string, unknown> }>
  identity: () => Promise<{ data: { user: { id: string; is_anonymous: boolean } | null }; error: null }>
  result: (name: string, args: Record<string, unknown>) => Promise<RpcResult>
}
type Routes = { POST(request: Request): Promise<Response>; GET(request: Request): Promise<Response>; readCmsPublished(signal: AbortSignal): Promise<CmsPortResult> }
let compiled: (fixture: Fixture) => Routes

before(async () => {
  // Execute the actual two product routes and actual RPC adapter. Only existing
  // admission, deployment and cookie-client dependencies are controlled here.
  const output = await build({ absWorkingDir: process.cwd(), bundle: true, write: false, platform: 'node', format: 'cjs',
    external: ['next/server'], stdin: { resolveDir: process.cwd(), contents:
      "export { POST } from './app/api/admin/content/cms/route'; export { GET } from './app/api/cms/inspiration/route'; export { readCmsPublished } from './lib/admin/content/cms-editor-2/server';" },
    plugins: [{ name: 'cms-runtime-boundaries', setup(builder) {
      builder.onResolve({ filter: /^(server-only|@\/lib\/(supabase\/server|auth\/admin-guard|admin\/hosted-runtime-activation|inspiration\/cms-preview-read))$/ }, args => ({ path: args.path, namespace: 'cms-boundary' }))
      builder.onLoad({ filter: /.*/, namespace: 'cms-boundary' }, args => ({ contents:
        args.path === 'server-only' ? 'export {}'
          : args.path.endsWith('hosted-runtime-activation') ? 'export function isAdminHostedRuntimeEnabled(){return __cmsFixture.enabled} export function adminHostedRuntimeTarget(){return __cmsFixture.enabled ? (__cmsFixture.target ?? "development") : "unavailable"}'
            : args.path.endsWith('cms-preview-read') ? 'export function isCmsPreviewReadEnabled(){return __cmsFixture.publicPreview===true}'
            : args.path.endsWith('admin-guard') ? `export async function requireAdminApi(options){
              __cmsFixture.admissions++; if(options.capability!=='inhalte-moderieren')throw Error('wrong capability');
              return __cmsFixture.denial ? {ok:false,response:new Response('',{status:__cmsFixture.denial})}
                : {ok:true,user:{id:'${CMS_TEST_ID}'},role:'moderator',grant:__cmsFixture.grant};}`
              : `export async function createRouteHandlerClient(){__cmsFixture.clients++;return {
                auth:{getUser:async()=>{__cmsFixture.identities++;return __cmsFixture.identity()}},
                rpc:(name,args)=>{__cmsFixture.calls.push({name,args});return {abortSignal:async(signal)=>{
                  if(!(signal instanceof AbortSignal))throw Error('missing RPC deadline');return __cmsFixture.result(name,args)}}}}}
                export const createServerComponentClient=createRouteHandlerClient;`,
        loader: 'js',
      }))
    } }],
  })
  const execute = new Function('require', 'module', 'exports', '__cmsFixture', output.outputFiles[0].text)
  compiled = fixture => {
    const fixtureModule = { exports: {} }
    execute(createRequire(import.meta.url), fixtureModule, fixtureModule.exports, fixture)
    return fixtureModule.exports as Routes
  }
})

function fixture(): Fixture {
  return { enabled: true, grant: 'role', denial: null, clients: 0, admissions: 0, identities: 0, calls: [],
    identity: async () => ({ data: { user: { id: CMS_TEST_ID, is_anonymous: false } }, error: null }),
    result: async () => ({ data: fixtureRead(), error: null }),
  }
}
function request(input: unknown, options: { origin?: string; signal?: AbortSignal } = {}) {
  return new Request(ORIGIN + '/api/admin/content/cms', { method: 'POST',
    headers: { Origin: options.origin ?? ORIGIN, 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal: options.signal })
}
const envelope = { operation: 'command', command }

test('closed requests retain bigint precision and reject extra fields, invalid cursors and accessors', () => {
  const large = { ...command, expectedVersion: '9007199254740993' }
  assert.equal(parseCmsHttpRequest({ operation: 'command', command: large })?.operation, 'command')
  assert.equal(parseCmsHttpRequest({ operation: 'command', command: { ...large, expectedVersion: 9007199254740992 } }), null)
  for (const query of [{ entryId: CMS_TEST_ENTRY, limit: 51 }, { entryId: CMS_TEST_ENTRY, revision: '01' }, { entryId: CMS_TEST_ENTRY, actorId: CMS_TEST_ID }]) {
    assert.equal(parseCmsHttpRequest({ operation: 'read', query }), null)
  }
  let touched = 0
  assert.equal(parseCmsHttpRequest({ operation: 'read', get query() { touched++; return { entryId: CMS_TEST_ENTRY } } }), null)
  assert.equal(touched, 0)
  assert.equal(parseCmsRecoveryMarker({ ...marker, payload: command.payload }), null)
  assert.equal(parseCmsHttpRequest({ operation: 'confirm', requestId: CMS_TEST_ID, actorId: CMS_TEST_ID }), null)
})

test('actual routes refuse closed deployment and cross-origin access before Auth or client construction', async () => {
  const f = fixture(), routes = compiled(f)
  f.enabled = false
  assert.equal((await routes.POST(request(envelope))).status, 503)
  assert.equal((await routes.GET(new Request(ORIGIN + '/api/cms/inspiration'))).status, 503)
  f.enabled = true
  assert.equal((await routes.POST(request(envelope, { origin: 'https://foreign.example' }))).status, 400)
  assert.equal(f.admissions, 0); assert.equal(f.clients, 0); assert.equal(f.calls.length, 0)
})

test('public-only preview reads the published v2 RPC while Admin routes and cookie identity stay closed', async () => {
  const f = fixture()
  f.enabled = false; f.publicPreview = true
  f.result = async () => ({ data: { schema: 1, items: [] }, error: null })
  const routes = compiled(f)
  assert.deepEqual(await routes.readCmsPublished(new AbortController().signal), { ok: true, value: { schema: 1, items: [] } })
  assert.deepEqual(f.calls.map(call => call.name), ['cms_inspiration_published_v2'])
  assert.equal(f.identities, 0); assert.equal(f.admissions, 0)
  assert.equal((await routes.POST(request(envelope))).status, 503)
  const publicResponse = await routes.GET(new Request(ORIGIN + '/api/cms/inspiration'))
  assert.equal(publicResponse.status, 200)
  assert.match(publicResponse.headers.get('cache-control') ?? '', /no-store/)
  assert.deepEqual(await publicResponse.json(), { ok: true, value: { schema: 1, items: [] } })
  assert.equal((await routes.GET(new Request(ORIGIN + '/api/cms/inspiration?draft=true'))).status, 503)
  assert.deepEqual(f.calls.map(call => call.name), ['cms_inspiration_published_v2', 'cms_inspiration_published_v2'])
  assert.equal(f.clients, 2); assert.equal(f.identities, 0); assert.equal(f.admissions, 0)
})

test('Production selects v2 only with the exact release flag and can return to v1 without changing writers', async () => {
  const previous = process.env.JETNITY_CMS_PUBLIC_V2_ENABLED
  const f = fixture(); f.target = 'production'
  f.result = async () => ({ data: { schema: 1, items: [] }, error: null })
  const routes = compiled(f)
  try {
    for (const [flag, rpc] of [
      [undefined, 'cms_inspiration_published_v1'], ['false', 'cms_inspiration_published_v1'],
      ['TRUE', 'cms_inspiration_published_v1'], ['true ', 'cms_inspiration_published_v1'],
      ['true', 'cms_inspiration_published_v2'], ['false', 'cms_inspiration_published_v1'],
    ] as const) {
      if (flag === undefined) delete process.env.JETNITY_CMS_PUBLIC_V2_ENABLED
      else process.env.JETNITY_CMS_PUBLIC_V2_ENABLED = flag
      assert.equal((await routes.GET(new Request(ORIGIN + '/api/cms/inspiration'))).status, 200)
      assert.equal(f.calls.at(-1)?.name, rpc)
    }
    assert.equal(f.identities, 0); assert.equal(f.admissions, 0)
  } finally {
    if (previous === undefined) delete process.env.JETNITY_CMS_PUBLIC_V2_ENABLED
    else process.env.JETNITY_CMS_PUBLIC_V2_ENABLED = previous
  }
})

test('central admission, persisted write grant and current cookie identity remain independent gates', async () => {
  const f = fixture(), routes = compiled(f)
  f.denial = 401
  assert.equal((await routes.POST(request(envelope))).status, 401)
  f.denial = null; f.grant = 'break-glass'
  assert.equal((await routes.POST(request(envelope))).status, 403)
  assert.equal(f.clients, 0)
  f.grant = 'role'; f.identity = async () => ({ data: { user: { id: 'other', is_anonymous: false } }, error: null })
  assert.equal((await routes.POST(request(envelope))).status, 401)
  assert.equal(f.calls.length, 0)
  f.identity = async () => ({ data: { user: { id: CMS_TEST_ID, is_anonymous: true } }, error: null })
  assert.equal((await routes.POST(request(envelope))).status, 403)
  assert.equal(f.calls.length, 0)
})

test('actual route, HTTP port and editor require write then separate journal confirmation and fresh read', async () => {
  const f = fixture(), routes = compiled(f)
  let snapshot = fixtureRead(), recorded: ReturnType<typeof fixtureReceipt> | null = null
  f.result = async (name) => {
    if (name === 'admin_cms_inspiration_command_v1') {
      snapshot = fixtureRead({ draft: '1' }); recorded = fixtureReceipt(command, { draft: '1', created: '1' })
      return { data: recorded, error: null }
    }
    if (name === 'admin_cms_inspiration_confirm_v1') return { data: recorded, error: null }
    assert.equal(name, 'admin_cms_inspiration_read_v1')
    return { data: snapshot, error: null }
  }
  const markers: Array<CmsRecoveryMarker | null> = []
  const port = createCmsHttpPort(async (url, init) => {
    assert.equal(url, '/api/admin/content/cms'); assert.equal(init?.redirect, 'error'); assert.equal(init?.credentials, 'same-origin')
    assert.equal(init?.cache, 'no-store'); assert.equal(init?.mode, 'same-origin')
    if (JSON.parse(String(init?.body)).operation === 'command') assert.deepEqual(markers.at(-1), marker)
    const headers = new Headers(init?.headers); headers.set('Origin', ORIGIN)
    const response = await routes.POST(new Request(ORIGIN + String(url), { ...init, headers }))
    assert.match(response.headers.get('cache-control') ?? '', /no-store/)
    return response
  })
  const editor = createCmsEditor(port, CMS_TEST_ENTRY, { uuid: () => CMS_TEST_ID, intent: value => { markers.push(value); return true } })
  await editor.load(); editor.edit({ ...CMS_TEST_COPY, themen: ['natur'] }); await editor.send('save_draft')
  assert.equal(editor.getSnapshot().notice, 'saved')
  assert.equal(editor.getSnapshot().pending, null); assert.equal(markers.at(-1), null)
  assert.deepEqual(f.calls.map(call => call.name), ['admin_cms_inspiration_read_v1', 'admin_cms_inspiration_command_v1', 'admin_cms_inspiration_confirm_v1', 'admin_cms_inspiration_read_v1'])
  assert.equal(f.identities, 4)
})

test('RPC errors and malformed receipts never become fabricated writes or empty success', async () => {
  const f = fixture(), routes = compiled(f)
  for (const [code, status] of [['P4091', 409], ['P4092', 409], ['P4093', 409], ['P4041', 404], ['42501', 403], ['PGRST202', 503]]) {
    f.result = async () => ({ data: null, error: { code: String(code) } })
    assert.equal((await routes.POST(request(envelope))).status, status)
  }
  f.result = async () => ({ data: { ...fixtureReceipt(command, { draft: '1', created: '1' }), requestId: 'foreign' }, error: null })
  assert.equal((await routes.POST(request(envelope))).status, 503)
  const large = { ...command, expectedVersion: '9007199254740993' }
  f.result = async () => ({ data: fixtureReceipt(large, { draft: '1', created: '1' }), error: null })
  assert.equal((await routes.POST(request({ operation: 'command', command: large }))).status, 200)
  assert.equal(f.calls.at(-1)?.args.p_expected_version, '9007199254740993')
})

test('public route admits only the fixed published response; private fields and DB failure are unavailable', async () => {
  const f = fixture(), routes = compiled(f)
  const item = { entryId: CMS_TEST_ENTRY, revision: '1', content: fixtureRevision('1').content, publishedAt: CMS_TEST_AT }
  f.result = async name => { assert.equal(name, 'cms_inspiration_published_v2'); return { data: { schema: 1, items: [item] }, error: null } }
  const ok = await routes.GET(new Request(ORIGIN + '/api/cms/inspiration'))
  assert.equal(ok.status, 200); assert.match(ok.headers.get('cache-control') ?? '', /no-store/)
  assert.equal(f.identities, 0)
  assert.equal(parseCmsPublished({ schema: 1, items: [{ ...item, createdBy: CMS_TEST_ID }] }), null)
  assert.equal(parseCmsPublished({ schema: 1, items: [item, item] }), null)
  f.result = async () => ({ data: { schema: 1, items: [], operations: [] }, error: null })
  assert.equal((await routes.GET(new Request(ORIGIN + '/api/cms/inspiration'))).status, 503)
  f.result = async () => ({ data: null, error: { code: 'PGRST202' } })
  assert.deepEqual(await (await routes.GET(new Request(ORIGIN + '/api/cms/inspiration'))).json(), { ok: false, code: 'unavailable' })
})

test('HTTP loss and inconsistent errors remain uncertain while decompressed JSON ignores compressed length', async () => {
  const lost = createCmsHttpPort(async () => { throw new Error('network lost after commit') })
  assert.deepEqual(await lost.command(command), { ok: false, code: 'unavailable' })
  const bad = createCmsHttpPort(async () => Response.json({ ok: false, code: 'forbidden' }, { status: 200 }))
  assert.deepEqual(await bad.command(command), { ok: false, code: 'unavailable' })
  const compressed = createCmsHttpPort(async () => Response.json({ ok: true, value: { schema: 1, status: 'unknown', requestId: CMS_TEST_ID } }, { headers: { 'content-length': '1' } }))
  assert.equal((await compressed.confirm(CMS_TEST_ID)).ok, true)
})

test('reload keeps unknown writes locked and uses actor-bound receipt plus current read without any replay', async () => {
  let recorded = false, writes = 0, ids = 0
  const receipt = fixtureReceipt(command, { draft: '1', created: '1' })
  const port: CmsPort = {
    async read() { return { ok: true, value: fixtureRead({ draft: '1' }) } },
    async command() { writes++; throw Error('recovery must never write') },
    async confirm() { return { ok: true, value: recorded ? receipt : { schema: 1, status: 'unknown', requestId: CMS_TEST_ID } } },
  }
  const editor = createCmsEditor(port, CMS_TEST_ENTRY, { recovery: marker, uuid: () => { ids++; return CMS_TEST_ID } })
  await editor.load(); await editor.retry(); await editor.send('save_draft'); await editor.discardAndReload()
  assert.equal(editor.getSnapshot().phase, 'unconfirmed'); assert.equal(editor.getSnapshot().recovery?.requestId, CMS_TEST_ID)
  assert.equal(editor.getSnapshot().snapshot, null); assert.equal(writes, 0); assert.equal(ids, 0)
  assert.equal(parseCmsRecoveryConfirmation({ ...receipt, entryId: 'geonames:2267057' }, marker), null)
  assert.equal(parseCmsRecoveryConfirmation({ ...receipt, beforeVersion: '1' }, marker), null)
  recorded = true; await editor.reconcile()
  assert.equal(editor.getSnapshot().notice, 'saved'); assert.equal(editor.getSnapshot().recovery, null)
  assert.equal(writes, 0); assert.equal(ids, 0)
})

test('abort while admission is pending cannot continue into Auth or RPC; gate closure during identity also stops RPC', async () => {
  const f = fixture(), routes = compiled(f), controller = new AbortController()
  let enter!: () => void
  const entered = new Promise<void>(resolve => { enter = resolve })
  f.identity = async () => { enter(); return new Promise(() => {}) }
  const pending = routes.POST(request(envelope, { signal: controller.signal }))
  await entered; controller.abort()
  assert.equal((await pending).status, 504); assert.equal(f.calls.length, 0)
  f.identity = async () => { f.enabled = false; return { data: { user: { id: CMS_TEST_ID, is_anonymous: false } }, error: null } }
  assert.equal((await routes.POST(request(envelope))).status, 503); assert.equal(f.calls.length, 0)
  let invoked = false
  await assert.rejects(cmsDuring(async () => { invoked = true }, AbortSignal.abort()))
  assert.equal(invoked, false)
})

test('oversized and malformed UTF-8 bodies refuse content before parsing', async () => {
  const huge = new Response('x'.repeat(CMS_REQUEST_BYTES + 1))
  assert.equal(await cmsJsonBody(huge.body, CMS_REQUEST_BYTES, new AbortController().signal, null), null)
  const malformed = new Response(new Uint8Array([0xc3, 0x28]))
  assert.equal(await cmsJsonBody(malformed.body, CMS_REQUEST_BYTES, new AbortController().signal, null), null)
})

test('intent URL preserves only the operation reference and writing it must succeed before send', async () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'window')
  let href = ORIGIN + '/admin/content/editor'
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    location: { get href() { return href } }, history: { state: { retained: true }, replaceState(_state: unknown, _unused: string, url: string) { href = url } },
  } })
  try {
    assert.equal(writeCmsIntentLocation(marker), true)
    const url = new URL(href)
    assert.deepEqual([...url.searchParams.keys()].sort(), ['cmsExpectedVersion', 'cmsRequestId', 'entry'])
    assert.equal(url.searchParams.get('cmsRequestId'), CMS_TEST_ID)
    assert.equal(writeCmsIntentLocation(null), true)
    assert.equal(new URL(href).searchParams.has('cmsRequestId'), false)
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'window', descriptor)
    else Reflect.deleteProperty(globalThis, 'window')
  }
  let writes = 0
  const editor = createCmsEditor({ async read() { return { ok: true, value: fixtureRead() } },
    async command() { writes++; return { ok: false, code: 'unavailable' } }, async confirm() { throw Error('not sent') },
  }, CMS_TEST_ENTRY, { uuid: () => CMS_TEST_ID, intent: () => false })
  await editor.load(); editor.edit({ ...CMS_TEST_COPY, themen: ['natur'] }); await editor.send('save_draft')
  assert.equal(writes, 0); assert.equal(editor.getSnapshot().pending, null)
})
