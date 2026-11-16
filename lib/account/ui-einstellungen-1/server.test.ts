import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { UI_SPRACHE_KEY } from '@/lib/localization/ui-sprache'
import { uiEinstellungenNeuLaden, uiEinstellungenSpeichern } from './aktionen'
import {
  uiEinstellungenFuerSeite,
  uiEinstellungenServerMitPorts,
  uiEinstellungenZielErlaubt,
} from './server'
import type { UiEinstellungenAuthPort } from './speicher'

const DEV_URL = 'https://yfvbxvijcorffwxbxahl.supabase.co'
const PROD_URL = 'https://qscbgcdmivbbnzrcyegn.supabase.co'
const PROJEKT = 'prj_wTTVawPItEO7a4HihEmaU3PsuaXM'
const BENUTZER_ID = '00000000-0000-4000-8000-000000000001'
const ANDERE_ID = '00000000-0000-4000-8000-000000000002'
type Umgebung = Parameters<typeof uiEinstellungenZielErlaubt>[0]
type Auth = Pick<UiEinstellungenAuthPort, 'getUser' | 'updateUser'>

function preview(aenderungen: Partial<Umgebung> = {}): Umgebung {
  return {
    factoryUrl: DEV_URL,
    laufzeitUrl: DEV_URL,
    oeffentlicherSchluesselVorhanden: true,
    vercel: '1',
    vercelUmgebung: 'preview',
    vercelZiel: 'preview',
    vercelProjekt: PROJEKT,
    nodeUmgebung: 'production',
    uiAudit: undefined,
    ...aenderungen,
  }
}

function lokal(aenderungen: Partial<Umgebung> = {}): Umgebung {
  return preview({
    factoryUrl: 'http://127.0.0.1:54321',
    laufzeitUrl: 'http://127.0.0.1:54321',
    vercel: undefined,
    vercelUmgebung: undefined,
    vercelZiel: undefined,
    vercelProjekt: undefined,
    nodeUmgebung: 'test',
    uiAudit: '1',
    ...aenderungen,
  })
}

function serverFixture(start: Umgebung = preview()) {
  let umgebung = start
  let benutzerId = BENUTZER_ID
  const metadaten: Record<string, unknown> = { other: 'private display data' }
  const aufrufe: string[] = []
  const schreibwerte: Parameters<Auth['updateUser']>[0][] = []
  const auth: Auth = {
    async getUser() {
      assert.equal(this, auth, 'the adapter must retain the Auth method receiver')
      aufrufe.push('getUser')
      return { data: { user: { id: benutzerId, user_metadata: structuredClone(metadaten) } }, error: null }
    },
    async updateUser(wert) {
      assert.equal(this, auth, 'the adapter must retain the Auth method receiver')
      aufrufe.push('updateUser')
      schreibwerte.push(structuredClone(wert))
      Object.assign(metadaten, wert.data)
      return { data: { user: { id: benutzerId, user_metadata: structuredClone(metadaten) } }, error: null }
    },
  }
  const ports = {
    umgebung: () => umgebung,
    rscClient: async () => { aufrufe.push('rscFactory'); return { auth } },
    actionClient: async () => { aufrufe.push('actionFactory'); return { auth } },
  }
  return {
    ports, auth, aufrufe, schreibwerte, metadaten,
    setUmgebung: (wert: Umgebung) => { umgebung = wert },
    setBenutzer: (wert: string) => { benutzerId = wert },
    server: uiEinstellungenServerMitPorts(ports),
  }
}

