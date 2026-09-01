// lib/readiness/traveller-anfrage.test.ts

import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { travellerAnfrageStriktLesen } from '@/lib/readiness/traveller-anfrage'
import {
  credentialOptionsAus,
  documentCitizenshipCode,
  travellerCredentialFingerprint,
  travellerLegacyLesen,
} from '@/lib/readiness/traveller-kontext'

const PASSPORT_CH = {
  clientRef: 'document:passport:CH',
  documentType: 'passport',
  issuingCountryCode: 'CH',
  expiresOn: '2030-01-01',
  citizenshipClientRef: 'citizenship:CH',
} as const

const PASSPORT_RS = {
  clientRef: 'document:passport:RS',
  documentType: 'passport',
  issuingCountryCode: 'RS',
  expiresOn: '2029-01-01',
  citizenshipClientRef: 'citizenship:RS',
} as const

const NATIONAL_ID_DE = {
  clientRef: 'document:national_id:DE',
  documentType: 'national_id',
  issuingCountryCode: 'DE',
  expiresOn: '2028-06-01',
  citizenshipClientRef: 'citizenship:DE',
} as const

const NATIONAL_ID_CH = {
  clientRef: 'document:national_id:CH',
  documentType: 'national_id',
  issuingCountryCode: 'CH',
  expiresOn: '2027-01-01',
  citizenshipClientRef: 'citizenship:CH',
} as const

function gemischterTraveller(documents: readonly object[]) {
  return {
    clientRef: 'traveller:1',
    residenceCountryCode: 'CH',
    citizenships: [
      { clientRef: 'citizenship:CH', countryCode: 'CH' },
      { clientRef: 'citizenship:DE', countryCode: 'DE' },
    ],
    documents,
  }
}

function dreidokumentTraveller(documents: readonly object[]) {
  return {
    clientRef: 'traveller:1',
    citizenships: [
      { clientRef: 'citizenship:CH', countryCode: 'CH' },
      { clientRef: 'citizenship:RS', countryCode: 'RS' },
    ],
    documents,
  }
}

function dokumentLinks(gelesen: NonNullable<ReturnType<typeof travellerAnfrageStriktLesen>>) {
  return Object.fromEntries(
    gelesen.documents.map((document) => [
      document.clientRef,
      {
        documentType: document.documentType,
        issuingCountryCode: document.issuingCountryCode,
        citizenshipClientRef: document.citizenshipClientRef,
        citizenshipCountryCode: documentCitizenshipCode(gelesen, document),
      },
    ]),
  )
}

