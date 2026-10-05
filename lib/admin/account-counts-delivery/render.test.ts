import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, test } from 'node:test'

import {
  AdminAccountCountsAnsicht,
  ADMIN_ACCOUNT_COUNTS_COPY,
  formatExactAccountCount,
} from '@/components/admin/home/AdminAccountCounts'
import { ADMIN_ACCOUNT_COUNTS_DEFINITION_VERSION } from '@/lib/admin/account-counts-delivery/contract'

const MEASURES = {
  presentRegisteredAccounts: '9007199254740993',
  createdInPrior30Days: '0',
  measuredAt: '2026-09-22T12:00:00.000Z',
  windowStart: '2026-08-23T12:00:00.000Z',
  definitionVersion: ADMIN_ACCOUNT_COUNTS_DEFINITION_VERSION,
}

function htmlAus(result: Parameters<typeof AdminAccountCountsAnsicht>[0]['result']): string {
  return renderToStaticMarkup(createElement(AdminAccountCountsAnsicht, { result }))
}

describe('AdminAccountCounts Ansicht (synthetic render)', () => {
  test('renders the two exact measures, database clock and caveats', () => {
    const html = htmlAus({ status: 'available', measures: MEASURES })
    assert.match(html, /<h2[^>]*>Registrierte Konten<\/h2>/)
    assert.match(html, /9\.007\.199\.254\.740\.993/)
    assert.match(html, />0</)
    assert.match(html, /2026-09-22T12:00:00\.000Z/)
    assert.match(html, /2026-08-23T12:00:00\.000Z/)
    assert.match(html, /720 Stunden/)
    assert.match(html, /Rohkonten/)
    assert.doesNotMatch(html, /Partnerverkehr ist bereit|ist eine Live-Statistik|Growth OS|CSV-Export/)
    assert.doesNotMatch(html, /dangerouslySetInnerHTML/)
    assert.equal(formatExactAccountCount(MEASURES.presentRegisteredAccounts), '9.007.199.254.740.993')
  })

  test('rejected fixtures cannot render numbers', () => {
    for (const status of ['forbidden', 'unavailable', 'failed'] as const) {
      const html = htmlAus({ status })
      assert.doesNotMatch(html, /9\.007\.199\.254\.740\.993/)
      assert.doesNotMatch(html, /tabular-nums/)
      assert.match(html, /role="status"/)
    }
    assert.match(htmlAus({ status: 'forbidden' }), new RegExp(ADMIN_ACCOUNT_COUNTS_COPY.forbidden))
    assert.match(htmlAus({ status: 'unavailable' }), /nicht vorhanden/)
    assert.match(htmlAus({ status: 'failed' }), /keine Null/)
    assert.equal(htmlAus({ status: 'disabled' }), '')
  })

  test('component stays accessible and does not claim a browser E2E', () => {
    const html = htmlAus({ status: 'available', measures: MEASURES })
    assert.match(html, /aria-labelledby="admin-account-counts-titel"/)
    assert.match(html, /<time dateTime="2026-09-22T12:00:00\.000Z"/)
    assert.doesNotMatch(html, /autoFocus|autofocus/)
    const quelle = readFileSync(join(process.cwd(), 'components/admin/home/AdminAccountCounts.tsx'), 'utf8')
    assert.match(quelle, /min-w-0/)
    assert.match(quelle, /sm:grid-cols-2/)
    assert.doesNotMatch(quelle, /w-\[\d+px\]/)
    assert.doesNotMatch(quelle, /localStorage/)
    assert.doesNotMatch(quelle, /posthog|analytics|gtag/i)
  })
})
