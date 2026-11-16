import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import { ownedProofOutputComplete, readOwnedProofValue } from '../../scripts/db/official-truth-v3-rolling-jobs-quota-1/persistent-backend'

const marker = 'ROLLING_VALUE_' + 'a'.repeat(48)
const completion = 'ROLLING_COMPLETE_' + 'b'.repeat(48)
const warning = (message: string) => '2026-11-15 13:22:34.979 UTC [4418] WARNING:  ' + message + '\n'
const context = '2026-11-15 13:22:34.979 UTC [4418] CONTEXT:  PL/pgSQL function inline_code_block line 7 at RAISE\n'
function frames(payload: Buffer): string[] {
  const parts = [warning(marker + ' BEGIN ' + payload.length + ' ' + createHash('sha256').update(payload).digest('hex'))]
  let index = 0
  for (let offset = 0; offset < payload.length; offset += 1536) {
    parts.push(warning(marker + ' DATA ' + index++ + ' ' + payload.subarray(offset, offset + 1536).toString('base64')) + context)
  }
  parts.push(warning(marker + ' END ' + index))
  return parts
}

test('owned native value retains a multi-megabyte full readback across small output frames', () => {
  const value = { rows: Array.from({ length: 2400 }, (_, id) => ({ id, original: 'é😀\\"\n'.repeat(100) })),
    text: 'WARNING: ROLLING_VALUE is data; ERROR: is data; backend> is data', nullable: null }
  const payload = Buffer.from(JSON.stringify(value)), output = frames(payload).join('')
  assert.ok(payload.length > 2_375_381, 'larger than the actual truncated Cycle2 readback')
  assert.ok(Buffer.byteLength(output) < 6 * 1024 * 1024, 'the original total output cap is retained')
  const decoded = readOwnedProofValue<typeof value>('backend> \n' + output, marker)
  assert.equal(createHash('sha256').update(JSON.stringify(decoded)).digest('hex'), createHash('sha256').update(payload).digest('hex'))
  assert.equal(decoded.rows.length, value.rows.length)
  assert.equal(decoded.rows[2399].original, value.rows[2399].original)
  assert.equal(decoded.nullable, null)
})

test('a completed call cannot turn damaged value output into a positive readback', async t => {
  const payload = Buffer.from(JSON.stringify({ original: 'full retained bytes '.repeat(300) })), original = frames(payload)
  const damaged: [string, string[]][] = [
    ['missing chunk', [original[0], ...original.slice(2)]],
    ['duplicate chunk', [original[0], original[1], ...original.slice(1)]],
    ['out of order', [original[0], original[2], original[1], ...original.slice(3)]],
    ['truncated chunk', original.map((part, index) => index === 1 ? part.replace(/(.{20})\n/, '\n') : part)],
    ['changed digest', original.map((part, index) => index === 0 ? part.replace(/[a-f0-9]{64}\n$/, '0'.repeat(64) + '\n') : part)],
    ['missing footer', original.slice(0, -1)],
    ['unterminated footer', [...original.slice(0, -1), original.at(-1)!.trimEnd()]],
    ['different read nonce', original.map(part => part.replaceAll(marker, 'ROLLING_VALUE_' + 'c'.repeat(48)))],
  ]
  for (const [name, parts] of damaged) await t.test(name, () => {
    const output = parts.join('') + warning(completion)
    assert.throws(() => readOwnedProofValue(output, marker), /owned native value/)
  })
  for (const [name, bytes] of [
    ['invalid UTF-8', Buffer.from([0x22, 0xff, 0x22])],
    ['incomplete JSON', Buffer.from('{"original":"unclosed')],
  ] as const) await t.test(name, () => {
    assert.throws(() => readOwnedProofValue(frames(bytes).join(''), marker), /not complete UTF-8 JSON/)
  })
})

test('native completion waits for both full pipe barriers even when stdout arrives first', () => {
  const stdout = '\t1: proof_completion = "' + completion + '"\t(typeid = 25, len = -1, typmod = -1, byval = f)\n\t----\nbackend> '
  const stderr = warning(completion)
  assert.equal(ownedProofOutputComplete('backend> ', stderr, completion), false)
  assert.equal(ownedProofOutputComplete(stdout, '', completion), false)
  for (let end = 0; end < stderr.length; end++) {
    assert.equal(ownedProofOutputComplete(stdout, stderr.slice(0, end), completion), false,
      'a split stderr marker is never a drained warning')
  }
  const lineEnd = stdout.indexOf('\n') + 1
  for (let end = 0; end < lineEnd; end++) {
    assert.equal(ownedProofOutputComplete(stdout.slice(0, end), stderr, completion), false,
      'a split stdout tuple is never a complete result')
  }
  assert.equal(ownedProofOutputComplete(stdout, stderr, completion), true)
})
