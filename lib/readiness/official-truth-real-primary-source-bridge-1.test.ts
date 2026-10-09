import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { decideOfficialTruthServerOwnedRetrieval, type OfficialTruthServerOwnedRetrievalHttpClient } from './official-truth-server-owned-retrieval'
import { OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY } from './official-truth-content-identity'
import { OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY } from './official-truth-trusted-fact-extractor-registry'
import { requirementsProviderAus } from './provider'
import { nationalListResearchCatalog, verifyNationalListResearchText } from '../../scripts/official-truth-integrated-pilot-1/official-source'
import { FIXTURE_BODY, FIXTURE_TIME, nationalListFixture, nationalListStructuralFixture } from '../../scripts/official-truth-real-primary-source-bridge-1/fixtures'
import { checkNationalListWholeResponse, WHOLE_RESPONSE_CONTRACT } from '../../scripts/official-truth-real-primary-source-bridge-1/whole-response'
import { NATIONAL_LIST as N } from '../../scripts/official-truth-real-primary-source-bridge-1/manifest'
import { digest, locateNationality, qualifyNationalList } from '../../scripts/official-truth-real-primary-source-bridge-1/qualification'
import { evaluateResearchRetrieval, retrieveSyntheticNationalList, runOfflineFixture } from '../../scripts/official-truth-real-primary-source-bridge-1/bridge'
import { createGapResearch, observationAge, SYNTHETIC_SELECTION } from '../../scripts/official-truth-real-primary-source-bridge-1/research'
import { emptyReport, serializeReport, reportSchema } from '../../scripts/official-truth-real-primary-source-bridge-1/report'
import { main } from '../../scripts/official-truth-real-primary-source-bridge-1/run'

const json = () => JSON.stringify(nationalListFixture())
const set = (row: unknown, path: (string | number)[], value: unknown) => {
  let x = row as Record<string, unknown>
  for (const p of path.slice(0, -1)) x = x[p] as Record<string, unknown>
  x[path.at(-1)!] = value
}

