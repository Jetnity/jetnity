// Owned local PG17 only. No URL, remote credentials, sockets or clock override.
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { assertLocalProofEnvironment, findLocalPgBins } from '../official-truth-integrated-pilot-1/local-cluster'

export const literal = (value: string) => "'" + value.replaceAll("'", "''") + "'"
export const json = (value: unknown) => literal(JSON.stringify(value)) + '::jsonb'
export const readSql = (path: string) => readFileSync(new URL('../' + path, import.meta.url), 'utf8')

/** Split reviewed PostgreSQL source without changing any function-body bytes.
 * Single-user -j ends a query at ;\n\n even inside a quoted function. Encoding
 * each complete statement as an EXECUTE literal preserves those original bytes.
 * BEGIN/COMMIT stay top level. The one parsed SQL BEGIN ATOMIC body is retained.
 */
export function splitSql(source: string): string[] {
  const result: string[] = []
  let start = 0, at = 0, quote: 'single' | 'double' | null = null, dollar: string | null = null
  let line = false, block = 0, atomic = 0
  for (; at < source.length; at++) {
    const c = source[at], next = source[at + 1]
    if (line) { if (c === '\n') line = false; continue }
    if (block) { if (c === '/' && next === '*') { block++; at++ } else if (c === '*' && next === '/') { block--; at++ } continue }
    if (dollar) { if (source.startsWith(dollar, at)) { at += dollar.length - 1; dollar = null } continue }
    if (quote) {
      const mark = quote === 'single' ? "'" : '"'
      if (c === mark) { if (next === mark) at++; else quote = null }
      // Reviewed sources use standard-conforming strings; explicit E strings
      // are handled by their backslash escape inside the single quote.
      else if (quote === 'single' && c === '\\' && source[at - 1] !== '\\') {
        let before = at - 1
        while (before >= 0 && source[before] !== "'") before--
        if (before > 0 && /[eE]/.test(source[before - 1])) at++
      }
      continue
    }
    if (c === '-' && next === '-') { line = true; at++; continue }
    if (c === '/' && next === '*') { block = 1; at++; continue }
    if (c === "'") { quote = 'single'; continue }
    if (c === '"') { quote = 'double'; continue }
    if (c === '$') {
      const found = /^\$(?:[a-zA-Z_][a-zA-Z0-9_]*)?\$/.exec(source.slice(at))
      if (found) { dollar = found[0]; at += dollar.length - 1; continue }
    }
    if (/\w/.test(c) && (at === 0 || !/\w/.test(source[at - 1]))) {
      const begin = /^BEGIN\s+ATOMIC\b/i.exec(source.slice(at))
      if (begin) { atomic++; at += begin[0].length - 1; continue }
      if (atomic && /^END\b/i.test(source.slice(at))) atomic--
    }
    if (c === ';' && !atomic) { result.push(source.slice(start, at + 1)); start = at + 1 }
  }
  assert.equal(quote, null); assert.equal(dollar, null); assert.equal(block, 0); assert.equal(atomic, 0)
  if (source.slice(start).replace(/--[^\n]*/g, '').trim()) result.push(source.slice(start))
  return result.filter(value => value.replace(/--[^\n]*/g, '').trim())
}
export function wire(sql: string) {
  return splitSql(sql).map(statement => {
    const plain = statement.replace(/\/\*[\s\S]*?\*\//g, '').replace(/--[^\n]*/g, '').trim()
    if (/^(?:BEGIN(?:\s+(?:TRANSACTION|ISOLATION LEVEL READ COMMITTED))?|COMMIT|ROLLBACK)\s*;$/i.test(plain)) return plain + '\n\n'
    const encoded = statement.replaceAll('\\', '\\\\').replaceAll("'", "''").replaceAll('\r', '\\r').replaceAll('\n', '\\n')
    return "DO $local_wire$ BEGIN EXECUTE E'" + encoded + "'; END $local_wire$;\n\n"
  }).join('')
}
export class OwnedSingleProof {
  private readonly bins = findLocalPgBins()
  private readonly root: string
  private readonly data: string
  private readonly env = { ...process.env }
  constructor() {
    assertLocalProofEnvironment()
    assert.ok(this.bins, 'PostgreSQL 17 is required, never a fake pass')
    assert.match(execFileSync(this.bins.postgres, ['--version'], { encoding: 'utf8', timeout: 5000 }), /PostgreSQL\) 17\./)
    this.root = mkdtempSync(join(tmpdir(), 'jetnity-rolling-native-'))
    this.data = join(this.root, 'data')
    for (const key of Object.keys(this.env)) if (/^(PG|PSQL)/.test(key)) delete this.env[key]
    try {
      execFileSync(this.bins.initdb, ['-D', this.data, '--no-locale', '--encoding=UTF8', '--auth-local=reject', '--auth-host=reject',
        '--username', 'ot_pilot_owner', '--no-sync'], { encoding: 'utf8', env: this.env, stdio: 'pipe', timeout: 60000 })
    } catch (error) { this.close(); throw error }
  }
  run(sql: string, context = 'native rolling proof', expected?: RegExp) {
    assert.ok(this.bins)
    const result = spawnSync(this.bins.postgres, ['--single', '-D', this.data, '-j', '-c', 'exit_on_error=off',
      '-c', 'log_min_error_statement=panic', '-c', 'statement_timeout=25000', '-c', 'timezone=UTC', 'postgres'],
    { input: wire(sql), encoding: 'utf8', env: this.env, stdio: ['pipe', 'pipe', 'pipe'], timeout: 90000, maxBuffer: 6 * 1024 * 1024 })
    const unhandled = /(?:^|\n)[^\n]*\b(?:ERROR|FATAL|PANIC):/.test(result.stderr)
    if (!result.error && expected) { assert.ok(unhandled, context); assert.match(result.stderr, expected); return result.stderr }
    if (result.error || result.status !== 0 || unhandled) throw new Error(context + ': ' + (result.error?.message ?? '') + '\n' + result.stderr.split('\n').filter(line => /(?:ERROR|FATAL|PANIC):/.test(line)).join('\n') + '\n' + result.stderr.slice(0, 2500))
    return result.stdout + '\n' + result.stderr
  }
  value<T>(expression: string, prefix = ''): T {
    const out = this.run(prefix + '\nDO $value$ BEGIN RAISE WARNING \'ROLLING_VALUE %\',(' + expression + ')::jsonb; END $value$;')
    const matches = [...out.matchAll(/WARNING:\s+ROLLING_VALUE ([^\r\n]+)/g)]
    assert.equal(matches.length, 1, 'one actual native value')
    return JSON.parse(matches[0][1]) as T
  }
  close() { rmSync(this.root, { recursive: true, force: true }) }
}
