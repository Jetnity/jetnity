import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { readFileSync, readdirSync } from 'node:fs'
import type { ClientRequest, IncomingMessage } from 'node:http'
import https from 'node:https'
import { Resolver } from 'node:dns/promises'
import { join } from 'node:path'
import { test, type TestContext } from 'node:test'
import { sha256Hex } from '@/lib/readiness/digest'
import { bindAtOfficialRetrieval, atOfficialMediaType, type AtRetrievalInput } from './bind'
import { admitAtImportCandidate, buildAtImportCandidate, AT_CUSTOMER_STATEMENT, AT_IMPORT_DISPOSITION } from './import-adapter'
import {
  AT_OFFICIAL_MAXIMUM_BYTES,
  AT_OFFICIAL_PUBLICATIONS,
  AT_SOURCE_LANE_FORBIDDEN_PREFIXES,
  AT_SOURCE_LANE_ROOT,
  atSourceLanePathForbidden,
  type AtOfficialPublication,
} from './publications'
import { atOfficialAddressAllowed, readAtOfficialPackage, readAtOfficialPublicationHttps } from './transport'

const STARTED = '2026-11-16T19:50:00.000Z'
const RETRIEVED = '2026-11-16T19:50:01.000Z'

function htmlFor(publication: AtOfficialPublication, body = ''): string {
  const canonical = publication.id === 'bmeia-bern-how-to-apply'
    ? `<link rel="canonical" href="${publication.url.slice(0, -1)}">`
    : ''
  const stand = publication.id === 'bmi-visa-nationality-matrix' ? '<p>(Stand: 6.11.2026)</p>' : ''
  return `<!doctype html><html><head><title>\n\t${publication.expectedTitle}\n</title>${canonical}</head><body><p>${publication.hostname}</p>${stand}${body}</body></html>`
}

function retrieval(publication: AtOfficialPublication, html = htmlFor(publication), patch: Partial<AtRetrievalInput> = {}): AtRetrievalInput {
  return {
    publicationId: publication.id,
    requestUrl: publication.url,
    finalUrl: publication.url,
    redirectCount: 0,
    httpStatus: 200,
    contentType: 'text/html; charset=utf-8',
    body: new TextEncoder().encode(html),
    startedAt: STARTED,
    retrievedAt: RETRIEVED,
    lastModifiedHeader: 'Mon, 16 Nov 2026 19:49:32 GMT',
    ...patch,
  }
}

test('media type accepts html and an optional utf-8 charset only', () => {
  assert.equal(atOfficialMediaType('text/html'), 'text/html')
  assert.equal(atOfficialMediaType('text/html; charset=UTF-8'), 'text/html')
  assert.equal(atOfficialMediaType('text/html; charset=utf-16'), null)
  assert.equal(atOfficialMediaType('text/plain'), null)
  assert.equal(atOfficialMediaType(null), null)
})

test('pinned pages bind by title and transport identity without a legal version', () => {
  for (const publication of AT_OFFICIAL_PUBLICATIONS) {
    const html = htmlFor(publication)
    const bound = bindAtOfficialRetrieval(retrieval(publication, html))
    assert.equal(bound.status, 'bound')
    if (bound.status !== 'bound') continue
    assert.equal(bound.sha256, sha256Hex(html))
    assert.equal(bound.title, publication.expectedTitle)
    assert.equal(bound.legalClassification, 'not_performed')
    assert.equal(bound.byteOrderMark, false)
    assert.equal(bound.lastModifiedIsVersionPin, false)
    assert.equal(bound.versionObservation.approvedVersion, null)
    assert.equal('body' in bound, false)
    if (publication.id === 'bmi-visa-nationality-matrix') {
      assert.equal(bound.versionObservation.status, 'single_observed_token')
      assert.equal(bound.versionObservation.token, '6.11.2026')
    } else {
      assert.equal(bound.versionObservation.status, 'absent')
    }
  }
})

function rejectedReason(result: ReturnType<typeof bindAtOfficialRetrieval>): string {
  assert.equal(result.status, 'rejected')
  return result.status === 'rejected' ? result.reason : 'bound'
}

