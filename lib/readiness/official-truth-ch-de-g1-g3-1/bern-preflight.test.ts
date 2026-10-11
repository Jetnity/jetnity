import assert from 'node:assert/strict'
import { test } from 'node:test'
import https from 'node:https'
import { createContentIdentityGraph, OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY } from '../official-truth-content-identity'
import { OFFICIAL_TRUTH_CH_DE_SOURCE_BUDGET_128K_1 as candidate, officialTruthChDeSourceBudget128k1 } from '../official-truth-ch-de-source-budget-128k-1'
import { quellenRegistryErstellen } from '../source-registry'

// Static/offline G3 preflight only. No local profile, live loader, HTTP client,
// opt-in capture runner, original bytes or accepted-source capability is created.
const item = { sourceId: candidate.sourceId, contentItemId: candidate.contentItemId,
  contentItemVersion: 1, current: true, externalIdNamespace: 'aa-url-document-id',
  externalContentId: '2611474', expectedPublisherIds: ['auswaertiges-amt'], expectedAuthorityIds: ['auswaertiges-amt'] }
const representation = { sourceId: candidate.sourceId, contentItemId: candidate.contentItemId,
  contentItemVersion: 1, representationId: candidate.representationId, representationVersion: 1,
  identityProfileId: candidate.identityProfileId, identityProfileVersion: 1, current: true,
  requestUrls: [candidate.requestUrl], expectedFinalUrl: candidate.requestUrl,
  expectedMediaType: 'text/html', expectedLocale: 'de', expectedSchema: null }

test('G3 exact Bern candidate is a research pin, not a compiled approved identity profile', () => {
  assert.equal(candidate.requestUrl, 'https://bern.diplo.de/ch-de/service/visumundeinreise/2611474-2611474')
  const url = new URL(candidate.requestUrl)
  assert.equal(url.protocol, 'https:'); assert.equal(url.hostname, 'bern.diplo.de')
  assert.equal(url.port, ''); assert.equal(url.search, ''); assert.equal(url.hash, '')
  assert.equal(url.username, ''); assert.equal(url.password, '')
  assert.equal(candidate.maxBytes, 131_072)
  assert.deepEqual(OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY.map(p => p.identityProfileId),
    ['govuk-eta-national-list-content-api-en'])
  assert.equal(OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY.some(p => p.current
    && p.identityProfileId === candidate.identityProfileId && p.identityProfileVersion === candidate.identityProfileVersion), false)
})
test('G3 current catalog validation blocks Bern before any origin request; no profile is injected', t => {
  const network = t.mock.method(https, 'request', () => { assert.fail('G3 capture is blocked') })
  const authority = quellenRegistryErstellen([{ sourceId: candidate.sourceId, sourceClass: 'official_authority',
    publisherName: 'German Embassy Bern research candidate', authorityName: 'Auswärtiges Amt', domains: ['bern.diplo.de'] }])
  assert.equal(authority.ok, true)
  if (!authority.ok) return
  // This descriptor is only proposed to the validator. It is never registered.
  const result = createContentIdentityGraph(authority.registry, [item], [representation])
  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.reason, 'profile_unavailable')
  assert.equal(network.mock.callCount(), 0)
})
test('G3 conditional 128KiB cannot be unlocked by borrowing the existing GOV.UK profile', () => {
  const profile = OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY[0]!
  assert.equal(officialTruthChDeSourceBudget128k1(candidate, item, representation,
    candidate.requestUrl, candidate.requestUrl, candidate.mediaType, profile), null)
  assert.ok(Object.isFrozen(profile))
  assert.ok(Object.isFrozen(OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY))
})