describe('UI-Einstellungen: Zielbindung vor Clientkonstruktion', () => {
  test('supports the exact Preview/Dev and later Production/Prod configuration', () => {
    assert.equal(uiEinstellungenZielErlaubt(preview()), true)
    assert.equal(uiEinstellungenZielErlaubt(preview({
      factoryUrl: PROD_URL, laufzeitUrl: PROD_URL,
      vercelUmgebung: 'production', vercelZiel: 'production',
    })), true)
  })

  test('rejects cross-environment, foreign and non-exact hosted URLs', () => {
    for (const url of [
      PROD_URL, 'https://foreign-project.supabase.co', `${DEV_URL}/`, `${DEV_URL}:443`,
      `${DEV_URL}?target=dev`, `${DEV_URL}#dev`, `${DEV_URL}/auth/v1`,
      'http://yfvbxvijcorffwxbxahl.supabase.co', 'https://user@yfvbxvijcorffwxbxahl.supabase.co',
      'https://yfvbxvijcorffwxbxahl.supabase.co.example.invalid', 'http://127.0.0.1:54321', '',
    ]) {
      assert.equal(uiEinstellungenZielErlaubt(preview({ factoryUrl: url, laufzeitUrl: url })), false, url)
    }
    assert.equal(uiEinstellungenZielErlaubt(preview({ vercelUmgebung: 'production', vercelZiel: 'production' })), false)
  })

  test('rejects a missing or inconsistent runtime/factory target and missing public key', () => {
    for (const aenderungen of [
      { factoryUrl: undefined }, { laufzeitUrl: undefined },
      { factoryUrl: 'https://foreign-project.supabase.co' }, { laufzeitUrl: PROD_URL },
      { factoryUrl: PROD_URL }, { oeffentlicherSchluesselVorhanden: false },
    ]) assert.equal(uiEinstellungenZielErlaubt(preview(aenderungen)), false)
  })

  test('requires both deployment labels and the existing project identity', () => {
    for (const aenderungen of [
      { vercel: undefined }, { vercel: '0' }, { vercel: 'true' },
      { vercelProjekt: undefined }, { vercelProjekt: '' }, { vercelProjekt: 'other-project' },
      { vercelUmgebung: undefined }, { vercelZiel: undefined },
      { vercelUmgebung: 'development' }, { vercelZiel: 'development' },
      { vercelUmgebung: 'production' }, { vercelZiel: 'production' },
      { vercelUmgebung: 'custom' }, { vercelZiel: 'custom' },
    ]) assert.equal(uiEinstellungenZielErlaubt(preview(aenderungen)), false, JSON.stringify(aenderungen))
  })

  test('permits only explicitly enabled local fixtures on loopback with a port', () => {
    for (const nodeUmgebung of ['test', 'development']) {
      for (const url of ['http://127.0.0.1:54321', 'http://localhost:54321', 'http://[::1]:54321']) {
        assert.equal(uiEinstellungenZielErlaubt(lokal({ nodeUmgebung, factoryUrl: url, laufzeitUrl: url })), true)
      }
    }
  })

  test('does not turn the audit flag into access to a hosted or non-loopback target', () => {
    for (const url of [
      DEV_URL, PROD_URL, 'https://foreign-project.supabase.co', 'http://192.168.1.1:54321',
      'http://localhost.example.invalid:54321', 'https://localhost:54321',
      'http://127.0.0.1', 'http://127.0.0.1:80', 'http://user@127.0.0.1:54321',
      'http://127.0.0.1:54321/auth/v1', 'http://127.0.0.1:54321?proxy=remote',
      'http://127.0.0.1:54321#remote', 'not a URL',
    ]) assert.equal(uiEinstellungenZielErlaubt(lokal({ factoryUrl: url, laufzeitUrl: url })), false, url)
  })

  test('rejects implicit local use, local production and ambiguous deployment markers', () => {
    for (const aenderungen of [
      { uiAudit: undefined }, { uiAudit: 'true' }, { uiAudit: '0' },
      { nodeUmgebung: undefined }, { nodeUmgebung: 'production' },
      { vercel: '1' }, { vercel: '0' }, { vercel: '' },
      { vercelUmgebung: 'preview' }, { vercelZiel: 'preview' }, { vercelProjekt: PROJEKT },
      { laufzeitUrl: 'http://localhost:54321' }, { oeffentlicherSchluesselVorhanden: false },
    ]) assert.equal(uiEinstellungenZielErlaubt(lokal(aenderungen)), false, JSON.stringify(aenderungen))
  })

  test('constructs no client and performs no Auth call on any blocked operation', async () => {
    const f = serverFixture(preview({ laufzeitUrl: PROD_URL }))
    assert.deepEqual(await f.server.fuerSeite(), { status: 'nicht_verfuegbar' })
    assert.deepEqual(await f.server.neuLaden(), { status: 'nicht_verfuegbar' })
    assert.deepEqual(await f.server.speichern({ sprache: 'en', erwarteteBenutzerId: BENUTZER_ID }), {
      ok: false, code: 'nicht_verfuegbar',
    })
    assert.deepEqual(f.aufrufe, [])
  })

  test('contains a throwing environment reader before any factory call', async () => {
    const f = serverFixture()
    f.ports.umgebung = () => { throw new Error('private environment data') }
    const server = uiEinstellungenServerMitPorts(f.ports)
    assert.deepEqual(await server.fuerSeite(), { status: 'nicht_verfuegbar' })
    assert.deepEqual(await server.neuLaden(), { status: 'nicht_verfuegbar' })
    assert.deepEqual(await server.speichern({ sprache: 'en', erwarteteBenutzerId: BENUTZER_ID }), {
      ok: false, code: 'nicht_verfuegbar',
    })
    assert.deepEqual(f.aufrufe, [])
  })
})

