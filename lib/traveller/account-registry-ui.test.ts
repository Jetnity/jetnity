import { describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { REGISTRY_COPY } from '@/lib/traveller/account-registry-copy'
import {
  registryDokumentCitizenshipId,
  registryTravellerAnzeigeName,
} from '@/lib/traveller/account-registry-anzeige'
import { registryDokumentFormularAnfang } from '@/lib/traveller/account-registry-eingabe'

const hier = dirname(fileURLToPath(import.meta.url))
const wurzel = join(hier, '../..')

function quelle(relativ: string): string {
  return readFileSync(join(wurzel, relativ), 'utf8')
}

function dateienUnter(relativ: string): string[] {
  const start = join(wurzel, relativ)
  return readdirSync(start, { withFileTypes: true }).flatMap((eintrag) => {
    const pfad = `${relativ}/${eintrag.name}`
    return eintrag.isDirectory() ? dateienUnter(pfad) : [pfad]
  })
}

const UI_QUELLEN = [
  'app/account/travellers/page.tsx',
  'app/account/travellers/loading.tsx',
  'components/account/AccountReisende.tsx',
  'components/account/AccountReisendeKarte.tsx',
]

const RUNTIME_QUELLEN = [
  ...UI_QUELLEN,
  'lib/traveller/account-registry-aktionen.ts',
  'lib/traveller/account-registry-daten.ts',
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

const VERBOTENE_BEZUEGE = [
  'accountRegistryTravellerProjektieren',
  'accountRegistryTravellerAlsTripSnapshot',
  'party_schreiben',
  'party_loeschen',
  'createServiceRoleClient',
  'SERVICE_ROLE',
  'trip_travellers',
  'primaryCitizenship',
  'defaultPassport',
  'chosenCredential',
]

describe('Account-Registry UI-/Scope-Vertrag', () => {
  test('trennt Loading, Empty und Error wahrheitsgetreu', () => {
    const laden = quelle('app/account/travellers/loading.tsx')
    const liste = quelle('components/account/AccountReisende.tsx')

    assert.equal(laden.includes('REGISTRY_COPY.ladenTitel'), true)
    assert.equal(laden.includes('REGISTRY_COPY.leerTitel'), false)
    assert.equal(laden.includes('REGISTRY_COPY.fehlerTitel'), false)

    assert.equal(liste.includes('REGISTRY_COPY.leerTitel'), true)
    assert.equal(liste.includes('REGISTRY_COPY.fehlerTitel'), true)
    assert.equal(liste.includes('REGISTRY_COPY.fehler503'), true)
    assert.notEqual(REGISTRY_COPY.leerTitel, REGISTRY_COPY.fehlerTitel)
    assert.notEqual(REGISTRY_COPY.ladenTitel, REGISTRY_COPY.leerTitel)
    assert.notEqual(REGISTRY_COPY.ladenText, REGISTRY_COPY.leerText)
  })

  test('löscht nur den Registry-Eintrag und behauptet keine Reise-Löschung', () => {
    const karte = quelle('components/account/AccountReisendeKarte.tsx')
    const texte = REGISTRY_COPY.loeschenText
    assert.equal(karte.includes('REGISTRY_COPY.loeschenText'), true)
    assert.match(texte, /nicht umgeschrieben oder gelöscht/)
    assert.equal(/Reise wird gelöscht|Trip Snapshot wird gelöscht/.test(texte), false)
    assert.equal(REGISTRY_COPY.erfolgGeloescht.includes('Vorhandene Reisen bleiben unverändert'), true)
  })

  test('wählt weder ersten Pass noch erste Staatsbürgerschaft voraus', () => {
    const anfang = registryDokumentFormularAnfang()
    assert.equal(anfang.documentType, '')
    assert.equal(anfang.citizenshipId, '')
    assert.equal(
      registryDokumentCitizenshipId(null, [
        { id: '7a9e2c14-8d33-41b0-a6f2-1c5d9e0b4a10', clientRef: '8b0f3d25-9e44-42c1-b703-2d6e0f1c5b21' },
      ]),
      '',
    )
    assert.equal(registryTravellerAnzeigeName(null), REGISTRY_COPY.ohneBezeichnung)

    const karte = quelle('components/account/AccountReisendeKarte.tsx')
    assert.equal(karte.includes('citizenships[0]'), false)
    assert.equal(karte.includes('documents[0]'), false)
    assert.equal(karte.includes('REGISTRY_COPY.dokumentTypPlatzhalter'), true)
    assert.equal(karte.includes('REGISTRY_COPY.dokumentKeineZuordnung'), true)
    assert.equal(karte.includes('dokumentAblaufGegenReferenztag'), true)
    assert.equal(karte.includes('gültig bis'), false)
    assert.equal(karte.includes('ISO-2'), false)
    assert.equal(karte.includes('LandFeld'), true)
    assert.equal(karte.includes('landAnzeigeText'), true)
  })

  test('führt keine sensitiven Felder und keine Trip-/Service-Role-Pfade ein', () => {
    const oberflaeche = UI_QUELLEN.map((pfad) => quelle(pfad)).join('\n')
    const runtime = RUNTIME_QUELLEN.map((pfad) => quelle(pfad)).join('\n')
    for (const feld of SENSIBLE_FELDER) {
      assert.equal(oberflaeche.includes(feld), false, `unerlaubtes Feld ${feld}`)
    }
    for (const bezug of VERBOTENE_BEZUEGE) {
      assert.equal(runtime.includes(bezug), false, `unerlaubter Bezug ${bezug}`)
    }
    assert.equal(runtime.includes("from('account_travellers')"), true)
  })

  test('bleibt unter dem bestehenden Account-Auth-Rand und ändert kein Schema', () => {
    const proxy = quelle('proxy.ts')
    assert.equal(proxy.includes("pathname.startsWith('/account')"), true)
    assert.equal(proxy.includes("redirectToLogin(req, '/login')"), true)

    const migrationen = dateienUnter('supabase/migrations')
    assert.equal(
      migrationen.some((pfad) => /20260829.*account_traveller_registry(?!_persistence)/.test(pfad)),
      false,
    )
    assert.equal(
      migrationen.filter((pfad) => pfad.includes('account_traveller_registry')).length,
      1,
    )
  })
})
