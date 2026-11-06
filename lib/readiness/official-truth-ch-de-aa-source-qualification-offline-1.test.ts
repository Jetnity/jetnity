import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import {
  chDeAaSourceQualificationOffline1,
  CH_DE_AA_SOURCE_QUALIFICATION_OFFLINE_1,
} from './official-truth-ch-de-aa-source-qualification-offline-1'
import { applicationPilotEnabled } from './official-truth-ch-de-application-pilot-1/contract-server'
import { OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY } from './official-truth-trusted-fact-extractor-registry'
import { requirementsProviderAus } from './provider'

const PIN = CH_DE_AA_SOURCE_QUALIFICATION_OFFLINE_1
const header = '<thead><tr><th>Staaten und Gebietskörperschaften</th>' +
  '<th>Visumpflicht für Deutschland: Ja/Nein</th></tr></thead>'
const country = '<tr><td>Schweiz</td><td>Nein</td></tr>'

function document(rows: string[] = [country], intro = ''): string {
  return '<!doctype html><html lang="de"><head><meta charset="utf-8"></head>' +
    '<body><main><h1>Übersicht zur Visumpflicht bzw. -freiheit bei Einreise in die Bundesrepublik Deutschland</h1>' +
    '<p>03.06.2026 – Research fixture</p>' + intro +
    '<table>' + header + '<tbody>' + rows.join('') + '</tbody></table></main></body></html>'
}
function fixture(html = document()) {
  return {
    requestUrl: PIN.canonicalUrl,
    finalUrl: PIN.canonicalUrl,
    mediaType: PIN.mediaType,
    httpStatus: 200,
    redirectCount: 0,
    html,
  }
}
function blocked(value: unknown, reason: string, parserReason?: string) {
  assert.deepEqual(chDeAaSourceQualificationOffline1(value), parserReason
    ? { status: 'blocked', reason, parserReason }
    : { status: 'blocked', reason })
}

