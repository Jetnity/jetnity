import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, test } from 'node:test'
import {
  CONTENT_IDENTITY_LIMITS, OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY,
  contentEvidenceLookupV3, contentEvidenceVersionV2, contentItemRefKey, contentItemRefsEqual,
  createContentIdentityGraph, readContentItemRef, readDistinctContentItemRefs, readRepresentationRef,
  representationRefKey, resolveCurrentContentRepresentation,
  type ContentItemRef, type RepresentationRef, type ContentItemDescriptor, type RepresentationDescriptor,
  type ContentIdentityProfileDefinition, type ContentEvidenceIdentity,
} from '@/lib/readiness/official-truth-content-identity'
import { evidenceScopeLesen } from '@/lib/readiness/evidence'
import { regelScopeAusEvidenceScope } from '@/lib/readiness/rule-claims'
import { quellenRegistryErstellen, quellenUrlAufloesen, type QuellenRegistry } from '@/lib/readiness/source-registry'

function unwrap<T>(result: { ok: true; value: T } | { ok: false; reason: string }): T {
  if (!result.ok) assert.fail(result.reason)
  assert.ok(Object.isFrozen(result))
  return result.value
}
function rejected(result: { ok: boolean; reason?: string }, reason?: string) {
  assert.equal(result.ok, false)
  if (reason) assert.equal(result.reason, reason)
  assert.ok(Object.isFrozen(result))
}
function registry(): QuellenRegistry {
  const result = quellenRegistryErstellen([
    { sourceId: 'example-authority', sourceClass: 'official_authority', publisherName: 'Example platform',
      authorityName: 'Example authority', domains: ['gov.example', 'mirror.example'] },
    { sourceId: 'other-authority', sourceClass: 'official_authority', publisherName: 'Other platform',
      authorityName: 'Other authority', domains: ['other.example'] },
    { sourceId: 'example-provider', sourceClass: 'licensed_evidence_provider', publisherName: 'Example provider',
      domains: ['provider.example'] },
  ], { blockedDomains: ['blocked.gov.example'] })
  assert.ok(result.ok)
  return result.registry
}
function item(overrides: Partial<ContentItemDescriptor> = {}): ContentItemDescriptor {
  return { sourceId: 'example-authority', contentItemId: 'publication-a', contentItemVersion: 1, current: true,
    externalIdNamespace: 'example-publication', externalContentId: 'external-a',
    expectedPublisherIds: ['publisher-a'], expectedAuthorityIds: ['department-a'], ...overrides }
}
function representation(overrides: Partial<RepresentationDescriptor> = {}): RepresentationDescriptor {
  return { sourceId: 'example-authority', contentItemId: 'publication-a', contentItemVersion: 1,
    representationId: 'html-en', representationVersion: 1, current: true,
    requestUrls: ['https://gov.example/publication-a'], expectedFinalUrl: 'https://gov.example/publication-a',
    expectedMediaType: 'text/html', identityProfileId: 'synthetic-profile', identityProfileVersion: 1,
    expectedLocale: 'en', expectedSchema: 'synthetic-publication', ...overrides }
}
function api(): RepresentationDescriptor {
  return representation({ representationId: 'api-en', expectedMediaType: 'application/json',
    requestUrls: ['https://gov.example/api/publication-a'], expectedFinalUrl: 'https://gov.example/api/publication-a' })
}
function second(): RepresentationDescriptor {
  return representation({ contentItemId: 'publication-b', requestUrls: ['https://gov.example/publication-b'],
    expectedFinalUrl: 'https://gov.example/publication-b' })
}
function profile(overrides: Partial<ContentIdentityProfileDefinition> = {}): ContentIdentityProfileDefinition {
  return { identityProfileId: 'synthetic-profile', identityProfileVersion: 1, current: true,
    verify: () => ({ ok: false, reason: 'identity_mismatch' }), ...overrides }
}
function graph(items: unknown = [item()], reps: unknown = [representation()], profiles = [profile()]) {
  return createContentIdentityGraph(registry(), items, reps, profiles)
}
function itemRef(value: ContentItemRef): ContentItemRef {
  return { sourceId: value.sourceId, contentItemId: value.contentItemId }
}
function repRef(value: RepresentationRef = representation()): RepresentationRef {
  return { ...itemRef(value), representationId: value.representationId }
}
function scope(overrides: Record<string, unknown> = {}) {
  return { destinationCountryCode: 'JP', transitCountryCode: null,
    citizenship: { mode: 'required', countryCodes: ['CH', 'RS'] },
    credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'CH' },
    residence: { mode: 'required', countryCode: 'CH' }, requirementType: 'visa',
    validity: { mode: 'travel_date', travelDate: '2026-10-04' }, ...overrides }
}
function evidence(overrides: Partial<ContentEvidenceIdentity> = {}): ContentEvidenceIdentity {
  return { identitySchema: 2, ...repRef(), contentItemVersion: 1, representationVersion: 1,
    identityProfileId: 'synthetic-profile', identityProfileVersion: 1,
    lookupKey: unwrap(contentEvidenceLookupV3(scope(), repRef())).key,
    canonicalUrl: 'https://gov.example/publication-a', contentType: 'text/html', sourceContentHash: 'a'.repeat(64),
    retrievedAt: '2026-10-04T00:00:00.000Z', validFrom: '2026-10-01', validUntil: '2026-10-31', ...overrides }
}