describe('qualification 2 complete proposed structure, never privacy admission', () => {
  const check = (value: unknown, at = FIXTURE_TIME) => checkNationalListWholeResponse(JSON.stringify(value), at)
  test('minimal and full synthetic structures pass only STRUCTURE_ONLY', () => {
    for (const row of [nationalListFixture(), nationalListStructuralFixture()]) {
      assert.deepEqual(check(row), { ok: true, status: 'STRUCTURE_ONLY', contract: WHOLE_RESPONSE_CONTRACT })
      assert.deepEqual(qualifyNationalList(JSON.stringify(row), 'live', FIXTURE_TIME),
        { ok: false, stage: 'qualification', reason: 'whole_response_review_not_established' })
    }
    assert.equal(qualifyNationalList(JSON.stringify(nationalListStructuralFixture()), 'synthetic').ok, false)
  })
  // Traverse this explicitly synthetic fixture once to enumerate every field and
  // object family; mutate each independently, never derive test cases from live data.
  const objects: (string | number)[][] = [], fields: (string | number)[][] = []
  function walk(v: unknown, path: (string | number)[]) {
    if (!v || typeof v !== 'object') return
    if (Array.isArray(v)) { v.forEach((x, i) => walk(x, [...path, i])); return }
    objects.push(path)
    for (const [k, x] of Object.entries(v)) { fields.push([...path, k]); walk(x, [...path, k]) }
  }
  walk(nationalListStructuralFixture(), [])
  for (const path of objects) test(`unknown key at ${path.join('/') || 'root'} refuses without echo`, () => {
    const row = nationalListStructuralFixture()
    set(row, [...path, 'private-synthetic-key'], 'private-synthetic-value')
    const result = check(row)
    assert.equal(result.ok, false)
    assert.doesNotMatch(JSON.stringify(result), /private-synthetic/)
  })
  for (const path of fields) test(`wrong type at ${path.join('/')} refuses`, () => {
    const row = nationalListStructuralFixture(); set(row, path, 42)
    assert.equal(check(row).ok, false)
  })
  for (const key of Object.keys(nationalListFixture())) test(`missing root ${key} refuses`, () => {
    const row = { ...nationalListFixture() } as Record<string, unknown>; delete row[key]
    assert.equal(check(row).ok, false)
  })
  for (const value of ['opaque-synthetic-only', '', null, 42, false, {}, []]) test(`metadata case ${JSON.stringify(value)} never live admission`, async () => {
    const row = { ...nationalListStructuralFixture(), publishing_request_id: value }
    const raw = JSON.stringify(row)
    const r = evaluateResearchRetrieval(await retrieveSyntheticNationalList(raw), 'live', FIXTURE_TIME, SYNTHETIC_SELECTION)
    assert.equal(r.sourceStatus, 'BLOCKED'); assert.equal(r.research, null); assert.equal(r.observation, null)
    assert.doesNotMatch(serializeReport(r), /opaque-synthetic-only/)
    assert.ok(!serializeReport(r).includes(digest(raw)))
    assert.equal(r.reason, value === null ? 'whole_response_review_not_established'
      : typeof value === 'string' ? 'opaque_publishing_metadata' : 'invalid_response_field')
  })
  test('metadata cannot conceal malformed unused siblings', () => {
    const row = { ...nationalListStructuralFixture(), publishing_request_id: 'opaque-synthetic-only' }
    set(row, ['details', 'change_history', 0, 'unreviewed'], true)
    assert.deepEqual(check(row), { ok: false, reason: 'unexpected_response_fields' })
  })
  for (const [path, value, reason] of [
    [['details','attachments'], [{}], 'unreviewed_attachment'],
    [['publishing_scheduled_at'], FIXTURE_TIME, 'unreviewed_scheduling'],
    [['scheduled_publishing_delay_seconds'], 0, 'unreviewed_scheduling'],
    [['first_published_at'], '2026-02-30T00:00:00Z', 'invalid_response_field'],
    [['first_published_at'], '2026-10-10T00:00:00Z', 'source_time_conflict'],
    [['updated_at'], '2026-10-08T00:00:00Z', 'source_time_conflict'],
    [['updated_at'], '2026-10-10T00:00:00Z', 'source_time_conflict'],
    [['details','change_history',0,'public_timestamp'], '2026-10-10T00:00:00Z', 'source_time_conflict'],
    [['details','change_history',0,'public_timestamp'], '2026-10-08T00:00:00Z', 'source_time_conflict'],
    [['links','manual',0,'public_updated_at'], '2026-10-10T00:00:00Z', 'source_time_conflict'],
    [['links','organisations',0,'details','organisation_govuk_status','updated_at'], '2026-10-10T00:00:00Z', 'source_time_conflict'],
  ] as [ (string | number)[], unknown, string ][]) test(`finite refusal ${path.join('/')} ${reason} ${String(value)}`, () => {
    const row = nationalListStructuralFixture(); set(row, path, value)
    assert.deepEqual(check(row), { ok: false, reason })
  })
  for (const time of ['2026-02-30T00:00:00Z', '2026-10-09', '2026-10-09T12:00:00',
    '2026-10-09T12:00:60Z', '2026-10-09T12:00:00-00:00', '2026-10-09T12:00:00+24:00']) test(`ambiguous source timestamp ${time} refuses`, () => {
    assert.equal(check({ ...nationalListFixture(), first_published_at: time }).ok, false)
  })
  test('equivalent explicit offset is calendar-checked without mutating source time', () => {
    const row = { ...nationalListFixture(), first_published_at: '2026-10-09T13:00:00+01:00' }
    assert.equal(check(row).ok, true)
    assert.equal(row.first_published_at, '2026-10-09T13:00:00+01:00')
    assert.deepEqual(check(row, 'invalid'), { ok: false, reason: 'invalid_reference_time' })
  })
  for (const url of ['https://evil.invalid/image.png', 'http://assets.publishing.service.gov.uk/image.png',
    'https://assets.publishing.service.gov.uk:443/image.png', 'https://assets.publishing.service.gov.uk/image.png?trace=x',
    'https://assets.publishing.service.gov.uk/image.png#fragment', 'https://assets.publishing.service.gov.uk/media/../image.png',
    'https://assets.publishing.service.gov.uk/%2e%2e/image.png']) test(`unsafe unused asset URL refuses ${url}`, () => {
    const row = nationalListStructuralFixture()
    set(row, ['links','organisations',0,'details','default_news_image','url'], url)
    assert.equal(check(row).ok, false)
  })
  for (const body of [FIXTURE_BODY + '<script>private-synthetic-value</script>', FIXTURE_BODY + '</undefined>',
    FIXTURE_BODY.replace('Switzerland', '&#83;witzerland'), FIXTURE_BODY.replace('Switzerland', 'Swi\u202etz'),
    FIXTURE_BODY.replace('<li>', '<li onclick="x">'), FIXTURE_BODY + '<!--tail-->', FIXTURE_BODY.slice(0,-1),
    FIXTURE_BODY.replace('Switzerland', '&lt;script&gt;'), FIXTURE_BODY + 'trailing text']) test(`unsafe fragment variant ${body.length}`, () => {
    const row = nationalListFixture(); row.details.body = body
    assert.equal(check(row).ok, false)
    assert.equal(qualifyNationalList(JSON.stringify(row), 'synthetic').ok, false)
  })
  for (const key of ['__proto__', 'constructor', 'prototype', '\\u005f_proto__']) test(`prototype ambiguity ${key}`, () => {
    const raw = json().replace('"change_history":[]', `"change_history":[{"${key}":{}}]`)
    assert.equal(checkNationalListWholeResponse(raw, FIXTURE_TIME).ok, false)
  })
  test('duplicate spellings in unused deep objects, prefixes and trailing JSON refuse', () => {
    const raw = JSON.stringify(nationalListStructuralFixture())
    for (const bad of [raw.replace('"crest":', '"\\u0063rest":"duplicate","crest":'), '\ufeff' + raw,
      raw + '{}', raw.slice(0,-1), raw.replace('Synthetic change only', '\\ud800'),
      raw.replace('"publishing_request_id":null', '"publishing_request_id":null,"publishing_request_id":null')]) {
      assert.equal(checkNationalListWholeResponse(bad, FIXTURE_TIME).ok, false)
    }
    assert.equal(checkNationalListWholeResponse(json().padEnd(65_536), FIXTURE_TIME).ok, true)
    assert.equal(checkNationalListWholeResponse(json().padEnd(65_537), FIXTURE_TIME).ok, false)
  })
  test('replayed or transplanted bytes never create live research or custody', async () => {
    const retrieval = await retrieveSyntheticNationalList()
    for (const at of [FIXTURE_TIME, '2026-10-11T12:00:00.000Z', '2026-10-08T12:00:00.000Z']) {
      const r = evaluateResearchRetrieval(retrieval, 'live', at, SYNTHETIC_SELECTION)
      assert.equal(r.sourceStatus, 'BLOCKED'); assert.equal(r.research, null); assert.equal(r.observation, null)
      assert.equal(r.provenanceAuthority, 'NO_CUSTODY_OR_ACCEPTANCE_ORIGIN')
    }
  })
})

