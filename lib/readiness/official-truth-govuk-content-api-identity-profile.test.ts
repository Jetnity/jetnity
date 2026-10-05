// Inline synthetic/audited-envelope fixtures; opaque text, no live legal body or network.
import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { execFileSync } from 'node:child_process'
import ts from 'typescript'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY,
  type ContentIdentityProfileDefinition, type ContentItemDescriptor, type RepresentationDescriptor,
} from './official-truth-content-identity'
import { GOVUK_CONTENT_API_JSON_LIMITS, parseGovukContentApiJson,
  GOVUK_ETA_NATIONAL_LIST_CONTENT_API_IDENTITY_PROFILE as profile,
} from './official-truth-govuk-content-api-identity-profile'

const N = '2b25b3d4-4eaa-4859-a34e-c7869c114c15'
const A = '2620750b-5453-44f1-98af-414037c833be'
const H = '06056197-bc69-4147-aa28-070bca132178'
const M = '87e2748f-2e9b-4681-8baa-778b6d326a8a'
const NP = '/guidance/immigration-rules/immigration-rules-appendix-eta-national-list'
const AP = '/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation'
const MP = '/guidance/immigration-rules'
const HP = '/government/organisations/home-office'
const URL = `https://www.gov.uk/api/content${NP}`
const DATE = '2026-10-04T12:00:00Z'
const INVALID = { ok: false, reason: 'invalid_response' }
const MISMATCH = { ok: false, reason: 'identity_mismatch' }
type Input = Parameters<ContentIdentityProfileDefinition['verify']>[0]

function linked(contentId: string, path: string, schema: string) {
  return { api_path: `/api/content${path}`, api_url: `https://www.gov.uk/api/content${path}`,
    base_path: path, content_id: contentId, document_type: schema, links: {}, locale: 'en',
    schema_name: schema, title: 'Synthetic mutable display', web_url: `https://www.gov.uk${path}`, withdrawn: false }
}
function organisation() {
  return { ...linked(H, HP, 'organisation'), analytics_identifier: 'synthetic-analytics', details: {
    acronym: 'Display acronym', brand: 'display-brand',
    default_news_image: { high_resolution_url: 'https://assets.example/high.jpg', url: 'https://assets.example/low.jpg' },
    logo: { crest: 'display-crest', formatted_title: 'Display name' },
    organisation_govuk_status: { status: 'live', updated_at: null, url: null },
  } }
}
function envelope() {
  return { analytics_identifier: null, base_path: NP, content_id: N, description: 'Synthetic description',
    details: { attachments: [], body: '<p>Opaque synthetic sentinel.</p>', change_history: [],
      manual: { base_path: MP }, organisations: [], visually_expanded: false },
    document_type: 'manual_section', first_published_at: DATE,
    links: { available_translations: [{ ...linked(N, NP, 'manual_section'), public_updated_at: DATE }],
      manual: [{ ...linked(M, MP, 'manual'), public_updated_at: DATE }],
      organisations: [organisation()], primary_publishing_organisation: [organisation()] },
    locale: 'en', phase: 'live', public_updated_at: DATE, publishing_app: 'manuals-publisher',
    publishing_request_id: 'synthetic-request', publishing_scheduled_at: null, rendering_app: 'frontend',
    scheduled_publishing_delay_seconds: null, schema_name: 'manual_section', title: 'Synthetic title',
    updated_at: DATE, withdrawn_notice: {} }
}
function input(): Input {
  const item: ContentItemDescriptor = Object.freeze({ sourceId: 'synthetic-platform', contentItemId: 'synthetic-publication',
    contentItemVersion: 7, current: true, externalIdNamespace: 'govuk-content-id', externalContentId: N,
    expectedPublisherIds: Object.freeze([H]), expectedAuthorityIds: Object.freeze([H]) })
  const representation: RepresentationDescriptor = Object.freeze({ sourceId: item.sourceId, contentItemId: item.contentItemId,
    contentItemVersion: item.contentItemVersion, representationId: 'synthetic-api-en', representationVersion: 11, current: true,
    identityProfileId: 'govuk-eta-national-list-content-api-en', identityProfileVersion: 1,
    requestUrls: Object.freeze([URL]), expectedFinalUrl: URL, expectedMediaType: 'application/json',
    expectedLocale: 'en', expectedSchema: 'manual_section' })
  return Object.freeze({ item, representation, responseText: JSON.stringify(envelope()), finalUrl: URL, mediaType: 'application/json' })
}
function verifyBody(body: unknown) { return profile.verify({ ...input(), responseText: JSON.stringify(body) }) }
function setPath(root: unknown, path: readonly (string | number)[], value: unknown): void {
  let row = root as Record<string, unknown>
  for (const key of path.slice(0, -1)) row = row[key] as Record<string, unknown>
  row[path.at(-1)!] = value
}

