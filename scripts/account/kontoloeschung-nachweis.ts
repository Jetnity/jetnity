// scripts/account/kontoloeschung-nachweis.ts
//
// Development-only Nachweis für die V1-Kontolöschung.
// Läuft ausschließlich gegen den bestätigten Development-Branch.
// Ausgabe ist eine Allowlist aus Ja/Nein-Feldern. Keine Tokens, Pfade,
// Adressen oder Schlüssel.

import { randomBytes, createHmac, randomUUID } from 'node:crypto'

import { projektSchluessel, ziel } from '../auth/ziel'
import { ENTWICKLUNGS_PROJEKT_REF, PRODUKTIONS_PROJEKT_REF } from '../../lib/account/kontoloeschung-vertrag'

const BUCKET = 'jetnity-erasure-proof'
const API = 'https://api.supabase.com/v1'

type Bericht = {
  status: 'pass' | 'fail' | 'blockiert'
  grund: string
  entwicklung: boolean
  schema_kaskade: boolean
  security_events_spalte: boolean
  bestaetigung_abgelehnt: boolean
  sitzung_fehlt: boolean
  passwort_falsch: boolean
  mfa_umgehung_verweigert: boolean
  mfa_step_up_geloescht: boolean
  speicher_entfernt: boolean
  security_event_entfernt: boolean
  graph_kaskade: boolean
  veraltetes_token_ohne_autoritaet: boolean
  zweite_loeschung_kein_erfolg: boolean
  fremde_daten_unberuehrt: boolean
}

const LEER: Bericht = {
  status: 'blockiert',
  grund: 'offen',
  entwicklung: false,
  schema_kaskade: false,
  security_events_spalte: false,
  bestaetigung_abgelehnt: false,
  sitzung_fehlt: false,
  passwort_falsch: false,
  mfa_umgehung_verweigert: false,
  mfa_step_up_geloescht: false,
  speicher_entfernt: false,
  security_event_entfernt: false,
  graph_kaskade: false,
  veraltetes_token_ohne_autoritaet: false,
  zweite_loeschung_kein_erfolg: false,
  fremde_daten_unberuehrt: false,
}

class Abbruch extends Error {
  bericht: Bericht
  constructor(bericht: Bericht) {
    super('abbruch')
    this.bericht = bericht
  }
}

function ende(bericht: Bericht): never {
  throw new Abbruch(bericht)
}

function grundSicher(text: string): string {
  if (!/^[a-z0-9_]{1,40}$/.test(text)) return 'ausnahme'
  return text
}

function grundAusFehler(text: string): string {
  if (text === 'SUPABASE_ACCESS_TOKEN fehlt' || text === 'SUPABASE_PROJECT_REF fehlt') return 'token_fehlt'
  if (text.includes('(401)') || text.includes('HTTP 401')) return 'management_401'
  return grundSicher(text)
}

function uuid(wert: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(wert)
}

function zitat(wert: string): string {
  if (!uuid(wert)) throw new Error('id')
  return `'${wert}'`
}

function passwort(): string {
  return `Aa1!${randomBytes(18).toString('base64url')}`
}

function mail(): string {
  return `erasure-${randomBytes(8).toString('hex')}@example.com`
}

