// lib/readiness/fingerprint.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { READINESS_GRENZEN } from '@/lib/readiness/domain'
import { fingerprintAktuell, readinessFingerprint } from '@/lib/readiness/fingerprint'
import { readinessAnsicht } from '@/lib/readiness/status'
import { documentFingerprintTeil, travellerLegacyLesen } from '@/lib/readiness/traveller-kontext'
import { beispielreise } from '@/lib/reiseaenderung/fixtures/reise'
import type { TripReadinessItem } from '@/types/trips'

const basis = {
  countryCode: 'TH' as string | null,
  startDate: '2026-09-12' as string | null,
  endDate: '2026-09-16' as string | null,
  travellers: 2,
  destinationCountries: ['TH'],
  rentalCarPresent: false,
  tripItemId: null as string | null,
  itemKind: null as string | null,
  bookingStatus: null as string | null,
  startsOn: null as string | null,
  endsOn: null as string | null,
  originPlaceId: null as string | null,
  destinationPlaceId: null as string | null,
  title: null as string | null,
}

describe('Context-Fingerprint', () => {
  test('ist deterministisch', () => {
    const a = readinessFingerprint({ ...basis, kind: 'entry_check' })
    const b = readinessFingerprint({ ...basis, kind: 'entry_check' })
    assert.equal(a, b)
    assert.match(a, /^v4\|sha256:[0-9a-f]{64}$/)
    assert.ok(a.length <= READINESS_GRENZEN.fingerprint)
  })

  test('Länderreihenfolge ist irrelevant', () => {
    const a = readinessFingerprint({
      ...basis,
      kind: 'insurance_check',
      destinationCountries: ['JP', 'TH'],
    })
    const b = readinessFingerprint({
      ...basis,
      kind: 'insurance_check',
      destinationCountries: ['TH', 'JP'],
    })
    assert.equal(a, b)
  })

  test('Datumsänderung ändert den Fingerprint', () => {
    const a = readinessFingerprint({ ...basis, kind: 'travel_document_check' })
    const b = readinessFingerprint({ ...basis, kind: 'travel_document_check', startDate: '2026-10-01' })
    assert.notEqual(a, b)
    assert.equal(fingerprintAktuell(a, b), false)
  })

  test('Transitänderung ändert Einreise-Fingerprint, nicht Buchungsbestätigung', () => {
    const ohne = readinessFingerprint({ ...basis, kind: 'entry_check' })
    const mit = readinessFingerprint({
      ...basis,
      kind: 'entry_check',
      originCountryCode: 'CH',
      transitCountryCodes: ['QA'],
      routeFingerprint: 'route-v2|ZRH:CH>DOH:QA>BKK:TH',
    })
    assert.notEqual(ohne, mit)
    const buchungOhne = readinessFingerprint({ ...basis, kind: 'booking_confirmation_check' })
    const buchungMit = readinessFingerprint({
      ...basis,
      kind: 'booking_confirmation_check',
      originCountryCode: 'CH',
      transitCountryCodes: ['QA'],
    })
    assert.equal(buchungOhne, buchungMit)
  })

  test('Citizenship-Menge ändert Einreise-Fingerprint, Reihenfolge nicht', () => {
    const basisTraveller = {
      ...basis,
      kind: 'entry_check' as const,
      travellerClientRef: 'traveller:1',
      residenceCountryCode: 'CH',
    }
    const a = readinessFingerprint({
      ...basisTraveller,
      citizenshipCountryCodes: ['CH', 'RS'],
      documentFingerprints: ['passport:CH:2030-01-01:citizenship:CH'],
    })
    const b = readinessFingerprint({
      ...basisTraveller,
      citizenshipCountryCodes: ['RS', 'CH'],
      documentFingerprints: ['passport:CH:2030-01-01:citizenship:CH'],
    })
    const ohne = readinessFingerprint({
      ...basisTraveller,
      citizenshipCountryCodes: ['CH'],
      documentFingerprints: ['passport:CH:2030-01-01:citizenship:CH'],
    })
    const anderer = readinessFingerprint({
      ...basisTraveller,
      travellerClientRef: 'traveller:2',
      citizenshipCountryCodes: ['CH', 'RS'],
      documentFingerprints: ['passport:CH:2030-01-01:citizenship:CH'],
    })
    assert.equal(a, b)
    assert.notEqual(a, ohne)
    assert.notEqual(a, anderer)
  })

  test('Dokumentänderung ändert Einreise-Fingerprint, Buchungsbestätigung nicht', () => {
    const mit = readinessFingerprint({
      ...basis,
      kind: 'entry_check',
      travellerClientRef: 'traveller:1',
      documentFingerprints: ['passport:CH:2030-01-01:citizenship:CH'],
    })
    const ohne = readinessFingerprint({
      ...basis,
      kind: 'entry_check',
      travellerClientRef: 'traveller:1',
      documentFingerprints: ['passport:RS:2029-01-01:citizenship:RS'],
    })
    assert.notEqual(mit, ohne)
    const buchung = readinessFingerprint({
      ...basis,
      kind: 'booking_confirmation_check',
      travellerClientRef: 'traveller:1',
      documentFingerprints: ['passport:CH:2030-01-01:citizenship:CH'],
    })
    const buchungAnders = readinessFingerprint({
      ...basis,
      kind: 'booking_confirmation_check',
      travellerClientRef: 'traveller:1',
      documentFingerprints: ['passport:RS:2029-01-01:citizenship:RS'],
    })
    assert.equal(buchung, buchungAnders)
  })

  test('Mietwagen ändert nur den Versicherungs-Fingerprint', () => {
    const ohne = readinessFingerprint({ ...basis, kind: 'insurance_check', rentalCarPresent: false })
    const mit = readinessFingerprint({ ...basis, kind: 'insurance_check', rentalCarPresent: true })
    assert.notEqual(ohne, mit)
    const einreiseOhne = readinessFingerprint({ ...basis, kind: 'entry_check', rentalCarPresent: false })
    const einreiseMit = readinessFingerprint({ ...basis, kind: 'entry_check', rentalCarPresent: true })
    assert.equal(einreiseOhne, einreiseMit)
  })

  test('Unterschied nach Zeichen 800 der Rohroute bleibt sichtbar', () => {
    const langA = `${'ZRH:CH>BKK:TH|'.repeat(70)}AAA:AA`
    const langB = `${'ZRH:CH>BKK:TH|'.repeat(70)}BBB:BB`
    assert.ok(langA.length > 800)
    const a = readinessFingerprint({ ...basis, kind: 'entry_check', routeFingerprint: langA })
    const b = readinessFingerprint({ ...basis, kind: 'entry_check', routeFingerprint: langB })
    assert.notEqual(a, b)
    assert.ok(a.length <= READINESS_GRENZEN.fingerprint)
    assert.ok(b.length <= READINESS_GRENZEN.fingerprint)
  })

  test('Citizenship, spätes Dokument und Residence bleiben bei langer Route sichtbar', () => {
    const route = `${'ZRH:CH>BKK:TH|'.repeat(60)}SIN:SG`
    const citizenships = ['AT', 'CH', 'DE', 'FR', 'IT', 'NL', 'RS', 'US']
    const documents = Array.from({ length: 12 }, (_, index) => {
      const land = citizenships[index % citizenships.length]
      return `passport:${land}:203${index}-01-01:citizenship:${land}:${'x'.repeat(40)}`
    })
    const basisLang = {
      ...basis,
      kind: 'entry_check' as const,
      routeFingerprint: route,
      travellerClientRef: 'traveller:1',
      citizenshipCountryCodes: citizenships,
      documentFingerprints: documents,
      residenceCountryCode: 'CH',
    }
    const citAndere = readinessFingerprint({
      ...basisLang,
      citizenshipCountryCodes: [...citizenships.slice(0, 7), 'GB'],
    })
    const docsUmgestellt = readinessFingerprint({
      ...basisLang,
      documentFingerprints: [...documents].reverse(),
    })
    const docsSpaet = readinessFingerprint({
      ...basisLang,
      documentFingerprints: documents.map((eintrag, index) =>
        index === documents.length - 1 ? 'passport:US:2040-12-31:citizenship:US:yyyy' : eintrag,
      ),
    })
    const resAndere = readinessFingerprint({
      ...basisLang,
      residenceCountryCode: 'DE',
    })
    const citUmgestellt = readinessFingerprint({
      ...basisLang,
      citizenshipCountryCodes: [...citizenships].reverse(),
    })
    const original = readinessFingerprint(basisLang)
    assert.equal(original, citUmgestellt)
    assert.equal(original, docsUmgestellt)
    assert.notEqual(original, citAndere)
    assert.notEqual(original, docsSpaet)
    assert.notEqual(original, resAndere)
    assert.ok(original.length <= READINESS_GRENZEN.fingerprint)
  })

  test('persistierter v2-Fingerprint macht done nicht fälschlich current', () => {
    const reise = beispielreise({
      readinessItems: [
        {
          id: 'entry_check:IT',
          clientRef: 'entry_check:IT',
          kind: 'entry_check',
          userStatus: 'done',
          evidence: 'user',
          countryCode: 'IT',
          tripItemId: null,
          title: null,
          travellerClientRef: null,
          contextFingerprint: 'v2|kind=entry_check|cc=IT|start=2026-09-12|end=2026-09-16|trav=2|dest=IT',
          createdAt: '2026-08-22T08:00:00.000Z',
          updatedAt: '2026-08-22T08:00:00.000Z',
        } satisfies TripReadinessItem,
      ],
    })
    const { items } = readinessAnsicht(reise)
    assert.equal(items.find((item) => item.kind === 'entry_check')?.currentness, 'stale')
  })

  test('persistierter v3-Fingerprint macht done nicht fälschlich current', () => {
    const reise = beispielreise({
      readinessItems: [
        {
          id: 'entry_check:IT',
          clientRef: 'entry_check:IT',
          kind: 'entry_check',
          userStatus: 'done',
          evidence: 'user',
          countryCode: 'IT',
          tripItemId: null,
          title: null,
          travellerClientRef: null,
          contextFingerprint: 'v3|sha256:33490f56f753d5c070e99dbb5aeac1919668ad634dd330e3844b7db96d32f364',
          createdAt: '2026-08-22T08:00:00.000Z',
          updatedAt: '2026-08-22T08:00:00.000Z',
        } satisfies TripReadinessItem,
      ],
    })
    const { items } = readinessAnsicht(reise)
    assert.equal(items.find((item) => item.kind === 'entry_check')?.currentness, 'stale')
  })
})

