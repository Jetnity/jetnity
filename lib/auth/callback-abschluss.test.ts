import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createBrowserClient } from '@supabase/ssr'
import {
  CALLBACK_MELDUNG_ABBRUCH,
  CALLBACK_MELDUNG_LEER,
  CALLBACK_MELDUNG_NETZ,
  CALLBACK_MELDUNG_UNGUELTIG,
  PASSWORT_AKTUALISIEREN,
  liesPkceCodeVerifier,
  merkeCallbackLage,
  offeneCallbackLaeufe,
  schliesseAuthCallbackAb,
  verknuepfeCallbackSitzung,
  type CallbackAbschlussEingabe,
  type CallbackAuthClient,
} from './callback-abschluss'

const hier = dirname(fileURLToPath(import.meta.url))
const LEERER_VERIFIER = 'invalid request: both auth code and code verifier should be non-empty'

const jar = new Map<string, string>()
let href = 'https://jetnity.test/register'
const clients: Array<{ auth: { stopAutoRefresh: () => Promise<void> } }> = []
let pkce: Array<{ codeLeer: boolean; verifierLeer: boolean; code: string }> = []
let pkceSperre: Promise<void> | null = null
let pkceAngekommen = false
let userSperre: Promise<void> | null = null
let userAngekommen = 0
let ungueltigeCodes = new Set<string>()
let ungueltigeTokens = new Set<string>()
let pkceVerhalten: 'ok' | 'ungueltig' | 'netz' = 'ok'
let userCalls = 0
let fall = 0

const user = {
  id: '11111111-1111-1111-1111-111111111111',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'person@example.com',
  app_metadata: {},
  user_metadata: {},
  created_at: '2026-09-27T00:00:00.000Z',
}

function accessToken() {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + 3600,
    sub: user.id,
    email: user.email,
  })).toString('base64url')
  return `${header}.${payload}.sig`
}

function json(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: async () => body,
    text: async () => JSON.stringify(body),
  }
}

function sitzung() {
  return {
    access_token: accessToken(),
    refresh_token: 'refresh-token-value',
    expires_in: 3600,
    token_type: 'bearer',
    user,
  }
}

function installiereBrowser() {
  const location: Record<string, unknown> = {
    assign() {},
    replace() {},
  }
  Object.defineProperty(location, 'href', {
    configurable: true,
    get() { return href },
    set(value: string) { href = String(value) },
  })
  Object.defineProperty(location, 'hash', {
    configurable: true,
    get() { return new URL(href).hash },
    set(value: string) {
      const url = new URL(href)
      url.hash = String(value)
      href = url.toString()
    },
  })
  Object.defineProperty(location, 'search', {
    configurable: true,
    get() { return new URL(href).search },
  })
  const document = {
    visibilityState: 'hidden',
    hidden: true,
    addEventListener() {},
    removeEventListener() {},
  }
  Object.defineProperty(document, 'cookie', {
    configurable: true,
    get() {
      return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join('; ')
    },
    set(header: string) {
      const semi = header.indexOf(';')
      const pair = semi === -1 ? header : header.slice(0, semi)
      const eq = pair.indexOf('=')
      if (eq < 0) return
      const name = pair.slice(0, eq).trim()
      const value = pair.slice(eq + 1)
      const attrs = semi === -1 ? '' : header.slice(semi + 1)
      if (/max-age=0/i.test(attrs)) jar.delete(name)
      else jar.set(name, value)
    },
  })
  const history = {
    state: null as unknown,
    replaceState(state: unknown, _title: string, next: string) {
      history.state = state
      href = String(next)
    },
  }
  const speicher = new Map<string, string>()
  const localStorage = {
    getItem: (key: string) => (speicher.has(key) ? speicher.get(key)! : null),
    setItem: (key: string, value: string) => { speicher.set(key, String(value)) },
    removeItem: (key: string) => { speicher.delete(key) },
    clear: () => { speicher.clear() },
    key: (index: number) => [...speicher.keys()][index] ?? null,
    get length() { return speicher.size },
  }
  const fenster = {
    location,
    document,
    history,
    localStorage,
    addEventListener() {},
    removeEventListener() {},
  }
  Object.assign(globalThis, { window: fenster, document, history, localStorage })
  Object.defineProperty(globalThis, 'BroadcastChannel', {
    configurable: true,
    writable: true,
    value: undefined,
  })
}

