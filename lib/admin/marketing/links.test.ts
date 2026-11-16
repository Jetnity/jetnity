import assert from 'node:assert/strict'
import { test } from 'node:test'
import { marketingKennungErzeugen, marketingLinkEingabeLesen, marketingLinkErstellen } from './links'

const A = '12345678-1234-4123-8123-123456789abc'
const B = 'abcdef01-9876-4fed-b012-0123456789ab'
const input = { destination: 'home', channel: 'newsletter', campaignId: `cmp-${A}` }
const destinations = { home: '/', planning: '/planen', inspiration: '/entdecken' }
const channels = { newsletter: ['newsletter', 'email'], instagram: ['instagram', 'social'], partner: ['partner', 'referral'], qr: ['qr', 'offline'] }

for (const [destination, path] of Object.entries(destinations)) for (const [channel, [source, medium]] of Object.entries(channels)) for (const withContent of [false, true]) {
  test(`closed link ${destination}/${channel}, variant=${withContent}`, () => {
    const result = marketingLinkErstellen({ ...input, destination, channel, ...(withContent ? { contentId: `cnt-${B}` } : {}) })
    const expected = `https://jetnity.com${path}?utm_source=${source}&utm_medium=${medium}&utm_campaign=cmp-${A}${withContent ? `&utm_content=cnt-${B}` : ''}`
    assert.equal(result, expected)
    const actual = new URL(result!)
    assert.equal(actual.origin, 'https://jetnity.com')
    assert.equal(actual.hash, '')
    assert.equal(actual.username, '')
    assert.equal(actual.password, '')
    assert.deepEqual([...actual.searchParams.keys()], ['utm_source', 'utm_medium', 'utm_campaign', ...(withContent ? ['utm_content'] : [])])
  })
}

const invalid: [string, unknown][] = [
  ['null', null], ['undefined', undefined], ['string', JSON.stringify(input)], ['array', [input]], ['function', () => input],
  ['no destination', { channel: 'newsletter', campaignId: `cmp-${A}` }],
  ['no channel', { destination: 'home', campaignId: `cmp-${A}` }],
  ['no campaign', { destination: 'home', channel: 'newsletter' }],
  ['wrong destination', { ...input, destination: 'account' }], ['path destination', { ...input, destination: '/planen' }],
  ['URL destination', { ...input, destination: 'https://other.example/' }], ['channel query', { ...input, channel: 'newsletter&x=1' }],
  ['unknown channel', { ...input, channel: 'search' }], ['uppercase channel', { ...input, channel: 'Newsletter' }],
  ['email campaign', { ...input, campaignId: 'sasa@example.invalid' }], ['URL campaign', { ...input, campaignId: 'https://other.example/' }],
  ['wrong prefix', { ...input, campaignId: `cnt-${A}` }], ['uppercase UUID', { ...input, campaignId: `cmp-${A.toUpperCase()}` }],
  ['non-v4', { ...input, campaignId: `cmp-${A.replace('-4123-', '-5123-')}` }],
  ['wrong variant', { ...input, campaignId: `cmp-${A.replace('-8123-', '-7123-')}` }],
  ['nil UUID', { ...input, campaignId: 'cmp-00000000-0000-0000-0000-000000000000' }],
  ['whitespace', { ...input, campaignId: ` cmp-${A}` }], ['suffix query', { ...input, campaignId: `cmp-${A}&email=person@example.invalid` }],
  ['explicit undefined content', { ...input, contentId: undefined }], ['null content', { ...input, contentId: null }],
  ['empty content', { ...input, contentId: '' }], ['wrong content prefix', { ...input, contentId: `cmp-${B}` }],
  ['extra origin', { ...input, origin: 'https://evil.example' }], ['extra path', { ...input, path: '/account' }],
  ['extra query', { ...input, query: 'name=person' }], ['extra utm_term', { ...input, utm_term: 'secret' }],
  ['extra user ID', { ...input, userId: A }], ['extra redirect', { ...input, redirect: 'https://evil.example' }],
  ['extra role', { ...input, role: 'owner' }], ['extra symbol', { ...input, [Symbol('secret')]: true }],
  ['inherited values', Object.create(input)], ['custom prototype', Object.assign(Object.create({ custom: true }), input)],
]
for (const [name, value] of invalid) test(`parser and builder reject ${name}`, () => {
  assert.equal(marketingLinkEingabeLesen(value), null)
  assert.equal(marketingLinkErstellen(value), null)
})

test('parser never calls accessors; descriptor/prototype/own-key failures are contained', () => {
  let calls = 0
  for (const key of ['destination', 'channel', 'campaignId', 'contentId']) {
    const value = { ...input }
    Object.defineProperty(value, key, { get() { calls++; throw new Error('getter_called') }, enumerable: true })
    assert.equal(marketingLinkEingabeLesen(value), null)
    assert.equal(marketingLinkErstellen(value), null)
  }
  assert.equal(calls, 0)
  for (const handler of [
    { getPrototypeOf() { throw new Error('prototype') } },
    { ownKeys() { throw new Error('keys') } },
    { getOwnPropertyDescriptor() { throw new Error('descriptor') } },
  ]) assert.equal(marketingLinkErstellen(new Proxy(input, handler)), null)
  const revoked = Proxy.revocable(input, {})
  revoked.revoke()
  assert.equal(marketingLinkErstellen(revoked.proxy), null)
})

test('closed null-prototype data is captured independently of subsequent mutation', () => {
  const value = Object.assign(Object.create(null), input, { contentId: `cnt-${B}` })
  const parsed = marketingLinkEingabeLesen(value)
  assert.deepEqual(parsed, { ...input, contentId: `cnt-${B}` })
  assert.notEqual(parsed, value)
  value.channel = 'evil'
  value.campaignId = 'person@example.invalid'
  assert.equal(parsed?.channel, 'newsletter')
  assert.equal(parsed?.campaignId, `cmp-${A}`)
  assert.equal(Object.getPrototypeOf(parsed), Object.prototype)
})

test('ID creation accepts only exact cryptographic UUIDv4 values and contains source errors', () => {
  let calls = 0
  assert.equal(marketingKennungErzeugen('cmp', () => { calls++; return A }), `cmp-${A}`)
  assert.equal(marketingKennungErzeugen('cnt', () => B), `cnt-${B}`)
  assert.equal(calls, 1)
  for (const bad of [null, undefined, 4, {}, '', A.toUpperCase(), A + '\n', A.replace('-4123-', '-1123-'), A.replace('-8123-', '-f123-')]) {
    assert.equal(marketingKennungErzeugen('cmp', () => bad), null)
  }
  assert.equal(marketingKennungErzeugen('cmp', () => { throw new Error('unavailable') }), null)
})
