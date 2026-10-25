import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { registerMounted } from '@/lib/traveller/account-registry-workflow-mounted'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

function quelle(relativ: string): string {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

const AKTIONEN = [
  'registryTravellerAnlegen',
  'registryTravellerAendern',
  'registryTravellerLoeschen',
  'registryCitizenshipAnlegen',
  'registryCitizenshipLoeschen',
  'registryDocumentAnlegen',
  'registryDocumentAendern',
  'registryDocumentLoeschen',
]

const SENSIBLE_FELDER = [
  'passportNumber',
  'passport_number',
  'documentNumber',
  'document_number',
  'dateOfBirth',
  'date_of_birth',
  'name="mrz"',
  'name="biometric"',
  'type="file"',
]

describe('Account-Registry Workflow UI-Vertrag', () => {
  test('die Oberfläche ruft die acht Aktionen nur über den Hook auf', () => {
    const liste = quelle('components/account/AccountReisende.tsx')
    const karte = quelle('components/account/AccountReisendeKarte.tsx')
    const haken = quelle('components/account/useAccountRegistryWorkflow.ts')

    assert.equal(liste.includes('useAccountRegistryWorkflow'), true)
    assert.equal(karte.includes('useAccountRegistryWorkflow'), true)
    for (const name of AKTIONEN) {
      assert.equal(liste.includes(name), false, name)
      assert.equal(karte.includes(name), false, name)
      assert.equal(haken.includes(`${name}(`), true, name)
    }
    assert.equal(liste.includes('setFormular(registryTravellerFormularAnfang())'), false)
    assert.equal(karte.includes('setFormular(registryTravellerFormularAnfang())'), false)
    assert.equal(liste.includes('setDokument(registryDokumentFormularAnfang())'), false)
    assert.equal(karte.includes('setDokument(registryDokumentFormularAnfang())'), false)
    assert.equal(haken.includes('documentId:'), true)
  })

  test('der Hook führt keine sensitiven Felder ein', () => {
    const haken = quelle('components/account/useAccountRegistryWorkflow.ts')
    for (const feld of SENSIBLE_FELDER) {
      assert.equal(haken.includes(feld), false, feld)
    }
  })
})

if (process.env.ACCOUNT_TRAVELLER_MANAGEMENT_BROWSER === '1') registerMounted()
