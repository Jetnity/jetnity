import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { dirname, join, resolve, relative } from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import ts from 'typescript'
import { changeImpactFoundationV1 } from './index'
import { fixture, point } from './fixtures'
import { LIMITS } from './contract'

const root = process.cwd()
const own = 'lib/reiseaenderung/change-impact-foundation-v1'

test('T12 static transitive runtime import closure is pure and provider-neutral; no activation caller', () => {
  const seen = new Set<string>()
  function inspect(file: string) {
    if (seen.has(file)) return
    seen.add(file)
    const ast = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
    function visit(node: ts.Node) {
      if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && !node.importClause?.isTypeOnly) {
        const name = node.moduleSpecifier.text
        if (name.startsWith('@/') || name.startsWith('.')) {
          const base = name.startsWith('@/') ? join(root, name.slice(2)) : resolve(dirname(file), name)
          const target = [`${base}.ts`, join(base, 'index.ts')].find(existsSync)
          assert(target, `missing import ${name}`)
          assert(!relative(root, target).startsWith('app/'))
          assert(!relative(root, target).startsWith('components/'))
          inspect(target)
        } else assert(['zod', 'node:util'].includes(name), `unexpected runtime dependency ${name}`)
      }
      if (ts.isCallExpression(node)) {
        const callee = node.expression.getText(ast)
        assert(!/\b(fetch|axios|require|eval|setTimeout|setInterval|randomUUID)\b|Date\.now|Math\.random|console\.|localStorage|sessionStorage/.test(callee), callee)
        assert(node.expression.kind !== ts.SyntaxKind.ImportKeyword, 'no dynamic runtime imports')
      }
      ts.forEachChild(node, visit)
    }
    visit(ast)
  }
  inspect(join(root, own, 'index.ts'))
  assert(seen.size > 6, 'transitive check must actually follow the canonical engines')
  function outside(dir: string) {
    if (!existsSync(dir)) return
    for (const entry of readdirSync(dir)) {
      const file = join(dir, entry), rel = relative(root, file)
      if (rel.startsWith(own)) continue
      if (statSync(file).isDirectory()) outside(file)
      else if (/\.[jt]sx?$/.test(entry) && !/\.test\./.test(entry)) {
        assert(!readFileSync(file, 'utf8').includes(own.slice(4)), `runtime consumer ${rel}`)
      }
    }
  }
  for (const dir of ['app', 'components', 'lib', 'hooks']) outside(join(root, dir))
  assert.match(readFileSync(join(root, 'lib/readiness/provider.ts'), 'utf8'), /return null/)
  const task = readFileSync(join(root, 'docs/JETNITY_CHANGE_IMPACT_FOUNDATION_V1_TASK_2026-10-16.md'))
  const blob = createHash('sha1').update(`blob ${task.length}\0`).update(task).digest('hex')
  assert.equal(blob, '351254986203c8a6fe3c4e7f6737653b3a76cfe4')
})

test('T12 no execution side effects, raw booking/price/URL/private title in output, or model authority', () => {
  const a = fixture(); a.days[0].items = [point('id', { note: 'PRIVATE_NOTE', title: 'PRIVATE_NAME',
    bookingUrl: 'https://example.invalid/PRIVATE_BOOKING', externalRef: 'PRIVATE_REFERENCE', priceAmount: 999.99, priceCurrency: 'CHF' })]
  const b = structuredClone(a); b.days[0].items[0].externalRef = 'PRIVATE_CHANGED_REFERENCE'; b.revision++
  const before = JSON.stringify([a, b]), fetch = globalThis.fetch
  globalThis.fetch = () => { throw Error('network forbidden') }
  try {
    const r = changeImpactFoundationV1(a, b)
    assert.equal(JSON.stringify([a, b]), before)
    assert(!JSON.stringify(r).includes('PRIVATE_'))
    assert(!JSON.stringify(r).includes('999.99'))
    assert(r.claims.some(c => c.reasonCodes.includes('field:externalRef')))
  } finally { globalThis.fetch = fetch }
})

test('T09 extra prototype keys, symbols, nonenumerable/accessor fields, depth/text budgets and unsupported fields', () => {
  const a = fixture()
  const checks: unknown[] = []
  const symbol = structuredClone(a); Object.assign(symbol, { [Symbol('secret')]: true }); checks.push(symbol)
  const hidden = structuredClone(a); Object.defineProperty(hidden, 'hidden', { value: true }); checks.push(hidden)
  const pollution = structuredClone(a); Object.defineProperty(pollution, '__proto__', { value: {}, enumerable: true }); checks.push(pollution)
  let deep: unknown = null
  for (let i = 0; i < LIMITS.depth + 1; i++) deep = { nested: deep }
  checks.push({ ...a, deep }, { ...a, timezone: 'invented' }, { ...a, revision: Number.NaN })
  const sparse = structuredClone(a); sparse.days = new Array(3); checks.push(sparse)
  const manyKeys = { ...a }; for (let i = 0; i < 110; i++) Object.assign(manyKeys, { [`key${i}`]: null }); checks.push(manyKeys)
  for (const bad of checks) assert.equal(changeImpactFoundationV1(a, bad as typeof a).evaluation, 'blocked')
})

test('T10 isolated process timezone and language settings do not alter serialized output', () => {
  const code = `const { changeImpactFoundationV1 } = require('./${own}/index.ts'); const { fixture, atAirport } = require('./${own}/fixtures.ts'); const a=fixture(); a.days[0].items=[atAirport('a'),atAirport('b')];const b=structuredClone(a);b.days[0].items[0].startsAt='09:00';console.log(JSON.stringify(changeImpactFoundationV1(a,b)));`
  const run = (TZ: string, LANG: string) => execFileSync(process.execPath, ['--import', 'tsx', '-e', code], {
    cwd: root, env: { ...process.env, TZ, LANG }, encoding: 'utf8', timeout: 20_000,
  })
  assert.equal(run('Pacific/Honolulu', 'en_US.UTF-8'), run('Asia/Tokyo', 'tr_TR.UTF-8'))
})
