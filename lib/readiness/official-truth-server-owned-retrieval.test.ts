// lib/readiness/official-truth-server-owned-retrieval.test.ts
//
// Servereigene amtliche HTTPS-Lesung. Synthetische *.example-Quellen.
// DNS und HTTP sind eingespritzte Fakes. Kein Live-Netz, kein Provider,
// keine Annahme, kein Speicher.

import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, test } from 'node:test'

import { evidenceQuellenFingerprint } from '@/lib/readiness/evidence'
import type { OfficialTruthSourceCatalogTransport } from '@/lib/readiness/official-truth-source-catalog-server'
import {
  decideOfficialTruthServerOwnedRetrieval,
  loadOfficialTruthServerOwnedRetrieval,
  officialTruthServerOwnedRetrievalAdresseZulaessig,
  officialTruthServerOwnedRetrievalLookup,
  type OfficialTruthServerOwnedRetrievalAdresse,
  type OfficialTruthServerOwnedRetrievalErgebnis,
  type OfficialTruthServerOwnedRetrievalHttpErgebnis,
  type OfficialTruthServerOwnedRetrievalLookup,
} from '@/lib/readiness/official-truth-server-owned-retrieval'
import { quellenRegistryErstellen, quellenUrlAufloesen, type QuellenEingabe } from '@/lib/readiness/source-registry'

const DATEI = 'lib/readiness/official-truth-server-owned-retrieval.ts'
const AMTLICH = 'example-real-government'
const ANDERE = 'example-real-interior'
const ANBIETER = 'example-licensed-provider'
const AMTLICH_URL = 'https://www.gov.example/rules'
const JETZT = '2026-10-03T00:25:00.000Z'
const TEXT = 'official page line\nserver-owned'
const ERFOLG_SCHLUESSEL = [
  'canonicalUrl',
  'contentType',
  'redirectCount',
  'retrievedAt',
  'sourceContentHash',
  'sourceId',
  'sourceSnapshot',
  'status',
]

type Verbindung = {
  url: string
  address: string
  family: number
  headers: Record<string, string>
}

type Schritt = {
  status?: number
  headers?: Record<string, string>
  body?: string | Uint8Array
  stuecke?: Uint8Array[]
  location?: string
  haengen?: boolean
  lesen?: { gesehen: boolean; abgebrochen: boolean }
}

type Lauf = {
  ergebnis: OfficialTruthServerOwnedRetrievalErgebnis
  verbindungen: Verbindung[]
  dns: string[]
  katalog: number
  uhr: number
}

function datei(relativ: string): string {
  return readFileSync(join(process.cwd(), relativ), 'utf8')
}

function quellen(): QuellenEingabe[] {
  return [
    {
      sourceId: AMTLICH,
      sourceClass: 'official_authority',
      publisherName: 'Example Government',
      authorityName: 'Example Government',
      domains: ['gov.example'],
    },
    {
      sourceId: ANDERE,
      sourceClass: 'official_authority',
      publisherName: 'Example Interior',
      authorityName: 'Example Interior',
      domains: ['interior.example'],
    },
    {
      sourceId: ANBIETER,
      sourceClass: 'licensed_evidence_provider',
      publisherName: 'Example Provider',
      domains: ['provider.example'],
    },
  ]
}

function katalogZeile(eingabe: QuellenEingabe): Record<string, unknown> {
  return {
    source_id: eingabe.sourceId,
    source_class: eingabe.sourceClass,
    publisher_name: eingabe.publisherName,
    authority_name: eingabe.authorityName ?? null,
    domains: [...eingabe.domains],
  }
}

function hostAus(url: string): string {
  let host = new URL(url).hostname
  if (host.startsWith('[') && host.endsWith(']')) host = host.slice(1, -1)
  return host
}

function kopf(werte: Record<string, string>): { get(name: string): string | null } {
  const klein: Record<string, string> = {}
  for (const [name, wert] of Object.entries(werte)) klein[name.toLowerCase()] = wert
  return { get: (name) => klein[name.toLowerCase()] ?? null }
}

function bytes(wert: string | Uint8Array): Uint8Array {
  return typeof wert === 'string' ? new TextEncoder().encode(wert) : wert
}

function lookupWarten(
  lookup: OfficialTruthServerOwnedRetrievalLookup,
  hostname: string,
  all: boolean,
): Promise<{ code?: string; address?: unknown; family?: unknown }> {
  return new Promise((resolve) => {
    lookup(hostname, { all }, (error, address, family) => {
      resolve({ code: error?.code, address, family })
    })
  })
}

