import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { AuthApiError, AuthSessionMissingError } from '@supabase/supabase-js'
import { UI_SPRACHE_KEY, type UiSprache } from '@/lib/localization/ui-sprache'
import {
  uiEinstellungenImPortSpeichern,
  uiEinstellungenVomPortLesen,
  type UiEinstellungenAuthPort,
} from './speicher'

const BENUTZER_ID = '00000000-0000-4000-8000-000000000001'
const ANDERE_ID = '00000000-0000-4000-8000-000000000002'
const eingabe = (sprache: UiSprache = 'en') => ({ sprache, erwarteteBenutzerId: BENUTZER_ID })

function benutzerAntwort(metadaten: unknown, id: unknown = BENUTZER_ID) {
  return { data: { user: { id, user_metadata: metadaten } }, error: null }
}

function antwortFixture(antworten: unknown[], schreibantwort: unknown = benutzerAntwort({})) {
  const aufrufe: string[] = []
  const schreibwerte: Parameters<UiEinstellungenAuthPort['updateUser']>[0][] = []
  let leseIndex = 0
  const port: UiEinstellungenAuthPort = {
    istVerfuegbar: () => true,
    getUser: async () => {
      aufrufe.push('getUser')
      return antworten[leseIndex++]
    },
    updateUser: async (wert) => {
      aufrufe.push('updateUser')
      schreibwerte.push(structuredClone(wert))
      return schreibantwort
    },
  }
  return { port, aufrufe, schreibwerte }
}

/** Offline fixture for Auth's single-key metadata merge, not a live persistence proof. */
function mergeFixture(initial: Record<string, unknown> = {}) {
  const metadaten = structuredClone(initial)
  const aufrufe: string[] = []
  const schreibwerte: Parameters<UiEinstellungenAuthPort['updateUser']>[0][] = []
  const port: UiEinstellungenAuthPort = {
    istVerfuegbar: () => true,
    getUser: async () => {
      aufrufe.push('getUser')
      return benutzerAntwort(structuredClone(metadaten))
    },
    updateUser: async (wert) => {
      aufrufe.push('updateUser')
      schreibwerte.push(structuredClone(wert))
      Object.assign(metadaten, structuredClone(wert.data))
      return benutzerAntwort(structuredClone(metadaten))
    },
  }
  return { port, metadaten, aufrufe, schreibwerte }
}

describe('UI-Einstellungen: eigene Sitzung lesen', () => {
  test('returns valid persisted German and English without exposing unrelated metadata', async () => {
    for (const sprache of ['de', 'en'] as const) {
      const f = mergeFixture({ [UI_SPRACHE_KEY]: sprache, email: 'private@example.invalid', role: 'admin' })
      assert.deepEqual(await uiEinstellungenVomPortLesen(f.port), {
        status: 'bereit', benutzerId: BENUTZER_ID, sprache, gespeichert: true,
      })
      assert.deepEqual(f.aufrufe, ['getUser'])
    }
  })

  test('keeps missing or invalid metadata as an unsaved German fallback without repair', async () => {
    const ungueltig: unknown[] = [undefined, null, [], {}, 'en', { other: 'en' }, ...[
      undefined, null, '', 'EN', 'en-US', 'fr', 1, true, ['en'], { value: 'en' },
    ].map((wert) => ({ [UI_SPRACHE_KEY]: wert }))]
    for (const metadaten of ungueltig) {
      const f = antwortFixture([benutzerAntwort(metadaten)])
      assert.deepEqual(await uiEinstellungenVomPortLesen(f.port), {
        status: 'bereit', benutzerId: BENUTZER_ID, sprache: 'de', gespeichert: false,
      })
      assert.deepEqual(f.aufrufe, ['getUser'])
    }
  })

  test('does not evaluate metadata accessors or inherit a persisted preference', async () => {
    let getterAufrufe = 0
    const mitGetter = Object.defineProperty({}, UI_SPRACHE_KEY, {
      get: () => { getterAufrufe += 1; return 'en' },
    })
    for (const metadaten of [mitGetter, Object.create({ [UI_SPRACHE_KEY]: 'en' })]) {
      const f = antwortFixture([benutzerAntwort(metadaten)])
      assert.deepEqual(await uiEinstellungenVomPortLesen(f.port), {
        status: 'bereit', benutzerId: BENUTZER_ID, sprache: 'de', gespeichert: false,
      })
    }
    assert.equal(getterAufrufe, 0)
  })

  test('distinguishes an absent Auth session from an unavailable Auth response', async () => {
    const ohneSitzung = [
      { data: { user: null }, error: null },
      { data: { user: null }, error: new AuthSessionMissingError() },
      { data: { user: null }, error: new AuthApiError('private marker', 401, 'bad_jwt') },
    ]
    for (const antwort of ohneSitzung) {
      assert.deepEqual(await uiEinstellungenVomPortLesen(antwortFixture([antwort]).port), {
        status: 'nicht_angemeldet',
      })
    }
    const nichtVerfuegbar: unknown[] = [
      null, undefined, {}, { data: { user: null } }, { data: null, error: null },
      { data: {}, error: null }, benutzerAntwort({}, ''), benutzerAntwort({}, 42),
      { data: null, error: new AuthApiError('private marker', 503, undefined) },
      { ...benutzerAntwort({}), error: { message: 'private marker' } },
    ]
    for (const antwort of nichtVerfuegbar) {
      assert.deepEqual(await uiEinstellungenVomPortLesen(antwortFixture([antwort]).port), {
        status: 'nicht_verfuegbar',
      })
    }
  })

  test('contains thrown network and malformed-object failures without inventing a default', async () => {
    const f = mergeFixture()
    f.port.getUser = async () => { throw new Error('private network details') }
    assert.deepEqual(await uiEinstellungenVomPortLesen(f.port), { status: 'nicht_verfuegbar' })
    const antwort = new Proxy({}, { getOwnPropertyDescriptor: () => { throw new Error('private details') } })
    assert.deepEqual(await uiEinstellungenVomPortLesen(antwortFixture([antwort]).port), { status: 'nicht_verfuegbar' })
  })

  test('makes no Auth call for a forbidden target, including a throwing local guard', async () => {
    for (const istVerfuegbar of [() => false, () => { throw new Error('private config') }]) {
      const f = mergeFixture()
      f.port.istVerfuegbar = istVerfuegbar
      assert.deepEqual(await uiEinstellungenVomPortLesen(f.port), { status: 'nicht_verfuegbar' })
      assert.deepEqual(f.aufrufe, [])
    }
  })
})