// Every case rebuilds independent fixtures, so one mutation cannot conceal another.
describe('National List profile', () => {
  test('exact profile contract, descriptor-owned seven-field binding, fresh frozen copy', () => {
    assert.deepEqual(Object.keys(profile).sort(), ['current', 'identityProfileId', 'identityProfileVersion', 'verify'])
    assert.equal(profile.identityProfileId, 'govuk-eta-national-list-content-api-en')
    assert.equal(profile.identityProfileVersion, 1)
    assert.equal(profile.current, true)
    assert.ok(Object.isFrozen(profile))
    const request = input(), result = profile.verify(request)
    assert.ok(result.ok)
    assert.deepEqual(result, { ok: true, identity: { sourceId: 'synthetic-platform', contentItemId: 'synthetic-publication',
      contentItemVersion: 7, representationId: 'synthetic-api-en', representationVersion: 11,
      identityProfileId: profile.identityProfileId, identityProfileVersion: 1 } })
    assert.ok(Object.isFrozen(result.identity))
    assert.ok(Object.isFrozen(result))
    assert.notEqual(result.identity, request.representation)
    const another = profile.verify({ ...request, item: { ...request.item, sourceId: 'other-platform', contentItemId: 'other-local-item', contentItemVersion: 8 },
      representation: { ...request.representation, sourceId: 'other-platform', contentItemId: 'other-local-item', contentItemVersion: 8,
        representationId: 'other-stream', representationVersion: 12 } })
    assert.ok(another.ok)
    assert.equal(another.identity.contentItemId, 'other-local-item')
    assert.equal(another.identity.representationVersion, 12)
  })
  const mutable: [string, (string | number)[], unknown][] = [
    ['title', ['title'], 'New display title'], ['description', ['description'], 'New description'],
    ['updated_at', ['updated_at'], '2028-02-29T23:59:59.123+05:30'],
    ['public_updated_at', ['public_updated_at'], '2027-01-01t00:00:00z'],
    ['body', ['details', 'body'], '{"content_id":"fake", "content_id":"fake"} \\ " } [ opaque'],
    ['display organisation title', ['links', 'organisations', 0, 'title'], 'Renamed display'],
    ['display branding', ['links', 'organisations', 0, 'details', 'brand'], 'new-brand'],
    ['display logo', ['links', 'primary_publishing_organisation', 0, 'details', 'logo', 'formatted_title'], 'New display'],
    ['observed first publication', ['first_published_at'], '2020-01-01T00:00:00Z'],
    ['opaque attachments', ['details', 'attachments'], [{ title: 'synthetic' }]],
    ['opaque changes', ['details', 'change_history'], [{ note: 'synthetic' }]],
    ['opaque organisation display', ['details', 'organisations'], [{ title: 'synthetic' }]],
  ]
  for (const [name, path, value] of mutable) test(`${name} changes preserve identity`, () => {
    const body = envelope(); setPath(body, path, value)
    assert.deepEqual(verifyBody(body), profile.verify(input()))
  })
  test('key reordering, all JSON whitespace and escaped identity values preserve identity', () => {
    const text = JSON.stringify(Object.fromEntries(Object.entries(envelope()).reverse()), null, '\t').replace(N, '\\u0032' + N.slice(1))
    assert.deepEqual(profile.verify({ ...input(), responseText: ` \r\n\t${text}\n ` }), profile.verify(input()))
  })
  const itemChanges: Partial<ContentItemDescriptor>[] = [
    { current: false }, { externalIdNamespace: 'other' }, { externalContentId: A },
    { expectedPublisherIds: [M] }, { expectedPublisherIds: [] }, { expectedPublisherIds: [H, H] },
    { expectedAuthorityIds: [M] }, { expectedAuthorityIds: [] }, { expectedAuthorityIds: [H, M] },
    { sourceId: 'other' }, { contentItemId: 'other' }, { contentItemVersion: 8 },
  ]
  for (const delta of itemChanges) test(`descriptor item rejects ${JSON.stringify(delta)}`, () => {
    const request = input()
    assert.deepEqual(profile.verify({ ...request, item: { ...request.item, ...delta }, responseText: 'invalid before parsing' }), MISMATCH)
  })
  const repChanges: Partial<RepresentationDescriptor>[] = [
    { sourceId: 'other' }, { contentItemId: 'other' }, { contentItemVersion: 8 }, { current: false },
    { identityProfileId: 'other' }, { identityProfileVersion: 2 }, { requestUrls: [] },
    { requestUrls: [URL, URL] }, { requestUrls: [URL + '?x=1'] }, { requestUrls: [`https://www.gov.uk${NP}`] },
    { expectedFinalUrl: URL + '/' }, { expectedMediaType: 'text/html' },
    { expectedLocale: 'cy' }, { expectedLocale: null }, { expectedSchema: 'manual' }, { expectedSchema: null },
  ]
  for (const delta of repChanges) test(`descriptor representation rejects ${JSON.stringify(delta)}`, () => {
    const request = input()
    assert.deepEqual(profile.verify({ ...request, representation: { ...request.representation, ...delta } }), MISMATCH)
  })
  test('coherent Appendix descriptor and response cannot select this profile', () => {
    const request = input(), body = envelope()
    body.content_id = A; body.base_path = AP
    body.links.available_translations = [{ ...linked(A, AP, 'manual_section'), public_updated_at: DATE }]
    const appendixUrl = `https://www.gov.uk/api/content${AP}`
    assert.deepEqual(profile.verify({ ...request, item: { ...request.item, externalContentId: A },
      representation: { ...request.representation, requestUrls: [appendixUrl], expectedFinalUrl: appendixUrl },
      finalUrl: appendixUrl, responseText: JSON.stringify(body) }), MISMATCH)
  })
  for (const finalUrl of [URL + '?x=1', URL + '#x', URL + '/', `https://www.gov.uk/api/content${AP}`, `https://www.gov.uk${NP}`, URL.replace('https:', 'http:')]) {
    test(`transport rejects URL ${finalUrl}`, () => assert.deepEqual(profile.verify({ ...input(), finalUrl }), MISMATCH))
  }
  for (const mediaType of ['text/html', 'application/json; charset=utf-8', 'Application/JSON', '']) {
    test(`transport rejects media type ${mediaType}`, () => assert.deepEqual(profile.verify({ ...input(), mediaType }), MISMATCH))
  }
  const rootPins = { content_id: A, base_path: AP, locale: 'cy', schema_name: 'manual', document_type: 'manual',
    phase: 'beta', publishing_app: 'other-publisher', rendering_app: 'other-renderer' }
  for (const [key, value] of Object.entries(rootPins)) {
    test(`root ${key} contradictory value rejects`, () => assert.deepEqual(verifyBody({ ...envelope(), [key]: value }), MISMATCH))
    test(`root ${key} wrong type rejects`, () => assert.deepEqual(verifyBody({ ...envelope(), [key]: null }), INVALID))
  }
  for (const key of Object.keys(envelope())) test(`root requires ${key}`, () => {
    const body: Record<string, unknown> = envelope(); delete body[key]
    assert.deepEqual(verifyBody(body), INVALID)
  })
  test('unknown root key rejects', () => assert.deepEqual(verifyBody({ ...envelope(), additional: true }), INVALID))
  test('nonempty withdrawal rejects independently of live phase', () => assert.deepEqual(verifyBody({ ...envelope(), withdrawn_notice: { explanation: 'withdrawn' } }), INVALID))
  for (const key of ['title', 'description', 'details', 'links', 'withdrawn_notice']) test(`malformed ${key} rejects`, () => {
    assert.deepEqual(verifyBody({ ...envelope(), [key]: null }), INVALID)
  })
  for (const key of ['updated_at', 'public_updated_at']) {
    for (const value of [null, 'yesterday', '2026-10-04', '2026-10-04T12:00:00', '2026-02-29T00:00:00Z',
      '1900-02-29T00:00:00Z', '2026-04-31T00:00:00Z', '2026-13-01T00:00:00Z', '2026-00-01T00:00:00Z',
      '2026-01-00T00:00:00Z', '0000-01-01T00:00:00Z', '2026-01-01T24:00:00Z', '2026-01-01T00:60:00Z',
      '2026-01-01T00:00:60Z', '2026-01-01T00:00:00+24:00', '2026-01-01T00:00:00-01:60', '2026-01-01 00:00:00Z', DATE + ' ']) {
      test(`${key} invalid date ${value}`, () => assert.deepEqual(verifyBody({ ...envelope(), [key]: value }), INVALID))
    }
  }
  const detailValues: [string, unknown][] = [['attachments', {}], ['body', {}], ['change_history', {}],
    ['manual', []], ['organisations', {}], ['visually_expanded', 'false'], ['extra', true]]
  for (const [key, value] of detailValues) test(`malformed details.${key}`, () => {
    const body = envelope(); setPath(body.details, [key], value)
    assert.deepEqual(verifyBody(body), INVALID)
  })
  for (const key of Object.keys(envelope().details)) test(`details requires ${key}`, () => {
    const body = envelope(); delete (body.details as Record<string, unknown>)[key]
    assert.deepEqual(verifyBody(body), INVALID)
  })
  test('details manual has exact audited base_path-only shape', () => {
    const body = envelope(); body.details.manual.base_path = AP
    assert.deepEqual(verifyBody(body), MISMATCH)
    setPath(body, ['details', 'manual'], { base_path: MP, title: 'Unreviewed structure' })
    assert.deepEqual(verifyBody(body), INVALID)
  })
  for (const relation of ['available_translations', 'manual', 'organisations', 'primary_publishing_organisation'] as const) {
    for (const value of [[], null, {}, [envelope().links[relation][0], envelope().links[relation][0]]]) {
      test(`${relation} must be exactly one object: ${JSON.stringify(value).slice(0, 35)}`, () => {
        const body = envelope(); setPath(body.links, [relation], value)
        assert.deepEqual(verifyBody(body), INVALID)
      })
    }
    test(`${relation} missing rejects independently`, () => {
      const body = envelope(); delete (body.links as Record<string, unknown>)[relation]
      assert.deepEqual(verifyBody(body), INVALID)
    })
    for (const [key, value] of Object.entries({ content_id: 'foreign-id', base_path: '/foreign', locale: 'cy',
      document_type: 'foreign', schema_name: 'foreign', withdrawn: true, api_path: '/api/foreign', api_url: URL + '?foreign', web_url: URL })) {
      test(`${relation}.${key} independently contradicts identity`, () => {
        const body = envelope(); setPath(body, ['links', relation, 0, key], value)
        assert.deepEqual(verifyBody(body), MISMATCH)
      })
    }
    for (const [key, value] of [['links', { hidden: [{ content_id: N }] }], ['unknown', true], ['content_id', null]] as const) {
      test(`${relation}.${key} malformed structure rejects`, () => {
        const body = envelope(); setPath(body, ['links', relation, 0, key], value)
        assert.deepEqual(verifyBody(body), INVALID)
      })
    }
  }
  for (const relation of ['organisations', 'primary_publishing_organisation'] as const) {
    test(`${relation} organisation status must be live`, () => {
      const body = envelope(); body.links[relation][0]!.details.organisation_govuk_status.status = 'closed'
      assert.deepEqual(verifyBody(body), MISMATCH)
    })
    for (const [path, value] of [
      [['details'], {}], [['details', 'unknown'], true], [['details', 'logo', 'unknown'], 'x'],
      [['details', 'default_news_image', 'unknown'], 'x'], [['details', 'organisation_govuk_status', 'unknown'], true],
      [['details', 'organisation_govuk_status', 'status'], null], [['title'], {}],
    ] as [string[], unknown][]) test(`${relation} unknown/malformed ${path.join('.')}`, () => {
      const body = envelope(); setPath(body, ['links', relation, 0, ...path], value)
      assert.deepEqual(verifyBody(body), INVALID)
    })
  }
  test('unknown root relation fails closed', () => {
    const body = envelope(); setPath(body.links, ['lead_organisations'], [])
    assert.deepEqual(verifyBody(body), INVALID)
  })
  test('optional linked display fields may be absent', () => {
    const body = envelope()
    for (const relation of Object.values(body.links)) {
      const row = relation[0] as Record<string, unknown>
      delete row.title; delete row.public_updated_at; delete row.analytics_identifier
      if (row.details) for (const key of ['acronym', 'brand', 'logo', 'default_news_image']) delete (row.details as Record<string, unknown>)[key]
    }
    assert.ok(verifyBody(body).ok)
  })
})