describe('R10 Blocker 23 – Credential-Bedeutung', () => {
  const JETZT = '2026-08-22T10:00:00.000Z'

  function travellerMitBindung(c1: string, c2: string, gebunden = 'c1') {
    return travellerLegacyLesen({
      clientRef: 'traveller:1',
      residenceCountryCode: 'CH',
      citizenships: [
        { clientRef: 'c1', countryCode: c1, createdAt: JETZT, updatedAt: JETZT },
        { clientRef: 'c2', countryCode: c2, createdAt: JETZT, updatedAt: JETZT },
      ],
      documents: [
        {
          clientRef: 'document:passport:bound',
          documentType: 'passport',
          issuingCountryCode: 'CH',
          citizenshipClientRef: gebunden,
          expiresOn: '2030-01-01',
          createdAt: JETZT,
          updatedAt: JETZT,
        },
      ],
      createdAt: JETZT,
      updatedAt: JETZT,
    })!
  }

  function einreiseFp(traveller: NonNullable<ReturnType<typeof travellerLegacyLesen>>) {
    return readinessFingerprint({
      ...basis,
      kind: 'entry_check',
      travellerClientRef: traveller.clientRef,
      citizenshipCountryCodes: traveller.citizenships.map((eintrag) => eintrag.countryCode),
      documentFingerprints: traveller.documents.map((document) => documentFingerprintTeil(document, traveller)),
      residenceCountryCode: traveller.residenceCountryCode,
    })
  }

  test('Ref→Country-Tausch ändert den Fingerprint, Array-Reihenfolge nicht', () => {
    const chDannRs = travellerMitBindung('CH', 'RS')
    const rsDannCh = travellerMitBindung('RS', 'CH')
    const nurReihenfolge = travellerLegacyLesen({
      clientRef: 'traveller:1',
      residenceCountryCode: 'CH',
      citizenships: [
        { clientRef: 'c2', countryCode: 'RS', createdAt: JETZT, updatedAt: JETZT },
        { clientRef: 'c1', countryCode: 'CH', createdAt: JETZT, updatedAt: JETZT },
      ],
      documents: [
        {
          clientRef: 'document:passport:bound',
          documentType: 'passport',
          issuingCountryCode: 'CH',
          citizenshipClientRef: 'c1',
          expiresOn: '2030-01-01',
          createdAt: JETZT,
          updatedAt: JETZT,
        },
      ],
      createdAt: JETZT,
      updatedAt: JETZT,
    })!
    assert.notEqual(einreiseFp(chDannRs), einreiseFp(rsDannCh))
    assert.equal(einreiseFp(chDannRs), einreiseFp(nurReihenfolge))
  })

  test('Dokument wechselt die aufgelöste Citizenship CH→RS', () => {
    const anCh = travellerMitBindung('CH', 'RS', 'c1')
    const anRs = travellerMitBindung('CH', 'RS', 'c2')
    assert.notEqual(einreiseFp(anCh), einreiseFp(anRs))
  })

  test('mehrere Dokumente bleiben order-invariant und ohne Passnummern', () => {
    const vorwaerts = travellerLegacyLesen({
      clientRef: 'traveller:1',
      citizenships: [
        { clientRef: 'c1', countryCode: 'CH', createdAt: JETZT, updatedAt: JETZT },
        { clientRef: 'c2', countryCode: 'RS', createdAt: JETZT, updatedAt: JETZT },
      ],
      documents: [
        {
          clientRef: 'document:passport:CH',
          documentType: 'passport',
          issuingCountryCode: 'CH',
          citizenshipClientRef: 'c1',
          expiresOn: '2030-01-01',
          createdAt: JETZT,
          updatedAt: JETZT,
        },
        {
          clientRef: 'document:national_id:RS',
          documentType: 'national_id',
          issuingCountryCode: 'RS',
          citizenshipClientRef: 'c2',
          expiresOn: '2029-01-01',
          createdAt: JETZT,
          updatedAt: JETZT,
        },
      ],
      createdAt: JETZT,
      updatedAt: JETZT,
    })!
    const rueckwaerts = travellerLegacyLesen({
      clientRef: 'traveller:1',
      citizenships: [
        { clientRef: 'c2', countryCode: 'RS', createdAt: JETZT, updatedAt: JETZT },
        { clientRef: 'c1', countryCode: 'CH', createdAt: JETZT, updatedAt: JETZT },
      ],
      documents: [...vorwaerts.documents].reverse(),
      createdAt: JETZT,
      updatedAt: JETZT,
    })!
    assert.equal(einreiseFp(vorwaerts), einreiseFp(rueckwaerts))
    const roh = JSON.stringify(vorwaerts.documents.map((document) => documentFingerprintTeil(document, vorwaerts)))
    assert.equal(roh.includes('X1234567'), false)
    assert.equal(roh.includes('passportNumber'), false)
  })

  test('opaque Refs mit Trennzeichen erzeugen keine strukturelle Kollision', () => {
    const mitTrennzeichen = readinessFingerprint({
      ...basis,
      kind: 'entry_check',
      travellerClientRef: 'trav|eller,1:x',
      citizenshipCountryCodes: ['CH'],
      documentFingerprints: [
        documentFingerprintTeil(
          {
            id: 'doc,1',
            clientRef: 'doc|ref:1',
            documentType: 'passport',
            issuingCountryCode: 'CH',
            citizenshipClientRef: 'cit,ref|1',
            expiresOn: '2030-01-01',
            createdAt: JETZT,
            updatedAt: JETZT,
          },
          {
            citizenships: [{ id: 'c', clientRef: 'cit,ref|1', countryCode: 'CH', createdAt: JETZT, updatedAt: JETZT }],
          },
        ),
      ],
    })
    const andereStruktur = readinessFingerprint({
      ...basis,
      kind: 'entry_check',
      travellerClientRef: 'trav',
      citizenshipCountryCodes: ['CH'],
      documentFingerprints: ['eller,1:x', 'passport:CH:2030-01-01:cit,ref|1'],
    })
    assert.notEqual(mitTrennzeichen, andereStruktur)
    assert.match(mitTrennzeichen, /^v4\|sha256:[0-9a-f]{64}$/)
    assert.ok(mitTrennzeichen.length <= READINESS_GRENZEN.fingerprint)
  })
})