describe('content support identity is an authority-scoped pair', () => {
  test('two items on one authority, and the same local id on two authorities, stay distinct', () => {
    const refs = [itemRef(item()), itemRef(item({ contentItemId: 'publication-b' })),
      itemRef(item({ sourceId: 'other-authority' }))]
    const result = unwrap(readDistinctContentItemRefs(refs))
    assert.equal(result.length, 3)
    assert.equal(unwrap(contentItemRefsEqual(refs[0], refs[1])), false)
    assert.equal(unwrap(contentItemRefsEqual(refs[0], refs[2])), false)
    assert.equal(new Set(result.map((ref) => unwrap(contentItemRefKey(ref)))).size, 3)
    assert.equal(unwrap(contentItemRefKey(refs[0])), '["example-authority","publication-a"]')
  })
  test('HTML/API streams share exactly one support; a repeated pair fails instead of deduplicating', () => {
    const built = unwrap(graph([item()], [api(), representation()]))
    const refs = built.representations.map(itemRef)
    assert.equal(unwrap(contentItemRefsEqual(refs[0], refs[1])), true)
    rejected(readDistinctContentItemRefs(refs), 'duplicate_content_item_ref')
    assert.notEqual(unwrap(representationRefKey(repRef(api()))), unwrap(representationRefKey(repRef())))
  })
  test('sort is source then item, independent of input and object key order', () => {
    const refs = [{ contentItemId: 'zz', sourceId: 'aa' }, { sourceId: 'zz', contentItemId: 'aa' }, { sourceId: 'aa', contentItemId: 'aa' }]
    const expected = [{ sourceId: 'aa', contentItemId: 'aa' }, { sourceId: 'aa', contentItemId: 'zz' }, { sourceId: 'zz', contentItemId: 'aa' }]
    assert.deepEqual(unwrap(readDistinctContentItemRefs(refs)), expected)
    assert.deepEqual(unwrap(readDistinctContentItemRefs([...refs].reverse())), expected)
    assert.deepEqual(refs[0], { contentItemId: 'zz', sourceId: 'aa' })
  })
  test('strict bounded ids, exact shapes, nonempty bounded support lists', () => {
    for (const value of [null, [], {}, { ...itemRef(item()), representationId: 'extra' },
      ...['a', '', 'UPPER', ' with-space', 'id|other', 'https://host', 'a'.repeat(65)].map((contentItemId) => ({ ...itemRef(item()), contentItemId }))]) {
      rejected(readContentItemRef(value), 'invalid_ref')
      rejected(contentItemRefKey(value), 'invalid_ref')
      rejected(contentItemRefsEqual(itemRef(item()), value), 'invalid_ref')
    }
    rejected(contentItemRefsEqual(null, itemRef(item())), 'invalid_ref')
    for (const value of [[], null, [itemRef(item()), null], Array(2), Array(9).fill(itemRef(item()))]) rejected(readDistinctContentItemRefs(value))
    unwrap(readContentItemRef({ sourceId: 'aa', contentItemId: 'a'.repeat(64) }))
    unwrap(readRepresentationRef(repRef()))
    rejected(readRepresentationRef({ ...repRef(), representationId: 'x' }))
    rejected(representationRefKey({ ...repRef(), representationVersion: 1 }))
  })
})

