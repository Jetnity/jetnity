import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import { OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY } from './official-truth-content-identity'
import { PASSPORT_GUIDE, PASSPORT_IDENTITY_PROFILE, readPassportGuide, qualifyPassportWholeResponse,
  extractQualifiedPassportObservation, passportFactFromQualifiedChapter } from '../../scripts/official-truth-integrated-pilot-1/official-source-profile'
import { REVIEWED_PASSPORT_COMPONENTS } from '../../scripts/official-truth-integrated-pilot-1/official-source-reviewed'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const shape = () => Object.fromEntries([...Object.keys(REVIEWED_PASSPORT_COMPONENTS), 'publishing_request_id'].map(k => [k, null]))

test('passport response grammar rejects duplicate/unknown fields, malformed bytes and nesting/size before qualification', () => {
  const goodShape = JSON.stringify(shape())
  assert.ok(readPassportGuide(goodShape))
  for (const text of [null, '{}', goodShape.slice(0, -1) + ',"publishing_request_id":null}',
    goodShape.slice(0, -1) + ',"unused_personal_data":"hidden"}', goodShape + '\n',
    JSON.stringify({ ...shape(), details: 'x'.repeat(131_072) }), '{"details":' + '['.repeat(17) + '0' + ']'.repeat(17) + '}']) {
    assert.equal(readPassportGuide(text), null)
  }
})
test('whole-response gate rejects opaque publishing metadata and never echoes it or mints origin', () => {
  const secret = 'private-opaque-publishing-context'
  const response = JSON.stringify({ ...shape(), publishing_request_id: secret })
  const result = qualifyPassportWholeResponse(response)
  assert.deepEqual(result, { ok: false, reason: 'opaque_publishing_metadata' })
  assert.equal(JSON.stringify(result).includes(secret), false)
  assert.deepEqual(qualifyPassportWholeResponse(JSON.stringify(shape())), { ok: false, reason: 'unreviewed_public_component' })
  assert.equal(extractQualifiedPassportObservation({ sourceSnapshot: response, qualification: 'govuk-passport-whole-response-v1' }), null)
})
test('passport semantic helper is a narrow dimension proposal, refuses changed/ambiguous/missing locator', () => {
  const chapter = '<h2 id="youre-from-the-eu-switzerland-norway-iceland-or-liechtenstein">Swiss scope</h2><ul><li>a passport</li></ul><p>Your identity document should be valid for the whole of your stay.</p><h2 id="next">Next</h2>'
  assert.deepEqual(passportFactFromQualifiedChapter(chapter), { kind: 'passport_validity', semantics: 'valid_through_stay', duration: null })
  for (const text of [chapter.replace('whole of your stay', 'next day'), chapter + chapter, chapter.replace('<li>a passport</li>', ''), '']) {
    assert.equal(passportFactFromQualifiedChapter(text), null)
  }
})
test('passport profile is isolated, exact guide identity; never the National List profile', () => {
  assert.equal(OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY.some(p => p.identityProfileId === PASSPORT_GUIDE.profileId), false)
  assert.notEqual(PASSPORT_IDENTITY_PROFILE.identityProfileId, 'govuk-eta-national-list-content-api-en')
  assert.equal(PASSPORT_GUIDE.requestUrl, 'https://www.gov.uk/api/content/uk-border-control/before-you-leave-for-the-uk')
  assert.equal(PASSPORT_GUIDE.finalUrl, 'https://www.gov.uk/api/content/uk-border-control')
})
test('isolated real-network seam has one exact developer caller and keeps canonical network controls', () => {
  const name = 'retrieveOfficialTruthIsolatedPilotSource'
  const found: string[] = []
  function walk(path: string) {
    for (const e of readdirSync(path, { withFileTypes: true })) {
      const file = join(path, e.name)
      if (e.isDirectory()) walk(file)
      else if (e.name.endsWith('.ts') && !e.name.endsWith('.test.ts') && readFileSync(file, 'utf8').includes(name)) found.push(relative(root, file))
    }
  }
  for (const area of ['app', 'components', 'lib', 'scripts']) walk(join(root, area))
  assert.deepEqual(found.sort(), ['lib/readiness/official-truth-server-owned-retrieval.ts', 'scripts/official-truth-ch-de-compact-primary-source-1/source-probe.ts', 'scripts/official-truth-ch-de-first-visa-vertical-1/source-probe.ts', 'scripts/official-truth-integrated-pilot-1/official-source.ts'])
  const source = readFileSync(join(root, 'lib/readiness/official-truth-server-owned-retrieval.ts'), 'utf8').split(`export async function ${name}`)[1]!
  assert.match(source, /catalog, now: serverUhr, resolve: serverDns, http: serverHttp/)
})