describe('Strikte Requirements-Traveller-Anfrage', () => {
  test('gültige Canonical-Form bleibt unverändert', () => {
    const roh = {
      clientRef: 'traveller:1',
      residenceCountryCode: 'CH',
      citizenships: [{ clientRef: 'citizenship:CH', countryCode: 'CH' }],
      documents: [
        {
          clientRef: 'document:passport:CH',
          documentType: 'passport',
          issuingCountryCode: 'CH',
          expiresOn: '2030-01-01',
          citizenshipClientRef: 'citizenship:CH',
        },
      ],
    }
    const gelesen = travellerAnfrageStriktLesen(roh)
    assert.equal(gelesen?.clientRef, 'traveller:1')
    assert.equal(gelesen?.citizenships.length, 1)
    assert.equal(gelesen?.documents.length, 1)
    assert.equal(gelesen?.documents[0]?.citizenshipClientRef, 'citizenship:CH')
  })

  test('echte Legacy-Form ohne Canonical-Properties bleibt kompatibel', () => {
    const gelesen = travellerAnfrageStriktLesen({
      clientRef: 'traveller:1',
      nationalityCountryCode: 'CH',
      documentType: 'passport',
      documentIssuingCountryCode: 'CH',
    })
    assert.equal(gelesen?.citizenships[0]?.countryCode, 'CH')
    assert.equal(gelesen?.documents[0]?.documentType, 'passport')
  })

  test('gültiges plus malformed Citizenship-Child ist fail-closed', () => {
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        citizenships: [{ countryCode: 'CH' }, { country: 'DE' }],
      }),
      null,
    )
  })

  test('gültiges plus malformed Document-Child ist fail-closed', () => {
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        citizenships: [{ countryCode: 'CH' }],
        documents: [
          { clientRef: 'document:passport:CH', documentType: 'passport', issuingCountryCode: 'CH' },
          { clientRef: 'document:bad', typ: 'passport' },
        ],
      }),
      null,
    )
  })

  test('falscher Typ von citizenships oder documents löst keinen Legacy-Fallback aus', () => {
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        nationalityCountryCode: 'CH',
        citizenships: 'kaputt',
      }),
      null,
    )
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        documentType: 'passport',
        documents: { documentType: 'passport' },
      }),
      null,
    )
    const legacy = travellerLegacyLesen({
      clientRef: 'traveller:1',
      nationalityCountryCode: 'CH',
      citizenships: 'kaputt',
    })
    assert.equal(legacy?.citizenships[0]?.countryCode, 'CH')
  })

  test('Limits werden abgewiesen statt still gekürzt', () => {
    const citizenships = Array.from({ length: 9 }, (_, index) => ({
      countryCode: String.fromCharCode(65 + index) + 'A',
    }))
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        citizenships,
      }),
      null,
    )
    const documents = Array.from({ length: 13 }, (_, index) => ({
      clientRef: `document:${index}`,
      documentType: 'passport',
      issuingCountryCode: 'CH',
    }))
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        documents,
      }),
      null,
    )
  })

  test('Duplicate-Child oder Duplicate-Ref ist fail-closed', () => {
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        citizenships: [
          { clientRef: 'citizenship:CH', countryCode: 'CH' },
          { clientRef: 'citizenship:CH-2', countryCode: 'CH' },
        ],
      }),
      null,
    )
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        documents: [
          { clientRef: 'document:same', documentType: 'passport', issuingCountryCode: 'CH' },
          { clientRef: 'document:same', documentType: 'national_id', issuingCountryCode: 'DE' },
        ],
      }),
      null,
    )
  })

  test('malformed Legacy-Singularfelder sind fail-closed', () => {
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        documentType: 'foobar',
      }),
      null,
    )
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        nationalityCountryCode: 'CH',
        documentType: 'passport',
        documentExpiresOn: 'kaputt',
      }),
      null,
    )
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        nationalityCountryCode: 'Schweiz',
      }),
      null,
    )
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        residenceCountryCode: 41,
      }),
      null,
    )
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        documentType: 'passport',
        documentIssuingCountryCode: 'CHH',
      }),
      null,
    )
    const tolerant = travellerLegacyLesen({
      clientRef: 'traveller:1',
      documentType: 'foobar',
      documentExpiresOn: 'kaputt',
      nationalityCountryCode: 'Schweiz',
    })
    assert.equal(tolerant?.clientRef, 'traveller:1')
    assert.equal(tolerant?.documents[0]?.documentType, 'foobar')
    assert.equal(tolerant?.documents[0]?.expiresOn, 'kaputt')
    assert.equal(tolerant?.citizenships.length, 0)
  })

  test('gemischtes Passport + National-ID mit gültigen Citizenship-Links wird akzeptiert', () => {
    const gelesen = travellerAnfrageStriktLesen(gemischterTraveller([PASSPORT_CH, NATIONAL_ID_DE]))
    assert.ok(gelesen)
    assert.equal(gelesen.citizenships.length, 2)
    assert.equal(gelesen.documents.length, 2)
    assert.deepEqual(dokumentLinks(gelesen), {
      'document:national_id:DE': {
        documentType: 'national_id',
        issuingCountryCode: 'DE',
        citizenshipClientRef: 'citizenship:DE',
        citizenshipCountryCode: 'DE',
      },
      'document:passport:CH': {
        documentType: 'passport',
        issuingCountryCode: 'CH',
        citizenshipClientRef: 'citizenship:CH',
        citizenshipCountryCode: 'CH',
      },
    })
    assert.equal(gelesen.documents[0]?.documentType, 'national_id')
    assert.equal(gelesen.documents[1]?.documentType, 'passport')
  })

  test('semantische Dokument-Permutationen bleiben äquivalent und behalten die Links', () => {
    const passportZuerst = travellerAnfrageStriktLesen(gemischterTraveller([PASSPORT_CH, NATIONAL_ID_DE]))
    const nationalIdZuerst = travellerAnfrageStriktLesen(gemischterTraveller([NATIONAL_ID_DE, PASSPORT_CH]))
    const auditReihenfolge = travellerAnfrageStriktLesen(
      dreidokumentTraveller([PASSPORT_CH, PASSPORT_RS, NATIONAL_ID_CH]),
    )
    const auditSortiert = travellerAnfrageStriktLesen(
      dreidokumentTraveller([NATIONAL_ID_CH, PASSPORT_CH, PASSPORT_RS]),
    )

    assert.ok(passportZuerst)
    assert.ok(nationalIdZuerst)
    assert.ok(auditReihenfolge)
    assert.ok(auditSortiert)

    assert.deepEqual(dokumentLinks(passportZuerst), dokumentLinks(nationalIdZuerst))
    assert.equal(travellerCredentialFingerprint(passportZuerst), travellerCredentialFingerprint(nationalIdZuerst))
    assert.deepEqual(dokumentLinks(auditReihenfolge), dokumentLinks(auditSortiert))
    assert.equal(travellerCredentialFingerprint(auditReihenfolge), travellerCredentialFingerprint(auditSortiert))

    assert.equal(documentCitizenshipCode(passportZuerst, passportZuerst.documents[0]!), 'DE')
    assert.equal(documentCitizenshipCode(passportZuerst, passportZuerst.documents[1]!), 'CH')
    assert.equal(auditReihenfolge.documents[0]?.clientRef, 'document:national_id:CH')
    assert.equal(auditReihenfolge.documents[0]?.citizenshipClientRef, 'citizenship:CH')
    assert.equal(auditReihenfolge.documents[1]?.clientRef, 'document:passport:CH')
    assert.equal(auditReihenfolge.documents[1]?.citizenshipClientRef, 'citizenship:CH')
    assert.equal(auditReihenfolge.documents[2]?.clientRef, 'document:passport:RS')
    assert.equal(auditReihenfolge.documents[2]?.citizenshipClientRef, 'citizenship:RS')
  })

  test('unbekannte citizenshipClientRef bleibt fail-closed', () => {
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        citizenships: [{ clientRef: 'citizenship:CH', countryCode: 'CH' }],
        documents: [
          {
            clientRef: 'document:passport:CH',
            documentType: 'passport',
            issuingCountryCode: 'CH',
            citizenshipClientRef: 'citizenship:DE',
          },
        ],
      }),
      null,
    )
  })

  test('fehlende oder mehrdeutige Dokument-Identität bleibt fail-closed', () => {
    const eindeutigGeneriert = travellerAnfrageStriktLesen({
      clientRef: 'traveller:1',
      documents: [
        { documentType: 'passport', issuingCountryCode: 'CH' },
        { documentType: 'national_id', issuingCountryCode: 'DE' },
      ],
    })
    assert.ok(eindeutigGeneriert)
    assert.equal(eindeutigGeneriert.documents.length, 2)
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        documents: [
          { documentType: 'passport', issuingCountryCode: 'CH' },
          { documentType: 'passport', issuingCountryCode: 'CH' },
        ],
      }),
      null,
    )
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        documents: [
          { clientRef: 12, documentType: 'passport', issuingCountryCode: 'CH' },
        ],
      }),
      null,
    )
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        documents: [
          { clientRef: '   ', documentType: 'passport', issuingCountryCode: 'CH' },
        ],
      }),
      null,
    )
  })

  test('Wohnsitz oder Ausstellerland werden nicht zur Staatsbürgerschaft', () => {
    const nurWohnsitz = travellerAnfrageStriktLesen({
      clientRef: 'traveller:1',
      residenceCountryCode: 'CH',
      documents: [
        {
          clientRef: 'document:passport:US',
          documentType: 'passport',
          issuingCountryCode: 'US',
          expiresOn: '2030-01-01',
        },
      ],
    })
    assert.ok(nurWohnsitz)
    assert.equal(nurWohnsitz.residenceCountryCode, 'CH')
    assert.equal(nurWohnsitz.citizenships.length, 0)
    assert.equal(nurWohnsitz.documents[0]?.citizenshipClientRef, null)
    assert.equal(documentCitizenshipCode(nurWohnsitz, nurWohnsitz.documents[0]!), null)

    const ausstellerOhneLink = travellerAnfrageStriktLesen({
      clientRef: 'traveller:1',
      citizenships: [{ clientRef: 'citizenship:CH', countryCode: 'CH' }],
      documents: [
        {
          clientRef: 'document:passport:US',
          documentType: 'passport',
          issuingCountryCode: 'US',
          expiresOn: '2030-01-01',
        },
      ],
    })
    assert.ok(ausstellerOhneLink)
    assert.deepEqual(
      ausstellerOhneLink.citizenships.map((eintrag) => eintrag.countryCode),
      ['CH'],
    )
    assert.equal(ausstellerOhneLink.documents[0]?.issuingCountryCode, 'US')
    assert.equal(ausstellerOhneLink.documents[0]?.citizenshipClientRef, null)
    assert.equal(documentCitizenshipCode(ausstellerOhneLink, ausstellerOhneLink.documents[0]!), null)
  })

  test('erzeugt keine Default-, Primary- oder Preferred-Staatsbürgerschaft oder -Dokumente', () => {
    const gelesen = travellerAnfrageStriktLesen(gemischterTraveller([PASSPORT_CH, NATIONAL_ID_DE]))
    assert.ok(gelesen)
    const optionen = credentialOptionsAus(gelesen)
    assert.equal(optionen.length, 2)
    assert.deepEqual(
      optionen.map((option) => option.document?.clientRef).sort(),
      ['document:national_id:DE', 'document:passport:CH'],
    )
    assert.equal(
      optionen.every((option) => option.document != null),
      true,
    )
    for (const objekt of [...gelesen.citizenships, ...gelesen.documents, gelesen]) {
      assert.equal('primary' in objekt, false)
      assert.equal('preferred' in objekt, false)
      assert.equal('isDefault' in objekt, false)
      assert.equal('default' in objekt, false)
    }
  })

  test('Passnummer oder MRZ an der API-Grenze wird nicht still ignoriert', () => {
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        nationalityCountryCode: 'CH',
        passportNumber: 'X1234567',
      }),
      null,
    )
    assert.equal(
      travellerAnfrageStriktLesen({
        clientRef: 'traveller:1',
        documents: [
          {
            clientRef: 'document:passport:CH',
            documentType: 'passport',
            issuingCountryCode: 'CH',
            mrz: 'P<CHETEST',
          },
        ],
      }),
      null,
    )
  })
})