async function sql(ref: string, token: string, query: string): Promise<unknown[]> {
  const res = await fetch(`${API}/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) throw new Error('sql')
  const text = await res.text()
  return text ? (JSON.parse(text) as unknown[]) : []
}

async function auth(
  url: string,
  anon: string,
  geheim: string,
  pfad: string,
  methode: string,
  koerper?: unknown,
  bearer?: string,
): Promise<{ status: number; json: unknown }> {
  const res = await fetch(`${url}${pfad}`, {
    method: methode,
    headers: {
      apikey: bearer ? anon : geheim,
      Authorization: `Bearer ${bearer ?? geheim}`,
      ...(koerper ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(koerper ? { body: JSON.stringify(koerper) } : {}),
  })
  const text = await res.text()
  let json: unknown = null
  if (text) {
    try {
      json = JSON.parse(text)
    } catch {
      json = null
    }
  }
  return { status: res.status, json }
}

function zahl(wert: unknown): number | null {
  if (!wert || typeof wert !== 'object') return null
  const n = (wert as { n?: unknown }).n
  if (typeof n === 'number') return n
  if (typeof n === 'string' && /^\d+$/.test(n)) return Number(n)
  return null
}

async function zaehlen(ref: string, token: string, tabelle: string, id: string): Promise<number> {
  const erlaubt = new Set(['profiles', 'trips', 'account_travellers', 'account_visits', 'security_events'])
  if (!erlaubt.has(tabelle)) throw new Error('tabelle')
  const zeilen = await sql(
    ref,
    token,
    `select count(*)::int as n from public.${tabelle} where user_id = ${zitat(id)}`,
  )
  const n = zahl(zeilen[0])
  if (n === null) throw new Error('zahl')
  return n
}

async function funktion(
  url: string,
  anon: string,
  access: string | null,
  confirmation: string,
): Promise<string> {
  const res = await fetch(`${url}/functions/v1/account-delete-v1`, {
    method: 'POST',
    headers: {
      apikey: anon,
      'Content-Type': 'application/json',
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
    },
    body: JSON.stringify({ confirmation }),
  })
  const text = await res.text()
  if (text.length > 512) return 'unbekannt'
  try {
    const body = JSON.parse(text) as { klasse?: unknown }
    return typeof body.klasse === 'string' ? body.klasse : 'unbekannt'
  } catch {
    return res.status === 401 ? 'nicht_angemeldet' : 'unbekannt'
  }
}

function base32Decode(secret: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const rein = secret.replace(/=+$/g, '').replace(/\s/g, '').toUpperCase()
  let bits = ''
  for (const zeichen of rein) {
    const wert = alphabet.indexOf(zeichen)
    if (wert < 0) throw new Error('totp')
    bits += wert.toString(2).padStart(5, '0')
  }
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(Number.parseInt(bits.slice(i, i + 8), 2))
  return Buffer.from(bytes)
}

function totp(secret: string, zeit = Date.now()): string {
  const counter = Math.floor(zeit / 1000 / 30)
  const buf = Buffer.alloc(8)
  buf.writeBigUInt64BE(BigInt(counter))
  const hmac = createHmac('sha1', base32Decode(secret)).update(buf).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const code = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000
  return code.toString().padStart(6, '0')
}

async function anmelden(url: string, anon: string, email: string, password: string): Promise<string | null> {
  const res = await auth(url, anon, anon, '/auth/v1/token?grant_type=password', 'POST', { email, password }, anon)
  if (res.status !== 200 || !res.json || typeof res.json !== 'object') return null
  const access = (res.json as { access_token?: unknown }).access_token
  return typeof access === 'string' ? access : null
}

async function nutzerAnlegen(url: string, anon: string, geheim: string): Promise<{ id: string; email: string; password: string }> {
  const email = mail()
  const password = passwort()
  const erzeugt = await auth(url, anon, geheim, '/auth/v1/admin/users', 'POST', {
    email,
    password,
    email_confirm: true,
  })
  const id = erzeugt.json && typeof erzeugt.json === 'object' ? (erzeugt.json as { id?: unknown }).id : null
  if (erzeugt.status !== 200 && erzeugt.status !== 201) throw new Error('anlegen')
  if (typeof id !== 'string' || !uuid(id)) throw new Error('anlegen')
  return { id, email, password }
}

async function nutzerEntfernen(url: string, anon: string, geheim: string, ref: string, token: string, id: string) {
  if (!uuid(id)) return
  await sql(ref, token, `delete from public.security_events where user_id = ${zitat(id)}`).catch(() => undefined)
  await auth(url, anon, geheim, `/auth/v1/admin/users/${id}`, 'DELETE')
}

async function graphAnlegen(url: string, anon: string, access: string, ref: string, token: string, id: string) {
  await sql(
    ref,
    token,
    `insert into public.profiles (user_id, display_name, role, status)
     values (${zitat(id)}, 'Nachweis', 'user', 'active')
     on conflict (user_id) do nothing`,
  )
  const reise = await auth(url, anon, anon, '/rest/v1/rpc/reise_anlegen', 'POST', {
    _reise: {
      client_ref: `proof-${id.slice(0, 8)}`,
      title: 'Nachweis',
      origin: 'Zürich',
      start_date: '2026-10-01',
      end_date: '2026-10-03',
      travellers: 1,
      currency: 'CHF',
      budget_amount: null,
      pace: 'balanced',
      interests: [],
      travel_wish: null,
      stages: [
        {
          position: 1,
          name: 'Bern',
          country_code: 'CH',
          arrival_date: '2026-10-01',
          departure_date: '2026-10-03',
        },
      ],
      days: [],
      ungeplante: [],
    },
  }, access)
  if (reise.status !== 200 && reise.status !== 201) throw new Error('reise')
  const reisende = await auth(url, anon, anon, '/rest/v1/account_travellers', 'POST', {
    user_id: id,
    client_ref: randomUUID(),
    label: 'Nachweis',
  }, access)
  if (reisende.status !== 200 && reisende.status !== 201 && reisende.status !== 204) throw new Error('reisende')
  const besuch = await auth(url, anon, anon, '/rest/v1/rpc/account_visit_bestaetigen', 'POST', {
    _place_id: null,
    _country_code: 'CH',
    _jahr: null,
    _monat: null,
    _tag: null,
  }, access)
  if (besuch.status !== 200) throw new Error('besuch')
}

async function main() {
  const bericht: Bericht = { ...LEER }
  const ref = process.env.SUPABASE_PROJECT_REF ?? ''
  if (ref !== ENTWICKLUNGS_PROJEKT_REF || ref === PRODUKTIONS_PROJEKT_REF) {
    bericht.grund = 'projekt_ref'
    ende(bericht)
  }
  bericht.entwicklung = true
  const url = `https://${ENTWICKLUNGS_PROJEKT_REF}.supabase.co`
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (envUrl && envUrl !== url) {
    bericht.grund = 'url_abweichung'
    ende(bericht)
  }

  let token = ''
  let anon = ''
  let geheim = ''
  const erzeugt: string[] = []
  try {
    const zielRef = await ziel()
    if (zielRef.ref !== ENTWICKLUNGS_PROJEKT_REF) {
      bericht.grund = 'projekt_ref'
      ende(bericht)
    }
    token = zielRef.token
    const schluessel = await projektSchluessel(zielRef)
    anon = schluessel.anon
    geheim = schluessel.geheim

    const kaskade = await sql(
      ref,
      token,
      `select c.conrelid::regclass::text as tabelle, c.confdeltype as aktion
       from pg_constraint c
       where c.contype = 'f'
         and c.confrelid = 'auth.users'::regclass
         and c.conrelid::regclass::text in (
           'profiles', 'public.profiles',
           'trips', 'public.trips',
           'account_travellers', 'public.account_travellers',
           'account_visits', 'public.account_visits'
         )`,
    )
    const tabellen = new Set(
      kaskade
        .filter((zeile) => zeile && typeof zeile === 'object' && (zeile as { aktion?: string }).aktion === 'c')
        .map((zeile) => String((zeile as { tabelle?: string }).tabelle).replace(/^public\./, '')),
    )
    bericht.schema_kaskade =
      tabellen.has('profiles') &&
      tabellen.has('trips') &&
      tabellen.has('account_travellers') &&
      tabellen.has('account_visits')
    const spalte = await sql(
      ref,
      token,
      `select count(*)::int as n
       from information_schema.columns
       where table_schema = 'public' and table_name = 'security_events' and column_name = 'user_id'`,
    )
    bericht.security_events_spalte = zahl(spalte[0]) === 1
    if (!bericht.schema_kaskade || !bericht.security_events_spalte) {
      bericht.grund = 'schema'
      ende(bericht)
    }

    await sql(
      ref,
      token,
      `insert into storage.buckets (id, name, public)
       values ('${BUCKET}', '${BUCKET}', false)
       on conflict (id) do nothing;
       drop policy if exists jetnity_erasure_proof_insert on storage.objects;
       create policy jetnity_erasure_proof_insert on storage.objects
         for insert to authenticated
         with check (
           bucket_id = '${BUCKET}'
           and (storage.foldername(name))[1] = (select auth.uid())::text
         );`,
    )

    const zielNutzer = await nutzerAnlegen(url, anon, geheim)
    const fremd = await nutzerAnlegen(url, anon, geheim)
    const mfaNutzer = await nutzerAnlegen(url, anon, geheim)
    erzeugt.push(zielNutzer.id, fremd.id, mfaNutzer.id)

    const zielToken = await anmelden(url, anon, zielNutzer.email, zielNutzer.password)
    const fremdToken = await anmelden(url, anon, fremd.email, fremd.password)
    const mfaToken = await anmelden(url, anon, mfaNutzer.email, mfaNutzer.password)
    if (!zielToken || !fremdToken || !mfaToken) throw new Error('anmeldung')

    await graphAnlegen(url, anon, zielToken, ref, token, zielNutzer.id)
    await graphAnlegen(url, anon, fremdToken, ref, token, fremd.id)
    const zielEreignis = await auth(url, anon, geheim, '/rest/v1/security_events', 'POST', {
      type: 'account_erasure_proof',
      user_id: zielNutzer.id,
    })
    const fremdEreignis = await auth(url, anon, geheim, '/rest/v1/security_events', 'POST', {
      type: 'account_erasure_proof',
      user_id: fremd.id,
    })
    if (
      ![200, 201, 204].includes(zielEreignis.status) ||
      ![200, 201, 204].includes(fremdEreignis.status)
    ) {
      throw new Error('ereignis')
    }

    const hochladen = async (access: string, id: string) => {
      const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${id}/proof.bin`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access}`,
          apikey: anon,
          'Content-Type': 'text/plain',
        },
        body: 'proof',
      })
      if (!res.ok) throw new Error('upload')
    }
    await hochladen(zielToken, zielNutzer.id)
    await hochladen(fremdToken, fremd.id)

    const eigeneVorher = await speicherZahl(url, geheim, zielNutzer.id)
    const fremdeVorher = await speicherZahl(url, geheim, fremd.id)
    if (eigeneVorher !== 1 || fremdeVorher !== 1) throw new Error('speicher')

    const falsch = await funktion(url, anon, zielToken, 'NEIN')
    bericht.bestaetigung_abgelehnt = falsch === 'anfrage_ungueltig'
    const ohne = await funktion(url, anon, null, 'KONTO LÖSCHEN')
    bericht.sitzung_fehlt = ohne === 'nicht_angemeldet' || ohne === 'unbekannt'
    const falschesPasswort = await anmelden(url, anon, zielNutzer.email, 'falsch-Aa1!-passwort')
    bericht.passwort_falsch = falschesPasswort === null && (await zaehlen(ref, token, 'profiles', zielNutzer.id)) === 1

    const einschreiben = await auth(url, anon, anon, '/auth/v1/factors', 'POST', {
      factor_type: 'totp',
      friendly_name: 'proof',
    }, mfaToken)
    const faktor = einschreiben.json && typeof einschreiben.json === 'object' ? einschreiben.json as {
      id?: string
      totp?: { secret?: string }
    } : null
    if (!faktor?.id || !faktor.totp?.secret) throw new Error('mfa')
    const verify = await faktorBestaetigen(url, anon, mfaToken, faktor.id, faktor.totp.secret)
    if (verify.status !== 200) throw new Error('mfa')
    const mfaFrisch = await anmelden(url, anon, mfaNutzer.email, mfaNutzer.password)
    if (!mfaFrisch) throw new Error('mfa')
    const umgangen = await funktion(url, anon, mfaFrisch, 'KONTO LÖSCHEN')
    const nochDa = await auth(url, anon, anon, '/auth/v1/user', 'GET', undefined, mfaFrisch)
    bericht.mfa_umgehung_verweigert = umgangen === 'mfa_erforderlich' && nochDa.status === 200
    if (!bericht.mfa_umgehung_verweigert) throw new Error('mfa_umgehung')

    const fremdProfileVorher = await zaehlen(ref, token, 'profiles', fremd.id)
    const fremdReiseVorher = await zaehlen(ref, token, 'trips', fremd.id)
    const fremdReisendeVorher = await zaehlen(ref, token, 'account_travellers', fremd.id)
    const fremdBesuchVorher = await zaehlen(ref, token, 'account_visits', fremd.id)
    const fremdEreignisVorher = await zaehlen(ref, token, 'security_events', fremd.id)

    const frisch = await anmelden(url, anon, zielNutzer.email, zielNutzer.password)
    if (!frisch) throw new Error('reauth')
    const geloescht = await funktion(url, anon, frisch, 'KONTO LÖSCHEN')
    if (geloescht !== 'geloescht') throw new Error('loeschung')

    bericht.speicher_entfernt = (await speicherZahl(url, geheim, zielNutzer.id)) === 0
    bericht.security_event_entfernt = (await zaehlen(ref, token, 'security_events', zielNutzer.id)) === 0
    bericht.graph_kaskade =
      (await zaehlen(ref, token, 'profiles', zielNutzer.id)) === 0 &&
      (await zaehlen(ref, token, 'trips', zielNutzer.id)) === 0 &&
      (await zaehlen(ref, token, 'account_travellers', zielNutzer.id)) === 0 &&
      (await zaehlen(ref, token, 'account_visits', zielNutzer.id)) === 0
    const wiederUser = await auth(url, anon, anon, '/auth/v1/user', 'GET', undefined, frisch)
    const wiederReise = await auth(url, anon, anon, '/rest/v1/trips', 'POST', {
      title: 'veraltet',
      client_ref: 'stale',
    }, frisch)
    const zweite = await funktion(url, anon, frisch, 'KONTO LÖSCHEN')
    bericht.veraltetes_token_ohne_autoritaet = wiederUser.status !== 200 && wiederReise.status !== 201
    bericht.zweite_loeschung_kein_erfolg = zweite !== 'geloescht'
    bericht.fremde_daten_unberuehrt =
      (await zaehlen(ref, token, 'profiles', fremd.id)) === fremdProfileVorher &&
      (await zaehlen(ref, token, 'trips', fremd.id)) === fremdReiseVorher &&
      (await zaehlen(ref, token, 'account_travellers', fremd.id)) === fremdReisendeVorher &&
      (await zaehlen(ref, token, 'account_visits', fremd.id)) === fremdBesuchVorher &&
      (await zaehlen(ref, token, 'security_events', fremd.id)) === fremdEreignisVorher &&
      (await speicherZahl(url, geheim, fremd.id)) === 1 &&
      fremdProfileVorher > 0 &&
      fremdReiseVorher > 0 &&
      fremdReisendeVorher > 0 &&
      fremdBesuchVorher > 0 &&
      fremdEreignisVorher > 0

    const mfaNochmal = await anmelden(url, anon, mfaNutzer.email, mfaNutzer.password)
    if (!mfaNochmal) throw new Error('mfa')
    const nutzerStand = await auth(url, anon, anon, '/auth/v1/user', 'GET', undefined, mfaNochmal)
    const nutzerJson = nutzerStand.json && typeof nutzerStand.json === 'object' ? nutzerStand.json as {
      factors?: Array<{ id?: string; status?: string; factor_type?: string }>
    } : null
    const totpFaktor = (nutzerJson?.factors ?? []).find(
      (eintrag) => eintrag.status === 'verified' && eintrag.factor_type === 'totp' && eintrag.id === faktor.id,
    )
    if (!totpFaktor?.id || !faktor.totp?.secret) throw new Error('mfa')
    const gehoben = await faktorBestaetigen(url, anon, mfaNochmal, totpFaktor.id, faktor.totp.secret)
    const aalToken = gehoben.json && typeof gehoben.json === 'object'
      ? (gehoben.json as { access_token?: string }).access_token
      : null
    if (!aalToken) throw new Error('mfa')
    const mfaLoeschung = await funktion(url, anon, aalToken, 'KONTO LÖSCHEN')
    bericht.mfa_step_up_geloescht = mfaLoeschung === 'geloescht'

    const felder: Array<keyof Bericht> = [
      'bestaetigung_abgelehnt',
      'sitzung_fehlt',
      'passwort_falsch',
      'mfa_umgehung_verweigert',
      'mfa_step_up_geloescht',
      'speicher_entfernt',
      'security_event_entfernt',
      'graph_kaskade',
      'veraltetes_token_ohne_autoritaet',
      'zweite_loeschung_kein_erfolg',
      'fremde_daten_unberuehrt',
    ]
    const ok = felder.every((feld) => bericht[feld] === true)
    bericht.status = ok ? 'pass' : 'fail'
    bericht.grund = ok ? 'pass' : 'beleg'
    ende(bericht)
  } catch (fehler) {
    if (fehler instanceof Abbruch) throw fehler
    bericht.status = bericht.schema_kaskade ? 'fail' : 'blockiert'
    bericht.grund = grundAusFehler(fehler instanceof Error ? fehler.message : 'ausnahme')
    ende(bericht)
  } finally {
    if (token && anon && geheim) {
      for (const id of erzeugt) {
        await speicherEntfernen(url, geheim, id).catch(() => undefined)
        await nutzerEntfernen(url, anon, geheim, ref, token, id).catch(() => undefined)
      }
      await sql(
        ref,
        token,
        `drop policy if exists jetnity_erasure_proof_insert on storage.objects;
         delete from storage.buckets where id = '${BUCKET}' and not exists (
           select 1 from storage.objects where bucket_id = '${BUCKET}'
         );`,
      ).catch(() => undefined)
    }
  }
}