describe('B02/B10/B12/B18 research-only end-to-end', () => {
  test('B09 upstream refusal cannot create research even with a complete selection', async () => {
    for (const retrieval of [await retrieveSyntheticNationalList(), { status: 'blocked' as const, reason: 'timeout' as const }]) {
      const r = evaluateResearchRetrieval(retrieval, 'live', FIXTURE_TIME, SYNTHETIC_SELECTION)
      assert.equal(r.sourceStatus, 'BLOCKED')
      assert.equal(r.research, null)
      assert.equal(r.observation, null)
    }
  })
  test('B07 serializer refuses research attached to an upstream-blocked report', async () => {
    const candidate = (await runOfflineFixture()).research
    const blocked = evaluateResearchRetrieval(await retrieveSyntheticNationalList(), 'live', FIXTURE_TIME, null)
    assert.throws(() => serializeReport({ ...blocked, research: candidate }), /report_state_invalid/)
  })
  test('offline fixed source passes genuine catalog/identity/whole-fixture/locator and canonical research gap', async () => {
    const r = await runOfflineFixture()
    assert.equal(r.mode, 'synthetic'); assert.equal(r.sourceStatus, 'SYNTHETIC_OBSERVATION_ONLY')
    assert.equal(r.regulatoryStatus, 'BLOCKED'); assert.equal(r.reason, 'legal_predicate_unproved')
    assert.equal(r.observation?.literalResponseSha256, digest(json()))
    assert.equal(r.observation?.locator.quote, 'Switzerland')
    const loc = r.observation!.locator
    assert.equal(FIXTURE_BODY.slice(loc.start, loc.end), 'Switzerland')
    assert.equal(Buffer.from(FIXTURE_BODY).subarray(loc.byteStart, loc.byteEnd).toString(), 'Switzerland')
    assert.equal(r.observation?.legalValidFrom, null); assert.equal(r.observation?.legalValidUntil, null)
    assert.equal(r.observation?.officialActionUrl, null); assert.equal(r.research?.proposal, null)
    assert.deepEqual(r.research?.supportVersionIds, [])
    assert.equal(r.research?.lifecycle, 'candidate'); assert.equal(r.research?.validationState, 'pending')
    assert.equal(r.provenanceAuthority, 'NO_CUSTODY_OR_ACCEPTANCE_ORIGIN')
    assert.deepEqual(JSON.parse(serializeReport(r)), r)
    assert.deepEqual(await runOfflineFixture(), r)
  })
  test('synthetic bytes can never become qualified live data, including when opaque field is null', async () => {
    const r = evaluateResearchRetrieval(await retrieveSyntheticNationalList(), 'live', FIXTURE_TIME, null)
    assert.equal(r.reason, 'whole_response_review_not_established'); assert.equal(r.observation, null)
    assert.equal(r.research, null); assert.equal(r.sourceStatus, 'BLOCKED')
    const fake = { ...await runOfflineFixture(), mode: 'live' as const }
    assert.throws(() => serializeReport(fake), /report_state_invalid/)
  })
  test('literal digest retains CRLF/whitespace independently of canonical normalized fingerprint', async () => {
    const raw = JSON.stringify(nationalListFixture(), null, 1).replaceAll('\n', '\r\n')
    const r = evaluateResearchRetrieval(await retrieveSyntheticNationalList(raw), 'synthetic', FIXTURE_TIME, null)
    assert.equal(r.observation?.literalResponseSha256, digest(raw))
    assert.notEqual(r.observation?.literalResponseSha256, r.observation?.normalizedSourceContentHash)
    assert.equal(r.reason, 'scope_not_selected')
  })
  test('source drift does not fabricate agreement, effectiveness or a not_required result', async () => {
    const r = await runOfflineFixture()
    assert.equal(r.conflictAssessment, 'NOT_ASSESSED_SINGLE_SOURCE')
    assert.ok(r.gaps.includes('appendix_exceptions_unexamined'))
    assert.ok(r.gaps.includes('travel_effective_period_unproved'))
    assert.doesNotMatch(serializeReport(r), /"(?:required|not_required|visaMode|accepted|custodyHandle)"/)
  })
})

