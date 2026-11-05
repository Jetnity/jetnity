import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import { chDeAaS1VisaRowResearchFromHtml } from './official-truth-ch-de-aa-s1-visa-row-research-server'
import { requirementsProviderAus } from './provider'
import { applicationContract, applicationPilotEnabled } from './official-truth-ch-de-application-pilot-1/contract-server'
import { OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY } from './official-truth-trusted-fact-extractor-registry'

const heading = 'Übersicht zur Visumpflicht bzw. -freiheit bei Einreise in die Bundesrepublik Deutschland'
const tableHeaders = [
  '<thead><tr>',
  '<th>Staaten und Gebietskörperschaften</th>',
  '<th>Visumpflicht für Deutschland: Ja/Nein</th>',
  '</tr></thead>',
].join('')
const swiss = '<tr><td>Schweiz</td><td>Nein</td></tr>'
const rowGermany = '<tr><td>Österreich</td><td>Nein</td></tr>'
const rowThailand = '<tr><td>Thailand</td><td>Ja</td></tr>'

function table(rows = [rowGermany, swiss, rowThailand], header = tableHeaders) {
  return '<table>' + header + '<tbody>' + rows.join('') + '</tbody></table>'
}
function html(tables = [table()], title = heading) {
  return [
    '<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Research-only fixture</title></head><body>',
    '<main><h1>', title, '</h1><p>03.06.2026 - Artikel</p>',
    ...tables,
    '</main></body></html>',
  ].join('')
}
function blocked(value: unknown, reason: string) {
  assert.deepEqual(chDeAaS1VisaRowResearchFromHtml(value), { status: 'blocked', reason })
}

describe('CH→DE AA visa table: research observation, not accepted government fact', () => {
  test('strict synthetic table isolates exactly the Swiss no-visa-duty cell without promoting it', () => {
    const result = chDeAaS1VisaRowResearchFromHtml(html())
    assert.equal(result.status, 'research_visa_table_observation')
    if (result.status !== 'research_visa_table_observation') return
    assert.equal(result.country, 'CH')
    assert.equal(result.destination, 'DE')
    assert.equal(result.requirementType, 'visa')
    assert.equal(result.swissVisaDutyCell, 'Nein')
    assert.equal(result.researchStatus, 'RESEARCH_ONLY')
    assert.equal(result.databaseImportStatus, 'NOT_APPROVED_FOR_DATABASE_IMPORT')
    assert.equal(result.sourceCustody, 'not_verified')
    assert.equal(result.legalApplicability, 'not_verified')
    assert.equal(result.checkedAt, null)
    assert.equal(result.validFrom, null)
    assert.equal(result.validUntil, null)
    assert.equal(result.acceptedEvidence, 0)
    assert.equal(result.acceptedRules, 0)
    assert.equal(result.databaseWrites, 0)
    assert(Object.isFrozen(result))
    assert.equal(requirementsProviderAus(), null)
    assert.equal(applicationPilotEnabled(), false)
    assert.equal(applicationContract('anything', 'f'.repeat(64)), null)
    assert.deepEqual(OFFICIAL_TRUTH_TRUSTED_FACT_EXTRACTOR_REGISTRY, [])
    assert(!JSON.stringify(result).includes('Österreich'))
  })

  test('wrong destination, missing authoritative table and isolated snippet cannot be extrapolated', () => {
    blocked('<main>Schweiz Nein</main>', 'invalid_document_structure')
    blocked(html([], heading), 'missing_exact_visa_table')
    blocked(html([table()], 'Visa für die Schweiz'), 'invalid_document_structure')
    blocked(html([table([rowThailand])]), 'swiss_row_missing')
    blocked(html([table([rowGermany, '<tr><td>Schweizer</td><td>Nein</td></tr>'])]), 'swiss_row_missing')
  })

  test('conditional/footnoted/positive visa duty is never silently interpreted as no visa duty', () => {
    blocked(html([table(['<tr><td>Schweiz</td><td>Nein (1)</td></tr>'])]), 'qualified_or_conflicting_swiss_row')
    blocked(html([table(['<tr><td>Schweiz (1)</td><td>Nein</td></tr>'])]), 'qualified_or_conflicting_swiss_row')
    blocked(html([table(['<tr><td>Schweiz</td><td>Ja</td></tr>'])]), 'qualified_or_conflicting_swiss_row')
    blocked(html([table(['<tr><td>Schweiz</td><td>Nein</td><td>Ausnahme</td></tr>'])]), 'qualified_or_conflicting_swiss_row')
    blocked(html([table(['<tr><td>Schweiz</td><td>Nein<sup>1</sup></td></tr>'])]), 'qualified_or_conflicting_swiss_row')
  })

  test('hidden and active content in Swiss row cannot change what appears to be evidence', () => {
    blocked(html([table(['<tr><td>Schweiz</td><td>Nein<span hidden>Ja</span></td></tr>'])]), 'qualified_or_conflicting_swiss_row')
    blocked(html([table(['<tr><td>Schweiz</td><td>Nein<script>window.pwned=1</script></td></tr>'])]), 'qualified_or_conflicting_swiss_row')
    blocked(html([table(['<tr><td>Schweiz</td><td><span aria-hidden="true">Nein</span></td></tr>'])]), 'qualified_or_conflicting_swiss_row')
    blocked(html([table(['<tr><td>Schweiz</td><td><span style="display:none">Nein</span></td></tr>'])]), 'qualified_or_conflicting_swiss_row')
  })

  test('multiple table revisions or Swiss rows are ambiguous, not first/last wins', () => {
    blocked(html([table(), table()]), 'ambiguous_visa_table')
    blocked(html([table([swiss, swiss])]), 'ambiguous_swiss_row')
    blocked(html([table([swiss, '<tr><td>Schweiz</td><td>Ja</td></tr>'])]), 'ambiguous_swiss_row')
    blocked(html([table([swiss], tableHeaders + tableHeaders)]), 'swiss_row_missing')
  })

  test('nested table, counterfeit header and over-limit input fail closed', () => {
    blocked(html([table([swiss], '<tr><th>Land</th><th>Visum</th></tr>')]), 'missing_exact_visa_table')
    blocked(html([table([
      '<tr><td>Schweiz</td><td>Nein<table><tr><td>Ja</td></tr></table></td></tr>',
    ])]), 'ambiguous_visa_table')
    blocked(html() + 'X'.repeat(131_072), 'snapshot_over_limit')
    blocked(null, 'invalid_html')
    blocked({ html: html(), approved: true }, 'invalid_html')
  })

  test('parser does not perform source fetch, grant, provider or accepted-store write', () => {
    const source = readFileSync(join(process.cwd(), 'lib/readiness/official-truth-ch-de-aa-s1-visa-row-research-server.ts'), 'utf8')
    assert.match(source, /import 'server-only'/)
    assert.doesNotMatch(source, /fetch\(|createClient|createServerComponentClient|apply_migration|execute_sql|accepted_store|trustedRuleFact|officialTruthRegelKandidatAusEvidence/)
    assert.equal(requirementsProviderAus(), null)
  })
})