describe('complete fail-closed content identity graph', () => {
  test('two items under one source plus two renderings and another authority are valid', () => {
    const built = unwrap(graph([item(), item({ contentItemId: 'publication-b', externalContentId: 'external-b' }),
      item({ sourceId: 'other-authority' })], [representation(), api(), second(),
      representation({ sourceId: 'other-authority', requestUrls: ['https://other.example/a'], expectedFinalUrl: 'https://other.example/a' })]))
    assert.equal(built.items.length, 3)
    assert.equal(built.representations.length, 4)
    assert.equal(unwrap(readDistinctContentItemRefs(built.items.map(itemRef))).length, 3)
  })
  test('empty catalog is valid and makes no publication eligible', () => {
    const built = unwrap(createContentIdentityGraph(registry(), [], []))
    assert.deepEqual(built.profiles, [])
    rejected(resolveCurrentContentRepresentation(built, 'https://gov.example/publication-a'), 'not_registered')
  })
  test('external identity cannot inflate supports, including historical rows and reversed order', () => {
    const items = [item({ current: false }), item({ contentItemId: 'publication-b' })]
    for (const order of [items, [...items].reverse()]) rejected(graph(order, []), 'external_identity_conflict')
    rejected(graph([item({ current: false }), item({ contentItemVersion: 2, externalContentId: 'replacement' })], []), 'item_identity_drift')
    rejected(graph([item({ current: false }), item({ contentItemVersion: 2, externalIdNamespace: 'other-namespace' })], []), 'item_identity_drift')
  })
  test('duplicate item versions and multiple current versions fail', () => {
    rejected(graph([item(), item()], []), 'duplicate_item_version')
    rejected(graph([item(), item({ contentItemVersion: 2 })], []), 'duplicate_current_item')
  })
  test('every representation binds an existing exact item version, and current binds current', () => {
    rejected(graph([], [representation()]), 'missing_item_version')
    rejected(graph([item()], [representation({ contentItemVersion: 2 })]), 'missing_item_version')
    rejected(graph([item({ current: false }), item({ contentItemVersion: 2 })]), 'historical_item_version')
    unwrap(graph([item({ current: false }), item({ contentItemVersion: 2 })],
      [representation({ current: false }), representation({ contentItemVersion: 2, representationVersion: 2 })]))
  })
  test('duplicate representation versions and current stream versions fail', () => {
    rejected(graph([item()], [representation(), representation()]), 'duplicate_representation_version')
    rejected(graph([item()], [representation(), representation({ representationVersion: 2 })]), 'duplicate_current_representation')
  })
  test('format or locale changes require another representation stream', () => {
    for (const delta of [{ expectedMediaType: 'application/json' }, { expectedLocale: 'de' }]) {
      rejected(graph([item()], [representation({ current: false }), representation({ representationVersion: 2, ...delta })]), 'representation_identity_drift')
    }
  })
  test('URL collision between items or streams fails in either order', () => {
    const items = [item(), item({ contentItemId: 'publication-b', externalContentId: 'external-b' })]
    for (const other of [representation({ contentItemId: 'publication-b' }), representation({ representationId: 'second-stream' })]) {
      for (const reps of [[representation(), other], [other, representation()]]) rejected(graph(items, reps), 'url_conflict')
    }
  })
  test('final-only URLs participate in uniqueness and resolution', () => {
    const rep = representation({ expectedFinalUrl: 'https://gov.example/final' })
    const built = unwrap(graph([item()], [rep]))
    assert.equal(unwrap(resolveCurrentContentRepresentation(built, rep.expectedFinalUrl)).representationId, rep.representationId)
    rejected(graph([item()], [rep, api(), representation({ representationId: 'collision',
      requestUrls: [rep.expectedFinalUrl], expectedFinalUrl: 'https://gov.example/other-final' })]), 'url_conflict')
  })
  test('historical URL reservation forbids another item or representation; old URL is not current', () => {
    const history = representation({ current: false })
    const moved = representation({ representationVersion: 2, requestUrls: ['https://gov.example/moved'], expectedFinalUrl: 'https://gov.example/moved' })
    const built = unwrap(graph([item()], [history, moved]))
    rejected(resolveCurrentContentRepresentation(built, history.expectedFinalUrl), 'not_registered')
    for (const other of [representation({ representationId: 'new-stream' }), representation({ contentItemId: 'publication-b' })]) {
      rejected(graph([item(), item({ contentItemId: 'publication-b', externalContentId: 'external-b' })], [history, other]), 'url_conflict')
    }
  })
  test('same-domain sibling and different query remain unregistered; fragments are not request identity', () => {
    const rep = representation({ requestUrls: ['https://gov.example/read?a=1&b=2'], expectedFinalUrl: 'https://gov.example/final?a=1' })
    const built = unwrap(graph([item()], [rep]))
    assert.ok(quellenUrlAufloesen(registry(), 'https://gov.example/sibling').ok)
    for (const url of ['https://gov.example/sibling', 'https://gov.example/read?b=2&a=1', 'https://gov.example/read', 'https://gov.example/final?a=2']) {
      rejected(resolveCurrentContentRepresentation(built, url), 'not_registered')
    }
    assert.deepEqual(unwrap(resolveCurrentContentRepresentation(built, `${rep.requestUrls[0]}#section`)), rep)
  })
  test('source boundary, blocked domains and providers cannot be bypassed', () => {
    rejected(graph([item({ sourceId: 'unknown-authority' })], []), 'unknown_source')
    rejected(graph([item({ sourceId: 'example-provider' })], []), 'source_not_official')
    for (const key of ['requestUrls', 'expectedFinalUrl']) {
      const replace = (url: string) => representation({ [key]: key === 'requestUrls' ? [url] : url })
      rejected(graph([item()], [replace('https://other.example/a')]), 'source_mismatch')
      rejected(graph([item()], [replace('https://unregistered.example/a')]), 'url_not_authorized')
      rejected(graph([item()], [replace('https://blocked.gov.example/a')]), 'url_not_authorized')
    }
    unwrap(graph([item()], [representation({ expectedFinalUrl: 'https://mirror.example/a' })]))
  })
  test('invalid authority registries fail, rather than selecting first matching domain', () => {
    const valid = registry()
    rejected(createContentIdentityGraph({ ...valid, sources: [...valid.sources,
      { ...valid.sources[0]!, sourceId: 'collision-authority' }] }, [], []), 'invalid_registry')
    rejected(createContentIdentityGraph(null as unknown as QuellenRegistry, [], []), 'invalid_registry')
    rejected(createContentIdentityGraph({ sources: valid.sources } as QuellenRegistry, [], []), 'invalid_registry')
  })
  for (const url of ['http://gov.example/a', 'https://user:password@gov.example/a', 'https://localhost/a',
    'https://sub.localhost/a', 'https://host.local/a', 'https://gov.example:8443/a', 'https://gov.example/*',
    'HTTPS://GOV.EXAMPLE/a', 'https://gov.example/a#part', ' https://gov.example/a', 'https://gov.example/a/../b']) {
    test(`noncanonical or forbidden descriptor URL: ${url}`, () => {
      rejected(graph([item()], [representation({ requestUrls: [url] })]), 'invalid_url')
      rejected(graph([item()], [representation({ expectedFinalUrl: url })]), 'invalid_url')
    })
  }
  test('malformed media type is not normalized into permission', () => {
    for (const type of ['', 'Text/HTML', 'text/html; charset=utf-8', 'text/*', 'text', 'text/html\n']) {
      rejected(graph([item()], [representation({ expectedMediaType: type })]), 'invalid_media_type')
    }
    unwrap(graph([item()], [representation({ expectedMediaType: 'application/example+json' })]))
  })
  test('profiles must exist at exact current version; no production default profile', () => {
    rejected(createContentIdentityGraph(registry(), [item()], [representation()]), 'profile_unavailable')
    rejected(graph([item()], [representation()], [profile({ current: false })]), 'profile_unavailable')
    rejected(graph([item()], [representation()], [profile({ identityProfileVersion: 2 })]), 'profile_unavailable')
    rejected(graph([item()], [representation()], [profile({ identityProfileId: 'different-profile' })]), 'profile_unavailable')
    rejected(graph([item()], [representation({ current: false })], [profile({ current: false })]), 'profile_unavailable')
  })
  test('profile duplicates, executable definitions in data, and malformed definitions fail', () => {
    rejected(graph([], [], [profile(), profile()]), 'duplicate_profile_version')
    rejected(graph([], [], [profile(), profile({ identityProfileVersion: 2 })]), 'duplicate_current_profile')
    for (const invalid of [profile({ identityProfileVersion: 0 }), { ...profile(), verify: 'code' }, { ...profile(), legalEffect: 'required' }]) {
      rejected(graph([], [], [invalid as ContentIdentityProfileDefinition]), 'invalid_profile')
    }
    let called = 0
    unwrap(graph([item()], [representation()], [profile({ verify: () => { called++; throw new Error('must not execute') } })]))
    assert.equal(called, 0)
  })
  test('strict descriptor data rejects unknown fields, accessors, prototypes, symbols and functions without invoking them', () => {
    let called = 0
    const getter = { ...item(), get externalContentId() { called++; return 'external-a' } }
    const values = [{ ...item(), verify: () => true }, { ...item(), expectedPublisherIds: [() => true] }, getter,
      Object.assign(Object.create({ inherited: true }), item()), { ...item(), [Symbol('hidden')]: true },
      { ...item(), travellerId: 'person' }, { ...item(), legalEffect: 'required' }]
    for (const value of values) rejected(graph([value], []), 'invalid_descriptor')
    for (const value of [{ ...representation(), pathPrefix: '/' }, { ...representation(), verify: () => true },
      { ...representation(), expectedSchema: /publication/ }, { ...representation(), expectedLocale: () => 'en' }]) {
      rejected(graph([item()], [value]), 'invalid_descriptor')
    }
    assert.equal(called, 0)
  })
  test('bounded arrays, metadata, versions and duplicate request URLs', () => {
    rejected(graph(Array(CONTENT_IDENTITY_LIMITS.itemVersions + 1), []), 'bound_exceeded')
    rejected(graph([], Array(CONTENT_IDENTITY_LIMITS.representationVersions + 1)), 'bound_exceeded')
    rejected(graph([], [], Array(CONTENT_IDENTITY_LIMITS.profiles + 1)), 'bound_exceeded')
    for (const invalid of [0, -1, 1.5, NaN, Infinity, CONTENT_IDENTITY_LIMITS.version + 1]) {
      rejected(graph([item({ contentItemVersion: invalid })], []))
      rejected(graph([item()], [representation({ representationVersion: invalid })]))
      rejected(graph([], [], [profile({ identityProfileVersion: invalid })]))
    }
    for (const ids of [[], ['duplicate', 'duplicate'], ['x'.repeat(129)], Array(9).fill('publisher'), ['https://identity']]) {
      rejected(graph([item({ expectedPublisherIds: ids })], []), 'invalid_descriptor')
      rejected(graph([item({ expectedAuthorityIds: ids })], []), 'invalid_descriptor')
    }
    for (const urls of [[], Array(2), Array(17).fill('https://gov.example/a'), ['https://gov.example/a', 'https://gov.example/a']]) {
      rejected(graph([item()], [representation({ requestUrls: urls })]))
    }
    unwrap(graph([item({ contentItemVersion: CONTENT_IDENTITY_LIMITS.version })], []))
  })
  test('all exposed data and helper outputs are deeply frozen and detached from input', () => {
    const inputItem = item(), inputRep = representation(), inputProfile = profile(), authority = structuredClone(registry())
    const built = unwrap(createContentIdentityGraph(authority, [inputItem], [inputRep], [inputProfile]))
    const frozen = (value: unknown): void => {
      if (value && typeof value === 'object') {
        assert.ok(Object.isFrozen(value))
        for (const child of Object.values(value)) frozen(child)
      }
    }
    frozen(built)
    const before = JSON.stringify(built)
    for (const [target, field, value] of [
      [built, 'items', []], [built.items[0], 'sourceId', 'attacker'], [built.items[0]!.expectedPublisherIds, '0', 'attacker'],
      [built.representations[0], 'contentItemId', 'attacker'], [built.representations[0]!.requestUrls, '0', 'https://evil.example/'],
      [built.profiles[0], 'current', false], [built.authorityRegistry.sources[0], 'sourceId', 'attacker'],
      [built.authorityRegistry.sources[0]!.domains, '0', 'evil.example'], [built.authorityRegistry.blockedDomains, '0', 'other.example'],
    ] as const) assert.throws(() => Object.defineProperty(target, field, { value }), TypeError)
    ;(inputItem.expectedPublisherIds as string[])[0] = 'changed-input'
    ;(inputRep.requestUrls as string[])[0] = 'https://changed.example/'
    authority.sources[0]!.publisherName = 'Changed input'
    Object.assign(inputProfile, { current: false })
    assert.equal(JSON.stringify(built), before)
    assert.equal('verify' in built.profiles[0]!, false)
    for (const value of [unwrap(readContentItemRef(itemRef(item()))), unwrap(readDistinctContentItemRefs([itemRef(item())])),
      unwrap(readRepresentationRef(repRef())), unwrap(resolveCurrentContentRepresentation(built, representation().expectedFinalUrl)),
      unwrap(contentEvidenceLookupV3(scope(), repRef())), unwrap(contentEvidenceVersionV2(evidence()))]) frozen(value)
  })
  test('graph canonical order is independent of all input ordering', () => {
    const items = [item({ current: false }), item({ contentItemVersion: 2, expectedPublisherIds: ['publisher-z', 'publisher-a'] })]
    const reps = [representation({ current: false }), representation({ contentItemVersion: 2, representationVersion: 2,
      requestUrls: ['https://gov.example/z', 'https://gov.example/a'] }), { ...api(), contentItemVersion: 2 }]
    const profiles = [profile({ current: false, identityProfileVersion: 2 }), profile()]
    const expected = unwrap(graph(items, reps, profiles))
    const reversed = unwrap(graph([...items].reverse().map((row) => ({ ...row, expectedPublisherIds: [...row.expectedPublisherIds].reverse() })),
      [...reps].reverse().map((row) => ({ ...row, requestUrls: [...row.requestUrls].reverse() })), [...profiles].reverse()))
    assert.equal(JSON.stringify(reversed), JSON.stringify(expected))
  })
  test('resolver defensively rejects ambiguous forged graphs and wrong authority', () => {
    const built = unwrap(graph())
    const forged = { ...built, representations: [representation(), representation({ representationId: 'duplicate' })] }
    rejected(resolveCurrentContentRepresentation(forged, representation().expectedFinalUrl), 'ambiguous_url')
    rejected(resolveCurrentContentRepresentation({ ...built, representations: [representation({ sourceId: 'other-authority' })] },
      representation().expectedFinalUrl), 'source_mismatch')
    rejected(resolveCurrentContentRepresentation(built, 'http://gov.example/a'), 'invalid_url')
  })
})

