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
const ZERMATT_REDAKTION = 'geonames:2657915'
const ZERMATT_ZIEL = 'geonames:2657928'
const zermattIdea = 'Eine veröffentlichte Zermatt-Reiseidee mit eigener Planung'
const zermattItem = { entryId: ZERMATT_REDAKTION, revision: '1', publishedAt: CMS_TEST_AT,
  content: { entryId: ZERMATT_REDAKTION, locale: 'de', name: 'Zermatt', country: 'Schweiz', image: '/images/zermatt.jpg',
    beschreibung: 'Berge, Wandern und Ruhe in einem veröffentlichten Text.', idea: zermattIdea, themen: ['natur'] } }
const zermattResult: CmsPortResult = { ok: true, value: { schema: 1, items: [zermattItem] } }
type Fixture = { enabled: boolean; publicPreview?: boolean; calls: number; connections: number; result: CmsPortResult }
type Pages = { HomePage(): Promise<ReactNode>; EntdeckenSeite(props: { searchParams?: Promise<Record<string, string>> }): Promise<ReactNode> }
let pages: (fixture: Fixture) => Pages

before(async () => {
  const output = await build({ absWorkingDir: process.cwd(), bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic',
    external: ['react', 'react/jsx-runtime', 'lucide-react'], stdin: { resolveDir: process.cwd(), contents:
      "export { default as HomePage } from './app/(public)/page'; export { default as EntdeckenSeite } from './app/(public)/entdecken/page';" },
    plugins: [{ name: 'public-cms-boundaries', setup(builder) {
      builder.onResolve({ filter: /^(server-only|next\/(server|link)|\.\/cms-preview-read|@\/lib\/(admin\/hosted-runtime-activation|admin\/content\/cms-editor-2\/server))$/ }, args => ({ path: args.path, namespace: 'cms-public' }))
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
                : args.path.endsWith('cms-preview-read') ? 'export function isCmsPreviewReadEnabled(){return __publicCms.publicPreview===true}'
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

test('a published Zermatt revision keeps the persisted legacy reference but hands off with the canonical GeoNames place', () => {
  const published = cmsPublishedInspiration(zermattResult)
  assert.equal(published.status, 'published'); assert.equal(published.ziele.length, 1)
  const ziel = published.ziele[0]
  assert.equal(ziel.placeId, ZERMATT_REDAKTION); assert.equal(ziel.zielId, ZERMATT_ZIEL)
  assert.equal(ziel.image, '/images/zermatt.jpg'); assert.equal(ziel.idea, zermattIdea)
  assert.ok(ziel.href!.includes('zielId=geonames%3A2657928'))
  const href = new URL(ziel.href!, 'https://example.test')
  assert.equal(href.searchParams.get('zielId'), ZERMATT_ZIEL); assert.equal(href.searchParams.get('idee'), zermattIdea)
  assert.doesNotMatch(ziel.href!, /2657915/)
  assert.equal(cmsPublishedInspiration({ ok: true, value: { schema: 1, items: [{ ...zermattItem, content: { ...zermattItem.content, entryId: ZERMATT_ZIEL } }] } }).status, 'unavailable',
    'die Zielkennung ist kein CMS-Eintrag und wird nicht gleichgesetzt')
})

test('the static catalogue and every page state hand Zermatt off with 2657928 and never with the Zofingen identity', async () => {
  const zermatt = ENTDECKEN_ZIELE.find(ziel => ziel.name === 'Zermatt')!
  assert.equal(zermatt.placeId, ZERMATT_REDAKTION); assert.equal(zermatt.zielId, ZERMATT_ZIEL)
  assert.ok(zermatt.href!.includes('zielId=geonames%3A2657928')); assert.doesNotMatch(zermatt.href!, /2657915/)
  for (const ziel of ENTDECKEN_ZIELE.filter(row => row.name !== 'Zermatt')) {
    assert.equal(new URL(ziel.href!, 'https://example.test').searchParams.get('zielId'), ziel.placeId, ziel.name)
  }
  const states: Array<{ label: string; fixture: Fixture; status: string }> = [
    { label: 'published', fixture: { enabled: true, calls: 0, connections: 0, result: zermattResult }, status: 'supplemented' },
    { label: 'empty', fixture: { enabled: true, calls: 0, connections: 0, result: { ok: true, value: { schema: 1, items: [] } } }, status: 'supplemented' },
    { label: 'unavailable', fixture: { enabled: true, calls: 0, connections: 0, result: { ok: false, code: 'unavailable' } }, status: 'fallback' },
    { label: 'closed gate', fixture: { enabled: false, calls: 0, connections: 0, result: { ok: false, code: 'unavailable' } }, status: 'static' },
  ]
  for (const { label, fixture, status } of states) {
    const entry = pages(fixture)
    const home = find(await entry.HomePage(), 'HomeInspiration')
    const explorer = find(await entry.EntdeckenSeite({}), 'InspirationExplorer')
    assert.equal(home?.status, status, label); assert.equal(explorer?.status, status, label)
    for (const [stelle, ziele] of [['home', home?.ziele], ['explorer', explorer?.ziele]] as const) {
      const rows = ziele as Array<{ name: string; href: string; image: string }>
      assert.equal(rows.length, 4, `${label} ${stelle}: Zermatt kommt genau einmal vor`)
      const links = rows.filter(row => row.name === 'Zermatt')
      assert.equal(links.length, 1, `${label} ${stelle}`)
      const url = new URL(links[0].href, 'https://example.test')
      assert.equal(url.searchParams.get('zielId'), ZERMATT_ZIEL, `${label} ${stelle}`)
      assert.equal(links[0].image, '/images/zermatt.jpg', `${label} ${stelle}: die CMS-Referenz behält den alten Bildpfad`)
      for (const row of rows) assert.doesNotMatch(row.href, /zielId=geonames%3A2657915/, `${label} ${stelle} ${row.name}`)
    }
    if (label === 'published') {
      const rows = home?.ziele as Array<{ name: string; href: string }>
      assert.equal(new URL(rows.find(row => row.name === 'Zermatt')!.href, 'https://example.test').searchParams.get('idee'), zermattIdea)
    }
  }
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

test('both actual public pages add missing static goals and preserve the published planning handoff', async () => {
  const f: Fixture = { enabled: true, calls: 0, connections: 0, result }
  const entry = pages(f)
  const home = find(await entry.HomePage(), 'HomeInspiration')
  const explorer = find(await entry.EntdeckenSeite({ searchParams: Promise.resolve({ thema: 'stadt-kultur' }) }), 'InspirationExplorer')
  assert.ok(home); assert.ok(explorer)
  assert.equal(home.status, 'supplemented'); assert.equal(explorer.status, 'supplemented')
  assert.equal((home.ziele as unknown[]).length, 4); assert.equal((explorer.ziele as unknown[]).length, 4)
  assert.equal(new URL((home.ziele as Array<{ href: string }>)[0].href, 'https://example.test').searchParams.get('idee'), idea)
  assert.equal(f.calls, 2); assert.equal(f.connections, 2)
  f.result = { ok: true, value: { schema: 1, items: [] } }
  const emptyHome = find(await entry.HomePage(), 'HomeInspiration')
  const emptyExplorer = find(await entry.EntdeckenSeite({}), 'InspirationExplorer')
  assert.equal(emptyHome?.status, 'supplemented'); assert.equal(emptyExplorer?.status, 'supplemented')
  assert.equal((emptyHome?.ziele as unknown[]).length, 4)
  assert.deepEqual(emptyExplorer?.ziele, ENTDECKEN_ZIELE)
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

test('errors, timeouts and untrusted drafts fall back only to the known catalogue without claiming empty publication', async () => {
  for (const badResult of [
    { ok: false, code: 'unavailable' },
    { ok: false, code: 'timeout' },
    { ok: true, value: { schema: 1, items: [{ ...item, draftRevision: '2', content: { ...item.content, idea: 'UNPUBLISHED_SECRET_DRAFT' } }] } },
  ] satisfies CmsPortResult[]) {
    const f: Fixture = { enabled: true, calls: 0, connections: 0, result: badResult }
    const entry = pages(f)
    const home = find(await entry.HomePage(), 'HomeInspiration')
    const explorer = find(await entry.EntdeckenSeite({}), 'InspirationExplorer')
    assert.equal(home?.status, 'fallback'); assert.equal(explorer?.status, 'fallback')
    assert.equal((home?.ziele as unknown[]).length, 4)
    assert.deepEqual(explorer?.ziele, ENTDECKEN_ZIELE)
    assert.doesNotMatch(JSON.stringify([home, explorer]), /UNPUBLISHED_SECRET_DRAFT|draftRevision/)
  }
})

test('the explicit public-only Dev preview reads CMS without enabling the Admin runtime', async () => {
  const f: Fixture = { enabled: false, publicPreview: true, calls: 0, connections: 0, result }
  const entry = pages(f)
  const home = find(await entry.HomePage(), 'HomeInspiration')
  const explorer = find(await entry.EntdeckenSeite({}), 'InspirationExplorer')
  assert.equal(home?.status, 'supplemented'); assert.equal(explorer?.status, 'supplemented')
  assert.equal(f.calls, 2); assert.equal(f.connections, 2)
  assert.equal(new URL((home?.ziele as Array<{ href: string }>)[0].href, 'https://example.test').searchParams.get('idee'), idea)
})

test('supplemented and fallback components show useful cards, details and honest source state', async () => {
  const f: Fixture = { enabled: true, calls: 0, connections: 0, result }
  const entry = pages(f)
  const props = find(await entry.EntdeckenSeite({}), 'InspirationExplorer')!
  const ziele = props.ziele as typeof ENTDECKEN_ZIELE
  const markup = renderToStaticMarkup(createElement(InspirationExplorer, { initial: { q: '', thema: 'alle' }, ziele, status: 'supplemented' }))
  assert.match(markup, /Bali/); assert.match(markup, /Lissabon/)
  assert.ok(markup.includes(description)); assert.ok(markup.includes(idea))
  assert.equal(entdeckerTreffer({ q: 'Kulturwege', thema: 'stadt-kultur' }, ziele).length, 1)
  assert.equal(entdeckerTreffer({ q: 'Lissabon', thema: 'alle' }, ziele).length, 1)
  assert.doesNotMatch(markup, /keine Reiseideen veröffentlicht|vorübergehend nicht verfügbar/)
  const fallback = renderToStaticMarkup(createElement(InspirationExplorer, { initial: { q: '', thema: 'alle' }, ziele: ENTDECKEN_ZIELE, status: 'fallback' }))
  assert.match(fallback, /Weitere Reiseideen sind vorübergehend nicht verfügbar/)
  assert.match(fallback, /Bali/); assert.match(fallback, /Amsterdam/)
  assert.doesNotMatch(fallback, /keine Reiseideen veröffentlicht/)
  const home = renderToStaticMarkup(createElement(HomeInspiration, {
    ziele: ENTDECKEN_ZIELE.map(ziel => ({ ...ziel, href: ziel.href! })), status: 'fallback',
  }))
  assert.match(home, /vorübergehend nicht verfügbar/); assert.match(home, /reiseatlas\.webp/)
  assert.match(home, /bali\.png/); assert.doesNotMatch(home, /bali\.jpg/); assert.match(home, /data-illustrationshinweis/); assert.match(home, /KI-Illustration: Reisterrassen und Palmen im Morgenlicht, Motiv Bali/)
  assert.doesNotMatch(home, /zermatt[\w-]*\.(?:jpg|png)/)
})

test('actual public components render published copy and honest absence in German without adding required caller props', () => {
  const published = cmsPublishedInspiration(result)
  const explorer = renderToStaticMarkup(createElement(InspirationExplorer, { initial: { q: '', thema: 'alle' }, ...published }))
  assert.ok(explorer.includes(description)); assert.ok(explorer.includes(idea))
  assert.ok(explorer.includes('lang="de"')); assert.ok(!explorer.includes('Lissabon'))
  const homeGoals = published.ziele.map(row => ({ ...row, href: row.href! }))
  const home = renderToStaticMarkup(createElement(HomeInspiration, { ziele: homeGoals, status: published.status }))
  assert.ok(home.includes('lang="de"')); assert.ok(home.includes('Bali')); assert.ok(!home.includes('Lissabon'))
  assert.match(home, /bali\.png/); assert.match(home, /data-illustrationshinweis/); assert.ok(!home.includes('lisbon.png'))
  const unavailable = renderToStaticMarkup(createElement(HomeInspiration, { ziele: homeGoals, status: 'unavailable' }))
  assert.match(unavailable, /Reiseideen derzeit nicht verfügbar/); assert.ok(!unavailable.includes('/images/bali.png') && !unavailable.includes('/images/bali.jpg'))
  const empty = renderToStaticMarkup(createElement(InspirationExplorer, { initial: { q: '', thema: 'alle' }, ziele: [], status: 'published' }))
  assert.match(empty, /keine Reiseideen veröffentlicht/); assert.doesNotMatch(empty, /Noch keine passende Idee/)
  assert.doesNotThrow(() => renderToStaticMarkup(createElement(InspirationExplorer, { initial: { q: '', thema: 'alle' } })))
})
