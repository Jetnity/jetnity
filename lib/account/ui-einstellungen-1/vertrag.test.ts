import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { UI_SPRACHE_KEY, uiSpracheLesen } from '@/lib/localization/ui-sprache'
import { uiBenutzerIdLesen, uiEinstellungenEingabeLesen } from './vertrag'

const BENUTZER_ID = '00000000-0000-4000-8000-000000000001'
const eingabe = () => ({ sprache: 'en', erwarteteBenutzerId: BENUTZER_ID })

describe('UI-Sprache: begrenzter persistierter Vertrag', () => {
  test('accepts exactly the two documented persisted values', () => {
    assert.equal(UI_SPRACHE_KEY, 'jetnity_ui_locale_v1')
    assert.equal(uiSpracheLesen('de'), 'de')
    assert.equal(uiSpracheLesen('en'), 'en')
  })

  test('does not coerce, normalize or infer an unsupported language', () => {
    const ungueltig: unknown[] = [
      undefined, null, true, 1, '', 'DE', 'En', 'de-DE', 'en-US', 'fr', ' de', 'en ',
      'en\n', 'en\0', 'x'.repeat(10_000), ['en'], { sprache: 'en' }, Object('en'),
      { toString: () => 'en' },
    ]
    for (const wert of ungueltig) assert.equal(uiSpracheLesen(wert), null)
  })

  test('captures only the exact two-field payload without changing its input', () => {
    for (const sprache of ['de', 'en']) {
      const original = Object.freeze({ sprache, erwarteteBenutzerId: BENUTZER_ID })
      const gelesen = uiEinstellungenEingabeLesen(original)
      assert.deepEqual(gelesen, original)
      assert.notEqual(gelesen, original)
    }
  })

  test('keeps the captured selection stable if the caller later changes its object', () => {
    const original = eingabe()
    const gelesen = uiEinstellungenEingabeLesen(original)
    original.sprache = 'de'
    original.erwarteteBenutzerId = 'other-user'
    assert.deepEqual(gelesen, { sprache: 'en', erwarteteBenutzerId: BENUTZER_ID })
  })

  test('rejects absent fields, non-records and unsupported locales', () => {
    const ungueltig: unknown[] = [
      null, undefined, false, 'en', [], [eingabe()], new Date(), {},
      { sprache: 'en' }, { erwarteteBenutzerId: BENUTZER_ID },
      { sprache: 'en-US', erwarteteBenutzerId: BENUTZER_ID },
      { sprache: { value: 'en' }, erwarteteBenutzerId: BENUTZER_ID },
    ]
    for (const wert of ungueltig) assert.equal(uiEinstellungenEingabeLesen(wert), null)
  })

  test('rejects every additional field instead of accepting authority or another write target', () => {
    for (const name of ['id', 'userId', 'role', 'app_metadata', 'user_metadata', 'data', 'currency', 'access_token']) {
      assert.equal(uiEinstellungenEingabeLesen({ ...eingabe(), [name]: 'untrusted' }), null, name)
    }
    const symbolFeld = { ...eingabe(), [Symbol('extra')]: true }
    const verborgen = Object.defineProperty(eingabe(), 'role', { value: 'admin', enumerable: false })
    assert.equal(uiEinstellungenEingabeLesen(symbolFeld), null)
    assert.equal(uiEinstellungenEingabeLesen(verborgen), null)
  })

  test('does not read inherited fields or instance state as a serialized input', () => {
    class Eingabe {
      sprache = 'en'
      erwarteteBenutzerId = BENUTZER_ID
    }
    assert.equal(uiEinstellungenEingabeLesen(Object.create(eingabe())), null)
    assert.equal(uiEinstellungenEingabeLesen(new Eingabe()), null)
    assert.deepEqual(
      uiEinstellungenEingabeLesen(Object.assign(Object.create(null), eingabe())),
      eingabe(),
    )
  })

  test('rejects accessors without evaluating caller-controlled getters', () => {
    let aufrufe = 0
    const wert = {
      get sprache() { aufrufe += 1; return 'en' },
      erwarteteBenutzerId: BENUTZER_ID,
    }
    assert.equal(uiEinstellungenEingabeLesen(wert), null)
    assert.equal(aufrufe, 0)
  })

  test('contains invalid proxy traps instead of throwing a raw input error', () => {
    for (const handler of [
      { getPrototypeOf: () => { throw new Error('private input') } },
      { ownKeys: () => { throw new Error('private input') } },
      { getOwnPropertyDescriptor: () => { throw new Error('private input') } },
    ]) {
      assert.equal(uiEinstellungenEingabeLesen(new Proxy(eingabe(), handler)), null)
    }
  })

  test('bounds the comparison ID while leaving identity verification to Auth', () => {
    assert.equal(uiBenutzerIdLesen(BENUTZER_ID), BENUTZER_ID)
    assert.equal(uiBenutzerIdLesen('fixture-user'), 'fixture-user')
    assert.equal(uiBenutzerIdLesen('x'.repeat(128)), 'x'.repeat(128))
    const ungueltig: unknown[] = [undefined, null, 1, {}, '', ' ', ' user', 'user ', 'u\nser', 'u\0ser', 'u\u007fser', 'x'.repeat(129)]
    for (const wert of ungueltig) {
      assert.equal(uiBenutzerIdLesen(wert), null)
      assert.equal(uiEinstellungenEingabeLesen({ sprache: 'en', erwarteteBenutzerId: wert }), null)
    }
  })
})