describe('future v3 lookup and ev2 identity serialization only', () => {
  test('v3 preserves the canonical regulatory parser and every legacy cell field', () => {
    const input = scope(), ref = repRef(), result = unwrap(contentEvidenceLookupV3(input, ref))
    const canonicalScope = regelScopeAusEvidenceScope(input)
    assert.ok(canonicalScope.ok)
    assert.deepEqual(result.scope, canonicalScope.scope)
    const legacy = evidenceScopeLesen({ ...input, sourceId: ref.sourceId })
    assert.ok(legacy.ok)
    const old = JSON.parse(legacy.canonical)
    const expected = { v: 3, ...ref, ...Object.fromEntries(Object.entries(old).filter(([key]) => !['v', 'sourceId'].includes(key))) }
    assert.equal(result.canonical, JSON.stringify(expected))
    assert.equal(result.key, `evidence-key:v3:${createHash('sha256').update(result.canonical).digest('hex')}`)
    const reordered = scope({ citizenship: { mode: 'required', countryCodes: ['rs', 'ch', 'CH'] } })
    assert.equal(unwrap(contentEvidenceLookupV3(Object.fromEntries(Object.entries(reordered).reverse()), ref)).key, result.key)
    assert.equal(unwrap(contentEvidenceLookupV3({ ...input, sourceId: ref.sourceId }, ref)).key, result.key)
  })
  test('source, item, representation and each regulatory cell dimension affect v3', () => {
    const original = unwrap(contentEvidenceLookupV3(scope(), repRef())).key
    for (const delta of [{ sourceId: 'other-authority' }, { contentItemId: 'publication-b' }, { representationId: 'api-en' }]) {
      assert.notEqual(unwrap(contentEvidenceLookupV3(scope(), { ...repRef(), ...delta })).key, original)
    }
    for (const delta of [{ destinationCountryCode: 'CA' }, { transitCountryCode: 'CA' },
      { citizenship: { mode: 'required', countryCodes: ['CH'] } },
      { credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: 'RS', relatedCitizenshipCountryCode: 'RS' } },
      { credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: null } },
      { residence: { mode: 'not_applicable' } }, { requirementType: 'passport_validity' },
      { validity: { mode: 'travel_date', travelDate: '2026-10-05' } }]) {
      assert.notEqual(unwrap(contentEvidenceLookupV3(scope(delta), repRef())).key, original)
    }
    assert.equal(unwrap(contentItemRefsEqual(itemRef(api()), itemRef(representation()))), true)
    assert.notEqual(unwrap(contentEvidenceLookupV3(scope(), repRef(api()))).key, original)
    rejected(contentEvidenceLookupV3({ ...scope(), sourceId: 'other-authority' }, repRef()), 'source_mismatch')
  })
  test('invalid scopes fail through the existing parser, including citizenship and credential invariants', () => {
    for (const input of [null, {}, scope({ travellerId: 'person' }), scope({ requirementType: 'invented' }),
      scope({ validity: { mode: 'travel_date', travelDate: '2026-02-30' } }),
      scope({ citizenship: { mode: 'required', countryCodes: ['CH', 'RS', 'CA', 'DE', 'FR', 'IT', 'JP', 'GB', 'US'] } }),
      scope({ credentialOption: { mode: 'option', documentType: 'passport', issuingCountryCode: 'CH', relatedCitizenshipCountryCode: 'US' } }),
      scope({ citizenship: { mode: 'required', countryCodes: ['CH'], extra: true } })]) {
      assert.equal(regelScopeAusEvidenceScope(input).ok, false)
      rejected(contentEvidenceLookupV3(input, repRef()), 'invalid_scope')
    }
  })
  test('ev2 has exact fixed-order material and independent SHA-256 proof', () => {
    const input = evidence(), result = unwrap(contentEvidenceVersionV2(input))
    assert.deepEqual(Object.keys(result.identity), ['identitySchema', 'sourceId', 'contentItemId', 'contentItemVersion',
      'representationId', 'representationVersion', 'identityProfileId', 'identityProfileVersion', 'lookupKey',
      'canonicalUrl', 'contentType', 'sourceContentHash', 'retrievedAt', 'validFrom', 'validUntil'])
    assert.equal(result.canonical, JSON.stringify(result.identity))
    assert.match(result.versionId, /^ev2_[a-f0-9]{32}$/)
    assert.equal(result.versionId, `ev2_${createHash('sha256').update(result.canonical).digest('hex').slice(0, 32)}`)
    assert.deepEqual(unwrap(contentEvidenceVersionV2(Object.fromEntries(Object.entries(input).reverse()))), result)
    unwrap(contentEvidenceVersionV2(evidence({ validFrom: null, validUntil: null })))
    unwrap(contentEvidenceVersionV2(evidence({ retrievedAt: '2024-02-29T12:59:59Z' })))
  })
  test('every bound field changes ev2, including both validity and all descriptor/profile versions', () => {
    const original = unwrap(contentEvidenceVersionV2(evidence())).versionId
    for (const delta of [{ sourceId: 'other-authority' }, { contentItemId: 'publication-b' }, { contentItemVersion: 2 },
      { representationId: 'api-en' }, { representationVersion: 2 }, { identityProfileId: 'other-profile' }, { identityProfileVersion: 2 },
      { lookupKey: `evidence-key:v3:${'b'.repeat(64)}` }, { canonicalUrl: 'https://gov.example/new' }, { contentType: 'application/json' },
      { sourceContentHash: 'b'.repeat(64) }, { retrievedAt: '2026-10-04T01:00:00Z' }, { validFrom: '2026-10-02' }, { validUntil: '2026-11-01' }]) {
      assert.notEqual(unwrap(contentEvidenceVersionV2(evidence(delta))).versionId, original, JSON.stringify(delta))
    }
  })
  test('malformed ev2 fields, dates, URL, key, metadata extras and old identity schema fail', () => {
    for (const delta of [{ identitySchema: 1 }, { sourceId: 'x' }, { contentItemId: '' }, { representationId: 'bad/id' },
      { contentItemVersion: 0 }, { representationVersion: 1.5 }, { identityProfileId: 'x' }, { identityProfileVersion: -1 },
      { lookupKey: `evidence-key:v2:${'a'.repeat(64)}` }, { lookupKey: 'evidence-key:v3:bad' },
      { sourceContentHash: 'A'.repeat(64) }, { canonicalUrl: 'http://gov.example/a' }, { canonicalUrl: 'https://gov.example/a#x' },
      { contentType: 'text/html; charset=utf-8' }, { retrievedAt: '2026-02-30T00:00:00Z' }, { retrievedAt: '2026-10-04T24:00:00Z' },
      { retrievedAt: '2026-10-04' }, { validFrom: '2026-02-29' }, { validUntil: 'invalid' }, { validUntil: '2026-09-01' },
      { validFrom: undefined }, { extractionNote: 'annotation' }, { lifecycle: 'accepted' }, { validationState: 'valid' },
      { previousVersionId: 'ev2_other' }]) {
      rejected(contentEvidenceVersionV2({ ...evidence(), ...delta }), 'invalid_evidence_identity')
    }
  })
})

