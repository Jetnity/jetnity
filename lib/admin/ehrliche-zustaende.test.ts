import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import {
  ADMIN_EHRLICHE_TEXTE,
  ADMIN_NAECHSTE_SCHRITTE,
  adminFolgtSeitenhinweis,
} from './ehrliche-zustaende'

describe('ehrliche Admin-Zustände', () => {
  test('Refund-Texte behaupten keine Provider-Geldbewegung', () => {
    assert.match(ADMIN_EHRLICHE_TEXTE.refundHinweis, /Keine echte Geldbewegung/)
    assert.match(ADMIN_EHRLICHE_TEXTE.refundHinweis, /refunds/)
    assert.match(ADMIN_EHRLICHE_TEXTE.refundErfolg, /Keine Provider-Erstattung/)
    assert.equal(ADMIN_EHRLICHE_TEXTE.refundButton.includes('auslösen'), false)
    assert.equal(ADMIN_EHRLICHE_TEXTE.refundButton.includes('senden'), false)
  })

  test('IP-Block-Texte sagen ausdrücklich nicht enforced', () => {
    assert.match(ADMIN_EHRLICHE_TEXTE.ipBlockHinweis, /nicht enforced/)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityHinweis, /nicht enforced/)
    assert.match(ADMIN_EHRLICHE_TEXTE.ipBlockErfolgPrefix, /nicht enforced/)
  })

  test('kein Copilot-Execute und keine erfundene Automatik', () => {
    assert.match(ADMIN_EHRLICHE_TEXTE.copilotFolgtHinweis, /Kein Execute-Pfad/)
    assert.match(ADMIN_EHRLICHE_TEXTE.steuerzentraleLage, /kein Copilot-Execute/i)
    assert.match(ADMIN_EHRLICHE_TEXTE.steuerzentraleLage, /System Health ist read-only/)
    assert.doesNotMatch(ADMIN_EHRLICHE_TEXTE.steuerzentraleLage, /Keine System-Health/)
  })

  test('nächste Schritte enthalten nur belegte Flächen oder ausdrücklich später', () => {
    const ready = ADMIN_NAECHSTE_SCHRITTE.filter((schritt) => schritt.stand === 'ready')
    const later = ADMIN_NAECHSTE_SCHRITTE.filter((schritt) => schritt.stand === 'later')
    assert.deepEqual(
      ready.map((schritt) => schritt.href),
      ['/admin/users', '/admin/payments', '/admin/security', '/admin/system-health', '/admin/provider-ops'],
    )
    assert.equal(later.every((schritt) => schritt.href === null), true)
    assert.equal(
      ADMIN_NAECHSTE_SCHRITTE.some((schritt) => schritt.href === '/admin/control-center'),
      false,
    )
  })

  test('Stub-Seitenhinweis behauptet kein fertiges Modul', () => {
    assert.match(adminFolgtSeitenhinweis('Analytics'), /kein fertiges Modul/)
  })
})