describe('UI-Einstellungen: eigene RSC- und Action-Adapter', () => {
  test('reads pages through the read-only-cookie factory and reloads through the mutable factory', async () => {
    const f = serverFixture()
    const standard = { status: 'bereit', benutzerId: BENUTZER_ID, sprache: 'de', gespeichert: false }
    assert.deepEqual(await f.server.fuerSeite(), standard)
    assert.deepEqual(f.aufrufe, ['rscFactory', 'getUser'])
    assert.deepEqual(await f.server.neuLaden(), standard)
    assert.deepEqual(f.aufrufe, ['rscFactory', 'getUser', 'actionFactory', 'getUser'])
    assert.deepEqual(f.schreibwerte, [])
  })

  test('saves through the mutable factory with a fresh same-user readback and exact payload', async () => {
    const f = serverFixture()
    assert.deepEqual(await f.server.speichern({ sprache: 'en', erwarteteBenutzerId: BENUTZER_ID }), {
      ok: true, benutzerId: BENUTZER_ID, sprache: 'en',
    })
    assert.deepEqual(f.aufrufe, ['actionFactory', 'getUser', 'updateUser', 'getUser'])
    assert.deepEqual(f.schreibwerte, [{ data: { jetnity_ui_locale_v1: 'en' } }])
    assert.deepEqual(f.metadaten, { other: 'private display data', [UI_SPRACHE_KEY]: 'en' })
    assert.deepEqual(await f.server.fuerSeite(), {
      status: 'bereit', benutzerId: BENUTZER_ID, sprache: 'en', gespeichert: true,
    })
    assert.deepEqual(f.aufrufe.slice(-2), ['rscFactory', 'getUser'])
  })

  test('allows the same adapter behavior in a later Production configuration using only injected fixtures', async () => {
    const f = serverFixture(preview({
      factoryUrl: PROD_URL, laufzeitUrl: PROD_URL, vercelUmgebung: 'production', vercelZiel: 'production',
    }))
    assert.deepEqual(await f.server.speichern({ sprache: 'en', erwarteteBenutzerId: BENUTZER_ID }), {
      ok: true, benutzerId: BENUTZER_ID, sprache: 'en',
    })
    assert.deepEqual(f.aufrufe, ['actionFactory', 'getUser', 'updateUser', 'getUser'])
  })

  test('rejects invalid payloads before either session factory is constructed', async () => {
    const f = serverFixture()
    for (const eingabe of [null, {}, { sprache: 'fr', erwarteteBenutzerId: BENUTZER_ID }, {
      sprache: 'en', erwarteteBenutzerId: BENUTZER_ID, role: 'admin',
    }]) assert.deepEqual(await f.server.speichern(eingabe), { ok: false, code: 'eingabe' })
    assert.deepEqual(f.aufrufe, [])
  })

  test('does not cache an identity or a client between requests', async () => {
    const f = serverFixture()
    assert.deepEqual(await f.server.fuerSeite(), {
      status: 'bereit', benutzerId: BENUTZER_ID, sprache: 'de', gespeichert: false,
    })
    f.setBenutzer(ANDERE_ID)
    assert.deepEqual(await f.server.neuLaden(), {
      status: 'bereit', benutzerId: ANDERE_ID, sprache: 'de', gespeichert: false,
    })
    assert.deepEqual(await f.server.speichern({ sprache: 'en', erwarteteBenutzerId: BENUTZER_ID }), {
      ok: false, code: 'konto_gewechselt',
    })
    assert.deepEqual(f.aufrufe, ['rscFactory', 'getUser', 'actionFactory', 'getUser', 'actionFactory', 'getUser'])
    assert.deepEqual(f.schreibwerte, [])
  })

  test('contains both factory failures without exposing errors or using the other factory', async () => {
    const f = serverFixture()
    f.ports.rscClient = async () => { f.aufrufe.push('rscFactory'); throw new Error('private RSC details') }
    f.ports.actionClient = async () => { f.aufrufe.push('actionFactory'); throw new Error('private action details') }
    const server = uiEinstellungenServerMitPorts(f.ports)
    assert.deepEqual(await server.fuerSeite(), { status: 'nicht_verfuegbar' })
    assert.deepEqual(await server.neuLaden(), { status: 'nicht_verfuegbar' })
    assert.deepEqual(await server.speichern({ sprache: 'en', erwarteteBenutzerId: BENUTZER_ID }), {
      ok: false, code: 'nicht_verfuegbar',
    })
    assert.deepEqual(f.aufrufe, ['rscFactory', 'actionFactory', 'actionFactory'])
  })

  test('rejects target drift during client construction before reading or updating Auth', async () => {
    const f = serverFixture()
    f.ports.actionClient = async () => {
      f.aufrufe.push('actionFactory')
      f.setUmgebung(preview({ laufzeitUrl: PROD_URL }))
      return { auth: f.auth }
    }
    const server = uiEinstellungenServerMitPorts(f.ports)
    assert.deepEqual(await server.speichern({ sprache: 'en', erwarteteBenutzerId: BENUTZER_ID }), {
      ok: false, code: 'nicht_verfuegbar',
    })
    assert.deepEqual(f.aufrufe, ['actionFactory'])
  })

  test('rejects target drift during identity verification before updating Auth', async () => {
    const f = serverFixture()
    const normalLesen = f.auth.getUser
    f.auth.getUser = async () => {
      const antwort = await normalLesen.call(f.auth)
      f.setUmgebung(preview({ laufzeitUrl: PROD_URL }))
      return antwort
    }
    assert.deepEqual(await f.server.speichern({ sprache: 'en', erwarteteBenutzerId: BENUTZER_ID }), {
      ok: false, code: 'nicht_verfuegbar',
    })
    assert.deepEqual(f.aufrufe, ['actionFactory', 'getUser'])
    assert.deepEqual(f.schreibwerte, [])
  })

  test('keeps a target change after persistence unconfirmed without another Auth request', async () => {
    const f = serverFixture()
    const normalSpeichern = f.auth.updateUser
    f.auth.updateUser = async (wert) => {
      const antwort = await normalSpeichern.call(f.auth, wert)
      f.setUmgebung(preview({ laufzeitUrl: PROD_URL }))
      return antwort
    }
    assert.deepEqual(await f.server.speichern({ sprache: 'en', erwarteteBenutzerId: BENUTZER_ID }), {
      ok: false, code: 'nicht_bestaetigt',
    })
    assert.deepEqual(f.aufrufe, ['actionFactory', 'getUser', 'updateUser'])
    assert.equal(f.schreibwerte.length, 1)
  })

  test('captures the payload before awaiting the mutable client factory', async () => {
    const f = serverFixture()
    let fortsetzen!: (wert: { auth: Auth }) => void
    f.ports.actionClient = () => new Promise((resolve) => { fortsetzen = resolve })
    const server = uiEinstellungenServerMitPorts(f.ports)
    const eingabe = { sprache: 'en', erwarteteBenutzerId: BENUTZER_ID }
    const speichert = server.speichern(eingabe)
    eingabe.sprache = 'de'
    eingabe.erwarteteBenutzerId = ANDERE_ID
    fortsetzen({ auth: f.auth })
    assert.deepEqual(await speichert, { ok: true, benutzerId: BENUTZER_ID, sprache: 'en' })
    assert.deepEqual(f.schreibwerte, [{ data: { [UI_SPRACHE_KEY]: 'en' } }])
  })

  test('keeps the actual page and Server Action exports closed for a foreign runtime target', async () => {
    const vorherigeUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const vorherigerFetch = globalThis.fetch
    let netzwerkAufrufe = 0
    try {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fixture-only-foreign.invalid'
      globalThis.fetch = async () => { netzwerkAufrufe += 1; throw new Error('network forbidden in this fixture') }
      assert.deepEqual(await uiEinstellungenFuerSeite(), { status: 'nicht_verfuegbar' })
      assert.deepEqual(await uiEinstellungenNeuLaden(), { status: 'nicht_verfuegbar' })
      assert.deepEqual(await uiEinstellungenSpeichern({ sprache: 'en', erwarteteBenutzerId: BENUTZER_ID }), {
        ok: false, code: 'nicht_verfuegbar',
      })
      assert.deepEqual(await uiEinstellungenSpeichern({ sprache: 'en', erwarteteBenutzerId: BENUTZER_ID, role: 'admin' }), {
        ok: false, code: 'eingabe',
      })
      assert.equal(netzwerkAufrufe, 0)
    } finally {
      globalThis.fetch = vorherigerFetch
      if (vorherigeUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
      else process.env.NEXT_PUBLIC_SUPABASE_URL = vorherigeUrl
    }
  })
})