describe('dormancy and architectural boundaries', () => {
  test('production profiles are exactly empty and frozen', () => {
    assert.deepEqual(OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY, [])
    assert.ok(Object.isFrozen(OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY))
    assert.throws(() => (OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY as ContentIdentityProfileDefinition[]).push(profile()), TypeError)
    assert.ok(Object.isFrozen(CONTENT_IDENTITY_LIMITS))
  })
  test('module has only reviewed pure imports, no real-source identifiers or effect authority', () => {
    const source = readFileSync(join(process.cwd(), 'lib/readiness/official-truth-content-identity.ts'), 'utf8')
    assert.doesNotMatch(source, /gov\.uk|\bCTA\b|home[-_ ]office|cabinet[-_ ]office/i)
    assert.doesNotMatch(source, /\bfetch\s*\(|\bprocess\s*\.|\bDate\s*\.\s*now\s*\(|\bnew\s+Date\s*\(|\beval\s*\(|\bnew\s+Function\b/)
    const imports = [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1])
    assert.deepEqual(imports, ['@/lib/readiness/digest', '@/lib/readiness/evidence', '@/lib/readiness/official',
      '@/lib/readiness/rule-claims', '@/lib/readiness/source-registry'])
    assert.match(source, /import \{ regelScopeAusEvidenceScope, type RegelScope \} from/)
    assert.match(source, /import \{ evidenceScopeLesen \} from/)
    assert.doesNotMatch(source, /supabase|node:|source-catalog|retrieval-server|store-server|KandidatAkzeptieren|\bF8\b/)
  })
  test('repository search pins the finite R2 production importers', () => {
    const root = process.cwd(), importers: string[] = []
    const walk = (dir: string): void => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.') || ['node_modules', 'dist', 'out'].includes(entry.name)) continue
        const path = join(dir, entry.name)
        if (entry.isDirectory()) walk(path)
        else if (/\.(?:[cm]?[jt]sx?)$/.test(entry.name) && !/\.test\.[^.]+$/.test(entry.name)
          && entry.name !== 'official-truth-content-identity.ts') {
          if (/['"][^'"]*official-truth-content-identity(?:\.ts)?['"]/.test(readFileSync(path, 'utf8'))) importers.push(relative(root, path))
        }
      }
    }
    walk(root)
    assert.deepEqual(importers.sort(), ['lib/readiness/evidence.ts',
      'lib/readiness/official-truth-accepted-evidence.ts',
      'lib/readiness/official-truth-composition-policy-registry.ts',
      'lib/readiness/official-truth-coverage.ts',
      'lib/readiness/official-truth-discovered-url-candidates.ts',
      'lib/readiness/official-truth-refresh-diff.ts',
      'lib/readiness/official-truth-retrieved-candidate-evidence.ts',
      'lib/readiness/official-truth-retrieved-material.ts',
      'lib/readiness/official-truth-rule-candidate.ts',
      'lib/readiness/official-truth-rule-review-decision-intent.ts',
      'lib/readiness/official-truth-rule-review-fingerprint.ts',
      'lib/readiness/official-truth-rule-review-packet.ts',
      'lib/readiness/official-truth-same-request-extraction-server.ts',
      'lib/readiness/official-truth-server-held-source-registry.ts',
      'lib/readiness/official-truth-server-owned-retrieval.ts',
      'lib/readiness/official-truth-source-catalog-server.ts',
      'lib/readiness/official-truth-trusted-fact-extractor-registry.ts',
      'lib/readiness/regulierungs-anwendbarkeit.ts',
      'lib/readiness/rule-claims.ts',
      'lib/readiness/source-registry.ts',
      'lib/readiness/source-router.ts'])
  })
})
