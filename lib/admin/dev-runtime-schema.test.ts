import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'
import { LOCAL_UNAPPLIED_RPCS, pruefe } from '../../scripts/db/verwendung.mjs'

const cmsSql = 'scripts/db/admin-editorial-cms-1/functions-candidate.sql'
const marketingSql = 'scripts/db/admin-marketing-drafts-1/functions-candidate.sql'
const contracts = [
  ['admin_account_counts_v1', 'scripts/db/admin-account-counts-delivery-1-rpc.sql', []],
  ['admin_cms_inspiration_command_v1', cmsSql, [
    ['p_request_id', 'uuid', 'string', false], ['p_entry_id', 'text', 'string', false],
    ['p_expected_version', 'bigint', 'string', false], ['p_action', 'text', 'string', false],
    ['p_payload', 'jsonb', 'Json', false],
  ]],
  ['admin_cms_inspiration_read_v1', cmsSql, [
    ['p_entry_id', 'text', 'string', false], ['p_revision', 'bigint', 'string|null', true],
    ['p_before_revision', 'bigint', 'string|null', true], ['p_limit', 'integer', 'number', true],
  ]],
  ['admin_cms_inspiration_confirm_v1', cmsSql, [['p_request_id', 'uuid', 'string', false]]],
  ['cms_inspiration_published_v1', cmsSql, []],
  ['cms_inspiration_published_v2', 'scripts/db/admin-service-recovery-20261119/candidate.sql', []],
  ['admin_marketing_drafts_apply_v1', marketingSql, [['input', 'jsonb', 'Json', false]]],
  ['admin_marketing_drafts_read_v1', marketingSql, [['input', 'jsonb', 'Json', false]]],
] as const

test('the finite typed Dev extension matches each actual SQL signature without claiming an installed schema', () => {
  const file = ts.createSourceFile('types/admin-dev-runtime.ts', readFileSync('types/admin-dev-runtime.ts', 'utf8'), ts.ScriptTarget.Latest, true)
  const alias = file.statements.find((node): node is ts.TypeAliasDeclaration => ts.isTypeAliasDeclaration(node) && node.name.text === 'AdminDevRuntimeFunctions')
  assert.ok(alias && ts.isTypeLiteralNode(alias.type))
  const members = alias.type.members.filter(ts.isPropertySignature)
  assert.deepEqual(members.map(member => member.name.getText(file)), contracts.map(([name]) => name))
  for (const [name, sqlPath, expected] of contracts) {
    const member = members.find(candidate => candidate.name.getText(file) === name)
    assert.ok(member?.type && ts.isTypeLiteralNode(member.type))
    const fields = member.type.members.filter(ts.isPropertySignature)
    assert.equal(fields.find(field => field.name.getText(file) === 'Returns')?.type?.getText(file),
      name === 'admin_account_counts_v1' ? 'AdminAccountCountsRpcRow[]' : 'Json')
    const args = fields.find(field => field.name.getText(file) === 'Args')?.type
    assert.ok(args)
    if (expected.length === 0) assert.equal(args.getText(file), 'never')
    else {
      assert.ok(ts.isTypeLiteralNode(args))
      assert.deepEqual(args.members.filter(ts.isPropertySignature).map(arg => [
        arg.name.getText(file), arg.type?.getText(file).replace(/\s/g, ''), !!arg.questionToken,
      ]), expected.map(([argName, , type, optional]) => [argName, type, optional]))
    }
    const source = readFileSync(sqlPath, 'utf8')
    const match = new RegExp(`create(?:\\s+or\\s+replace)?\\s+function\\s+public\\.${name}\\s*\\(([^)]*)\\)\\s+returns\\s+(jsonb|table\\s*\\(([^)]*)\\))`, 'i').exec(source)
    assert.ok(match, name + ': actual function definition missing')
    const sqlArgs = match[1].trim() ? match[1].trim().split(',').map(arg => arg.trim().split(/\s+/)) : []
    assert.deepEqual(sqlArgs.map(arg => [arg[0], arg[1].toLowerCase(), arg.some(part => part.toLowerCase() === 'default')]),
      expected.map(([argName, sqlType, , optional]) => [argName, sqlType, optional]), name)
    if (name === 'admin_account_counts_v1') assert.deepEqual(match[3].trim().split(',').map(field => field.trim().replace(/\s+/g, ' ')), [
      'present_registered_accounts text', 'created_in_prior_30_days text', 'measured_at timestamp with time zone',
      'window_start timestamp with time zone', 'definition_version text',
    ])
    else assert.equal(match[2].toLowerCase(), 'jsonb')
  }
  const generated = readFileSync('types/supabase.ts', 'utf8')
  for (const [name] of contracts) assert.equal(new RegExp(`^ {6}${name}:`, 'm').test(generated), false)
})

test('each CMS/campaign RPC stays limited to its exact server source and SQL artifact', () => {
  for (const [name, sqlPath] of contracts.slice(1)) {
    const sourcePath = name.includes('marketing') ? 'lib/admin/marketing/drafts/server.ts' : 'lib/admin/content/cms-editor-2/server.ts'
    assert.deepEqual(LOCAL_UNAPPLIED_RPCS.filter(rule => rule.name === name), [{ name, sourcePath, sqlPath }])
    const run = (path: string, sqlPresent: boolean, rpcName: string = name) => pruefe({
      dateien: [path], lese: () => '.' + `rpc('${rpcName}')`, typenInhalt: '    Functions: {\n    }',
      sqlVorhanden: () => sqlPresent, sqlInhalt: () => readFileSync(sqlPath, 'utf8'),
    })
    assert.equal(run(sourcePath, true).befunde.length, 0)
    assert.equal(run(sourcePath, true).lokaleUnapplied.length, 1)
    assert.equal(run('lib/another-server.ts', true).befunde[0]?.grund, 'wrong-source')
    assert.equal(run(sourcePath, false).befunde[0]?.grund, 'missing-sql')
    assert.equal(run(sourcePath, true, name + '_unknown').befunde.length, 1)
  }
})