describe('whole-string duplicate and grammar scanner', () => {
  const duplicateBodies = [
    `{"content_id":"wrong",${input().responseText.slice(1)}`,
    input().responseText.slice(0, -1) + `,"content_id":"wrong"}`,
    `{"content_id":"${N}",${input().responseText.slice(1)}`,
    `{"content\\u005fid":"${N}",${input().responseText.slice(1)}`,
    input().responseText.replace(`"content_id":"${H}"`, `"content_id":"${H}","content_id":"${H}"`),
    input().responseText.replace('"body":', '"body":"duplicate", "body":'),
  ]
  duplicateBodies.forEach((responseText, index) => test(`duplicate audited-envelope case ${index + 1}`, () => {
    assert.deepEqual(profile.verify({ ...input(), responseText }), INVALID)
  }))
  const malformed = ['', ' ', '\ufeff{}', '[]', 'null', 'true', '1', '"str"', '{', '{"a":', '{"a":1',
    '{/* comment */}', '{"a":1// comment\n}', '{"a":1,}', '{"a":[1,]}', '{}{}', '{} null', '{"a":1} trailing',
    '{"a":"\\x20"}', '{"a":"\\v"}', '{"a":"\\u12"}', '{"a":"\\uZZZZ"}', '{"a":"\\uD800"}',
    '{"a":"\\uDC00"}', '{"a":"\\uD800x"}', '{"a":"\\uD800\\uD800"}', '{"a":"\ud800"}', '{"a":"\udc00"}',
    '{"a":"raw\nnewline"}', '{"a":"\u0000"}', '{"a":"unterminated}', '{"a":"backslash\\',
    '{"a" 1}', '{a:1}', "{'a':1}", '{"a":1 "b":2}', '{"a":[,]}', '{"a":truefalse}',
    '{"a":False}', '{"a":undefined}', '{"a":NaN}', '{"a":Infinity}', '{"a":-Infinity}',
    ...['01', '-01', '+1', '.1', '1.', '1e', '1e+', '1e-', '--1', '-', '1e309', '0x10'].map(n => `{"a":${n}}`),
    '{"a":1,"a":1}', '{"a":1,"\\u0061":2}', '{"nest":[{"b":1,"b":2}]}',
    '{"a\\n":1,"a\\u000a":2}', '{"😀":1,"\\ud83d\\ude00":2}',
    '{"a":1}\u00a0', '{\u00a0"a":1}',
  ]
  malformed.forEach((text, index) => test(`reject malformed JSON ${index + 1}: ${JSON.stringify(text)}`, () => {
    assert.deepEqual(parseGovukContentApiJson(text), INVALID)
  }))
  for (const key of ['__proto__', 'prototype', 'constructor', '\\u005f_proto__', 'proto\\u0074ype', 'construc\\u0074or']) {
    test(`reject dangerous decoded key ${key} at any depth`, () => {
      assert.deepEqual(parseGovukContentApiJson(`{"nested":[{"${key}":null}]}`), INVALID)
    })
  }
  const valid = ['{}', '{"a":[]}', '{"a":{"content_id":"x"},"b":{"content_id":"y"}}',
    '{"a":"\\ud83d\\ude00"}', '{"a":"😀"}', '{"a":"\ud83d\\ude00"}', '{"a":"\\ud83d\ude00"}',
    '{"a":"\\\"\\\\\\/\\b\\f\\n\\r\\t\\u0061"}', '{"é":1,"e\\u0301":2,"A":3,"a":4}',
    '{"a":[0,-0,-12,0.1,-1.2e+3,1E-300,1e-999,true,false,null,{},[]]}',
    '{"body":"{ \\\"content_id\\\": 1, \\\"content_id\\\": 2 }"}',
    ' \n\r\t{ "a" : [ true , false ] } \r\n',
  ]
  valid.forEach((text, index) => test(`scan/JSON.parse agreement ${index + 1}`, () => {
    assert.deepEqual(parseGovukContentApiJson(text), { ok: true, value: JSON.parse(text) })
  }))
  test('scan validates the entire document even after correct identity', () => {
    const text = input().responseText.replace('"change_history":[]', '"change_history":[{"x":1,"x":2}]')
    assert.deepEqual(profile.verify({ ...input(), responseText: text }), INVALID)
  })
})