async function laufen(teil?: {
  eingabe?: unknown
  quellen?: readonly QuellenEingabe[]
  katalog?: 'ok' | 'missing' | 'fail' | 'throw'
  adressen?: (hostname: string) => readonly OfficialTruthServerOwnedRetrievalAdresse[] | 'throw'
  antwort?: (url: string) => Schritt
  timeoutMs?: number
  now?: () => Date
}): Promise<Lauf> {
  const verbindungen: Verbindung[] = []
  const dns: string[] = []
  let katalog = 0
  let uhr = 0
  const modus = teil?.katalog ?? 'ok'
  const liste = teil?.quellen ?? quellen()
  const transport: OfficialTruthSourceCatalogTransport = {
    async aufrufen(payload) {
      katalog += 1
      if (modus === 'throw') throw new Error('catalog down')
      if (modus === 'fail' || payload.operation !== 'read_registry') return { ok: false }
      return {
        ok: true,
        antwort: { ok: true, operation: 'read_registry', sources: liste.map(katalogZeile) },
      }
    },
  }
  const ergebnis = await decideOfficialTruthServerOwnedRetrieval(teil?.eingabe ?? { sourceId: AMTLICH, url: AMTLICH_URL }, {
    catalog: modus === 'missing' ? { env: {} } : { transport },
    now: () => {
      uhr += 1
      return teil?.now ? teil.now() : new Date(JETZT)
    },
    resolve: async (hostname) => {
      dns.push(hostname)
      const adressen = teil?.adressen ? teil.adressen(hostname) : [{ address: '8.8.8.8', family: 4 as const }]
      if (adressen === 'throw') throw new Error('dns down')
      return adressen
    },
    timeoutMs: teil?.timeoutMs,
    http: async (anfrage): Promise<OfficialTruthServerOwnedRetrievalHttpErgebnis> => {
      const gefunden = await lookupWarten(anfrage.lookup, hostAus(anfrage.url), false)
      if (gefunden.code) {
        if (gefunden.code === 'JETNITY_ADDRESS_NOT_PERMITTED') return { ok: false, reason: 'address_not_permitted' }
        if (gefunden.code === 'JETNITY_DNS_EMPTY') return { ok: false, reason: 'dns_empty' }
        return { ok: false, reason: 'dns_failed' }
      }
      if (typeof gefunden.address !== 'string') return { ok: false, reason: 'dns_failed' }
      verbindungen.push({
        url: anfrage.url,
        address: gefunden.address,
        family: Number(gefunden.family),
        headers: { ...anfrage.headers },
      })
      if (anfrage.signal.aborted) return { ok: false, reason: 'timeout' }
      const schritt = teil?.antwort ? teil.antwort(anfrage.url) : { body: TEXT, headers: { 'content-type': 'text/plain' } }
      if (schritt.haengen) {
        await new Promise<void>((resolve) => {
          if (anfrage.signal.aborted) resolve()
          else anfrage.signal.addEventListener('abort', () => resolve(), { once: true })
        })
        return { ok: false, reason: 'timeout' }
      }
      const spur = schritt.lesen
      const inhalt = schritt.stuecke ?? [bytes(schritt.body ?? TEXT)]
      return {
        ok: true,
        status: schritt.status ?? 200,
        headers: kopf({
          ...(schritt.location ? { location: schritt.location } : {}),
          ...(schritt.headers ?? {}),
        }),
        body: (async function* () {
          if (spur) spur.gesehen = true
          for (const stueck of inhalt) yield stueck
        })(),
        cancel() {
          if (spur) spur.abgebrochen = true
        },
      }
    },
  })
  return { ergebnis, verbindungen, dns, katalog, uhr }
}

function erfolg(lauf: Lauf): Extract<OfficialTruthServerOwnedRetrievalErgebnis, { status: 'server_owned_official_retrieval' }> {
  assert.equal(lauf.ergebnis.status, 'server_owned_official_retrieval')
  if (lauf.ergebnis.status !== 'server_owned_official_retrieval') throw new Error('unerwartet')
  return lauf.ergebnis
}

function grund(lauf: Lauf): string {
  assert.equal(lauf.ergebnis.status, 'blocked')
  if (lauf.ergebnis.status !== 'blocked') throw new Error('unerwartet')
  return lauf.ergebnis.reason
}

