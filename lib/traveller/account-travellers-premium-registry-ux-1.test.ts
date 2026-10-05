import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { landAnzeigeText } from '@/lib/country/darstellung'
import { REGISTRY_COPY } from '@/lib/traveller/account-registry-copy'
import type { AccountRegistryTraveller } from '@/lib/traveller/account-registry'
import { DOKUMENT_LEBENSZYKLUS_COPY } from '@/lib/traveller/dokument-lebenszyklus-copy'
import {
  registryAnzahlText,
  registryFlaecheAnlegen,
  registryFlaecheVerwalten,
  registryKompaktkarte,
  registryVerwalteteId,
} from '@/lib/traveller/account-travellers-premium-registry-ux-1'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

function quelle(relativ: string): string {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

const ZEIT = '2026-01-15T10:00:00.000Z'

function person(): AccountRegistryTraveller {
  return {
    authority: 'account_registry',
    id: '11111111-1111-4111-8111-111111111111',
    clientRef: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    createdAt: ZEIT,
    updatedAt: ZEIT,
    facts: {
      label: 'Alex',
      residenceCountryCode: 'CH',
      citizenships: [
        {
          id: '22222222-2222-4222-8222-222222222221',
          clientRef: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
          countryCode: 'DE',
          createdAt: ZEIT,
          updatedAt: ZEIT,
        },
        {
          id: '22222222-2222-4222-8222-222222222222',
          clientRef: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
          countryCode: 'CH',
          createdAt: ZEIT,
          updatedAt: ZEIT,
        },
      ],
      documents: [
        {
          id: '33333333-3333-4333-8333-333333333331',
          clientRef: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
          documentType: 'passport',
          issuingCountryCode: 'DE',
          citizenshipClientRef: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
          expiresOn: '2020-01-15',
          createdAt: ZEIT,
          updatedAt: ZEIT,
        },
        {
          id: '33333333-3333-4333-8333-333333333332',
          clientRef: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2',
          documentType: 'national_id',
          issuingCountryCode: 'GB',
          citizenshipClientRef: null,
          expiresOn: '2030-06-01',
          createdAt: ZEIT,
          updatedAt: ZEIT,
        },
      ],
    },
  }
}

describe('Account Reisende Premium Registry UX 1', () => {
  test('fasst gespeicherte Angaben kompakt zusammen, ohne eine Wahl zu treffen', () => {
    const karte = registryKompaktkarte(person(), '2026-10-01')
    assert.equal(karte.name, 'Alex')
    assert.equal(karte.wohnsitz.includes(landAnzeigeText('CH')), true)
    assert.deepEqual(
      karte.staatsbuergerschaften.map((eintrag) => eintrag.label),
      [landAnzeigeText('DE'), landAnzeigeText('CH')],
    )
    assert.deepEqual(
      karte.dokumente.map((eintrag) => eintrag.typLabel),
      ['Reisepass', 'Personalausweis'],
    )
    assert.equal(karte.ablaufWarnungen, 1)
    assert.equal(karte.dokumente[0]?.ablaufWarnung, true)
    assert.equal(karte.dokumente[0]?.ablaufText, DOKUMENT_LEBENSZYKLUS_COPY.kontoAbgelaufen)
    assert.equal(karte.dokumente[1]?.ablaufWarnung, false)
    assert.equal(karte.dokumente[1]?.ablaufText, DOKUMENT_LEBENSZYKLUS_COPY.kontoNichtAbgelaufen)
    assert.equal('primary' in karte, false)
    assert.equal(Object.hasOwn(karte, 'readiness'), false)
  })

  test('warnt nicht, solange der Geräte-Kalendertag fehlt', () => {
    const karte = registryKompaktkarte(person(), null)
    assert.equal(karte.ablaufWarnungen, 0)
    assert.equal(karte.dokumente.every((eintrag) => eintrag.ablaufSichtbar === false), true)
  })

  test('hält höchstens eine schwere Verwaltung offen', () => {
    const zu = { art: 'uebersicht' } as const
    const anlegen = registryFlaecheAnlegen(zu)
    assert.equal(anlegen.art, 'anlegen')
    assert.equal(registryFlaecheAnlegen(anlegen).art, 'uebersicht')

    const erste = registryFlaecheVerwalten(anlegen, 'a')
    const zweite = registryFlaecheVerwalten(erste, 'b')
    const geschlossen = registryFlaecheVerwalten(zweite, 'b')
    assert.equal(registryVerwalteteId(erste), 'a')
    assert.equal(registryVerwalteteId(zweite), 'b')
    assert.equal(registryVerwalteteId(geschlossen), null)
    assert.equal(registryAnzahlText(0, 'keine', 'eine', 'mehrere'), 'keine')
    assert.equal(registryAnzahlText(2, 'keine', 'Hinweis', 'Hinweise'), '2 Hinweise')
  })

  test('zeigt auf dem ersten Bild Zusammenfassungen und die Hinzufügen-Aktion vor den Karten', () => {
    const liste = quelle('components/account/AccountReisende.tsx')
    const karte = quelle('components/account/AccountReisendeKarte.tsx')
    const aktion = liste.indexOf('REGISTRY_COPY.reisendenHinzufuegen')
    const raster = liste.indexOf('travellers.map')
    const verwaltung = karte.indexOf('data-registry-verwaltung="offen"')

    assert.equal(REGISTRY_COPY.reisendenHinzufuegen, 'Reisenden hinzufügen')
    assert.ok(aktion > 0 && raster > aktion)
    assert.equal(liste.includes("art === 'anlegen'"), true)
    assert.ok(verwaltung > karte.indexOf('registryKompaktkarte('))
    assert.ok(karte.indexOf('registryCitizenshipAnlegen(') > verwaltung)
    assert.ok(karte.indexOf('registryDocumentAnlegen(') > verwaltung)
    assert.ok(karte.indexOf('registryDocumentAendern(') > verwaltung)
    assert.ok(karte.indexOf('documentId: dokumentModus') > verwaltung)
    assert.equal(karte.includes('REGISTRY_COPY.loeschenText'), true)
    assert.equal(karte.includes('REGISTRY_COPY.staatsbuergerschaftenHinweis'), true)
    assert.equal(karte.includes('REGISTRY_COPY.dokumentKeineZuordnung'), true)
    assert.equal(karte.includes('citizenships[0]'), false)
    assert.equal(karte.includes('documents[0]'), false)
    assert.equal(liste.includes('accountRegistryTravellerProjektieren'), false)
    assert.equal(karte.includes('createServiceRoleClient'), false)
  })
})