describe('B03-B06/B09/B21 independent full-response mutations', () => {
  const mutations: [string, (string | number)[], unknown][] = [
    ['wrong item', ['content_id'], '2620750b-5453-44f1-98af-414037c833be'],
    ['wrong base', ['base_path'], '/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation'],
    ['locale', ['locale'], 'cy'], ['schema', ['schema_name'], 'guide'], ['publisher app', ['publishing_app'], 'publisher'],
    ['authority', ['links','organisations',0,'content_id'], N.manualId],
    ['publisher', ['links','primary_publishing_organisation',0,'content_id'], N.manualId],
    ['manual revision relation', ['links','manual',0,'content_id'], N.contentId],
    ['translation item', ['links','available_translations',0,'content_id'], N.manualId],
    ['withdrawal', ['withdrawn_notice'], { reason: 'synthetic' }],
    ['impossible timestamp', ['public_updated_at'], '2026-02-30T00:00:00Z'],
    ['unknown root', ['unused_private'], 'private-sentinel'],
    ['unknown nested metadata', ['details','change_history'], [{ opaque: 'private-sentinel' }]],
    ['unused attachment', ['details','attachments'], [{ url: 'https://private.invalid/sentinel' }]],
    ['unused display', ['details','organisations'], [{ name: 'private-sentinel' }]],
    ['changed body', ['details','body'], FIXTURE_BODY.replace('Switzerland', 'Other')],
    ['extra body', ['details','body'], FIXTURE_BODY + '<p>Additional condition</p>'],
    ['empty body', ['details','body'], ''], ['title', ['title'], 'private-sentinel'],
    ['first published', ['first_published_at'], '2026-10-08T00:00:00.000Z'],
    ['publishing scheduled', ['publishing_scheduled_at'], 'private-sentinel'],
    ['delay', ['scheduled_publishing_delay_seconds'], 123],
  ]
  for (const [name, path, value] of mutations) test(name, async () => {
    const row = nationalListFixture(); set(row, path, value)
    const r = evaluateResearchRetrieval(await retrieveSyntheticNationalList(JSON.stringify(row)), 'synthetic', FIXTURE_TIME, null)
    assert.equal(r.sourceStatus, 'BLOCKED'); assert.equal(r.observation, null)
    assert.doesNotMatch(serializeReport(r), /private-sentinel|private\.invalid|Additional condition/)
  })
  test('coherently replaced real sibling item fails despite identical government and publisher', async () => {
    const row = nationalListFixture(), path = '/guidance/immigration-rules/immigration-rules-appendix-electronic-travel-authorisation'
    Object.assign(row, { content_id: '2620750b-5453-44f1-98af-414037c833be', base_path: path })
    const self = row.links.available_translations[0]!
    Object.assign(self, { content_id: row.content_id, base_path: path, api_path: '/api/content' + path,
      api_url: 'https://www.gov.uk/api/content' + path, web_url: 'https://www.gov.uk' + path })
    assert.deepEqual(await retrieveSyntheticNationalList(JSON.stringify(row)), { status: 'blocked', reason: 'content_identity_mismatch' })
  })
  for (const [name, change] of [
    ['root duplicate', (s: string) => s.replace('{', '{"locale":"en",')],
    ['escaped duplicate', (s: string) => s.replace('{', '{"\\u006cocale":"en",')],
    ['nested duplicate', (s: string) => s.replace('"attachments":[]', '"attachments":[],"attachments":[]')],
    ['nested unused duplicate', (s: string) => s.replace('"change_history":[]', '"change_history":[{"x":1,"x":2}]')],
    ['truncated', (s: string) => s.slice(0,-1)], ['trailing', (s: string) => s + '{}'],
    ['lone surrogate', (s: string) => s.replace('Synthetic National List fixture', '\\ud800')],
  ] as const) test(name, () => assert.equal(qualifyNationalList(change(json()), 'synthetic').ok, false))
  test('opaque publishing field refuses every value except null; never emits, hashes or strips it', async () => {
    for (const value of ['private-opaque-sentinel', '', 0, false, {}, []]) {
      const row = { ...nationalListFixture(), publishing_request_id: value }
      const text = JSON.stringify(row), r = evaluateResearchRetrieval(await retrieveSyntheticNationalList(text), 'synthetic', FIXTURE_TIME, null)
      assert.equal(r.reason, typeof value === 'string' ? 'opaque_publishing_metadata' : 'invalid_response_field'); assert.equal(r.observation, null)
      assert.ok(!serializeReport(r).includes('private-opaque-sentinel')); assert.ok(!serializeReport(r).includes(digest(text)))
    }
  })
  test('identity does not imply qualification for unused arbitrary fields', () => {
    const row = nationalListFixture(); set(row, ['details','attachments'], [{ sensitive: 'synthetic-sentinel' }])
    assert.equal(verifyNationalListResearchText(JSON.stringify(row)).ok, true)
    assert.equal(qualifyNationalList(JSON.stringify(row), 'synthetic').ok, false)
  })
})

