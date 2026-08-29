import { describe, test } from 'node:test'
import assert from 'node:assert/strict'

import { TRAVELLER_CONTEXT_GRENZEN } from '@/lib/readiness/domain'
import {
  REGISTRY_BEZEICHNUNG_UNGUELTIG,
  REGISTRY_EINGABE_UNGUELTIG,
  REGISTRY_LAND_UNGUELTIG,
  REGISTRY_TYP_UNGUELTIG,
  REGISTRY_ZUORDNUNG_UNGUELTIG,
  registryCitizenshipAnlageLesen,
  registryCitizenshipDoppelt,
  registryCitizenshipGegenBestandPruefen,
  registryDocumentAnlageLesen,
  registryDocumentGegenBestandPruefen,
  registryDokumentFormularAnfang,
  registryKindLimitErreicht,
  registryTravellerAnlageLesen,
  registryTravellerAenderungLesen,
  registryTravellerFormularAnfang,
  registryTravellerLoeschungLesen,
} from '@/lib/traveller/account-registry-eingabe'

const TRAVELLER_ID = '2f1c6d8a-4b21-4a7e-9c11-0d3e8a7b6c55'
const CITIZENSHIP_ID = '7a9e2c14-8d33-41b0-a6f2-1c5d9e0b4a10'

describe('Account-Registry Schreibnutzlast', () => {
  test('legt Traveller ohne Default-Citizenship oder Default-Dokument an', () => {
    const anfang = registryTravellerFormularAnfang()
    assert.deepEqual(anfang, { label: '', residenceCountryCode: '' })
    const gelesen = registryTravellerAnlageLesen(anfang)
    assert.equal(gelesen.ok, true)
    if (gelesen.ok) {
      assert.equal(gelesen.wert.label, null)
      assert.equal(gelesen.wert.residenceCountryCode, null)
    }
  })

  test('ändert nur Label und Wohnsitz', () => {
    const gelesen = registryTravellerAenderungLesen({
      id: TRAVELLER_ID,
      label: 'Sasa',
      residenceCountryCode: 'ch',
    })
    assert.deepEqual(gelesen, {
      ok: true,
      wert: { id: TRAVELLER_ID, label: 'Sasa', residenceCountryCode: 'CH' },
    })
  })

  test('lehnt sensitive Label und verbotene Felder ab', () => {
    assert.equal(registryTravellerAnlageLesen({ label: 'Passport 123456' }).ok, false)
    assert.equal(registryTravellerAnlageLesen({ label: 'Sasa', passportNumber: 'X' }).ok, false)
    assert.equal(registryTravellerAnlageLesen({ label: 'Sasa', dateOfBirth: '1990-01-01' }).ok, false)
    const abgelehnt = registryTravellerAnlageLesen({ label: 'passport test' })
    assert.equal(abgelehnt.ok, false)
    if (!abgelehnt.ok) assert.equal(abgelehnt.meldung, REGISTRY_BEZEICHNUNG_UNGUELTIG)
  })

  test('verhindert doppelte Staatsbürgerschaft und respektiert das 8er-Limit', () => {
    assert.equal(registryCitizenshipDoppelt('CH', ['CH', 'RS']), true)
    assert.equal(registryCitizenshipDoppelt('DE', ['CH', 'RS']), false)
    assert.equal(registryKindLimitErreicht('citizenship', 7), false)
    assert.equal(registryKindLimitErreicht('citizenship', 8), true)
    assert.equal(
      registryCitizenshipGegenBestandPruefen('CH', ['CH']).ok,
      false,
    )
    assert.equal(
      registryCitizenshipGegenBestandPruefen(
        'DE',
        Array.from({ length: TRAVELLER_CONTEXT_GRENZEN.citizenshipsJeTraveller }, (_, i) => `A${i}`),
      ).ok,
      false,
    )
    const land = registryCitizenshipAnlageLesen({
      travellerId: TRAVELLER_ID,
      countryCode: 'rs',
    })
    assert.deepEqual(land, { ok: true, wert: { travellerId: TRAVELLER_ID, countryCode: 'RS' } })
  })

  test('hält Issuer und Citizenship unabhängig und lässt die Zuordnung leer', () => {
    const anfang = registryDokumentFormularAnfang()
    assert.equal(anfang.documentType, '')
    assert.equal(anfang.issuingCountryCode, '')
    assert.equal(anfang.citizenshipId, '')
    assert.equal(anfang.expiresOn, '')

    const ohneZuordnung = registryDocumentAnlageLesen({
      travellerId: TRAVELLER_ID,
      documentType: 'passport',
      issuingCountryCode: 'DE',
      citizenshipId: '',
      expiresOn: '',
    })
    assert.equal(ohneZuordnung.ok, true)
    if (ohneZuordnung.ok) {
      assert.equal(ohneZuordnung.wert.issuingCountryCode, 'DE')
      assert.equal(ohneZuordnung.wert.citizenshipId, null)
    }

    const mitZuordnung = registryDocumentAnlageLesen({
      travellerId: TRAVELLER_ID,
      documentType: 'national_id',
      issuingCountryCode: 'DE',
      citizenshipId: CITIZENSHIP_ID,
      expiresOn: '2028-01-01',
    })
    assert.equal(mitZuordnung.ok, true)
    if (mitZuordnung.ok) {
      assert.equal(mitZuordnung.wert.citizenshipId, CITIZENSHIP_ID)
      assert.equal(mitZuordnung.wert.issuingCountryCode, 'DE')
    }
  })

  test('lehnt Default-Pass-Typ, fremde Zuordnung und 13. Dokument ab', () => {
    assert.equal(registryDocumentAnlageLesen({ travellerId: TRAVELLER_ID, documentType: '' }).ok, false)
    const typ = registryDocumentAnlageLesen({
      travellerId: TRAVELLER_ID,
      documentType: 'visa',
    })
    assert.equal(typ.ok, false)
    if (!typ.ok) assert.equal(typ.meldung, REGISTRY_TYP_UNGUELTIG)

    const fremd = registryDocumentGegenBestandPruefen('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', [CITIZENSHIP_ID], 1)
    assert.equal(fremd.ok, false)
    if (!fremd.ok) assert.equal(fremd.meldung, REGISTRY_ZUORDNUNG_UNGUELTIG)

    assert.equal(registryKindLimitErreicht('document', 12), true)
    assert.equal(registryDocumentGegenBestandPruefen(null, [], 12, 'anlegen').ok, false)
    assert.equal(registryDocumentGegenBestandPruefen(null, [], 12, 'aendern').ok, true)
  })

  test('löscht nur mit gültiger Registry-ID', () => {
    assert.deepEqual(registryTravellerLoeschungLesen({ id: TRAVELLER_ID }), {
      ok: true,
      wert: { id: TRAVELLER_ID },
    })
    const ungueltig = registryTravellerLoeschungLesen({ id: 'traveller-1' })
    assert.equal(ungueltig.ok, false)
    if (!ungueltig.ok) assert.equal(ungueltig.meldung, REGISTRY_EINGABE_UNGUELTIG)
  })

  test('lehnt ungültige Länderkürzel ab', () => {
    const land = registryTravellerAnlageLesen({ residenceCountryCode: 'CHE' })
    assert.equal(land.ok, false)
    if (!land.ok) assert.equal(land.meldung, REGISTRY_LAND_UNGUELTIG)
  })
})
