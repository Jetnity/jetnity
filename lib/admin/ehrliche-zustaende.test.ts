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

  test('Security-Hinweis trennt aufgezeichnete Zeilen von echten Ereignissen', () => {
    assert.match(ADMIN_EHRLICHE_TEXTE.securityHinweis, /security_events/)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityHinweis, /keine vollständige Event-Ingestion/)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityHinweis, /0 aufgezeichnete Zeilen/)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityHinweis, /belegen nicht/)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityHinweis, /kein sicherheitsrelevantes Ereignis/)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityHinweis, /Keine Live-Überwachung/)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityHinweis, /nicht enforced/)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityAbdeckungHinweis, /aufgezeichnete Zeilen/)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityAbdeckungHinweis, /security_events/)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityAbdeckungHinweis, /unvollständig/)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityKpiEvents24h, /Aufgezeichnete/)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityKpiLoginFehler24h, /Aufgezeichnete/)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityKpiAuffaelligkeiten24h, /Aufgezeichnete/)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityTabelleTitel, /Aufgezeichnete/)
    assert.match(ADMIN_EHRLICHE_TEXTE.securityTabelleLeer, /Keine aufgezeichneten Events/)
    assert.doesNotMatch(ADMIN_EHRLICHE_TEXTE.securityTabelleLeer, /^Keine Events gefunden/)
  })

  test('kein Copilot-Execute und keine erfundene Automatik', () => {
    assert.match(ADMIN_EHRLICHE_TEXTE.copilotFolgtHinweis, /Kein Execute-Pfad/)
    assert.match(ADMIN_EHRLICHE_TEXTE.steuerzentraleLage, /kein Copilot-Execute/i)
    assert.match(ADMIN_EHRLICHE_TEXTE.steuerzentraleLage, /System Health.*read-only/)
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

  test('Bereichssuche behauptet keine Datensatzsuche und kein Execute', () => {
    assert.equal(ADMIN_EHRLICHE_TEXTE.sucheBereiche, 'Bereiche suchen')
    assert.match(ADMIN_EHRLICHE_TEXTE.sucheBereicheHinweis, /Lokale Navigation/)
    assert.match(ADMIN_EHRLICHE_TEXTE.sucheBereicheHinweis, /Keine Datensatzsuche/)
    assert.match(ADMIN_EHRLICHE_TEXTE.sucheBereicheHinweis, /kein Befehl/)
    assert.match(ADMIN_EHRLICHE_TEXTE.sucheBereicheHinweis, /kein Execute/)
    assert.match(ADMIN_EHRLICHE_TEXTE.sucheBereicheLeer, /Keine Datensatzsuche/)
    assert.equal(ADMIN_EHRLICHE_TEXTE.sucheBereicheKeinTreffer, 'Kein passender Bereich.')
    assert.doesNotMatch(ADMIN_EHRLICHE_TEXTE.sucheBereiche, /Befehlssuche/)
    assert.doesNotMatch(ADMIN_EHRLICHE_TEXTE.sucheBereicheHinweis, /Befehlspalette/)
  })

  test('Stub-Seitenhinweis behauptet kein fertiges Modul', () => {
    assert.match(adminFolgtSeitenhinweis('Analytics'), /kein fertiges Modul/)
  })

  test('Aktuelle Hinweise bleiben regelbasiert und ohne universelle 30s-Behauptung', () => {
    assert.equal(ADMIN_EHRLICHE_TEXTE.aktuelleHinweiseTitel, 'Aktuelle Hinweise')
    assert.match(ADMIN_EHRLICHE_TEXTE.aktuelleHinweiseHinweis, /Regelbasierte Lage/)
    assert.match(ADMIN_EHRLICHE_TEXTE.aktuelleHinweiseHinweis, /kein Copilot-Execute/i)
    assert.doesNotMatch(ADMIN_EHRLICHE_TEXTE.aktuelleHinweiseHinweis, /höchstens 30s|at most 30s old/)
    assert.match(ADMIN_EHRLICHE_TEXTE.aktuelleHinweiseKeinSignal, /prozessweite airports-Beobachtung/)
    assert.match(ADMIN_EHRLICHE_TEXTE.aktuelleHinweiseNotzugang, /nicht zugeschrieben/)
    assert.match(ADMIN_EHRLICHE_TEXTE.aktuelleHinweiseOhnePruefung, /betrieb-lesen/)
    assert.match(ADMIN_EHRLICHE_TEXTE.copilotFolgtHinweis, /Kein Execute-Pfad/)
  })

  test('Modellnutzung-Hinweis trennt lesbar, leer und unavailable ohne Finanzclaim', () => {
    assert.equal(ADMIN_EHRLICHE_TEXTE.modellnutzungTitel, 'Modellnutzung')
    assert.match(ADMIN_EHRLICHE_TEXTE.modellnutzungHinweis, /30 Tage/)
    assert.match(ADMIN_EHRLICHE_TEXTE.modellnutzungHinweis, /200 Zeilen/)
    assert.match(ADMIN_EHRLICHE_TEXTE.modellnutzungHinweis, /kein vollständiges Ausgabenbild/)
    assert.doesNotMatch(ADMIN_EHRLICHE_TEXTE.modellnutzungHinweis, /höchstens 30s|at most 30s old/)
    assert.match(ADMIN_EHRLICHE_TEXTE.modellnutzungEmpty, /keine aufgezeichneten Modellnutzungszeilen/)
    assert.match(ADMIN_EHRLICHE_TEXTE.modellnutzungEmpty, /kein Beleg für null Ausgaben/)
    assert.match(ADMIN_EHRLICHE_TEXTE.modellnutzungUnavailable, /kein leeres Kostenprotokoll/)
    assert.match(ADMIN_EHRLICHE_TEXTE.modellnutzungUnknown, /Unbekannt ist nicht leer/)
    assert.match(ADMIN_EHRLICHE_TEXTE.modellnutzungAvailable, /keine Finanz-, Budget- oder Limitaussage/)
    assert.match(ADMIN_EHRLICHE_TEXTE.modellnutzungFoundation, /keine Empfehlung, Provider zu aktivieren/)
    assert.match(ADMIN_EHRLICHE_TEXTE.modellnutzungNotzugang, /nicht zugeschrieben/)
    assert.match(ADMIN_EHRLICHE_TEXTE.modellnutzungOhnePruefung, /betrieb-lesen/)
    assert.equal(ADMIN_EHRLICHE_TEXTE.modellnutzungUntersuchen, 'Provider & Kosten öffnen')
    assert.doesNotMatch(ADMIN_EHRLICHE_TEXTE.modellnutzungAvailable, /gesund|Monatsbudget|Limit greift/)
  })
})