describe('B07/B08 transport through unchanged retrieval', () => {
  async function transport(options: { bytes?: readonly Uint8Array[]; length?: string; type?: string; url?: string;
    input?: unknown; status?: number; location?: string; address?: string; http?: OfficialTruthServerOwnedRetrievalHttpClient } = {}) {
    let cancelled = 0, called = 0
    const r = await decideOfficialTruthServerOwnedRetrieval(options.input ?? { sourceId: N.sourceId, url: options.url ?? N.requestUrl }, {
      catalog: nationalListResearchCatalog().catalog, now: () => new Date(FIXTURE_TIME),
      resolve: async () => [{ address: options.address ?? '93.184.216.34', family: 4 }],
      http: options.http ?? (async ({ lookup }) => {
        called++
        try { await new Promise<void>((resolve, reject) => lookup('www.gov.uk', {}, e => e ? reject(e) : resolve())) }
        catch { return { ok: false, reason: 'address_not_permitted' } }
        return { ok: true, status: options.status ?? 200, cancel: () => { cancelled++ },
          headers: { get: name => name === 'content-type' ? options.type ?? 'application/json' : name === 'content-length' ? options.length ?? null : name === 'location' ? options.location ?? null : null },
          body: (async function* () { for (const bytes of options.bytes ?? [Buffer.from(json())]) yield bytes })() }
      }),
    })
    return { r, cancelled, called }
  }
  test('exact maximum accepts complete bytes; +1 rejects with and without declared length', async () => {
    const exact = json().padEnd(65_536, ' ')
    assert.equal((await transport({ bytes: [Buffer.from(exact)] })).r.status, 'server_owned_official_retrieval')
    for (const options of [{ length: '65537' }, { bytes: [Buffer.from(exact), Buffer.from(' ')] }]) {
      const { r, cancelled } = await transport(options)
      assert.deepEqual(r, { status: 'blocked', reason: 'response_too_large' }); assert.ok(cancelled > 0)
    }
  })
  for (const [name, options, reason] of [
    ['invalid UTF8', { bytes: [Buffer.from([0xc3, 0x28])] }, 'invalid_utf8'],
    ['truncated UTF8', { bytes: [Buffer.from([0xe2, 0x82])] }, 'invalid_utf8'],
    ['empty', { bytes: [] }, 'empty_body'], ['media', { type: 'text/html' }, 'content_type_mismatch'],
    ['private DNS', { address: '127.0.0.1' }, 'address_not_permitted'],
    ['HTTP failure', { status: 503 }, 'http_status'],
    ['sibling redirect', { status: 302, location: N.requestUrl.replace('eta-national-list','electronic-travel-authorisation') }, 'representation_url_mismatch'],
    ['off-host redirect', { status: 302, location: 'https://untrusted.invalid/page' }, 'unregistered_domain'],
    ['loop', { status: 302, location: N.requestUrl }, 'redirect_loop'],
  ] as const) test(name, async () => assert.deepEqual((await transport(options)).r, { status: 'blocked', reason }))
  for (const url of [N.requestUrl + '?x=1', N.requestUrl + '/', N.publicUrl, N.requestUrl.replace('https:', 'http:'),
    N.requestUrl.replace('www.gov.uk', 'www.gov.uk:444'), 'https://127.0.0.1/page']) test('unapproved URL fails before HTTP: ' + url, async () => {
    const { r, called } = await transport({ url }); assert.equal(r.status, 'blocked'); assert.equal(called, 0)
  })
  test('caller cannot supply registry or body authority', async () => {
    for (const field of ['registry','identityProfiles','sourceSnapshot','retrievedAt','passportNumber']) {
      const { r, called } = await transport({ input: { sourceId: N.sourceId, url: N.requestUrl, [field]: 'private-sentinel' } })
      assert.equal(r.status, 'blocked'); assert.equal(called, 0); assert.ok(!JSON.stringify(r).includes('private-sentinel'))
    }
  })
})