test('identity, version and transport failures stay rejected', () => {
  const matrix = AT_OFFICIAL_PUBLICATIONS[0]!
  const changed = htmlFor(matrix).replace(matrix.expectedTitle, 'Andere Seite')
  assert.equal(bindAtOfficialRetrieval(retrieval(matrix, changed)).status, 'rejected')
  const twoStands = htmlFor(matrix, '<p>(Stand: 15.7.2026)</p>')
  const ambiguous = bindAtOfficialRetrieval(retrieval(matrix, twoStands))
  assert.equal(ambiguous.status, 'bound')
  if (ambiguous.status === 'bound') assert.equal(ambiguous.versionObservation.status, 'ambiguous')
  assert.equal(rejectedReason(bindAtOfficialRetrieval(retrieval(matrix, htmlFor(matrix), { redirectCount: 1 }))), 'redirect_refused')
  assert.equal(rejectedReason(bindAtOfficialRetrieval(retrieval(matrix, htmlFor(matrix), { finalUrl: 'https://example.test/' }))), 'url_mismatch')
  assert.equal(rejectedReason(bindAtOfficialRetrieval(retrieval(matrix, htmlFor(matrix), { contentType: 'text/plain' }))), 'content_type')
  assert.equal(rejectedReason(bindAtOfficialRetrieval(retrieval(matrix, htmlFor(matrix), { body: new Uint8Array([0xff, 0xfe]) }))), 'invalid_utf8')
  const marked = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode(htmlFor(matrix))])
  const withMark = bindAtOfficialRetrieval(retrieval(matrix, htmlFor(matrix), { body: marked }))
  assert.equal(withMark.status, 'bound')
  if (withMark.status === 'bound') {
    assert.equal(withMark.byteOrderMark, true)
    assert.equal(withMark.sha256, sha256Hex(`\uFEFF${htmlFor(matrix)}`))
    assert.equal(withMark.versionObservation.token, '6.11.2026')
    assert.equal(withMark.versionObservation.approvedVersion, null)
  }
  assert.equal(rejectedReason(bindAtOfficialRetrieval(retrieval(matrix, htmlFor(matrix), { body: new Uint8Array() }))), 'empty_body')
  assert.equal(rejectedReason(bindAtOfficialRetrieval(retrieval(matrix, htmlFor(matrix), { retrievedAt: '2026-11-16T19:49:00.000Z' }))), 'clock')
  const differentCanonical = htmlFor(AT_OFFICIAL_PUBLICATIONS[2]!).replace('bmeia.gv.at', 'example.test')
  assert.equal(rejectedReason(bindAtOfficialRetrieval(retrieval(AT_OFFICIAL_PUBLICATIONS[2]!, differentCanonical))), 'identity_mismatch')
})