describe('inclusive parser resource boundaries', () => {
  test('fixed audited bounds are frozen', () => {
    assert.deepEqual(GOVUK_CONTENT_API_JSON_LIMITS, { bytes: 65536, depth: 16, members: 2048,
      membersPerObject: 256, elementsPerArray: 1024, values: 4096, keyCodeUnits: 128, numberCodeUnits: 64 })
    assert.ok(Object.isFrozen(GOVUK_CONTENT_API_JSON_LIMITS))
  })
  const parse = (value: unknown) => parseGovukContentApiJson(JSON.stringify(value))
  test('UTF-8 bytes exactly at limit pass; one byte over fails', () => {
    assert.ok(parse({ a: 'x'.repeat(65528) }).ok)
    assert.deepEqual(parse({ a: 'x'.repeat(65529) }), INVALID)
    assert.ok(parse({ a: 'é'.repeat(32764) }).ok)
    assert.deepEqual(parse({ a: 'é'.repeat(32765) }), INVALID)
  })
  test('container depth includes root, but scalar leaves do not add depth', () => {
    const nested = (n: number) => '{"a":' + '['.repeat(n) + '0' + ']'.repeat(n) + '}'
    assert.ok(parseGovukContentApiJson(nested(15)).ok)
    assert.deepEqual(parseGovukContentApiJson(nested(16)), INVALID)
    assert.deepEqual(parseGovukContentApiJson(nested(1000)), INVALID)
    const objects = (n: number) => '{"a":'.repeat(n) + '0' + '}'.repeat(n)
    assert.ok(parseGovukContentApiJson(objects(16)).ok)
    assert.deepEqual(parseGovukContentApiJson(objects(17)), INVALID)
  })
  const object = (n: number) => Object.fromEntries(Array.from({ length: n }, (_, i) => [`k${i}`, 0]))
  test('total members at 2048 pass; at 2049 fail with every object within 256', () => {
    const parts = Array.from({ length: 7 }, () => object(256))
    assert.ok(parse({ a: [...parts, object(255)] }).ok)
    assert.deepEqual(parse({ a: [...parts, object(256)] }), INVALID)
  })
  test('per-object members 256 pass; 257 fail', () => {
    assert.ok(parse({ a: object(256) }).ok)
    assert.deepEqual(parse({ a: object(257) }), INVALID)
  })
  test('per-array elements 1024 pass; 1025 fail', () => {
    assert.ok(parse({ a: Array(1024).fill(null) }).ok)
    assert.deepEqual(parse({ a: Array(1025).fill(null) }), INVALID)
  })
  test('4096 total values including containers pass; 4097 fail', () => {
    const parts = Array.from({ length: 3 }, () => Array(1024).fill(0))
    assert.ok(parse({ a: [...parts, Array(1018).fill(0)] }).ok)
    assert.deepEqual(parse({ a: [...parts, Array(1019).fill(0)] }), INVALID)
  })
  test('decoded key limit counts UTF-16 units, not escape bytes or code points', () => {
    assert.ok(parse({ ['x'.repeat(128)]: 1 }).ok)
    assert.deepEqual(parse({ ['x'.repeat(129)]: 1 }), INVALID)
    assert.ok(parseGovukContentApiJson(`{"${'\\u0061'.repeat(128)}":1}`).ok)
    assert.deepEqual(parseGovukContentApiJson(`{"${'\\u0061'.repeat(129)}":1}`), INVALID)
    assert.ok(parse({ ['😀'.repeat(64)]: 1 }).ok)
    assert.deepEqual(parse({ ['😀'.repeat(64) + 'a']: 1 }), INVALID)
  })
  test('number tokens 64 units pass; 65 fail even when finite', () => {
    assert.ok(parseGovukContentApiJson(`{"a":${'1'.repeat(64)}}`).ok)
    assert.deepEqual(parseGovukContentApiJson(`{"a":${'1'.repeat(65)}}`), INVALID)
    assert.ok(parseGovukContentApiJson(`{"a":-0.${'0'.repeat(60)}1}`).ok)
    assert.deepEqual(parseGovukContentApiJson(`{"a":-0.${'0'.repeat(61)}1}`), INVALID)
  })
})

