// Source guard only. This file does not import or activate the transport.
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import ts from 'typescript'

const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const RUNTIME = 'lib/readiness/official-truth-product-v3/transport/'
const PROOF = 'scripts/db/official-truth-v3-node-postgres-transport-1/'
const sessions = RUNTIME + 'node-postgres-owned-session.ts'
const selection = RUNTIME + 'node-postgres-selection.ts'
const executors = RUNTIME + 'node-postgres-executors.ts'
const composition = 'lib/readiness/official-truth-product-v3/runtime/ch-de-server.ts'
const devVerification = 'scripts/official-truth-product-v3-dev/verify-installed-dev.mjs'
const allowed: Readonly<Record<string, readonly string[]>> = {
  [sessions]: [executors, PROOF + 'offline.test.ts', devVerification],
  [selection]: [sessions, executors, PROOF + 'offline.test.ts', PROOF + 'native.test.ts', PROOF + 'owned-tls-fixture.ts', composition, devVerification],
  [executors]: [PROOF + 'offline.test.ts', PROOF + 'native.test.ts', composition, devVerification],
  pg: [sessions, PROOF + 'owned-tls-fixture.ts'],
}
function files(directory: string): string[] {
  return readdirSync(resolve(ROOT, directory), { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') return []
    const path = directory + '/' + entry.name
    return entry.isDirectory() ? files(path) : /\.(?:[cm]?[jt]sx?)$/.test(path) ? [path] : []
  })
}
function target(from: string, specifier: string): string {
  if (specifier === 'pg' || specifier.startsWith('pg/') || specifier === 'pg-native') return 'pg'
  const path = specifier.startsWith('@/') ? specifier.slice(2)
    : specifier.startsWith('.') ? relative(ROOT, resolve(ROOT, dirname(from), specifier)) : specifier
  return path.replace(/\\/g, '/').replace(/\.(?:[cm]?js|tsx?)$/, '') + '.ts'
}
test('private Node-Postgres construction has only the finite reviewed importers', () => {
  const seen = new Map<string, Set<string>>()
  for (const path of ['app','components','lib','scripts'].flatMap(files)) {
    const source = ts.createSourceFile(path, readFileSync(resolve(ROOT, path), 'utf8'), ts.ScriptTarget.Latest, true)
    function check(specifier: string, node: ts.Node) {
      const selected = target(path, specifier)
      if (!Object.hasOwn(allowed, selected)) return
      assert.ok(allowed[selected]!.includes(path), `${path} may not import the private target ${selected}`)
      if (selected === 'pg') assert.equal(specifier, 'pg', 'no native or unreviewed driver entry point')
      if (selected === sessions && path === PROOF + 'offline.test.ts') {
        assert.ok(ts.isImportDeclaration(node) && node.importClause?.isTypeOnly, 'offline fixture receives no real connection constructor')
      }
      if (path === composition) assert.ok(ts.isImportDeclaration(node), 'the fixed server composition uses only direct imports')
      assert.ok(!ts.isExportDeclaration(node), 'private transport has no re-export entry point')
      const importers = seen.get(selected) ?? new Set<string>(); importers.add(path); seen.set(selected, importers)
    }
    function visit(node: ts.Node) {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        check(node.moduleSpecifier.text, node)
      }
      if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword
        || ts.isIdentifier(node.expression) && node.expression.text === 'require')) {
        const arg = node.arguments[0]
        if (arg && ts.isStringLiteral(arg)) check(arg.text, node)
        else if (path.startsWith(RUNTIME) || path === composition) assert.fail('runtime transport has no computed loader')
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
  for (const [selected, importers] of Object.entries(allowed)) assert.deepEqual([...(seen.get(selected) ?? [])].sort(), [...importers].sort(), selected)
  const manifest = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8')) as { dependencies: Record<string, string>; devDependencies: Record<string, string> }
  assert.equal(manifest.dependencies.pg, '8.23.1'); assert.equal(manifest.devDependencies['@types/pg'], '8.23.1')
})

test('the CH-to-DE server entry adds no other transport or browser importer', () => {
  const permits = (from: string, specifier: string) => allowed[target(from, specifier)]?.includes(from) ?? false
  assert.equal(permits(composition, '../transport/node-postgres-selection'), true)
  assert.equal(permits(composition, '../transport/node-postgres-executors'), true)
  for (const specifier of ['../transport/node-postgres-owned-session', 'pg', 'pg/native', 'pg-native']) {
    assert.equal(permits(composition, specifier), false, specifier)
  }
  for (const from of ['app/api/readiness/route.ts', 'components/readiness/OfficialTruthVisitorV3.tsx',
    composition.replace('/runtime/', '/runtime-copy/'), composition.replace('.ts', '-copy.ts')]) {
    for (const path of [selection, executors, sessions]) assert.equal(permits(from, '@/' + path), false, from + ': ' + path)
  }
  const source = ts.createSourceFile(composition, readFileSync(resolve(ROOT, composition), 'utf8'), ts.ScriptTarget.Latest, true)
  assert.ok(source.statements.some(node => ts.isImportDeclaration(node) && !node.importClause
    && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === 'server-only'))
})