test('import adapter stays research-only and creates no accepted fact', () => {
  const reads = AT_OFFICIAL_PUBLICATIONS.map(publication => bindAtOfficialRetrieval(retrieval(publication)))
  const candidate = buildAtImportCandidate(reads)
  assert.equal(candidate.disposition, AT_IMPORT_DISPOSITION)
  assert.equal(candidate.customerStatement, AT_CUSTOMER_STATEMENT)
  assert.equal(candidate.acceptedFactCount, 0)
  assert.equal(candidate.positiveStatementCount, 0)
  assert.equal(candidate.importable, false)
  assert.equal(candidate.v3MethodInvoked, false)
  assert.equal(candidate.visitorReadback, false)
  assert.equal(admitAtImportCandidate(candidate).reason, 'tl_evaluation_required')
  assert.equal(admitAtImportCandidate(candidate, { tlEvaluationRef: 'TL-AT-2026-11-16-abcd1234' }).reason, 'external_shape')
  assert.equal(admitAtImportCandidate(candidate, {
    tlEvaluationRef: 'TL-AT-2026-11-16-abcd1234',
    methodApprovalRef: 'too-short',
  }).reason, 'method_approval_required')
  const admitted = admitAtImportCandidate(candidate, {
    tlEvaluationRef: 'TL-AT-2026-11-16-abcd1234',
    methodApprovalRef: 'V3-METHOD-AT-OWNER-0001',
  })
  assert.equal(admitted.status, 'not_importable')
  assert.equal(admitted.reason, 'shared_v3_method_not_attached')
  assert.equal(admitted.technicalEligibility, 'bytes_bound_external_refs_present')
  assert.equal(admitted.acceptedFactCount, 0)
  assert.equal(admitted.importable, false)
  const broken = buildAtImportCandidate(reads.slice(0, 2))
  assert.equal(admitAtImportCandidate(broken, {
    tlEvaluationRef: 'TL-AT-2026-11-16-abcd1234',
    methodApprovalRef: 'V3-METHOD-AT-OWNER-0001',
  }).reason, 'source_unbound')
  const ambiguousReads = reads.map((read, index) => index === 0
    ? bindAtOfficialRetrieval(retrieval(AT_OFFICIAL_PUBLICATIONS[0]!, htmlFor(AT_OFFICIAL_PUBLICATIONS[0]!, '<p>(Stand: 1.1.2020)</p>')))
    : read)
  assert.equal(admitAtImportCandidate(buildAtImportCandidate(ambiguousReads), {
    tlEvaluationRef: 'TL-AT-2026-11-16-abcd1234',
    methodApprovalRef: 'V3-METHOD-AT-OWNER-0001',
  }).reason, 'version_observation_ambiguous')
})

test('package reader preserves a transport refusal and does not invent facts', async () => {
  let calls = 0
  const reads = await readAtOfficialPackage(async publication => {
    calls += 1
    if (publication.id === 'bmi-general-entry') return { ok: false, publicationId: publication.id, reason: 'dns_failed' }
    const html = htmlFor(publication)
    return {
      ok: true,
      retrieval: retrieval(publication, html),
    }
  }, new AbortController().signal)
  assert.equal(calls, 3)
  const candidate = buildAtImportCandidate(reads)
  assert.equal(candidate.sources[1]?.status, 'rejected')
  assert.equal(candidate.acceptedFactCount, 0)
  assert.equal(admitAtImportCandidate(candidate).reason, 'source_unbound')
})

test('resolved addresses outside the public unicast range are refused', () => {
  assert.equal(atOfficialAddressAllowed('1.1.1.1'), true)
  assert.equal(atOfficialAddressAllowed('127.0.0.1'), false)
  assert.equal(atOfficialAddressAllowed('10.1.2.3'), false)
  assert.equal(atOfficialAddressAllowed('169.254.1.1'), false)
  assert.equal(atOfficialAddressAllowed('192.168.0.1'), false)
  assert.equal(atOfficialAddressAllowed('::1'), false)
  assert.equal(atOfficialAddressAllowed('2001:db8::1'), false)
  assert.equal(atOfficialAddressAllowed('2a02:8380::1'), true)
})

test('https reader refuses an unpinned publication and a private answer', async (t: TestContext) => {
  const matrix = AT_OFFICIAL_PUBLICATIONS[0]!
  const forged = { ...matrix, url: 'https://example.test/not-official' }
  const unpinned = await readAtOfficialPublicationHttps(forged, new AbortController().signal)
  assert.equal(unpinned.ok, false)
  if (!unpinned.ok) assert.equal(unpinned.reason, 'url_not_pinned')

  t.mock.method(Resolver.prototype, 'resolve4', async () => ['127.0.0.1'])
  t.mock.method(Resolver.prototype, 'resolve6', async () => [])
  t.mock.method(Resolver.prototype, 'cancel', () => undefined)
  let requests = 0
  t.mock.method(https, 'request', () => { requests += 1; throw new Error('must not connect') })
  const refused = await readAtOfficialPublicationHttps(matrix, new AbortController().signal)
  assert.equal(refused.ok, false)
  if (!refused.ok) assert.equal(refused.reason, 'address_refused')
  assert.equal(requests, 0)
})