describe('registry and production dormancy', () => {
  test('production registry contains exactly this existing profile after import', () => {
    assert.equal(OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY.length, 1)
    assert.equal(OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY[0], profile)
    assert.ok(Object.isFrozen(OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY))
  })
  test('the registry is the sole allowed non-test production importer of this module', () => {
    const root = process.cwd(), importers: string[] = []
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.') || ['node_modules', 'dist', 'out'].includes(entry.name)) continue
        const path = join(dir, entry.name)
        if (entry.isDirectory()) walk(path)
        else if (/\.(?:[cm]?[jt]sx?)$/.test(entry.name) && !/\.(?:test|spec)\.[^.]+$/.test(entry.name)
          && entry.name !== 'official-truth-govuk-content-api-identity-profile.ts'
          && /['"][^'"]*official-truth-govuk-content-api-identity-profile(?:\.[cm]?[jt]s)?['"]/.test(readFileSync(path, 'utf8'))) importers.push(relative(root, path))
      }
    }
    walk(root)
    assert.deepEqual(importers, ['lib/readiness/official-truth-content-identity.ts'])
  })
  test('profile has one type-only dependency and no network, database, clock or registration authority', () => {
    const source = readFileSync(join(process.cwd(), 'lib/readiness/official-truth-govuk-content-api-identity-profile.ts'), 'utf8')
    assert.deepEqual([...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(m => m[1]), ['./official-truth-content-identity'])
    assert.match(source, /import type \{ ContentIdentityProfileDefinition \}/)
    const emitted = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022, verbatimModuleSyntax: true } }).outputText
    assert.doesNotMatch(emitted, /\bimport\b|\brequire\s*\(|official-truth-content-identity/)
    assert.doesNotMatch(source, /\bfetch\s*\(|\bprocess\s*\.|\bDate\s*\.|\bnew\s+Date\s*\(|\beval\s*\(|\bnew\s+Function\b|supabase|node:|store-server|source-catalog|PROFILE_REGISTRY/)
  })
  for (const first of ['official-truth-content-identity', 'official-truth-govuk-content-api-identity-profile']) {
    test(`fresh ${first} import has no runtime cycle, network or verifier execution`, () => {
      const script = `
        const assert = require('node:assert/strict');
        const { Session } = require('node:inspector/promises');
        const forbidden = () => { throw new Error('import must remain dormant'); };
        globalThis.fetch = forbidden;
        for (const name of ['node:http', 'node:https']) {
          require(name).request = require(name).get = forbidden;
        }
        const net = require('node:net');
        net.connect = net.createConnection = net.Socket.prototype.connect = forbidden;
        require('node:dns').lookup = require('node:dns').resolve = forbidden;
        (async () => {
          const session = new Session(); session.connect();
          await session.post('Profiler.enable');
          await session.post('Profiler.startPreciseCoverage', { callCount: true, detailed: true });
          require('./lib/readiness/${first}.ts');
          const registry = require('./lib/readiness/official-truth-content-identity.ts').OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY;
          const profile = require('./lib/readiness/official-truth-govuk-content-api-identity-profile.ts').GOVUK_ETA_NATIONAL_LIST_CONTENT_API_IDENTITY_PROFILE;
          assert.equal(registry.length, 1); assert.equal(registry[0], profile);
          assert.ok(Object.isFrozen(registry)); assert.equal(typeof profile.verify, 'function');
          const coverage = await session.post('Profiler.takePreciseCoverage');
          const file = coverage.result.find(entry => entry.url.endsWith('/official-truth-govuk-content-api-identity-profile.ts'));
          assert.ok(file);
          const verifier = file.functions.find(entry => entry.functionName === 'verify');
          assert.ok(verifier); assert.equal(verifier.ranges[0].count, 0);
          for (const name of ['createContentIdentityGraph', 'evidenceKandidatAkzeptieren', 'regelKandidatAkzeptieren']) {
            const functions = coverage.result.flatMap(entry => entry.functions).filter(entry => entry.functionName === name);
            assert.ok(functions.length > 0, name);
            assert.ok(functions.every(entry => entry.ranges[0].count === 0), name);
          }
          for (const path of Object.keys(require.cache)) {
            assert.doesNotMatch(path, /supabase|source-catalog-server|store-server|trusted-fact-extractor/);
          }
          await session.post('Profiler.stopPreciseCoverage'); session.disconnect();
          await new Promise(resolve => setImmediate(resolve));
          process.stdout.write('dormant_singleton');
        })().catch(error => { console.error(error); process.exitCode = 1; });
      `
      assert.equal(execFileSync(process.execPath, ['--import', './scripts/server-only-test-register.mjs', '--import', 'tsx', '-e', script],
        { encoding: 'utf8', timeout: 15_000, env: { ...process.env,
          NEXT_PUBLIC_SUPABASE_URL: 'https://supabase.example', SUPABASE_SERVICE_ROLE_KEY: 'synthetic-test-key' } }), 'dormant_singleton')
    })
  }
})