describe('B13-B17 explicit scope and time', () => {
  test('missing selection stays missing; every required key matters', () => {
    assert.deepEqual(createGapResearch(null), { ok: false, reason: 'scope_not_selected' })
    for (const key of Object.keys(SYNTHETIC_SELECTION)) {
      const s = { ...SYNTHETIC_SELECTION } as Record<string, unknown>; delete s[key]
      assert.equal(createGapResearch(s).ok, false)
    }
  })
  for (const change of [{ citizenship: 'FR' }, { documentClass: 'identity_card' }, { destination: 'FR' },
    { travelDate: null }, { travelDate: '2026-02-30' }, { passportNumber: 'private-sentinel' },
    { citizenship: ['CH','FR'] }, { issuingCountry: 'not-a-country' }]) test('invalid/unsupported intent refuses without default', () => {
    const r = createGapResearch({ ...SYNTHETIC_SELECTION, ...change }); assert.equal(r.ok, false)
    assert.ok(!JSON.stringify(r).includes('private-sentinel'))
  })
  test('issuer, residence, related citizenship, transit and dates remain independent', () => {
    const initial = createGapResearch(SYNTHETIC_SELECTION); assert.ok(initial.ok)
    for (const change of [{ issuingCountry: 'FR' }, { residenceCountry: 'FR' }, { relatedCitizenship: null },
      { transitCountry: 'FR' }, { travelDate: '2026-10-11' }]) {
      const r = createGapResearch({ ...SYNTHETIC_SELECTION, ...change }); assert.ok(r.ok)
      assert.notEqual(r.candidate.key, initial.candidate.key)
      assert.deepEqual(r.candidate.scope.citizenship, { mode: 'required', countryCodes: ['CH'] })
      assert.equal(r.candidate.proposal, null); assert.equal(r.documentSubclassProven, false)
    }
  })
  test('freshness uses retrieval age, never publication or travel validity', async () => {
    const r = evaluateResearchRetrieval(await retrieveSyntheticNationalList(), 'synthetic', '2026-10-11T12:00:00.000Z', SYNTHETIC_SELECTION)
    assert.equal(r.observationQuality, 'stale_primary_evidence'); assert.equal(r.reason, 'stale_primary_evidence')
    assert.equal(r.regulatoryStatus, 'BLOCKED'); assert.equal(r.observation?.legalValidFrom, null)
    assert.equal(observationAge(FIXTURE_TIME, '2026-10-10T12:00:00.000Z'), 'research_gap')
    assert.equal(observationAge(FIXTURE_TIME, '2026-10-10T12:00:00.001Z'), 'stale_primary_evidence')
    assert.equal(observationAge(FIXTURE_TIME, '2026-10-08T12:00:00.000Z'), 'invalid_reference_time')
  })
})

