// Offline, fixed-input compiler only. Never opens a database or accepts a DSN.
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { assertTransactionBody, functionsIn } from '../official-truth-v3-background-guard-1/build.mjs'

const here = new URL('./', import.meta.url)
const root = new URL('../../../', import.meta.url)
const read = (path, base = here) => readFileSync(new URL(path, base), 'utf8')
const sha = value => createHash('sha256').update(value).digest('hex')
const quote = value => "'" + String(value).replaceAll("'", "''") + "'"
const json = value => quote(JSON.stringify(value)) + '::jsonb'
const sqlArray = values => 'ARRAY[' + values.map(quote).join(',') + ']::text[]'
export const TARGET = 'dev:yfvbxvijcorffwxbxahl:ADMIN-RUNTIME-BG1-1'
export const BASELINE = 'official_v3_guard_private.admin_runtime_baseline_v1'
export const REPLACEMENTS = Object.freeze([
  'official_v3_guard_private.catalog_status_v1()',
  'official_v3_guard_private.assert_catalog_v1()',
  'official_v3_guard_private.require_open_v1()',
  'public.official_v3_guard_alarm_status_v1()',
])
export const STORE_SCHEMAS = Object.freeze(['jetnity_reporting', 'jetnity_cms_private', 'jetnity_marketing_private'])
const predecessorPath = 'scripts/db/official-truth-v3-dev-cycle4-attempt2-recovery-1/provider-migration-body.sql'
const countsPath = 'scripts/db/admin-account-counts-dev-20261115/install.sql'
const cmsPaths = ['schema-candidate.sql', 'functions-candidate.sql'].map(p => 'scripts/db/admin-editorial-cms-1/' + p)
const marketingPaths = ['schema-candidate.sql', 'functions-candidate.sql'].map(p => 'scripts/db/admin-marketing-drafts-1/' + p)
const guardCall = 'PERFORM official_v3_guard_private.admin_runtime_guard_v1();'

function once(value, marker, replacement) {
  assert.equal(value.split(marker).length, 2, 'one exact Admin integration anchor: ' + marker.slice(0, 100))
  return value.replace(marker, () => replacement)
}
function definition(f, body, options = f.options, replace = true) {
  return `CREATE ${replace ? 'OR REPLACE ' : ''}FUNCTION ${f.name}(${f.args}) ${options}AS $admin_runtime_body$${body}$admin_runtime_body$;`
}
function volatile(options) {
  return /\bSTABLE\b/i.test(options) ? options.replace(/\bSTABLE\b/i, 'VOLATILE') : options
}
function guardedBody(body, jsonResult = false) {
  const returns = [...body.matchAll(/^([ \t]*)RETURN[ \t]+([\s\S]*?);/gm)]
  assert.ok(returns.length > 0, 'closed guarded function has a successful return')
  assert.equal(returns.length, [...body.matchAll(/\bRETURN\b/g)].length,
    'all pinned returns must use the reviewed statement form; inline or bare returns require explicit review')
  let result = jsonResult ? once(body, 'DECLARE', 'DECLARE\n  admin_runtime_result jsonb;') : body
  result = once(result, 'BEGIN\n', 'BEGIN\n  ' + guardCall + '\n')
  // Stage each complete JSON expression before the final check. This covers
  // early/idempotent returns as well as the final result, without moving a
  // query or formatter behind the guard. Actors already return a local UUID.
  result = result.replace(/^([ \t]*)RETURN[ \t]+([\s\S]*?);/gm, (_whole, indent, expression) =>
    jsonResult ? indent + 'admin_runtime_result := ' + expression + ';\n' + indent + guardCall
      + '\n' + indent + 'RETURN admin_runtime_result;'
      : indent + guardCall + '\n' + indent + 'RETURN ' + expression + ';')
  return result
}