test('https reader returns pinned bytes and refuses a redirect', async (t: TestContext) => {
  const matrix = AT_OFFICIAL_PUBLICATIONS[0]!
  const html = htmlFor(matrix)
  t.mock.method(Resolver.prototype, 'resolve4', async () => ['1.1.1.1'])
  t.mock.method(Resolver.prototype, 'resolve6', async () => [])
  t.mock.method(Resolver.prototype, 'cancel', () => undefined)
  const wire = (status: number) => {
    t.mock.method(https, 'request', ((options: https.RequestOptions, callback: (response: IncomingMessage) => void) => {
      assert.equal(options.hostname, matrix.hostname)
      assert.equal(options.path, matrix.path)
      assert.equal(options.method, 'GET')
      const request = new EventEmitter() as EventEmitter & { end(): void; destroy(): void }
      const response = new EventEmitter() as EventEmitter & {
        statusCode: number
        complete: boolean
        rawHeaders: string[]
        destroy(): void
      }
      request.destroy = () => undefined
      response.destroy = () => undefined
      response.statusCode = status
      response.complete = true
      response.rawHeaders = ['Content-Type', 'text/html', 'Content-Length', String(Buffer.byteLength(html))]
      request.end = () => {
        callback(response as IncomingMessage)
        queueMicrotask(() => {
          if (status === 200) response.emit('data', Buffer.from(html))
          response.emit('end')
        })
      }
      return request as unknown as ClientRequest
    }) as typeof https.request)
  }
  wire(302)
  const redirected = await readAtOfficialPublicationHttps(matrix, new AbortController().signal)
  assert.equal(redirected.ok, false)
  if (!redirected.ok) assert.equal(redirected.reason, 'redirect_refused')
  wire(200)
  const read = await readAtOfficialPublicationHttps(matrix, new AbortController().signal)
  assert.equal(read.ok, true)
  if (!read.ok) return
  const bound = bindAtOfficialRetrieval(read.retrieval)
  assert.equal(bound.status, 'bound')
  if (bound.status === 'bound') {
    assert.equal(bound.sha256, sha256Hex(html))
    assert.equal(bound.versionObservation.approvedVersion, null)
  }
})

test('lane files stay inside the isolated reader and off the #1222 surface', () => {
  const directory = join(process.cwd(), AT_SOURCE_LANE_ROOT)
  const files = readdirSync(directory).sort()
  const originalReaderFiles = ['bind.ts', 'import-adapter.ts', 'publications.ts', 'reader.test.ts', 'transport.ts']
  const ownResearchFiles = ['at-bmi-research.test.ts', 'at-bmi-research.ts', 'live-research.test.ts', 'priority.test.ts', 'priority.ts']
  assert.deepEqual(files, [...originalReaderFiles, ...ownResearchFiles].sort())
  for (const file of originalReaderFiles) {
    const source = readFileSync(join(directory, file), 'utf8')
    if (!file.endsWith('.test.ts')) {
      assert.equal(source.includes('visaRequired'), false, file)
      assert.equal(source.includes('visaFree'), false, file)
      assert.equal(source.includes('acceptedFacts'), false, file)
    }
    for (const specifier of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      const target = specifier[1] ?? ''
      assert.equal(atSourceLanePathForbidden(target), false, target)
      assert.doesNotMatch(target, /official-truth-product-v3|official-presentation|destination-essentials|einreise|Reisevorbereitung|visitor\//)
    }
  }
  for (const file of ownResearchFiles) {
    const source = readFileSync(join(directory, file), 'utf8')
    for (const specifier of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
      const target = specifier[1] ?? ''
      assert.doesNotMatch(target, /components\/|app\/|visitor\/|official-presentation|destination-essentials|Reisevorbereitung|\/einreise\//)
    }
  }
  assert.equal(atSourceLanePathForbidden('components/readiness/Ampel.tsx'), true)
  assert.equal(atSourceLanePathForbidden('lib/readiness/official-truth-product-v3/source/aa-ch-de-reviewed-program.ts'), true)
  assert.equal(atSourceLanePathForbidden(AT_SOURCE_LANE_ROOT + 'bind.ts'), false)
  assert.ok(AT_SOURCE_LANE_FORBIDDEN_PREFIXES.length >= 8)
  assert.ok(AT_OFFICIAL_MAXIMUM_BYTES >= 498_415)
})