describe('CH-DE AA source proposal is offline-only and cannot grant identity or truth', () => {
  test('one exact synthetic Swiss visa row stays a research-only observation', () => {
    const html = document()
    const result = chDeAaSourceQualificationOffline1(fixture(html))
    assert.equal(result.status, 'research_only_observation')
    if (result.status !== 'research_only_observation') return
    assert.equal(result.swissVisaDutyCell, 'Nein')
    assert.equal(result.country, 'CH')
    assert.equal(result.destination, 'DE')
    assert.equal(result.sourceCandidateUrl, PIN.canonicalUrl)
    assert.equal(result.observedUtf8Bytes, Buffer.byteLength(html, 'utf8'))
    assert.equal(result.requiresSourceSpecificBudgetQualification, false)
    assert.equal(result.sourceCustody, 'not_verified')
    assert.equal(result.responseCompleteness, 'not_verified')
    assert.equal(result.identityProfile, 'not_registered')
    assert.equal(result.legalApplicability, 'not_verified')
    assert.equal(result.sourceFingerprint, null)
    assert.equal(result.checkedAt, null)
    assert.equal(result.validFrom, null)
    assert.equal(result.validUntil, null)
    assert.equal(result.researchStatus, 'RESEARCH_ONLY')
    assert.equal(result.databaseImportStatus, 'NOT_APPROVED_FOR_DATABASE_IMPORT')
    assert.equal(result.acceptedEvidence, 0)
    assert.equal(result.acceptedRules, 0)
    assert.equal(result.databaseWrites, 0)
    assert.equal(PIN.registeredSource, false)
    assert.equal(PIN.registeredRepresentation, false)
    assert.equal(PIN.registeredIdentityProfile, false)
    assert.equal(PIN.runtimeRetrievalEnabled, false)
    assert.equal(PIN.trustedFactEnabled, false)
    assert.equal(PIN.acceptedStoreEnabled, false)
    assert(Object.isFrozen(result))
    assert.equal(requirementsProviderAus(), null)
    assert.equal(applicationPilotEnabled(), false)
    assert.deepEqual(OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY, [])
  })

  test('an AA-size synthetic body is not live-capable even inside proposed 128KiB', () => {
    const html = document([country], '<p>' + 'x'.repeat(94_000) + '</p>')
    const result = chDeAaSourceQualificationOffline1(fixture(html))
    assert(result.status === 'research_only_observation')
    assert(result.observedUtf8Bytes > PIN.existingTransportBodyMaxBytes)
    assert(result.observedUtf8Bytes < PIN.maxResearchBodyBytes)
    assert.equal(result.requiresSourceSpecificBudgetQualification, true)
    assert.equal(result.identityProfile, 'not_registered')
    assert.equal(result.responseCompleteness, 'not_verified')
    assert.equal(result.acceptedEvidence, 0)
  })

  test('wrong request URL, final URL and tracking/fragment variants fail closed', () => {
    blocked({ ...fixture(), requestUrl: 'https://example.com/' }, 'wrong_source_url')
    blocked({ ...fixture(), finalUrl: 'https://example.com/' }, 'wrong_source_url')
    blocked({ ...fixture(), requestUrl: PIN.canonicalUrl + '?utm_source=test' }, 'wrong_source_url')
    blocked({ ...fixture(), requestUrl: PIN.canonicalUrl + '#Schweiz' }, 'wrong_source_url')
    blocked({ ...fixture(), finalUrl: PIN.canonicalUrl + '/' }, 'wrong_source_url')
  })

  test('redirects, HTTP error, content-type and charset drift remain unqualified', () => {
    blocked({ ...fixture(), redirectCount: 1 }, 'redirect_not_qualified')
    blocked({ ...fixture(), redirectCount: -1 }, 'redirect_not_qualified')
    blocked({ ...fixture(), redirectCount: '0' }, 'redirect_not_qualified')
    blocked({ ...fixture(), httpStatus: 206 }, 'wrong_http_status')
    blocked({ ...fixture(), httpStatus: 302 }, 'wrong_http_status')
    blocked({ ...fixture(), httpStatus: '200' }, 'wrong_http_status')
    blocked({ ...fixture(), mediaType: 'application/json' }, 'wrong_media_type')
    blocked({ ...fixture(), mediaType: 'text/html; charset=utf-8' }, 'wrong_media_type')
    blocked({ ...fixture(), mediaType: 'text/html;charset=UTF-8' }, 'wrong_media_type')
  })

  test('missing, duplicate and footnoted Swiss rows cannot become research observations', () => {
    blocked(fixture(document(['<tr><td>Thailand</td><td>Ja</td></tr>'])),
      'research_table_blocked', 'swiss_row_missing')
    blocked(fixture(document([country, country])),
      'research_table_blocked', 'ambiguous_swiss_row')
    blocked(fixture(document([country, '<tr><td>Schweiz</td><td>Ja</td></tr>'])),
      'research_table_blocked', 'ambiguous_swiss_row')
    blocked(fixture(document(['<tr><td>Schweiz</td><td>Nein (1)</td></tr>'])),
      'research_table_blocked', 'qualified_or_conflicting_swiss_row')
    blocked(fixture(document(['<tr><td>Schweiz (1)</td><td>Nein</td></tr>'])),
      'research_table_blocked', 'qualified_or_conflicting_swiss_row')
    blocked(fixture(document(['<tr><td>Schweiz</td><td>Ja</td></tr>'])),
      'research_table_blocked', 'qualified_or_conflicting_swiss_row')
    blocked(fixture(document(['<tr><td>Schweiz</td><td>Nein<sup>1</sup></td></tr>'])),
      'research_table_blocked', 'qualified_or_conflicting_swiss_row')
    const duplicateTable = document().replace('</main>',
      '<table>' + header + '<tbody>' + country + '</tbody></table></main>')
    blocked(fixture(duplicateTable), 'research_table_blocked', 'ambiguous_visa_table')
  })

  test('truncation before the table and oversized HTML are blocked; tail completeness is not proved', () => {
    const h = document()
    blocked(fixture(h.slice(0, h.indexOf('<table>'))),
      'research_table_blocked', 'missing_exact_visa_table')
    blocked(fixture(''), 'invalid_html')
    blocked(fixture(null as unknown as string), 'invalid_html')
    blocked(fixture(h + 'x'.repeat(PIN.maxResearchBodyBytes)),
      'research_body_over_limit')

    // A parseable fragment ending after the table could still be a truncated
    // HTTP message. This offline diagnostic NEVER claims full-source custody;
    // native framing and Content-Length checks remain the separate #1131 gate.
    const partialTail = h.slice(0, h.indexOf('</main>'))
    const result = chDeAaSourceQualificationOffline1(fixture(partialTail))
    assert.equal(result.status, 'research_only_observation')
    if (result.status === 'research_only_observation') {
      assert.equal(result.responseCompleteness, 'not_verified')
      assert.equal(result.acceptedEvidence, 0)
    }
  })

  test('forged receipts, headers, byte declarations, credentials and accessors fail shape check', () => {
    blocked(null, 'invalid_envelope')
    blocked([], 'invalid_envelope')
    blocked({ ...fixture(), sourceContentHash: 'f'.repeat(64) }, 'invalid_envelope')
    blocked({ ...fixture(), declaredContentLength: 4 }, 'invalid_envelope')
    blocked({ ...fixture(), retrievedAt: '2026-11-06T00:00:00Z' }, 'invalid_envelope')
    blocked({ ...fixture(), accepted: true }, 'invalid_envelope')
    blocked({ ...fixture(), trustedRuleFact: true }, 'invalid_envelope')
    blocked({ ...fixture(), authorization: 'Bearer secret' }, 'invalid_envelope')
    blocked({ ...fixture(), html: document(), userId: 'u-1' }, 'invalid_envelope')
    const proto = Object.create({ approved: true }) as Record<string, unknown>
    Object.assign(proto, fixture())
    blocked(proto, 'invalid_envelope')
    let wasInvoked = false
    const withGetter = { ...fixture() }
    Object.defineProperty(withGetter, 'html', {
      enumerable: true, get() { wasInvoked = true; return document() },
    })
    blocked(withGetter, 'invalid_envelope')
    assert.equal(wasInvoked, false)
    const throwingProxy = new Proxy(fixture(), {
      ownKeys() { throw new Error('untrusted proxy') },
    })
    blocked(throwingProxy, 'invalid_envelope')
    const spoofedProxy = new Proxy({ ...fixture(), requestUrl: 'https://example.com/' }, {
      get(target, prop, receiver) {
        return prop === 'requestUrl' ? PIN.canonicalUrl : Reflect.get(target, prop, receiver)
      },
    })
    blocked(spoofedProxy, 'wrong_source_url')
  })

  test('no network, content-identity registry mutation or accepted-store execution is introduced', () => {
    const source = readFileSync(join(process.cwd(),
      'lib/readiness/official-truth-ch-de-aa-source-qualification-offline-1.ts'), 'utf8')
    assert.match(source, /import 'server-only'/)
    assert.doesNotMatch(source, /\bfetch\s*\(|https\.request|createClient|createServerClient|execute_sql|apply_migration/)
    assert.doesNotMatch(source, /official_truth_store_accepted_v1\s*\(|\bregelKandidatAkzeptieren\s*\(/)
    assert.equal(PIN.registeredIdentityProfile, false)
    assert.equal(PIN.runtimeRetrievalEnabled, false)
    assert.equal(PIN.acceptedStoreEnabled, false)
  })
})