describe('B12 complete locator grammar', () => {
  test('unmatched closing tags cannot impersonate an empty parser stack', () => {
    for (const tag of ['</undefined>', '</p>', '</li>', '</div>']) {
      assert.equal(locateNationality(tag + FIXTURE_BODY), null)
      assert.equal(locateNationality(FIXTURE_BODY + tag), null)
    }
  })
  for (const body of [FIXTURE_BODY + FIXTURE_BODY, FIXTURE_BODY.replace('Switzerland','Swiss'),
    FIXTURE_BODY.replace('<li>Switzerland','<li><br>Switzerland'), FIXTURE_BODY.replace('<li>','<li title="x">'),
    FIXTURE_BODY.replace('Switzerland','not Switzerland'), FIXTURE_BODY.replace('Switzerland','&#83;witzerland'),
    FIXTURE_BODY + '<script>Switzerland</script>', FIXTURE_BODY + 'hidden tail', FIXTURE_BODY.slice(0,-1),
    '<p>Switzerland</p>', '<li>Switzerland</li>']) test('ambiguous/changed/missing complete structure refuses', () => assert.equal(locateNationality(body), null))
  test('UTF8 byte offsets remain distinct from code units', () => {
    const body = FIXTURE_BODY.replace('Synthetic', 'Ä synthetic'), loc = locateNationality(body)
    assert.ok(loc); assert.notEqual(loc.start, loc.byteStart)
    assert.equal(Buffer.from(body).subarray(loc.byteStart, loc.byteEnd).toString(), 'Switzerland')
  })
})

