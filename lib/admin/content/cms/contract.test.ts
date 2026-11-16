import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { ENTDECKEN_ZIELE } from '@/lib/inspiration/explorer-1/katalog'
import { INSPIRATION_ZIELE } from '@/lib/places/inspiration'
import { cmsReference, parseCmsCommand, type CmsCommand } from './contract'

const identity = {
  requestId: '11111111-1111-4111-8111-111111111111',
  entryId: 'geonames:1650535', expectedVersion: '0',
}
const copy = { beschreibung: 'Zeit für Natur und Ruhe.', idea: 'Eine Woche Bali', themen: ['natur', 'erholung'] }
const save = (payload: unknown = copy, change: Record<string, unknown> = {}) => ({
  ...identity, action: 'save_draft', payload, ...change,
})

describe('UNAPPLIED editorial CMS command contract', () => {
  it('uses the four existing identities and accepts their actual explorer copy', () => {
    assert.equal(INSPIRATION_ZIELE.length, 4)
    for (const source of ENTDECKEN_ZIELE) {
      assert.deepEqual(cmsReference(source.placeId), {
        entryId: source.placeId, locale: 'de', name: source.name, country: source.country, image: source.image,
      })
      const input = save({ beschreibung: source.beschreibung, idea: source.idea, themen: [...source.themen] }, { entryId: source.placeId })
      assert.deepEqual(parseCmsCommand(input), input)
    }
    assert.equal(cmsReference('geonames:1'), null)
  })

  it('parses all four actions without an actor, role, status or approval input', () => {
    const commands = [save(),
      { ...identity, action: 'publish', payload: { revision: '1' } },
      { ...identity, action: 'archive', payload: {} },
      { ...identity, action: 'restore_draft', payload: { revision: '2' } },
    ]
    for (const command of commands) assert.deepEqual(parseCmsCommand(command), command)
    for (const name of ['actorId', 'role', 'status', 'aal', 'createdAt', 'sourceVerified', 'rightsApproved']) {
      assert.equal(parseCmsCommand({ ...save(), [name]: 'caller-controlled' }), null)
      assert.equal(parseCmsCommand(save({ ...copy, [name]: 'caller-controlled' })), null)
    }
  })

  it('rejects incomplete, extra, non-object and prototype-supplied requests', () => {
    for (const input of [null, [], '', 1, false, Object.create(save())]) assert.equal(parseCmsCommand(input), null)
    for (const key of Object.keys(save())) {
      const incomplete: Record<string, unknown> = { ...save() }
      delete incomplete[key]
      assert.equal(parseCmsCommand(incomplete), null)
    }
    assert.equal(parseCmsCommand({ ...save(), [Symbol('extra')]: true }), null)
    assert.equal(parseCmsCommand(save(copy, { action: 'delete' })), null)
  })

  it('accepts only canonical version-4 request identities and known entries', () => {
    for (const requestId of [null, '', '11111111-1111-7111-8111-111111111111',
      '11111111-1111-4111-7111-111111111111', '00000000-0000-0000-0000-000000000000',
      'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA', ' 11111111-1111-4111-8111-111111111111']) {
      assert.equal(parseCmsCommand(save(copy, { requestId })), null)
    }
    for (const entryId of [null, '', 'geonames:1', '/entdecken', 'geonames:1650535 ']) {
      assert.equal(parseCmsCommand(save(copy, { entryId })), null)
    }
  })

  it('keeps exact bigint versions without coercing JSON numbers or rounding', () => {
    for (const expectedVersion of ['0', '1', '9007199254740993', '9223372036854775807']) {
      assert.equal(parseCmsCommand(save(copy, { expectedVersion }))?.expectedVersion, expectedVersion)
    }
    for (const expectedVersion of [0, 1, 1n, null, '-1', '01', '+1', '1.0', '1e3', ' 1',
      '9223372036854775808', '10000000000000000000']) {
      assert.equal(parseCmsCommand(save(copy, { expectedVersion })), null)
    }
    for (const revision of ['0', '-1', '01', '9223372036854775808', 1, null]) {
      assert.equal(parseCmsCommand({ ...identity, action: 'publish', payload: { revision } }), null)
    }
  })

  it('enforces action-specific payloads without silently dropping unknown data', () => {
    for (const action of ['publish', 'restore_draft']) {
      for (const payload of [{}, { revision: '1', source: 'approved' }, [], null]) {
        assert.equal(parseCmsCommand({ ...identity, action, payload }), null)
      }
    }
    for (const payload of [{ revision: '1' }, null, [], { deleteHistory: true }]) {
      assert.equal(parseCmsCommand({ ...identity, action: 'archive', payload }), null)
    }
    for (const payload of [{ ...copy, image: 'https://example.invalid/image' },
      { ...copy, entryId: 'geonames:2759794' }, { ...copy, href: 'javascript:alert(1)' },
      { beschreibung: copy.beschreibung, idea: copy.idea }, null]) {
      assert.equal(parseCmsCommand(save(payload)), null)
    }
  })

  it('uses Unicode scalar and UTF-8 limits, including astral text at the exact boundary', () => {
    for (const unit of ['a', 'ü', '旅', '🌍']) {
      assert.ok(parseCmsCommand(save({ ...copy, beschreibung: unit.repeat(800), idea: unit.repeat(300) })))
      assert.equal(parseCmsCommand(save({ ...copy, beschreibung: unit.repeat(801) })), null)
      assert.equal(parseCmsCommand(save({ ...copy, idea: unit.repeat(301) })), null)
    }
    assert.ok(parseCmsCommand(save({ ...copy, beschreibung: 'e\u0301'.repeat(400) })))
    assert.equal(parseCmsCommand(save({ ...copy, beschreibung: 'e\u0301'.repeat(401) })), null)
  })

  it('rejects malformed Unicode, markup, controls and padded or empty text', () => {
    const bad = ['', ' ', '\t', '\u00a0', '\u3000', ' leading', 'trailing ',
      '\uFEFFleading', 'trailing\u2007', '<p>Text</p>', 'a>b', 'a\u0000b',
      'a\u001fb', 'a\u007fb', 'a\u0085b', 'a\u009fb', 'a\nnext', '\uD800', '\uDC00']
    for (const value of bad) {
      assert.equal(parseCmsCommand(save({ ...copy, beschreibung: value })), null, JSON.stringify(value))
      assert.equal(parseCmsCommand(save({ ...copy, idea: value })), null, JSON.stringify(value))
    }
    assert.ok(parseCmsCommand(save({ ...copy, beschreibung: 'Kultur & Küche — selbst geplant.' })))
  })

  it('accepts only nonempty, unique, canonically ordered existing themes', () => {
    for (const themen of [[], ['alle'], ['natur', 'natur'], ['erholung', 'natur'],
      ['natur', 'unknown'], ['natur', 1], null, 'natur', new Array(1)]) {
      assert.equal(parseCmsCommand(save({ ...copy, themen })), null)
    }
    assert.ok(parseCmsCommand(save({ ...copy, themen: ['stadt-kultur', 'natur', 'strand', 'erholung'] })))
  })

  it('returns detached parsed content and detached reference records', () => {
    const original = save({ ...copy, themen: ['natur'] })
    const command: CmsCommand | null = parseCmsCommand(original)
    assert.ok(command?.action === 'save_draft')
    ;(original.payload as { themen: string[] }).themen.push('strand')
    assert.deepEqual(command.payload.themen, ['natur'])
    assert.notEqual(cmsReference(identity.entryId), cmsReference(identity.entryId))
  })

  it('does not invoke accessors on requests, payloads or theme elements', () => {
    let invoked = 0
    const getter = () => { invoked++; throw new Error('getter must not run') }
    const request = { ...save() }
    Object.defineProperty(request, 'requestId', { get: getter, enumerable: true })
    const payload = { ...copy }
    Object.defineProperty(payload, 'idea', { get: getter, enumerable: true })
    const themen = ['natur']
    Object.defineProperty(themen, '0', { get: getter, enumerable: true })
    for (const input of [request, save(payload), save({ ...copy, themen })]) {
      assert.equal(parseCmsCommand(input), null)
    }
    assert.equal(invoked, 0)
  })

  it('contains proxy failures and validates detached descriptors instead of unstable property reads', () => {
    const revoked = Proxy.revocable(save(), {})
    revoked.revoke()
    const fail = () => { throw new Error('untrusted exception text') }
    for (const value of [revoked.proxy, new Proxy(save(), { ownKeys: fail }),
      new Proxy(save(), { getPrototypeOf: fail }), new Proxy(save(), { getOwnPropertyDescriptor: fail }),
      save(new Proxy(copy, { ownKeys: fail })), save({ ...copy, themen: new Proxy(['natur'], { ownKeys: fail }) })]) {
      assert.equal(parseCmsCommand(value), null)
    }
    const input = save()
    assert.deepEqual(parseCmsCommand(new Proxy(input, { get: fail })), input)
  })
})