export function functionMetadata(f, grantees = ['postgres']) {
  const argumentsList = f.args.split(',').map(x => x.trim()).filter(Boolean)
  const resultTable = /RETURNS\s+TABLE\s*\(([\s\S]*?)\)/i.exec(f.options)?.[1]
  const outputs = resultTable?.split(',').map(x => x.trim().split(/\s+/)) ?? []
  const scalar = /RETURNS\s+([^\n]+?)\s+LANGUAGE/i.exec(f.options)?.[1]?.trim()
  const config = [...f.options.matchAll(/\bSET\s+(\w+)\s*=\s*([\s\S]*?)(?=\s+SET\s+|$)/gi)].map(m => {
    const key = ({ timezone: 'TimeZone', datestyle: 'DateStyle' })[m[1].toLowerCase()] ?? m[1]
    const value = m[2].trim().replace(/^'|'$/g, '')
    return key + '=' + (key === 'search_path' ? value.replace(/\s*,\s*/g, ', ') : value)
  })
  assert.ok(scalar || resultTable, 'known result shape: ' + f.signature)
  return {
    signature: f.signature, name: f.name, hash: sha(f.body),
    language: /LANGUAGE\s+(\w+)/i.exec(f.options)[1].toLowerCase(),
    definer: /SECURITY DEFINER/i.test(f.options),
    volatile: /\bIMMUTABLE\b/i.test(f.options) ? 'i' : /\bSTABLE\b/i.test(f.options) ? 's' : 'v',
    parallel: /PARALLEL\s+SAFE/i.test(f.options) ? 's' : /PARALLEL\s+RESTRICTED/i.test(f.options) ? 'r' : 'u',
    config, grantees: [...grantees].sort(),
    argumentNames: argumentsList.map(x => x.split(/\s+/)[0]).concat(outputs.map(x => x[0])),
    argumentTypes: argumentsList.map(x => x.replace(/\s+DEFAULT[\s\S]*/i, '').split(/\s+/).slice(1).join(' ')),
    defaults: argumentsList.filter(x => /\sDEFAULT\s/i.test(x)).length,
    returnType: resultTable ? 'record' : scalar,
    set: Boolean(resultTable), outputTypes: outputs.map(x => x.slice(1).join(' ')),
  }
}

// A lexical split is sufficient for the closed, pinned table DDL. It never
// evaluates SQL. Quoted literals and nested CHECK expressions retain commas.
function splitFields(body) {
  const values = []; let start = 0, depth = 0, quoted = false
  for (let i = 0; i < body.length; i++) {
    if (body[i] === "'") {
      if (quoted && body[i + 1] === "'") { i++; continue }
      quoted = !quoted
    } else if (!quoted) {
      if (body[i] === '(') depth++
      if (body[i] === ')') depth--
      if (body[i] === ',' && depth === 0) { values.push(body.slice(start, i).trim()); start = i + 1 }
    }
  }
  assert.equal(depth, 0); assert.equal(quoted, false)
  values.push(body.slice(start).trim()); return values
}
function tableMetadata(sql) {
  const tables = []
  for (const match of sql.matchAll(/^CREATE TABLE ([\w.]+) \(\n([\s\S]*?)^\);/gm)) {
    const fields = splitFields(match[2])
    const primary = fields.filter(f => /^PRIMARY KEY/i.test(f)).join(' ')
    const columns = fields.filter(f => !/^(?:CHECK|CONSTRAINT|PRIMARY KEY|FOREIGN KEY|UNIQUE)\b/.test(f)).map(field => {
      const m = /^(\w+)\s+(timestamptz|timestamp with time zone|text|boolean|bigint|integer|uuid|jsonb)\b/.exec(field)
      assert.ok(m, 'closed column declaration: ' + field.slice(0, 80))
      return { name: m[1], type: m[2], notNull: /\bNOT NULL\b|\bPRIMARY KEY\b/.test(field)
          || new RegExp('\\b' + m[1] + '\\b').test(primary),
        generated: /GENERATED ALWAYS/.test(field), hasDefault: /\bDEFAULT\b|\bGENERATED ALWAYS\b/.test(field) }
    })
    const table = match[1]
    const triggers = [...sql.matchAll(new RegExp('CREATE (CONSTRAINT )?TRIGGER (\\w+) (BEFORE|AFTER) ([A-Z ]+) ON ' + table.replaceAll('.', '\\.')
      + '\\s+((?:DEFERRABLE INITIALLY DEFERRED\\s+)?)FOR EACH (ROW|STATEMENT) EXECUTE FUNCTION ([\\w.]+)\\(\\);', 'g'))].map(t => ({
      name: t[2], function: t[7] + '()', type: (t[6] === 'ROW' ? 1 : 0) + (t[3] === 'BEFORE' ? 2 : 0)
        + (t[4].includes('INSERT') ? 4 : 0) + (t[4].includes('DELETE') ? 8 : 0)
        + (t[4].includes('UPDATE') ? 16 : 0) + (t[4].includes('TRUNCATE') ? 32 : 0),
      deferred: Boolean(t[1]),
    }))
    const constraints = fields.reduce((n, f) => n + [...f.matchAll(/\b(?:CHECK|PRIMARY KEY|REFERENCES|UNIQUE)\b/gi)].length, 0)
    const extraConstraints = [...sql.matchAll(new RegExp('ALTER TABLE ' + table.replaceAll('.', '\\.') + '\\s+([\\s\\S]*?);', 'g'))]
      .reduce((n, m) => n + [...m[1].matchAll(/ADD CONSTRAINT/g)].length, 0)
    // PostgreSQL also records each user-defined CONSTRAINT TRIGGER as one
    // pg_constraint row (contype='t'), alongside the declared table constraints.
    tables.push({ name: table, columns, triggers,
      constraints: constraints + extraConstraints + triggers.filter(t => t.deferred).length,
      baseline: table === BASELINE })
  }
  assert.equal(tables.length, 7, 'six store tables and one immutable successor')
  return tables
}

