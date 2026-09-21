import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import {
  authLookupFehlerIstSitzungFehlend,
  authLookupUnavailableHtml,
} from '../../proxy'

describe('Proxy unterscheidet Login von Auth-Lookup-Ausfall', () => {
  test('nur fehlende oder 401-Sitzung gilt als nicht angemeldet', () => {
    assert.equal(authLookupFehlerIstSitzungFehlend(undefined), false)
    assert.equal(authLookupFehlerIstSitzungFehlend(null), false)
    assert.equal(
      authLookupFehlerIstSitzungFehlend({ name: 'AuthSessionMissingError', status: 400 }),
      true,
    )
    assert.equal(authLookupFehlerIstSitzungFehlend({ status: 401 }), true)
    assert.equal(authLookupFehlerIstSitzungFehlend({ status: 500 }), false)
    assert.equal(authLookupFehlerIstSitzungFehlend({ name: 'AuthRetryableFetchError' }), false)
    assert.equal(authLookupFehlerIstSitzungFehlend({ status: 0 }), false)
  })

  test('HTML-Unavailable bleibt 503-Text mit Retry und ohne Login-Behauptung', () => {
    const html = authLookupUnavailableHtml({
      grund: 'lookup-failed',
      retryHref: '/account?tab=reisen',
    })
    assert.match(html, /data-auth-lookup="lookup-failed"/)
    assert.match(html, /Anmeldung derzeit nicht prüfbar/)
    assert.match(html, /bedeutet nicht, dass du abgemeldet bist/)
    assert.match(html, /href="\/account\?tab=reisen"/)
    assert.match(html, /data-auth-lookup-action="retry"/)
    assert.equal(html.includes('/login'), false)
    assert.equal(html.includes('/admin/login'), false)
    assert.equal(html.includes('javascript:'), false)

    const unconfigured = authLookupUnavailableHtml({
      grund: 'unconfigured',
      retryHref: '//evil.example/phish',
    })
    assert.match(unconfigured, /data-auth-lookup="unconfigured"/)
    assert.match(unconfigured, /href="\/"/)
    assert.equal(unconfigured.includes('//evil.example/phish'), false)
  })
})