describe('B19/B22/B23 CLI and isolation', () => {
  test('no opt-in means not_run; unknown arguments never echo their values', async () => {
    assert.equal((await main([])).report.sourceStatus, 'NOT_RUN')
    for (const args of [['--url','https://private.invalid'], ['--live-official','private-sentinel'], ['--unknown']]) {
      const result = await main(args); assert.equal(result.exitCode, 2)
      assert.doesNotMatch(serializeReport(result.report), /private-sentinel|private\.invalid/)
    }
    assert.equal((await main(['--offline-fixture'])).exitCode, 0)
  })
  test('closed report refuses extra fields and invalid state', async () => {
    assert.equal(reportSchema.safeParse({ ...emptyReport(), rawBody: 'private-sentinel' }).success, false)
    const r = await runOfflineFixture(); assert.throws(() => serializeReport({ ...r, observation: null }))
  })
  test('untrusted retrieval changes cannot transplant bytes, URLs, source identity or hash', async () => {
    const r = await retrieveSyntheticNationalList(); assert.equal(r.status, 'server_owned_official_retrieval')
    if (r.status !== 'server_owned_official_retrieval') throw Error('fixture')
    for (const change of [{ sourceContentHash: '0'.repeat(64) }, { requestUrl: N.publicUrl }, { canonicalUrl: N.publicUrl },
      { sourceId: 'other' }, { representationVersion: 2 }, { sourceSnapshot: json() + '{}' }]) {
      const result = evaluateResearchRetrieval({ ...r, ...change }, 'synthetic', FIXTURE_TIME, null)
      assert.equal(result.sourceStatus, 'BLOCKED'); assert.equal(result.observation, null)
    }
  })
  test('original source evidence and immutable TASK unchanged, dormant registries intact', () => {
    const old = 'docs/evidence/official-truth-integrated-pilot-1/official-source.json'
    assert.equal(execFileSync('git', ['hash-object', old], { encoding: 'utf8' }).trim(), 'd7fc909c13dfae94bbac33c1d15942266bb2fcbf')
    assert.equal(JSON.parse(readFileSync(old, 'utf8')).realOfficialSourcePilot, 'BLOCKED')
    assert.equal(execFileSync('git', ['hash-object', 'docs/OFFICIAL_TRUTH_REAL_PRIMARY_SOURCE_BRIDGE_1_TASK_2026-10-09.md'], { encoding: 'utf8' }).trim(), 'a8c51c72c29d523c77786bae2d810a61ff8c9814')
    assert.deepEqual(OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY, []); assert.equal(requirementsProviderAus(), null)
    assert.equal(OFFICIAL_TRUTH_CONTENT_IDENTITY_PROFILE_REGISTRY.length, 1)
  })
  test('task runner is not imported by any application module', () => {
    function visit(dir: string) {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name)
        if (entry.isDirectory()) visit(path)
        else if (/\.[jt]sx?$/.test(path) && !path.endsWith('.test.ts')) assert.doesNotMatch(readFileSync(path, 'utf8'), /from\s+['"][^'"]*official-truth-real-primary-source-bridge-1\//)
      }
    }
    for (const dir of ['app','components','lib']) visit(dir)
  })
})