export function compileAdminRuntimeInstallation() {
  const pins = JSON.parse(read('pins.json'))
  const sources = new Map(Object.entries(pins).map(([path, digest]) => {
    const value = read(path, root); assert.equal(sha(value), digest, 'pinned Admin predecessor: ' + path)
    return [path, value]
  }))
  const predecessors = [...sources].filter(([p]) => p.includes('official-truth-v3-') && !p.includes('admin-'))
  const current = new Map(predecessors.flatMap(([, sql]) => functionsIn(sql)).map(f => [f.signature, f]))
  const old = signature => { const f = current.get(signature); assert.ok(f, 'exact installed predecessor: ' + signature); return f }
  const predecessor = pins[predecessorPath]
  const definitionDigest = sha(JSON.stringify({ version: 1, pins,
    compiler: sha(read('build.mjs')), baseline: sha(read('baseline.sql')), preflight: sha(read('preflight.sql')),
    delta: sha(read('delta.sql')), postcheck: sha(read('postcheck.sql')) }))
  const substitute = value => value.replaceAll('PREDECESSOR_SHA256', predecessor).replaceAll('DEFINITION_SHA256', definitionDigest)
  const baseline = substitute(read('baseline.sql'))
  const cms = cmsPaths.map(p => sources.get(p)).join('\n')
  const marketing = marketingPaths.map(p => sources.get(p)).join('\n')
  const producer = sources.get('scripts/db/admin-account-counts-1-candidate.sql')
  const wrapper = sources.get('scripts/db/admin-account-counts-delivery-1-rpc.sql')
  const originals = new Map(functionsIn([producer, wrapper, cms, marketing, baseline].join('\n')).map(f => [f.signature, f]))
  const derived = []
  const take = signature => { const f = originals.get(signature); assert.ok(f, signature); return f }
  for (const signature of ['jetnity_cms_private.actor_v1()', 'jetnity_marketing_private.actor_v1()',
    'public.admin_cms_inspiration_command_v1(uuid,text,bigint,text,jsonb)',
    'public.admin_cms_inspiration_read_v1(text,bigint,bigint,integer)',
    'public.admin_cms_inspiration_confirm_v1(uuid)',
    'public.admin_marketing_drafts_apply_v1(jsonb)', 'public.admin_marketing_drafts_read_v1(jsonb)']) {
    const f = take(signature); derived.push(definition(f, guardedBody(f.body, f.name.startsWith('public.')), volatile(f.options)))
  }
  const count = take('jetnity_reporting.account_counts_v1()')
  const countBody = once(once(count.body, '\nbegin\n', '\nbegin\n  ' + guardCall + '\n'),
    '\nend\n', '\n  ' + guardCall + '\nend\n')
  derived.push(definition(count, countBody, volatile(count.options)))
  const countWrapper = take('public.admin_account_counts_v1()')
  derived.push(definition(countWrapper, countWrapper.body, volatile(countWrapper.options)))
  const published = take('public.cms_inspiration_published_v1()')
  derived.push(definition(published, '\nDECLARE value jsonb;\nBEGIN\n  ' + guardCall
    + '\n  SELECT q.value INTO value FROM (\n' + published.body.trim().replace(/;$/, '')
    + '\n  ) q(value);\n  ' + guardCall + '\n  RETURN value;\nEND\n',
    published.options.replace(/LANGUAGE sql STABLE/i, 'LANGUAGE plpgsql VOLATILE')))

  const newPublicNames = [...originals.values()].filter(f => f.name.startsWith('public.')).map(f => f.name.split('.')[1])
  let catalogBody = once(old(REPLACEMENTS[0]).body, "'official_v3_guard_private')",
    "'official_v3_guard_private'," + STORE_SCHEMAS.map(quote).join(',') + ')')
  catalogBody = once(catalogBody, "'official_v3_guard_alarm_status_v1'))",
    "'official_v3_guard_alarm_status_v1'," + [...newPublicNames, 'darf_inhalte_moderieren'].map(quote).join(',') + '))')
  let assertBody = once(old(REPLACEMENTS[1]).body, 'DECLARE successor ', 'DECLARE admin official_v3_guard_private.admin_runtime_baseline_v1%ROWTYPE;\n  successor ')
  assertBody = once(assertBody, 'BEGIN\n', 'BEGIN\n  SELECT * INTO STRICT admin FROM official_v3_guard_private.admin_runtime_baseline_v1 WHERE singleton;\n')
  assertBody = once(assertBody, 'OR attempt2.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()',
    `OR admin.predecessor_provider_digest<>${quote(predecessor)}
    OR admin.definition_digest<>${quote(definitionDigest)}
    OR admin.predecessor_catalog_digest IS DISTINCT FROM encode(sha256(convert_to(attempt2.catalog::text,'UTF8')),'hex')
    OR admin.predecessor_attempt2_digest IS DISTINCT FROM encode(sha256(convert_to((to_jsonb(attempt2)||jsonb_build_object('proof_not_before',extract(epoch FROM attempt2.proof_not_before)))::text,'UTF8')),'hex')
    OR admin.catalog IS DISTINCT FROM official_v3_guard_private.catalog_status_v1()`)
  const fresh = body => once(once(once(once(body,
    'SELECT greatest(a.required_generation,', 'SELECT greatest(admin.required_generation,a.required_generation,'),
    'greatest(a.proof_not_before,', 'greatest(admin.proof_not_before,a.proof_not_before,'),
    'FROM official_v3_guard_private.cycle4_attempt2_baseline_v1 a',
    'FROM official_v3_guard_private.admin_runtime_baseline_v1 admin CROSS JOIN official_v3_guard_private.cycle4_attempt2_baseline_v1 a'),
    'WHERE a.singleton AND ', 'WHERE admin.singleton AND a.singleton AND ')
  const successors = [definition(old(REPLACEMENTS[0]), catalogBody), definition(old(REPLACEMENTS[1]), assertBody),
    ...REPLACEMENTS.slice(2).map(signature => definition(old(signature), fresh(old(signature).body)))]

  // The old standalone Count installer stays byte-identical and still refuses
  // BG1. Only this closed composition removes that one refusal after its own
  // pinned full predecessor verification; no environment bypass is introduced.
  let counts = once(sources.get(countsPath),
    "  -- The entry lane snapshots authenticated role dependencies globally. Its\n  -- installed guard must be integrated by that lane before any new grants.\n  if pg_catalog.to_regnamespace('official_v3_guard_private') is not null then\n    raise exception 'counts_dev_entry_guard_integration_required' using errcode='55000';\n  end if;\n",
    "  -- The enclosing finite Admin/BG1 transition has verified the predecessor.\n  if pg_catalog.to_regclass('pg_temp.admin_runtime_before') is null then\n    raise exception 'counts_dev_composed_predecessor_required' using errcode='55000';\n  end if;\n")
  counts = counts.replace('DEV ONLY: explicit API target', 'COMPOSED DEV ONLY: explicit API target')
  const newFunctions = new Map([...originals, ...functionsIn(derived.join('\n')).map(f => [f.signature, f])])
  const permissions = f => f.name === 'public.cms_inspiration_published_v1' ? ['anon', 'authenticated', 'postgres']
    : f.name.startsWith('public.') || f.name === 'jetnity_reporting.account_counts_v1' ? ['authenticated', 'postgres'] : ['postgres']
  const approvedFunctions = [...newFunctions.values()].map(f => functionMetadata(f, permissions(f)))
  const replacements = functionsIn(successors.join('\n')).map(f => functionMetadata(f,
    f.name === 'public.official_v3_guard_alarm_status_v1' ? ['anon', 'postgres']
      : f.name === 'official_v3_guard_private.require_open_v1' ? ['ot_v3_result_owner', 'postgres'] : ['postgres']))
  const tables = tableMetadata([baseline, cms, marketing].join('\n'))
  const moderation = functionsIn(sources.get('supabase/migrations/20260827170000_admin_aal2_data_plane_alignment.sql'))
    .find(f => f.signature === 'public.darf_inhalte_moderieren()')
  assert.ok(moderation, 'canonical moderation helper')
  let preflight = once(read('preflight.sql'), '/* PREDECESSOR_FUNCTIONS */',
    json([...current.values()].map(f => ({ signature: f.signature, hash: sha(f.body) }))))
  preflight = once(preflight, '/* PUBLIC_NAMES */', sqlArray(newPublicNames))
  preflight = once(preflight, '/* ORIGINAL_CATALOG */', old(REPLACEMENTS[0]).body.trim())
  preflight = once(preflight, '/* EXPANDED_CATALOG */', catalogBody.trim())
  preflight = preflight.replaceAll('MODERATION_SHA256', sha(moderation.body))
  let delta = once(read('delta.sql'), '/* APPROVED_FUNCTIONS */', json(approvedFunctions))
  delta = once(delta, '/* APPROVED_REPLACEMENTS */', json(replacements))
  delta = once(delta, '/* APPROVED_TABLES */', json(tables))
  const migration = substitute([
    '-- ADMIN-RUNTIME-BG1-1: three atomic Dev stores; provider transaction required. No import or activation.',
    'SET LOCAL jetnity.admin_runtime_target=' + quote(TARGET) + ';',
    "SET LOCAL search_path=pg_catalog,pg_temp; SET LOCAL statement_timeout='30s'; SET LOCAL lock_timeout='5s';",
    "SET LOCAL idle_in_transaction_session_timeout='30s'; SET LOCAL timezone='UTC'; SET LOCAL datestyle='ISO, YMD';",
    preflight, baseline, counts, cms, marketing, derived.join('\n\n'), successors.join('\n\n'), delta, read('postcheck.sql'),
  ].join('\n\n').trimEnd() + '\n')
  assertTransactionBody(migration)
  assert.doesNotMatch(migration, /\/\* (?:APPROVED_|PREDECESSOR_|ORIGINAL_|EXPANDED_|PUBLIC_)/)
  assert.doesNotMatch(migration, /ALTER ROLE|CREATE ROLE|DISABLE TRIGGER|session_replication_role/i)
  return { migration, digest: sha(migration), definitionDigest, predecessor,
    inventory: { replacements, functions: approvedFunctions, tables, schemas: STORE_SCHEMAS },
    runtimeDefinitions: derived.join('\n\n'), catalogBody }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  assert.ok(process.argv.length === 3 && ['--write', '--check'].includes(process.argv[2]), 'admin_runtime_build_mode_required')
  const { migration } = compileAdminRuntimeInstallation()
  if (process.argv[2] === '--write') writeFileSync(new URL('./provider-migration-body.sql', import.meta.url), migration)
  else assert.equal(read('provider-migration-body.sql'), migration, 'exact offline Admin installation artifact')
}