describe('official truth server-owned retrieval', () => {
  test('1 Registry, sourceClass, domains und blockedDomains scheitern vor Katalog und Netz', async () => {
    const felder = ['registry', 'sourceClass', 'domains', 'blockedDomains'] as const
    for (const feld of felder) {
      const wert = feld === 'sourceClass' ? 'official_authority' : feld === 'registry' ? { sources: [] } : ['not-a-government.example']
      const lauf = await laufen({ eingabe: { sourceId: AMTLICH, url: AMTLICH_URL, [feld]: wert } })
      assert.equal(grund(lauf), 'caller_authority_forbidden', feld)
      assert.equal(lauf.katalog, 0, feld)
      assert.equal(lauf.dns.length, 0, feld)
      assert.equal(lauf.verbindungen.length, 0, feld)
    }
  })

  test('2 Snapshot, Hash, Uhr, Content-Type, Redirect, DNS und Beleg scheitern vor dem Netz', async () => {
    const felder: Record<string, unknown> = {
      sourceSnapshot: TEXT,
      body: TEXT,
      sourceContentHash: 'a'.repeat(64),
      contentHash: 'b'.repeat(64),
      retrievedAt: JETZT,
      clock: JETZT,
      now: JETZT,
      contentType: 'text/html',
      redirect: [],
      redirects: [],
      dns: { address: '8.8.8.8' },
      address: '8.8.8.8',
      receipt: { ok: true },
      attestation: { ok: true },
      evidenceVersion: { versionId: 'ev1_x' },
      candidate: { proposal: {} },
      trustedRuleFact: { kind: 'requirement_effect' },
      witness: { status: 'authorized_preacceptance_witness' },
      reviewPacketKey: 'review-packet:v2:aa',
      model: 'gpt',
      suggestion: { effect: 'required' },
      decision: { effect: 'required' },
      credentials: 'secret',
      cookie: 'session=1',
      authorization: 'Bearer secret',
      headers: { cookie: 'session=1' },
      schemaFamily: 'html-table',
    }
    for (const [feld, wert] of Object.entries(felder)) {
      const lauf = await laufen({ eingabe: { sourceId: AMTLICH, url: AMTLICH_URL, [feld]: wert } })
      assert.equal(grund(lauf), 'caller_authority_forbidden', feld)
      assert.equal(lauf.katalog, 0, feld)
      assert.equal(lauf.verbindungen.length, 0, feld)
      assert.equal(JSON.stringify(lauf.ergebnis).includes('secret'), false, feld)
    }
  })

  test('3 ein fehlender oder scheiternder Katalog öffnet kein Netz', async () => {
    for (const katalog of ['missing', 'fail', 'throw'] as const) {
      const lauf = await laufen({ katalog })
      assert.equal(lauf.ergebnis.status, 'blocked', katalog)
      if (lauf.ergebnis.status === 'blocked') {
        assert.equal(lauf.ergebnis.reason, katalog === 'missing' ? 'catalog_not_configured' : 'catalog_failed')
      }
      assert.equal(lauf.dns.length, 0, katalog)
      assert.equal(lauf.verbindungen.length, 0, katalog)
    }
  })

  test('4 ein lizenzierter Anbieter erreicht das Netz nicht', async () => {
    const lauf = await laufen({
      eingabe: { sourceId: ANBIETER, url: 'https://provider.example/feed' },
    })
    assert.equal(grund(lauf), 'source_not_official_authority')
    assert.equal(lauf.katalog, 1)
    assert.equal(lauf.dns.length, 0)
    assert.equal(lauf.verbindungen.length, 0)
  })

  test('5 abweichende Quellenkennung und URL öffnen kein Netz', async () => {
    const lauf = await laufen({
      eingabe: { sourceId: AMTLICH, url: 'https://www.interior.example/rules' },
    })
    assert.equal(grund(lauf), 'url_source_mismatch')
    assert.equal(lauf.dns.length, 0)
    assert.equal(lauf.verbindungen.length, 0)
  })

  test('6 HTTP, Zugangsdaten, unregistrierte und gesperrte Hosts öffnen kein Netz', async () => {
    const faelle = [
      { url: 'http://www.gov.example/rules', reason: 'insecure_scheme' },
      { url: 'https://user:s3cret@www.gov.example/rules', reason: 'credentials' },
      { url: 'https://evil.example/rules', reason: 'unregistered_domain' },
    ]
    for (const fall of faelle) {
      const lauf = await laufen({ eingabe: { sourceId: AMTLICH, url: fall.url } })
      assert.equal(grund(lauf), fall.reason, fall.url)
      assert.equal(lauf.dns.length, 0, fall.url)
      assert.equal(lauf.verbindungen.length, 0, fall.url)
      assert.equal(JSON.stringify(lauf.ergebnis).includes('s3cret'), false)
    }
    const registry = quellenRegistryErstellen(quellen(), { blockedDomains: ['blocked.example'] })
    assert.equal(registry.ok, true)
    if (!registry.ok) return
    assert.deepEqual(quellenUrlAufloesen(registry.registry, 'https://www.blocked.example/rules'), {
      ok: false,
      reason: 'blocked_domain',
    })
    const text = datei(DATEI)
    assert.match(text, /quellenUrlAufloesen/)
    assert.match(text, /if \(!aufgeloest\.ok\) return \{ ok: false, reason: aufgeloest\.reason \}/)
  })

  test('7 localhost, .local und unsichere IP-Literale scheitern vor dem Netz', async () => {
    const faelle = [
      { url: 'https://localhost/rules', reason: 'invalid_url' },
      { url: 'https://foo.local/rules', reason: 'invalid_url' },
      { url: 'https://127.0.0.1/rules', reason: 'address_not_permitted' },
      { url: 'https://10.1.2.3/rules', reason: 'address_not_permitted' },
      { url: 'https://[::1]/rules', reason: 'address_not_permitted' },
      { url: 'https://0x7f000001/rules', reason: 'address_not_permitted' },
      { url: 'https://0177.0.0.1/rules', reason: 'address_not_permitted' },
    ]
    for (const fall of faelle) {
      const lauf = await laufen({ eingabe: { sourceId: AMTLICH, url: fall.url } })
      assert.equal(grund(lauf), fall.reason, fall.url)
      assert.equal(lauf.dns.length, 0, fall.url)
      assert.equal(lauf.verbindungen.length, 0, fall.url)
      assert.equal(JSON.stringify(lauf.ergebnis).includes('127.0.0.1'), false, fall.url)
    }
  })

  test('8 bis 13 Adressklassen und Lookup geben keine verworfene Adresse weiter', async () => {
    const oeffentlich = ['8.8.8.8', '1.1.1.1', '172.32.0.1', '192.167.1.1', '100.128.0.1', '11.0.0.1', '198.20.0.1']
    const gesperrt = [
      '0.0.0.0',
      '0.1.2.3',
      '10.0.0.1',
      '127.0.0.1',
      '127.255.255.1',
      '172.16.0.1',
      '172.31.255.255',
      '192.168.1.20',
      '169.254.1.1',
      '100.64.0.1',
      '100.127.255.255',
      '224.0.0.1',
      '239.255.255.255',
      '240.0.0.1',
      '255.255.255.255',
      '192.0.0.1',
      '192.0.2.1',
      '198.51.100.1',
      '203.0.113.1',
      '198.18.0.1',
      '198.19.255.255',
      '192.88.99.1',
    ]
    for (const adresse of oeffentlich) assert.equal(officialTruthServerOwnedRetrievalAdresseZulaessig(adresse), true, adresse)
    for (const adresse of gesperrt) assert.equal(officialTruthServerOwnedRetrievalAdresseZulaessig(adresse), false, adresse)

    assert.equal(officialTruthServerOwnedRetrievalAdresseZulaessig('2001:4860:4860::8888'), true)
    assert.equal(officialTruthServerOwnedRetrievalAdresseZulaessig('::ffff:8.8.8.8'), true)
    for (const adresse of ['::1', '::', 'fc00::1', 'fd12:3456:789a::1', 'fe80::1', 'ff02::1', 'fec0::1', '2001:db8::1']) {
      assert.equal(officialTruthServerOwnedRetrievalAdresseZulaessig(adresse), false, adresse)
    }
    assert.equal(officialTruthServerOwnedRetrievalAdresseZulaessig('::ffff:10.0.0.1'), false)
    assert.equal(officialTruthServerOwnedRetrievalAdresseZulaessig('::ffff:192.168.0.1'), false)
    assert.equal(officialTruthServerOwnedRetrievalAdresseZulaessig('::ffff:7f00:1'), false)
    assert.equal(officialTruthServerOwnedRetrievalAdresseZulaessig('2002:7f00:1::'), false)
    assert.equal(officialTruthServerOwnedRetrievalAdresseZulaessig('2002:808:808::'), true)
    assert.equal(officialTruthServerOwnedRetrievalAdresseZulaessig('64:ff9b::a00:1'), false)
    assert.equal(officialTruthServerOwnedRetrievalAdresseZulaessig('64:ff9b::808:808'), true)

    const gemischt = officialTruthServerOwnedRetrievalLookup(async () => [
      { address: '8.8.8.8', family: 4 },
      { address: '10.0.0.1', family: 4 },
    ])
    const mischung = await lookupWarten(gemischt, 'www.gov.example', true)
    assert.equal(mischung.code, 'JETNITY_ADDRESS_NOT_PERMITTED')
    assert.equal(mischung.address, undefined)

    const leer = await lookupWarten(
      officialTruthServerOwnedRetrievalLookup(async () => []),
      'www.gov.example',
      false,
    )
    assert.equal(leer.code, 'JETNITY_DNS_EMPTY')
    const stoerung = await lookupWarten(
      officialTruthServerOwnedRetrievalLookup(async () => {
        throw new Error('resolver failed')
      }),
      'www.gov.example',
      false,
    )
    assert.equal(stoerung.code, 'JETNITY_DNS_FAILED')
    let literalAufgerufen = false
    const literal = await lookupWarten(
      officialTruthServerOwnedRetrievalLookup(async () => {
        literalAufgerufen = true
        return [{ address: '8.8.8.8', family: 4 }]
      }),
      '10.0.0.1',
      false,
    )
    assert.equal(literal.code, 'JETNITY_ADDRESS_NOT_PERMITTED')
    assert.equal(literalAufgerufen, false)

    const legacy = await new Promise<{ code?: string; address?: unknown; family?: unknown }>((resolve) => {
      const lookup = officialTruthServerOwnedRetrievalLookup(async () => [{ address: '8.8.8.8', family: 4 }])
      ;(lookup as (hostname: string, callback: (error: NodeJS.ErrnoException | null, address?: string, family?: number) => void) => void)(
        'www.gov.example',
        (error, address, family) => resolve({ code: error?.code, address, family }),
      )
    })
    assert.equal(legacy.code, undefined)
    assert.equal(legacy.address, '8.8.8.8')
    assert.equal(legacy.family, 4)

    const beide = await lookupWarten(
      officialTruthServerOwnedRetrievalLookup(async () => [
        { address: '1.1.1.1', family: 4 },
        { address: '8.8.8.8', family: 4 },
      ]),
      'www.gov.example',
      true,
    )
    assert.equal(beide.code, undefined)
    assert.deepEqual(beide.address, [
      { address: '1.1.1.1', family: 4 },
      { address: '8.8.8.8', family: 4 },
    ])
  })

  test('14 die Verbindung benutzt nur eine geprüfte Adresse', async () => {
    const lauf = await laufen({
      adressen: () => [
        { address: '1.1.1.1', family: 4 },
        { address: '8.8.8.8', family: 4 },
      ],
    })
    const wert = erfolg(lauf)
    assert.equal(lauf.dns.length, 1)
    assert.equal(lauf.verbindungen.length, 1)
    assert.equal(lauf.verbindungen[0]?.address, '1.1.1.1')
    assert.equal(lauf.verbindungen[0]?.family, 4)
    assert.equal(wert.sourceContentHash, evidenceQuellenFingerprint(TEXT))
    const ipv6 = await laufen({
      adressen: () => [{ address: '2001:4860:4860::8888', family: 6 }],
    })
    erfolg(ipv6)
    assert.equal(ipv6.verbindungen[0]?.address, '2001:4860:4860::8888')
    assert.equal(ipv6.verbindungen[0]?.family, 6)
  })

  test('öffentliches IPv4 gelingt und private, Loopback, Link-Local, CGNAT, Multicast und reservierte Adressen nicht', async () => {
    const gut = await laufen({ adressen: () => [{ address: '8.8.8.8', family: 4 }] })
    assert.equal(gut.ergebnis.status, 'server_owned_official_retrieval')
    for (const address of ['10.0.0.1', '127.0.0.1', '169.254.1.1', '100.64.1.1', '224.0.0.1', '240.0.0.1', '192.168.0.1', '0.0.0.0']) {
      const lauf = await laufen({ adressen: () => [{ address, family: 4 }] })
      assert.equal(grund(lauf), 'address_not_permitted', address)
      assert.equal(lauf.verbindungen.length, 0, address)
      assert.equal(JSON.stringify(lauf.ergebnis).includes(address), false, address)
    }
  })

  test('öffentliches IPv6 gelingt, lokale IPv6-Formen und gemischte Antworten nicht', async () => {
    const gut = await laufen({ adressen: () => [{ address: '2001:4860:4860::8888', family: 6 }] })
    assert.equal(gut.ergebnis.status, 'server_owned_official_retrieval')
    for (const address of ['::1', '::', 'fc00::1', 'fe80::1', 'ff02::1', '::ffff:10.1.2.3']) {
      const lauf = await laufen({ adressen: () => [{ address, family: 6 }] })
      assert.equal(grund(lauf), 'address_not_permitted', address)
      assert.equal(lauf.verbindungen.length, 0, address)
    }
    const gemischt = await laufen({
      adressen: () => [
        { address: '8.8.8.8', family: 4 },
        { address: '192.168.1.1', family: 4 },
      ],
    })
    assert.equal(grund(gemischt), 'address_not_permitted')
    assert.equal(gemischt.verbindungen.length, 0)
    const leer = await laufen({ adressen: () => [] })
    assert.equal(grund(leer), 'dns_empty')
    assert.equal(leer.verbindungen.length, 0)
    const stoerung = await laufen({ adressen: () => 'throw' })
    assert.equal(grund(stoerung), 'dns_failed')
    assert.equal(stoerung.verbindungen.length, 0)
  })

  test('15 bis 17 eine begrenzte UTF-8-Antwort trägt Server-URL, Zeit, Typ, Text und Hash und übersteht Mutation', async () => {
    const eingabe = { sourceId: AMTLICH, url: `${AMTLICH_URL}?lang=en` }
    const lauf = await laufen({
      eingabe,
      antwort: () => ({
        status: 200,
        headers: { 'Content-Type': 'Text/HTML; charset=UTF-8' },
        body: `official\r\n${TEXT}`,
      }),
    })
    const wert = erfolg(lauf)
    assert.deepEqual(Object.keys(wert).sort(), ERFOLG_SCHLUESSEL)
    assert.equal(wert.sourceId, AMTLICH)
    assert.equal(wert.canonicalUrl, `https://www.gov.example/rules?lang=en`)
    assert.equal(wert.retrievedAt, JETZT)
    assert.equal(wert.contentType, 'text/html')
    assert.equal(wert.sourceSnapshot, `official\r\n${TEXT}`)
    assert.equal(wert.sourceContentHash, evidenceQuellenFingerprint(wert.sourceSnapshot))
    assert.equal(wert.redirectCount, 0)
    assert.equal(lauf.uhr, 1)
    assert.equal(lauf.katalog, 1)
    assert.equal(lauf.verbindungen[0]?.url, wert.canonicalUrl)
    eingabe.sourceId = 'mutated-id'
    eingabe.url = 'https://evil.example/mutated'
    assert.equal(wert.sourceId, AMTLICH)
    assert.equal(wert.canonicalUrl, 'https://www.gov.example/rules?lang=en')
    assert.equal(Object.isFrozen(wert), true)
    assert.throws(() => {
      ;(wert as { sourceSnapshot: string }).sourceSnapshot = 'changed'
    }, TypeError)
    assert.equal(wert.sourceSnapshot, `official\r\n${TEXT}`)
    const ohneTyp = await laufen({ antwort: () => ({ body: TEXT, headers: {} }) })
    assert.equal(erfolg(ohneTyp).contentType, null)
  })

  test('eine Mutation der Eingabe während der Antwort ändert das Ergebnis nicht', async () => {
    const eingabe = { sourceId: AMTLICH, url: AMTLICH_URL }
    const lauf = await laufen({
      eingabe,
      antwort: () => {
        eingabe.sourceId = ANBIETER
        eingabe.url = 'https://provider.example/feed'
        return { body: TEXT, headers: { 'content-type': 'text/plain' } }
      },
    })
    const wert = erfolg(lauf)
    assert.equal(wert.sourceId, AMTLICH)
    assert.equal(wert.canonicalUrl, AMTLICH_URL)
    assert.equal(wert.sourceSnapshot, TEXT)
  })

  test('18 und 19 zu grosse Content-Length und ein zu grosser Strom scheitern', async () => {
    const frueh = { gesehen: false, abgebrochen: false }
    const laenge = await laufen({
      antwort: () => ({
        headers: { 'content-length': '65537', 'content-type': 'text/plain' },
        body: 'x',
        lesen: frueh,
      }),
    })
    assert.equal(grund(laenge), 'response_too_large')
    assert.equal(frueh.gesehen, false)
    assert.equal(frueh.abgebrochen, true)
    assert.equal(JSON.stringify(laenge.ergebnis).includes('official'), false)

    const strom = { gesehen: false, abgebrochen: false }
    const zuviel = await laufen({
      antwort: () => ({
        headers: { 'content-length': '100' },
        stuecke: [new Uint8Array(40_000), new Uint8Array(40_000)],
        lesen: strom,
      }),
    })
    assert.equal(grund(zuviel), 'response_too_large')
    assert.equal(strom.abgebrochen, true)
    const grenze = await laufen({
      antwort: () => ({
        headers: { 'content-type': 'text/plain', 'content-length': '65536' },
        body: 'a'.repeat(65_536),
      }),
    })
    const wert = erfolg(grenze)
    assert.equal(wert.sourceSnapshot.length, 65_536)
    assert.equal(wert.sourceContentHash, evidenceQuellenFingerprint(wert.sourceSnapshot))
  })

  test('20 ungültiges UTF-8 und ein leerer Body scheitern', async () => {
    const utf = await laufen({ antwort: () => ({ body: Uint8Array.of(0xff), headers: { 'content-type': 'text/plain' } }) })
    assert.equal(grund(utf), 'invalid_utf8')
    assert.equal(utf.uhr, 0)
    const leer = await laufen({ antwort: () => ({ body: new Uint8Array(), headers: { 'content-type': 'text/plain' } }) })
    assert.equal(grund(leer), 'empty_body')
    assert.equal(leer.uhr, 0)
    assert.equal(JSON.stringify(leer.ergebnis).includes(TEXT), false)
  })

  test('21 und 22 4xx, 5xx und Timeout scheitern ohne Wiederholung', async () => {
    for (const status of [404, 500, 304]) {
      const lauf = await laufen({
        antwort: () => ({ status, body: 'error-page-sentinel', headers: { 'content-type': 'text/plain' } }),
      })
      assert.equal(grund(lauf), 'http_status', String(status))
      assert.equal(lauf.verbindungen.length, 1, String(status))
      assert.equal(JSON.stringify(lauf.ergebnis).includes('error-page-sentinel'), false)
    }
    const timeout = await laufen({ timeoutMs: 30, antwort: () => ({ haengen: true }) })
    assert.equal(grund(timeout), 'timeout')
    assert.equal(timeout.verbindungen.length, 1)
    assert.equal(timeout.uhr, 0)
  })

  test('23 und 24 eine begrenzte Weiterleitung derselben Quelle, auch relativ, gelingt', async () => {
    const relativ = await laufen({
      antwort: (url) => {
        if (url === AMTLICH_URL) return { status: 302, location: '/rules/next' }
        return { status: 200, headers: { 'content-type': 'text/plain' }, body: TEXT }
      },
    })
    const wert = erfolg(relativ)
    assert.equal(wert.canonicalUrl, 'https://www.gov.example/rules/next')
    assert.equal(wert.redirectCount, 1)
    assert.equal(wert.sourceSnapshot, TEXT)
    assert.deepEqual(
      relativ.verbindungen.map((eintrag) => eintrag.url),
      [AMTLICH_URL, 'https://www.gov.example/rules/next'],
    )
    assert.equal(relativ.dns.length, 2)
    assert.equal(relativ.katalog, 1)
    assert.equal(relativ.uhr, 1)
  })

  test('25 eine Weiterleitung zu einer anderen amtlichen Quelle scheitert vor der nächsten Verbindung', async () => {
    const lauf = await laufen({
      antwort: () => ({ status: 302, location: 'https://www.interior.example/rules' }),
    })
    assert.equal(grund(lauf), 'redirect_source_mismatch')
    assert.deepEqual(
      lauf.verbindungen.map((eintrag) => eintrag.url),
      [AMTLICH_URL],
    )
    assert.equal(lauf.dns.length, 1)
  })

  test('26 unsichere Weiterleitungsziele scheitern vor der nächsten Verbindung', async () => {
    const faelle = [
      { location: 'https://127.0.0.1/secret', reason: 'address_not_permitted' },
      { location: 'https://10.0.0.1/secret', reason: 'address_not_permitted' },
      { location: 'http://www.gov.example/next', reason: 'insecure_scheme' },
      { location: 'https://user:s3cret@www.gov.example/next', reason: 'credentials' },
      { location: 'https://evil.example/next', reason: 'unregistered_domain' },
      { location: 'https://localhost/next', reason: 'invalid_url' },
      { location: 'https://foo.local/next', reason: 'invalid_url' },
      { location: '//127.0.0.1/secret', reason: 'address_not_permitted' },
    ]
    for (const fall of faelle) {
      const lauf = await laufen({ antwort: () => ({ status: 301, location: fall.location }) })
      assert.equal(grund(lauf), fall.reason, fall.location)
      assert.equal(lauf.verbindungen.length, 1, fall.location)
      assert.equal(JSON.stringify(lauf.ergebnis).includes('s3cret'), false, fall.location)
    }
    const privat = await laufen({
      antwort: (url) => {
        if (url === AMTLICH_URL) return { status: 302, location: 'https://travel.gov.example/rules' }
        return { body: TEXT }
      },
      adressen: (hostname) => (hostname === 'travel.gov.example' ? [{ address: '10.9.8.7', family: 4 as const }] : [{ address: '8.8.8.8', family: 4 as const }]),
    })
    assert.equal(grund(privat), 'address_not_permitted')
    assert.deepEqual(
      privat.verbindungen.map((eintrag) => eintrag.url),
      [AMTLICH_URL],
    )
  })

  test('27 Schleifen und zu viele Sprünge scheitern', async () => {
    const schleife = await laufen({
      antwort: (url) => ({ status: 302, location: url.endsWith('/rules') ? '/rules/again' : '/rules' }),
    })
    assert.equal(grund(schleife), 'redirect_loop')
    assert.equal(schleife.verbindungen.length, 2)
    const ziele = Array.from({ length: 7 }, (_, index) => `https://www.gov.example/step-${index}`)
    const kette = await laufen({
      eingabe: { sourceId: AMTLICH, url: ziele[0] },
      antwort: (url) => {
        const index = ziele.indexOf(url)
        return { status: 302, location: ziele[index + 1] }
      },
    })
    assert.equal(grund(kette), 'redirect_limit')
    assert.deepEqual(
      kette.verbindungen.map((eintrag) => eintrag.url),
      ziele.slice(0, 6),
    )
    const knapp = await laufen({
      eingabe: { sourceId: AMTLICH, url: ziele[0] },
      antwort: (url) => {
        const index = ziele.indexOf(url)
        if (index < 5) return { status: 302, location: ziele[index + 1] }
        return { status: 200, body: TEXT, headers: { 'content-type': 'text/plain' } }
      },
    })
    const wert = erfolg(knapp)
    assert.equal(wert.redirectCount, 5)
    assert.equal(wert.canonicalUrl, ziele[5])
    assert.equal(knapp.katalog, 1)
  })

  test('28 keine Cookies, keine Autorisierung und keine Aufrufer-Header', async () => {
    const lauf = await laufen()
    erfolg(lauf)
    assert.deepEqual(lauf.verbindungen[0]?.headers, {
      'accept-encoding': 'identity',
      'cache-control': 'no-cache',
    })
    const mitHeader = await laufen({
      eingabe: { sourceId: AMTLICH, url: AMTLICH_URL, cookie: 'session=secret', authorization: 'Bearer secret' },
    })
    assert.equal(grund(mitHeader), 'caller_authority_forbidden')
    assert.equal(mitHeader.verbindungen.length, 0)
  })

  test('29 und 30 kein App-Import und keine Annahme, kein Speicher, kein Extraktor, kein F8', () => {
    const text = datei(DATEI)
    assert.match(text, /import 'server-only'/)
    assert.match(text, /https\.request/)
    assert.match(text, /lookup: anfrage\.lookup/)
    assert.match(text, /headers: \{ \.\.\.FESTE_HEADER \}/)
    assert.doesNotMatch(text, /\bfetch\s*\(/)
    assert.doesNotMatch(text, /regelKandidatAkzeptieren/)
    assert.doesNotMatch(text, /officialTruthAbgerufenMaterialPruefen/)
    assert.doesNotMatch(text, /official-truth-store|official-truth-rule-candidate|evidenceKandidatAusModell/)
    assert.doesNotMatch(text, /sherpa|timatic|requirementsProviderAus/i)
    assert.doesNotMatch(text, /from ['"]@\/app\//)
    assert.equal(loadOfficialTruthServerOwnedRetrieval.length, 1)
    const app = dateienUnter('app')
    for (const pfad of app) {
      assert.equal(readFileSync(pfad, 'utf8').includes('official-truth-server-owned-retrieval'), false, pfad)
    }
    for (const pfad of dateienUnter('lib/server/providers')) {
      assert.equal(readFileSync(pfad, 'utf8').includes('official-truth-server-owned-retrieval'), false, pfad)
    }
  })

  test('Tracking scheitert, funktionale Parameter bleiben, der Live-Einstieg nimmt keine Abhängigkeiten', async () => {
    const tracking = await laufen({ eingabe: { sourceId: AMTLICH, url: `${AMTLICH_URL}?utm_source=tracking-secret-91f3` } })
    assert.equal(grund(tracking), 'tracking_parameter')
    assert.equal(tracking.verbindungen.length, 0)
    assert.equal(JSON.stringify(tracking.ergebnis).includes('tracking-secret-91f3'), false)
    const person = await laufen({ eingabe: { sourceId: AMTLICH, url: AMTLICH_URL, passportNumber: 'X123' } })
    assert.equal(grund(person), 'sensitive_personal_field')
    assert.equal(person.katalog, 0)
    const live = await loadOfficialTruthServerOwnedRetrieval({ sourceId: AMTLICH, url: AMTLICH_URL, registry: { sources: [] } })
    assert.deepEqual(live, { status: 'blocked', reason: 'caller_authority_forbidden' })
    const text = datei(DATEI)
    const liveStart = text.indexOf('export async function loadOfficialTruthServerOwnedRetrieval')
    const liveText = text.slice(liveStart)
    assert.match(liveText, /now: serverUhr/)
    assert.match(liveText, /resolve: serverDns/)
    assert.match(liveText, /http: serverHttp/)
    assert.doesNotMatch(liveText, /catalog:/)
    const uhr = await laufen({ now: () => new Date(Number.NaN) })
    assert.equal(grund(uhr), 'invalid_retrieval_time')
    assert.equal(JSON.stringify(uhr.ergebnis).includes(TEXT), false)
  })
})

function dateienUnter(relativ: string): string[] {
  const wurzel = join(process.cwd(), relativ)
  const fund: string[] = []
  const stapel = [wurzel]
  while (stapel.length > 0) {
    const aktuell = stapel.pop()
    if (!aktuell) break
    let eintraege: ReturnType<typeof readdirSync>
    try {
      eintraege = readdirSync(aktuell, { withFileTypes: true })
    } catch {
      continue
    }
    for (const eintrag of eintraege) {
      if (eintrag.name === 'node_modules' || eintrag.name.startsWith('.')) continue
      const pfad = join(aktuell, eintrag.name)
      if (eintrag.isDirectory()) stapel.push(pfad)
      else if (/\.(ts|tsx|js|jsx|mjs)$/.test(eintrag.name)) fund.push(pfad)
    }
  }
  return fund
}