function installiereFetch() {
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const body = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : null
    if (url.includes('/recover') || url.includes('/authorize') || url.includes('/logout')) return json(200, {})
    if (url.endsWith('/user') || url.includes('/user?')) {
      userCalls += 1
      userAngekommen += 1
      if (userSperre) await userSperre
      const auth = authorization(init)
      if ([...ungueltigeTokens].some((token) => auth.includes(token))) {
        return json(401, { msg: 'invalid', error: 'invalid_token', error_description: 'invalid' })
      }
      return json(200, user)
    }
    if (url.includes('grant_type=pkce')) {
      pkceAngekommen = true
      if (pkceSperre) await pkceSperre
      const codeLeer = !body?.auth_code
      const verifierLeer = !body?.code_verifier
      const authCode = typeof body?.auth_code === 'string' ? body.auth_code : ''
      pkce.push({ codeLeer, verifierLeer, code: authCode })
      if (pkceVerhalten === 'netz') throw new TypeError('Failed to fetch')
      if (pkceVerhalten === 'ungueltig' || codeLeer || verifierLeer || ungueltigeCodes.has(authCode)) {
        const msg = codeLeer || verifierLeer
          ? LEERER_VERIFIER
          : 'Invalid code or code verifier'
        return json(400, {
          error: 'invalid_request',
          error_code: codeLeer || verifierLeer ? 'bad_code_verifier' : 'invalid_grant',
          msg,
          error_description: msg,
        })
      }
      return json(200, sitzung())
    }
    if (url.includes('grant_type=refresh_token')) return json(200, sitzung())
    return json(404, { msg: 'unerwartet' })
  }) as unknown as typeof fetch
}

function authorization(init?: RequestInit): string {
  const headers = init?.headers
  if (!headers) return ''
  if (headers instanceof Headers) return headers.get('authorization') ?? headers.get('Authorization') ?? ''
  if (Array.isArray(headers)) {
    const fund = headers.find(([name]) => name.toLowerCase() === 'authorization')
    return fund ? String(fund[1]) : ''
  }
  const record = headers as Record<string, string>
  return record.Authorization ?? record.authorization ?? ''
}

function token(kennzeichen: string) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + 3600,
    sub: user.id,
    email: user.email,
    jti: kennzeichen,
  })).toString('base64url')
  return `${header}.${payload}.sig`
}

function supabaseUrl() {
  fall += 1
  return `https://cb${fall}.supabase.co`
}

function client(url: string) {
  const cookieHeader = (globalThis as { document: { cookie: string } }).document.cookie
  merkeCallbackLage(cookieHeader, href, url)
  const erzeugt = createBrowserClient(url, 'test-anon-key', { isSingleton: false })
  verknuepfeCallbackSitzung(url, erzeugt)
  clients.push(erzeugt)
  return erzeugt
}

async function anhalten() {
  await Promise.all(clients.splice(0).map(async (eintrag) => {
    await eintrag.auth.stopAutoRefresh()
  }))
}

function zurueck() {
  jar.clear()
  href = 'https://jetnity.test/register'
  pkce = []
  pkceSperre = null
  pkceAngekommen = false
  userSperre = null
  userAngekommen = 0
  ungueltigeCodes = new Set()
  ungueltigeTokens = new Set()
  pkceVerhalten = 'ok'
  userCalls = 0
}

async function pflanze(url: string, art: 'anmeldung' | 'wiederherstellung') {
  href = 'https://jetnity.test/register'
  const planter = client(url)
  await planter.auth.initialize()
  if (art === 'wiederherstellung') {
    const resultat = await planter.auth.resetPasswordForEmail('person@example.com', {
      redirectTo: 'https://jetnity.test/auth/update-password',
    })
    assert.equal(resultat.error, null)
  } else {
    const resultat = await planter.auth.signInWithOAuth({
      provider: 'google',
      options: { skipBrowserRedirect: true, redirectTo: 'https://jetnity.test/auth/callback' },
    })
    assert.equal(resultat.error, null)
  }
  await planter.auth.stopAutoRefresh()
  return planter
}

function eingabe(url: string, erzeugen: () => CallbackAuthClient): CallbackAbschlussEingabe {
  return {
    suche: new URL(href).search,
    hash: new URL(href).hash,
    cookieHeader: (globalThis as { document: { cookie: string } }).document.cookie,
    supabaseUrl: url,
    hrefLesen: () => href,
    adresseSchreiben: (naechstes) => {
      href = naechstes
    },
    client: erzeugen,
  }
}

