import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { uiAuditSeiteAktiv } from '@/lib/ui-audit/freigabe'

describe('UI-Audit-Freigabe', () => {
  test('Production bleibt aus, auch mit Audit-Flag', () => {
    assert.equal(
      uiAuditSeiteAktiv({ VERCEL_ENV: 'production', JETNITY_UI_AUDIT: 'true' }),
      false,
    )
    assert.equal(
      uiAuditSeiteAktiv({ VERCEL_ENV: 'production', JETNITY_UI_AUDIT: '1' }),
      false,
    )
  })

  test('Preview und Development schalten nur mit explizitem Flag ein', () => {
    assert.equal(
      uiAuditSeiteAktiv({ VERCEL_ENV: 'preview', JETNITY_UI_AUDIT: 'true' }),
      true,
    )
    assert.equal(
      uiAuditSeiteAktiv({ VERCEL_ENV: 'development', JETNITY_UI_AUDIT: '1' }),
      true,
    )
  })

  test('Preview und Development bleiben ohne Flag aus', () => {
    assert.equal(uiAuditSeiteAktiv({ VERCEL_ENV: 'preview' }), false)
    assert.equal(
      uiAuditSeiteAktiv({ VERCEL_ENV: 'development', JETNITY_UI_AUDIT: 'false' }),
      false,
    )
    assert.equal(
      uiAuditSeiteAktiv({ VERCEL_ENV: 'development', JETNITY_UI_AUDIT: '' }),
      false,
    )
  })

  test('unbekannte Umgebung braucht das Flag und ist kein Production', () => {
    assert.equal(uiAuditSeiteAktiv({ JETNITY_UI_AUDIT: 'true' }), true)
    assert.equal(uiAuditSeiteAktiv({ VERCEL_ENV: 'staging', JETNITY_UI_AUDIT: '1' }), true)
    assert.equal(uiAuditSeiteAktiv({}), false)
    assert.equal(uiAuditSeiteAktiv({ VERCEL_ENV: 'staging' }), false)
  })
})
