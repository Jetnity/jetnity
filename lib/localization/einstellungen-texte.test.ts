import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import {
  EINSTELLUNGEN_SCHLUESSEL, EINSTELLUNGEN_TEXTE, einstellungenText, lokalisierterLoeschstatus,
} from './einstellungen-texte'
import { KONTO_LOESCHEN_BESTAETIGUNG } from '@/lib/account/kontoloeschung-vertrag'
import {
  KONTOLOESCHUNG_ANFANG, kontoloeschungStatusText, kontoloeschungWeiter,
  type KontoloeschungEreignis, type KontoloeschungPhase,
} from '@/lib/account/kontoloeschung-client'
import { exportFehlertext, exportErfolgtext, EXPORT_ERFOLG_TEXT } from '@/lib/account/account-home-export-1/export-antwort'

describe('Settings translation catalog', () => {
  test('every real catalog entry has nonempty German and English plain text', () => {
    assert.deepEqual(Object.keys(EINSTELLUNGEN_TEXTE.en).sort(), [...EINSTELLUNGEN_SCHLUESSEL].sort())
    assert.equal(new Set(EINSTELLUNGEN_SCHLUESSEL).size, EINSTELLUNGEN_SCHLUESSEL.length)
    for (const key of EINSTELLUNGEN_SCHLUESSEL) for (const sprache of ['de', 'en'] as const) {
      const text = einstellungenText(sprache, key)
      assert.ok(text.trim().length > 0, `${sprache}:${key}`)
      assert.doesNotMatch(text, /<\/?[a-z]|undefined|\bnull\b|\bTODO\b|\bTRANSLATE\b/i, `${sprache}:${key}`)
    }
    assert.match(einstellungenText('de', 'catalog.scope'), /Navigation.*Einreise/)
    assert.match(einstellungenText('en', 'catalog.scope'), /Navigation.*entry information/)
    assert.match(einstellungenText('en', 'catalog.workflow'), /not available yet/)
  })

  test('deletion presentation preserves all existing German state and error meanings', () => {
    const phasen: KontoloeschungPhase[] = ['bereit', 'arbeiten', 'mfa', 'fertig', 'fehler', 'nicht_unterstuetzt']
    for (const phase of phasen) {
      assert.equal(lokalisierterLoeschstatus('de', phase, null), kontoloeschungStatusText({ ...KONTOLOESCHUNG_ANFANG, phase }))
      assert.ok(lokalisierterLoeschstatus('en', phase, null).length > 0)
    }
    const ereignisse: KontoloeschungEreignis[] = [
      { typ: 'bestaetigung_ungueltig' }, { typ: 'sitzung' }, { typ: 'passwort' }, { typ: 'rate' },
      { typ: 'mfa_code' }, { typ: 'mfa_erforderlich' }, { typ: 'oauth' }, { typ: 'veraltet' },
      { typ: 'nicht_gefunden' }, { typ: 'aufraeumen' }, { typ: 'teilweise' }, { typ: 'umgebung' },
      { typ: 'netz' }, { typ: 'unbekannt' },
    ]
    for (const event of ereignisse) {
      const zustand = kontoloeschungWeiter(KONTOLOESCHUNG_ANFANG, event)
      assert.ok(zustand.fehler, event.typ)
      assert.equal(lokalisierterLoeschstatus('de', zustand.phase, zustand.fehler.code), kontoloeschungStatusText(zustand), event.typ)
      assert.ok(lokalisierterLoeschstatus('en', zustand.phase, zustand.fehler.code).length > 0)
    }
    for (const sprache of ['de', 'en'] as const) {
      assert.ok(einstellungenText(sprache, 'delete.confirmLabel').includes(KONTO_LOESCHEN_BESTAETIGUNG))
      assert.ok(einstellungenText(sprache, 'delete.error.bestaetigung').includes(KONTO_LOESCHEN_BESTAETIGUNG))
    }
    assert.match(einstellungenText('en', 'delete.error.teilweise'), /not been confirmed.*may already have been removed/)
    assert.match(einstellungenText('en', 'delete.error.mfa_erforderlich'), /two-factor.*not deleted/)
  })

  test('English export statuses preserve failure, timeout, file handoff and scope distinctions', () => {
    for (const status of [401, 503, 500, 403, 'unlesbar', 'frist', 'abbruch'] as const) {
      assert.match(exportFehlertext(status, 'en'), /Nothing was downloaded/)
      assert.notEqual(exportFehlertext(status, 'en'), exportFehlertext(status, 'de'))
    }
    assert.match(exportFehlertext('frist', 'en'), /only when you explicitly request/)
    assert.match(exportFehlertext(401, 'en'), /remain in settings/)
    assert.equal(exportErfolgtext('de'), EXPORT_ERFOLG_TEXT)
    assert.match(exportErfolgtext('en'), /handed to your browser.*does not check.*not as a single atomic snapshot.*does not delete/)
    assert.match(einstellungenText('en', 'export.exclusion'), /language.*not included/)
  })

  test('save uncertainty and partial language coverage are explained in both languages', () => {
    assert.match(einstellungenText('de', 'language.unconfirmed'), /bereits gespeichert.*nichts automatisch wiederholt/)
    assert.match(einstellungenText('en', 'language.unconfirmed'), /may already have been saved.*nothing is retried automatically/)
    assert.match(einstellungenText('de', 'language.scope'), /Andere Bereiche und die Navigation.*Deutsch/)
    assert.match(einstellungenText('en', 'language.scope'), /Other areas and navigation remain in German/)
    assert.match(einstellungenText('de', 'language.browser'), /nur in diesem Browser/)
    assert.match(einstellungenText('en', 'language.default'), /have not saved/)
  })
})