async function speicherZahl(url: string, geheim: string, id: string): Promise<number> {
  const res = await fetch(`${url}/storage/v1/object/list/${BUCKET}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${geheim}`,
      apikey: geheim,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prefix: id, limit: 100, offset: 0 }),
  })
  if (!res.ok) throw new Error('speicher')
  const daten = (await res.json()) as Array<{ owner?: string | null; owner_id?: string | null; id?: string | null }>
  return daten.filter((eintrag) => {
    const owner = (eintrag.owner ?? eintrag.owner_id ?? '').toLowerCase()
    return eintrag.id && owner === id.toLowerCase()
  }).length
}

function totpFenster(secret: string): string[] {
  const jetzt = Date.now()
  return [-1, 0, 1].map((delta) => totp(secret, jetzt + delta * 30_000))
}

async function faktorBestaetigen(
  url: string,
  anon: string,
  access: string,
  factorId: string,
  secret: string,
): Promise<{ status: number; json: unknown }> {
  let letzter: { status: number; json: unknown } = { status: 0, json: null }
  for (const code of totpFenster(secret)) {
    const challenge = await auth(url, anon, anon, `/auth/v1/factors/${factorId}/challenge`, 'POST', {}, access)
    const challengeId =
      challenge.json && typeof challenge.json === 'object' ? (challenge.json as { id?: string }).id : null
    if (!challengeId) continue
    letzter = await auth(url, anon, anon, `/auth/v1/factors/${factorId}/verify`, 'POST', {
      challenge_id: challengeId,
      code,
    }, access)
    if (letzter.status === 200) return letzter
  }
  return letzter
}

async function speicherEntfernen(url: string, geheim: string, id: string) {
  const res = await fetch(`${url}/storage/v1/object/list/${BUCKET}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${geheim}`,
      apikey: geheim,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prefix: id, limit: 100, offset: 0 }),
  })
  if (!res.ok) return
  const daten = (await res.json()) as Array<{ name?: string; id?: string | null }>
  const pfade = daten
    .filter((eintrag) => eintrag.id && eintrag.name && !eintrag.name.includes('/'))
    .map((eintrag) => `${id}/${eintrag.name}`)
  if (pfade.length === 0) return
  await fetch(`${url}/storage/v1/object/${BUCKET}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${geheim}`,
      apikey: geheim,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prefixes: pfade }),
  })
}

void main().catch((fehler: unknown) => {
  if (fehler instanceof Abbruch) {
    console.log(JSON.stringify(fehler.bericht))
    process.exit(fehler.bericht.status === 'pass' ? 0 : 1)
  }
  console.log(JSON.stringify({ ...LEER, grund: 'ausnahme' }))
  process.exit(1)
})