describe('Auth-Callback PKCE', { concurrency: 1 }, () => {
  let warn: typeof console.warn
  let errorLog: typeof console.error

  before(() => {
    warn = console.warn
    errorLog = console.error
    console.warn = () => {}
    console.error = () => {}
    installiereBrowser()
    installiereFetch()
  })

  after(async () => {
    console.warn = warn
    console.error = errorLog
    await anhalten()
  })

  test('gesperrte SDK-Versionen sind die aus dem Auftrag', () => {
    const ssr = JSON.parse(readFileSync(join(hier, '../../node_modules/@supabase/ssr/package.json'), 'utf8')) as { version: string }
    const js = JSON.parse(readFileSync(join(hier, '../../node_modules/@supabase/supabase-js/package.json'), 'utf8')) as { version: string }
    const auth = JSON.parse(readFileSync(join(hier, '../../node_modules/@supabase/auth-js/package.json'), 'utf8')) as { version: string }
    assert.equal(ssr.version, '0.6.1')
    assert.equal(js.version, '2.57.2')
    assert.equal(auth.version, '2.71.1')
  })

  test('der Browser-Client schaltet die URL-Erkennung nicht ab', () => {
    const quelle = readFileSync(join(hier, '../supabase/client.ts'), 'utf8')
    const callback = readFileSync(join(hier, '../../app/auth/callback/CallbackClient.tsx'), 'utf8')
    const marker = quelle.indexOf('merkeCallbackLage(')
    const erzeugt = quelle.indexOf('_createBrowserClient(')
    const verknuepft = quelle.indexOf('verknuepfeCallbackSitzung(')
    assert.equal(marker >= 0 && erzeugt >= 0 && marker < erzeugt, true)
    assert.equal(verknuepft > erzeugt, true)
    assert.equal(quelle.includes('detectSessionInUrl'), false)
    assert.equal(callback.includes('exchangeCodeForSession'), false)
    assert.equal(callback.includes('clearTimeout'), true)
    assert.equal(callback.includes('schliesseAuthCallbackAb'), true)
  })

  test('alter zweiter Tausch scheitert am leeren Verifier, die erste Sitzung bleibt', async () => {
    zurueck()
    const url = supabaseUrl()
    await pflanze(url, 'anmeldung')
    href = 'https://jetnity.test/auth/callback?code=erster-code&next=%2Freisen'
    const callback = client(url)
    const zweiter = await callback.auth.exchangeCodeForSession('erster-code')
    const sitzungDanach = await callback.auth.getSession()
    assert.equal(pkce.length, 2)
    assert.equal(pkce[0]?.verifierLeer, false)
    assert.equal(pkce[1]?.verifierLeer, true)
    assert.equal(zweiter.error?.message, LEERER_VERIFIER)
    assert.equal(Boolean(sitzungDanach.data.session), true)
    assert.equal(new URL(href).searchParams.has('code'), false)
    await anhalten()
  })

  test('frischer Callback tauscht einmal und nimmt das erlaubte Ziel', async () => {
    zurueck()
    const url = supabaseUrl()
    await pflanze(url, 'anmeldung')
    href = 'https://jetnity.test/auth/callback?code=frischer-code&next=%2Freisen%2Fabc'
    const ergebnis = await schliesseAuthCallbackAb(eingabe(url, () => client(url)))
    assert.deepEqual(ergebnis, { art: 'ok', ziel: '/reisen/abc' })
    assert.equal(pkce.length, 1)
    assert.equal(pkce[0]?.verifierLeer, false)
    assert.equal(new URL(href).searchParams.has('code'), false)
    await anhalten()
  })

  test('bereits initialisierter Client tauscht danach genau einmal', async () => {
    zurueck()
    const url = supabaseUrl()
    const planter = await pflanze(url, 'anmeldung')
    href = 'https://jetnity.test/auth/callback?code=spa-code&next=%2Freisen'
    const ergebnis = await schliesseAuthCallbackAb(eingabe(url, () => planter))
    assert.deepEqual(ergebnis, { art: 'ok', ziel: '/reisen' })
    assert.equal(pkce.length, 1)
    assert.equal(pkce[0]?.verifierLeer, false)
    assert.equal(new URL(href).searchParams.has('code'), false)
    await anhalten()
  })

  test('Wiederherstellung liest den Verifier vor dem Tausch und bleibt auf dem Passwortpfad', async () => {
    zurueck()
    const url = supabaseUrl()
    await pflanze(url, 'wiederherstellung')
    const gelesen = liesPkceCodeVerifier(
      (globalThis as { document: { cookie: string } }).document.cookie,
      url,
    )
    assert.equal(gelesen?.split('/')[1], 'PASSWORD_RECOVERY')
    href = 'https://jetnity.test/auth/callback?code=recovery-code&next=%2Freisen'
    const ergebnis = await schliesseAuthCallbackAb(eingabe(url, () => client(url)))
    assert.deepEqual(ergebnis, { art: 'ok', ziel: PASSWORT_AKTUALISIEREN })
    assert.equal(pkce.length, 1)
    await anhalten()
  })

  test('die Passwortseite erkennt den Code weiter selbst', async () => {
    zurueck()
    const url = supabaseUrl()
    await pflanze(url, 'wiederherstellung')
    href = 'https://jetnity.test/auth/update-password?code=reset-code'
    const seite = client(url)
    await seite.auth.initialize()
    const gelesen = await seite.auth.getSession()
    assert.equal(pkce.length, 1)
    assert.equal(Boolean(gelesen.data.session), true)
    assert.equal(new URL(href).searchParams.has('code'), false)
    await anhalten()
  })

  test('fremdes Ziel fällt auf /reisen', async () => {
    zurueck()
    const url = supabaseUrl()
    await pflanze(url, 'anmeldung')
    href = 'https://jetnity.test/auth/callback?code=fremd-code&next=https%3A%2F%2Fevil.example%2Fphish'
    const ergebnis = await schliesseAuthCallbackAb(eingabe(url, () => client(url)))
    assert.deepEqual(ergebnis, { art: 'ok', ziel: '/reisen' })
    assert.equal(pkce.length, 1)
    await anhalten()
  })

  test('fehlender Verifier wird kein Erfolg, auch wenn schon eine Sitzung liegt', async () => {
    zurueck()
    const url = supabaseUrl()
    await pflanze(url, 'anmeldung')
    href = 'https://jetnity.test/auth/callback?code=sitzungs-code&next=%2Freisen'
    const erste = await schliesseAuthCallbackAb(eingabe(url, () => client(url)))
    assert.equal(erste.art, 'ok')
    href = 'https://jetnity.test/auth/callback?code=replay-code&next=%2Freisen'
    pkce = []
    const zweite = await schliesseAuthCallbackAb(eingabe(url, () => client(url)))
    assert.equal(zweite.art, 'fehler')
    if (zweite.art === 'fehler') {
      assert.equal(zweite.meldung, CALLBACK_MELDUNG_UNGUELTIG)
      assert.equal(zweite.meldung.includes(LEERER_VERIFIER), false)
      assert.equal(zweite.meldung.includes('replay-code'), false)
    }
    await anhalten()
  })

  test('ungültiger Code bleibt ein Fehler und wird nicht ein zweites Mal getauscht', async () => {
    zurueck()
    pkceVerhalten = 'ungueltig'
    const url = supabaseUrl()
    await pflanze(url, 'anmeldung')
    href = 'https://jetnity.test/auth/callback?code=kaputt-code&next=%2Freisen'
    const ergebnis = await schliesseAuthCallbackAb(eingabe(url, () => client(url)))
    assert.equal(ergebnis.art, 'fehler')
    if (ergebnis.art === 'fehler') {
      assert.equal(ergebnis.meldung, CALLBACK_MELDUNG_UNGUELTIG)
      assert.equal(ergebnis.meldung.includes('kaputt-code'), false)
      assert.equal(ergebnis.meldung.toLowerCase().includes('invalid'), false)
    }
    assert.equal(pkce.length, 1)
    await anhalten()
  })

  test('Netzausfall bleibt ein Verbindungsfehler', async () => {
    zurueck()
    pkceVerhalten = 'netz'
    const url = supabaseUrl()
    await pflanze(url, 'anmeldung')
    href = 'https://jetnity.test/auth/callback?code=netz-code&next=%2Freisen'
    const ergebnis = await schliesseAuthCallbackAb(eingabe(url, () => client(url)))
    assert.deepEqual(ergebnis, { art: 'fehler', meldung: CALLBACK_MELDUNG_NETZ })
    assert.equal(pkce.length, 1)
    await anhalten()
  })

  test('expliziter Callback-Fehler zeigt keinen Rohtext und tauscht nicht', async () => {
    zurueck()
    const url = supabaseUrl()
    href = 'https://jetnity.test/auth/callback?error=access_denied&error_description=raw-token-abcdef&next=%2Freisen'
    let erzeugt = 0
    const ergebnis = await schliesseAuthCallbackAb(eingabe(url, () => {
      erzeugt += 1
      return client(url)
    }))
    assert.deepEqual(ergebnis, { art: 'fehler', meldung: CALLBACK_MELDUNG_ABBRUCH })
    assert.equal(ergebnis.art === 'fehler' && ergebnis.meldung.includes('raw-token-abcdef'), false)
    assert.equal(pkce.length, 0)
    assert.equal(erzeugt, 0)
    await anhalten()
  })

  test('Hash-Recovery setzt die Sitzung und geht zum Passwort', async () => {
    zurueck()
    const url = supabaseUrl()
    const token = accessToken()
    href = `https://jetnity.test/auth/callback?next=%2Freisen#access_token=${token}&refresh_token=refresh-token-value&type=recovery`
    const ergebnis = await schliesseAuthCallbackAb(eingabe(url, () => client(url)))
    assert.deepEqual(ergebnis, { art: 'ok', ziel: PASSWORT_AKTUALISIEREN })
    assert.equal(pkce.length, 0)
    assert.equal(userCalls > 0, true)
    await anhalten()
  })

  test('ohne Code und ohne Sitzung bleibt der Callback ehrlich leer', async () => {
    zurueck()
    const url = supabaseUrl()
    href = 'https://jetnity.test/auth/callback'
    const ergebnis = await schliesseAuthCallbackAb(eingabe(url, () => client(url)))
    assert.deepEqual(ergebnis, { art: 'fehler', meldung: CALLBACK_MELDUNG_LEER })
    assert.equal(pkce.length, 0)
    await anhalten()
  })

  test('ohne Code übernimmt eine schon bestehende Sitzung das erlaubte Ziel', async () => {
    zurueck()
    const url = supabaseUrl()
    await pflanze(url, 'anmeldung')
    href = 'https://jetnity.test/auth/callback?code=basis-code&next=%2Freisen'
    const erste = await schliesseAuthCallbackAb(eingabe(url, () => client(url)))
    assert.equal(erste.art, 'ok')
    href = 'https://jetnity.test/auth/callback?next=%2Faccount'
    const zweite = await schliesseAuthCallbackAb(eingabe(url, () => client(url)))
    assert.deepEqual(zweite, { art: 'ok', ziel: '/account' })
    await anhalten()
  })

  test('ein zweiter Aufruf derselben Adresse tauscht nicht noch einmal', async () => {
    zurueck()
    const url = supabaseUrl()
    await pflanze(url, 'anmeldung')
    href = 'https://jetnity.test/auth/callback?code=doppelt-code&next=%2Freisen'
    let erzeugt = 0
    const parameter = eingabe(url, () => {
      erzeugt += 1
      return client(url)
    })
    const [erste, zweite] = await Promise.all([
      schliesseAuthCallbackAb(parameter),
      schliesseAuthCallbackAb(parameter),
    ])
    assert.deepEqual(erste, { art: 'ok', ziel: '/reisen' })
    assert.deepEqual(zweite, { art: 'ok', ziel: '/reisen' })
    assert.equal(pkce.length, 1)
    assert.equal(erzeugt, 1)
    assert.equal(offeneCallbackLaeufe(), 0)
    await anhalten()
  })

  test('derselbe Code nach gelöschter Sitzung wird neu geprüft und scheitert ehrlich', async () => {
    zurueck()
    const url = supabaseUrl()
    await pflanze(url, 'anmeldung')
    href = 'https://jetnity.test/auth/callback?code=gleicher-code&next=%2Freisen'
    const erste = await schliesseAuthCallbackAb(eingabe(url, () => client(url)))
    assert.deepEqual(erste, { art: 'ok', ziel: '/reisen' })
    assert.equal(offeneCallbackLaeufe(), 0)
    jar.clear()
    href = 'https://jetnity.test/auth/callback?code=gleicher-code&next=%2Freisen'
    pkce = []
    const zweite = await schliesseAuthCallbackAb(eingabe(url, () => client(url)))
    assert.equal(zweite.art, 'fehler')
    if (zweite.art === 'fehler') {
      assert.equal(zweite.meldung, CALLBACK_MELDUNG_UNGUELTIG)
      assert.equal(zweite.meldung.includes('gleicher-code'), false)
    }
    assert.equal(pkce.length, 1)
    assert.equal(pkce[0]?.verifierLeer, true)
    assert.equal(offeneCallbackLaeufe(), 0)
    await anhalten()
  })

  test('dieselbe code-freie Adresse liest eine später entstandene Sitzung neu', async () => {
    zurueck()
    const url = supabaseUrl()
    href = 'https://jetnity.test/auth/callback?next=%2Freisen'
    const sdk = client(url)
    const erste = await schliesseAuthCallbackAb(eingabe(url, () => sdk))
    assert.deepEqual(erste, { art: 'fehler', meldung: CALLBACK_MELDUNG_LEER })
    assert.equal(offeneCallbackLaeufe(), 0)
    const gesetzt = await sdk.auth.setSession({
      access_token: accessToken(),
      refresh_token: 'refresh-token-value',
    })
    assert.equal(gesetzt.error, null)
    let gelesen = 0
    const zweite = await schliesseAuthCallbackAb(eingabe(url, () => ({
      auth: {
        initialize: () => sdk.auth.initialize(),
        exchangeCodeForSession: (code: string) => sdk.auth.exchangeCodeForSession(code),
        setSession: (session: { access_token: string; refresh_token: string }) => sdk.auth.setSession(session),
        getSession: async () => {
          gelesen += 1
          return sdk.auth.getSession()
        },
      },
    })))
    assert.equal(gelesen, 1)
    assert.deepEqual(zweite, { art: 'ok', ziel: '/reisen' })
    await anhalten()
  })

  test('früher abgeschlossene Wiederherstellung bleibt auf dem Passwortpfad', async () => {
    zurueck()
    const url = supabaseUrl()
    await pflanze(url, 'wiederherstellung')
    href = 'https://jetnity.test/auth/callback?code=tl-early-recovery&next=%2Freisen'
    const sdk = client(url)
    await sdk.auth.initialize()
    assert.equal(new URL(href).searchParams.has('code'), false)
    const ergebnis = await schliesseAuthCallbackAb(eingabe(url, () => sdk))
    assert.deepEqual(ergebnis, { art: 'ok', ziel: PASSWORT_AKTUALISIEREN })
    assert.equal(pkce.length, 1)
    await anhalten()
  })

  test('laufende Wiederherstellung bleibt auf dem Passwortpfad, auch wenn der Verifier schon weg ist', async () => {
    zurueck()
    const url = supabaseUrl()
    await pflanze(url, 'wiederherstellung')
    href = 'https://jetnity.test/auth/callback?code=fenster-recovery&next=%2Freisen'
    let freigabe: () => void = () => {}
    pkceSperre = new Promise((resolve) => {
      freigabe = resolve
    })
    const sdk = client(url)
    for (let i = 0; i < 20 && !pkceAngekommen; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
    assert.equal(pkceAngekommen, true)
    jar.clear()
    href = 'https://jetnity.test/auth/callback?next=%2Freisen'
    const lauf = schliesseAuthCallbackAb(eingabe(url, () => sdk))
    freigabe()
    const ergebnis = await lauf
    assert.deepEqual(ergebnis, { art: 'ok', ziel: PASSWORT_AKTUALISIEREN })
    assert.equal(pkce.length, 1)
    assert.equal(pkce[0]?.verifierLeer, false)
    await anhalten()
  })

  test('eine laufende Wiederherstellung tauscht einmal und bleibt auf dem Passwortpfad', async () => {
    zurueck()
    const url = supabaseUrl()
    await pflanze(url, 'wiederherstellung')
    href = 'https://jetnity.test/auth/callback?code=laufende-recovery&next=%2Freisen'
    let freigabe: () => void = () => {}
    pkceSperre = new Promise((resolve) => {
      freigabe = resolve
    })
    const sdk = client(url)
    const parameter = eingabe(url, () => sdk)
    const erste = schliesseAuthCallbackAb(parameter)
    const zweite = schliesseAuthCallbackAb(parameter)
    assert.equal(offeneCallbackLaeufe(), 1)
    freigabe()
    const [links, rechts] = await Promise.all([erste, zweite])
    assert.deepEqual(links, { art: 'ok', ziel: PASSWORT_AKTUALISIEREN })
    assert.deepEqual(rechts, { art: 'ok', ziel: PASSWORT_AKTUALISIEREN })
    assert.equal(pkce.length, 1)
    assert.equal(pkce[0]?.verifierLeer, false)
    assert.equal(offeneCallbackLaeufe(), 0)
    await anhalten()
  })

  test('früher abgeschlossene Anmeldung bleibt auf dem erlaubten Ziel', async () => {
    zurueck()
    const url = supabaseUrl()
    await pflanze(url, 'anmeldung')
    href = 'https://jetnity.test/auth/callback?code=fruehe-anmeldung&next=%2Faccount'
    const sdk = client(url)
    await sdk.auth.initialize()
    assert.equal(new URL(href).searchParams.has('code'), false)
    const ergebnis = await schliesseAuthCallbackAb(eingabe(url, () => sdk))
    assert.deepEqual(ergebnis, { art: 'ok', ziel: '/account' })
    await anhalten()
  })

  test('eine spätere fremde Sitzung übernimmt die Wiederherstellung nicht', async () => {
    zurueck()
    const url = supabaseUrl()
    await pflanze(url, 'wiederherstellung')
    href = 'https://jetnity.test/auth/callback?code=tl-recovery-next&next=%2Freisen'
    const sdk = client(url)
    await sdk.auth.initialize()
    assert.deepEqual(await schliesseAuthCallbackAb(eingabe(url, () => sdk)), { art: 'ok', ziel: PASSWORT_AKTUALISIEREN })
    const abmeldung = await sdk.auth.signOut({ scope: 'local' })
    assert.equal(abmeldung.error, null)
    href = 'https://jetnity.test/login'
    const gesetzt = await sdk.auth.setSession({
      access_token: accessToken(),
      refresh_token: 'refresh-token-value',
    })
    assert.equal(gesetzt.error, null)
    href = 'https://jetnity.test/auth/callback?next=%2Freisen'
    assert.deepEqual(await schliesseAuthCallbackAb(eingabe(url, () => sdk)), { art: 'ok', ziel: '/reisen' })
    await anhalten()
  })

  test('die Passwortseite merkt keine Callback-Wiederherstellung', async () => {
    zurueck()
    const url = supabaseUrl()
    await pflanze(url, 'wiederherstellung')
    href = 'https://jetnity.test/auth/update-password?code=reset-direkt'
    const sdk = client(url)
    await sdk.auth.initialize()
    assert.equal(pkce.length, 1)
    assert.equal(new URL(href).searchParams.has('code'), false)
    const abmeldung = await sdk.auth.signOut({ scope: 'local' })
    assert.equal(abmeldung.error, null)
    const gesetzt = await sdk.auth.setSession({
      access_token: accessToken(),
      refresh_token: 'refresh-token-value',
    })
    assert.equal(gesetzt.error, null)
    href = 'https://jetnity.test/auth/callback?next=%2Freisen'
    const ergebnis = await schliesseAuthCallbackAb(eingabe(url, () => sdk))
    assert.deepEqual(ergebnis, { art: 'ok', ziel: '/reisen' })
    await anhalten()
  })

  test('zwei verschiedene Codes teilen sich keinen laufenden Versuch', async () => {
    zurueck()
    const url = supabaseUrl()
    await pflanze(url, 'anmeldung')
    href = 'https://jetnity.test/auth/callback?code=tl-valid-A&next=%2Freisen'
    let freigabe: () => void = () => {}
    pkceSperre = new Promise((resolve) => {
      freigabe = resolve
    })
    const sdk = client(url)
    const laufA = schliesseAuthCallbackAb(eingabe(url, () => sdk))
    for (let i = 0; i < 20 && !pkceAngekommen; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
    assert.equal(pkceAngekommen, true)
    href = 'https://jetnity.test/auth/callback?code=tl-invalid-B&next=%2Freisen'
    ungueltigeCodes.add('tl-invalid-B')
    const laufB = schliesseAuthCallbackAb(eingabe(url, () => sdk))
    assert.equal(offeneCallbackLaeufe(), 2)
    freigabe()
    const [a, b] = await Promise.all([laufA, laufB])
    assert.deepEqual(a, { art: 'ok', ziel: '/reisen' })
    assert.equal(b.art, 'fehler')
    if (b.art === 'fehler') {
      assert.equal(b.meldung, CALLBACK_MELDUNG_UNGUELTIG)
      assert.equal(b.meldung.includes('tl-invalid-B'), false)
    }
    assert.equal(pkce.some((eintrag) => eintrag.code === 'tl-invalid-B'), true)
    assert.equal(offeneCallbackLaeufe(), 0)
    await anhalten()
  })

  test('zwei verschiedene Hash-Links teilen sich keinen laufenden Versuch', async () => {
    zurueck()
    const url = supabaseUrl()
    href = 'https://jetnity.test/login'
    const sdk = client(url)
    await sdk.auth.initialize()
    const tokenA = token('hash-a')
    const tokenB = token('hash-b')
    ungueltigeTokens.add(tokenB)
    href = `https://jetnity.test/auth/callback?next=%2Freisen#access_token=${tokenA}&refresh_token=refresh-a&type=recovery`
    const parameterA = eingabe(url, () => sdk)
    href = `https://jetnity.test/auth/callback?next=%2Freisen#access_token=${tokenB}&refresh_token=refresh-b&type=recovery`
    const parameterB = eingabe(url, () => sdk)
    let freigabe: () => void = () => {}
    userSperre = new Promise((resolve) => {
      freigabe = resolve
    })
    const laufA = schliesseAuthCallbackAb(parameterA)
    for (let i = 0; i < 20 && userAngekommen < 1; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
    assert.equal(userAngekommen >= 1, true)
    const laufB = schliesseAuthCallbackAb(parameterB)
    assert.equal(offeneCallbackLaeufe(), 2)
    freigabe()
    const [a, b] = await Promise.all([laufA, laufB])
    assert.deepEqual(a, { art: 'ok', ziel: PASSWORT_AKTUALISIEREN })
    assert.equal(b.art, 'fehler')
    assert.equal(offeneCallbackLaeufe(), 0)
    await anhalten()
  })

  test('ein abgeschlossener Hash-Lauf bleibt nicht als Ergebnis liegen', async () => {
    zurueck()
    const url = supabaseUrl()
    const token = accessToken()
    href = `https://jetnity.test/auth/callback?next=%2Freisen#access_token=${token}&refresh_token=refresh-token-value&type=recovery`
    let erzeugt = 0
    const erste = await schliesseAuthCallbackAb(eingabe(url, () => {
      erzeugt += 1
      return client(url)
    }))
    assert.deepEqual(erste, { art: 'ok', ziel: PASSWORT_AKTUALISIEREN })
    assert.equal(erzeugt, 1)
    assert.equal(offeneCallbackLaeufe(), 0)
    const zweite = await schliesseAuthCallbackAb(eingabe(url, () => {
      erzeugt += 1
      return client(url)
    }))
    assert.equal(zweite.art, 'ok')
    assert.equal(erzeugt, 2)
    assert.equal(offeneCallbackLaeufe(), 0)
    await anhalten()
  })

  test('schon offener Client behält die Wiederherstellung nach dem Remount und verwirft sie bei einer neuen Sitzung', async () => {
    zurueck()
    const url = supabaseUrl()
    const sdk = await pflanze(url, 'wiederherstellung')
    href = 'https://jetnity.test/auth/callback?code=tl-spa-recovery&next=%2Freisen'
    const erste = await schliesseAuthCallbackAb(eingabe(url, () => sdk))
    assert.deepEqual(erste, { art: 'ok', ziel: PASSWORT_AKTUALISIEREN })
    assert.equal(new URL(href).searchParams.has('code'), false)
    const remount = await schliesseAuthCallbackAb(eingabe(url, () => sdk))
    assert.deepEqual(remount, { art: 'ok', ziel: PASSWORT_AKTUALISIEREN })
    const abmeldung = await sdk.auth.signOut({ scope: 'local' })
    assert.equal(abmeldung.error, null)
    href = 'https://jetnity.test/login'
    const gesetzt = await sdk.auth.setSession({
      access_token: accessToken(),
      refresh_token: 'refresh-token-value',
    })
    assert.equal(gesetzt.error, null)
    href = 'https://jetnity.test/auth/callback?next=%2Freisen'
    assert.deepEqual(await schliesseAuthCallbackAb(eingabe(url, () => sdk)), { art: 'ok', ziel: '/reisen' })
    await anhalten()
  })

  test('Hash-Wiederherstellung bleibt nach dem Remount an derselben Sitzung', async () => {
    zurueck()
    const url = supabaseUrl()
    href = 'https://jetnity.test/login'
    const sdk = client(url)
    await sdk.auth.initialize()
    const zugang = accessToken()
    href = `https://jetnity.test/auth/callback?next=%2Freisen#access_token=${zugang}&refresh_token=refresh-token-value&type=recovery`
    const erste = await schliesseAuthCallbackAb(eingabe(url, () => sdk))
    assert.deepEqual(erste, { art: 'ok', ziel: PASSWORT_AKTUALISIEREN })
    href = 'https://jetnity.test/auth/callback?next=%2Freisen'
    const remount = await schliesseAuthCallbackAb(eingabe(url, () => sdk))
    assert.deepEqual(remount, { art: 'ok', ziel: PASSWORT_AKTUALISIEREN })
    const abmeldung = await sdk.auth.signOut({ scope: 'local' })
    assert.equal(abmeldung.error, null)
    href = 'https://jetnity.test/login'
    const gesetzt = await sdk.auth.setSession({
      access_token: accessToken(),
      refresh_token: 'refresh-token-value',
    })
    assert.equal(gesetzt.error, null)
    href = 'https://jetnity.test/auth/callback?next=%2Freisen'
    assert.deepEqual(await schliesseAuthCallbackAb(eingabe(url, () => sdk)), { art: 'ok', ziel: '/reisen' })
    await anhalten()
  })

  for (const feld of ['error', 'error_description', 'error_code'] as const) {
    test(`ein laufender Code-Erfolg gilt nicht für denselben Code mit ${feld}`, async () => {
      zurueck()
      const url = supabaseUrl()
      await pflanze(url, 'anmeldung')
      href = 'https://jetnity.test/auth/callback?code=tl-shared-code&next=%2Freisen'
      let freigabe: () => void = () => {}
      pkceSperre = new Promise((resolve) => {
        freigabe = resolve
      })
      const sdk = client(url)
      const lauf = schliesseAuthCallbackAb(eingabe(url, () => sdk))
      for (let i = 0; i < 20 && !pkceAngekommen; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
      assert.equal(pkceAngekommen, true)
      const roh = feld === 'error' ? 'access_denied' : feld === 'error_description' ? 'roher-fehlertext' : 'otp_expired'
      href = `https://jetnity.test/auth/callback?code=tl-shared-code&next=%2Freisen&${feld}=${roh}`
      const fehlerLauf = schliesseAuthCallbackAb(eingabe(url, () => sdk))
      const schnell = await Promise.race([
        fehlerLauf.then((wert) => ({ fertig: true as const, wert })),
        new Promise<{ fertig: false }>((resolve) => setTimeout(() => resolve({ fertig: false }), 50)),
      ])
      assert.equal(schnell.fertig, true)
      if (schnell.fertig) {
        assert.equal(schnell.wert.art, 'fehler')
        if (schnell.wert.art === 'fehler') {
          assert.equal(schnell.wert.meldung, CALLBACK_MELDUNG_ABBRUCH)
          assert.equal(schnell.wert.meldung.includes(roh), false)
          assert.equal(schnell.wert.meldung.includes('tl-shared-code'), false)
        }
      }
      assert.equal(offeneCallbackLaeufe(), 1)
      freigabe()
      assert.deepEqual(await lauf, { art: 'ok', ziel: '/reisen' })
      assert.equal(offeneCallbackLaeufe(), 0)
      await anhalten()
    })

    test(`ein laufender Hash-Erfolg gilt nicht für denselben Hash mit ${feld}`, async () => {
      zurueck()
      const url = supabaseUrl()
      href = 'https://jetnity.test/login'
      const sdk = client(url)
      await sdk.auth.initialize()
      const zugang = token(`hash-${feld}`)
      href = `https://jetnity.test/auth/callback?next=%2Freisen#access_token=${zugang}&refresh_token=refresh-token-value&type=recovery`
      const parameter = eingabe(url, () => sdk)
      let freigabe: () => void = () => {}
      userSperre = new Promise((resolve) => {
        freigabe = resolve
      })
      const lauf = schliesseAuthCallbackAb(parameter)
      for (let i = 0; i < 20 && userAngekommen < 1; i += 1) {
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
      assert.equal(userAngekommen >= 1, true)
      const roh = feld === 'error' ? 'access_denied' : feld === 'error_description' ? 'roher-fehlertext' : 'otp_expired'
      href = `https://jetnity.test/auth/callback?next=%2Freisen#access_token=${zugang}&refresh_token=refresh-token-value&type=recovery&${feld}=${roh}`
      const fehlerLauf = schliesseAuthCallbackAb(eingabe(url, () => sdk))
      const schnell = await Promise.race([
        fehlerLauf.then((wert) => ({ fertig: true as const, wert })),
        new Promise<{ fertig: false }>((resolve) => setTimeout(() => resolve({ fertig: false }), 50)),
      ])
      assert.equal(schnell.fertig, true)
      if (schnell.fertig) {
        assert.equal(schnell.wert.art, 'fehler')
        if (schnell.wert.art === 'fehler') {
          assert.equal(schnell.wert.meldung, CALLBACK_MELDUNG_ABBRUCH)
          assert.equal(schnell.wert.meldung.includes(roh), false)
          assert.equal(schnell.wert.meldung.includes(zugang), false)
        }
      }
      assert.equal(offeneCallbackLaeufe(), 1)
      freigabe()
      assert.deepEqual(await lauf, { art: 'ok', ziel: PASSWORT_AKTUALISIEREN })
      assert.equal(offeneCallbackLaeufe(), 0)
      await anhalten()
    })
  }
})