describe('UI-Einstellungen: explizit speichern und bestaetigen', () => {
  test('merges exactly one key, preserves unrelated metadata and survives a fresh reader', async () => {
    const bestehend = { name: 'Fixture', appearance: { theme: 'dark' }, role: 'untrusted-value', currency: 'CHF' }
    const f = mergeFixture(bestehend)
    assert.deepEqual(await uiEinstellungenImPortSpeichern(f.port, eingabe()), {
      ok: true, benutzerId: BENUTZER_ID, sprache: 'en',
    })
    assert.deepEqual(f.aufrufe, ['getUser', 'updateUser', 'getUser'])
    assert.deepEqual(f.schreibwerte, [{ data: { jetnity_ui_locale_v1: 'en' } }])
    assert.deepEqual(f.metadaten, { ...bestehend, [UI_SPRACHE_KEY]: 'en' })
    assert.deepEqual(await uiEinstellungenVomPortLesen({ ...f.port }), {
      status: 'bereit', benutzerId: BENUTZER_ID, sprache: 'en', gespeichert: true,
    })
    assert.equal(f.schreibwerte.length, 1)
  })

  test('persists an explicitly selected default instead of treating fallback as saved', async () => {
    const f = mergeFixture()
    assert.deepEqual(await uiEinstellungenImPortSpeichern(f.port, eingabe('de')), {
      ok: true, benutzerId: BENUTZER_ID, sprache: 'de',
    })
    assert.deepEqual(f.schreibwerte, [{ data: { [UI_SPRACHE_KEY]: 'de' } }])
    assert.deepEqual(await uiEinstellungenVomPortLesen(f.port), {
      status: 'bereit', benutzerId: BENUTZER_ID, sprache: 'de', gespeichert: true,
    })
  })

  test('does not call Auth for malformed input or an extra target/authority field', async () => {
    for (const wert of [null, {}, { ...eingabe(), role: 'admin' }, { ...eingabe(), userId: ANDERE_ID }, { ...eingabe(), sprache: 'fr' }]) {
      const f = mergeFixture()
      assert.deepEqual(await uiEinstellungenImPortSpeichern(f.port, wert), { ok: false, code: 'eingabe' })
      assert.deepEqual(f.aufrufe, [])
    }
  })

  test('rejects stale expected identity without selecting that account for a write', async () => {
    const f = antwortFixture([benutzerAntwort({}, ANDERE_ID)])
    assert.deepEqual(await uiEinstellungenImPortSpeichern(f.port, eingabe()), { ok: false, code: 'konto_gewechselt' })
    assert.deepEqual(f.aufrufe, ['getUser'])
    assert.deepEqual(f.schreibwerte, [])
  })

  test('never writes when the verified initial read is absent or unavailable', async () => {
    const faelle = [
      { antwort: { data: { user: null }, error: new AuthSessionMissingError() }, code: 'nicht_angemeldet' },
      { antwort: { data: null, error: { status: 503 } }, code: 'nicht_verfuegbar' },
      { antwort: { data: { user: { id: null } }, error: null }, code: 'nicht_verfuegbar' },
    ]
    for (const { antwort, code } of faelle) {
      const f = antwortFixture([antwort])
      assert.deepEqual(await uiEinstellungenImPortSpeichern(f.port, eingabe()), { ok: false, code })
      assert.deepEqual(f.aufrufe, ['getUser'])
    }
  })

  test('captures selection and expected account before awaiting a session read', async () => {
    const f = mergeFixture()
    let freigeben!: (antwort: unknown) => void
    const wartet = new Promise<unknown>((resolve) => { freigeben = resolve })
    const normalLesen = f.port.getUser
    let erstesLesen = true
    f.port.getUser = () => {
      if (!erstesLesen) return normalLesen()
      erstesLesen = false
      return wartet
    }
    const original: { sprache: string; erwarteteBenutzerId: string } = eingabe()
    const speichern = uiEinstellungenImPortSpeichern(f.port, original)
    original.sprache = 'de'
    original.erwarteteBenutzerId = ANDERE_ID
    freigeben(benutzerAntwort({}))
    assert.deepEqual(await speichern, { ok: true, benutzerId: BENUTZER_ID, sprache: 'en' })
    assert.deepEqual(f.schreibwerte, [{ data: { [UI_SPRACHE_KEY]: 'en' } }])
  })

  test('distinguishes a missing session from an explicit write rejection', async () => {
    const fehlerFaelle = [
      { error: new AuthSessionMissingError(), code: 'nicht_angemeldet' },
      { error: new AuthApiError('private marker', 401, 'bad_jwt'), code: 'nicht_angemeldet' },
      ...[400, 403, 409, 422, 429].map((status) => ({ error: new AuthApiError('private marker', status, undefined), code: 'abgelehnt' })),
    ]
    for (const { error, code } of fehlerFaelle) {
      const f = antwortFixture([benutzerAntwort({})], { data: { user: null }, error })
      assert.deepEqual(await uiEinstellungenImPortSpeichern(f.port, eingabe()), { ok: false, code })
      assert.deepEqual(f.aufrufe, ['getUser', 'updateUser'])
      assert.equal(f.schreibwerte.length, 1)
    }
  })

  test('keeps server/transport/malformed write responses unconfirmed without retry', async () => {
    const antworten: unknown[] = [
      null, undefined, {}, { data: null },
      ...[0, 408, 499, 500, 503].map((status) => ({ data: null, error: { status, message: 'private marker' } })),
      { data: null, error: { message: 'private marker' } },
    ]
    for (const antwort of antworten) {
      // Passing undefined to the fixture would select its default successful ACK.
      const f = antwortFixture([benutzerAntwort({})], null)
      f.port.updateUser = async (wert) => {
        f.aufrufe.push('updateUser')
        f.schreibwerte.push(wert)
        return antwort
      }
      assert.deepEqual(await uiEinstellungenImPortSpeichern(f.port, eingabe()), { ok: false, code: 'nicht_bestaetigt' })
      assert.deepEqual(f.aufrufe, ['getUser', 'updateUser'])
      assert.equal(f.schreibwerte.length, 1)
    }
  })

  test('does not retry or falsely undo a write whose response was lost after persistence', async () => {
    const f = mergeFixture()
    const normalesUpdate = f.port.updateUser
    f.port.updateUser = async (wert) => {
      await normalesUpdate(wert)
      throw new Error('private response-lost details')
    }
    assert.deepEqual(await uiEinstellungenImPortSpeichern(f.port, eingabe()), { ok: false, code: 'nicht_bestaetigt' })
    assert.equal(f.metadaten[UI_SPRACHE_KEY], 'en')
    assert.deepEqual(f.aufrufe, ['getUser', 'updateUser'])
    assert.deepEqual(await uiEinstellungenVomPortLesen(f.port), {
      status: 'bereit', benutzerId: BENUTZER_ID, sprache: 'en', gespeichert: true,
    })
    assert.equal(f.schreibwerte.length, 1)
  })

  test('requires a valid same-account ACK and never claims success from it alone', async () => {
    const ungueltig = [
      { data: null, error: null },
      { data: { user: null }, error: null },
      benutzerAntwort({}, ''),
      { data: { user: {} }, error: null },
    ]
    for (const antwort of ungueltig) {
      const f = antwortFixture([benutzerAntwort({})], antwort)
      assert.deepEqual(await uiEinstellungenImPortSpeichern(f.port, eingabe()), { ok: false, code: 'nicht_bestaetigt' })
      assert.deepEqual(f.aufrufe, ['getUser', 'updateUser'])
    }
    const fremd = antwortFixture([benutzerAntwort({})], benutzerAntwort({ [UI_SPRACHE_KEY]: 'en' }, ANDERE_ID))
    assert.deepEqual(await uiEinstellungenImPortSpeichern(fremd.port, eingabe()), { ok: false, code: 'konto_gewechselt' })
    assert.deepEqual(fremd.aufrufe, ['getUser', 'updateUser'])
  })

  test('requires a fresh supported persisted value equal to the selection', async () => {
    for (const metadaten of [{}, { [UI_SPRACHE_KEY]: 'de' }, { [UI_SPRACHE_KEY]: 'EN' }, { [UI_SPRACHE_KEY]: null }]) {
      const f = antwortFixture([benutzerAntwort({}), benutzerAntwort(metadaten)], benutzerAntwort({ [UI_SPRACHE_KEY]: 'en' }))
      assert.deepEqual(await uiEinstellungenImPortSpeichern(f.port, eingabe()), { ok: false, code: 'nicht_bestaetigt' })
      assert.deepEqual(f.aufrufe, ['getUser', 'updateUser', 'getUser'])
      assert.equal(f.schreibwerte.length, 1)
    }
  })

  test('does not accept an unsaved German readback as a persisted German choice', async () => {
    const f = antwortFixture([benutzerAntwort({}), benutzerAntwort({})])
    assert.deepEqual(await uiEinstellungenImPortSpeichern(f.port, eingabe('de')), { ok: false, code: 'nicht_bestaetigt' })
    assert.equal(f.schreibwerte.length, 1)
  })

  test('treats failed or lost-session readback as uncertainty after a write', async () => {
    for (const antwort of [
      { data: { user: null }, error: null },
      { data: { user: null }, error: new AuthSessionMissingError() },
      { data: null, error: new AuthApiError('private marker', 503, undefined) },
      undefined,
    ]) {
      const f = antwortFixture([benutzerAntwort({}), antwort])
      assert.deepEqual(await uiEinstellungenImPortSpeichern(f.port, eingabe()), { ok: false, code: 'nicht_bestaetigt' })
      assert.deepEqual(f.aufrufe, ['getUser', 'updateUser', 'getUser'])
      assert.equal(f.schreibwerte.length, 1)
    }
  })

  test('rejects a switched readback account even if its preference matches', async () => {
    const f = antwortFixture([benutzerAntwort({}), benutzerAntwort({ [UI_SPRACHE_KEY]: 'en' }, ANDERE_ID)])
    assert.deepEqual(await uiEinstellungenImPortSpeichern(f.port, eingabe()), { ok: false, code: 'konto_gewechselt' })
    assert.deepEqual(f.aufrufe, ['getUser', 'updateUser', 'getUser'])
    assert.equal(f.schreibwerte.length, 1)
  })

  test('does not overwrite a later explicit save after a readback conflict', async () => {
    const f = mergeFixture()
    const normalesUpdate = f.port.updateUser
    f.port.updateUser = async (wert) => {
      const antwort = await normalesUpdate(wert)
      f.metadaten[UI_SPRACHE_KEY] = 'de'
      return antwort
    }
    assert.deepEqual(await uiEinstellungenImPortSpeichern(f.port, eingabe()), { ok: false, code: 'nicht_bestaetigt' })
    assert.equal(f.metadaten[UI_SPRACHE_KEY], 'de')
    assert.equal(f.schreibwerte.length, 1)
  })

  test('does not write if the target becomes unavailable while verifying identity', async () => {
    const f = mergeFixture()
    let erlaubt = true
    f.port.istVerfuegbar = () => erlaubt
    const normalLesen = f.port.getUser
    f.port.getUser = async () => {
      const antwort = await normalLesen()
      erlaubt = false
      return antwort
    }
    assert.deepEqual(await uiEinstellungenImPortSpeichern(f.port, eingabe()), { ok: false, code: 'nicht_verfuegbar' })
    assert.deepEqual(f.aufrufe, ['getUser'])
    assert.deepEqual(f.schreibwerte, [])
  })

  test('contains target loss after an update as unconfirmed without another Auth call', async () => {
    const f = mergeFixture()
    let erlaubt = true
    f.port.istVerfuegbar = () => erlaubt
    const normalesUpdate = f.port.updateUser
    f.port.updateUser = async (wert) => {
      const antwort = await normalesUpdate(wert)
      erlaubt = false
      return antwort
    }
    assert.deepEqual(await uiEinstellungenImPortSpeichern(f.port, eingabe()), { ok: false, code: 'nicht_bestaetigt' })
    assert.deepEqual(f.aufrufe, ['getUser', 'updateUser'])
    assert.equal(f.schreibwerte.length, 1)
  })
})
