import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { before, test } from 'node:test'
import { createElement, isValidElement, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { build } from 'esbuild'
import { HomeInspiration } from '@/components/home/HomeInspiration'
import InspirationExplorer from '@/components/inspiration/explorer-1/InspirationExplorer'
import type { CmsPortResult } from '@/lib/admin/content/cms-editor-2/port'
import { CMS_TEST_AT, CMS_TEST_ENTRY, fixtureRevision } from '@/scripts/admin-cms-editor-2/fixtures'
import { cmsPublishedInspiration } from './cms-public'
import { ENTDECKEN_ZIELE, entdeckerTreffer } from './explorer-1/katalog'

const description = 'Veröffentlichte Kulturwege mit viel Zeit für kleine Museen.'
const idea = 'Eine bestätigte redaktionelle Reiseidee mit eigener Planung'
const item = { entryId: CMS_TEST_ENTRY, revision: '1', publishedAt: CMS_TEST_AT,
  content: { ...fixtureRevision('1').content, beschreibung: description, idea, themen: ['stadt-kultur'] } }
const result: CmsPortResult = { ok: true, value: { schema: 1, items: [item] } }
type Fixture = { enabled: boolean; calls: number; connections: number; result: CmsPortResult }
type Pages = { HomePage(): Promise<ReactNode>; EntdeckenSeite(props: { searchParams?: Promise<Record<string, string>> }): Promise<ReactNode> }
let pages: (fixture: Fixture) => Pages

before(async () => {
  const output = await build({ absWorkingDir: process.cwd(), bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic',
    external: ['react', 'react/jsx-runtime', 'lucide-react'], stdin: { resolveDir: process.cwd(), contents:
      "export { default as HomePage } from './app/(public)/page'; export { default as EntdeckenSeite } from './app/(public)/entdecken/page';" },
    plugins: [{ name: 'public-cms-boundaries', setup(builder) {
      builder.onResolve({ filter: /^(server-only|next\/(server|link)|@\/lib\/(admin\/hosted-runtime-activation|admin\/content\/cms-editor-2\/server))$/ }, args => ({ path: args.path, namespace: 'cms-public' }))
      builder.onResolve({ filter: /^@\/components\// }, args => ({ path: args.path, namespace: 'cms-component' }))
      builder.onLoad({ filter: /.*/, namespace: 'cms-component' }, args => {
        const name = args.path.split('/').at(-1)!
        return { contents: `export const ${name}='${name}'; export default ${name};` }
      })
      builder.onLoad({ filter: /.*/, namespace: 'cms-public' }, args => ({ contents:
        args.path === 'server-only' ? 'export {}'
          : args.path === 'next/link' ? "export default 'a'"
            : args.path === 'next/server' ? 'export async function connection(){__publicCms.connections++}'
              : args.path.endsWith('hosted-runtime-activation') ? 'export function isAdminHostedRuntimeEnabled(){return __publicCms.enabled}'
                : 'export async function readCmsPublished(signal){if(!(signal instanceof AbortSignal))throw Error("missing deadline");__publicCms.calls++;return __publicCms.result}',
      }))
    } }],
  })
  const execute = new Function('require', 'module', 'exports', '__publicCms', output.outputFiles[0].text)
  pages = fixture => {
    const fixtureModule = { exports: {} }
    execute(createRequire(import.meta.url), fixtureModule, fixtureModule.exports, fixture)
    return fixtureModule.exports as Pages
  }
})

function find(node: ReactNode, name: string): Record<string, unknown> | null {
  if (Array.isArray(node)) {
    for (const child of node) { const found = find(child, name); if (found) return found }
    return null
  }
  if (!isValidElement<{ children?: ReactNode }>(node)) return null
  if (node.type === name) return node.props as Record<string, unknown>
  return find(node.props.children, name)
}

test('published copy, themes and planning handoff replace only the selected confirmed references', () => {
  const published = cmsPublishedInspiration(result)
  assert.equal(published.status, 'published'); assert.equal(published.ziele.length, 1)
  assert.equal(published.ziele[0].placeId, CMS_TEST_ENTRY)
  assert.equal(published.ziele[0].beschreibung, description)
  assert.equal(published.ziele[0].idea, idea)
  assert.deepEqual(published.ziele[0].themen, ['stadt-kultur'])
  const href = new URL(published.ziele[0].href!, 'https://example.test')
  assert.equal(href.searchParams.get('idee'), idea); assert.equal(href.searchParams.get('zielId'), CMS_TEST_ENTRY)
  assert.equal(entdeckerTreffer({ q: 'Kulturwege', thema: 'stadt-kultur' }, published.ziele).length, 1)
  assert.equal(entdeckerTreffer({ q: '', thema: 'strand' }, published.ziele).length, 0)
  assert.equal(entdeckerTreffer({ q: 'Lissabon', thema: 'alle' }, published.ziele).length, 0)
})

test('unavailable, untrusted and empty published states remain distinct without static resurrection', () => {
  assert.deepEqual(cmsPublishedInspiration({ ok: false, code: 'unavailable' }), { status: 'unavailable', ziele: [] })
  assert.deepEqual(cmsPublishedInspiration({ ok: true, value: { schema: 1, items: [] } }), { status: 'published', ziele: [] })
  for (const value of [
    { schema: 1, items: [{ ...item, draftRevision: '2' }] },
    { schema: 1, items: [{ ...item, content: { ...item.content, image: 'https://foreign.example/image' } }] },
    { schema: 1, items: [item, item] },
  ]) assert.deepEqual(cmsPublishedInspiration({ ok: true, value }), { status: 'unavailable', ziele: [] })
})

test('both actual public pages consume the active reader and propagate its source state', async () => {
  const f: Fixture = { enabled: true, calls: 0, connections: 0, result }
  const entry = pages(f)
  const home = find(await entry.HomePage(), 'HomeInspiration')
  const explorer = find(await entry.EntdeckenSeite({ searchParams: Promise.resolve({ thema: 'stadt-kultur' }) }), 'InspirationExplorer')
  assert.ok(home); assert.ok(explorer)
  assert.equal(home.status, 'published'); assert.equal(explorer.status, 'published')
  assert.equal((home.ziele as unknown[]).length, 1); assert.equal((explorer.ziele as unknown[]).length, 1)
  assert.equal(new URL((home.ziele as Array<{ href: string }>)[0].href, 'https://example.test').searchParams.get('idee'), idea)
  assert.equal(f.calls, 2); assert.equal(f.connections, 2)
  f.result = { ok: true, value: { schema: 1, items: [] } }
  assert.deepEqual(find(await entry.HomePage(), 'HomeInspiration')?.ziele, [])
})

test('closed Dev gate preserves the four original public cards and performs no request-time or database work', async () => {
  const f: Fixture = { enabled: false, calls: 0, connections: 0, result: { ok: false, code: 'unavailable' } }
  const entry = pages(f)
  const home = find(await entry.HomePage(), 'HomeInspiration')
  const explorer = find(await entry.EntdeckenSeite({}), 'InspirationExplorer')
  assert.ok(home); assert.ok(explorer)
  assert.equal(home.status, 'static'); assert.equal(explorer.status, 'static')
  assert.deepEqual(explorer.ziele, ENTDECKEN_ZIELE)
  assert.deepEqual((home.ziele as Array<{ href: string }>).map(row => row.href), ENTDECKEN_ZIELE.map(row => row.href))
  assert.equal(f.calls, 0); assert.equal(f.connections, 0)
})

test('both public pages expose missing installation as unavailable instead of claiming empty publication', async () => {
  const f: Fixture = { enabled: true, calls: 0, connections: 0, result: { ok: false, code: 'unavailable' } }
  const entry = pages(f)
  for (const props of [find(await entry.HomePage(), 'HomeInspiration'), find(await entry.EntdeckenSeite({}), 'InspirationExplorer')]) {
    assert.ok(props); assert.equal(props.status, 'unavailable'); assert.deepEqual(props.ziele, [])
  }
})

test('actual public components render published copy and honest absence in German without adding required caller props', () => {
  const published = cmsPublishedInspiration(result)
  const explorer = renderToStaticMarkup(createElement(InspirationExplorer, { initial: { q: '', thema: 'alle' }, ...published }))
  assert.ok(explorer.includes(description)); assert.ok(explorer.includes(idea))
  assert.ok(explorer.includes('lang="de"')); assert.ok(!explorer.includes('Lissabon'))
  const homeGoals = published.ziele.map(row => ({ ...row, href: row.href! }))
  const home = renderToStaticMarkup(createElement(HomeInspiration, { ziele: homeGoals, status: published.status }))
  assert.ok(home.includes('lang="de"')); assert.ok(home.includes('Bali')); assert.ok(!home.includes('Lissabon'))
  const unavailable = renderToStaticMarkup(createElement(HomeInspiration, { ziele: homeGoals, status: 'unavailable' }))
  assert.match(unavailable, /Reiseideen derzeit nicht verfügbar/); assert.ok(!unavailable.includes('/images/bali.jpg'))
  const empty = renderToStaticMarkup(createElement(InspirationExplorer, { initial: { q: '', thema: 'alle' }, ziele: [], status: 'published' }))
  assert.match(empty, /keine Reiseideen veröffentlicht/); assert.doesNotMatch(empty, /Noch keine passende Idee/)
  assert.doesNotThrow(() => renderToStaticMarkup(createElement(InspirationExplorer, { initial: { q: '', thema: 'alle' } })))
})
